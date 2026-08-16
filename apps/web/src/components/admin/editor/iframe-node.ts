import { Node, mergeAttributes } from '@tiptap/core';

export interface IframeOptions {
  HTMLAttributes: Record<string, unknown>;
  defaultHeight: number;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    iframe: {
      insertIframe: (options: { src: string; title?: string; provider?: string }) => ReturnType;
    };
  }
}

interface EmbedInfo {
  src: string;
  provider: 'youtube' | 'tiktok' | 'twitter' | 'vimeo';
}

const EMBED_RULES: Array<{
  test: RegExp;
  provider: EmbedInfo['provider'];
  build: (url: string, match: RegExpMatchArray) => EmbedInfo;
}> = [
  {
    provider: 'youtube',
    test: /(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/i,
    build: (_url, match) => ({
      src: `https://www.youtube.com/embed/${match[1]}`,
      provider: 'youtube',
    }),
  },
  {
    provider: 'tiktok',
    test: /tiktok\.com\/@[\w.-]+\/video\/(\d+)/i,
    build: (_url, match) => ({
      src: `https://www.tiktok.com/embed/v2/video/${match[1]}`,
      provider: 'tiktok',
    }),
  },
  {
    provider: 'twitter',
    test: /(?:twitter\.com|x\.com)\/[\w.-]+\/status\/(\d+)/i,
    build: (url) => ({
      src: `https://platform.twitter.com/embed/Tweet.html?url=${encodeURIComponent(url)}`,
      provider: 'twitter',
    }),
  },
  {
    provider: 'vimeo',
    test: /vimeo\.com\/(\d+)/i,
    build: (_url, match) => ({
      src: `https://player.vimeo.com/video/${match[1]}`,
      provider: 'vimeo',
    }),
  },
];

const PASTE_URL_REGEX =
  /https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|tiktok\.com|twitter\.com|x\.com|vimeo\.com)\/[^\s<]+/gi;

export const Iframe = Node.create<IframeOptions>({
  name: 'iframe',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,
  addOptions() {
    return {
      HTMLAttributes: {
        class: 'rounded-xl overflow-hidden my-4 border border-border w-full',
      },
      defaultHeight: 480,
    };
  },
  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element) => element.getAttribute('src'),
        renderHTML: (attributes) => (attributes.src ? { src: attributes.src } : {}),
      },
      title: {
        default: 'Video embebido',
        parseHTML: (element) => element.getAttribute('title') ?? element.getAttribute('alt'),
        renderHTML: (attributes) => ({ title: attributes.title }),
      },
      provider: {
        default: 'generic',
        parseHTML: (element) => element.getAttribute('data-provider') ?? 'generic',
        renderHTML: (attributes) => ({ 'data-provider': attributes.provider }),
      },
      width: {
        default: '100%',
        parseHTML: (element) => element.getAttribute('width') ?? '100%',
        renderHTML: (attributes) => ({ width: attributes.width }),
      },
      height: {
        default: 480,
        parseHTML: (element) => Number(element.getAttribute('height') ?? 480),
        renderHTML: (attributes) => ({ height: attributes.height }),
      },
      frameborder: {
        default: 0,
        parseHTML: (element) => Number(element.getAttribute('frameborder') ?? 0),
        renderHTML: (attributes) => ({ frameborder: attributes.frameborder }),
      },
      allow: {
        default:
          'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
        parseHTML: (element) =>
          element.getAttribute('allow') ??
          'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
        renderHTML: (attributes) => ({ allow: attributes.allow }),
      },
      allowfullscreen: {
        default: true,
        parseHTML: (element) => element.hasAttribute('allowfullscreen'),
        renderHTML: () => ({ allowfullscreen: 'true' }),
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'iframe',
        getAttrs: (element) => {
          if (!(element instanceof HTMLElement)) return false;
          const src = element.getAttribute('src') ?? '';
          if (!src) return false;
          return {
            src,
            title: element.getAttribute('title') ?? 'Video embebido',
            width: element.getAttribute('width') ?? '100%',
            height: Number(element.getAttribute('height') ?? 480),
            provider: element.getAttribute('data-provider') ?? 'generic',
          };
        },
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ['iframe', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },
  addCommands() {
    return {
      insertIframe:
        ({ src, title, provider }) =>
        ({ commands }) => {
          const info = detectEmbed(src);
          const finalSrc = info?.src ?? src;
          const finalProvider = provider ?? info?.provider ?? 'generic';
          const finalTitle = title ?? providerLabel(finalProvider);
          return commands.insertContent({
            type: this.name,
            content: [],
            attrs: {
              src: finalSrc,
              title: finalTitle,
              provider: finalProvider,
              width: '100%',
              height: this.options.defaultHeight,
              frameborder: 0,
              allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
              allowfullscreen: true,
            },
          });
        },
    };
  },
  addPasteRules() {
    const regex = new RegExp(PASTE_URL_REGEX.source, 'gi');
    return [
      {
        find: regex,
        handler: ({ range, match, chain }) => {
          const url = (match[0] ?? '').replace(/[)\].,;]+$/, '');
          if (!url) return;
          const info = detectEmbed(url);
          if (!info) return;

          chain()
            .deleteRange(range)
            .insertContent({
              type: 'iframe',
              content: [],
              attrs: {
                src: info.src,
                provider: info.provider,
                title: info.provider.toUpperCase(),
                width: '100%',
                height: 480,
                frameborder: 0,
                allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
                allowfullscreen: true,
              },
            })
            .run();
        },
      },
    ];
  },
});

function detectEmbed(url: string): EmbedInfo | null {
  for (const rule of EMBED_RULES) {
    const match = rule.test.exec(url);
    if (match) return rule.build(url, match);
  }
  return null;
}

function providerLabel(provider: string) {
  if (provider === 'youtube') return 'Video de YouTube';
  if (provider === 'tiktok') return 'Video de TikTok';
  if (provider === 'twitter') return 'Publicación de X';
  if (provider === 'vimeo') return 'Video de Vimeo';
  return 'Video embebido';
}

export function parseVideoUrl(url: string): EmbedInfo | null {
  return detectEmbed(url);
}
