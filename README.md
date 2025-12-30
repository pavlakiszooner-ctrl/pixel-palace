# Pixel Palace Arcade Bar Website

A fully responsive, multi-page website for a fictional arcade bar featuring retro gaming, neon aesthetics, and interactive elements.

## 🎮 Features

### Pages
- **Home**: Hero section with arcade bar introduction and call-to-action buttons
- **Games**: Embedded Space Invaders game with play/pause controls and high score tracking
- **Menu**: Filterable food and drinks menu with gaming-themed items
- **Contact**: Contact form with client-side validation and opening hours

### Interactive Elements
- ✅ Responsive mobile-first navigation with hamburger menu
- ✅ Space Invaders game with pause/resume functionality
- ✅ Sound toggle (mute/unmute)
- ✅ High score persistence using localStorage
- ✅ Menu filtering (All, Cocktails, Beer & Wine, Non-Alcoholic, Food)
- ✅ Form validation with real-time feedback
- ✅ Neon glow effects and retro arcade aesthetic

### Technical Stack
- **HTML5**: Semantic markup with proper heading hierarchy
- **CSS3**: Custom properties, Grid, Flexbox, animations
- **Vanilla JavaScript (ES6)**: Modular code, no external frameworks
- **LocalStorage API**: High score persistence
- **Web Audio API**: Game sound effects

## 📁 Project Structure

```
my-javascript-app/
├── index.html              # Home page
├── games.html              # Games page with Space Invaders
├── menu.html               # Menu page with filtering
├── contact.html            # Contact form page
├── css/
│   └── main.css           # Main stylesheet with neon aesthetic
├── js/
│   ├── game-module.js     # Modular Space Invaders game
│   ├── navigation.js      # Mobile navigation handler
│   ├── storage.js         # LocalStorage utility module
│   └── analytics.js       # Google Analytics placeholder
├── game.js                 # Original game file (preserved)
└── styles.css              # Original styles (preserved)
```

## 🚀 Getting Started

### Local Development

1. **Clone or download** the project files
2. **Open** `index.html` in a modern web browser
3. **Navigate** between pages using the navigation menu

### Recommended Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### No Build Process Required
This is a static website using vanilla JavaScript. Simply open the HTML files in a browser - no compilation or build steps needed!

## 🎨 Design Features

### Neon/Retro Arcade Aesthetic
- Custom color palette with neon pink, blue, purple, and green
- Glow effects on headings and interactive elements
- Scanline animation overlay for authentic CRT feel
- Monospace font for headings (arcade terminal style)
- Dark background with radial gradients

### Responsive Design
- Mobile-first approach
- Breakpoints: 480px, 768px, 1200px
- Collapsible navigation on mobile
- Flexible grid layouts
- Touch-friendly button sizes

## 🕹️ Game Features

### Space Invaders
- **Controls**:
  - Arrow keys or A/D to move
  - Space to shoot
  - P to pause/resume
  - M to mute/unmute sound
- **Features**:
  - Increasing difficulty as enemies are destroyed
  - High score tracking with localStorage
  - Session high score display
  - Win/lose detection
  - Sound effects using Web Audio API

## 📊 SEO & Analytics

### Meta Tags (Per Page)
- Title tags optimized for search engines
- Meta descriptions (150-160 characters)
- Open Graph tags for social media sharing
- Proper heading hierarchy (H1 → H2 → H3)

### Google Analytics
- Placeholder script in `js/analytics.js`
- Custom event tracking for:
  - Game completions
  - Form submissions
  - Menu filtering
  - Page navigation

**To activate**: Replace `GA_MEASUREMENT_ID` in `analytics.js` with your actual Google Analytics 4 measurement ID.

## 🔧 JavaScript Modules

### game-module.js
Modular Space Invaders game with public API:
```javascript
SpaceInvadersGame.init(canvasId, scoreId, messageId)
SpaceInvadersGame.reset()
SpaceInvadersGame.togglePause()
SpaceInvadersGame.toggleMute()
SpaceInvadersGame.getScore()
```

### storage.js
LocalStorage utilities:
```javascript
StorageManager.getHighScore()
StorageManager.updateHighScore(score)
StorageManager.getPreference(key)
StorageManager.setPreference(key, value)
```

### navigation.js
Handles mobile menu toggle and active page highlighting.

### analytics.js
Google Analytics integration with custom event tracking.

## 📱 Accessibility

- Semantic HTML5 elements
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus visible states
- Screen reader friendly navigation
- Alt text on images (when added)
- Sufficient color contrast ratios

## 🎯 Interactive Elements

### Menu Filtering
Click category buttons to filter menu items dynamically.

### Contact Form Validation
- Real-time validation on blur
- Required field indicators
- Pattern matching for email/phone
- Success message display

### High Score System
- Automatically saves to localStorage
- Displays on home page and games page
- Persists across browser sessions
- New high score celebration

## 🌐 Browser Compatibility

### Modern Features Used
- CSS Grid & Flexbox
- CSS Custom Properties (CSS Variables)
- ES6 JavaScript (arrow functions, template literals, modules)
- LocalStorage API
- Web Audio API
- Canvas API

### Fallbacks
- Basic styling works without JavaScript
- Graceful degradation for older browsers
- No external dependencies

## 📝 Customization

### Colors
Edit CSS custom properties in `css/main.css`:
```css
:root {
  --neon-pink: #ff006e;
  --neon-blue: #00d9ff;
  --neon-purple: #b967ff;
  --neon-green: #05ffa1;
  /* ... more colors */
}
```

### Menu Items
Edit the `menuData` object in `menu.html`:
```javascript
const menuData = {
  cocktails: [ /* ... */ ],
  beer: [ /* ... */ ],
  // ...
}
```

## 🚀 Deployment

### Static Hosting Options
- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting
- AWS S3 + CloudFront

### Steps
1. Upload all files to hosting service
2. Set `index.html` as the default page
3. Update Google Analytics ID (optional)
4. Update Open Graph image URLs
5. Submit sitemap to search engines

## 📄 Sitemap Structure

```
/
├── index.html (Home)
├── games.html (Games)
├── menu.html (Menu)
└── contact.html (Contact)
```

## 🔒 Security Notes

- Form submission is client-side only (no backend)
- No sensitive data collected or stored
- LocalStorage used only for game scores
- HTTPS recommended for production

## 📜 License

This is a demonstration project for educational purposes.

## 🤝 Contributing

This is a standalone project, but feel free to use it as a template for your own arcade bar or gaming venue website!

## 📞 Support

For questions or issues, please refer to the contact page structure as a template for real-world implementation.

---

**Built with ❤️ and 🕹️ by a senior front-end developer**

*Last Updated: December 2025*
