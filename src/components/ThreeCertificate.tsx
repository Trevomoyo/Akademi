import React from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';

export function ThreeCertificate({ name, level }: { name: string, level: number }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-100, 100], [15, -15]);
  const rotateY = useTransform(x, [-100, 100], [-15, 15]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };

  const handlePointerLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div 
      className="perspective-[1000px] w-full max-w-[340px] mx-auto"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="w-full aspect-[1.4] rounded-xl bg-gradient-to-br from-[#12110E] to-[#3A3632] border-2 border-[var(--highlight)] p-4 shadow-2xl relative"
      >
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none rounded-xl"
          style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(232, 135, 26, 0.2) 10px, rgba(232, 135, 26, 0.2) 20px)" }}
        />
        
        <div style={{ transform: "translateZ(30px)" }} className="relative z-10 h-full flex flex-col items-center justify-center text-center text-[#FAFAF7] border border-[#F5C842]/30 p-2">
          <div className="font-display italic text-[#F5C842] text-sm mb-2 opacity-80">Akademì Honours</div>
          <h2 className="font-display text-2xl font-bold mb-1">Certificate of Excellence</h2>
          <div className="text-xs text-[#A39E98] mb-4">Awarded for reaching Scholarship Level {level}</div>
          <div className="font-display text-xl border-b border-[#F5C842]/50 pb-1 mb-2 px-4 shadow-sm">{name}</div>
        </div>
      </motion.div>
    </div>
  );
}
