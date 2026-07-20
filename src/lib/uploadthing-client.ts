import {
  generateReactHelpers,
  generateUploadButton,
} from "@uploadthing/react";
import type { OurFileRouter } from "@/lib/uploadthing";

export const { useUploadThing, uploadFiles } =
  generateReactHelpers<OurFileRouter>();

export const UploadButton = generateUploadButton<OurFileRouter>();
