import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

export const DragHandle = Extension.create({
  name: "dragHandle",

  addKeyboardShortcuts() {
    return {
      "Alt-ArrowUp": ({ editor }) => {
        const { state } = editor;
        const { from, to } = state.selection;
        if (from === to) return false;
        const start = state.doc.resolve(from).start();
        const end = state.doc.resolve(to).end();
        const text = state.doc.textBetween(start, end);
        if (!text.trim()) return false;

        const $pos = state.doc.resolve(from);
        const depth = $pos.depth;
        if (depth <= 1) return false;
        const nodeBefore = state.doc.nodeAt($pos.before(depth) - 1);
        if (!nodeBefore) return false;

        const fromPos = $pos.before(depth);
        const toPos = $pos.after(depth);
        const node = state.doc.nodeAt(fromPos);
        if (!node) return false;

        const insertPos = fromPos - 1 - nodeBefore.nodeSize;
        editor
          .chain()
          .focus()
          .deleteRange({ from: fromPos, to: toPos })
          .insertContentAt(insertPos, node.toJSON())
          .setTextSelection({ from: insertPos, to: insertPos + node.nodeSize })
          .run();
        return true;
      },

      "Alt-ArrowDown": ({ editor }) => {
        const { state } = editor;
        const { from, to } = state.selection;
        if (from === to) return false;

        const $pos = state.doc.resolve(from);
        const depth = $pos.depth;
        if (depth <= 1) return false;

        const fromPos = $pos.before(depth);
        const toPos = $pos.after(depth);
        const node = state.doc.nodeAt(fromPos);
        if (!node) return false;

        const nodeAfter = state.doc.nodeAt(toPos + 1);
        if (!nodeAfter) return false;

        const insertPos = toPos + 1;
        editor
          .chain()
          .focus()
          .deleteRange({ from: fromPos, to: toPos })
          .insertContentAt(insertPos, node.toJSON())
          .setTextSelection({ from: insertPos, to: insertPos + node.nodeSize })
          .run();
        return true;
      },
    };
  },

  addProseMirrorPlugins() {
    let handle: HTMLDivElement | null = null;
    let currentFrom: number | null = null;
    let currentTo: number | null = null;

    return [
      new Plugin({
        key: new PluginKey("dragHandle"),
        view(view) {
          handle = document.createElement("div");
          handle.contentEditable = "false";
          handle.draggable = true;
          handle.innerHTML =
            '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><circle cx="4" cy="3.5" r="1.5"/><circle cx="10" cy="3.5" r="1.5"/><circle cx="4" cy="7" r="1.5"/><circle cx="10" cy="7" r="1.5"/><circle cx="4" cy="10.5" r="1.5"/><circle cx="10" cy="10.5" r="1.5"/></svg>';
          handle.style.cssText =
            "position:absolute;left:-28px;top:0;width:24px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:6px;cursor:grab;color:#a1a1aa;opacity:0;transition:opacity 0.15s,background 0.15s;z-index:20;";
          handle.addEventListener("mouseenter", () => {
            handle!.style.opacity = "1";
            handle!.style.background = "rgba(0,0,0,0.06)";
            handle!.style.color = "#52525b";
          });
          handle.addEventListener("mouseleave", () => {
            handle!.style.opacity = "0";
            handle!.style.background = "transparent";
            handle!.style.color = "#a1a1aa";
          });
          handle.addEventListener("mousedown", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (currentFrom === null || currentTo === null) return;
            view.dispatch(
              view.state.tr.setSelection(
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma dynamic query type
                new (view.state.selection.constructor as any)(
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma JSON field
                  { from: currentFrom, to: currentTo } as any
                )
              )
            );
            view.focus();
          });

          const editorEl = view.dom.closest(".ProseMirror")?.parentElement;
          if (editorEl) {
            editorEl.style.position = "relative";
            editorEl.appendChild(handle);
          }

          return {
            update(_view) {},
            destroy() {
              handle?.remove();
            },
          };
        },
        props: {
          handleDOMEvents: {
            mouseover(view, event) {
              if (!handle) return;
              const target = event.target as HTMLElement;
              if (target.closest("[contenteditable]") === null) return;

              const pos = view.posAtCoords({
                left: event.clientX,
                top: event.clientY,
              });
              if (!pos) {
                handle.style.opacity = "0";
                currentFrom = null;
                currentTo = null;
                return;
              }

              const resolved = view.state.doc.resolve(pos.pos);
              let depth = resolved.depth;
              while (depth > 0) {
                const node = resolved.node(depth);
                if (node && node.type.isBlock) break;
                depth--;
              }
              if (depth === 0) {
                handle.style.opacity = "0";
                currentFrom = null;
                currentTo = null;
                return;
              }

              const from = resolved.before(depth);
              const to = resolved.after(depth);
              if (from === undefined || to === undefined) return;

              const dom = view.nodeDOM(from) as HTMLElement | null;
              if (!dom || !dom.parentElement) {
                handle.style.opacity = "0";
                currentFrom = null;
                currentTo = null;
                return;
              }

              handle.style.opacity = "1";
              handle.style.top = `${dom.offsetTop + 2}px`;
              currentFrom = from;
              currentTo = to;
            },
            mouseout(view, event) {
              const target = event.target as HTMLElement;
              const related = event.relatedTarget as HTMLElement;
              if (target.closest("[contenteditable]") && !related?.closest("[contenteditable]")) {
                if (!handle) return;
                handle.style.opacity = "0";
                currentFrom = null;
                currentTo = null;
              }
            },
            dragstart(view, event) {
              const dt = event.dataTransfer;
              if (!dt) return false;
              dt.effectAllowed = "move";
              if (currentFrom !== null && currentTo !== null) {
                const slice = view.state.doc.slice(currentFrom, currentTo);
                dt.setData("text/plain", slice.content.textBetween(0, slice.content.size, "\n"));
              }
            },
            drop(_view, _event) {
              currentFrom = null;
              currentTo = null;
            },
          },
        },
      }),
    ];
  },
});
