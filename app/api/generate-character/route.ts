import { fal } from "@fal-ai/client";
import { NextRequest, NextResponse } from "next/server";

// Configure fal client with API key from environment
fal.config({
  credentials: process.env.FAL_KEY,
});

const CHARACTER_STYLE_PROMPT = `Generate a single character only, centered in the frame on a transparent background.
Style: 2D flat, no gradients, no shadows, no textures. Rounded edges, friendly proportions, centered with padding.
Use ONLY this palette: #FFF1F5 #FFE1EA #FFC2D4 #FFA3BE #FF7EA2 #FF5A7D #E64B6E #C93F5D #A8334C #7A1E3A #FFC857 #9ED7FF #B7F0D4 #FFFFFF.
The character should have well-defined features and expressive details.
Show in a front-facing or 3/4 view pose, standing idle, suitable for sprite sheet animation.`;

const IMAGE_TO_PIXEL_PROMPT = `Transform this character into 2D flat style for the Happy Periods app.
IMPORTANT: Must be a FULL BODY shot showing the entire character from head to feet.
Keep the character centered in the frame on a transparent background.
Style: 2D flat, no gradients, no shadows, no textures. Rounded edges, friendly proportions, centered with padding.
Use ONLY this palette: #FFF1F5 #FFE1EA #FFC2D4 #FFA3BE #FF7EA2 #FF5A7D #E64B6E #C93F5D #A8334C #7A1E3A #FFC857 #9ED7FF #B7F0D4 #FFFFFF.
Show in a front-facing or 3/4 view pose, standing idle, suitable for sprite sheet animation.
Maintain the character's key features, colors, and identity while converting to this style.`;

export async function POST(request: NextRequest) {
  try {
    const { prompt, imageUrl } = await request.json();

    // Image-to-image mode: convert uploaded image to pixel art
    if (imageUrl) {
      const fullPrompt = prompt
        ? `${prompt}. ${IMAGE_TO_PIXEL_PROMPT}`
        : IMAGE_TO_PIXEL_PROMPT;

      const result = await fal.subscribe("fal-ai/nano-banana-pro/edit", {
        input: {
          prompt: fullPrompt,
          image_urls: [imageUrl],
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
    }

    // Text-to-image mode: generate from prompt
    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt or image URL is required" },
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
  } catch (error: unknown) {
    console.error("Error generating character:", error);
    // Log full error details for fal.ai validation errors
    if (error && typeof error === 'object' && 'body' in error) {
      console.error("Error body:", JSON.stringify((error as { body: unknown }).body, null, 2));
    }
    return NextResponse.json(
      { error: "Failed to generate character" },
      { status: 500 }
    );
  }
}
