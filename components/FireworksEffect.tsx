'use client';

import React, { useEffect, useRef, useCallback, useMemo } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface FireworksEffectProps {
  isActive: boolean;
  onComplete?: () => void;
  containerRef?: React.RefObject<HTMLElement>;
}

export const FireworksEffect: React.FC<FireworksEffectProps> = ({
  isActive,
  onComplete,
  containerRef
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const startTimeRef = useRef<number>(0);

  const colors = useMemo(() => [
    '#FFD700', // Gold
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FFEAA7', // Yellow
    '#DDA0DD', // Plum
    '#98D8C8', // Mint
    '#FF9FF3', // Pink
    '#54A0FF', // Light Blue
    '#5F27CD', // Purple
    '#00D2D3', // Cyan
  ], []);

  const createParticles = useCallback((centerX: number, centerY: number, count: number = 20) => {
    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.8;
      const velocity = 3 + Math.random() * 4;

      const maxLife = 80 + Math.random() * 60;
      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: maxLife, // Start with full life
        maxLife: maxLife,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 4,
      });
    }

    return particles;
  }, [colors]);

  const updateParticles = useCallback((particles: Particle[]) => {
    return particles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.1; // gravity
      particle.vx *= 0.99; // air resistance
      particle.life -= 0.8; // Slower life decay (was 1, now 0.8)

      return particle.life > 0;
    });
  }, []);

  const drawParticles = useCallback((ctx: CanvasRenderingContext2D, particles: Particle[]) => {
    particles.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }, []);

  const animate = useCallback((timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;



    // Clear canvas with transparent background
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvas.width / dpr;
    const displayHeight = canvas.height / dpr;

    // Save the current state
    ctx.save();
    // Set composite operation to ensure we only clear our own content
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, displayWidth, displayHeight);
    // Restore the state
    ctx.restore();



    const elapsed = timestamp - startTimeRef.current;

    // Create new fireworks every 150ms for the first 1.2 seconds
    if (elapsed < 1200 && elapsed % 150 < 16) {
      // Use display size for positioning (not actual canvas size)
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = canvas.width / dpr;
      const displayHeight = canvas.height / dpr;

      const centerX = displayWidth / 2 + (Math.random() - 0.5) * 120;
      const centerY = displayHeight / 2 + (Math.random() - 0.5) * 80;
      const newParticles = createParticles(centerX, centerY);
      particlesRef.current.push(...newParticles);


    }

    // Update and draw particles
    particlesRef.current = updateParticles(particlesRef.current);
    drawParticles(ctx, particlesRef.current);



    // Continue animation if there are particles or we're still in the creation phase
    if (particlesRef.current.length > 0 || elapsed < 1200) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      // Animation complete

      onComplete?.();
    }
  }, [createParticles, updateParticles, drawParticles, onComplete]);

  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Reset state
    particlesRef.current = [];
    startTimeRef.current = 0;

    // Set canvas size and position to match container
    const container = containerRef?.current;
    if (container) {
      const rect = container.getBoundingClientRect();

      // Set actual canvas resolution (important for crisp rendering)
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      // Scale the context to match device pixel ratio
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      // Position canvas to fill the container
      canvas.style.position = 'absolute';
      canvas.style.left = '0px';
      canvas.style.top = '0px';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '10';
      canvas.style.backgroundColor = 'transparent';




    } else {
      canvas.width = 300;
      canvas.height = 300;
    }

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, containerRef, onComplete, animate]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none"
    />
  );
};
