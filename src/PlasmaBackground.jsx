// PlasmaBackground.jsx — Canvas physics blobs que chocan, emiten luz y crean plasma 🌈⚡
import { useEffect, useRef } from 'react';

const COLORS = [
  [79, 70, 229],   // indigo
  [124, 58, 237],  // violet
  [190, 24, 93],   // pink
  [15, 118, 110],  // teal
  [234, 88, 12],   // orange
  [56, 189, 248],  // sky
  [167, 139, 250], // lavender
];

function rand(min, max) { return Math.random() * (max - min) + min; }

class Blob {
  constructor(canvas) {
    this.reset(canvas);
  }
  reset(canvas) {
    this.x = rand(0, canvas.width);
    this.y = rand(0, canvas.height);
    this.r = rand(canvas.width * 0.12, canvas.width * 0.28);
    this.vx = rand(-0.45, 0.45);
    this.vy = rand(-0.45, 0.45);
    const c = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.color = c;
    this.alpha = rand(0.45, 0.75);
    this.glowing = false;
    this.glowTimer = 0;
    this.glowDuration = 0;
    this.pulsePhase = rand(0, Math.PI * 2);
    this.pulseSpeed = rand(0.008, 0.025);
  }
  update(canvas, blobs, settings) {
    this.pulsePhase += this.pulseSpeed;
    const pulse = Math.sin(this.pulsePhase) * 0.08;
    this.currentAlpha = this.alpha + pulse;

    // move
    this.x += this.vx;
    this.y += this.vy;

    // bounce off edges with a bit of randomness
    if (this.x - this.r < 0) { this.vx = Math.abs(this.vx) + rand(0, 0.05); this.x = this.r; }
    if (this.x + this.r > canvas.width) { this.vx = -(Math.abs(this.vx) + rand(0, 0.05)); this.x = canvas.width - this.r; }
    if (this.y - this.r < 0) { this.vy = Math.abs(this.vy) + rand(0, 0.05); this.y = this.r; }
    if (this.y + this.r > canvas.height) { this.vy = -(Math.abs(this.vy) + rand(0, 0.05)); this.y = canvas.height - this.r; }

    // speed cap
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > 0.9) { this.vx *= 0.98; this.vy *= 0.98; }
    if (speed < 0.1) { this.vx += rand(-0.05, 0.05); this.vy += rand(-0.05, 0.05); }

    // collision with other blobs → glow burst
    if (settings.collisions) {
      for (const other of blobs) {
        if (other === this) continue;
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = (this.r + other.r) * 0.55;
        if (dist < minDist) {
          // bounce
          const nx = dx / dist, ny = dy / dist;
          const relV = (this.vx - other.vx) * nx + (this.vy - other.vy) * ny;
          if (relV > 0) {
            this.vx -= relV * nx * 0.5;
            this.vy -= relV * ny * 0.5;
            other.vx += relV * nx * 0.5;
            other.vy += relV * ny * 0.5;
          }
          // emit glow
          if (settings.glow) {
            this.glowing = true;
            this.glowTimer = 0;
            this.glowDuration = rand(30, 80);
            other.glowing = true;
            other.glowTimer = 0;
            other.glowDuration = rand(30, 80);
          }
        }
      }
    }

    if (this.glowing) {
      this.glowTimer++;
      if (this.glowTimer > this.glowDuration) this.glowing = false;
    }
  }

  draw(ctx, settings) {
    const blur = settings.blur;

    ctx.save();

    // glow ring when colliding
    if (this.glowing && settings.glow) {
      const glowProgress = this.glowTimer / this.glowDuration;
      const glowAlpha = (1 - glowProgress) * 0.6;
      const glowR = this.r * (1 + glowProgress * 0.5);
      const glow = ctx.createRadialGradient(this.x, this.y, this.r * 0.5, this.x, this.y, glowR * 1.4);
      glow.addColorStop(0, `rgba(${this.color.join(',')}, ${glowAlpha})`);
      glow.addColorStop(1, `rgba(${this.color.join(',')}, 0)`);
      ctx.filter = blur > 0 ? `blur(${blur * 0.4}px)` : 'none';
      ctx.beginPath();
      ctx.arc(this.x, this.y, glowR * 1.4, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();
    }

    // main blob
    const grad = ctx.createRadialGradient(
      this.x - this.r * 0.2, this.y - this.r * 0.2, 0,
      this.x, this.y, this.r
    );
    const alpha = this.currentAlpha ?? this.alpha;
    grad.addColorStop(0, `rgba(${this.color.join(',')}, ${Math.min(1, alpha + 0.15)})`);
    grad.addColorStop(0.5, `rgba(${this.color.join(',')}, ${alpha})`);
    grad.addColorStop(1, `rgba(${this.color.join(',')}, 0)`);

    ctx.filter = blur > 0 ? `blur(${blur}px)` : 'none';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.restore();
  }
}

export default function PlasmaBackground({ settings }) {
  const canvasRef = useRef(null);
  const blobsRef = useRef([]);
  const rafRef = useRef(null);
  const settingsRef = useRef(settings);

  useEffect(() => { settingsRef.current = settings; }, [settings]);

  useEffect(() => {
    if (!settings.fancyBg) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      blobsRef.current = Array.from({ length: 7 }, () => new Blob(canvas));
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const s = settingsRef.current;
      if (!s.fancyBg) { ctx.clearRect(0, 0, canvas.width, canvas.height); return; }

      ctx.fillStyle = 'rgba(7, 8, 13, 0.18)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (const blob of blobsRef.current) {
        blob.update(canvas, blobsRef.current, s);
        blob.draw(ctx, s);
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [settings.fancyBg]);

  if (!settings.fancyBg) return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
      background: 'radial-gradient(at 20% 20%, #1e1b4b 0, transparent 60%), radial-gradient(at 80% 80%, #581c87 0, transparent 60%)'
    }} />
  );

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', display: 'block' }}
    />
  );
}