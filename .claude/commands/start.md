Start all services (Docker + dev servers).

1. Run `docker compose up -d` to start PostgreSQL, Redis, and Redis REST
2. Run `pnpm db:migrate` to ensure database migrations are up to date
3. Run `pnpm dev` in the background to start all dev servers (API, Web, Admin)
4. Confirm all services are running and report their URLs