"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createMagicWandCursor } from "./MagicCursor";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Hand,
  Eye,
  Wand2,
  Loader2,
  Undo,
  Redo,
} from "lucide-react";

export interface ImageData {
  file: File;
  url: string;
  width: number;
  height: number;
}

export interface BrushSettings {
  size: number;
  opacity: number;
  color: string;
  shape: import("./MagicCursor").CursorShape;
}

interface StarParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  rotation: number;
  velocity: { x: number; y: number };
  life: number;
  maxLife: number;
}

interface CanvasHistoryState {
  imageData: globalThis.ImageData;
  maskData: globalThis.ImageData;
}

interface InteractiveCanvasEditorProps {
  imageData: ImageData;
  onMaskChange?: (canvas: HTMLCanvasElement) => void;
  onProcess?: (maskCanvas: HTMLCanvasElement) => void;
  disabled?: boolean;
  brushSettings?: BrushSettings;
  processedImageUrl?: string | null;
  isProcessing?: boolean;
  isAPIConfigured?: boolean;
  maskCanvasRef?: React.RefObject<HTMLCanvasElement>;
}

interface ViewState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

interface DragState {
  isDragging: boolean;
  lastX: number;
  lastY: number;
  startX: number;
  startY: number;
}

export const InteractiveCanvasEditor: React.FC<
  InteractiveCanvasEditorProps
