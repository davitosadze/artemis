import { useEffect, useRef } from 'react';

export default function Starfield() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    let animId, stars = [], W, H, t = 0;

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }

    function createStars() {
      stars = Array.from({ length: 320 }, () => ({
        x:            Math.random() * W,
        y:            Math.random() * H,
        r:            Math.random() * 1.4  + 0.2,
        alpha:        Math.random() * 0.7  + 0.1,
        speed:        Math.random() * 0.015 + 0.003,
        twinkleOff:   Math.random() * Math.PI * 2,
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      t += 0.01;
      for (const s of stars) {
        const alpha = s.alpha * (0.6 + 0.4 * Math.sin(t * s.speed * 80 + s.twinkleOff));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,220,255,${alpha})`;
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    }

    resize();
    createStars();
    draw();

    const onResize = () => { resize(); createStars(); };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  );
}
