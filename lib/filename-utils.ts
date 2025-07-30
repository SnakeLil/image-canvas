/**
 * 文件名生成和处理相关的工具函数
 */

export type ResultType = 'final' | 'inpaint' | 'background' | 'blur' | 'none';
export type QualityType = 'preview' | 'max' | 'original';
export type FileExtension = 'png' | 'jpg' | 'jpeg' | 'webp' | 'gif' | 'bmp';

/**
 * 生成带时间戳的文件名
 * @param baseName 基础文件名
 * @param extension 文件扩展名
 * @param includeTime 是否包含时间
 * @returns 生成的文件名
 */
export function generateTimestampedFilename(
  baseName: string,
  extension: FileExtension = 'png',
  includeTime: boolean = true
): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const time = includeTime 
    ? now.toISOString().slice(11, 19).replace(/:/g, '-') // HH-MM-SS
    : '';
  
  const timestamp = includeTime ? `${date}_${time}` : date;
  return `${baseName}_${timestamp}.${extension}`;
}

/**
 * 根据处理结果类型生成文件名
 * @param resultType 结果类型
 * @param quality 质量等级
 * @param extension 文件扩展名
 * @param originalName 原始文件名（可选）
 * @returns 生成的文件名
 */
export function generateResultFilename(
  resultType: ResultType,
  quality: QualityType = 'original',
  extension: FileExtension = 'png',
  originalName?: string
): string {
  const typeMap: Record<ResultType, string> = {
    final: 'final-result',
    inpaint: 'processed-image',
    background: 'background-removed',
    blur: 'background-blurred',
    none: 'image'
  };
  
  const baseName = typeMap[resultType] || 'image';
  const qualitySuffix = quality !== 'original' ? `-${quality}` : '';
  const originalSuffix = originalName ? `-${sanitizeFilename(getBaseName(originalName))}` : '';
  
  return generateTimestampedFilename(`${baseName}${qualitySuffix}${originalSuffix}`, extension);
}

/**
 * 清理文件名，移除不安全字符
 * @param filename 原始文件名
 * @returns 清理后的文件名
 */
export function sanitizeFilename(filename: string): string {
  // 移除或替换不安全的字符
  return filename
    .replace(/[<>:"/\\|?*]/g, '-') // 替换不安全字符为连字符
    .replace(/\s+/g, '_') // 替换空格为下划线
    .replace(/-+/g, '-') // 合并多个连字符
    .replace(/_+/g, '_') // 合并多个下划线
    .replace(/^[-_]+|[-_]+$/g, '') // 移除开头和结尾的连字符和下划线
    .slice(0, 100); // 限制长度
}

/**
 * 获取文件的基础名称（不包含扩展名）
 * @param filename 完整文件名
 * @returns 基础名称
 */
export function getBaseName(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex > 0 ? filename.slice(0, lastDotIndex) : filename;
}

/**
 * 获取文件扩展名
 * @param filename 文件名
 * @returns 扩展名（小写，不包含点）
 */
export function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex > 0 ? filename.slice(lastDotIndex + 1).toLowerCase() : '';
}

/**
 * 更改文件扩展名
 * @param filename 原始文件名
 * @param newExtension 新扩展名
 * @returns 更改后的文件名
 */
export function changeFileExtension(filename: string, newExtension: FileExtension): string {
  const baseName = getBaseName(filename);
  return `${baseName}.${newExtension}`;
}

/**
 * 验证文件扩展名是否为图片格式
 * @param filename 文件名
 * @returns 是否为图片格式
 */
export function isImageFile(filename: string): boolean {
  const imageExtensions: FileExtension[] = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'];
  const extension = getFileExtension(filename) as FileExtension;
  return imageExtensions.includes(extension);
}

/**
 * 生成批量下载的文件名
 * @param baseName 基础名称
 * @param index 索引
 * @param total 总数
 * @param extension 扩展名
 * @returns 批量文件名
 */
export function generateBatchFilename(
  baseName: string,
  index: number,
  total: number,
  extension: FileExtension = 'png'
): string {
  const paddedIndex = String(index + 1).padStart(String(total).length, '0');
  return generateTimestampedFilename(`${baseName}_${paddedIndex}`, extension);
}

/**
 * 生成唯一文件名（避免重复）
 * @param filename 原始文件名
 * @param existingNames 已存在的文件名列表
 * @returns 唯一的文件名
 */
export function generateUniqueFilename(filename: string, existingNames: string[]): string {
  if (!existingNames.includes(filename)) {
    return filename;
  }
  
  const baseName = getBaseName(filename);
  const extension = getFileExtension(filename);
  let counter = 1;
  
  while (true) {
    const newFilename = `${baseName}_${counter}.${extension}`;
    if (!existingNames.includes(newFilename)) {
      return newFilename;
    }
    counter++;
  }
}

/**
 * 解析文件名中的质量信息
 * @param filename 文件名
 * @returns 质量类型或null
 */
export function parseQualityFromFilename(filename: string): QualityType | null {
  const baseName = getBaseName(filename).toLowerCase();
  
  if (baseName.includes('-preview')) return 'preview';
  if (baseName.includes('-max')) return 'max';
  if (baseName.includes('-original')) return 'original';
  
  return null;
}

/**
 * 解析文件名中的结果类型
 * @param filename 文件名
 * @returns 结果类型或null
 */
export function parseResultTypeFromFilename(filename: string): ResultType | null {
  const baseName = getBaseName(filename).toLowerCase();
  
  if (baseName.includes('final-result')) return 'final';
  if (baseName.includes('processed-image')) return 'inpaint';
  if (baseName.includes('background-removed')) return 'background';
  if (baseName.includes('background-blurred')) return 'blur';
  
  return 'none';
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化的文件大小字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 生成下载建议的文件名
 * @param resultType 结果类型
 * @param quality 质量
 * @param originalFilename 原始文件名
 * @returns 建议的文件名
 */
export function suggestDownloadFilename(
  resultType: ResultType,
  quality: QualityType,
  originalFilename?: string
): string {
  return generateResultFilename(resultType, quality, 'png', originalFilename);
}
