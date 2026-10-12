# Daymark frontend

React + Vite task dashboard for the Spring Boot API in the project root. The backend files remain where they are; this is a separate frontend app in `frontend/`.

## Run locally

1. Start MySQL and the Spring Boot backend on port `8080` using the root project instructions.
2. From this folder, run `npm install` and `npm run dev`.
3. Open the local URL printed by Vite. The Vite development server forwards `/api` requests to `http://localhost:8080`.

## Deploy to Vercel

Set the Vercel project root directory to `frontend`. Vercel will use `npm run build` and the `dist` output directory. Add this environment variable in the Vercel project settings:

```text
VITE_API_BASE_URL=https://your-public-backend.example.com
```

The Spring Boot API must be deployed separately at that HTTPS address, and configured to allow the Vercel site's origin by setting the backend environment variable:

```text
CORS_ALLOWED_ORIGINS=https://your-project.vercel.app
```

For multiple domains or custom domains, provide a comma-separated list (e.g. `https://your-project.vercel.app,https://your-custom-domain.com`). Local Vite development origins (`http://localhost:5173`, `http://127.0.0.1:5173`) are always permitted by default.

This frontend intentionally sends only `name`, `email`, and `password` to registration; it does not expose a role selector.
