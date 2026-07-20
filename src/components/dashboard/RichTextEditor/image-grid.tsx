import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewContent
} from "@tiptap/react";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    imageGrid: {
      insertImageGrid: (cols: number) => ReturnType;
    };
  }
}
import { useUploadThing } from "@/lib/uploadthing-client";
import { Loader2, Trash2, Plus } from "lucide-react";
import { useState, useCallback } from "react";

export const ImageGrid = Node.create({
  name: "imageGrid",
  group: "block",
  content: "imageGridCell{2,}",
  isolating: true,
  defining: true,

  addAttributes() {
    return { cols: { default: 2 } };
  },

  parseHTML() {
    return [{ tag: 'div[data-image-grid]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-image-grid": "",
        style: `grid-template-columns: repeat(${HTMLAttributes.cols || 2}, 1fr)`,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      insertImageGrid:
        (cols: number) =>
        ({ commands }) =>
          commands.insertContent({
            type: "imageGrid",
            attrs: { cols },
            content: Array.from({ length: cols }, () => ({
              type: "imageGridCell",
            })),
          }),
    };
  },
});

export const ImageGridCell = Node.create({
  name: "imageGridCell",
  group: "block",
  content: "image",
  isolating: true,
  defining: true,

  parseHTML() {
    return [{ tag: 'figure[data-image-grid-cell]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["figure", mergeAttributes(HTMLAttributes, { "data-image-grid-cell": "" }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageGridCellComponent);
  },
});

function ImageGridCellComponent({ editor, node, getPos, deleteNode }: NodeViewProps) {
  const [uploading, setUploading] = useState(false);
  const { startUpload } = useUploadThing("blogEditorImage");
  const hasImage = node.childCount > 0 && node.firstChild?.type.name === "image";

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const res = await startUpload([file]);
      const src = res?.[0]?.ufsUrl || res?.[0]?.url;
      if (src) {
        const pos = getPos();
        if (pos === undefined) return;
        editor
          .chain()
          .focus()
          .insertContentAt(pos + 1, { type: "image", attrs: { src } })
          .run();
      }
    } catch (err) {
      console.error("Failed to upload image:", err);
    } finally {
      setUploading(false);
    }
  }, [startUpload, editor, getPos]);

  const handleClick = useCallback(() => {
    if (hasImage || uploading) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) uploadFile(file);
    };
    input.click();
  }, [hasImage, uploading, uploadFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (hasImage || uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith("image/")) uploadFile(file);
  }, [hasImage, uploading, uploadFile]);

  if (hasImage) {
    return (
      <NodeViewWrapper
        as="figure"
        data-image-grid-cell
        className="image-grid-cell image-grid-cell--filled"
      >
        <div className="image-grid-cell__image">
          <NodeViewContent />
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); deleteNode(); }}
          className="image-grid-cell__delete"
          title="Remove image"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      as="figure"
      data-image-grid-cell
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="image-grid-cell image-grid-cell--empty"
    >
      {uploading ? (
        <div className="image-grid-cell__uploading">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Uploading...</span>
        </div>
      ) : (
        <div className="image-grid-cell__placeholder">
          <Plus className="h-6 w-6" />
          <span>Add image</span>
          <span className="image-grid-cell__hint">Click or drag & drop</span>
        </div>
      )}
    </NodeViewWrapper>
  );
}
