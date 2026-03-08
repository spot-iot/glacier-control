# Favicon Setup Guide

## Recommended Sizes

For a simple setup, use **32x32 or 64x64 pixels**. This works well for:
- Browser tabs (16x16, 32x32)
- Bookmarks
- Most modern browsers

For a complete setup, you can create multiple sizes:
- **16x16** - Classic favicon
- **32x32** - Standard favicon (recommended minimum)
- **64x64** - High-DPI displays
- **180x180** - Apple touch icon (iOS)
- **192x192** - PWA icon
- **512x512** - PWA icon (large)

## Steps to Add Your Favicon

1. **Resize your PNG image:**
   - Recommended: **32x32 pixels** or **64x64 pixels**
   - Use an image editor or online tool like [favicon.io](https://favicon.io) or [realfavicongenerator.net](https://realfavicongenerator.net)

2. **Save the file:**
   - Name it `favicon.png` or `favicon.ico`
   - Place it in the `public/` folder

3. **The code is already updated** in `index.html` to use your favicon

## File Formats

- **PNG**: Works in modern browsers, easy to create
- **ICO**: More compatible, can contain multiple sizes
- **SVG**: Scalable, but not all browsers support it as favicon

## Quick Setup

1. Resize your PNG to **32x32** or **64x64**
2. Save it as `public/favicon.png`
3. The site will automatically use it!

## Advanced: Multiple Sizes

If you want to support all devices, you can add multiple favicon links in `index.html`:

```html
<!-- Standard favicon -->
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />

<!-- Apple touch icon -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

<!-- PWA icons -->
<link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png" />
<link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png" />
```

## Online Tools

- [favicon.io](https://favicon.io) - Generate favicons from images
- [realfavicongenerator.net](https://realfavicongenerator.net) - Complete favicon generator
- [favicon-generator.org](https://www.favicon-generator.org) - Simple generator
