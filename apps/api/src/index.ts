import { OpenAPIHono } from "@hono/zod-openapi";
import { healthRoute } from "./routes/health";

type Bindings = {
  DATABASE_URL: string;
  ENVIRONMENT: string;
};

const app = new OpenAPIHono<{ Bindings: Bindings }>();

app.route("/", healthRoute);

app.doc("/doc", {
  openapi: "3.0.0",
  info: { title: "Starter API", version: "0.0.1" },
});

export default app;
