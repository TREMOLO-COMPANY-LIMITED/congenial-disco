export type Bindings = {
  DATABASE_URL: string;
  ENVIRONMENT: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET_NAME?: string;
  RESEND_API_KEY?: string;
  SENTRY_DSN?: string;
};

export type Env = { Bindings: Bindings };
