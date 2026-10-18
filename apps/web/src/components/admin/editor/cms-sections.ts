import type { CodeLanguage } from '@/lib/editor/languages';

/**
 * Configuración por sección del editor del CMS.
 *
 * Módulo hoja (no importa nada del editor) para que `tiptap.config.ts`, el menú
 * slash y el propio `CMSEditor` puedan leerlo sin dependencias circulares.
 */

/** Secciones del CMS que editan un cuerpo de contenido. */
export type CMSSection = 'blog' | 'projects' | 'lab' | 'courses';

/** Etiqueta del campo y texto de ayuda del editor para cada sección. */
export const CMS_SECTIONS: Record<CMSSection, { label: string; placeholder: string }> = {
  blog: {
    label: 'Artículo',
    placeholder: 'Escribe el artículo aquí… Usa / para insertar títulos, listas, tablas o código.',
  },
  projects: {
    label: 'Proyecto',
    placeholder:
      'Describe la arquitectura y detalles del proyecto… Usa / para insertar bloques de código o tablas.',
  },
  lab: {
    label: 'Laboratorio',
    placeholder:
      'Escribe las notas del laboratorio o comandos… Usa / para insertar salidas de terminal.',
  },
  courses: {
    label: 'Curso',
    placeholder: 'Escribe el contenido del módulo o lección… Usa / para insertar bloques.',
  },
};

export const DEFAULT_CMS_SECTION: CMSSection = 'blog';

/** Texto de ayuda efectivo del editor: el de la sección, salvo que se pase uno. */
export function cmsPlaceholder(section: CMSSection, placeholder?: string): string {
  return placeholder ?? CMS_SECTIONS[section].placeholder;
}

/**
 * Idiomas con resaltado dentro del editor.
 *
 * Sólo los esenciales: cada gramática se importa una a una desde
 * `highlight.js/lib/languages/*` (nunca la librería completa, que multiplica el
 * bundle del panel). `plaintext` no es un lenguaje de programación: es el caso
 * «sin resaltado» y el idioma por defecto de los bloques nuevos. El sitio
 * público mantiene su propia lista, más amplia, en `@/lib/editor/highlight`.
 */
export const EDITOR_CODE_LANGUAGES: CodeLanguage[] = [
  { id: 'plaintext', label: 'Texto plano' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'python', label: 'Python' },
  { id: 'json', label: 'JSON' },
  { id: 'bash', label: 'Bash' },
  { id: 'sql', label: 'SQL' },
];

export const DEFAULT_CODE_LANGUAGE = 'plaintext';

/** Id del `<input type="file">` oculto del editor (lo dispara el comando `/`). */
export const CMS_EDITOR_IMAGE_INPUT_ID = 'cms-editor-image-input';
