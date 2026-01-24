import React, { useEffect, useState } from 'react';

const TetAtmosphere: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  useEffect(() => {
    if (!isPlaying) {
      document.querySelectorAll('.tet-petal').forEach(p => p.remove());
      return;
    }

    const styleId = 'tet-atmosphere-style';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          @keyframes fall {
            0% { top: -10%; }
            100% { top: 100%; }
          }
          @keyframes sway1 {
            0% { transform: translateX(0px) rotate(0deg); }
            50% { transform: translateX(50px) rotate(45deg); }
            100% { transform: translateX(0px) rotate(0deg); }
          }
          @keyframes sway2 {
            0% { transform: translateX(0px) rotate(0deg); }
            50% { transform: translateX(-50px) rotate(-45deg); }
            100% { transform: translateX(0px) rotate(0deg); }
          }
          .tet-petal {
            position: fixed;
            z-index: 9990;
            pointer-events: none;
            top: -10%;
            border-radius: 10px 1px;
          }
        `;
        document.head.appendChild(style);
    }

    const gradients: string[] = [
      'linear-gradient(120deg, rgba(255, 183, 197, 0.9), rgba(255, 197, 208, 0.9))',
      'linear-gradient(120deg, rgba(255,189,189), rgba(227,170,181))',
      'linear-gradient(120deg, rgba(212,152,163), rgba(242,185,196))'
    ];

    const createPetal = (): void => {
      const petal = document.createElement('div');
      petal.className = 'tet-petal';
      const leftPos = Math.random() * 100;
      petal.style.left = leftPos + 'vw';
      
      const size = Math.random() * 10 + 15;
      petal.style.width = size + 'px';
      petal.style.height = size + 'px';
      petal.style.background = gradients[Math.floor(Math.random() * gradients.length)];
      
      const duration = Math.random() * 5 + 6;
      const swayName = Math.random() > 0.5 ? 'sway1' : 'sway2';
      
      petal.style.animation = `fall ${duration}s linear, ${swayName} ${Math.random() * 2 + 3}s ease-in-out infinite`;
      
      document.body.appendChild(petal);

      setTimeout(() => {
        if(document.body.contains(petal)) petal.remove();
      }, duration * 1000);
    };

    const interval = setInterval(createPetal, 800);

    return () => {
      clearInterval(interval);
      document.querySelectorAll('.tet-petal').forEach(p => p.remove());
    };
  }, [isPlaying]);

  return (
    <button
      onClick={() => setIsPlaying(!isPlaying)}
      title={isPlaying ? "Tắt hiệu ứng hoa rơi" : "Bật hiệu ứng hoa rơi"}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '30px', /* <--- ĐÃ SỬA: Chuyển sang bên phải */
        zIndex: 10000,
        background: isPlaying ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 182, 193, 0.95)',
        border: '1px solid #ffb7c5',
        borderRadius: '50px',
        padding: '10px 16px',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        fontWeight: '600',
        color: isPlaying ? '#555' : '#fff',
        transition: 'all 0.3s ease',
        outline: 'none'
      }}
    >
      {isPlaying ? '🛑 Tắt lá rơi' : '🌸 Bật lá rơi'}
    </button>
  );
};

export default TetAtmosphere;