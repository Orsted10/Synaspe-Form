import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoadingSequence({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'intro' | 'outro'>('intro');

  useEffect(() => {
    // Start warping out the text before the background fades
    const textOutTimer = setTimeout(() => {
      setPhase('outro');
    }, 2800);
    
    // Complete the entire sequence
    const finishTimer = setTimeout(() => {
      onComplete();
    }, 4000);

    return () => {
      clearTimeout(textOutTimer);
      clearTimeout(finishTimer);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="loading-screen"
      initial={{ opacity: 1, backgroundColor: "#000000" }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
      style={{ willChange: "opacity" }}
    >
      <AnimatePresence>
        {phase === 'intro' && (
          <motion.div
            className="loading-content"
            initial={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 4 }}
            transition={{ duration: 0.8, ease: "circIn" }}
            style={{ willChange: "transform, opacity", position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
              {/* GLOW ORB */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: -1 }}>
                <motion.div 
                  className="loading-glow"
                  initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  style={{ position: 'relative', top: 'auto', left: 'auto', transform: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <motion.h1
                  className="loading-synapse"
                  initial={{ y: 80, opacity: 0, filter: "brightness(0.2)" }}
                  animate={{ y: 0, opacity: 1, filter: "brightness(1.5)" }}
                  transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                  style={{ textIndent: '0.05em' }}
                >
                  SYNAPSE
                </motion.h1>
                <motion.div
                  className="loading-society"
                  initial={{ y: -10, opacity: 0, letterSpacing: "0em" }}
                  animate={{ y: 0, opacity: 1, letterSpacing: "0.4em" }}
                  transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
                >
                  S O C I E T Y
                </motion.div>
              </div>
            </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {phase === 'intro' && (
          <div style={{ position: 'absolute', bottom: '40px', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <motion.div 
              className="loading-terminal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 2.0, duration: 0.5 }}
            >
              [ SYS.INIT.OK ]
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
