Start the local development stack for this repository.

1. Run `docker compose up -d` to start PostgreSQL, Redis, and the Redis REST proxy.
2. Run `pnpm db:migrate` to apply pending Drizzle migrations.
3. Run `pnpm dev` to start the API, Web, and Admin apps.
4. Confirm the following URLs when startup succeeds:
   - `http://localhost:3000`
   - `http://localhost:3001`
   - `http://localhost:8787`
