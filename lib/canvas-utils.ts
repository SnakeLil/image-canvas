export interface Point {
  x: number;
  y: number;
}

export class CanvasUtils {
  static resizeCanvas(canvas: HTMLCanvasElement, maxWidth: number, maxHeight: number): { width: number; height: number } {
    const aspectRatio = canvas.width / canvas.height;
    
    let newWidth = maxWidth;
    let newHeight = maxWidth / aspectRatio;
    
    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = maxHeight * aspectRatio;
    }
    
    return { width: newWidth, height: newHeight };
  }

  static drawSmoothLine(
    ctx: CanvasRenderingContext2D,
    points: Point[],
    brushSize: number,
    opacity: number
  ): void {
    if (points.length < 2) return;

    ctx.globalAlpha = opacity;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.y + curr.y) / 2;
      
      ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
    }

    ctx.stroke();
  }

  static createMaskFromCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement {
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    
    const ctx = canvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d');
    
    if (!ctx || !maskCtx) return maskCanvas;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Convert to grayscale mask
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = avg;     // Red
      data[i + 1] = avg; // Green
      data[i + 2] = avg; // Blue
      // Alpha remains the same
    }
    
    maskCtx.putImageData(imageData, 0, 0);
    return maskCanvas;
  }

  static compressImage(file: File, maxWidth: number, maxHeight: number, quality: number = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const { width, height } = CanvasUtils.resizeCanvas(
          { width: img.width, height: img.height } as HTMLCanvasElement,
          maxWidth,
          maxHeight
        );
        
        canvas.width = width;
        canvas.height = height;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            quality
          );
        } else {
          reject(new Error('Failed to get canvas context'));
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }
}