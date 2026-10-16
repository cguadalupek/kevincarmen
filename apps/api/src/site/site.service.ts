import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSiteDto } from './dto/update-site.dto';

interface SiteDefaultsShape {
  hero: { name: string; tagline: string; roles: string[]; description: string };
  about: { bio: string[]; expertise: string[]; nowTitle: string; nowItems: string[] };
  author: { name: string; bio: string; avatar: string };
}

/**
 * Valores por defecto (equivalente al contenido estático previo en
 * @kevincarmen/config). Se usan como fallback cuando la fila en `settings`
 * no existe todavía — nunca un 500 por una key ausente.
 */
export const SITE_DEFAULTS: SiteDefaultsShape = {
  hero: {
    name: 'Kevin Carmen',
    tagline: 'Aprendo • Enseño • Creo • Construyo',
    roles: [
      'Profesor de Computación',
      'Analista TI',
      'Administrador de Servidores',
      'Desarrollador',
      'Creador de Contenido',
      'Entusiasta Open Source',
    ],
    description:
      'Desarrollo software, administro infraestructura, enseño tecnología y creo contenido. Construyendo soluciones que escalan.',
  },
  about: {
    bio: [
      'Soy profesor de computación, analista TI, administrador de servidores y desarrollador. Me apasiona la tecnología en todas sus formas: desde escribir código hasta montar infraestructura self-hosted en mi homelab.',
      'Creo contenido educativo en YouTube y TikTok, comparto recursos open source y construyo herramientas que resuelven problemas reales. Esta plataforma es mi ecosistema personal: un lugar donde convergen mi blog, portfolio, laboratorio y formación.',
    ],
    expertise: [
      'Next.js',
      'React',
      'TypeScript',
      'Tailwind CSS',
      'NestJS',
      'PostgreSQL',
      'Prisma',
      'Redis',
      'Docker',
      'Linux',
      'Nginx',
      'Cloudflare',
      'GitHub Actions',
      'Proxmox',
    ],
    nowTitle: 'Lo que estoy haciendo ahora',
    nowItems: [
      'Desarrollando KevinCarmen.xyz con CMS, blog, portfolio y homelab.',
      'Creando contenido sobre homelab, Docker y administración de servidores.',
      'Preparando material para un curso de Next.js Full Stack.',
    ],
  },
  author: {
    name: 'Kevin Carmen',
    bio: 'Software Developer & SysAdmin. Apasionado por la infraestructura, Linux, contenedores y homelabs.',
    avatar: '',
  },
};

function parseList(value: string | undefined, fallback: string[]): string[] {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : fallback;
  } catch {
    return fallback;
  }
}

@Injectable()
export class SiteService {
  constructor(private prisma: PrismaService) {}

  private async getMap(): Promise<Record<string, string>> {
    const rows = await this.prisma.setting.findMany();
    const map: Record<string, string> = {};
    for (const row of rows) map[row.key] = row.value;
    return map;
  }

  async getContent() {
    const map = await this.getMap();
    return {
      hero: {
        name: map['hero.name'] || SITE_DEFAULTS.hero.name,
        tagline: map['hero.tagline'] || SITE_DEFAULTS.hero.tagline,
        roles: parseList(map['hero.roles'], SITE_DEFAULTS.hero.roles),
        description: map['hero.description'] || SITE_DEFAULTS.hero.description,
      },
      about: {
        bio: parseList(map['about.bio'], SITE_DEFAULTS.about.bio),
        expertise: parseList(map['about.expertise'], SITE_DEFAULTS.about.expertise),
        nowTitle: map['about.now_title'] || SITE_DEFAULTS.about.nowTitle,
        nowItems: parseList(map['about.now_items'], SITE_DEFAULTS.about.nowItems),
      },
      author: {
        name: map['author.name'] || map['hero.name'] || SITE_DEFAULTS.author.name,
        bio: map['author.bio'] || SITE_DEFAULTS.author.bio,
        avatar: map['author.avatar'] || SITE_DEFAULTS.author.avatar,
        links: {
          github: map['social.github'] || '',
          linkedin: map['social.linkedin'] || '',
          twitter: map['social.twitter'] || '',
        },
      },
    };
  }

  async update(dto: UpdateSiteDto) {
    const entries: { key: string; value: string }[] = [];

    if (dto.hero) {
      if (dto.hero.name !== undefined) entries.push({ key: 'hero.name', value: dto.hero.name });
      if (dto.hero.tagline !== undefined)
        entries.push({ key: 'hero.tagline', value: dto.hero.tagline });
      if (dto.hero.description !== undefined)
        entries.push({ key: 'hero.description', value: dto.hero.description });
      if (dto.hero.roles !== undefined)
        entries.push({ key: 'hero.roles', value: JSON.stringify(dto.hero.roles) });
    }

    if (dto.about) {
      if (dto.about.bio !== undefined)
        entries.push({ key: 'about.bio', value: JSON.stringify(dto.about.bio) });
      if (dto.about.expertise !== undefined)
        entries.push({ key: 'about.expertise', value: JSON.stringify(dto.about.expertise) });
      if (dto.about.nowTitle !== undefined)
        entries.push({ key: 'about.now_title', value: dto.about.nowTitle });
      if (dto.about.nowItems !== undefined)
        entries.push({ key: 'about.now_items', value: JSON.stringify(dto.about.nowItems) });
    }

    if (entries.length) {
      await this.prisma.$transaction(
        entries.map(({ key, value }) =>
          this.prisma.setting.upsert({
            where: { key },
            update: { value },
            create: { key, value },
          }),
        ),
      );
    }

    return this.getContent();
  }
}