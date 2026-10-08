import { categoryColor, categoryLabel } from '@/lib/categories';
import type { MainCategoryValue } from '@/lib/categories';

interface CategoryBadgeProps {
  category: MainCategoryValue;
  /** Fuerza a mostrar la subcategoría junto a la principal (útil en el artículo). */
  subcategory?: string | null;
  className?: string;
}

/**
 * Badge de categoría principal, con la subcategoría opcional en formato más tenue.
 * Lo usan tanto el listado público como el encabezado del artículo.
 */
export function CategoryBadge({ category, subcategory, className = '' }: CategoryBadgeProps) {
  return (
    <span className={`inline-flex flex-wrap items-center gap-1 ${className}`}>
      <span
        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${categoryColor(category)}`}
      >
        {categoryLabel(category)}
      </span>
      {subcategory && (
        <span className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
          {subcategory}
        </span>
      )}
    </span>
  );
}
