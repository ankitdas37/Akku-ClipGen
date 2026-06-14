'use client';
import { useEffect, useRef } from 'react';

const PETALS = ['🌸', '🌺', '✿', '❀', '⚜', '✦'];

export default function ParticleBackground() {
  const bgRef = useRef(null);

  useEffect(() => {
    if (!bgRef.current) return;
    const container = bgRef.current;

    // Create floating sakura petals
    for (let i = 0; i < 18; i++) {
      const petal = document.createElement('span');
      petal.className = 'petal';
      petal.textContent = PETALS[Math.floor(Math.random() * PETALS.length)];
      const size = 10 + Math.random() * 16;
      petal.style.cssText = `
        left: ${Math.random() * 100}%;
        font-size: ${size}px;
        animation-duration: ${8 + Math.random() * 14}s;
        animation-delay: ${-Math.random() * 12}s;
        filter: hue-rotate(${Math.random() * 60}deg);
      `;
      container.appendChild(petal);
    }

    // Create twinkling star dots
    for (let i = 0; i < 60; i++) {
      const star = document.createElement('div');
      star.className = 'star-dot';
      const size = 1 + Math.random() * 2.5;
      const hue = Math.random() > 0.5 ? '#7c3aed' : Math.random() > 0.5 ? '#f472b6' : '#22d3ee';
      star.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        background: ${hue};
        animation-duration: ${2 + Math.random() * 4}s;
        animation-delay: ${-Math.random() * 4}s;
        box-shadow: 0 0 ${size * 3}px ${hue};
      `;
      container.appendChild(star);
    }

    return () => {
      while (container.firstChild) container.removeChild(container.firstChild);
    };
  }, []);

  return (
    <>
      <div className="glow-orb glow-orb-1" />
      <div className="glow-orb glow-orb-2" />
      <div className="glow-orb glow-orb-3" />
      <div ref={bgRef} className="particle-bg" />
    </>
  );
}
