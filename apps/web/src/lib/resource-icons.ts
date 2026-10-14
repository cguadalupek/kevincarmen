import {
  Archive,
  BookOpen,
  Container,
  Database,
  FileCode,
  FileIcon,
  FileText,
  Image as ImageIcon,
  ListChecks,
  Package,
  Shield,
  Terminal,
  Video,
  type LucideIcon,
} from 'lucide-react';

/**
 * Iconos que puede llevar un tipo de recurso (`resource_types.icon`).
 *
 * Las claves son las que acepta el API (`RESOURCE_ICON_KEYS` en
 * `resource-type.dto.ts`): si añades una aquí, añádela también allí. El sitio
 * público cae a `file` cuando la clave no existe (tipos antiguos o borrados).
 */
export const RESOURCE_ICONS: Record<string, LucideIcon> = {
  file: FileIcon,
  'file-code': FileCode,
  'file-text': FileText,
  container: Container,
  'list-checks': ListChecks,
  'book-open': BookOpen,
  database: Database,
  terminal: Terminal,
  package: Package,
  shield: Shield,
  image: ImageIcon,
  video: Video,
  archive: Archive,
};

/** Opciones del selector de icono del panel, en el orden en que se ofrecen. */
export const RESOURCE_ICON_OPTIONS: { value: string; label: string }[] = [
  { value: 'file-code', label: 'Código' },
  { value: 'file-text', label: 'Documento' },
  { value: 'container', label: 'Contenedor' },
  { value: 'list-checks', label: 'Lista de comprobación' },
  { value: 'book-open', label: 'Guía / libro' },
  { value: 'database', label: 'Base de datos' },
  { value: 'terminal', label: 'Terminal' },
  { value: 'package', label: 'Paquete' },
  { value: 'shield', label: 'Seguridad' },
  { value: 'image', label: 'Imagen' },
  { value: 'video', label: 'Video' },
  { value: 'archive', label: 'Archivo comprimido' },
  { value: 'file', label: 'Genérico' },
];

/** Icono de un tipo de recurso (o el genérico si la clave no se conoce). */
export function resourceIcon(key: string | null | undefined): LucideIcon {
  return (key ? RESOURCE_ICONS[key] : undefined) ?? FileIcon;
}
