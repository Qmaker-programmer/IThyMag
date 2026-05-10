// PlasmaBackground.jsx — Canvas 3D plasma blobs con profundidad, sombras y highlights 🌈⚡✨
import { useEffect, useRef } from 'react';

const COLORS = [
  [79, 70, 229],    // indigo
  [124, 58, 237],   // violet
  [190, 24, 93],    // pink
  [15, 118, 110],   // teal
  [234, 88, 12],    // orange
  [56, 189, 248],   // sky
  [167, 139, 250],  // lavender
  [52, 211, 153],   // emerald
  [251, 146, 60],   // peach
];

function rand(min, max) { return Math.random() * (max - min) + min; }

class Blob {
  constructor(canvas) {
    this.reset(canvas);
  }

  reset(canvas) {
    this.x = rand(0, canvas.width);
    this.y = rand(0, canvas.height);
    // z simula profundidad: 0 = lejos (pequeño, opaco), 1 = cerca (grande, brillante)
    this.z = rand(0.15, 1.0);
    const baseR = canvas.width * 0.13;
    this.r = baseR * (0.5 + this.z * 0.8);
    // velocidad inversamente proporcional a z (parallax)
    const speed = rand(0.15, 0.5) * this.z;
    const angle = rand(0, Math.PI * 2);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    const c = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.color = c;
    // alpha proporcional a profundidad
    this.alpha = 0.25 + this.z * 0.5;
    this.glowing = false;
    this.glowTimer = 0;
    this.glowDuration = 0;
    this.pulsePhase = rand(0, Math.PI * 2);
    this.pulseSpeed = rand(0.005, 0.018);
    // Para rotación de highlight
    this.highlightAngle = rand(0, Math.PI * 2);
    this.highlightSpeed = rand(0.003, 0.01);
  }

  update(canvas, blobs, settings) {
    this.pulsePhase += this.pulseSpeed;
    this.highlightAngle += this.highlightSpeed;
    const pulse = Math.sin(this.pulsePhase) * 0.06;
    this.currentAlpha = Math.min(0.9, this.alpha + pulse);

    this.x += this.vx;
    this.y += this.vy;

    // bounce con rebote suave
    if (this.x - this.r < 0) { this.vx = Math.abs(this.vx) + rand(0, 0.03); this.x = this.r; }
    if (this.x + this.r > canvas.width) { this.vx = -(Math.abs(this.vx) + rand(0, 0.03)); this.x = canvas.width - this.r; }
    if (this.y - this.r < 0) { this.vy = Math.abs(this.vy) + rand(0, 0.03); this.y = this.r; }
    if (this.y + this.r > canvas.height) { this.vy = -(Math.abs(this.vy) + rand(0, 0.03)); this.y = canvas.height - this.r; }

    // cap velocidad
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > 1.2) { this.vx *= 0.97; this.vy *= 0.97; }
    if (speed < 0.05) { this.vx += rand(-0.04, 0.04); this.vy += rand(-0.04, 0.04); }

