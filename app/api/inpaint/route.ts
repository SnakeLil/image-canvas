import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

type AIProvider = 'iopaint';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const provider = formData.get('provider') as AIProvider;
    const image = formData.get('image') as File;
    const mask = formData.get('mask') as File;
    const prompt = formData.get('prompt') as string || 'high quality, photorealistic, seamless background';

    if (!provider || !image || !mask) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Validate provider - only IOPaint is supported
    if (provider !== 'iopaint') {
      return NextResponse.json(
        { success: false, error: `Unsupported provider: ${provider}. Only IOPaint is supported.` },
        { status: 400 }
      );
    }

    // Convert files to base64 for IOPaint
    const imageBuffer = await image.arrayBuffer();
    const maskBuffer = await mask.arrayBuffer();

    // Get IOPaint server URL
    const baseUrl = formData.get('baseUrl') as string || 'http://localhost:8080';

    try {
      // IOPaint expects JSON with base64 encoded images (without data URL prefix)
      const imageBase64 = Buffer.from(imageBuffer).toString('base64');
      const maskBase64 = Buffer.from(maskBuffer).toString('base64');

      const requestBody = {
        image: imageBase64,
        mask: maskBase64,
        ldm_steps: 20,
        ldm_sampler: 'plms',
        hd_strategy: 'Crop',
        hd_strategy_crop_trigger_size: 800,
        hd_strategy_crop_margin: 128,
        hd_strategy_resize_limit: 1280
      };

      const response = await fetch(`${baseUrl}/api/v1/inpaint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        if (contentType?.includes('application/json')) {
          try {
            const errorData = await response.json();
            // Handle IOPaint specific error format
            if (errorData.error && errorData.errors) {
              errorMessage = `${errorData.error}: ${errorData.errors}`;

              // Check for common IOPaint errors and provide helpful messages
              if (errorData.errors.includes('Padding size should be less than')) {
                errorMessage = 'Image is too small for IOPaint. Please use an image that is at least 64x64 pixels.';
              } else if (errorData.errors.includes('cannot identify image file')) {
                errorMessage = 'Invalid image format. Please use a valid PNG or JPEG image.';
              }
            } else {
              errorMessage = errorData.error || errorData.message || errorMessage;
            }
          } catch {
            errorMessage = await response.text();
          }
        } else {
          errorMessage = await response.text();
        }

        return NextResponse.json(
          { success: false, error: `IOPaint: ${errorMessage}` },
          { status: response.status }
        );
      }

      const contentType = response.headers.get('content-type');
      let result;

      // IOPaint API returns JSON or image depending on the endpoint
      if (contentType?.includes('application/json')) {
        // Parse JSON response
        const jsonResponse = await response.json();

        // Check if it contains base64 image data
        if (jsonResponse && typeof jsonResponse === 'string') {
          // Response is base64 image data
          result = {
            success: true,
            imageUrl: `data:image/png;base64,${jsonResponse}`
          };
        } else if (jsonResponse.image) {
          // Response contains image field
          result = {
            success: true,
            imageUrl: `data:image/png;base64,${jsonResponse.image}`
          };
        } else {
          // Unexpected JSON format
          return NextResponse.json(
            { success: false, error: `IOPaint returned unexpected JSON format: ${JSON.stringify(jsonResponse).substring(0, 200)}...` },
            { status: 500 }
          );
        }
      } else if (contentType?.includes('image/')) {
        // Direct image response
        const blob = await response.blob();
        const buffer = await blob.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        result = {
          success: true,
          imageUrl: `data:image/png;base64,${base64}`
        };
      } else {
        // Unexpected content type
        const responseText = await response.text();
        return NextResponse.json(
          { success: false, error: `IOPaint returned unexpected content type: ${contentType}. Response: ${responseText.substring(0, 200)}...` },
          { status: 500 }
        );
      }

      return NextResponse.json(result);

    } catch (error) {
      return NextResponse.json(
        { success: false, error: `IOPaint API request failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
