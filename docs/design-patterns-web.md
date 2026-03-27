# Web App (Next.js) - Design Pattern Diagrams

## Overall Architecture

```mermaid
graph TB
    subgraph "Next.js App Router"
        Layout["RootLayout<br/>(Server Component)"]
        Providers["Providers<br/>(Client Component)<br/>QueryClientProvider"]

        subgraph "Pages"
            Home["/ (Home)"]
            Profile["/profile"]
            Verify["/verify"]
            subgraph "Auth Route Group"
                Login["/auth/login"]
                Register["/auth/register"]
                VerifyEmail["/auth/verify-email"]
            end
        end

        Layout --> Providers --> Pages
    end

    subgraph "Libraries (lib/)"
        API["api.ts<br/>fetchApi()"]
        AuthClient["auth-client.ts<br/>Better Auth Client"]
        Store["stores/<br/>Zustand Store"]
    end

    subgraph "External"
        APIServer["Hono API Server"]
        BetterAuth["Better Auth Server"]
    end

    Pages --> API --> APIServer
    Pages --> AuthClient --> BetterAuth
    Pages --> Store
```

## Component Organization

```mermaid
graph TB
    subgraph "Component Layers"
        subgraph "Layer 1: UI Primitives (@starter/ui)"
            Button["Button"]
            Card["Card / CardHeader / CardTitle"]
            Input["Input"]
            Label["Label"]
            Badge["Badge"]
            Table["Table"]
        end

        subgraph "Layer 2: Shared Components (components/)"
            AvatarUpload["AvatarUpload"]
        end

        subgraph "Layer 3: Page-Specific (_components/)"
            StatusCard["StatusCard"]
            DemoForm["DemoForm"]
        end

        subgraph "Layer 4: Page Components (app/)"
            PageComp["page.tsx"]
        end
    end

    PageComp --> StatusCard
    PageComp --> DemoForm
    PageComp --> AvatarUpload
    StatusCard --> Card
    StatusCard --> Badge
    DemoForm --> Input
    DemoForm --> Label
    DemoForm --> Button
    AvatarUpload --> Button
```

## Data Fetching Pattern (TanStack Query)

```mermaid
sequenceDiagram
    participant Page as Page Component
    participant TQ as TanStack Query
    participant API as fetchApi()
    participant Server as API Server

    Page->>TQ: useQuery({ queryKey, queryFn })
    TQ->>TQ: Check cache (staleTime: 60s)

    alt Cache Hit (fresh)
        TQ-->>Page: Return cached data
    else Cache Miss / Stale
        TQ->>API: fetchApi&lt;T&gt;("/path")
        API->>Server: HTTP GET
        Server-->>API: JSON Response
        API-->>TQ: Typed data
        TQ->>TQ: Update cache
        TQ-->>Page: { data, isLoading, error }
    end

    Note over Page,TQ: Manual refetch pattern
    Page->>TQ: useQuery({ enabled: false })
    Page->>TQ: refetch() (on user action)
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant RegisterPage as Register Page
    participant LoginPage as Login Page
    participant AuthClient as Better Auth Client
    participant API as API Server
    participant Email as Resend Email

    Note over User,Email: Registration Flow
    User->>RegisterPage: Fill form (name, email, password)
    RegisterPage->>RegisterPage: Zod validation (zodResolver)
    RegisterPage->>AuthClient: signUp.email(data)
    AuthClient->>API: POST /api/auth/sign-up
    API->>Email: Send verification email
    API-->>AuthClient: Success
    RegisterPage->>User: Redirect to /auth/verify-email

    Note over User,Email: Login Flow
    User->>LoginPage: Fill form (email, password)
    LoginPage->>AuthClient: signIn.email(data)
    AuthClient->>API: POST /api/auth/sign-in
    API-->>AuthClient: Session + Cookie
    LoginPage->>User: Redirect to /profile

    Note over User,Email: Protected Route
    User->>AuthClient: useSession()
    AuthClient-->>User: session | null
    alt No Session
        User->>LoginPage: Redirect to /auth/login
    end
```

## Form Handling Pattern (React Hook Form + Zod)

