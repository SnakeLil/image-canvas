// AI Services for Image Inpainting and Object Removal
export interface InpaintingRequest {
  image: File | Blob;
  mask: Blob;
  prompt?: string;
}

export interface InpaintingResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

// Unified API service that uses Next.js API route to avoid CORS
export class UnifiedInpaintingService {
  async removeObjects(
    request: InpaintingRequest,
    provider: 'replicate' | 'huggingface' | 'local',
    config: { apiKey?: string; baseUrl?: string }
  ): Promise<InpaintingResponse> {
    try {
      const formData = new FormData();
      formData.append('provider', provider);
      formData.append('image', request.image);
      formData.append('mask', request.mask);
      
      if (request.prompt) {
        formData.append('prompt', request.prompt);
      }
      
      if (config.apiKey) {
        formData.append('apiKey', config.apiKey);
      }
      
      if (config.baseUrl) {
        formData.append('baseUrl', config.baseUrl);
      }

      const response = await fetch('/api/inpaint', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Inpainting service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Factory function to create the service
export function createInpaintingService() {
  return new UnifiedInpaintingService();
}