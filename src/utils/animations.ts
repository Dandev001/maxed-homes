import { type Variants } from 'framer-motion';

// Optimized animation variants for consistent performance
export const fadeInUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    transition: { duration: 0 }
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6, 
      ease: [0.25, 0.1, 0.25, 1],
      type: "tween"
    }
  }
};

export const fadeInUpDelay: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    transition: { duration: 0 }
  },
  visible: (delay: number = 0) => ({ 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6, 
      delay: delay * 0.1,
      ease: [0.25, 0.1, 0.25, 1],
      type: "tween"
    }
  })
};

export const scaleIn: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 1.05,
    transition: { duration: 0 }
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      duration: 0.8, 
      ease: [0.25, 0.1, 0.25, 1],
      type: "tween"
    }
  }
};

export const slideInLeft: Variants = {
  hidden: { 
    opacity: 0, 
    x: -20,
    transition: { duration: 0 }
  },
  visible: (delay: number = 0) => ({ 
    opacity: 1, 
    x: 0,
    transition: { 
      duration: 0.5, 
      delay: delay * 0.1,
      ease: [0.25, 0.1, 0.25, 1],
      type: "tween"
    }
  })
};