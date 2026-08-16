import { Extension } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion';
import {
  SlashCommandList,
  type SlashCommandListRef,
  slashCommandItems,
  type SlashCommandItem,
} from './slash-command-list';

function filterItems(query: string): SlashCommandItem[] {
  const q = query.toLowerCase();
  return slashCommandItems.filter(
      (item) =>
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
        (q.startsWith('cod') && item.title.startsWith('Código')) ||
        (q.startsWith('inline') && item.title === 'Código en línea') ||
      (q.startsWith('img') && item.title === 'Imagen'),
  );
}

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addKeyboardShortcuts() {
    return {
      'Mod-e': () => this.editor.commands.toggleCode(),
    };
  },

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
          props.command({ editor, range });
        },
      } satisfies Partial<SuggestionOptions>,
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: ({ query }: { query: string }) => filterItems(query),
        render: () => {
          let component: ReactRenderer<SlashCommandListRef> | null = null;
          let element: HTMLElement | null = null;

          function positionPopup(clientRect?: (() => DOMRect | null) | null) {
            if (!element || !clientRect) return;
            const rect = clientRect();
            if (!rect) return;
            element.style.position = 'fixed';
            element.style.left = `${rect.left}px`;
            element.style.top = `${rect.bottom + 8}px`;
            element.style.zIndex = '50';
          }

          return {
            onStart: (props) => {
              component = new ReactRenderer(SlashCommandList, {
                props: {
                  items: props.items as SlashCommandItem[],
                  command: (item: SlashCommandItem) => props.command(item),
                },
                editor: props.editor,
              });
              element = component.element as HTMLElement;
              document.body.appendChild(element);
              positionPopup(props.clientRect);
            },
            onUpdate: (props) => {
              component?.updateProps({
                items: props.items as SlashCommandItem[],
                command: (item: SlashCommandItem) => props.command(item),
              });
              positionPopup(props.clientRect);
            },
            onKeyDown: (props) => {
              if (props.event.key === 'Escape') {
                element?.remove();
                component?.destroy();
                return true;
              }
              return component?.ref?.onKeyDown(props) ?? false;
            },
            onExit: () => {
              element?.remove();
              component?.destroy();
            },
          };
        },
      }),
    ];
  },
});
