/**
 * Confetti Celebration Effect
 * 
 * Particle explosion for victories, achievements, and big moments.
 * Uses canvas for performance with 100+ particles.
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  gravity: number;
  drag: number;
}

interface ConfettiCelebrationProps {
  isActive?: boolean;
  particleCount?: number;
  duration?: number;
  colors?: readonly string[];
  onComplete?: () => void;
}

const DEFAULT_COLORS: readonly string[] = [
  '#ffd700', // Gold
  '#00ffff', // Cyan
  '#ff6b00', // Orange
  '#ff00ff', // Magenta
  '#00ff00', // Green
  '#0080ff', // Blue
];

export function ConfettiCelebration({
  isActive = true,
  particleCount = 150,
  duration = 4000,
  colors = DEFAULT_COLORS,
  onComplete,
}: ConfettiCelebrationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number | undefined>(undefined);

  const createParticle = useCallback((canvasWidth: number, canvasHeight: number): Particle => {
    const colorIndex = Math.floor(Math.random() * colors.length);
    const color: string = Array.isArray(colors) && colors[colorIndex] ? colors[colorIndex] : DEFAULT_COLORS[0];
    
    return {
      x: canvasWidth / 2, // Start from center
      y: canvasHeight / 2,
      vx: (Math.random() - 0.5) * 20, // Spread horizontally
      vy: (Math.random() - 1) * 20 - 5, // Launch upward
      size: Math.random() * 8 + 4,
      color,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      gravity: 0.5,
      drag: 0.96,
    };
  }, [colors]);

  const updateParticle = useCallback((particle: Particle): Particle => {
    return {
      ...particle,
      x: particle.x + particle.vx,
      y: particle.y + particle.vy,
      vx: particle.vx * particle.drag,
      vy: (particle.vy + particle.gravity) * particle.drag,
      rotation: particle.rotation + particle.rotationSpeed,
    };
  }, []);

  const drawParticle = useCallback((ctx: CanvasRenderingContext2D, particle: Particle) => {
    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate((particle.rotation * Math.PI) / 180);
    
    ctx.fillStyle = particle.color;
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 10;
    
    // Draw diamond shape
    ctx.beginPath();
    ctx.moveTo(0, -particle.size);
    ctx.lineTo(particle.size, 0);
    ctx.lineTo(0, particle.size);
    ctx.lineTo(-particle.size, 0);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }, []);

  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create initial particles
    particlesRef.current = Array.from({ length: particleCount }, () =>
      createParticle(canvas.width, canvas.height)
    );

    startTimeRef.current = Date.now();

    // Animation loop
    const animate = () => {
      if (!ctx || !startTimeRef.current) return;

      const elapsed = Date.now() - startTimeRef.current;
      
      // Clear canvas with fade effect for trails
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particlesRef.current = particlesRef.current
        .map(updateParticle)
        .filter(particle => {
          // Remove particles that are off-screen or too slow
          const isVisible = particle.y < canvas.height && particle.vy < 15;
          return isVisible;
        });

      particlesRef.current.forEach(particle => {
        drawParticle(ctx, particle);
      });

      // Check if animation should end
      if (elapsed < duration && particlesRef.current.length > 0) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onComplete?.();
      }
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, particleCount, duration, colors, createParticle, updateParticle, drawParticle, onComplete]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-50 pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}

// Simpler CSS-based version for lightweight use
export function SimpleConfetti({ isActive = true }: { isActive?: boolean }) {
  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-3 h-3 rounded-sm"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-20px',
            backgroundColor: DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)],
            animation: `confetti-fall ${2 + Math.random() * 3}s linear forwards`,
            animationDelay: `${Math.random() * 2}s`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

// Victory celebration wrapper
export function VictoryCelebration({ 
  showConfetti = true,
  children 
}: { 
  showConfetti?: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      {showConfetti && <ConfettiCelebration isActive={showConfetti} />}
      {children}
    </>
  );
}