```mermaid
graph TB
    subgraph "@starter/shared"
        Schema["Zod Schema<br/>(registerSchema, loginSchema)"]
        Type["TypeScript Type<br/>(z.infer&lt;typeof schema&gt;)"]
        Schema --> Type
    end

    subgraph "Form Component"
        UseForm["useForm&lt;T&gt;({<br/>  resolver: zodResolver(schema)<br/>})"]
        Register["register('fieldName')"]
        HandleSubmit["handleSubmit(onSubmit)"]
        Errors["formState.errors"]
        IsSubmitting["formState.isSubmitting"]
    end

    subgraph "UI"
        FormEl["&lt;form onSubmit={handleSubmit(onSubmit)}&gt;"]
        InputEl["&lt;Input {...register('email')} /&gt;"]
        ErrorEl["&lt;p role='alert'&gt;{errors.email.message}&lt;/p&gt;"]
        BtnEl["&lt;Button disabled={isSubmitting}&gt;"]
    end

    Schema --> UseForm
    Type --> UseForm
    UseForm --> Register --> InputEl
    UseForm --> HandleSubmit --> FormEl
    UseForm --> Errors --> ErrorEl
    UseForm --> IsSubmitting --> BtnEl
```

## State Management Pattern (Zustand)

```mermaid
graph LR
    subgraph "Zustand Store"
        State["State<br/>lastRunAt: string | null<br/>runCount: number"]
        Actions["Actions<br/>incrementRunCount()<br/>setLastRunAt(ts)"]
    end

    subgraph "Components"
        CompA["VerifyPage"]
        CompB["StatusCard"]
    end

    CompA -->|"useVerificationStore()"| State
    CompA -->|"incrementRunCount()"| Actions
    CompB -->|"useVerificationStore()"| State
    Actions -->|"set(state => ...)"| State
```

## File Upload Flow

```mermaid
sequenceDiagram
    participant User
    participant Component as AvatarUpload
    participant API as API Server
    participant R2 as Cloudflare R2
    participant Auth as Better Auth

    User->>Component: Select image file
    Component->>Component: Validate type & size
    Component->>API: POST /api/upload/presigned-url<br/>{contentType, fileSize}
    API->>R2: Generate presigned URL
    API-->>Component: {presignedUrl, publicUrl}
    Component->>R2: PUT file (presigned URL)
    R2-->>Component: 200 OK
    Component->>Auth: updateUser({image: publicUrl})
    Auth-->>Component: Success
    Component->>User: Show new avatar
```

## Server vs Client Component Pattern

```mermaid
graph TB
    subgraph "Server Components"
        RootLayout["RootLayout<br/>(metadata, fonts, HTML shell)"]
        AuthLayout["Auth Layout<br/>(centered card wrapper)"]
    end

    subgraph "Client Components ('use client')"
        Providers["Providers<br/>(QueryClientProvider)"]
        HomePage["Home Page<br/>(useQuery)"]
        ProfilePage["Profile Page<br/>(useSession, useEffect)"]
        LoginPage["Login Page<br/>(useForm, authClient)"]
        RegisterPage["Register Page<br/>(useForm, authClient)"]
        VerifyPage["Verify Page<br/>(useQuery, useVerificationStore)"]
    end

    subgraph "Suspense Boundary"
        VerifyEmailPage["VerifyEmail Page<br/>(Suspense wrapper)"]
        VerifyEmailContent["VerifyEmailContent<br/>(useSearchParams)"]
    end

    RootLayout --> Providers
    Providers --> HomePage
    Providers --> ProfilePage
    Providers --> VerifyPage
    RootLayout --> AuthLayout
    AuthLayout --> LoginPage
    AuthLayout --> RegisterPage
    AuthLayout --> VerifyEmailPage --> VerifyEmailContent
```

## Testing Pattern

```mermaid
graph TB
    subgraph "Test Infrastructure"
        Vitest["Vitest (jsdom)"]
        RTL["React Testing Library"]
        UserEvent["@testing-library/user-event"]
        JestDOM["@testing-library/jest-dom"]
    end

    subgraph "Test Patterns"
        Mock["vi.mock()<br/>- next/navigation<br/>- auth-client<br/>- api"]
        RenderHelper["renderWithProviders()<br/>(QueryClientProvider wrapper)"]
        Assertions["screen.getByLabelText()<br/>screen.getByRole()<br/>waitFor()"]
    end

    Vitest --> Mock
    RTL --> RenderHelper
    UserEvent --> Assertions
    JestDOM --> Assertions
```
