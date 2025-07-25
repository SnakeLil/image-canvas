// 光标形状类型定义
export type CursorShape = 'magic-wand' | 'star' | 'sparkle' | 'circle' | 'heart' | 'brush';

// 光标形状配置
export const cursorShapes = {
  'magic-wand': { name: '魔法棒', icon: '🪄' },
  'circle': { name: '圆形', icon: '⭕' },
  'brush': { name: '刷子', icon: '🪥' },
} as const;


// 创建魔法棒SVG
const createMagicWandSVG = (size: number): string => `
<svg width="${size}" height="${size}" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve">
<path style="fill:#FFAA7C;" d="M462.897,495.126L199.458,231.688l32.229-32.229l263.439,263.439c8.9,8.9,8.9,23.33,0,32.229l0,0
	C486.226,504.027,471.797,504.027,462.897,495.126z"/>
<path style="fill:#8ECAC1;" d="M130.445,199.107l32.93,32.93c9.868,9.868,25.865,9.868,35.733,0l32.93-32.93
	c9.868-9.868,9.868-25.865,0-35.733l-32.93-32.93c-9.868-9.868-25.865-9.868-35.733,0l-32.93,32.93
	C120.578,173.242,120.578,189.241,130.445,199.107z"/>
<g>
	<path style="fill:#4D3D36;" d="M502.337,455.685L245.158,198.506c2.918-5.219,4.478-11.12,4.478-17.264
		c0-9.474-3.689-18.38-10.388-25.078l-32.929-32.93c-13.828-13.827-36.328-13.829-50.158,0l-32.929,32.929
		c-6.698,6.699-10.388,15.605-10.388,25.079c0,9.473,3.689,18.38,10.388,25.078l32.929,32.93
		c6.914,6.914,15.996,10.371,25.079,10.371c5.956,0,11.909-1.497,17.254-4.471l257.189,257.189
		c6.231,6.231,14.516,9.662,23.327,9.662c8.812,0,17.096-3.431,23.327-9.662c6.231-6.231,9.663-14.514,9.663-23.327
		C512,470.2,508.569,461.916,502.337,455.685z M170.587,224.826l-32.929-32.93l0,0c-2.847-2.846-4.413-6.629-4.413-10.654
		c0-4.025,1.567-7.809,4.413-10.655l32.929-32.929c2.937-2.937,6.796-4.406,10.654-4.406c3.858,0,7.717,1.469,10.654,4.406
		l32.929,32.93c2.847,2.846,4.413,6.629,4.413,10.654c0,4.025-1.567,7.809-4.413,10.654l-32.929,32.929
		C186.021,230.701,176.462,230.699,170.587,224.826z M487.914,487.915c-2.377,2.378-5.539,3.687-8.903,3.687
		c-3.363,0-6.524-1.31-8.903-3.688L213.881,231.688l17.805-17.805l256.226,256.226c2.378,2.378,3.688,5.54,3.688,8.903
		C491.602,482.375,490.292,485.537,487.914,487.915z"/>
	<path style="fill:#4D3D36;" d="M263.695,180.746c0,5.633,4.567,10.199,10.199,10.199h77.397c5.632,0,10.199-4.566,10.199-10.199
		s-4.567-10.199-10.199-10.199h-77.397C268.262,170.546,263.695,175.113,263.695,180.746z"/>
	<path style="fill:#4D3D36;" d="M255.012,116.677c2.611,0,5.22-0.995,7.212-2.987l60.368-60.368c3.983-3.983,3.983-10.441,0-14.425
		c-3.984-3.983-10.44-3.983-14.425,0L247.8,99.266c-3.983,3.983-3.983,10.441,0,14.425
		C249.792,115.682,252.402,116.677,255.012,116.677z"/>
	<path style="fill:#4D3D36;" d="M180.745,23.459c5.632,0,10.199-4.566,10.199-10.199V10.2c0-5.633-4.567-10.199-10.199-10.199
		S170.546,4.567,170.546,10.2v3.06C170.546,18.892,175.112,23.459,180.745,23.459z"/>
	<path style="fill:#4D3D36;" d="M180.745,97.796c5.632,0,10.199-4.566,10.199-10.199V45.897c0-5.633-4.567-10.199-10.199-10.199
		s-10.199,4.566-10.199,10.199v41.699C170.546,93.229,175.112,97.796,180.745,97.796z"/>
	<path style="fill:#4D3D36;" d="M99.061,113.486c1.992,1.992,4.602,2.987,7.212,2.987c2.61,0,5.22-0.995,7.212-2.987
		c3.983-3.983,3.983-10.441,0-14.425L53.116,38.693c-3.984-3.983-10.44-3.983-14.425,0c-3.983,3.983-3.983,10.441,0,14.425
		L99.061,113.486z"/>
	<path style="fill:#4D3D36;" d="M97.795,180.746c0-5.633-4.567-10.199-10.199-10.199H10.199C4.567,170.546,0,175.113,0,180.746
		s4.567,10.199,10.199,10.199h77.397C93.228,190.945,97.795,186.379,97.795,180.746z"/>
	<path style="fill:#4D3D36;" d="M40.723,306.343l-1.827,1.828c-3.982,3.984-3.981,10.442,0.002,14.425
		c1.992,1.991,4.602,2.986,7.211,2.986c2.611,0,5.221-0.996,7.213-2.988l1.827-1.828c3.982-3.984,3.981-10.442-0.002-14.425
		C51.163,302.36,44.707,302.36,40.723,306.343z"/>
	<path style="fill:#4D3D36;" d="M99.312,247.754l-34.062,33.625c-4.009,3.957-4.05,10.414-0.093,14.424
		c1.995,2.021,4.625,3.034,7.258,3.034c2.589,0,5.178-0.979,7.165-2.94l34.062-33.625c4.009-3.957,4.05-10.414,0.093-14.424
		C109.777,243.839,103.319,243.798,99.312,247.754z"/>
	<path style="fill:#4D3D36;" d="M180.745,263.696c-5.632,0-10.199,4.566-10.199,10.199v77.397c0,5.633,4.567,10.199,10.199,10.199
		s10.199-4.566,10.199-10.199v-77.397C190.944,268.262,186.377,263.696,180.745,263.696z"/>
</g>
</svg>
`;
const createBrushSVG = (size: number): string => `
  <svg fill="#ffffff" width="${size}" height="${size}" viewBox="0 0 24 24" id="paint-brush-2" data-name="Flat Color" xmlns="http://www.w3.org/2000/svg" class="icon flat-color"><path id="primary" d="M7.91,11.45a1,1,0,0,1,.7-.71A3.24,3.24,0,0,0,10,9.9a3,3,0,0,0,.74-1.27,1,1,0,0,1,.71-.7,1,1,0,0,1,1,.26l8.68,8.69a3,3,0,1,1-4.23,4.24L8.17,12.41A1,1,0,0,1,7.91,11.45Z" style="fill: rgb(0, 0, 0);"></path><path id="secondary" d="M2.37,3.68a6.42,6.42,0,0,1,9.12.48,4.94,4.94,0,0,1,1.4,3.58,5.12,5.12,0,0,1-1.45,3.57,5.23,5.23,0,0,1-3.25,1.55H7.83a4,4,0,0,1-2.9-1.18A6.4,6.4,0,0,1,3.39,8.26,8.5,8.5,0,0,0,2.18,5,1,1,0,0,1,2.37,3.68Z" style="fill: rgb(44, 169, 188);"></path></svg>
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
    <path d="M12 3l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6l2-6z" fill="url(#sparkleGrad)" opacity="0.9"/>
    <circle cx="6" cy="6" r="1.5" fill="#FFD700" opacity="0.7"/>
    <circle cx="18" cy="6" r="1" fill="#FFA500" opacity="0.6"/>
    <circle cx="6" cy="18" r="1" fill="#FFD700" opacity="0.6"/>
    <circle cx="18" cy="18" r="1.5" fill="#FFA500" opacity="0.7"/>
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

// 创建爱心SVG
const createHeartSVG = (size: number): string => `
  <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FF6B9D"/>
        <stop offset="100%" stop-color="#E91E63"/>
      </linearGradient>
    </defs>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill="url(#heartGrad)"
          stroke="#AD1457"
          stroke-width="1"
          opacity="0.9"/>
    <path d="M8 8c0-.5.5-1 1-1s1 .5 1 1-.5 1-1 1-1-.5-1-1z" fill="#FFB3BA" opacity="0.7"/>
    <path d="M14 8c0-.5.5-1 1-1s1 .5 1 1-.5 1-1 1-1-.5-1-1z" fill="#FFB3BA" opacity="0.7"/>
  </svg>
`;

// 工具函数：根据形状创建光标
export const createMagicWandCursor = (shape: CursorShape = 'magic-wand', size: number = 24): string => {
  let svg: string;

  switch (shape) {
    case 'magic-wand':
      svg = createMagicWandSVG(size);
      break;
    case 'star':
      svg = createStarSVG(size);
      break;
    case 'sparkle':
      svg = createSparkleSVG(size);
      break;
    case 'circle':
      svg = createCircleSVG(size);
      break;
    case 'heart':
      svg = createHeartSVG(size);
      break;
    case 'brush':
      svg = createBrushSVG(size);
      break;
    default:
      svg = createMagicWandSVG(size);
  }

  const encoded = encodeURIComponent(svg);
  return `url("data:image/svg+xml,${encoded}") ${size/2} ${size/2}, auto`;
};