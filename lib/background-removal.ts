// Background removal service using iopaint API

import { BASE_URL } from "@/components/ImageEditor";

export interface BackgroundRemovalOptions {
  model?: 'u2net' | 'u2netp' | 'u2net_human_seg' | 'u2net_cloth_seg' | 'silueta' | 'isnet-general-use' | 'briaai/RMBG-1.4';
}

export interface BackgroundReplacementOptions extends BackgroundRemovalOptions {
  backgroundImage?: string; // base64 encoded background image
  blendMode?: 'normal' | 'multiply' | 'overlay';
}

export interface BackgroundBlurOptions extends BackgroundRemovalOptions {
  blurIntensity?: number; // blur intensity percentage (0-100), default 20
}

// Convert image to base64
export const imageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:image/...;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Convert canvas to base64
export const canvasToBase64 = (canvas: HTMLCanvasElement): string => {
  const dataURL = canvas.toDataURL('image/png');
  // Remove data:image/png;base64, prefix
  return dataURL.split(',')[1];
};

// Convert image URL to base64
export const imageUrlToBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const dataURL = canvas.toDataURL('image/png');
      const base64 = dataURL.split(',')[1];
      resolve(base64);
    };
    img.onerror = reject;
    img.src = url;
  });
};

// Remove background using iopaint API
export const removeBackground = async (
  imageBase64: string,
  options: BackgroundRemovalOptions = {}
): Promise<string> => {
  const { model = 'u2net' } = options;

  try {
    // Use the run_plugin_gen_image API endpoint with RemoveBG plugin
    const requestBody = {
      name: 'RemoveBG',
      image: imageBase64,
      clicks: [],
      scale: 1.0
    };

    const response = await fetch(`${BASE_URL}/api/v1/run_plugin_gen_image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'image/*',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Background removal failed: ${response.statusText} - ${errorText}`);
    }

    // Check if response is JSON or image
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('image')) {
      // Response is an image blob
      const blob_result = await response.blob();

      // Convert blob back to base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob_result);
      });
    } else {
      // Response might be base64 string
      const result = await response.text();
      // If it's already base64, return as is, otherwise assume it's a data URL
      return result.includes(',') ? result.split(',')[1] : result;
    }
  } catch (error) {
    console.error('Background removal error:', error);
    throw error;
  }
};

// Replace background with a new image
export const replaceBackground = async (
  originalImageBase64: string,
  backgroundImageBase64: string,
  options: BackgroundReplacementOptions = {}
): Promise<string> => {
  try {
    // First remove the background
    const removedBgImage = await removeBackground(originalImageBase64, options);
    
    // Then composite with new background
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      const bgImg = new Image();
      const fgImg = new Image();
      let loadedCount = 0;

      const onImageLoad = () => {
        loadedCount++;
        if (loadedCount === 2) {
          // Set canvas size to match the original image
          canvas.width = fgImg.width;
          canvas.height = fgImg.height;

          // Draw background (scaled to fit)
          ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
          
          // Draw foreground (removed background image) on top
          ctx.drawImage(fgImg, 0, 0);

          const resultDataURL = canvas.toDataURL('image/png');
          const resultBase64 = resultDataURL.split(',')[1];
          resolve(resultBase64);
        }
      };

      bgImg.onload = onImageLoad;
      fgImg.onload = onImageLoad;
      
      bgImg.onerror = () => reject(new Error('Failed to load background image'));
      fgImg.onerror = () => reject(new Error('Failed to load foreground image'));

      bgImg.src = `data:image/png;base64,${backgroundImageBase64}`;
      fgImg.src = `data:image/png;base64,${removedBgImage}`;
    });
  } catch (error) {
    console.error('Background replacement error:', error);
    throw error;
  }
};

