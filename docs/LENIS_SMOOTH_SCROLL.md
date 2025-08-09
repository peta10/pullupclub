# Lenis Smooth Scroll Implementation

This document outlines the comprehensive Lenis smooth scrolling implementation across the Pull-Up Club application.

## 🚀 Features Implemented

### ✅ Global Smooth Scrolling
- **SmoothScrollProvider**: Global provider that initializes Lenis for the entire app
- **Auto-enabled**: Works on all pages without additional configuration
- **Performance optimized**: Uses requestAnimationFrame for 60fps scrolling

### ✅ Hook-based API
- **useLenis**: Custom hook for programmatic scroll control
- **scrollTo()**: Scroll to any target (element, selector, or position)
- **scrollToTop()**: Quick scroll to page top
- **scrollToElement()**: Scroll to specific elements by selector

### ✅ Enhanced Components
- **SmoothScrollLink**: Smart link component with smooth anchor scrolling
- **SmoothScrollContainer**: Container with internal smooth scrolling for sliders/carousels
- **Modal prevention**: `data-lenis-prevent` on modals and dropdowns

### ✅ Navigation Integration
- **Header logo**: Smooth scroll to top when clicking logo on same page
- **Anchor links**: Automatic smooth scrolling for hash links
- **Section IDs**: Added to all major home sections for navigation

## 📁 File Structure

```
components/
├── providers/
│   └── SmoothScrollProvider.tsx    # Global Lenis initialization
├── ui/
│   ├── SmoothScrollLink.tsx        # Enhanced Link with smooth scrolling
│   └── SmoothScrollContainer.tsx   # Smooth scrolling container
└── Layout/
    └── Header.tsx                  # Enhanced with smooth scroll to top

hooks/
└── useLenis.ts                     # Custom hook for smooth scroll control

app/
├── providers.tsx                   # SmoothScrollProvider integration
└── globals.css                     # Lenis CSS styles
```

## 🎯 Usage Examples

### Basic Smooth Scroll Hook
```tsx
import { useLenis } from '../hooks/useLenis'

const MyComponent = () => {
  const { scrollTo, scrollToTop, scrollToElement } = useLenis()

  return (
    <div>
      <button onClick={() => scrollToTop()}>Go to top</button>
      <button onClick={() => scrollToElement('#section')}>Go to section</button>
      <button onClick={() => scrollTo(1000)}>Scroll to 1000px</button>
    </div>
  )
}
```

### Enhanced Link Component
```tsx
import { SmoothScrollLink } from '../components/ui/SmoothScrollLink'

// Automatically smooth scrolls to anchor
<SmoothScrollLink href="#how-it-works">How It Works</SmoothScrollLink>

// Regular navigation for pages
<SmoothScrollLink href="/leaderboard">Leaderboard</SmoothScrollLink>

// External links (auto-detected)
<SmoothScrollLink href="https://example.com">External</SmoothScrollLink>
```

### Smooth Scrolling Container
```tsx
import { SmoothScrollContainer } from '../components/ui/SmoothScrollContainer'

// Vertical smooth scrolling container
<SmoothScrollContainer className="h-96 overflow-y-auto">
  <div className="space-y-4">
    {/* Long content */}
  </div>
</SmoothScrollContainer>

// Horizontal smooth scrolling (for sliders)
<SmoothScrollContainer horizontal className="flex overflow-x-auto">
  <div className="flex space-x-4">
    {/* Slider items */}
  </div>
</SmoothScrollContainer>
```

### Preventing Smooth Scroll
```tsx
// Add data-lenis-prevent to modals, dropdowns, or any element
<div className="modal" data-lenis-prevent>
  <div className="modal-content" data-lenis-prevent>
    {/* Modal content that shouldn't scroll the background */}
  </div>
</div>
```

## ⚙️ Configuration

### Lenis Settings (SmoothScrollProvider.tsx)
```tsx
const lenis = new Lenis({
  duration: 1.2,                    // Scroll duration
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Easing function
  direction: 'vertical',            // Scroll direction
  gestureDirection: 'vertical',     // Gesture direction
  smooth: true,                     // Enable smooth scrolling
  mouseMultiplier: 1,               // Mouse wheel multiplier
  smoothTouch: false,               // Touch device smoothing (disabled for performance)
  touchMultiplier: 2,               // Touch multiplier
  infinite: false,                  // Infinite scroll
})
```

### CSS Classes Applied
```css
/* Auto-applied by Lenis */
html.lenis,
html.lenis body {
  height: auto;
}

.lenis.lenis-smooth {
  scroll-behavior: auto !important;
}

.lenis.lenis-smooth [data-lenis-prevent] {
  overscroll-behavior: contain;
}

.lenis.lenis-stopped {
  overflow: hidden;
}

.lenis.lenis-scrolling iframe {
  pointer-events: none;
}
```

## 🎯 Where It's Active

### ✅ Global Pages
- All pages have smooth scrolling enabled
- Header navigation with smooth scroll to top
- All internal navigation

### ✅ Home Page Sections
- `#how-it-works` - How It Works section
- `#leaderboard` - Leaderboard Preview section  
- `#testimonials` - Testimonials section
- All anchor links scroll smoothly

### ✅ Protected Elements
- Language selector dropdown: `data-lenis-prevent`
- PayPal email modal: `data-lenis-prevent`
- Any future modals/overlays

### ✅ Enhanced Navigation
- Header logo smooth scrolls to top when on same page
- All anchor links automatically use smooth scrolling
- Programmatic scroll methods available everywhere

## 🚀 Performance Benefits

1. **60fps Scrolling**: Uses requestAnimationFrame for optimal performance
2. **Native Feel**: Smooth, natural scrolling on all devices
3. **Touch Optimized**: Disabled smooth touch for better mobile performance
4. **Memory Efficient**: Proper cleanup on component unmount
5. **No Layout Shifts**: Prevents scrolling-related layout issues

## 🔧 Extending the Implementation

### Adding New Scrollable Sections
```tsx
// 1. Add an ID to your section
<section id="my-section" className="py-16">
  {/* Content */}
</section>

// 2. Link to it from anywhere
<SmoothScrollLink href="#my-section">Go to My Section</SmoothScrollLink>

// 3. Or programmatically
const { scrollToElement } = useLenis()
scrollToElement('#my-section')
```

### Creating Custom Scroll Behaviors
```tsx
const { scrollTo } = useLenis()

// Custom scroll with options
const scrollToContact = () => {
  scrollToElement('#contact', {
    offset: -100,    // Offset from top
    duration: 2,     // Custom duration
  })
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Modal still scrolling background**: Add `data-lenis-prevent` to modal container
2. **Slider not working**: Use `SmoothScrollContainer` with `horizontal={true}`
3. **Touch scrolling issues**: Ensure `smoothTouch: false` in config
4. **Performance issues**: Check for nested scroll containers and add `data-lenis-prevent`

### Browser Compatibility
- ✅ Chrome/Edge 80+
- ✅ Firefox 75+  
- ✅ Safari 13+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 📈 Next Steps

Future enhancements could include:
- Scroll-triggered animations with GSAP ScrollTrigger
- Parallax effects on hero sections
- Advanced easing curves for different sections
- Scroll progress indicators
- Virtual scrolling for large datasets

---

**The smooth scrolling implementation is now active across the entire Pull-Up Club application!** 🎉
