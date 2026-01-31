import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const OUTPUT_DIR = path.join(process.cwd(), "output");

const sanitizeFilename = (filename?: string) => {
  const baseName = filename ? path.basename(filename) : "sprite.png";
  return baseName.replace(/[^a-zA-Z0-9_.-]/g, "_");
};

const getImageBuffer = async (imageUrl: string) => {
  if (imageUrl.startsWith("data:")) {
    const match = imageUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) {
      throw new Error("Invalid data URL");
    }
    return Buffer.from(match[2], "base64");
  }

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, filename } = await request.json();

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
    }

    const safeName = sanitizeFilename(filename);
    const buffer = await getImageBuffer(imageUrl);

    await mkdir(OUTPUT_DIR, { recursive: true });
    const outputPath = path.join(OUTPUT_DIR, safeName);
    await writeFile(outputPath, buffer);

    return NextResponse.json({ savedPath: `output/${safeName}` });
  } catch (error) {
    console.error("Error saving image:", error);
    return NextResponse.json({ error: "Failed to save image" }, { status: 500 });
  }
}
