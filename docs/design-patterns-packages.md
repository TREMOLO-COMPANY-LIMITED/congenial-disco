# Shared Packages - Design Pattern Diagrams

## Monorepo Architecture Overview

```mermaid
graph TB
    subgraph "Apps"
        API["apps/api<br/>Hono.js API"]
        Web["apps/web<br/>Next.js Frontend"]
    end

    subgraph "Packages"
        DB["@starter/db<br/>Drizzle ORM Schema & Client"]
        Shared["@starter/shared<br/>Zod Schemas & Types"]
        UI["@starter/ui<br/>shadcn/ui Components"]
        TSConfig["@starter/typescript-config<br/>TSConfig Presets"]
        ESLint["@starter/eslint-config<br/>Shared Linting"]
    end

    subgraph "Build System"
        Turbo["Turborepo"]
        PNPM["pnpm Workspaces"]
    end

    API --> DB
    API --> Shared
    Web --> Shared
    Web --> UI
    API --> TSConfig
    Web --> TSConfig
    API --> ESLint
    Web --> ESLint

    Turbo --> API
    Turbo --> Web
    PNPM --> Packages
```

## @starter/db - Database Package

```mermaid
graph TB
    subgraph "@starter/db"
        subgraph "Schema (schema/index.ts)"
            Users["users table<br/>id, email, name, image,<br/>role, banned, emailVerified"]
            Sessions["sessions table<br/>id, userId, token,<br/>expiresAt, ipAddress"]
            Accounts["accounts table<br/>id, userId, providerId,<br/>accessToken, refreshToken"]
            Verifications["verifications table<br/>id, identifier, value,<br/>expiresAt"]
        end

        subgraph "Client (client.ts)"
            Factory["createDb(connectionString)<br/>→ Drizzle Client"]
        end

        subgraph "Exports (index.ts)"
            ExportDB["createDb"]
            ExportSQL["sql, eq, ilike, or, count"]
            ExportSchema["users, sessions, accounts, verifications"]
        end

        Users -.->|"FK: userId"| Sessions
        Users -.->|"FK: userId"| Accounts
    end

    subgraph "Consumers"
        APIRoutes["API Route Handlers"]
        AuthLib["Auth Library"]
        AdminMW["Admin Middleware"]
    end

    ExportDB --> APIRoutes
    ExportSQL --> APIRoutes
    ExportSchema --> APIRoutes
    ExportDB --> AuthLib
    ExportSchema --> AuthLib
    ExportSchema --> AdminMW
```

## @starter/shared - Schema Sharing Pattern

```mermaid
graph TB
    subgraph "@starter/shared"
        subgraph "types/auth.ts"
            PasswordSchema["passwordSchema<br/>(min 8, uppercase, number)"]
            LoginSchema["loginSchema<br/>{email, password}"]
            RegisterSchema["registerSchema<br/>{name, email, password,<br/>passwordConfirmation}<br/>+ refine(passwords match)"]
        end

        subgraph "types/admin.ts"
            RoleSchema["userRoleSchema<br/>enum: user | admin | super_admin"]
            ListQuery["adminUserListQuerySchema<br/>{page, limit, search}"]
            UpdateRole["adminUserUpdateRoleSchema"]
            UpdateStatus["adminUserUpdateStatusSchema"]
            UserResponse["adminUserSchema"]
            ListResponse["adminUserListResponseSchema"]
        end

        subgraph "types/upload.ts"
            Constants["ALLOWED_IMAGE_TYPES<br/>MAX_FILE_SIZE (5MB)"]
            PresignedReq["presignedUrlRequestSchema"]
            PresignedRes["presignedUrlResponseSchema"]
        end

        subgraph "utils/index.ts"
            FormatDate["formatDate()"]
        end
    end

    subgraph "Backend Usage"
        OpenAPI["OpenAPI Route Definition<br/>request / response schemas"]
        Validation["c.req.valid('query')<br/>c.req.valid('json')"]
    end

    subgraph "Frontend Usage"
        FormResolver["zodResolver(schema)<br/>React Hook Form"]
        TypeInfer["z.infer&lt;typeof schema&gt;<br/>TypeScript types"]
    end

    LoginSchema --> OpenAPI
    LoginSchema --> FormResolver
    RegisterSchema --> FormResolver
    ListQuery --> OpenAPI
    UserResponse --> OpenAPI
    PresignedReq --> OpenAPI
    ListQuery --> TypeInfer
    UserResponse --> TypeInfer
```

