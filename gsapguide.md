# GSAP Animation Implementation Guide

## 1. Setup & Installation

### CDN Method (Quick Start)
```html
<!-- Add to your HTML head -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/TextPlugin.min.js"></script>
```

### NPM Method (Recommended for projects)
```bash
npm install gsap
```

```javascript
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TextPlugin } from "gsap/TextPlugin";

gsap.registerPlugin(ScrollTrigger, TextPlugin);
```

## 2. Essential CSS Setup

```css
/* Reset and smooth scrolling */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

/* Animation-ready classes */
.fade-in {
  opacity: 0;
  transform: translateY(50px);
}

.slide-left {
  opacity: 0;
  transform: translateX(-100px);
}

.slide-right {
  opacity: 0;
  transform: translateX(100px);
}

.scale-up {
  opacity: 0;
  transform: scale(0.8);
}

/* Parallax containers */
.parallax-container {
  overflow: hidden;
  position: relative;
}

.parallax-element {
  will-change: transform;
}
```

## 3. Basic Animation Patterns

### Page Load Animations
```javascript
// Hero section entrance
gsap.timeline()
  .from(".hero-title", {
    duration: 1.2,
    y: 100,
    opacity: 0,
    ease: "power3.out"
  })
  .from(".hero-subtitle", {
    duration: 1,
    y: 50,
    opacity: 0,
    ease: "power2.out"
  }, "-=0.8")
  .from(".hero-cta", {
    duration: 0.8,
    scale: 0.8,
    opacity: 0,
    ease: "back.out(1.7)"
  }, "-=0.5");

// Staggered card animations
gsap.from(".card", {
  duration: 0.8,
  y: 60,
  opacity: 0,
  stagger: 0.2,
  ease: "power2.out",
  delay: 0.3
});
```

### Hover Interactions
```javascript
// Button hover effects
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('mouseenter', () => {
    gsap.to(btn, {
      duration: 0.3,
      scale: 1.05,
      boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
      ease: "power2.out"
    });
  });
  
  btn.addEventListener('mouseleave', () => {
    gsap.to(btn, {
      duration: 0.3,
      scale: 1,
      boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
      ease: "power2.out"
    });
  });
});

// Image hover parallax
document.querySelectorAll('.image-hover').forEach(img => {
  img.addEventListener('mousemove', (e) => {
    const rect = img.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    gsap.to(img, {
      duration: 0.3,
      rotationX: y / 20,
      rotationY: -x / 20,
      transformPerspective: 1000,
      ease: "power1.out"
    });
  });
  
  img.addEventListener('mouseleave', () => {
    gsap.to(img, {
      duration: 0.5,
      rotationX: 0,
      rotationY: 0,
      ease: "power1.out"
    });
  });
});
```

## 4. Scroll-Triggered Animations

### Fade In on Scroll
```javascript
// Basic scroll reveal
gsap.utils.toArray('.fade-in').forEach(element => {
  gsap.from(element, {
    duration: 1,
    y: 60,
    opacity: 0,
    ease: "power2.out",
    scrollTrigger: {
      trigger: element,
      start: "top 85%",
      end: "bottom 15%",
      toggleActions: "play none none reverse"
    }
  });
});

// Advanced scroll animations with different directions
const scrollAnimations = [
  { selector: '.slide-left', x: -100, y: 0 },
  { selector: '.slide-right', x: 100, y: 0 },
  { selector: '.slide-up', x: 0, y: 100 },
  { selector: '.scale-up', x: 0, y: 0, scale: 0.8 }
];

scrollAnimations.forEach(({ selector, x, y, scale = 1 }) => {
  gsap.utils.toArray(selector).forEach(element => {
    gsap.from(element, {
      duration: 1,
      x: x,
      y: y,
      scale: scale,
      opacity: 0,
      ease: "power2.out",
      scrollTrigger: {
        trigger: element,
        start: "top 85%",
        toggleActions: "play none none reverse"
      }
    });
  });
});
```

