// 光标形状类型定义
export type CursorShape =
  | "magic-wand"
  | "star"
  | "sparkle"
  | "circle"
  | "heart"
  | "brush";

// 光标形状配置
export const cursorShapes = {
  "magic-wand": { name: "魔法棒", icon: "🪄" },
  star: { name: "星星", icon: "⭐" },
  sparkle: { name: "闪光", icon: "✨" },
  circle: { name: "圆形", icon: "⭕" },
  brush: { name: "刷子", icon: "🪥" },
} as const;

// 创建魔法棒SVG
const createMagicWandSVG = (size: number): string => `
  <svg width="${size}" height="${size}" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 393.9 393.9" style="enable-background:new 0 0 393.9 393.9;" xml:space="preserve">
<g>
	<polygon style="fill:#B6CCE0;" points="393.895,367.03 367.025,393.9 157.725,184.6 157.725,184.59 184.595,157.73 	"/>
	<path style="fill:#E59683;" d="M184.595,157.73l-26.87,26.86v0.01l-47.38-47.38c-7.42-7.42-7.42-19.45,0-26.87
		c3.71-3.71,8.57-5.57,13.43-5.57c4.87,0,9.73,1.86,13.44,5.57L184.595,157.73z"/>
</g>
<path style="fill:#C4C2B7;" d="M129.345,63.19c-5.523,0-10-4.477-10-10V10c0-5.523,4.477-10,10-10c5.523,0,10,4.477,10,10v43.19
	C139.345,58.713,134.868,63.19,129.345,63.19z"/>
<path style="fill:#C4C2B7;" d="M129.345,258.68c-5.523,0-10-4.477-10-10v-43.19c0-5.523,4.477-10,10-10c5.523,0,10,4.477,10,10
	v43.19C139.345,254.203,134.868,258.68,129.345,258.68z"/>
<path style="fill:#C4C2B7;" d="M75.495,85.5c-2.559,0-5.119-0.976-7.071-2.929l-30.54-30.54c-3.905-3.905-3.905-10.237,0-14.142
	c3.905-3.905,10.237-3.905,14.143,0l30.54,30.54c3.905,3.905,3.905,10.237,0,14.142C80.614,84.524,78.054,85.5,75.495,85.5z"/>
<path style="fill:#C4C2B7;" d="M53.195,139.34h-43.19c-5.523,0-10-4.477-10-10s4.477-10,10-10h43.19c5.523,0,10,4.477,10,10
	S58.718,139.34,53.195,139.34z"/>
<path style="fill:#C4C2B7;" d="M248.685,139.34h-43.19c-5.523,0-10-4.477-10-10s4.477-10,10-10h43.19c5.523,0,10,4.477,10,10
	S254.208,139.34,248.685,139.34z"/>
<path style="fill:#C4C2B7;" d="M44.955,223.73c-2.56,0-5.118-0.976-7.071-2.929c-3.905-3.905-3.905-10.237,0-14.142l30.54-30.54
	c3.905-3.904,10.237-3.905,14.142,0s3.905,10.237,0,14.142l-30.54,30.54C50.074,222.753,47.514,223.73,44.955,223.73z"/>
<path style="fill:#C4C2B7;" d="M183.185,85.5c-2.559,0-5.119-0.976-7.071-2.929c-3.905-3.905-3.905-10.237,0-14.142l30.54-30.54
	c3.905-3.905,10.237-3.905,14.143,0c3.905,3.905,3.905,10.237,0,14.142l-30.54,30.54C188.304,84.524,185.744,85.5,183.185,85.5z"/>
</svg>
`;

// 创建星星SVG
const createStarSVG = (size: number): string => `
  <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          fill="#FFD700"
          stroke="#FFA500"
          stroke-width="1"
          filter="url(#glow)"/>
    <circle cx="12" cy="12" r="1" fill="#FFF" opacity="0.8"/>
  </svg>
`;

