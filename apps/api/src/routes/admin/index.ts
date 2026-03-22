import { OpenAPIHono } from "@hono/zod-openapi";
import { adminMiddleware, type AdminEnv } from "./middleware";
import { adminMeRoute } from "./me";
import { adminUsersRoute } from "./users";

export const adminRoute = new OpenAPIHono<AdminEnv>();

adminRoute.use("*", adminMiddleware);
adminRoute.route("/", adminMeRoute);
adminRoute.route("/", adminUsersRoute);
