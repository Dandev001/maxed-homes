# Maxed Homes - Brutalist Design System

## 🎨 Design Philosophy

This design system embraces **Brutalism** - a bold, uncompromising aesthetic that prioritizes functionality, directness, and raw visual impact. The design rejects decorative elements in favor of stark contrasts, heavy typography, and geometric precision.

## 🎯 Core Principles

### 1. **Stark Contrast**
- Primary: `bg-black` with `text-white`
- Secondary: `bg-white` with `text-black`
- No gradual transitions - only sharp, definitive contrasts

### 2. **Bold Typography**
- **Headlines**: `font-black` with `tracking-tight`
- **All-caps messaging** for maximum impact
- **No decorative fonts** - system fonts only
- **Massive scale** - up to `text-7xl` for headlines

### 3. **Geometric Brutalism**
- **Sharp corners** - no rounded elements
- **Raw geometric shapes** - squares and rectangles
- **Corner cuts** and **overlay elements**
- **Deliberate imperfection** for industrial feel

### 4. **Functional Layout**
- **Grid-based** responsive design
- **Asymmetrical** but purposeful layouts
- **Whitespace** used strategically, not decoratively
- **Content hierarchy** through size and contrast

## 📐 Implementation Guidelines

### Typography Scale
```css
/* Headlines */
.brutalist-headline {
  @apply text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight leading-none;
}

/* Subheadings */
.brutalist-subhead {
  @apply text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-none;
}

/* Body Text */
.brutalist-body {
  @apply text-lg sm:text-xl lg:text-2xl font-bold;
}

/* Service Lists */
.brutalist-service {
  @apply font-bold text-sm sm:text-base tracking-wide;
}
```

### Color Palette
```css
/* Primary Colors */
--brutalist-black: #000000
--brutalist-white: #ffffff
--brutalist-white-fade: rgba(255, 255, 255, 0.2)
--brutalist-black-fade: rgba(0, 0, 0, 0.8)

/* Usage */
.brutalist-primary { @apply bg-black text-white; }
.brutalist-secondary { @apply bg-white text-black; }
.brutalist-overlay { @apply bg-black/60; }
```

### Layout Patterns
```css
/* Section Spacing */
.brutalist-section {
  @apply py-16 sm:py-24 lg:py-32;
}

/* Content Container */
.brutalist-container {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
}

/* Grid System */
.brutalist-grid {
  @apply grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center;
}
```

### Geometric Elements
```css
/* Corner Cuts */
.brutalist-corner-cut-tr {
  @apply absolute top-0 right-0 w-8 h-8 sm:w-12 sm:h-12 bg-black;
}

.brutalist-corner-cut-tl {
  @apply absolute top-0 left-0 w-8 h-8 sm:w-12 sm:h-12 bg-black;
}

/* Accent Elements */
.brutalist-square-accent {
  @apply w-4 h-4 sm:w-6 sm:h-6 bg-black flex-shrink-0;
}

/* Image Overlays */
.brutalist-image-bar {
  @apply absolute bottom-0 left-0 w-full h-2 bg-white;
}
```

## 🏗️ Component Structure

### Standard Section Layout
```jsx
<section className="py-16 sm:py-24 lg:py-32 bg-black text-white overflow-hidden">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Header with geometric elements */}
    <motion.div className="mb-16 sm:mb-20 lg:mb-24">
      <div className="relative">
        <motion.h2 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight leading-none mb-6">
          MAIN TITLE
          <br />
          <span className="text-white/20">FADED PART</span>
        </motion.h2>
        <div className="absolute -top-4 -right-4 w-16 h-16 sm:w-24 sm:h-24 bg-white"></div>
      </div>
      <motion.p className="text-lg sm:text-xl lg:text-2xl font-bold max-w-4xl">
        SUBTITLE IN ALL CAPS
      </motion.p>
    </motion.div>
    
    {/* Content sections */}
    <div className="space-y-16 sm:space-y-24 lg:space-y-32">
      {/* Content cards */}
    </div>
  </div>
</section>
```

### Content Card Pattern
```jsx
<motion.div className="relative">
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
    {/* Content Box */}
    <div className="lg:col-span-7">
      <div className="relative bg-white text-black p-8 sm:p-12 lg:p-16">
        {/* Corner cut */}
        <div className="absolute top-0 right-0 w-8 h-8 sm:w-12 sm:h-12 bg-black"></div>
        
        {/* Title with accent */}
        <div className="flex items-start gap-4 mb-8">
          <div className="w-4 h-4 sm:w-6 sm:h-6 bg-black flex-shrink-0 mt-2"></div>
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-none">
            SECTION<br />TITLE<br />HERE
          </h3>
        </div>
        
        {/* Description */}
        <p className="text-base sm:text-lg font-bold mb-8 text-black/80">
          DESCRIPTION IN ALL CAPS
        </p>
        
        {/* Service list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {services.map((service, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-3 h-3 bg-black flex-shrink-0"></div>
              <span className="font-bold text-sm sm:text-base tracking-wide">{service}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
    
    {/* Image */}
    <div className="lg:col-span-5">
      <div className="relative">
        <img src={imageSource} className="w-full h-64 sm:h-80 lg:h-96 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-2 bg-white"></div>
      </div>
    </div>
  </div>
</motion.div>
```