// 创建闪光SVG
const createSparkleSVG = (size: number): string => `
  <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="sparkleGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#FFD700"/>
        <stop offset="100%" stop-color="#FFA500"/>
      </radialGradient>
    </defs>
    <!-- 中心闪光 -->
    <path d="M12 3l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6l2-6z" fill="url(#sparkleGrad)" opacity="0.9"/>
    <!-- 小闪光点 -->
    <circle cx="6" cy="6" r="1.5" fill="#FFD700" opacity="0.7"/>
    <circle cx="18" cy="6" r="1" fill="#FFA500" opacity="0.6"/>
    <circle cx="6" cy="18" r="1" fill="#FFD700" opacity="0.6"/>
    <circle cx="18" cy="18" r="1.5" fill="#FFA500" opacity="0.7"/>
    <!-- 十字闪光 -->
    <path d="M12 1v4M12 19v4M1 12h4M19 12h4" stroke="#FFD700" stroke-width="1.5" stroke-linecap="round" opacity="0.8"/>
  </svg>
`;

// 创建圆形SVG
const createCircleSVG = (size: number): string => `
  <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="circleGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#4FC3F7"/>
        <stop offset="100%" stop-color="#29B6F6"/>
      </radialGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#circleGrad)" stroke="#0277BD" stroke-width="2" opacity="0.8"/>
    <circle cx="12" cy="12" r="6" fill="#E1F5FE" opacity="0.6"/>
    <circle cx="12" cy="12" r="2" fill="#0277BD" opacity="0.9"/>
  </svg>
`;

// 创建动态圆形SVG（支持颜色和透明度）
const createDynamicCircleSVG = (size: number, color: string, opacity: number): string => {
  const radius = size / 2 - 1; // 留出边框空间
  const centerX = size / 2;
  const centerY = size / 2;

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="0" stdDeviation="1" flood-color="rgba(0,0,0,0.3)"/>
        </filter>
      </defs>
      <circle cx="${centerX}" cy="${centerY}" r="${radius + 1}" fill="${color}" opacity="${0.6}"/>
    </svg>
  `;
};

// 创建爱心SVG
const createBrushSVG = (size: number): string => `
  <svg width="${size}" height="${size}" fill="#000000" viewBox="0 0 24 24" id="paint-brush-2" data-name="Flat Color" xmlns="http://www.w3.org/2000/svg" class="icon flat-color"><path id="primary" d="M7.91,11.45a1,1,0,0,1,.7-.71A3.24,3.24,0,0,0,10,9.9a3,3,0,0,0,.74-1.27,1,1,0,0,1,.71-.7,1,1,0,0,1,1,.26l8.68,8.69a3,3,0,1,1-4.23,4.24L8.17,12.41A1,1,0,0,1,7.91,11.45Z" style="fill: rgb(0, 0, 0);"></path><path id="secondary" d="M2.37,3.68a6.42,6.42,0,0,1,9.12.48,4.94,4.94,0,0,1,1.4,3.58,5.12,5.12,0,0,1-1.45,3.57,5.23,5.23,0,0,1-3.25,1.55H7.83a4,4,0,0,1-2.9-1.18A6.4,6.4,0,0,1,3.39,8.26,8.5,8.5,0,0,0,2.18,5,1,1,0,0,1,2.37,3.68Z" style="fill: rgb(44, 169, 188);"></path></svg>
`;

// 工具函数：根据形状创建光标
export const createMagicWandCursor = (
  shape: CursorShape = "magic-wand",
  size: number = 24
): string => {
  let svg: string;

  switch (shape) {
    case "magic-wand":
      svg = createMagicWandSVG(size);
      break;
    case "star":
      svg = createStarSVG(size);
      break;
    case "sparkle":
      svg = createSparkleSVG(size);
      break;
    case "circle":
      svg = createCircleSVG(size);
      break;
    case "brush":
      svg = createBrushSVG(size);
      break;
    default:
      svg = createMagicWandSVG(size);
  }

  // 编码SVG并返回CSS光标字符串
  const encoded = encodeURIComponent(svg);
  return `url("data:image/svg+xml,${encoded}") ${size / 2} ${size / 2}, auto`;
};

// 工具函数：创建动态圆形光标（支持颜色和透明度）
export const createDynamicCircleCursor = (
  size: number = 24,
  color: string = "#ff3333",
  opacity: number = 100
): string => {
  const svg = createDynamicCircleSVG(size, color, opacity);

  // 编码SVG并返回CSS光标字符串
  const encoded = encodeURIComponent(svg);
  return `url("data:image/svg+xml,${encoded}") ${size / 2} ${size / 2}, auto`;
};