// Blur background by removing background and compositing with blurred original
export const blurBackground = async (
  originalImageBase64: string,
  options: BackgroundBlurOptions = {}
): Promise<string> => {
  const { blurIntensity = 20 } = options;

  try {
    // First remove the background to get the foreground subject
    const removedBgImage = await removeBackground(originalImageBase64, options);

    // Then composite with blurred original background
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      const originalImg = new Image();
      const foregroundImg = new Image();
      let loadedCount = 0;

      const onImageLoad = () => {
        loadedCount++;
        if (loadedCount === 2) {
          // Set canvas size to match the original image
          canvas.width = originalImg.width;
          canvas.height = originalImg.height;

          // Apply blur filter to the context for background
          const blurAmount = (blurIntensity / 100) * 20; // Convert percentage to pixel blur (max 20px)
          ctx.filter = `blur(${blurAmount}px)`;

          // Draw blurred original image as background
          ctx.drawImage(originalImg, 0, 0);

          // Reset filter for foreground
          ctx.filter = 'none';

          // Draw foreground (removed background image) on top
          ctx.drawImage(foregroundImg, 0, 0);

          const resultDataURL = canvas.toDataURL('image/png');
          const resultBase64 = resultDataURL.split(',')[1];
          resolve(resultBase64);
        }
      };

      originalImg.onload = onImageLoad;
      foregroundImg.onload = onImageLoad;

      originalImg.onerror = () => reject(new Error('Failed to load original image'));
      foregroundImg.onerror = () => reject(new Error('Failed to load foreground image'));

      originalImg.src = `data:image/png;base64,${originalImageBase64}`;
      foregroundImg.src = `data:image/png;base64,${removedBgImage}`;
    });
  } catch (error) {
    console.error('Background blur error:', error);
    throw error;
  }
};

// Apply blur effect to an already processed background-removed image
export const applyBlurToRemovedBackground = async (
  originalImageBase64: string,
  removedBackgroundImageBase64: string,
  blurIntensity: number = 20
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    const originalImg = new Image();
    const foregroundImg = new Image();
    let loadedCount = 0;

    const onImageLoad = () => {
      loadedCount++;
      if (loadedCount === 2) {
        // Set canvas size to match the original image
        canvas.width = originalImg.width;
        canvas.height = originalImg.height;

        // Apply blur filter to the context for background
        const blurAmount = (blurIntensity / 100) * 20; // Convert percentage to pixel blur (max 20px)
        ctx.filter = `blur(${blurAmount}px)`;

        // Draw blurred original image as background
        ctx.drawImage(originalImg, 0, 0);

        // Reset filter for foreground
        ctx.filter = 'none';

        // Draw foreground (removed background image) on top
        ctx.drawImage(foregroundImg, 0, 0);

        const resultDataURL = canvas.toDataURL('image/png');
        const resultBase64 = resultDataURL.split(',')[1];
        resolve(resultBase64);
      }
    };

    originalImg.onload = onImageLoad;
    foregroundImg.onload = onImageLoad;

    originalImg.onerror = () => reject(new Error('Failed to load original image'));
    foregroundImg.onerror = () => reject(new Error('Failed to load foreground image'));

    originalImg.src = `data:image/png;base64,${originalImageBase64}`;
    foregroundImg.src = `data:image/png;base64,${removedBackgroundImageBase64}`;
  });
};

// Real-time blur adjustment (frontend only, no API calls)
export const adjustBlurIntensity = (
  originalImageBase64: string,
  removedBackgroundBase64: string,
  blurIntensity: number = 20
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    const originalImg = new Image();
    const foregroundImg = new Image();
    let loadedCount = 0;

    const onImageLoad = () => {
      loadedCount++;
      if (loadedCount === 2) {
        // Set canvas size to match the original image
        canvas.width = originalImg.width;
        canvas.height = originalImg.height;

        // Apply blur filter to the context for background
        const blurAmount = (blurIntensity / 100) * 20; // Convert percentage to pixel blur (max 20px)
        ctx.filter = `blur(${blurAmount}px)`;

        // Draw blurred original image as background
        ctx.drawImage(originalImg, 0, 0);

        // Reset filter for foreground
        ctx.filter = 'none';

        // Draw foreground (removed background image) on top
        ctx.drawImage(foregroundImg, 0, 0);

        const resultDataURL = canvas.toDataURL('image/png');
        const resultBase64 = resultDataURL.split(',')[1];
        resolve(resultBase64);
      }
    };

    originalImg.onload = onImageLoad;
    foregroundImg.onload = onImageLoad;

    originalImg.onerror = () => reject(new Error('Failed to load original image'));
    foregroundImg.onerror = () => reject(new Error('Failed to load foreground image'));

    originalImg.src = `data:image/png;base64,${originalImageBase64}`;
    foregroundImg.src = `data:image/png;base64,${removedBackgroundBase64}`;
  });
};


