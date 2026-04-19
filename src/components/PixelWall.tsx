import { useEffect, useRef } from "react";

type Block = {
  x: number;
  y: number;
  w: number;
  h: number;
  tint: number;
};

type TrailPoint = {
  x: number;
  y: number;
  life: number;
};

export function PixelWall() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const step = 8;
    const cell = 7;
    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;
    let raf = 0;
    let previous = 0;
    let pointerX = window.innerWidth * 0.5;
    let pointerY = window.innerHeight * 0.3;

    let base = new Float32Array(0);
    let drift = new Float32Array(0);
    let blocks: Block[] = [];
    let trail: TrailPoint[] = [];

    const seeded = (x: number, y: number) => {
      const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      return value - Math.floor(value);
    };

    const rebuild = () => {
      cols = Math.ceil(width / step) + 2;
      rows = Math.ceil(height / step) + 2;
      base = new Float32Array(cols * rows);
      drift = new Float32Array(cols * rows);
      blocks = [];

      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const index = y * cols + x;
          const coarse = seeded(Math.floor(x / 4), Math.floor(y / 4));
          const fine = seeded(x * 0.83, y * 1.11);
          base[index] = 0.08 + coarse * 0.1 + fine * 0.035;
          drift[index] = seeded(x * 0.17, y * 0.37);
        }
      }

      const blockCount = Math.floor((cols * rows) / 180);
      for (let i = 0; i < blockCount; i += 1) {
        blocks.push({
          x: Math.floor(seeded(i, 2.1) * cols),
          y: Math.floor(seeded(i, 4.8) * rows),
          w: 3 + Math.floor(seeded(i, 6.5) * 6),
          h: 3 + Math.floor(seeded(i, 8.2) * 6),
          tint: seeded(i, 9.9) > 0.56 ? 0.07 : -0.055
        });
      }
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rebuild();
    };

    const addTrailPoint = (clientX: number, clientY: number) => {
      pointerX = clientX;
      pointerY = clientY;
      trail.push({
        x: clientX,
        y: clientY,
        life: 1
      });

      if (trail.length > 18) {
        trail.shift();
      }
    };

    const onMove = (event: PointerEvent) => {
      addTrailPoint(event.clientX, event.clientY);
    };

    const onLeave = () => {
      trail = [];
    };

    const render = (time: number) => {
      raf = window.requestAnimationFrame(render);
      if (!previous) previous = time;
      previous = time;
      const t = time * 0.001;

      ctx.clearRect(0, 0, width, height);

      trail = trail
        .map((point) => ({
          ...point,
          life: point.life - 0.028
        }))
        .filter((point) => point.life > 0);

      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const index = y * cols + x;
          let shade = base[index] + Math.sin(t * 0.75 + drift[index] * 10) * 0.008;

          for (const block of blocks) {
            if (x >= block.x && x < block.x + block.w && y >= block.y && y < block.y + block.h) {
              shade += block.tint;
            }
          }

          let activation = 0;
          for (const point of trail) {
            const dx = x * step - point.x;
            const dy = y * step - point.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const radius = 72 + (1 - point.life) * 28;

            if (distance < radius) {
              const local = (1 - distance / radius) * point.life;
              activation = Math.max(activation, local);
            }
          }

          const cursorDx = x * step - pointerX;
          const cursorDy = y * step - pointerY;
          const cursorDistance = Math.sqrt(cursorDx * cursorDx + cursorDy * cursorDy);
          if (cursorDistance < 44) {
            activation = Math.max(activation, (1 - cursorDistance / 44) * 0.55);
          }

          if (activation > 0.03) {
            const value = Math.min(255, Math.round(124 + activation * 92));
            const alpha = 0.46 + activation * 0.38;
            ctx.fillStyle = `rgba(${value}, ${value}, ${value}, ${alpha})`;
          } else {
            const channel = Math.max(18, Math.min(76, Math.round(16 + shade * 182)));
            ctx.fillStyle = `rgb(${channel}, ${channel}, ${channel})`;
          }

          ctx.fillRect(x * step, y * step, cell, cell);
        }
      }
    };

    resize();
    raf = window.requestAnimationFrame(render);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="pixel-wall-canvas" aria-hidden="true" />;
}
