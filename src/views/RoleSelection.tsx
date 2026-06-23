import React from 'react';
import { motion } from 'motion/react';
import { GraduationCap, BookOpenText } from 'lucide-react';

export default function RoleSelection({ navigate }: { navigate: (r: string) => void }) {
  return (
    <div className="bg-[#12110E] min-h-screen text-white flex flex-col justify-center items-center px-6 relative star-field-bg">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display font-bold italic text-4xl text-[#14B8A6] mb-12"
      >
        Akademì
      </motion.div>
      
      <motion.h2 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-2xl font-display mb-10 text-center font-bold"
      >
        I am a...
      </motion.h2>

      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg z-10">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => navigate('/landing?role=teacher')}
          className="flex-1 bg-[#1A1714] border border-[#3A3632] hover:border-[#14B8A6] rounded-3xl p-8 flex flex-col items-center gap-6 transition-colors shadow-xl"
        >
          <div className="w-20 h-20 rounded-full bg-[#14B8A6]/10 flex items-center justify-center text-[#14B8A6]">
            <BookOpenText size={40} />
          </div>
          <span className="font-display font-bold text-2xl">Teacher</span>
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => navigate('/landing?role=student')}
          className="flex-1 bg-[#1A1714] border border-[#3A3632] hover:border-[var(--accent-warm)] rounded-3xl p-8 flex flex-col items-center gap-6 transition-colors shadow-xl"
        >
          <div className="w-20 h-20 rounded-full bg-[var(--accent-warm)]/10 flex items-center justify-center text-[var(--accent-warm)]">
            <GraduationCap size={40} />
          </div>
          <span className="font-display font-bold text-2xl">Student</span>
        </motion.button>
      </div>
    </div>
  );
}