    // colisiones (solo entre blobs de profundidad similar)
    if (settings.collisions) {
      for (const other of blobs) {
        if (other === this) continue;
        if (Math.abs(other.z - this.z) > 0.4) continue; // solo chocan si están en el mismo "plano"
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = (this.r + other.r) * 0.5;
        if (dist < minDist && dist > 0) {
          const nx = dx / dist, ny = dy / dist;
          const relV = (this.vx - other.vx) * nx + (this.vy - other.vy) * ny;
          if (relV > 0) {
            this.vx -= relV * nx * 0.45;
            this.vy -= relV * ny * 0.45;
            other.vx += relV * nx * 0.45;
            other.vy += relV * ny * 0.45;
          }
          if (settings.glow) {
            this.glowing = true; this.glowTimer = 0; this.glowDuration = rand(40, 90);
            other.glowing = true; other.glowTimer = 0; other.glowDuration = rand(40, 90);
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
    const alpha = this.currentAlpha ?? this.alpha;

    ctx.save();

    // ── Sombra de profundidad (blobs lejanos hacen sombra más difusa) ──
    const shadowBlur = this.r * (0.8 + (1 - this.z) * 1.2);
    const shadowAlpha = alpha * 0.35 * this.z;
    const shadowOffset = this.r * 0.18 * this.z;

    ctx.save();
    ctx.filter = blur > 0 ? `blur(${blur * (0.8 + (1 - this.z) * 0.6)}px)` : 'none';
    const shadowGrad = ctx.createRadialGradient(
      this.x + shadowOffset, this.y + shadowOffset * 1.5, 0,
      this.x + shadowOffset, this.y + shadowOffset * 1.5, this.r * 1.15
    );
    shadowGrad.addColorStop(0, `rgba(0, 0, 0, ${shadowAlpha})`);
    shadowGrad.addColorStop(1, `rgba(0, 0, 0, 0)`);
    ctx.beginPath();
    ctx.arc(this.x + shadowOffset, this.y + shadowOffset * 1.5, this.r * 1.15, 0, Math.PI * 2);
    ctx.fillStyle = shadowGrad;
    ctx.fill();
    ctx.restore();

    // ── Glow ring en colisión ──
    if (this.glowing && settings.glow) {
      const glowProgress = this.glowTimer / this.glowDuration;
      const glowAlpha = (1 - glowProgress) * 0.7 * this.z;
      const glowR = this.r * (1 + glowProgress * 0.7);
      const glow = ctx.createRadialGradient(this.x, this.y, this.r * 0.4, this.x, this.y, glowR * 1.6);
      glow.addColorStop(0, `rgba(${this.color.join(',')}, ${glowAlpha})`);
      glow.addColorStop(0.5, `rgba(255, 255, 255, ${glowAlpha * 0.3})`);
      glow.addColorStop(1, `rgba(${this.color.join(',')}, 0)`);
      ctx.filter = blur > 0 ? `blur(${blur * 0.35}px)` : 'none';
      ctx.beginPath();
      ctx.arc(this.x, this.y, glowR * 1.6, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();
    }

    // ── Cuerpo principal del blob — gradiente radial 3D ──
    // Centro del gradiente desplazado arriba-izquierda para simular luz que viene de arriba
    const lightOffsetX = -this.r * 0.28;
    const lightOffsetY = -this.r * 0.32;
    const grad = ctx.createRadialGradient(
      this.x + lightOffsetX, this.y + lightOffsetY, this.r * 0.05,
      this.x, this.y, this.r
    );
    const r = this.color[0], g = this.color[1], b = this.color[2];
    // highlight central muy brillante
    grad.addColorStop(0,   `rgba(${Math.min(255,r+90)}, ${Math.min(255,g+90)}, ${Math.min(255,b+90)}, ${Math.min(1, alpha + 0.35)})`);
    grad.addColorStop(0.2, `rgba(${Math.min(255,r+40)}, ${Math.min(255,g+40)}, ${Math.min(255,b+40)}, ${Math.min(1, alpha + 0.15)})`);
    grad.addColorStop(0.55,`rgba(${r}, ${g}, ${b}, ${alpha})`);
    grad.addColorStop(0.82,`rgba(${Math.max(0,r-40)}, ${Math.max(0,g-40)}, ${Math.max(0,b-40)}, ${alpha * 0.7})`);
    grad.addColorStop(1,   `rgba(${r}, ${g}, ${b}, 0)`);

    ctx.filter = blur > 0 ? `blur(${blur * (0.6 + this.z * 0.4)}px)` : 'none';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // ── Specular highlight — brillo rotante estilo 3D ──
    if (this.z > 0.35) {
      const hx = this.x + Math.cos(this.highlightAngle) * this.r * 0.32;
      const hy = this.y + Math.sin(this.highlightAngle) * this.r * 0.32;
      const hSize = this.r * (0.22 + this.z * 0.18);
      const specGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, hSize);
      const specAlpha = this.z * 0.45;
      specGrad.addColorStop(0, `rgba(255, 255, 255, ${specAlpha})`);
      specGrad.addColorStop(0.4, `rgba(255, 255, 255, ${specAlpha * 0.3})`);
      specGrad.addColorStop(1, `rgba(255, 255, 255, 0)`);
      ctx.filter = blur > 0 ? `blur(${blur * 0.2}px)` : 'none';
      ctx.beginPath();
      ctx.arc(hx, hy, hSize, 0, Math.PI * 2);
      ctx.fillStyle = specGrad;
      ctx.fill();
    }

    // ── Rim light — bordes iluminados para el efecto 3D ──
    if (this.z > 0.5) {
      const rimGrad = ctx.createRadialGradient(
        this.x - lightOffsetX * 0.5, this.y - lightOffsetY * 0.5, this.r * 0.7,
        this.x, this.y, this.r * 1.05
      );
      const rimAlpha = this.z * 0.18;
      rimGrad.addColorStop(0, `rgba(${Math.min(255,r+60)}, ${Math.min(255,g+60)}, ${Math.min(255,b+120)}, 0)`);
      rimGrad.addColorStop(0.7, `rgba(${Math.min(255,r+60)}, ${Math.min(255,g+60)}, ${Math.min(255,b+120)}, 0)`);
      rimGrad.addColorStop(1, `rgba(${Math.min(255,r+60)}, ${Math.min(255,g+60)}, ${Math.min(255,b+120)}, ${rimAlpha})`);
      ctx.filter = 'none';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 1.05, 0, Math.PI * 2);
      ctx.fillStyle = rimGrad;
      ctx.fill();
    }

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
      // Más blobs, ordenados por z para dibujar de atrás hacia adelante (painter's algorithm)
      blobsRef.current = Array.from({ length: 10 }, () => new Blob(canvas))
        .sort((a, b) => a.z - b.z);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const s = settingsRef.current;
      if (!s.fancyBg) { ctx.clearRect(0, 0, canvas.width, canvas.height); return; }

      // Trail más denso para más efecto de movimiento fluido
      ctx.fillStyle = 'rgba(7, 8, 13, 0.14)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Ordenar de atrás hacia adelante para z-order correcto
      blobsRef.current.sort((a, b) => a.z - b.z);

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
