import { useEffect, useRef } from "react";

type Block = {
  x: number;
  y: number;
  w: number;
  h: number;
  tint: number;
};

type MacroBlock = {
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
    const step = 12;
    const cell = 9;
    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;
    let raf = 0;
    let previous = 0;
    let pointerX = window.innerWidth * 0.5;
    let pointerY = window.innerHeight * 0.3;
    let lastTrailX = pointerX;
    let lastTrailY = pointerY;

    let base = new Float32Array(0);
    let drift = new Float32Array(0);
    let blocks: Block[] = [];
    let macroBlocks: MacroBlock[] = [];
    let trail: TrailPoint[] = [];

    const fillRoundedRect = (
      context: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      radius: number
    ) => {
      const r = Math.min(radius, w * 0.48, h * 0.48);
      context.beginPath();
      context.roundRect(x, y, w, h, r);
      context.fill();
    };

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
      macroBlocks = [];

      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const index = y * cols + x;
          const coarse = seeded(Math.floor(x / 4), Math.floor(y / 4));
          const medium = seeded(Math.floor(x / 2.6), Math.floor(y / 2.6));
          const fine = seeded(x * 0.83, y * 1.11);
          base[index] = 0.055 + coarse * 0.09 + medium * 0.05 + fine * 0.014;
          drift[index] = seeded(x * 0.17, y * 0.37);
        }
      }

      const macroCount = Math.floor((cols * rows) / 900);
      for (let i = 0; i < macroCount; i += 1) {
        macroBlocks.push({
          x: Math.floor(seeded(i, 1.7) * cols),
          y: Math.floor(seeded(i, 3.9) * rows),
          w: 8 + Math.floor(seeded(i, 5.1) * 10),
          h: 8 + Math.floor(seeded(i, 7.2) * 10),
          tint: seeded(i, 9.4) > 0.7 ? 0.075 : -0.115
        });
      }

      const blockCount = Math.floor((cols * rows) / 150);
      for (let i = 0; i < blockCount; i += 1) {
        blocks.push({
          x: Math.floor(seeded(i, 2.1) * cols),
          y: Math.floor(seeded(i, 4.8) * rows),
          w: 3 + Math.floor(seeded(i, 6.5) * 6),
          h: 3 + Math.floor(seeded(i, 8.2) * 6),
          tint: seeded(i, 9.9) > 0.68 ? 0.052 : -0.07
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

      const dx = clientX - lastTrailX;
      const dy = clientY - lastTrailY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const segments = Math.max(1, Math.ceil(distance / 5));

      for (let i = 1; i <= segments; i += 1) {
        const progress = i / segments;
        trail.push({
          x: lastTrailX + dx * progress,
          y: lastTrailY + dy * progress,
          life: 1
        });
      }

      lastTrailX = clientX;
      lastTrailY = clientY;

      while (trail.length > 36) {
        trail.shift();
      }
    };

    const onMove = (event: PointerEvent) => {
      addTrailPoint(event.clientX, event.clientY);
    };

    const onLeave = () => {
      trail = [];
      lastTrailX = pointerX;
      lastTrailY = pointerY;
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
          life: point.life - 0.052
        }))
        .filter((point) => point.life > 0);

      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const index = y * cols + x;
          let shade = base[index] + Math.sin(t * 0.75 + drift[index] * 10) * 0.008;

          for (const block of macroBlocks) {
            if (x >= block.x && x < block.x + block.w && y >= block.y && y < block.y + block.h) {
              shade += block.tint;
            }
          }

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
            const radius = 6 + (1 - point.life) * 2;

            if (distance < radius) {
              const local = (1 - distance / radius) * point.life;
              activation = Math.max(activation, local);
            }
          }

          const cursorDx = x * step - pointerX;
          const cursorDy = y * step - pointerY;
          const cursorDistance = Math.sqrt(cursorDx * cursorDx + cursorDy * cursorDy);
          if (cursorDistance < 4) {
            activation = Math.max(activation, (1 - cursorDistance / 4) * 0.96);
          }

          let outerFill = "";
          let innerFill = "";
          if (activation > 0.025) {
            const r = Math.round(28 + activation * 14);
            const g = Math.round(138 + activation * 92);
            const b = Math.round(28 + activation * 12);
            outerFill = `rgba(${Math.max(12, r - 22)}, ${Math.max(72, g - 54)}, ${Math.max(12, b - 18)}, 0.86)`;
            innerFill = `rgba(${r}, ${g}, ${b}, ${0.38 + activation * 0.24})`;
          } else {
            const channel = Math.max(20, Math.min(82, Math.round(10 + shade * 182)));
            outerFill = `rgb(${Math.max(12, channel - 8)}, ${Math.max(12, channel - 8)}, ${Math.max(12, channel - 8)})`;
            innerFill = `rgb(${Math.min(98, channel + 2)}, ${Math.min(98, channel + 2)}, ${Math.min(98, channel + 2)})`;
          }

          const px = x * step;
          const py = y * step;
          ctx.fillStyle = outerFill;
          fillRoundedRect(ctx, px, py, cell, cell, 2.2);
          ctx.fillStyle = innerFill;
          fillRoundedRect(ctx, px + 1, py + 1, cell - 2, cell - 2, 1.6);
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
