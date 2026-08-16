export const siteConfig = {
  name: 'Kevin Carmen',
  title: 'Kevin Carmen — Desarrollador, Profesor & Creador de Contenido',
  description:
    'Plataforma personal de Kevin Carmen. Desarrollo web, infraestructura, homelab, contenido educativo y open source.',
  url: 'https://kevincarmen.xyz',
  author: 'Kevin Carmen',
  email: 'contacto@kevincarmen.xyz',
  tagline: 'Aprendo • Enseño • Creo • Construyo',
  locale: 'es_ES',
  social: {
    youtube: 'https://www.youtube.com/@kevin_carmen',
    linkedin: 'https://www.linkedin.com/in/kevincarmenguadalupe/',
    github: 'https://github.com/cguadalupek',
    tiktok: 'https://www.tiktok.com/@kevin_carmen',
    instagram: 'https://www.instagram.com/kevin.carmen.1/',
  },
  nav: [
    { label: 'Inicio', href: '/' },
    { label: 'Contenido', href: '/contenido' },
    { label: 'Sobre mí', href: '/sobre-mi' },
    { label: 'Contacto', href: '/contacto', cta: true },
  ],
  roles: [
    'Profesor de Computación',
    'Analista TI',
    'Administrador de Servidores',
    'Desarrollador',
    'Creador de Contenido',
    'Entusiasta Open Source',
  ],
} as const;

export const contentNav = [
  { label: 'Blog', href: '/blog' },
  { label: 'Proyectos', href: '/proyectos' },
  { label: 'Cursos', href: '/cursos' },
  { label: 'Recursos', href: '/recursos' },
] as const;

export const techStack = [
  { name: 'Next.js', category: 'Frontend' },
  { name: 'React', category: 'Frontend' },
  { name: 'TypeScript', category: 'Frontend' },
  { name: 'Tailwind CSS', category: 'Frontend' },
  { name: 'NestJS', category: 'Backend' },
  { name: 'PostgreSQL', category: 'Backend' },
  { name: 'Prisma', category: 'Backend' },
  { name: 'Redis', category: 'Backend' },
  { name: 'Docker', category: 'DevOps' },
  { name: 'Linux', category: 'DevOps' },
  { name: 'Proxmox', category: 'Infraestructura' },
  { name: 'Nginx', category: 'DevOps' },
  { name: 'Cloudflare', category: 'DevOps' },
  { name: 'GitHub Actions', category: 'DevOps' },
] as const;