### Parallax Scrolling Effects
```javascript
// Background parallax
gsap.utils.toArray('.parallax-bg').forEach(bg => {
  gsap.to(bg, {
    yPercent: -50,
    ease: "none",
    scrollTrigger: {
      trigger: bg.parentElement,
      start: "top bottom",
      end: "bottom top",
      scrub: true
    }
  });
});

// Multi-layer parallax
gsap.utils.toArray('.parallax-slow').forEach(element => {
  gsap.to(element, {
    yPercent: -30,
    ease: "none",
    scrollTrigger: {
      trigger: element,
      start: "top bottom",
      end: "bottom top",
      scrub: 1
    }
  });
});

gsap.utils.toArray('.parallax-fast').forEach(element => {
  gsap.to(element, {
    yPercent: 50,
    ease: "none",
    scrollTrigger: {
      trigger: element,
      start: "top bottom",
      end: "bottom top",
      scrub: 1
    }
  });
});
```

### Progressive Number Counters
```javascript
// Animated counters
gsap.utils.toArray('.counter').forEach(counter => {
  const target = parseInt(counter.dataset.target);
  const obj = { value: 0 };
  
  gsap.to(obj, {
    value: target,
    duration: 2,
    ease: "power2.out",
    onUpdate: () => {
      counter.textContent = Math.round(obj.value).toLocaleString();
    },
    scrollTrigger: {
      trigger: counter,
      start: "top 80%",
      toggleActions: "play none none reset"
    }
  });
});
```

## 5. Advanced Animation Techniques

### Text Animations
```javascript
// Split text reveal
function splitTextReveal(selector) {
  gsap.utils.toArray(selector).forEach(text => {
    const chars = text.textContent.split('');
    text.innerHTML = chars.map(char => 
      char === ' ' ? ' ' : `<span style="display: inline-block;">${char}</span>`
    ).join('');
    
    gsap.from(text.children, {
      duration: 0.8,
      y: 100,
      opacity: 0,
      stagger: 0.02,
      ease: "back.out(1.7)",
      scrollTrigger: {
        trigger: text,
        start: "top 85%",
        toggleActions: "play none none reverse"
      }
    });
  });
}

splitTextReveal('.split-text');

// Typewriter effect
function typeWriter(selector, speed = 50) {
  gsap.utils.toArray(selector).forEach(element => {
    const text = element.textContent;
    element.textContent = '';
    
    gsap.to(element, {
      duration: text.length * speed / 1000,
      text: text,
      ease: "none",
      scrollTrigger: {
        trigger: element,
        start: "top 80%",
        toggleActions: "play none none reset"
      }
    });
  });
}
```

### Morphing Shapes (SVG)
```javascript
// SVG path morphing
gsap.to("#morphing-path", {
  duration: 2,
  morphSVG: "#target-path",
  ease: "power2.inOut",
  repeat: -1,
  yoyo: true
});

// SVG draw-on effect
gsap.set(".draw-svg", { drawSVG: "0%" });
gsap.to(".draw-svg", {
  duration: 2,
  drawSVG: "100%",
  ease: "power2.inOut",
  scrollTrigger: {
    trigger: ".draw-svg",
    start: "top 80%",
    toggleActions: "play none none reset"
  }
});
```

### Infinite Animations
```javascript
// Floating elements
gsap.to(".floating", {
  y: -20,
  duration: 2,
  ease: "power1.inOut",
  repeat: -1,
  yoyo: true,
  stagger: 0.5
});

// Rotating elements
gsap.to(".rotating", {
  rotation: 360,
  duration: 10,
  ease: "none",
  repeat: -1
});

// Pulsing effect
gsap.to(".pulse", {
  scale: 1.1,
  duration: 1.5,
  ease: "power1.inOut",
  repeat: -1,
  yoyo: true
});
```

## 6. Page Transitions
```javascript
// Page transition system
function pageTransition() {
  const tl = gsap.timeline();
  
  tl.to(".transition-overlay", {
    duration: 0.5,
    scaleY: 1,
    transformOrigin: "bottom",
    ease: "power2.inOut"
  })
  .to(".page-content", {
    duration: 0.3,
    opacity: 0,
    ease: "power1.inOut"
  }, "-=0.3")
  .call(() => {
    // Load new content here
  })
  .to(".page-content", {
    duration: 0.3,
    opacity: 1,
    ease: "power1.inOut"
  })
  .to(".transition-overlay", {
    duration: 0.5,
    scaleY: 0,
    transformOrigin: "top",
    ease: "power2.inOut"
  }, "-=0.1");
}
```

## 7. Performance Optimization

```javascript
// Optimize for performance
gsap.config({
  force3D: true,
  nullTargetWarn: false
});

// Use will-change CSS property
gsap.set(".animated-element", {
  willChange: "transform, opacity"
});

// Clean up after animations
ScrollTrigger.addEventListener("refresh", () => {
  gsap.set(".animated-element", {
    willChange: "auto"
  });
});

// Debounced resize handler
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    ScrollTrigger.refresh();
  }, 250);
});
```

