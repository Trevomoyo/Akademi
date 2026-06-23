import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

export default function Landing({ navigate }: { navigate: (r: string) => void }) {
  const isTeacher = window.location.hash.includes('role=teacher');

  const schools = [
    "Allan Wilson", "Prince Edward", "Arundel", "Dominican Convent", "Harare High",
    "Churchill", "Girls High", "Mutendi", "David Livingstone", "Mbizo High", "Chisipite Senior",
    "Gifford High", "St George's College", "Marist Brothers", "Petra High", "Morgan High",
    "Goromonzi High", "Mzilikazi High", "Mutare Boys", "Fletcher", "Regina Coeli", "Gateway",
    "St Ignatius", "Falcon College", "Hellenic", "Watershed"
  ];

  return (
    <div className="bg-[#12110E] min-h-screen text-[var(--accent-warm-light)] font-body flex flex-col star-field-bg relative">
      {/* NAV BAR */}
      <nav className="flex justify-between items-center px-4 md:px-8 py-4 fixed top-0 w-full z-50 bg-[#12110E]/80 backdrop-blur-md">
        <div className="font-display font-bold italic text-2xl text-[#14B8A6]">Akademì</div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/pastpapers')} className="text-sm font-medium hover:text-[var(--primary)] text-white">Past Papers</button>
          <button onClick={() => navigate('/onboarding')} className="bg-[var(--accent-warm)] text-[#FAFAF7] px-5 py-2 rounded-full text-sm font-semibold hover:bg-[var(--accent-warm)]/90 transition-colors">
            Get started
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-32 pb-20 px-6 flex-1 flex flex-col justify-center items-center text-center mt-auto z-10">
        <h1 className="font-display text-5xl md:text-7xl mb-6 mt-10">
          <span className="block text-white font-normal">{isTeacher ? 'Your students.' : 'Your exams.'}</span>
          <span className="block text-[#14B8A6] font-bold py-1">{isTeacher ? 'Your impact.' : 'Your future.'}</span>
          <span className="block text-white font-light mt-1">Start today.</span>
        </h1>
        <p className="text-[#A39E98] max-w-lg mx-auto text-lg mb-10 leading-relaxed font-medium">
          {isTeacher 
            ? "Create engaging lessons, track student progress, and utilize AI tools to enhance learning across Zimbabwe."
            : "Structured lessons, AI essay grading, and past papers — built for O-Level and A-Level students across Zimbabwe."
          }
        </p>
        <div className="flex flex-col items-center gap-6 w-full max-w-xs mx-auto mb-10">
          <button 
            onClick={() => navigate('/onboarding')} 
            className="bg-[var(--accent-warm)] text-[#FAFAF7] w-full py-4 rounded-full text-lg font-bold hover:opacity-90 transition-opacity shadow-lg flex justify-center items-center gap-2"
          >
            {isTeacher ? 'Join as Educator' : 'Start learning free'} <ArrowRight size={20} />
          </button>
          <a href="#" className="text-[#FAFAF7] text-sm underline underline-offset-4 opacity-80 hover:opacity-100 font-medium tracking-wide">
            See how it works
          </a>
        </div>
      </section>
    </div>
  );
}
