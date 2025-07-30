/**
 * 图片处理相关的工具函数
 */

export interface Dimensions {
  width: number;
  height: number;
}

export interface ObjectCoverResult {
  drawWidth: number;
  drawHeight: number;
  drawX: number;
  drawY: number;
}

/**
 * 计算保持宽高比的尺寸调整
 * @param originalDimensions 原始尺寸
 * @param maxWidth 最大宽度
 * @param maxHeight 最大高度
 * @returns 调整后的尺寸
 */
export function calculateAspectRatioFit(
  originalDimensions: Dimensions,
  maxWidth: number,
  maxHeight: number
): Dimensions {
  const { width, height } = originalDimensions;
  const aspectRatio = width / height;
  
  let newWidth = Math.min(width, maxWidth);
  let newHeight = newWidth / aspectRatio;
  
  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = newHeight * aspectRatio;
  }
  
  return { width: newWidth, height: newHeight };
}

/**
 * 计算object-cover效果的绘制参数
 * @param imageDimensions 图片尺寸
 * @param containerDimensions 容器尺寸
 * @returns object-cover绘制参数
 */
export function calculateObjectCover(
  imageDimensions: Dimensions,
  containerDimensions: Dimensions
): ObjectCoverResult {
  const imageAspectRatio = imageDimensions.width / imageDimensions.height;
  const containerAspectRatio = containerDimensions.width / containerDimensions.height;
  
  let drawWidth: number, drawHeight: number, drawX: number, drawY: number;
  
  if (imageAspectRatio > containerAspectRatio) {
    // 图片更宽 - 适配高度并裁剪两侧
    drawHeight = containerDimensions.height;
    drawWidth = containerDimensions.height * imageAspectRatio;
    drawX = (containerDimensions.width - drawWidth) / 2;
    drawY = 0;
  } else {
    // 图片更高 - 适配宽度并裁剪上下
    drawWidth = containerDimensions.width;
    drawHeight = containerDimensions.width / imageAspectRatio;
    drawX = 0;
    drawY = (containerDimensions.height - drawHeight) / 2;
  }
  
  return { drawWidth, drawHeight, drawX, drawY };
}

/**
 * 根据最长边计算缩放后的尺寸
 * @param originalDimensions 原始尺寸
 * @param maxLongestSide 最长边的最大值
 * @returns 缩放后的尺寸
 */
export function calculateScaleByLongestSide(
  originalDimensions: Dimensions,
  maxLongestSide: number
): Dimensions {
  const { width, height } = originalDimensions;
  const aspectRatio = width / height;
  
  let newWidth: number, newHeight: number;
  
  if (width > height) {
    // 宽度是最长边
    newWidth = Math.min(width, maxLongestSide);
    newHeight = Math.round(newWidth / aspectRatio);
  } else {
    // 高度是最长边
    newHeight = Math.min(height, maxLongestSide);
    newWidth = Math.round(newHeight * aspectRatio);
  }
  
  return { width: newWidth, height: newHeight };
}

/**
 * 计算不同质量等级的尺寸
 * @param originalDimensions 原始尺寸
 * @returns 不同质量等级的尺寸
 */
export function calculateQualityDimensions(originalDimensions?: Dimensions) {
  if (!originalDimensions) {
    return {
      preview: { width: 800, height: 600 },
      max: { width: 1920, height: 1080 }
    };
  }
  
  const preview = calculateScaleByLongestSide(originalDimensions, 800);
  const max = calculateScaleByLongestSide(originalDimensions, 1920);
  
  return { preview, max };
}

/**
 * 将File转换为base64字符串
 * @param file 文件对象
 * @returns base64字符串（不包含data:前缀）
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // 移除 data:image/...;base64, 前缀
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 将Blob转换为base64字符串
 * @param blob Blob对象
 * @returns base64字符串（包含data:前缀）
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * 将Canvas转换为base64字符串
 * @param canvas Canvas元素
 * @param format 图片格式，默认为'image/png'
 * @returns base64字符串（不包含data:前缀）
 */
export function canvasToBase64(canvas: HTMLCanvasElement, format: string = 'image/png'): string {
  const dataURL = canvas.toDataURL(format);
  // 移除 data:image/...;base64, 前缀
  return dataURL.split(',')[1];
}

/**
 * 将Canvas转换为完整的data URL
 * @param canvas Canvas元素
 * @param format 图片格式，默认为'image/png'
 * @returns 完整的data URL
 */
export function canvasToDataURL(canvas: HTMLCanvasElement, format: string = 'image/png'): string {
  return canvas.toDataURL(format);
}

/**
 * 加载图片并返回Image对象
 * @param src 图片源
 * @param crossOrigin 是否设置跨域
 * @returns Promise<HTMLImageElement>
 */
export function loadImage(src: string, crossOrigin: boolean = true): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * 压缩图片
 * @param file 原始文件
 * @param maxWidth 最大宽度
 * @param maxHeight 最大高度
 * @param quality 压缩质量 (0-1)
 * @returns 压缩后的Blob
 */
export function compressImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const { width, height } = calculateAspectRatioFit(
        { width: img.width, height: img.height },
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
