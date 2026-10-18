'use client';

import { Extension } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion';
import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
  type VirtualElement,
} from '@floating-ui/dom';
import {
  SlashMenu,
  filterSlashCommands,
  slashCommandItems,
  type SlashCommandItem,
  type SlashMenuHandle,
} from './slash-menu';

export interface SlashCommandOptions {
  suggestion: Partial<SuggestionOptions>;
}

/**
 * Menú de comandos `/` del editor.
 *
 * El listado vive en `SlashMenu` (independiente y reutilizable) y el
 * posicionamiento flotante lo resuelve floating-ui (`computePosition` con
 * `strategy: 'fixed'` + `autoUpdate`), así que el menú sigue al cursor cuando se
 * desplaza el contenedor del editor y se da la vuelta al llegar al borde.
 */
export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({
          editor,
          range,
          props,
        }: {
          editor: import('@tiptap/core').Editor;
          range: { from: number; to: number };
          props: SlashCommandItem;
        }) => {
          props.command?.({ editor, range });
        },
      } satisfies Partial<SuggestionOptions>,
    };
  },

  addProseMirrorPlugins() {
    const editor = this.editor;

    return [
      Suggestion({
        editor,
        ...this.options.suggestion,
        items: ({ query }: { query: string }) => filterSlashCommands(slashCommandItems, query),
        render: () => {
          let component: ReactRenderer<SlashMenuHandle> | null = null;
          let element: HTMLElement | null = null;
          let stopAutoUpdate: (() => void) | null = null;
          // Última caja del cursor conocida: la referencia virtual que sigue floating-ui.
          let caretRect: DOMRect | null = null;

          const reference: VirtualElement = {
            getBoundingClientRect: () => caretRect ?? new DOMRect(),
            contextElement: editor.view.dom,
          };

          function place() {
            if (!element) return;
            void computePosition(reference, element, {
              strategy: 'fixed',
              placement: 'bottom-start',
              middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
            }).then(({ x, y }) => {
              if (!element) return;
              element.style.left = `${Math.round(x)}px`;
              element.style.top = `${Math.round(y)}px`;
            });
          }

          function updateCaretRect(clientRect?: (() => DOMRect | null) | null) {
            caretRect = clientRect?.() ?? null;
          }

          function destroy() {
            stopAutoUpdate?.();
            stopAutoUpdate = null;
            element?.remove();
            component?.destroy();
            element = null;
            component = null;
          }

          return {
            onStart: (props) => {
              component = new ReactRenderer(SlashMenu, {
                props: {
                  items: props.items as SlashCommandItem[],
                  command: (item: SlashCommandItem) => props.command(item),
                },
                editor: props.editor,
              });
              element = component.element as HTMLElement;
              element.style.position = 'fixed';
              element.style.zIndex = '50';
              document.body.appendChild(element);
              updateCaretRect(props.clientRect);
              place();
              stopAutoUpdate = autoUpdate(reference, element, place, {
                ancestorScroll: true,
                ancestorResize: false,
                elementResize: true,
                layoutShift: false,
              });
            },
            onUpdate: (props) => {
              component?.updateProps({
                items: props.items as SlashCommandItem[],
                command: (item: SlashCommandItem) => props.command(item),
              });
              updateCaretRect(props.clientRect);
            },
            onKeyDown: (props) => {
              if (props.event.key === 'Escape') {
                // Borrar el `/consulta` hace que la sugerencia deje de coincidir y
                // el plugin sale por su propio `onExit` (una sola vía de cierre).
                editor.chain().focus().deleteRange(props.range).run();
                return true;
              }
              return component?.ref?.onKeyDown(props) ?? false;
            },
            onExit: destroy,
          };
        },
      }),
    ];
  },
});
