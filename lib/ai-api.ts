export interface AIProcessingRequest {
  image: File;
  mask: Blob;
}

export interface AIProcessingResponse {
  processedImageUrl: string;
  success: boolean;
  error?: string;
}

export class AIImageProcessor {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'https://api.replicate.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async processImage(request: AIProcessingRequest): Promise<AIProcessingResponse> {
    try {
      // Convert image and mask to base64
      const imageBase64 = await this.fileToBase64(request.image);
      const maskBase64 = await this.blobToBase64(request.mask);

      const response = await fetch(`${this.baseUrl}/predictions`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: 'your-model-version-here', // Replace with actual model version
          input: {
            image: imageBase64,
            mask: maskBase64,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Poll for completion if needed
      if (result.status === 'starting' || result.status === 'processing') {
        return await this.pollForCompletion(result.id);
      }

      if (result.status === 'succeeded') {
        return {
          processedImageUrl: result.output,
          success: true,
        };
      }

      throw new Error(result.error || 'Processing failed');
    } catch (error) {
      console.error('AI processing error:', error);
      return {
        processedImageUrl: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private async pollForCompletion(predictionId: string): Promise<AIProcessingResponse> {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`${this.baseUrl}/predictions/${predictionId}`, {
          headers: {
            'Authorization': `Token ${this.apiKey}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Polling failed: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.status === 'succeeded') {
          return {
            processedImageUrl: result.output,
            success: true,
          };
        }

        if (result.status === 'failed') {
          throw new Error(result.error || 'Processing failed');
        }

        // Wait 5 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      } catch (error) {
        console.error('Polling error:', error);
        return {
          processedImageUrl: '',
          success: false,
          error: error instanceof Error ? error.message : 'Polling failed',
        };
      }
    }

    return {
      processedImageUrl: '',
      success: false,
      error: 'Processing timeout',
    };
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

// Export a default instance
export const aiProcessor = new AIImageProcessor(
  process.env.NEXT_PUBLIC_REPLICATE_API_KEY || '',
  'https://api.replicate.com/v1'
);