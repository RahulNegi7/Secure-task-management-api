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

---

## 🛠️ Troubleshooting & FAQs

### 1. White Screen / Endless Loading on localhost
* **Port Conflict (Port 5173 occupied):** If an older Node process is running in the background, Vite automatically shifts to `http://localhost:5174/`. If your browser opens `5173`, it hits the stale process. Check the terminal output for the exact URL, or run:
  ```bash
  killall node
  npm run dev
  ```
* **First-Time Dependency Pre-bundling:** On a cold start without an existing `.vite/deps` cache, Vite uses `esbuild` to optimize dependencies (`react`, `react-dom`). This may delay initial bundle response for a moment on first launch. Once pre-bundled and cached, all subsequent reloads respond in milliseconds.
* **Direct File Opening (`file://`):** Do not double-click `index.html` in Finder or VS Code. Browsers block ES module imports on the `file://` protocol. Always use `http://localhost:5173`.
* **Port Confusion:** Ensure you are loading `http://localhost:5173` (Frontend), not `http://localhost:8080` (Backend API).
* **Browser Diagnostics:** Open Developer Tools (`Cmd + Option + I` on Mac $\rightarrow$ **Console** tab) to view any network or JavaScript error messages.
