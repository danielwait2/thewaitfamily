# Wait Family Recipes

This project is a Dockerized full-stack application featuring:

- A MySQL database seeded with a few family-favorite recipes.
- An Express API for managing recipe content.
- A React frontend with public recipe browsing and a simple `/admin` dashboard to add, edit, or delete entries.

Run the stack locally and you will have a ready-to-use recipe site suitable for publishing behind `thewaitfamily.com/recipes`.

## Getting Started

### Prerequisites

- Docker Desktop installed and running.

### Launch the stack

```bash
docker-compose up --build
```

Services:

- Frontend: http://localhost:3001
- API: http://localhost:3000/api
- MySQL: localhost:3307 (user `root`, password `pass123`)

The first boot uses `script.sql` plus server-side seeding to ensure the `recipes` table exists and is populated.

## Frontend routes

- `/` – Hero-style landing page with quick links.
- `/recipes` – Recipe index. `/recipe` redirects here for convenience.
- `/recipes/:id` – Single recipe view with ingredients and instructions.
- `/admin` – Lightweight admin panel for managing recipes (no authentication is wired in yet).

To point the site at a different API host, set an environment variable before building the frontend:

```bash
export REACT_APP_API_URL=https://api.thewaitfamily.com/api
npm run build
```

## Managing recipes

Use the `/admin` page to:

- Add a recipe (title and description are required).
- Update existing recipes (pre-fills the form).
- Delete recipes after confirmation.

The backend exposes JSON endpoints under `/api/recipes` if you prefer to script updates.

## Deploying behind your domain

When you connect `thewaitfamily.com` (or any domain) to the frontend:

1. Proxy or rewrite `/api` requests to the backend service.
2. Serve the React app so that `/recipes` (and `/recipe`) resolve to the frontend build output.
3. Optionally set `REACT_APP_API_URL` during the build to avoid relying on same-origin proxying.

## Development tips

- Run `npm install` inside `frontend` and `backend` when you make dependency changes.
- Use `npm run dev` in the backend to enable auto-reload with `nodemon`.
- Update or add seed data in `backend/server.js` or `script.sql` as needed.
