import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const OUTPUT_DIR = path.resolve(process.cwd(), "output");

const sanitizeSegment = (segment: string) =>
  segment.replace(/[^a-zA-Z0-9_.-]/g, "_");

const sanitizeFilename = (filename?: string) => {
  const baseName = filename ? path.basename(filename) : "sprite.png";
  return sanitizeSegment(baseName);
};

const buildOutputPath = (subdir: string | undefined, filename: string) => {
  const safeSegments = subdir
    ? subdir
        .split("/")
        .filter(Boolean)
        .map((segment) => sanitizeSegment(segment))
    : [];
  const safeName = sanitizeFilename(filename);
  const outputPath = path.resolve(OUTPUT_DIR, ...safeSegments, safeName);
  if (!outputPath.startsWith(OUTPUT_DIR)) {
    throw new Error("Invalid output path");
  }
  return {
    outputPath,
    outputDir: path.dirname(outputPath),
    relativePath: path.join("output", ...safeSegments, safeName),
  };
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
    const { imageUrl, filename, subdir } = await request.json();

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
    }

    const buffer = await getImageBuffer(imageUrl);
    const { outputPath, outputDir, relativePath } = buildOutputPath(subdir, filename);

    await mkdir(outputDir, { recursive: true });
    await writeFile(outputPath, buffer);

    return NextResponse.json({ savedPath: relativePath });
  } catch (error) {
    console.error("Error saving image:", error);
    return NextResponse.json({ error: "Failed to save image" }, { status: 500 });
  }
}
