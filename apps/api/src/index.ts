import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import type { Env } from "./types";
import { healthRoute } from "./routes/health";
import { verifyRoute } from "./routes/verify";
import { authRoute } from "./routes/auth";

const app = new OpenAPIHono<Env>();

app.use(
  "*",
  cors({
    origin: ["http://localhost:3000"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.route("/", healthRoute);
app.route("/", verifyRoute);
app.route("/", authRoute);

app.doc("/doc", {
  openapi: "3.0.0",
  info: { title: "Starter API", version: "0.0.1" },
});

export default app;