## @starter/ui - Component Library Pattern

```mermaid
graph TB
    subgraph "@starter/ui"
        subgraph "Foundation"
            CN["cn() utility<br/>clsx + tailwind-merge"]
        end

        subgraph "CVA Components"
            Button["Button<br/>variants: default, destructive,<br/>outline, secondary, ghost, link<br/>sizes: default, sm, lg, icon"]
            Badge["Badge<br/>variants: default, secondary,<br/>destructive, outline, success, warning"]
        end

        subgraph "Composition Components"
            Card["Card → CardHeader → CardTitle<br/>→ CardDescription → CardContent<br/>→ CardFooter"]
            TableComp["Table → TableHeader → TableBody<br/>→ TableRow → TableHead<br/>→ TableCell → TableCaption"]
        end

        subgraph "Form Components"
            Input["Input"]
            Label["Label"]
            Separator["Separator"]
        end
    end

    subgraph "Design Patterns"
        ForwardRef["forwardRef&lt;HTMLElement, Props&gt;"]
        CVA["class-variance-authority<br/>variant + size system"]
        ClassName["className prop override<br/>via cn() merge"]
    end

    ForwardRef --> Button
    ForwardRef --> Card
    ForwardRef --> Input
    CVA --> Button
    CVA --> Badge
    CN --> ClassName
    ClassName --> Button
    ClassName --> Card
    ClassName --> Input
```

## TypeScript Config Inheritance

```mermaid
graph TB
    subgraph "@starter/typescript-config"
        Base["base.json<br/>ES2022, strict, declarations"]
        NextJS["nextjs.json<br/>extends base<br/>+ Next.js plugin, DOM libs"]
        Hono["hono.json<br/>extends base<br/>+ CF Workers types, JSX"]
    end

    subgraph "Apps"
        APIConfig["apps/api/tsconfig.json"]
        WebConfig["apps/web/tsconfig.json"]
    end

    Base --> NextJS
    Base --> Hono
    Hono -->|"extends"| APIConfig
    NextJS -->|"extends"| WebConfig
```

## Turborepo Build Pipeline

```mermaid
graph LR
    subgraph "Build Order (dependsOn: ['^build'])"
        direction LR
        PkgBuild["1. Package Builds<br/>db, shared, ui,<br/>typescript-config,<br/>eslint-config"]
        AppBuild["2. App Builds<br/>api, web"]
    end

    subgraph "Task Pipeline"
        Build["build"]
        Lint["lint<br/>(dependsOn: ['^build'])"]
        Dev["dev<br/>(persistent: true)"]
        Test["test"]
    end

    PkgBuild --> AppBuild
    Build --> Lint
```

## Data Flow Across Packages

```mermaid
graph LR
    subgraph "Define Once"
        ZodSchema["Zod Schema<br/>(@starter/shared)"]
        DBSchema["DB Schema<br/>(@starter/db)"]
    end

    subgraph "Backend (apps/api)"
        OpenAPIDef["OpenAPI Route<br/>request/response"]
        Middleware["Middleware<br/>validation"]
        DBQuery["DB Queries<br/>Drizzle ORM"]
    end

    subgraph "Frontend (apps/web)"
        FormVal["Form Validation<br/>zodResolver"]
        TypeSafe["Type-safe Props<br/>z.infer&lt;T&gt;"]
        UIComp["UI Components<br/>(@starter/ui)"]
    end

    ZodSchema --> OpenAPIDef
    ZodSchema --> Middleware
    ZodSchema --> FormVal
    ZodSchema --> TypeSafe
    DBSchema --> DBQuery
    DBSchema --> Middleware
    UIComp --> TypeSafe
```
