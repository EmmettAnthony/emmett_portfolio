import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { UTApi } from "uploadthing/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const utapi = new UTApi();
    const { files } = await utapi.listFiles();

    const media = (files || [])
      .map((f) => ({
        id: f.key,
        name: f.name,
        key: f.key,
        url: `https://utfs.io/f/${f.key}`,
        type: "image",
        mimeType: null,
        size: f.size,
        createdAt: f.uploadedAt
          ? new Date(f.uploadedAt).toISOString()
          : new Date().toISOString(),
      }));

    return NextResponse.json({ media });
  } catch (error) {
    console.error("Failed to fetch media:", error);
    return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { keys } = await req.json();
    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json({ error: "No file keys provided" }, { status: 400 });
    }

    const utapi = new UTApi();
    await utapi.deleteFiles(keys);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete media:", error);
    return NextResponse.json({ error: "Failed to delete media" }, { status: 500 });
  }
}
