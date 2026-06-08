import { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function LoadingSequence({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="loading-screen"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
      transition={{ duration: 1.2, ease: "easeInOut" }}
    >
      <div className="loading-content">
        <motion.h1
          className="loading-synapse"
          initial={{ y: 80, opacity: 0, filter: "blur(20px) brightness(0.5)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px) brightness(1.2)" }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        >
          SYNAPSE
        </motion.h1>
        <motion.div
          className="loading-society"
          initial={{ y: -10, opacity: 0, letterSpacing: "0em", filter: "blur(5px)" }}
          animate={{ y: 0, opacity: 1, letterSpacing: "0.4em", filter: "blur(0px)" }}
          transition={{ duration: 1.2, delay: 0.9, ease: "easeOut" }}
        >
          S O C I E T Y
        </motion.div>
      </div>
      
      <motion.div 
        className="loading-terminal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 2.2, duration: 0.5 }}
      >
        [ SYS.INIT.OK ]
      </motion.div>
    </motion.div>
  );
}
