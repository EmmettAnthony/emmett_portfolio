"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";

interface ImageResizerProps {
  editor: Editor;
}

export function ImageResizer({ editor }: ImageResizerProps) {
  const [selectedImage, setSelectedImage] = useState<{
    dom: HTMLElement;
    src: string;
    width: number;
    alt: string;
  } | null>(null);
  const resizing = useRef(false);
  const startX = useRef(0);
  const startW = useRef(0);

  const updateSelection = useCallback(() => {
    const { view } = editor;
    const { from, to } = view.state.selection;
    if (from !== to) {
      setSelectedImage(null);
      return;
    }
    const dom = view.domAtPos(from);
    const node = dom.node.childNodes[dom.offset] as HTMLElement;
    if (node?.tagName === "IMG") {
      const img = node as HTMLImageElement;
      setSelectedImage({
        dom: img,
        src: img.src,
        width: img.width || 300,
        alt: img.alt || "",
      });
    } else {
      const img = (node as HTMLElement)?.querySelector?.("img");
      if (img && img.closest(".image-caption-wrapper")) {
        setSelectedImage({
          dom: img,
          src: img.src,
          width: img.width || 300,
          alt: img.alt || "",
        });
      } else {
        setSelectedImage(null);
      }
    }
  }, [editor]);

  useEffect(() => {
    editor.on("selectionUpdate", updateSelection);
    editor.on("blur", () => setSelectedImage(null));
    return () => {
      editor.off("selectionUpdate", updateSelection);
      editor.off("blur", () => setSelectedImage(null));
    };
  }, [editor, updateSelection]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!selectedImage) return;
      resizing.current = true;
      startX.current = e.clientX;
      startW.current = (selectedImage.dom as HTMLImageElement).width || selectedImage.width;
      const onMouseMove = (ev: MouseEvent) => {
        if (!resizing.current) return;
        const diff = ev.clientX - startX.current;
        const newW = Math.max(50, startW.current + diff);
        const pos = editor.state.selection.from;
        editor
          .chain()
          .focus()
          .setTextSelection(pos)
          .updateAttributes("image", { width: `${newW}px` })
          .run();
      };
      const onMouseUp = () => {
        resizing.current = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [editor, selectedImage]
  );

  if (!selectedImage) return null;

  const rect = selectedImage.dom.getBoundingClientRect();
  const editorRect = editor.view.dom.getBoundingClientRect();

  return (
    <div
      className="pointer-events-none absolute z-50"
      style={{
        left: `${rect.left - editorRect.left - 2}px`,
        top: `${rect.top - editorRect.top - 2}px`,
        width: `${rect.width + 4}px`,
        height: `${rect.height + 4}px`,
      }}
    >
      <div
        className="pointer-events-auto absolute -bottom-1.5 -right-1.5 z-10 h-3 w-3 cursor-se-resize rounded-full border-2 border-white bg-blue-500 shadow-md"
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}