## 8. Complete Implementation Example

```javascript
// Main animation initialization
document.addEventListener('DOMContentLoaded', () => {
  // Initialize GSAP
  gsap.registerPlugin(ScrollTrigger, TextPlugin);
  
  // Page load animations
  initPageLoad();
  
  // Scroll animations
  initScrollAnimations();
  
  // Interactive animations
  initInteractions();
  
  // Continuous animations
  initContinuousAnimations();
});

function initPageLoad() {
  const tl = gsap.timeline({ delay: 0.2 });
  
  tl.from(".header", {
    duration: 1,
    y: -100,
    opacity: 0,
    ease: "power3.out"
  })
  .from(".hero-content > *", {
    duration: 1,
    y: 100,
    opacity: 0,
    stagger: 0.2,
    ease: "power2.out"
  }, "-=0.5");
}

function initScrollAnimations() {
  // Sections fade in
  gsap.utils.toArray('section').forEach(section => {
    gsap.from(section.children, {
      duration: 1,
      y: 60,
      opacity: 0,
      stagger: 0.1,
      ease: "power2.out",
      scrollTrigger: {
        trigger: section,
        start: "top 75%",
        toggleActions: "play none none reverse"
      }
    });
  });
  
  // Parallax backgrounds
  gsap.utils.toArray('.parallax-bg').forEach(bg => {
    gsap.to(bg, {
      yPercent: -50,
      ease: "none",
      scrollTrigger: {
        trigger: bg.parentElement,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });
  });
}

function initInteractions() {
  // Button interactions
  gsap.utils.toArray('.btn').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      gsap.to(btn, {
        duration: 0.3,
        scale: 1.05,
        ease: "power2.out"
      });
    });
    
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, {
        duration: 0.3,
        scale: 1,
        ease: "power2.out"
      });
    });
  });
}

function initContinuousAnimations() {
  // Floating elements
  gsap.to(".float", {
    y: -15,
    duration: 2,
    ease: "power1.inOut",
    repeat: -1,
    yoyo: true,
    stagger: {
      amount: 1,
      from: "random"
    }
  });
}
```

## 9. HTML Structure Examples

```html
<!-- Hero Section -->
<section class="hero">
  <div class="hero-bg parallax-bg"></div>
  <div class="hero-content">
    <h1 class="hero-title split-text">Amazing Website</h1>
    <p class="hero-subtitle fade-in">Creating incredible experiences</p>
    <button class="hero-cta btn scale-up">Get Started</button>
  </div>
</section>

<!-- Feature Cards -->
<section class="features">
  <div class="container">
    <h2 class="section-title slide-up">Our Features</h2>
    <div class="cards-grid">
      <div class="card fade-in">
        <div class="card-icon float"></div>
        <h3>Feature One</h3>
        <p>Description here</p>
      </div>
      <!-- More cards -->
    </div>
  </div>
</section>

<!-- Counter Section -->
<section class="stats">
  <div class="stat-item">
    <div class="counter" data-target="1000">0</div>
    <p>Happy Clients</p>
  </div>
  <!-- More stats -->
</section>
```

## 10. CSS Additions

```css
/* Transition overlay for page transitions */
.transition-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
  transform: scaleY(0);
  transform-origin: bottom;
  z-index: 9999;
}

/* Smooth performance */
.parallax-element,
.animated-element {
  will-change: transform;
}

/* Remove will-change after animations */
.animation-complete {
  will-change: auto;
}
```

## Usage Instructions for Cursor

1. **Install GSAP**: Add the CDN links or npm install
2. **Add CSS classes**: Copy the CSS setup to your stylesheet
3. **Structure HTML**: Add the animation classes to your elements
4. **Initialize JavaScript**: Add the complete implementation code
5. **Customize**: Modify selectors, timings, and effects to match your design
6. **Test**: Check animations on different screen sizes and devices

## Pro Tips

- Start with simple animations and build complexity
- Use `gsap.set()` for initial states instead of CSS when possible
- Always test performance on mobile devices
- Use ScrollTrigger's `scrub` property for smooth parallax
- Combine multiple small animations rather than one complex one
- Use stagger for elegant sequential animations
- Always clean up animations for better performance