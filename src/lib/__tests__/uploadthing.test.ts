import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoisted mocks first
const mockAuth = vi.hoisted(() => vi.fn());
const mockNotifyFileUploaded = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("@/../auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/notifications/event-handlers", () => ({
  notifyFileUploaded: mockNotifyFileUploaded,
}));

// Dynamically import the file router after mocks are set up
async function getOurFileRouter() {
  const mod = await import("../uploadthing");
  return mod.ourFileRouter;
}

describe("uploadthing file router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("imageUploader", () => {
    it("throws UploadThingError when user is not authenticated", async () => {
      mockAuth.mockResolvedValue(null);
      const { ourFileRouter } = await import("../uploadthing");
      const { UploadThingError } = await import("uploadthing/server");

      const middleware = ourFileRouter.imageUploader.middleware;
      await expect(middleware()).rejects.toThrow(UploadThingError);
    });

    it("returns userId when authenticated", async () => {
      mockAuth.mockResolvedValue({ user: { id: "admin" } });
      const { ourFileRouter } = await import("../uploadthing");

      const middleware = ourFileRouter.imageUploader.middleware;
      const result = await middleware();
      expect(result).toEqual({ userId: "admin" });
    });

    it("calls notifyFileUploaded on upload complete", async () => {
      const { ourFileRouter } = await import("../uploadthing");

      const file = {
        name: "test-image.png",
        size: 1024 * 1024,
        url: "https://example.com/test-image.png",
        key: "test-key",
      } as const;

      await ourFileRouter.imageUploader.onUploadComplete({ file, metadata: { userId: "admin" } });

      expect(mockNotifyFileUploaded).toHaveBeenCalledWith(
        "test-image.png",
        "1.0MB",
        "admin",
      );
    });
  });

  describe("blogEditorImage", () => {
    it("throws UploadThingError when user is not authenticated", async () => {
      mockAuth.mockResolvedValue(null);
      const { ourFileRouter } = await import("../uploadthing");
      const { UploadThingError } = await import("uploadthing/server");

      const middleware = ourFileRouter.blogEditorImage.middleware;
      await expect(middleware()).rejects.toThrow(UploadThingError);
    });

    it("returns userId when authenticated", async () => {
      mockAuth.mockResolvedValue({ user: { id: "admin" } });
      const { ourFileRouter } = await import("../uploadthing");

      const middleware = ourFileRouter.blogEditorImage.middleware;
      const result = await middleware();
      expect(result).toEqual({ userId: "admin" });
    });

    it("calls notifyFileUploaded on upload complete", async () => {
      const { ourFileRouter } = await import("../uploadthing");

      const file = {
        name: "blog-editor-image.png",
        size: 1024 * 1024,
        url: "https://example.com/blog-editor-image.png",
        key: "blog-key",
      } as const;

      await ourFileRouter.blogEditorImage.onUploadComplete({ file, metadata: { userId: "admin" } });

      expect(mockNotifyFileUploaded).toHaveBeenCalledWith(
        "blog-editor-image.png",
        "1.0MB",
        "admin",
      );
    });
  });

  describe("attachmentUploader", () => {
    it("returns empty metadata from middleware", async () => {
      const { ourFileRouter } = await import("../uploadthing");

      const middleware = ourFileRouter.attachmentUploader.middleware;
      const result = await middleware();
      expect(result).toEqual({});
    });

    it("returns fileUrl and fileName on upload complete", async () => {
      const { ourFileRouter } = await import("../uploadthing");

      const file = {
        name: "test.pdf",
        size: 2048 * 1024,
        url: "https://example.com/test.pdf",
        key: "test-key",
      } as const;

      const result = await ourFileRouter.attachmentUploader.onUploadComplete({
        file,
        metadata: {},
      });

      expect(result).toEqual({
        fileUrl: "https://example.com/test.pdf",
        fileName: "test.pdf",
      });
    });
  });

  describe("publicUploader", () => {
    it("returns empty metadata from middleware", async () => {
      const { ourFileRouter } = await import("../uploadthing");

      const middleware = ourFileRouter.publicUploader.middleware;
      const result = await middleware();
      expect(result).toEqual({});
    });

    it("returns fileUrl on upload complete", async () => {
      const { ourFileRouter } = await import("../uploadthing");

      const file = {
        name: "public.png",
        size: 512 * 1024,
        url: "https://example.com/public.png",
        key: "pub-key",
      } as const;

      const result = await ourFileRouter.publicUploader.onUploadComplete({
        file,
        metadata: {},
      });

      expect(result).toEqual({ fileUrl: "https://example.com/public.png" });
    });
  });

  describe("supportAttachmentUploader", () => {
    it("returns empty metadata from middleware", async () => {
      const { ourFileRouter } = await import("../uploadthing");

      const middleware = ourFileRouter.supportAttachmentUploader.middleware;
      const result = await middleware();
      expect(result).toEqual({});
    });

    it("returns fileUrl from ufsUrl if available", async () => {
      const { ourFileRouter } = await import("../uploadthing");

      const file = {
        name: "support.zip",
        size: 8192 * 1024,
        url: "https://example.com/support.zip",
        ufsUrl: "https://utfs.io/f/support-key",
        key: "support-key",
      } as const;

      const result = await ourFileRouter.supportAttachmentUploader.onUploadComplete({
        file,
        metadata: {},
      });

      expect(result).toEqual({
        fileUrl: "https://utfs.io/f/support-key",
        fileName: "support.zip",
      });
    });

    it("falls back to url when ufsUrl is not available", async () => {
      const { ourFileRouter } = await import("../uploadthing");

      const file = {
        name: "support.pdf",
        size: 4096 * 1024,
        url: "https://example.com/support.pdf",
        key: "support-key",
      } as const;

      const result = await ourFileRouter.supportAttachmentUploader.onUploadComplete({
        file,
        metadata: {},
      });

      expect(result).toEqual({
        fileUrl: "https://example.com/support.pdf",
        fileName: "support.pdf",
      });
    });
  });

  describe("mediaUploader", () => {
    it("throws UploadThingError when user is not authenticated", async () => {
      mockAuth.mockResolvedValue(null);
      const { ourFileRouter } = await import("../uploadthing");
      const { UploadThingError } = await import("uploadthing/server");

      const middleware = ourFileRouter.mediaUploader.middleware;
      await expect(middleware()).rejects.toThrow(UploadThingError);
    });

    it("returns userId when authenticated", async () => {
      mockAuth.mockResolvedValue({ user: { id: "admin" } });
      const { ourFileRouter } = await import("../uploadthing");

      const middleware = ourFileRouter.mediaUploader.middleware;
      const result = await middleware();
      expect(result).toEqual({ userId: "admin" });
    });

    it("calls notifyFileUploaded on upload complete", async () => {
      const { ourFileRouter } = await import("../uploadthing");

      const file = {
        name: "media-banner.jpg",
        size: 5 * 1024 * 1024,
        url: "https://example.com/media-banner.jpg",
        key: "media-key",
      } as const;

      await ourFileRouter.mediaUploader.onUploadComplete({ file, metadata: { userId: "admin" } });

      expect(mockNotifyFileUploaded).toHaveBeenCalledWith(
        "media-banner.jpg",
        "5.0MB",
        "admin",
      );
    });
  });

  describe("testimonialUploader", () => {
    it("throws UploadThingError when user is not authenticated", async () => {
      mockAuth.mockResolvedValue(null);
      const { ourFileRouter } = await import("../uploadthing");
      const { UploadThingError } = await import("uploadthing/server");

      const middleware = ourFileRouter.testimonialUploader.middleware;
      await expect(middleware()).rejects.toThrow(UploadThingError);
    });

    it("returns userId when authenticated", async () => {
      mockAuth.mockResolvedValue({ user: { id: "admin" } });
      const { ourFileRouter } = await import("../uploadthing");

      const middleware = ourFileRouter.testimonialUploader.middleware;
      const result = await middleware();
      expect(result).toEqual({ userId: "admin" });
    });

    it("returns fileKey on upload complete", async () => {
      const { ourFileRouter } = await import("../uploadthing");

      const file = {
        name: "testimonial.jpg",
        size: 1024 * 1024,
        url: "https://example.com/testimonial.jpg",
        key: "testimonial-key",
      } as const;

      const result = await ourFileRouter.testimonialUploader.onUploadComplete({
        file,
        metadata: { userId: "admin" },
      });

      expect(result).toEqual({
        fileUrl: "https://example.com/testimonial.jpg",
        fileKey: "testimonial-key",
      });
    });
  });

  describe("FileRouter type", () => {
    it("exports OurFileRouter type", async () => {
      const mod = await import("../uploadthing");
      // Type assertion — if it compiles, the type is exported correctly
      const router: mod.OurFileRouter = mod.ourFileRouter;
      expect(router).toBeDefined();
    });
  });
});
