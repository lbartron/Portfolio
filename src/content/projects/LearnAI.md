---
title: "LearnAI"
description: "A learning tool for fundamental AI concepts built for UWBHacks 2026."
featured: true
themeColor: "#18a72b"
liveUrl: "https://uwblearnai.netlify.app/"
githubUrl: "https://github.com/BountyBro/uwbHacks2026"
detailsUrl: ""
devpostUrl: "https://devpost.com/software/tbd-nymx0o"
projectTags: ["Python", "HTML", "Research"]
spotlight: true
image: "../../assets/images/LearnAI.png"
---

## Project Overview

A comprehensive, interactive website dedicated to teaching artificial intelligence fundamentals to learners of all levels.

This website features an educational platform with three main learning modules:

1. **How does AI work?** - Learn the fundamental concepts and mechanisms behind artificial intelligence systems
2. **How is AI used?** - Explore real-world applications of AI across different industries and learn about ethical concerns
3. **How do you identify AI content?** - Develop skills to recognize and critically evaluate AI-generated content

## Design

- **Color Scheme**: Pastel blue (#a8d8e8) and white (#ffffff)
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Accessibility**: Clean, readable typography and high contrast colors

## File Structure

```
uwbHacks2026/
├── index.html          # Landing page
├── aboutus.html        # "About Us" page
├── contribute.html     # "Contribute" page
├── module1.html        # "How does AI work?" module
├── module2.html        # "How is AI used?" module
├── module3.html        # "How do you identify AI content?" module
├── styles.css          # Stylesheet with all design elements
└── README.md           # This file
└── Images              # Asset folder for page images and the favicon
```

## How to Run Locally

### Option 1: Using Python (Recommended for macOS)

1. Open Terminal and navigate to the project folder:
   ```bash
   cd /Users/[YourUserName]/Documents/uwbHacks2026
   ```

2. Start a simple HTTP server:
   ```bash
   # For Python 3
   python3 -m http.server 8000
   
   # For Python 2 (if Python 3 is not available)
   python -m SimpleHTTPServer 8000
   ```

3. Open your browser and go to:
   ```
   http://localhost:8000
   ```

### Option 2: Using Node.js (if installed)

1. Install a simple HTTP server:
   ```bash
   npm install -g http-server
   ```

2. Navigate to the project folder and run:
   ```bash
   http-server
   ```

3. Open your browser to the address shown (typically `http://localhost:8080`)

### Option 3: Using VS Code Live Server Extension

1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html` and select "Open with Live Server"
3. Your default browser will open the website automatically

## Features

- **Navigation System**: Easy navigation between the landing page and all modules
- **Interactive Cards**: Hover effects and smooth transitions on module cards
- **Content Organization**: Clearly structured content with multiple sections
- **Responsive Grid Layouts**: Content automatically adapts to screen size
- **Semantic HTML**: Well-structured markup for accessibility
- **CSS Variables**: Easy color customization through CSS root variables

## Content Highlights

### Module 1: How does AI work?
- Definition of artificial intelligence
- Key components (Machine Learning, Neural Networks, NLP, Data)
- How AI learns (Training, Pattern Recognition, Adjustment, Application)

### Module 2: How is AI used?
- AI in everyday life
- Applications across 8 industries (Healthcare, Transportation, E-commerce, Entertainment, Finance, Agriculture, Education, Environment)
- Benefits of AI implementation

### Module 3: How do you identify AI content?
- Types of AI-generated content (Text, Images, Audio/Voice, Video)
- Red flags and indicators for each content type
- Verification strategies and critical thinking questions

## Browser Compatibility

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Customization

To modify colors, edit the CSS variables at the top of `styles.css`:

```css
:root {
    --pastel-blue: #a8d8e8;
    --pastel-green: #a8e8d8;
    --pastel-purple: #d4a8e8;
    --white: #ffffff;
    --dark-text: #2c3e50;
    --light-gray: #f8f9fa;
    --border-color: #e0e0e0;
}
```

## Future Enhancements

- Interactive quizzes and assessments
- Video content and tutorials
- User progress tracking
- Discussion forums or comments
- PDF downloads of module content
- Dark mode toggle
- Multi-language support

## License

This project is created for educational purposes as part of UWB Hacks 2026.

---

**Last Updated**: 2026-04-24