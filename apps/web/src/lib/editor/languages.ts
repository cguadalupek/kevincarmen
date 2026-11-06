export interface CodeLanguage {
  id: string;
  label: string;
}

/**
 * Alias aceptados en la valla Markdown → id canónico de highlight.js.
 *
 * El autor escribe el idioma en el fence (```` ```cmd ````) y ese texto no
 * siempre coincide con el nombre con el que highlight.js registra la gramática.
 * Se normaliza aquí, en un único punto, para que el mismo alias funcione en el
 * render público (`lib/editor/highlight.ts`) y en la etiqueta del bloque.
 *
 * Los scripts de consola de Windows comparten UNA sola gramática en
 * highlight.js (`dos`, «Batch file (DOS)»), que ya trae `bat` y `cmd` como
 * alias propios. `batch` —y las variantes `dosbatch`/`batfile`— NO existen en
 * highlight.js 11 y hay que resolverlas a mano; sin este mapa caían en
 * `plaintext` y el bloque se mostraba sin resaltado.
 */
export const LANGUAGE_ALIASES: Record<string, string> = {
  dos: 'dos',
  cmd: 'dos',
  bat: 'dos',
  batch: 'dos',
  dosbatch: 'dos',
  batfile: 'dos',
};

/** id canónico (minúsculas, sin alias) de un lenguaje escrito a mano. */
export function resolveLanguageId(id: string): string {
  const normalized = id.trim().toLowerCase();
  return LANGUAGE_ALIASES[normalized] ?? normalized;
}

export const CODE_LANGUAGES: CodeLanguage[] = [
  { id: 'plaintext', label: 'Texto plano' },
  { id: 'powershell', label: 'PowerShell' },
  { id: 'dos', label: 'CMD / Batch (Windows)' },
  { id: 'bash', label: 'Bash' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'csharp', label: 'C#' },
  { id: 'cpp', label: 'C++' },
  { id: 'c', label: 'C' },
  { id: 'go', label: 'Go' },
  { id: 'rust', label: 'Rust' },
  { id: 'php', label: 'PHP' },
  { id: 'ruby', label: 'Ruby' },
  { id: 'sql', label: 'SQL' },
  { id: 'json', label: 'JSON' },
  { id: 'yaml', label: 'YAML' },
  { id: 'xml', label: 'XML' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'scss', label: 'SCSS' },
  { id: 'markdown', label: 'Markdown' },
  { id: 'dockerfile', label: 'Dockerfile' },
  { id: 'nginx', label: 'Nginx' },
  { id: 'ini', label: 'INI' },
  { id: 'lua', label: 'Lua' },
  { id: 'kotlin', label: 'Kotlin' },
  { id: 'swift', label: 'Swift' },
  { id: 'dart', label: 'Dart' },
  { id: 'r', label: 'R' },
  { id: 'matlab', label: 'MATLAB' },
  { id: 'mermaid', label: 'Mermaid' },
];

export function getLanguageLabel(id: string): string {
  const canonical = resolveLanguageId(id);
  return CODE_LANGUAGES.find((l) => l.id === canonical)?.label ?? id;
}
