import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    details: {
      setDetails: () => ReturnType;
      toggleDetails: () => ReturnType;
    };
  }
}

export const Details = Node.create({
  name: "details",

  group: "block",

  content: "detailsSummary block*",

  parseHTML() {
    return [{ tag: "details" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["details", mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setDetails:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            content: [
              { type: "detailsSummary", content: [{ type: "text", text: "Click to expand" }] },
              { type: "paragraph" },
            ],
          });
        },
      toggleDetails:
        () =>
        ({ commands }) => {
          return commands.toggleWrap(this.name);
        },
    };
  },
});

export const DetailsSummary = Node.create({
  name: "detailsSummary",

  group: "block",

  content: "inline*",

  parseHTML() {
    return [{ tag: "summary" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["summary", mergeAttributes(HTMLAttributes), 0];
  },
});
