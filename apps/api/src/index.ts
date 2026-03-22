import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import type { Env } from "./types";
import { healthRoute } from "./routes/health";
import { verifyRoute } from "./routes/verify";
import { authRoute } from "./routes/auth";
import { uploadRoute } from "./routes/upload";
import { adminRoute } from "./routes/admin";

const app = new OpenAPIHono<Env>();

app.use(
  "*",
  cors({
    origin: (origin, c) => {
      const allowed = [
        c.env.WEB_URL || "http://localhost:3000",
        c.env.ADMIN_URL || "http://localhost:3001",
      ];
      return allowed.includes(origin) ? origin : "";
    },
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.route("/", healthRoute);
app.route("/", verifyRoute);
app.route("/", authRoute);
app.route("/", uploadRoute);
app.route("/", adminRoute);

app.doc("/doc", {
  openapi: "3.0.0",
  info: { title: "Starter API", version: "0.0.1" },
});

export default app;
