/**
 * 下载相关的工具函数
 */

export type FileType = 'png' | 'jpg' | 'jpeg' | 'webp';
export type QualityType = 'preview' | 'max' | 'original';

/**
 * 下载文件
 * @param url 文件URL或data URL
 * @param filename 文件名
 */
export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 根据结果类型生成文件名
 * @param resultType 结果类型
 * @param quality 质量等级
 * @param fileType 文件类型
 * @returns 生成的文件名
 */
export function generateFileName(
  resultType: 'final' | 'inpaint' | 'background' | 'blur' | 'none',
  quality: QualityType = 'original',
  fileType: FileType = 'png'
): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
  const qualitySuffix = quality !== 'original' ? `-${quality}` : '';
  
  const typeMap = {
    final: 'final-result',
    inpaint: 'processed-image',
    background: 'background-removed',
    blur: 'background-blurred',
    none: 'image'
  };
  
  const baseName = typeMap[resultType] || 'image';
  return `${baseName}${qualitySuffix}-${timestamp}.${fileType}`;
}

/**
 * 下载Canvas内容
 * @param canvas Canvas元素
 * @param filename 文件名
 * @param fileType 文件类型
 * @param quality 图片质量 (0-1)，仅对jpg/jpeg有效
 */
export function downloadCanvas(
  canvas: HTMLCanvasElement,
  filename: string,
  fileType: FileType = 'png',
  quality: number = 0.9
): void {
  const mimeType = `image/${fileType}`;
  const dataURL = canvas.toDataURL(mimeType, quality);
  downloadFile(dataURL, filename);
}

/**
 * 下载图片URL
 * @param imageUrl 图片URL
 * @param filename 文件名
 */
export function downloadImageUrl(imageUrl: string, filename: string): void {
  downloadFile(imageUrl, filename);
}

/**
 * 将Blob转换为下载链接并下载
 * @param blob Blob对象
 * @param filename 文件名
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  downloadFile(url, filename);
  // 清理URL对象
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * 批量下载文件
 * @param downloads 下载项数组
 */
export interface DownloadItem {
  url: string;
  filename: string;
}

export function downloadMultipleFiles(downloads: DownloadItem[], delay: number = 100): void {
  downloads.forEach((item, index) => {
    setTimeout(() => {
      downloadFile(item.url, item.filename);
    }, index * delay);
  });
}

/**
 * 创建ZIP文件并下载（需要JSZip库）
 * 注意：这个函数需要安装jszip依赖才能使用
 * 目前项目中未安装JSZip，所以暂时禁用此功能
 */
export async function downloadAsZip(
  files: Array<{ name: string; content: string | Blob }>,
  zipFilename: string
): Promise<void> {
  console.warn('ZIP download is not available. JSZip dependency is not installed.');

  // 回退到单独下载每个文件
  files.forEach((file, index) => {
    if (typeof file.content === 'string') {
      setTimeout(() => downloadFile(file.content as string, file.name), index * 100);
    }
  });
}

/**
 * 检查浏览器是否支持下载
 * @returns 是否支持下载
 */
export function isDownloadSupported(): boolean {
  const link = document.createElement('a');
  return typeof link.download !== 'undefined';
}

/**
 * 获取文件扩展名
 * @param filename 文件名
 * @returns 文件扩展名
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * 验证文件类型
 * @param filename 文件名
 * @param allowedTypes 允许的文件类型
 * @returns 是否为允许的文件类型
 */
export function isValidFileType(filename: string, allowedTypes: FileType[]): boolean {
  const extension = getFileExtension(filename) as FileType;
  return allowedTypes.includes(extension);
}
