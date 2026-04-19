import { useEffect, useRef } from "react";

type TrailPoint = {
  x: number;
  y: number;
  life: number;
  size: number;
};

export function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    let lastX = window.innerWidth * 0.5;
    let lastY = window.innerHeight * 0.2;
    const trail: TrailPoint[] = [];

    const root = document.documentElement;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const pushPoint = (x: number, y: number) => {
      trail.push({
        x,
        y,
        life: 1,
        size: 12 + Math.random() * 20
      });

      if (trail.length > 28) {
        trail.shift();
      }
    };

    const onMove = (event: PointerEvent) => {
      lastX = event.clientX;
      lastY = event.clientY;
      root.style.setProperty("--pointer-x", `${lastX}px`);
      root.style.setProperty("--pointer-y", `${lastY}px`);
      pushPoint(lastX, lastY);
    };

    const onLeave = () => {
      root.style.setProperty("--pointer-x", `50%`);
      root.style.setProperty("--pointer-y", `20%`);
    };

    const roundedRect = (
      context: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      r: number
    ) => {
      context.beginPath();
      context.moveTo(x + r, y);
      context.arcTo(x + w, y, x + w, y + h, r);
      context.arcTo(x + w, y + h, x, y + h, r);
      context.arcTo(x, y + h, x, y, r);
      context.arcTo(x, y, x + w, y, r);
      context.closePath();
    };

    const render = () => {
      frame = window.requestAnimationFrame(render);
      ctx.clearRect(0, 0, width, height);

      for (let i = trail.length - 1; i >= 0; i -= 1) {
        const point = trail[i];
        point.life -= 0.035;

        if (point.life <= 0) {
          trail.splice(i, 1);
          continue;
        }
      }

      if (trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);

        for (let i = 1; i < trail.length; i += 1) {
          const previous = trail[i - 1];
          const current = trail[i];
          const midX = (previous.x + current.x) * 0.5;
          const midY = (previous.y + current.y) * 0.5;
          ctx.quadraticCurveTo(previous.x, previous.y, midX, midY);
        }

        ctx.strokeStyle = "rgba(184, 255, 147, 0.18)";
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }

      trail.forEach((point, index) => {
        const alpha = point.life * (0.25 + index / Math.max(trail.length, 1) * 0.2);
        const squareSize = point.size * point.life;

        ctx.save();
        ctx.translate(point.x, point.y);
        ctx.rotate((1 - point.life) * 1.4);

        const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, squareSize * 1.8);
        glow.addColorStop(0, `rgba(255,255,255,${alpha * 0.9})`);
        glow.addColorStop(0.3, `rgba(180,255,145,${alpha * 0.56})`);
        glow.addColorStop(1, "rgba(180,255,145,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, squareSize * 1.8, 0, Math.PI * 2);
        ctx.fill();

        roundedRect(ctx, -squareSize * 0.5, -squareSize * 0.5, squareSize, squareSize, 4);
        ctx.fillStyle = `rgba(244, 255, 241, ${alpha})`;
        ctx.strokeStyle = `rgba(177, 255, 138, ${alpha * 0.92})`;
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      });

      const pulse = ctx.createRadialGradient(lastX, lastY, 0, lastX, lastY, 180);
      pulse.addColorStop(0, "rgba(255, 255, 255, 0.22)");
      pulse.addColorStop(0.3, "rgba(180, 255, 145, 0.12)");
      pulse.addColorStop(1, "rgba(180, 255, 145, 0)");
      ctx.fillStyle = pulse;
      ctx.beginPath();
      ctx.arc(lastX, lastY, 180, 0, Math.PI * 2);
      ctx.fill();
    };

    resize();
    render();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="trail-canvas" aria-hidden="true" />;
}
