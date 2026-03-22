import { OpenAPIHono } from "@hono/zod-openapi";
import type { Env } from "../../types";
import { presignedUrlRoute } from "./presigned-url";

export const uploadRoute = new OpenAPIHono<Env>();
uploadRoute.route("/", presignedUrlRoute);