// Predefined background images (using placeholder images for now)
export const getDefaultBackgrounds = (): Array<{ name: string; url: string; thumbnail: string }> => {
  return [
    {
      name: 'White Background',
      url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmZmZmZmIiAvPgo8L3N2Zz4=',
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmZmZmZmIiAvPgo8L3N2Zz4='
    },
    {
      name: 'Gradient Blue',
      url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojNGY0NmU1O3N0b3Atb3BhY2l0eToxIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM3YzNhZWQ7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyYWRpZW50KSIgLz4KPC9zdmc+',
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojNGY0NmU1O3N0b3Atb3BhY2l0eToxIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM3YzNhZWQ7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyYWRpZW50KSIgLz4KPC9zdmc+'
    },
    {
      name: 'Gradient Green',
      url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMTBiOTgxO3N0b3Atb3BhY2l0eToxIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMzNGQ0MDA7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyYWRpZW50KSIgLz4KPC9zdmc+',
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMTBiOTgxO3N0b3Atb3BhY2l0eToxIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMzNGQ0MDA7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyYWRpZW50KSIgLz4KPC9zdmc+'
    },
    {
      name: 'Gradient Pink',
      url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZWM0ODk5O3N0b3Atb3BhY2l0eToxIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmOTczMTY7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyYWRpZW50KSIgLz4KPC9zdmc+',
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZWM0ODk5O3N0b3Atb3BhY2l0eToxIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmOTczMTY7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyYWRpZW50KSIgLz4KPC9zdmc+'
    },
    {
      name: 'Sunset Sky',
      url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6I2ZmN2E1YTtzdG9wLW9wYWNpdHk6MSIgLz4KICAgICAgPHN0b3Agb2Zmc2V0PSI1MCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmZjk1MDA7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6I2ZmZGI0ZDtzdG9wLW9wYWNpdHk6MSIgLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JhZGllbnQpIiAvPgo8L3N2Zz4=',
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6I2ZmN2E1YTtzdG9wLW9wYWNpdHk6MSIgLz4KICAgICAgPHN0b3Agb2Zmc2V0PSI1MCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmZjk1MDA7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6I2ZmZGI0ZDtzdG9wLW9wYWNpdHk6MSIgLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JhZGllbnQpIiAvPgo8L3N2Zz4='
    },
    {
      name: 'Ocean Blue',
      url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzBmNzJiNTtzdG9wLW9wYWNpdHk6MSIgLz4KICAgICAgPHN0b3Agb2Zmc2V0PSI1MCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMwZjk0Yjg7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6IzA2YjZkNDtzdG9wLW9wYWNpdHk6MSIgLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JhZGllbnQpIiAvPgo8L3N2Zz4=',
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzBmNzJiNTtzdG9wLW9wYWNpdHk6MSIgLz4KICAgICAgPHN0b3Agb2Zmc2V0PSI1MCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMwZjk0Yjg7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6IzA2YjZkNDtzdG9wLW9wYWNpdHk6MSIgLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JhZGllbnQpIiAvPgo8L3N2Zz4='
    },
    {
      name: 'Black Background',
      url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMDAwMDAwIiAvPgo8L3N2Zz4=',
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMDAwMDAwIiAvPgo8L3N2Zz4='
    },
    {
      name: 'Transparent',
      url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIHWNgAAIAAAUAAY27m/MAAAAASUVORK5CYII=',
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxwYXR0ZXJuIGlkPSJjaGVja2VyYm9hcmQiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CiAgICAgIDxyZWN0IGZpbGw9IiNmZmYiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIvPgogICAgICA8cmVjdCBmaWxsPSIjZGRkIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiLz4KICAgICAgPHJlY3QgZmlsbD0iI2RkZCIgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiLz4KICAgIDwvcGF0dGVybj4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNjaGVja2VyYm9hcmQpIiAvPgo8L3N2Zz4='
    }
  ];
};
