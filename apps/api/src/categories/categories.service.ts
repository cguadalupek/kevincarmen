import { Injectable } from '@nestjs/common';
import { MainCategory, Subcategory, type Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MAIN_CATEGORY_META, MAIN_CATEGORY_ORDER } from './taxonomy';

export interface SubcategoryView {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  position: number;
}

export interface MainCategoryView {
  value: MainCategory;
  label: string;
  description: string;
  position: number;
  subcategories: SubcategoryView[];
}

const SUB_ORDER: Prisma.SubcategoryOrderByWithRelationInput[] = [
  { position: 'asc' },
  { name: 'asc' },
];

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Árbol completo: las 4 principales (siempre, aunque no tengan subcategorías)
   * con sus subcategorías anidadas. Los principales se emiten desde el enum, no
   * desde la BD, así el frontend nunca se queda sin pills por falta de datos.
   */
  async findTree(): Promise<MainCategoryView[]> {
    const subcategories = await this.prisma.subcategory.findMany({
      orderBy: SUB_ORDER,
    });

    return MAIN_CATEGORY_ORDER.map((meta) => ({
      value: meta.value,
      label: meta.label,
      description: meta.description,
      position: meta.position,
      subcategories: subcategories
        .filter((subcategory) => subcategory.mainCategory === meta.value)
        .map((subcategory) => this.toView(subcategory)),
    }));
  }

  /** Lista plana de subcategorías, opcionalmente acotada a una principal. */
  async findAll(mainCategory?: MainCategory): Promise<SubcategoryView[]> {
    const subcategories = await this.prisma.subcategory.findMany({
      where: mainCategory ? { mainCategory } : undefined,
      orderBy: SUB_ORDER,
    });

    return subcategories.map((subcategory) => this.toView(subcategory));
  }

  /**
   * Comprueba que la subcategoría exista y pertenezca a la categoría principal.
   * Devuelve la subcategoría o `null`.
   *
   * La FK compuesta de `posts` ya impide guardar el par inválido, pero sin esta
   * comprobación el error que llegaría al CMS sería un P2003 de Prisma; aquí
   * devolvemos un 400 con un mensaje que se puede leer.
   */
  async findMatching(
    subCategoryId: string,
    mainCategory: MainCategory,
  ): Promise<SubcategoryView | null> {
    const subcategory = await this.prisma.subcategory.findFirst({
      where: { id: subCategoryId, mainCategory },
    });

    return subcategory ? this.toView(subcategory) : null;
  }

  /** Árbol reducido a lo que necesita un `<select>` en cascada. */
  async findSelectOptions() {
    const tree = await this.findTree();
    return tree.map(({ value, label, subcategories }) => ({
      value,
      label,
      subcategories: subcategories.map(({ id, slug, name }) => ({ id, slug, name })),
    }));
  }

  private toView(subcategory: Subcategory): SubcategoryView {
    return {
      id: subcategory.id,
      slug: subcategory.slug,
      name: subcategory.name,
      description: subcategory.description,
      position: subcategory.position,
    };
  }
}

export { MAIN_CATEGORY_META };