## 🎬 Animation Patterns

### Entry Animations
```jsx
// Section Header
initial={{ opacity: 0, y: 60 }}
whileInView={{ opacity: 1, y: 0 }}
transition={{ duration: 0.8, ease: "easeOut" }}
viewport={{ once: true, margin: "-100px" }}

// Title Slide-in
initial={{ opacity: 0, x: -100 }}
whileInView={{ opacity: 1, x: 0 }}
transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}

// Content Cards
initial={{ opacity: 0, y: 100 }}
whileInView={{ opacity: 1, y: 0 }}
transition={{ duration: 0.8, ease: "easeOut" }}

// CTA Sections
initial={{ opacity: 0, scale: 0.9 }}
whileInView={{ opacity: 1, scale: 1 }}
transition={{ duration: 0.8, ease: "easeOut" }}
```

## 📱 Responsive Breakpoints

### Typography Scaling
- **Mobile**: `text-2xl` → **Tablet**: `text-3xl` → **Desktop**: `text-4xl`
- **Headlines**: `text-4xl` → `text-5xl` → `text-7xl`
- **Body**: `text-base` → `text-lg` → `text-2xl`

### Spacing System
- **Sections**: `py-16` → `py-24` → `py-32`
- **Content**: `mb-16` → `mb-20` → `mb-24`
- **Cards**: `p-8` → `p-12` → `p-16`

### Layout Changes
- **Mobile**: Single column stack
- **Tablet**: Maintains single column with larger spacing
- **Desktop**: 12-column grid with 7/5 or 5/7 splits

## 🔧 Button Styles

### Primary CTA
```jsx
<Link className="bg-black text-white px-8 py-4 font-black text-lg tracking-wide hover:bg-black/80 transition-colors w-full sm:w-auto text-center">
  ACTION TEXT
</Link>
```

### Secondary CTA
```jsx
<Link className="border-4 border-black text-black px-8 py-4 font-black text-lg tracking-wide hover:bg-black hover:text-white transition-colors w-full sm:w-auto text-center">
  ACTION TEXT
</Link>
```

## 💬 Prompts for Future Development

### When requesting new sections:
```
"Create a new section following the brutalist design system with:
- Black background with white text
- Bold, all-caps typography using font-black and tracking-tight
- Sharp geometric elements and corner cuts
- Grid-based layout with alternating image/content positions
- Framer Motion animations with the established patterns
- Responsive design following the mobile-first approach
- [Specific content requirements]"
```

### When requesting components:
```
"Design a [component type] using the brutalist design principles:
- Stark black/white contrast
- Heavy typography with no decorative elements
- Sharp corners and geometric accents
- Bold, direct messaging in all-caps
- Functional layout with strategic whitespace
- [Specific functionality requirements]"
```

### When requesting modifications:
```
"Modify the existing [section/component] while maintaining:
- Brutalist aesthetic with sharp contrasts
- Consistent typography hierarchy
- Geometric accent elements
- Responsive grid system
- Animation patterns established in the design system
- [Specific changes needed]"
```

## ✅ Quality Checklist

Before implementing any brutalist component, ensure:

- [ ] **Typography**: All headlines use `font-black` and `tracking-tight`
- [ ] **Contrast**: Stark black/white color scheme maintained
- [ ] **Geometry**: Sharp corners, no rounded elements
- [ ] **Layout**: Grid-based responsive structure
- [ ] **Animation**: Consistent motion patterns
- [ ] **Accessibility**: Sufficient contrast ratios maintained
- [ ] **Content**: All-caps messaging where appropriate
- [ ] **Spacing**: Consistent section and content spacing
- [ ] **Images**: Proper overlays and geometric accents applied

## 📋 Content Guidelines

### Messaging Tone
- **Direct and uncompromising**
- **Action-oriented language**
- **ALL-CAPS for emphasis**
- **No decorative or flowery language**
- **Bold, declarative statements**

### Service Lists
- Keep items **short and punchy**
- Use **ALL-CAPS** formatting
- **Bold, active language**
- **Parallel structure** across lists

### Headlines
- **Split across multiple lines** for impact
- **Fade secondary words** with opacity
- **Maximum 3 lines** for readability
- **Strong, commanding language**

---

*This design system ensures consistency across all brutalist implementations while maintaining the bold, uncompromising aesthetic that defines the Maxed Homes brand.* 