import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const provider = formData.get('provider') as string;
    const apiKey = formData.get('apiKey') as string;
    const image = formData.get('image') as File;
    const mask = formData.get('mask') as File;
    const prompt = formData.get('prompt') as string || 'high quality, photorealistic, detailed';

    if (!provider || !image || !mask) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Convert files to base64
    const imageBuffer = await image.arrayBuffer();
    const maskBuffer = await mask.arrayBuffer();
    const imageBase64 = `data:${image.type};base64,${Buffer.from(imageBuffer).toString('base64')}`;
    const maskBase64 = `data:${mask.type};base64,${Buffer.from(maskBuffer).toString('base64')}`;

    let result;

    if (provider === 'replicate') {
      if (!apiKey) {
        return NextResponse.json(
          { success: false, error: 'API key required for Replicate' },
          { status: 400 }
        );
      }

      // Create prediction
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: "95b7223104132402a9ae91cc677285bc5eb997834bd2349fa486f53910fd68b3",
          input: {
            image: imageBase64,
            mask: maskBase64,
            prompt: prompt,
            num_inference_steps: 20,
            guidance_scale: 7.5,
            num_outputs: 1,
            scheduler: "K_EULER"
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json(
          { success: false, error: `Replicate API error: ${response.statusText} - ${errorText}` },
          { status: response.status }
        );
      }

      const prediction = await response.json();
      result = await pollReplicateResult(prediction.id, apiKey);

    } else if (provider === 'huggingface') {
      if (!apiKey) {
        return NextResponse.json(
          { success: false, error: 'API key required for Hugging Face' },
          { status: 400 }
        );
      }

      try {
        const hfFormData = new FormData();
        hfFormData.append('image', new Blob([imageBuffer]), 'image.png');
        hfFormData.append('mask', new Blob([maskBuffer]), 'mask.png');

        const response = await fetch('https://api-inference.huggingface.co/models/runwayml/stable-diffusion-inpainting', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
          body: hfFormData
        });

        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          
          if (contentType?.includes('application/json')) {
            try {
              const errorData = await response.json();
              errorMessage = errorData.error || errorData.message || errorMessage;
            } catch {
              errorMessage = await response.text();
            }
          } else {
            errorMessage = await response.text();
          }
          
          return NextResponse.json(
            { success: false, error: `Hugging Face API error: ${errorMessage}` },
            { status: response.status }
          );
        }

        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          // Handle JSON error response
          const jsonResponse = await response.json();
          if (jsonResponse.error) {
            return NextResponse.json(
              { success: false, error: `Hugging Face error: ${jsonResponse.error}` },
              { status: 400 }
            );
          }
        }

        // Expect image blob response
        const blob = await response.blob();
        const buffer = await blob.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        result = {
          success: true,
          imageUrl: `data:image/png;base64,${base64}`
        };
      } catch (error) {
        return NextResponse.json(
          { success: false, error: `Hugging Face request failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
          { status: 500 }
        );
      }

    } else if (provider === 'local') {
      const baseUrl = formData.get('baseUrl') as string || 'http://localhost:8000';
      
      try {
        const localFormData = new FormData();
        localFormData.append('image', new Blob([imageBuffer]), 'image.png');
        localFormData.append('mask', new Blob([maskBuffer]), 'mask.png');
        localFormData.append('prompt', prompt);

        const response = await fetch(`${baseUrl}/inpaint`, {
          method: 'POST',
          body: localFormData
        });

        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          
          if (contentType?.includes('application/json')) {
            try {
              const errorData = await response.json();
              errorMessage = errorData.error || errorData.message || errorMessage;
            } catch {
              errorMessage = await response.text();
            }
          } else {
            errorMessage = await response.text();
          }
          
          return NextResponse.json(
            { success: false, error: `Local API error: ${errorMessage}` },
            { status: response.status }
          );
        }

        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
          const responseText = await response.text();
          return NextResponse.json(
            { success: false, error: `Expected JSON response but got: ${contentType}. Response: ${responseText.substring(0, 200)}...` },
            { status: 500 }
          );
        }

        result = await response.json();
      } catch (error) {
        return NextResponse.json(
          { success: false, error: `Local API request failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported provider' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function pollReplicateResult(predictionId: string, apiKey: string): Promise<any> {
  const maxAttempts = 60;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: { 'Authorization': `Token ${apiKey}` }
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        if (contentType?.includes('application/json')) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch {
            errorMessage = await response.text();
          }
        } else {
          errorMessage = await response.text();
        }
        
        throw new Error(`Polling failed: ${errorMessage}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const responseText = await response.text();
        throw new Error(`Expected JSON response but got: ${contentType}. Response: ${responseText.substring(0, 200)}...`);
      }

      const result = await response.json();

      if (result.status === 'succeeded') {
        return {
          success: true,
          imageUrl: Array.isArray(result.output) ? result.output[0] : result.output
        };
      }

      if (result.status === 'failed') {
        throw new Error(result.error || 'Processing failed');
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Polling failed'
      };
    }
  }

  return { success: false, error: 'Processing timeout' };
}