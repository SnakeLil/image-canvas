/**
 * 颜色处理相关的工具函数
 */

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface HSLColor {
  h: number;
  s: number;
  l: number;
}

/**
 * 预设颜色常量
 */
export const PRESET_COLORS = [
  '#ffffff', '#000000', '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#6b7280', '#374151', '#1f2937'
] as const;

/**
 * 常用背景颜色
 */
export const BACKGROUND_COLORS = [
  { name: "White", color: "#ffffff" },
  { name: "Black", color: "#000000" },
  { name: "Blue", color: "#3b82f6" },
  { name: "Green", color: "#10b981" },
  { name: "Red", color: "#ef4444" },
  { name: "Purple", color: "#8b5cf6" },
  { name: "Yellow", color: "#f59e0b" },
  { name: "Gray", color: "#6b7280" },
] as const;

/**
 * 将十六进制颜色转换为RGB
 * @param hex 十六进制颜色值 (如: #ff0000)
 * @returns RGB颜色对象
 */
export function hexToRgb(hex: string): RGBColor | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * 将RGB颜色转换为十六进制
 * @param rgb RGB颜色对象
 * @returns 十六进制颜色值
 */
export function rgbToHex(rgb: RGBColor): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * 将RGB转换为HSL
 * @param rgb RGB颜色对象
 * @returns HSL颜色对象
 */
export function rgbToHsl(rgb: RGBColor): HSLColor {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * 将HSL转换为RGB
 * @param hsl HSL颜色对象
 * @returns RGB颜色对象
 */
export function hslToRgb(hsl: HSLColor): RGBColor {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

/**
 * 计算颜色的亮度
 * @param color 十六进制颜色值或RGB对象
 * @returns 亮度值 (0-1)
 */
export function getLuminance(color: string | RGBColor): number {
  const rgb = typeof color === 'string' ? hexToRgb(color) : color;
  if (!rgb) return 0;

  const { r, g, b } = rgb;
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * 判断颜色是否为深色
 * @param color 十六进制颜色值或RGB对象
 * @returns 是否为深色
 */
export function isDarkColor(color: string | RGBColor): boolean {
  return getLuminance(color) < 0.5;
}

/**
 * 获取对比色（黑色或白色）
 * @param color 十六进制颜色值或RGB对象
 * @returns 对比色（#000000 或 #ffffff）
 */
export function getContrastColor(color: string | RGBColor): string {
  return isDarkColor(color) ? '#ffffff' : '#000000';
}

/**
 * 调整颜色亮度
 * @param color 十六进制颜色值
 * @param amount 调整量 (-100 到 100)
 * @returns 调整后的颜色
 */
export function adjustBrightness(color: string, amount: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  const adjust = (value: number) => {
    const adjusted = value + (amount * 255 / 100);
    return Math.max(0, Math.min(255, adjusted));
  };

  return rgbToHex({
    r: adjust(rgb.r),
    g: adjust(rgb.g),
    b: adjust(rgb.b)
  });
}

/**
 * 生成颜色的透明版本
 * @param color 十六进制颜色值
 * @param alpha 透明度 (0-1)
 * @returns RGBA颜色字符串
 */
export function addAlpha(color: string, alpha: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  const clampedAlpha = Math.max(0, Math.min(1, alpha));
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clampedAlpha})`;
}

/**
 * 验证十六进制颜色格式
 * @param color 颜色字符串
 * @returns 是否为有效的十六进制颜色
 */
export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * 生成随机颜色
 * @returns 随机的十六进制颜色值
 */
export function generateRandomColor(): string {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

/**
 * 创建纯色Canvas
 * @param width 宽度
 * @param height 高度
 * @param color 颜色
 * @returns Canvas的data URL
 */
export function createSolidColorCanvas(width: number, height: number, color: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
  }
  
  return canvas.toDataURL();
}
