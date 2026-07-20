import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

export const LinkPreview = Extension.create({
  name: "linkPreview",

  addProseMirrorPlugins() {
    let tooltip: HTMLDivElement | null = null;

    function showTooltip(text: string, x: number, y: number) {
      if (!tooltip) return;
      tooltip.textContent = text;
      tooltip.style.opacity = "1";
      tooltip.style.left = `${Math.min(x, window.innerWidth - 340)}px`;
      tooltip.style.top = `${y - 36}px`;
    }

    function hideTooltip() {
      if (!tooltip) return;
      tooltip.style.opacity = "0";
    }

    return [
      new Plugin({
        key: new PluginKey("linkPreview"),
        view(_view) {
          tooltip = document.createElement("div");
          tooltip.contentEditable = "false";
          tooltip.style.cssText =
            "position:fixed;z-index:9999;background:#18181b;color:#e4e4e7;font-size:12px;padding:4px 10px;border-radius:6px;pointer-events:none;opacity:0;transition:opacity 0.15s;max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:ui-monospace,monospace;";
          document.body.appendChild(tooltip);

          return {
            update(_view) {},
            destroy() {
              tooltip?.remove();
            },
          };
        },
        props: {
          handleDOMEvents: {
            mouseover(view, event) {
              const target = event.target as HTMLElement;
              if (target.tagName === "A" && target.getAttribute("href")) {
                const rect = target.getBoundingClientRect();
                showTooltip(target.getAttribute("href")!, rect.left, rect.top);
              }
            },
            mouseout(view, event) {
              const target = event.target as HTMLElement;
              if (target.tagName === "A") {
                hideTooltip();
              }
              const related = event.relatedTarget as HTMLElement;
              if (related?.tagName === "A") return;
              const editorEl = view.dom;
              if (!editorEl.contains(related)) {
                hideTooltip();
              }
            },
          },
        },
      }),
    ];
  },
});
