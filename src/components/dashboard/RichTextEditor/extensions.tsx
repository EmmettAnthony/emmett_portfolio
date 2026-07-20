import { Node, mergeAttributes } from "@tiptap/core";

function extractTweetId(url: string): string | null {
  const m = url.match(/twitter\.com\/\w+\/status\/(\d+)/) || url.match(/x\.com\/\w+\/status\/(\d+)/);
  return m?.[1] || null;
}

function extractInstagramId(url: string): string | null {
  const m = url.match(/instagram\.com\/p\/([^/?]+)/);
  return m?.[1] || null;
}

function extractCodePenId(url: string): { user: string; pen: string } | null {
  const m = url.match(/codepen\.io\/(\w+)\/pen\/(\w+)/);
  return m ? { user: m[1], pen: m[2] } : null;
}

export const TwitterEmbed = Node.create({
  name: "twitterEmbed",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return { src: { default: null } };
  },

  parseHTML() {
    return [{ tag: "div[data-twitter-embed]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-twitter-embed": "",
        class: "embed-card embed-card--twitter",
      }),
      [
        "div",
        { class: "embed-card__inner" },
        ["div", { class: "embed-card__icon" }, "𝕏"],
        ["div", { class: "embed-card__text" }, HTMLAttributes.src],
      ],
    ];
  },

  addCommands() {
    return {
      insertTwitterEmbed:
        (src: string) =>
        ({ commands }) =>
          commands.insertContent({ type: "twitterEmbed", attrs: { src } }),
    };
  },
});

export const InstagramEmbed = Node.create({
  name: "instagramEmbed",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return { src: { default: null } };
  },

  parseHTML() {
    return [{ tag: "div[data-instagram-embed]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-instagram-embed": "",
        class: "embed-card embed-card--instagram",
      }),
      [
        "div",
        { class: "embed-card__inner" },
        ["div", { class: "embed-card__icon" }, "📷"],
        ["div", { class: "embed-card__text" }, HTMLAttributes.src],
      ],
    ];
  },

  addCommands() {
    return {
      insertInstagramEmbed:
        (src: string) =>
        ({ commands }) =>
          commands.insertContent({ type: "instagramEmbed", attrs: { src } }),
    };
  },
});

export const CodePenEmbed = Node.create({
  name: "codepenEmbed",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return { src: { default: null } };
  },

  parseHTML() {
    return [{ tag: "div[data-codepen-embed]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-codepen-embed": "",
        class: "embed-card embed-card--codepen",
      }),
      [
        "div",
        { class: "embed-card__inner" },
        ["div", { class: "embed-card__icon" }, "🖊"],
        ["div", { class: "embed-card__text" }, HTMLAttributes.src],
      ],
    ];
  },

  addCommands() {
    return {
      insertCodePenEmbed:
        (src: string) =>
        ({ commands }) =>
          commands.insertContent({ type: "codepenEmbed", attrs: { src } }),
    };
  },
});

const PROVIDER_CONFIG = {
  twitter: {
    icon: "𝕏",
    label: "X (Twitter)",
    match: (url: string) => !!extractTweetId(url),
    embedUrl: (url: string) => {
      const id = extractTweetId(url);
      return id ? `https://platform.twitter.com/embed/Tweet.html?id=${id}` : url;
    },
  },
  instagram: {
    icon: "📷",
    label: "Instagram",
    match: (url: string) => !!extractInstagramId(url),
    embedUrl: (url: string) => {
      const id = extractInstagramId(url);
      return id ? `https://www.instagram.com/p/${id}/embed` : url;
    },
  },
  codepen: {
    icon: "🖊",
    label: "CodePen",
    match: (url: string) => !!extractCodePenId(url),
    embedUrl: (url: string) => {
      const id = extractCodePenId(url);
      return id ? `https://codepen.io/${id.user}/embed/${id.pen}?default-tab=result` : url;
    },
  },
};

export function detectEmbedProvider(url: string): keyof typeof PROVIDER_CONFIG | null {
  for (const [key, config] of Object.entries(PROVIDER_CONFIG)) {
    if (config.match(url)) return key as keyof typeof PROVIDER_CONFIG;
  }
  return null;
}

export function getEmbedIframeHtml(url: string, provider: string): string {
  const config = PROVIDER_CONFIG[provider as keyof typeof PROVIDER_CONFIG];
  if (!config) return "";
  const embedUrl = config.embedUrl(url);
  return `<iframe src="${embedUrl}" class="embed-iframe" style="width:100%;border:0;border-radius:8px;" allowfullscreen loading="lazy"></iframe>`;
}
