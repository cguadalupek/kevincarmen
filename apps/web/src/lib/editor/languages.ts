export interface CodeLanguage {
  id: string;
  label: string;
}

export const CODE_LANGUAGES: CodeLanguage[] = [
  { id: 'plaintext', label: 'Texto plano' },
  { id: 'powershell', label: 'PowerShell' },
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
  return CODE_LANGUAGES.find((l) => l.id === id)?.label ?? id;
}
