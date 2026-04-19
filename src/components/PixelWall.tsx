import { useEffect, useRef } from "react";

type Block = {
  x: number;
  y: number;
  w: number;
  h: number;
  tint: number;
};

type Hotspot = {
  x: number;
  y: number;
  radius: number;
  intensity: number;
  dx: number;
  dy: number;
};

export function PixelWall() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const step = 6;
    const cell = 5;
    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;
    let raf = 0;
    let previous = 0;

    let base = new Float32Array(0);
    let drift = new Float32Array(0);
    let blocks: Block[] = [];
    let hotspots: Hotspot[] = [];

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
          base[index] = 0.1 + coarse * 0.09 + fine * 0.04;
          drift[index] = seeded(x * 0.17, y * 0.37);
        }
      }

      const blockCount = Math.floor((cols * rows) / 220);
      for (let i = 0; i < blockCount; i += 1) {
        blocks.push({
          x: Math.floor(seeded(i, 2.1) * cols),
          y: Math.floor(seeded(i, 4.8) * rows),
          w: 4 + Math.floor(seeded(i, 6.5) * 7),
          h: 4 + Math.floor(seeded(i, 8.2) * 7),
          tint: seeded(i, 9.9) > 0.65 ? 0.08 : -0.05
        });
      }

      hotspots = [
        { x: 0.24, y: 0.24, radius: 5.5, intensity: 0.48, dx: 0.00006, dy: 0.00004 },
        { x: 0.12, y: 0.88, radius: 7.5, intensity: 0.34, dx: 0.00004, dy: -0.00005 },
        { x: 0.88, y: 0.88, radius: 8.5, intensity: 0.34, dx: -0.00005, dy: -0.00004 }
      ];
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

    const render = (time: number) => {
      raf = window.requestAnimationFrame(render);
      if (!previous) previous = time;
      const delta = time - previous;
      previous = time;
      const t = time * 0.001;

      ctx.clearRect(0, 0, width, height);

      hotspots = hotspots.map((hotspot) => {
        let next = {
          ...hotspot,
          x: hotspot.x + hotspot.dx * delta,
          y: hotspot.y + hotspot.dy * delta
        };

        if (next.x < 0.08 || next.x > 0.92) next.dx *= -1;
        if (next.y < 0.12 || next.y > 0.92) next.dy *= -1;
        return next;
      });

      const pulseRow = Math.floor(rows * 0.86 + Math.sin(t * 0.4) * rows * 0.014);

      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const index = y * cols + x;
          let shade = base[index] + Math.sin(t * 0.75 + drift[index] * 10) * 0.008;

          for (const block of blocks) {
            if (x >= block.x && x < block.x + block.w && y >= block.y && y < block.y + block.h) {
              shade += block.tint;
            }
          }

          let green = 0;
          const px = x / cols;
          const py = y / rows;

          for (const hotspot of hotspots) {
            const dx = px - hotspot.x;
            const dy = py - hotspot.y;
            const distance = Math.sqrt(dx * dx + dy * dy) * 20;
            if (distance < hotspot.radius) {
              green = Math.max(green, (1 - distance / hotspot.radius) * hotspot.intensity);
            }
          }

          if (Math.abs(y - pulseRow) < 2) {
            green = Math.max(green, (1 - Math.abs(y - pulseRow) / 2) * 0.32 * (0.55 + Math.sin(t * 4 + x * 0.18) * 0.45));
          }

          if (green > 0.08) {
            const r = Math.round(20 + green * 32);
            const g = Math.round(120 + green * 120);
            const b = Math.round(18 + green * 24);
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.62 + green * 0.34})`;
          } else {
            const channel = Math.max(20, Math.min(80, Math.round(18 + shade * 180)));
            ctx.fillStyle = `rgb(${channel}, ${channel}, ${channel})`;
          }

          ctx.fillRect(x * step, y * step, cell, cell);
        }
      }
    };

    resize();
    raf = window.requestAnimationFrame(render);
    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="pixel-wall-canvas" aria-hidden="true" />;
}
