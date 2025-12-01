'use client';

import { useEffect, useRef } from 'react';

interface PreloaderProps {
  isVisible: boolean;
  message?: string;
}

export default function Preloader({ isVisible, message = "INITIALIZING SCANNER" }: PreloaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isVisible || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    let time = 0;
    let lastTime = 0;
    const maxRadius = 55;
    const circleCount = 5;
    const dotCount = 16;

    function animate(timestamp: number) {
      if (!isVisible || !ctx) return;
      
      if (!lastTime) lastTime = timestamp;
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;
      time += deltaTime * 0.001;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Central core
      ctx.beginPath();
      ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 217, 255, 0.9)";
      ctx.fill();
      
      // Expanding circles with dots
      for (let c = 0; c < circleCount; c++) {
        const circlePhase = (time * 0.3 + c / circleCount) % 1;
        const radius = circlePhase * maxRadius;
        const opacity = 1 - circlePhase;
        
        // Circle outline
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 217, 255, ${opacity * 0.15})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Dots around circle
        for (let i = 0; i < dotCount; i++) {
          const angle = (i / dotCount) * Math.PI * 2;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          const size = 2 * (1 - circlePhase * 0.5);
          
          // Radial lines
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(x, y);
          ctx.strokeStyle = `rgba(0, 217, 255, ${opacity * 0.1})`;
          ctx.lineWidth = 1;
          ctx.stroke();
          
          // Dots
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 217, 255, ${opacity * 0.8})`;
          ctx.fill();
        }
      }
      
      requestAnimationFrame(animate);
    }
    
    const animationId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-container">
        <div className="preloader-canvas-container">
          <canvas 
            ref={canvasRef}
            className="preloader-canvas" 
            width="120" 
            height="120"
          />
        </div>
        <div className="loading-text">{message}</div>
      </div>
    </div>
  );
}