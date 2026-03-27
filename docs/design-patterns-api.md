# API App (Hono.js) - Design Pattern Diagrams

## Overall Architecture

```mermaid
graph TB
    subgraph "Cloudflare Workers"
        Entry["index.ts<br/>OpenAPIHono&lt;Env&gt;"]

        subgraph "Global Middleware"
            CORS["CORS Middleware<br/>(Dynamic Origin)"]
        end

        subgraph "Routes"
            Health["/health"]
            Auth["/api/auth/*<br/>Better Auth Handler"]
            Upload["/api/upload/*"]
            Verify["/verify/*"]
            Admin["/api/admin/*"]
        end

        Entry --> CORS
        CORS --> Health
        CORS --> Auth
        CORS --> Upload
        CORS --> Verify
        CORS --> Admin
    end

    subgraph "External Services"
        DB[(Supabase PostgreSQL)]
        R2[(Cloudflare R2)]
        Redis[(Upstash Redis)]
        Resend[Resend Email]
    end

    Auth --> DB
    Upload --> R2
    Admin --> DB
    Verify --> DB
    Verify --> Redis
    Auth --> Resend
```

## Request Processing Flow

```mermaid
sequenceDiagram
    participant Client
    participant CORS as CORS Middleware
    participant Route as Route Handler
    participant ZodVal as Zod Validation
    participant MW as Auth Middleware
    participant DB as Database
    participant Res as Response

    Client->>CORS: HTTP Request
    CORS->>CORS: Validate Origin (WEB_URL / ADMIN_URL)
    CORS->>Route: Pass to matched route

    alt OpenAPI Route
        Route->>ZodVal: Validate request (query/params/body)
        ZodVal-->>Client: 400 Error (if invalid)
        ZodVal->>MW: Validated data
    end

    alt Protected Route
        MW->>MW: getSession(headers)
        MW-->>Client: 401 Unauthorized
        MW->>MW: Check role (admin/super_admin)
        MW-->>Client: 403 Forbidden
        MW->>MW: c.set("adminUser", user)
    end

    MW->>DB: Query (Drizzle ORM)
    DB->>Res: Result
    Res->>Client: JSON Response
```

## Route Composition Pattern

```mermaid
graph LR
    subgraph "App Entry (index.ts)"
        App["OpenAPIHono&lt;Env&gt;"]
    end

    subgraph "Feature Routes"
        HR["healthRoute"]
        VR["verifyRoute"]
        AR["authRoute"]
        UR["uploadRoute"]
        ADR["adminRoute"]
    end

    subgraph "Admin Sub-Routes"
        AMW["adminMiddleware<br/>(auth + role check)"]
        AMR["adminMeRoute"]
        AUR["adminUsersRoute"]
    end

    App -->|".route('/', ...)"| HR
    App -->|".route('/', ...)"| VR
    App -->|".route('/', ...)"| AR
    App -->|".route('/', ...)"| UR
    App -->|".route('/', ...)"| ADR

    ADR -->|".use('*', ...)"| AMW
    ADR -->|".route('/', ...)"| AMR
    ADR -->|".route('/', ...)"| AUR
```

## OpenAPI Route Definition Pattern

```mermaid
graph TD
    subgraph "Route Definition (createRoute)"
        Method["method: 'get' | 'post' | 'put' | 'patch'"]
        Path["path: '/api/admin/users'"]
        ReqSchema["request:<br/>query / params / body<br/>(Zod Schemas)"]
        ResSchema["responses:<br/>200 / 400 / 401 / 403 / 404<br/>(Zod Schemas)"]
    end

    subgraph "Handler (.openapi)"
        Valid["c.req.valid('query')<br/>c.req.valid('param')<br/>c.req.valid('json')"]
        Logic["Business Logic"]
        Response["c.json(data, status)"]
    end

    subgraph "Shared Package (@starter/shared)"
        SharedSchemas["adminUserListQuerySchema<br/>adminUserUpdateRoleSchema<br/>presignedUrlRequestSchema"]
    end

    SharedSchemas --> ReqSchema
    SharedSchemas --> ResSchema
    Method --> Valid
    Path --> Valid
    ReqSchema --> Valid
    Valid --> Logic
    Logic --> Response
```

## Factory Pattern (Service Instantiation)

```mermaid
graph TB
    subgraph "Environment Bindings (Env)"
        ENV["c.env.DATABASE_URL<br/>c.env.RESEND_API_KEY<br/>c.env.R2_*<br/>c.env.UPSTASH_*"]
    end

    subgraph "Factory Functions"
        CDB["createDb(connectionString)"]
        CAuth["createAuth(env)"]
        CR2["createR2Client(env)"]
        CRedis["new Redis(url, token)"]
        CResend["new Resend(apiKey)"]
    end

    subgraph "Instances"
        DB["Drizzle DB Client"]
        AuthInst["Better Auth Instance"]
        R2Client["S3Client (R2)"]
        RedisInst["Redis Client"]
        ResendInst["Resend Client"]
    end

    ENV --> CDB --> DB
    ENV --> CAuth --> AuthInst
    ENV --> CR2 --> R2Client
    ENV --> CRedis --> RedisInst
    ENV --> CResend --> ResendInst
```

## Admin Middleware Pattern

```mermaid
flowchart TD
    Start["Request to /api/admin/*"] --> GetSession["auth.api.getSession(headers)"]
    GetSession --> HasSession{Session exists?}
    HasSession -->|No| Return401["Return 401<br/>'Not authenticated'"]
    HasSession -->|Yes| QueryDB["Query user from DB"]
    QueryDB --> UserFound{User found?}
    UserFound -->|No| Return401
    UserFound -->|Yes| CheckRole{role == admin<br/>or super_admin?}
    CheckRole -->|No| Return403["Return 403<br/>'Not authorized'"]
    CheckRole -->|Yes| SetContext["c.set('adminUser', user)"]
    SetContext --> Next["await next()"]
    Next --> Handler["Route Handler<br/>c.get('adminUser')"]
```

## Verify Aggregation Pattern

```mermaid
graph TB
    subgraph "Individual Verify Endpoints"
        VDB["/verify/database"]
        VAuth["/verify/auth"]
        VRedis["/verify/redis"]
        VR2["/verify/r2"]
    end

    subgraph "Aggregated Endpoint"
        VAll["/verify/all"]
        AllSettled["Promise.allSettled()"]
    end

    VAll --> AllSettled
    AllSettled --> VDB
    AllSettled --> VAuth
    AllSettled --> VRedis
    AllSettled --> VR2

    AllSettled --> Response["Response:<br/>category, status, duration<br/>(graceful degradation)"]
```

## Error Handling Pattern

```mermaid
graph TD
    subgraph "Error Categories"
        E401["401 - Authentication<br/>Missing/invalid session"]
        E403["403 - Authorization<br/>Insufficient role"]
        E400["400 - Validation<br/>Invalid request data (Zod)"]
        E404["404 - Not Found<br/>Resource doesn't exist"]
        E500["500 - Server Error<br/>External service failure"]
    end

    subgraph "Consistent Response Shape"
        ErrJSON["{ error: string }"]
    end

    E401 --> ErrJSON
    E403 --> ErrJSON
    E400 --> ErrJSON
    E404 --> ErrJSON
    E500 --> ErrJSON
```
