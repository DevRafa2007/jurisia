import React from 'react';
import { motion } from 'framer-motion';

interface LoadingDotsProps {
  color?: string;
  size?: number;
}

const LoadingDots: React.FC<LoadingDotsProps> = ({ 
  color = "bg-primary-600 dark:bg-primary-400", 
  size = 2 
}) => {
  return (
    <div className="flex items-center space-x-1 my-2">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={`${color} rounded-full`}
          style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            repeatType: "loop",
            delay: index * 0.2
          }}
        />
      ))}
    </div>
  );
};

export default LoadingDots; 