# Memory Cake Web App

A GitHub Pages-ready static web app where a 3D cake is divided into pre-cut slices, and each slice reveals a hidden memory image when clicked.

## Files

- `index.html`
- `styles.css`
- `script.js`
- `assets/images/memory-1.svg` ... `memory-8.svg`

## How to add your own images

1. Open `assets/images`
2. Replace these files with your own images:
   - `memory-1.svg`
   - `memory-2.svg`
   - `memory-3.svg`
   - `memory-4.svg`
   - `memory-5.svg`
   - `memory-6.svg`
   - `memory-7.svg`
   - `memory-8.svg`
3. You can use `.jpg`, `.jpeg`, `.png`, or `.webp` too.
4. If you change file names or file types, update the `--img:url(...)` values inside `index.html`.

## Deploy on GitHub Pages

1. Create a GitHub repository.
2. Upload all files in this folder.
3. In GitHub, go to **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and `/root` folder.
6. Save.

Your app should be live in a minute or two.

## Notes

- The app is fully static, so it works well on GitHub Pages.
- The 3D look is created with CSS transforms, layered faces, shadows, and animated slice movement.
- Click **Reset cake** to close all slices again.
- Click **Start presentation** to open a fullscreen slideshow with previous/next controls.
