import hljs from 'highlight.js/lib/core';
import type { LanguageFn } from 'highlight.js';
import bash from 'highlight.js/lib/languages/bash';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import csharp from 'highlight.js/lib/languages/csharp';
import css from 'highlight.js/lib/languages/css';
import dart from 'highlight.js/lib/languages/dart';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import go from 'highlight.js/lib/languages/go';
import html from 'highlight.js/lib/languages/xml';
import ini from 'highlight.js/lib/languages/ini';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import kotlin from 'highlight.js/lib/languages/kotlin';
import lua from 'highlight.js/lib/languages/lua';
import markdown from 'highlight.js/lib/languages/markdown';
import nginx from 'highlight.js/lib/languages/nginx';
import php from 'highlight.js/lib/languages/php';
import powershell from 'highlight.js/lib/languages/powershell';
import python from 'highlight.js/lib/languages/python';
import r from 'highlight.js/lib/languages/r';
import ruby from 'highlight.js/lib/languages/ruby';
import rust from 'highlight.js/lib/languages/rust';
import scss from 'highlight.js/lib/languages/scss';
import sql from 'highlight.js/lib/languages/sql';
import swift from 'highlight.js/lib/languages/swift';
import typescript from 'highlight.js/lib/languages/typescript';
import yaml from 'highlight.js/lib/languages/yaml';

const registry: Array<[string, LanguageFn]> = [
  ['bash', bash],
  ['c', c],
  ['cpp', cpp],
  ['csharp', csharp],
  ['css', css],
  ['dart', dart],
  ['dockerfile', dockerfile],
  ['go', go],
  ['html', html],
  ['xml', html],
  ['ini', ini],
  ['java', java],
  ['javascript', javascript],
  ['json', json],
  ['kotlin', kotlin],
  ['lua', lua],
  ['markdown', markdown],
  ['nginx', nginx],
  ['php', php],
  ['powershell', powershell],
  ['python', python],
  ['r', r],
  ['ruby', ruby],
  ['rust', rust],
  ['scss', scss],
  ['sql', sql],
  ['swift', swift],
  ['typescript', typescript],
  ['yaml', yaml],
];

let registered = false;


export function registerHighlightLanguages() {
  if (registered) return hljs;
  for (const [name, lang] of registry) {
    if (!hljs.getLanguage(name)) {
      hljs.registerLanguage(name, lang);
    }
  }
  registered = true;
  return hljs;
}

export function highlightCode(code: string, language: string): string {
  const lib = registerHighlightLanguages();
  const lang = lib.getLanguage(language) ? language : 'plaintext';
  try {
    return lib.highlight(code, { language: lang }).value;
  } catch {
    return lib.highlight(code, { language: 'plaintext' }).value;
  }
}