> = ({
  imageData,
  onMaskChange,
  onProcess,
  disabled = false,
  brushSettings = {
    size: 20,
    opacity: 100,
    color: "#ffffff",
    shape: "magic-wand",
  },
  processedImageUrl,
  isProcessing = false,
  isAPIConfigured = false,
  maskCanvasRef: externalMaskCanvasRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 拖拽状态
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    lastX: 0,
    lastY: 0,
    startX: 0,
    startY: 0,
  });

  const maskCanvasRef =
    externalMaskCanvasRef || useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const dragStateRef = useRef(dragState);

  // 同步dragStateRef
  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  // 视图状态
  const [viewState, setViewState] = useState<ViewState>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });

  // 工具状态
  const [tool, setTool] = useState<"brush" | "pan">("brush");
  const [showResult, setShowResult] = useState(false);
  const [previousTool, setPreviousTool] = useState<"brush" | "pan">("brush");
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastDrawPoint, setLastDrawPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // 星星特效状态
  const [stars, setStars] = useState<StarParticle[]>([]);

  // 历史记录状态
  const [history, setHistory] = useState<CanvasHistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const animationFrameRef = useRef<number>();

  // 画布尺寸（原始图片尺寸）
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // 创建星星粒子
  const createStars = useCallback((x: number, y: number, count: number = 3) => {
    const newStars: StarParticle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 1.0;
      const speed = 0.5 + Math.random() * 1.5;
      newStars.push({
        id: Date.now() + i + Math.random() * 1000,
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 30,
        size: 6 + Math.random() * 10,
        opacity: 0.8 + Math.random() * 0.2,
        rotation: Math.random() * Math.PI * 2,
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed - 0.5, // 轻微向上漂移
        },
        life: 0,
        maxLife: 40 + Math.random() * 30,
      });
    }
    setStars((prev) => [...prev, ...newStars]);
  }, []);

  // 动画星星
  const animateStars = useCallback(() => {
    setStars((prev) => {
      const updated = prev
        .map((star) => ({
          ...star,
          x: star.x + star.velocity.x,
          y: star.y + star.velocity.y,
          rotation: star.rotation + 0.1,
          life: star.life + 1,
          opacity: Math.max(0, 1 - star.life / star.maxLife),
        }))
        .filter((star) => star.life < star.maxLife);

      return updated;
    });

    if (stars.length > 0) {
      animationFrameRef.current = requestAnimationFrame(animateStars);
    }
  }, [stars.length]);

  // 当创建星星时开始动画
  useEffect(() => {
    if (stars.length > 0 && !animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(animateStars);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    };
  }, [stars.length, animateStars]);

  // 初始化画布尺寸
  useEffect(() => {
    if (imageData) {
      setCanvasSize({ width: imageData.width, height: imageData.height });
      // 重置视图状态
      setViewState({ scale: 1, offsetX: 0, offsetY: 0 });
    }
  }, [imageData]);

  // 计算适合容器的初始缩放
  const calculateFitScale = useCallback(() => {
    if (!containerRef.current || !imageData) return 1;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const padding = 80; // 增加边距，确保有足够空间

    const availableWidth = containerRect.width - padding;
    const availableHeight = containerRect.height - padding;

    const scaleX = availableWidth / imageData.width;
    const scaleY = availableHeight / imageData.height;

    // 计算合适的缩放比例，但确保不会太小
    const fitScale = Math.min(scaleX, scaleY);

    // 确保最小缩放不低于0.3，最大不超过1.5
    return Math.max(0.3, Math.min(fitScale, 1.5));
  }, [imageData]);

  // 自动适配视图
  const fitToView = useCallback(() => {
    const scale = calculateFitScale();
    setViewState({ scale, offsetX: 0, offsetY: 0 });
  }, [calculateFitScale]);

  // 初始化时自动适配
  useEffect(() => {
    if (imageData) {
      setTimeout(fitToView, 100); // 延迟一下确保容器尺寸已确定
    }
  }, [imageData, fitToView]);

  // 缩放控制
  const handleZoom = useCallback(
    (delta: number, centerX?: number, centerY?: number) => {
      setViewState((prev) => {
        // 更合理的缩放范围：0.2到3，避免图片消失或过大
        const minScale = 0.2;
        const maxScale = 3;
        const newScale = Math.max(
          minScale,
          Math.min(maxScale, prev.scale + delta)
        );

        // 如果缩放值没有变化，直接返回
        if (newScale === prev.scale) return prev;

        if (centerX !== undefined && centerY !== undefined) {
          // 以指定点为中心缩放
          const scaleFactor = newScale / prev.scale;
          const newOffsetX =
            prev.offsetX + (centerX - prev.offsetX) * (1 - scaleFactor);
          const newOffsetY =
            prev.offsetY + (centerY - prev.offsetY) * (1 - scaleFactor);

          return {
            scale: newScale,
            offsetX: newOffsetX,
            offsetY: newOffsetY,
          };
        }

        return { ...prev, scale: newScale };
      });
    },
    []
  );

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;

      // 检查是否在输入框中
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case "+":
        case "=":
          e.preventDefault();
          handleZoom(0.2);
          break;
        case "-":
          e.preventDefault();
          handleZoom(-0.2);
          break;
        case "0":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            fitToView();
          }
          break;
        case "z":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.shiftKey) {
              // 重做操作
              if (historyIndex < history.length - 1) {
                const newIndex = historyIndex + 1;
                const state = history[newIndex];
                if (canvasRef.current && maskCanvasRef.current && state) {
                  const canvas = canvasRef.current;
                  const maskCanvas = maskCanvasRef.current;
                  const ctx = canvas.getContext("2d");
                  const maskCtx = maskCanvas.getContext("2d");
                  if (ctx && maskCtx && state.imageData && state.maskData) {
                    ctx.putImageData(state.imageData, 0, 0);
                    maskCtx.putImageData(state.maskData, 0, 0);
                    setHistoryIndex(newIndex);
                  }
                }
              }
            } else {
              // 撤销操作
              if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                const state = history[newIndex];
                if (canvasRef.current && maskCanvasRef.current && state) {
                  const canvas = canvasRef.current;
                  const maskCanvas = maskCanvasRef.current;
                  const ctx = canvas.getContext("2d");
                  const maskCtx = maskCanvas.getContext("2d");
                  if (ctx && maskCtx && state.imageData && state.maskData) {
                    ctx.putImageData(state.imageData, 0, 0);
                    maskCtx.putImageData(state.maskData, 0, 0);
                    setHistoryIndex(newIndex);
                  }
                }
              }
            }
          }
          break;
        case "y":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            // 重做操作
            if (historyIndex < history.length - 1) {
              const newIndex = historyIndex + 1;
              const state = history[newIndex];
              if (canvasRef.current && maskCanvasRef.current && state) {
                const canvas = canvasRef.current;
                const maskCanvas = maskCanvasRef.current;
                const ctx = canvas.getContext("2d");
                const maskCtx = maskCanvas.getContext("2d");
                if (ctx && maskCtx && state.imageData && state.maskData) {
                  ctx.putImageData(state.imageData, 0, 0);
                  maskCtx.putImageData(state.maskData, 0, 0);
                  setHistoryIndex(newIndex);
                }
              }
            }
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [disabled, handleZoom, fitToView, history, historyIndex]);

  // 自动切换工具：进入Result模式时切换到平移，退出时恢复
  useEffect(() => {
    if (showResult) {
      // 进入Result模式，保存当前工具并切换到平移
      if (tool === "brush") {
        setPreviousTool(tool);
        setTool("pan");
      }
    } else {
      // 退出Result模式，恢复之前的工具
      if (previousTool === "brush" && tool === "pan") {
        setTool(previousTool);
      }
    }
  }, [showResult]); // 移除tool和previousTool依赖，避免循环更新

  // 保存画布状态到历史记录
  const saveState = useCallback(() => {
    if (!canvasRef.current || !maskCanvasRef.current) return;

    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const ctx = canvas.getContext("2d");
    const maskCtx = maskCanvas.getContext("2d");

    if (!ctx || !maskCtx) return;

    const state: CanvasHistoryState = {
      imageData: ctx.getImageData(0, 0, canvas.width, canvas.height),
      maskData: maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height),
    };

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(state);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // 撤销操作
  const undo = useCallback(() => {
    if (historyIndex <= 0) return;

    const newIndex = historyIndex - 1;
    const state = history[newIndex];

    if (!canvasRef.current || !maskCanvasRef.current) return;

    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const ctx = canvas.getContext("2d");
    const maskCtx = maskCanvas.getContext("2d");

    if (!ctx || !maskCtx || !state.imageData || !state.maskData) return;

    ctx.putImageData(state.imageData, 0, 0);
    maskCtx.putImageData(state.maskData, 0, 0);
    setHistoryIndex(newIndex);

    // 撤销/重做时不触发onMaskChange，避免自动处理
    // if (onMaskChange) {
    //   onMaskChange(maskCanvas);
    // }
  }, [history, historyIndex]);

  // 重做操作
  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;

    const newIndex = historyIndex + 1;
    const state = history[newIndex];

    if (!canvasRef.current || !maskCanvasRef.current) return;

    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const ctx = canvas.getContext("2d");
    const maskCtx = maskCanvas.getContext("2d");

    if (!ctx || !maskCtx || !state.imageData || !state.maskData) return;

    ctx.putImageData(state.imageData, 0, 0);
    maskCtx.putImageData(state.maskData, 0, 0);
    setHistoryIndex(newIndex);

    // 撤销/重做时不触发onMaskChange，避免自动处理
    // if (onMaskChange) {
    //   onMaskChange(maskCanvas);
    // }
  }, [history, historyIndex]);

  // 绘制图片到主画布
  useEffect(() => {
    if (!canvasRef.current || !imageData || canvasSize.width === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 保存初始状态
      setTimeout(() => {
        if (maskCanvasRef.current) {
          const maskCtx = maskCanvasRef.current.getContext("2d");
          if (maskCtx) {
            const initialState: CanvasHistoryState = {
              imageData: ctx.getImageData(0, 0, canvas.width, canvas.height),
              maskData: maskCtx.getImageData(
                0,
                0,
                maskCanvasRef.current.width,
                maskCanvasRef.current.height
              ),
            };
            setHistory([initialState]);
            setHistoryIndex(0);
          }
        }
      }, 100);
    };
    img.src = imageData.url;
  }, [imageData, canvasSize]);

  // 初始化蒙版画布
  useEffect(() => {
    if (!maskCanvasRef.current || canvasSize.width === 0) return;

    const canvas = maskCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    // 初始化为透明（不处理区域）
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [canvasSize]);

  // 鼠标滚轮缩放
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();

      // 更精细的滚轮缩放步长，基于当前缩放级别动态调整
      const currentScale = viewState.scale;
      let delta;

      if (currentScale < 0.5) {
        // 小缩放时使用较小步长
        delta = e.deltaY > 0 ? -0.05 : 0.05;
      } else if (currentScale < 1) {
        // 中等缩放时使用中等步长
        delta = e.deltaY > 0 ? -0.08 : 0.08;
      } else {
        // 大缩放时使用较大步长
        delta = e.deltaY > 0 ? -0.12 : 0.12;
      }

      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const centerX = e.clientX - rect.left;
        const centerY = e.clientY - rect.top;
        handleZoom(delta, centerX, centerY);
      }
    },
    [handleZoom, viewState.scale]
  );

  // 坐标转换：屏幕坐标到画布坐标
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };

      const containerX = screenX - rect.left;
      const containerY = screenY - rect.top;

      // 计算画布在容器中的位置
      const canvasDisplayWidth = canvasSize.width * viewState.scale;
      const canvasDisplayHeight = canvasSize.height * viewState.scale;
      const canvasX = (rect.width - canvasDisplayWidth) / 2 + viewState.offsetX;
      const canvasY =
        (rect.height - canvasDisplayHeight) / 2 + viewState.offsetY;

      // 转换到画布坐标
      const x = (containerX - canvasX) / viewState.scale;
      const y = (containerY - canvasY) / viewState.scale;

      return { x, y };
    },
    [canvasSize, viewState]
  );

  // 将十六进制颜色转换为rgba的辅助函数
  const hexToRgb = useCallback((hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 255, g: 255, b: 255 };
  }, []);

  // 在蒙版上绘制单点
  const drawOnMask = useCallback(
    (x: number, y: number) => {
      if (!maskCanvasRef.current) return;

      const ctx = maskCanvasRef.current.getContext("2d");
      if (!ctx) return;

      // 使用自定义颜色进行显示，但在处理时会转换为白色
      ctx.globalCompositeOperation = "source-over";

      const rgb = hexToRgb(brushSettings.color);
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${
        brushSettings.opacity / 100
      })`;

      ctx.beginPath();
      ctx.arc(x, y, brushSettings.size / 2, 0, 2 * Math.PI);
      ctx.fill();
    },
    [brushSettings, hexToRgb, maskCanvasRef]
  );

  // 在两点之间绘制连续线条
  const drawLineBetweenPoints = useCallback(
    (x1: number, y1: number, x2: number, y2: number) => {
      if (!maskCanvasRef.current) return;

      const ctx = maskCanvasRef.current.getContext("2d");
      if (!ctx) return;

      // 使用自定义颜色进行显示
      ctx.globalCompositeOperation = "source-over";

      const rgb = hexToRgb(brushSettings.color);
      ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${
        brushSettings.opacity / 100
      })`;
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${
        brushSettings.opacity / 100
      })`;
      ctx.lineWidth = brushSettings.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // 绘制连接线
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // 在终点绘制圆点，确保连接处平滑
      ctx.beginPath();
      ctx.arc(x2, y2, brushSettings.size / 2, 0, 2 * Math.PI);
      ctx.fill();
    },
    [brushSettings, hexToRgb, maskCanvasRef]
  );

  // 鼠标事件处理
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;

      const { x, y } = screenToCanvas(e.clientX, e.clientY);

      if (tool === "pan") {
        // 平移工具在任何模式下都可用
        setDragState({
          isDragging: true,
          lastX: e.clientX,
          lastY: e.clientY,
          startX: e.clientX,
          startY: e.clientY,
        });
      } else if (tool === "brush" && !showResult) {
        // 画笔工具只在非Result模式下可用
        // 检查是否在画布范围内
        if (
          x >= 0 &&
          x <= canvasSize.width &&
          y >= 0 &&
          y <= canvasSize.height
        ) {
          setIsDrawing(true);
          setLastDrawPoint({ x, y });
          drawOnMask(x, y);
          // 创建星星特效
          createStars(x, y, 2);
        }
      }
    },
    [
      disabled,
      showResult,
      tool,
      screenToCanvas,
      canvasSize,
      createStars,
      drawOnMask,
    ]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;

      const currentDragState = dragStateRef.current;

      if (currentDragState.isDragging && tool === "pan") {
        // 平移操作在任何模式下都可用
        const deltaX = e.clientX - currentDragState.lastX;
        const deltaY = e.clientY - currentDragState.lastY;

        setViewState((prev) => ({
          ...prev,
          offsetX: prev.offsetX + deltaX,
          offsetY: prev.offsetY + deltaY,
        }));

        const newDragState = {
          ...currentDragState,
          lastX: e.clientX,
          lastY: e.clientY,
        };
        setDragState(newDragState);
        dragStateRef.current = newDragState;
      } else if (isDrawing && tool === "brush" && !showResult) {
        // 绘制操作只在非Result模式下可用
        const { x, y } = screenToCanvas(e.clientX, e.clientY);
        if (
          x >= 0 &&
          x <= canvasSize.width &&
          y >= 0 &&
          y <= canvasSize.height
        ) {
          if (lastDrawPoint) {
            drawLineBetweenPoints(lastDrawPoint.x, lastDrawPoint.y, x, y);
          } else {
            drawOnMask(x, y);
          }
          setLastDrawPoint({ x, y });
          // 在绘制时创建星星特效（频率较低）
          if (Math.random() < 0.15) {
            createStars(x, y, 1);
          }
        }
      }
    },
    [
      disabled,
      showResult,
      tool,
      isDrawing,
      lastDrawPoint,
      screenToCanvas,
      canvasSize,
      createStars,
      drawLineBetweenPoints,
      drawOnMask,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setDragState((prev) => ({ ...prev, isDragging: false }));
    if (isDrawing) {
      setIsDrawing(false);
      setLastDrawPoint(null);
      // 绘制完成后保存状态到历史记录
      setTimeout(saveState, 10); // 延迟一点确保绘制完成
    }
  }, [isDrawing, saveState]);

  // 重置蒙版
  const resetMask = useCallback(() => {
    if (!maskCanvasRef.current) return;

    const ctx = maskCanvasRef.current.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(
      0,
      0,
      maskCanvasRef.current.width,
      maskCanvasRef.current.height
    );

    if (onMaskChange) {
      onMaskChange(maskCanvasRef.current);
    }
  }, [onMaskChange]);

  // 计算画布在容器中的显示样式
  const getCanvasStyle = useCallback(() => {
    if (!containerRef.current) return {};

    const rect = containerRef.current.getBoundingClientRect();
    const canvasDisplayWidth = canvasSize.width * viewState.scale;
    const canvasDisplayHeight = canvasSize.height * viewState.scale;

    return {
      width: canvasDisplayWidth,
      height: canvasDisplayHeight,
      left: (rect.width - canvasDisplayWidth) / 2 + viewState.offsetX,
      top: (rect.height - canvasDisplayHeight) / 2 + viewState.offsetY,
    };
  }, [canvasSize, viewState]);

  const canvasStyle = getCanvasStyle();

  return (
    <div className="relative h-full overflow-hidden bg-slate-100">
      {/* 工具栏 */}
      <div className="absolute top-4 left-4 flex items-center gap-2 p-2 rounded-lg shadow-lg bg-white/90 backdrop-blur-sm z-10">
        <Button
          variant={tool === "brush" ? "default" : "ghost"}
          size="sm"
          onClick={() => setTool("brush")}
          disabled={disabled || showResult}
          className="h-8 w-8 p-0"
          title={showResult ? "在查看结果时无法绘制" : "画笔工具"}
        >
          🖌️
        </Button>
        <Button
          variant={tool === "pan" ? "default" : "ghost"}
          size="sm"
          onClick={() => setTool("pan")}
          disabled={disabled}
          className="h-8 w-8 p-0"
          title="平移工具"
        >
          <Hand className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-slate-300" />

        {/* 撤销/重做按钮 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={undo}
          disabled={disabled || historyIndex <= 0}
          className="h-8 w-8 p-0"
          title="撤销 (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={redo}
          disabled={disabled || historyIndex >= history.length - 1}
          className="h-8 w-8 p-0"
          title="重做 (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-slate-300" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleZoom(0.2)}
          disabled={disabled}
          className="h-8 w-8 p-0"
          title="放大 (20%)"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleZoom(-0.2)}
          disabled={disabled}
          className="h-8 w-8 p-0"
          title="缩小 (20%)"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={fitToView}
          disabled={disabled}
          className="h-8 w-8 p-0"
          title="适合视图 (Ctrl+0)"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>

        {/* 1:1 缩放按钮 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setViewState((prev) => ({ ...prev, scale: 1 }))}
          disabled={disabled}
          className="h-8 px-2 text-xs"
          title="原始大小 (100%)"
        >
          1:1
        </Button>

        <div className="w-px h-6 bg-slate-300" />

        <Button
          variant="ghost"
          size="sm"
          onClick={resetMask}
          disabled={disabled}
          className="h-8 px-2"
        >
          Reset
        </Button>

        <div className="w-px h-6 bg-slate-300" />

        <Button
          variant="default"
          size="sm"
          onClick={() => {
            if (onProcess && maskCanvasRef.current) {
              onProcess(maskCanvasRef.current);
            }
          }}
          disabled={disabled || !isAPIConfigured || isProcessing}
          className="h-8 px-3"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-1" />
              Process
            </>
          )}
        </Button>
      </div>

      {/* 视图控制 */}
      <div className="absolute top-4 right-4 flex items-center gap-2 p-2 rounded-lg shadow-lg bg-white/90 backdrop-blur-sm z-10">
        {processedImageUrl && (
          <Button
            variant={showResult ? "default" : "ghost"}
            size="sm"
            onClick={() => setShowResult(!showResult)}
            className="h-8 px-2"
          >
            <Eye className="w-4 h-4 mr-1" />
            Result
          </Button>
        )}
      </div>

      {/* Result模式提示 */}
      {showResult && (
        <div className="absolute top-16 right-4 p-3 rounded-lg shadow-lg bg-blue-50 border border-blue-200 z-10 max-w-xs">
          <div className="flex items-center gap-2 text-blue-700 text-sm">
            <Eye className="w-4 h-4" />
            <span className="font-medium">查看处理结果</span>
          </div>
          <p className="text-blue-600 text-xs mt-1">
            当前正在查看处理后的图片，绘制功能已暂时禁用。点击 Result
            按钮返回编辑模式。
          </p>
        </div>
      )}

      {/* 信息显示 */}
      <div className="absolute select-none bottom-4 left-4 p-2 rounded-lg shadow-lg bg-white/90 backdrop-blur-sm text-xs z-10">
        <div>Scale: {Math.round(viewState.scale * 100)}%</div>
        <div>
          Size: {canvasSize.width} × {canvasSize.height}
        </div>
        <div>Tool: {tool}</div>
      </div>

      {/* 画布容器 */}
      <div
        ref={containerRef}
        className="relative w-full h-full pt-6"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          cursor:
            tool === "pan"
              ? dragState.isDragging
                ? "grabbing"
                : "grab"
              : createMagicWandCursor(
                  brushSettings.shape,
                  Math.max(20, brushSettings.size)
                ),
        }}
      >
        {/* 主图片画布 */}
        <canvas
          ref={canvasRef}
          className="absolute border border-slate-300 shadow-lg"
          style={{
            ...canvasStyle,
            position: "absolute",
            zIndex: 1,
          }}
        />

        {/* 蒙版画布 */}
        <canvas
          ref={maskCanvasRef}
          className="absolute"
          style={{
            ...canvasStyle,
            position: "absolute",
            zIndex: 2,
          }}
        />

        {/* 处理结果画布 */}
        {showResult && processedImageUrl && (
          <img
            src={processedImageUrl}
            alt="Processed result"
            className="absolute border border-green-300 shadow-lg"
            style={{
              ...canvasStyle,
              position: "absolute",
              zIndex: 3,
            }}
          />
        )}

        {/* 星星粒子覆盖层 */}
        <div
          className="absolute pointer-events-none"
          style={{
            ...canvasStyle,
            zIndex: 4,
          }}
        >
          {stars.map((star) => (
            <div
              key={star.id}
              className="absolute text-yellow-400"
              style={{
                left: `${star.x * viewState.scale}px`,
                top: `${star.y * viewState.scale}px`,
                fontSize: `${star.size * viewState.scale}px`,
                opacity: star.opacity,
                transform: `rotate(${star.rotation}rad)`,
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              ✨
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
