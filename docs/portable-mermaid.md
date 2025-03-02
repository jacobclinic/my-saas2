# Comma Education - Portable Diagrams

Copy and paste each diagram separately into mermaid.live or any other mermaid renderer.

## Component Flow Diagram
```
graph TD
    Layout["App Layout"] --> SiteLayout["Site Layout"]
    Layout --> AppLayout["App Layout"]
    Layout --> AuthLayout["Auth Layout"]
    
    SiteLayout --> SitePages["Public Site Pages"]
    SitePages --> HomePage["Home Page"]
    SitePages --> PricingPage["Pricing Page"]
    SitePages --> SelfRegistration["Self Registration"]
    SitePages --> AboutPage["About Page"]
    SitePages --> BlogPage["Blog Page"]
    SitePages --> DocsPage["Docs Page"]
    SitePages --> FAQPage["FAQ Page"]
    
    AuthLayout --> AuthComponents["Auth Components"]
    AuthComponents --> SignIn["Sign In"]
    AuthComponents --> SignUp["Sign Up"]
    AuthComponents --> PasswordReset["Password Reset"]
    AuthComponents --> Callback["Auth Callback"]
    AuthComponents --> Verify["MFA Verification"]
    
    AppLayout --> AppComponents["App Components"]
    AppComponents --> AppContainer["App Container"]
    AppContainer --> AppHeader["App Header"]
    AppContainer --> AppSidebar["App Sidebar"]
    AppContainer --> AppRouteShell["App Route Shell"]
    
    AppSidebar --> AppSidebarNavigation["Sidebar Nav"]
    
    AppRouteShell --> Dashboard["Dashboard"]
    AppRouteShell --> Classes["Classes"]
    AppRouteShell --> Tutors["Tutors"]
    AppRouteShell --> UpcomingSessions["Upcoming Classes"]
    AppRouteShell --> PastSessions["Past Classes"]
    AppRouteShell --> Payments["Payments"]
    AppRouteShell --> Settings["Settings"]
    
    Dashboard --> RoleCheck{"User Role?"}
    RoleCheck -->|Admin| AdminDashboard["Admin Dashboard"]
    RoleCheck -->|Tutor| TutorDashboard["Tutor Dashboard"]
    RoleCheck -->|Student| StudentDashboard["Student Dashboard"]
    
    TutorDashboard --> TutorClassesView["Classes View"]
    TutorDashboard --> TutorSessionsView["Sessions View"]
    TutorDashboard --> TutorPaymentsView["Payments View"]
    
    StudentDashboard --> StudentClassesView["Classes View"]
    StudentDashboard --> StudentSessionsView["Sessions View"]
    StudentDashboard --> StudentPaymentsView["Payments View"]
    
    Classes --> ClassList["Class List"]
    Classes --> ClassDetails["Class Details"]
    Classes --> ClassCreation["Class Creation"]
    
    UpcomingSessions --> SessionList["Session List"]
    UpcomingSessions --> SessionDetails["Session Details"]
    
    SessionDetails --> ZoomSession["Zoom Session"]
    
    SignIn --> AuthChangeListener["Auth Change Listener"]
    SignUp --> AuthChangeListener
    AuthChangeListener --> RoleCheck
    
    Payments --> PaymentsList["Payments List"]
    Payments --> PaymentDetails["Payment Details"]
    Payments --> StripeIntegration["Stripe Integration"]
```

## Component Hierarchy (Simplified)
```
classDiagram
    RootLayout <|-- SiteLayout
    RootLayout <|-- AppLayout
    RootLayout <|-- AuthLayout
    
    AppLayout *-- AppContainer
    AppContainer *-- AppHeader
    AppContainer *-- AppSidebar
    AppContainer *-- AppRouteShell
    
    AppSidebar *-- AppSidebarNavigation
    
    class RootLayout{
        +children
        +GlobalLoadingIndicator
        +Toaster
    }
    class AppContainer{
        +children
    }
    class AppLayout{
        +AuthGuard
    }
```

## User Flow Diagram
```
sequenceDiagram
    actor User
    participant LandingPage as Landing Page
    participant Auth as Authentication
    participant Dashboard as Dashboard
    participant Classes as Classes
    participant Sessions as Sessions
    participant Zoom as Zoom
    participant Payments as Payments
    
    User->>LandingPage: Visit site
    
    alt Not registered
        User->>LandingPage: Click Sign Up
        LandingPage->>Auth: Redirect to Sign Up
        User->>Auth: Fill registration form
        Auth->>User: Email verification
        User->>Auth: Verify email
        Auth->>Dashboard: Redirect to dashboard
    else Registered
        User->>LandingPage: Click Sign In
        LandingPage->>Auth: Redirect to Sign In
        User->>Auth: Enter credentials
        Auth->>Dashboard: Redirect to dashboard
    end
    
    alt Admin/Tutor
        User->>Dashboard: View tutor dashboard
        User->>Classes: Manage classes
        User->>Sessions: View upcoming sessions
        User->>Zoom: Start/join session
        User->>Sessions: Mark session complete
        User->>Payments: View/manage payments
    else Student
        User->>Dashboard: View student dashboard
        User->>Classes: View enrolled classes
        User->>Sessions: View upcoming sessions
        User->>Zoom: Join session
        User->>Payments: View payment history
    end
``` 