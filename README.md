# Procura Flow

Interactive procurement case study built with TypeScript, HTML, and CSS.

## Run locally

Install the dependencies and start the development server:

```powershell
npm install
npm run dev
```

Then open the local URL shown in the terminal. Do not open `index.html` by double-clicking it, because the browser cannot execute TypeScript directly. The build command compiles `main.ts` into the browser file used by the page.

## Publish with GitHub Pages

The repository includes a GitHub Actions workflow in `.github/workflows/deploy.yml`. In the repository settings, select **Settings > Pages > Source > GitHub Actions**. Every push to `main` will then build and publish the application.