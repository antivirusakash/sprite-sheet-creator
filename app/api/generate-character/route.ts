import { fal } from "@fal-ai/client";
import { NextRequest, NextResponse } from "next/server";

// Configure fal client with API key from environment
fal.config({
  credentials: process.env.FAL_KEY,
});

const CHARACTER_STYLE_PROMPT = `Generate a single character only, centered in the frame on a plain white background. 
The character should be rendered in pixel art style with clean edges, suitable for use as a 2D game sprite. 
Use a 32-bit retro game aesthetic. The character should be shown in a front-facing or 3/4 view pose, 
standing idle and ready to be used in a sprite sheet animation.`;

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const fullPrompt = `${prompt}. ${CHARACTER_STYLE_PROMPT}`;

    const result = await fal.subscribe("fal-ai/nano-banana-pro", {
      input: {
        prompt: fullPrompt,
        num_images: 1,
        aspect_ratio: "1:1",
        output_format: "png",
        resolution: "1K",
      },
    });

    const data = result.data as {
      images: Array<{ url: string; width: number; height: number }>;
    };

    if (!data.images || data.images.length === 0) {
      return NextResponse.json(
        { error: "No image generated" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      imageUrl: data.images[0].url,
      width: data.images[0].width,
      height: data.images[0].height,
    });
  } catch (error) {
    console.error("Error generating character:", error);
    return NextResponse.json(
      { error: "Failed to generate character" },
      { status: 500 }
    );
  }
}
