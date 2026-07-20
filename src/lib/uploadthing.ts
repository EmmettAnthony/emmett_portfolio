import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/../auth";
import { notifyFileUploaded } from "@/lib/notifications/event-handlers";

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth();
      if (!session) throw new UploadThingError("Unauthorized");
      return { userId: "admin" };
    })
    .onUploadComplete(async ({ file }) => {
      notifyFileUploaded(file.name, `${(file.size / 1024 / 1024).toFixed(1)}MB`, "admin").catch(() => {});
      return { fileUrl: file.url };
    }),

  blogEditorImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth();
      if (!session) throw new UploadThingError("Unauthorized");
      return { userId: "admin" };
    })
    .onUploadComplete(async ({ file }) => {
      notifyFileUploaded(file.name, `${(file.size / 1024 / 1024).toFixed(1)}MB`, "admin").catch(() => {});
      return { fileUrl: file.url };
    }),

  attachmentUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
    pdf: { maxFileSize: "16MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "16MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      return { fileUrl: file.url, fileName: file.name };
    }),

  mediaUploader: f({ image: { maxFileSize: "8MB", maxFileCount: 10 } })
    .middleware(async () => {
      const session = await auth();
      if (!session) throw new UploadThingError("Unauthorized");
      return { userId: "admin" };
    })
    .onUploadComplete(async ({ file }) => {
      notifyFileUploaded(file.name, `${(file.size / 1024 / 1024).toFixed(1)}MB`, "admin").catch(() => {});
      return { fileUrl: file.url };
    }),

  testimonialUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth();
      if (!session) throw new UploadThingError("Unauthorized");
      return { userId: "admin" };
    })
    .onUploadComplete(async ({ file }) => {
      notifyFileUploaded(file.name, `${(file.size / 1024 / 1024).toFixed(1)}MB`, "admin").catch(() => {});
      return { fileUrl: file.url, fileKey: file.key };
    }),

  publicUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      return { fileUrl: file.url };
    }),

  supportAttachmentUploader: f({
    image: { maxFileSize: "16MB", maxFileCount: 5 },
    pdf: { maxFileSize: "16MB", maxFileCount: 5 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { maxFileSize: "16MB", maxFileCount: 5 },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { maxFileSize: "16MB", maxFileCount: 5 },
    "application/zip": { maxFileSize: "32MB", maxFileCount: 5 },
    "image/svg+xml": { maxFileSize: "4MB", maxFileCount: 5 },
  })
    .middleware(async () => ({}))
    .onUploadComplete(async ({ file }) => {
      return { fileUrl: file.ufsUrl || file.url, fileName: file.name };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
