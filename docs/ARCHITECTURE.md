# Future WayMakers Platform – UI & Routing Architecture

> **Living Specification** — Update this document whenever UI or routing behaviour changes.  
> Last updated: 2026-04-09 | Author: System

---

## 🚀 1. Application Startup & Initialization

When a user opens the Future WayMakers app (or loads the web app), the system initialises with a clear awareness of **user role** and **intended experience**.

- **Authentication & Role Resolution**: After login via the `GoogleSignInButton`, the backend resolves whether the user is a **Hustler (Talent)** or a **Boss (Employer)**. This role is injected into the global state and dictates every subsequent UI decision.
- **Routing Shell**: All authenticated routes are wrapped in a central `<NavWrapper>` component. This shell listens to the Next.js `pathname` and decides which navigation components to render and what visual mode to activate.
- **Client Architecture**: Built with **React** (Next.js App Router) and **Tailwind CSS**, using CSS `env(safe-area-inset-*)` for native-feeling mobile layouts. The UI feels like a native app, even on the web.

---

## 📱 2. The Core UI System: From Foundation to Fine Details

The UI system is built around two distinct visual worlds – **Immersive Mode** (for video/content) and **Standard Mode** (for dashboards and tools).

### 🎨 Design System (Tailwind + Custom Tokens)

Global design tokens are defined in `globals.css`:

```css
@theme {
  --font-display: "Outfit", sans-serif;   /* bold, editorial headings */
  --font-body: "Inter", sans-serif;       /* clean, readable text */
  --color-brand-teal: #0F766E;            /* Hustler primary */
  --color-shapa-green: #13EC6A;           /* accent for CTAs */
}
```

- **Typography**: Heavy, dramatic styling (`font-black tracking-tighter uppercase italic`) gives the platform a streetwear / modern editorial feel.
- **Borders & Glassmorphism**: Instead of solid borders, the platform uses `backdrop-blur-3xl border border-white/20` and complex shadows (`shadow-[0_20px_50px_rgba(0,0,0,0.1)]`) to create "glass" panels that lift off the background.

### 🧱 Layout Strategy: Immersive vs. Standard

The `NavWrapper` watches the pathname and toggles the entire environment:

| Mode | Trigger Routes | Background | TopBar Style | Use Case |
|------|----------------|------------|--------------|----------|
| **Immersive** | `/feed`, `/studio`, `/record`, `/apply` | `#0F172A` (dark slate) | Translucent `bg-black/20` overlay | Full-screen video, VibeCV recording, TikTok-style feed |
| **Standard** | All other routes (dashboards, wallet, settings) | `#F0FDFA` (airy teal-white) | Solid with teal/purple accents | Gig management, contracts, profile editing |

This dual-mode system lets the platform feel like a professional tool **and** a media-first social network, depending on where the user is.

### 🧩 Component Architecture (Reusable, Role-Aware)

The UI is a hierarchy of React components:

- **`<NavWrapper />`** – Top-level shell that conditionally renders `<TopBar>`, `<SideDrawer>`, and `<MobileNav>`.
- **`<TopBar />`** – A dynamic header that completely changes its centre text and right actions based on the route.
- **`<MobileNav />`** – A floating bottom dock that renders **different tabs for Hustlers vs. Bosses**.

Each component uses Tailwind's `group-hover`, `active:scale-95`, and `transition-all duration-500` to provide snappy, iOS‑style haptic feedback.

---

## 🧭 3. The Routing & Navigation Engine

Future WayMakers uses a **role‑aware, context‑sensitive routing system** built on Next.js App Router and client‑side navigation.

### 🗂️ Primary Navigation: Role‑Based Bottom Dock (`MobileNav.tsx`)

The floating bottom bar is the user's primary way to move between major sections. It sits at `fixed bottom-0` with `env(safe-area-inset-bottom)` to avoid overlapping native gesture bars.

**Tabs are completely different per role:**

| Hustler (Talent) | Boss (Employer) |
|------------------|-----------------|
| Feed (video feed) | Hub (operations dashboard) |
| Gigs (list/map view) | Post Gig (central CTA) |
| ➕ Create (floating modal) | Contracts |
| Messages | Messages |
| Profile | Profile |

- **Active visual feedback**: Hustler active items pulse in **Brand Teal (`#0F766E`)**; Boss active items shift to **Royal Purple (`#8B5CF6`)**. This subconscious colour coding reminds the user which "hat" they are wearing.

### 🔘 The Central "Create" Interaction (Hustler only)

Tapping the centre `+` button **does not** immediately navigate. Instead, it renders a full‑screen modal:

```jsx
<div className="fixed inset-0 z-[10002] bg-white/80 backdrop-blur-3xl">
  {/* heavy typography, prompt to record VibeCV */}
</div>
```

Only after the user confirms do they get redirected to `/talent/studio/record`. This modal pattern reduces accidental navigation and keeps the immersive creation flow intentional.

### 🔀 Context‑Aware TopBar (`TopBar.tsx`)

The top bar uses a `switch` statement on `pathname` to remould itself:

| Route | Centre Content | Right Actions |
|-------|----------------|---------------|
| `/feed` | "For You \| Following" toggle | Bell notification icon |
| `/gigs` | "Gigs Near You" | Toggle between **Map View** and **List View** (`?view=map`) |
| Employer routes | "Operations Hub" (purple accent) | `+` button → `/gigs/new` |

In **Immersive Mode**, the TopBar transforms into a completely borderless translucent overlay (`bg-black/20 text-white`) that sits on top of video content without distracting.

### 🔗 Deep Linking & Push Notifications (Planned)

- **Deep links** like `fwm://gigs?id=123` to open a specific gig directly.
- **Push notifications** that route the user to a contract, message, or new follower, bypassing the normal navigation stack.

---

## 💾 4. Data Flow & Real‑Time Updates

The platform uses a hybrid data strategy, though the provided code focuses on UI and routing.

| Layer | Approach | Library |
|-------|----------|---------|
| **Global client state** | Role, auth status, unread count, UI preferences | Zustand / Context |
| **Server state** | Gigs, applications, contracts, messages | TanStack Query (React Query) |
| **Form state** | Validation and submission | React Hook Form + Zod |
| **Persisted state** | Draft VibeCVs, view preferences | `localStorage` |

- **Server‑Side Data**: Dashboard data (gigs, contracts, wallet) is fetched via server components or `fetch` in client components, then cached.
- **Optimistic UI**: When a Hustler applies to a gig or a Boss posts a new gig, the UI updates instantly, then syncs with the backend.
- **Real‑Time (planned)**: WebSockets (Socket.io / Pusher) for live messaging, instant notifications, and presence indicators.

> *Note: The files `MobileNav.tsx`, `NavWrapper.tsx`, and `TopBar.tsx` focus on navigation and presentation – data fetching happens in page components.*

---

## 🔄 5. Complete End‑to‑End User Journey Example

### Hustler: Watch Feed → Create VibeCV

1. **Launch & Role Resolution**  
   User logs in via Google. Backend returns `role = "talent"`. Next.js redirects to `/feed`.

2. **Shell Initialisation**  
   `<NavWrapper>` detects `/feed` → switches to **Immersive Mode** (`bg-[#0F172A]`).  
   `<TopBar>` renders the "For You | Following" toggle with a translucent dark overlay.  
   `<MobileNav>` renders the **Hustler dock** (Feed, Gigs, ＋, Messages, Profile).

3. **Browsing the Feed**  
   User scrolls vertically through video posts (TikTok-style). Tapping a like button instantly increments the count (optimistic UI).

4. **Creating a VibeCV**  
   User taps the centre `＋` button.  
   → A full‑screen glassmorphic modal opens: *"Record your VibeCV"*.  
   → User confirms → router pushes to `/talent/studio/record`.  
   → The recording interface inherits Immersive Mode (dark, no distractions).

5. **Post‑Creation Flow**  
   After recording, the user reaches a preview/edit screen, then back to their profile. The new VibeCV appears immediately (optimistic update).

6. **Switching to Employer View**  
   If the same user also acts as a Boss, they switch roles from settings. `<MobileNav>` re‑renders with Boss tabs and the active colour shifts to purple.

### Boss: Post a Gig

1. Switch to Boss role (settings role switcher).
2. `<MobileNav>` shows Boss tabs: Hub, Post Gig, Contracts, Messages, Profile.
3. Tap **Post Gig** → form modal opens (standard mode, teal accents).
4. Fill details, upload images, set location via map picker.
5. Submit → gig enters moderation queue, then goes live.

---

## 🏗️ 6. Missing Layers (To Be Built)

The current documentation covers frontend UI and routing only. A complete production system requires:

| Layer | Details |
|-------|---------|
| **Backend API** | REST/GraphQL endpoints, PostgreSQL database, Prisma ORM |
| **File storage** | S3/Cloudinary for VibeCV videos, CDN delivery, transcoding |
| **Background jobs** | Video processing, email notifications, contract reminders |
| **Testing** | Unit (Jest), integration, E2E (Playwright) |
| **Analytics & monitoring** | PostHog/Mixpanel, Sentry, Core Web Vitals |
| **Deployment** | Vercel/AWS, CI/CD (GitHub Actions), environment config |
| **Legal & compliance** | KYC, e‑signatures, GDPR, content moderation |
| **Core business logic** | Gig lifecycle, contract generation, wallet/payments (Stripe Connect) |
| **Offline & PWA** | Service workers, offline queue, push notifications |

---

## 📐 7. Developer Guidelines

- **Role‑first thinking** – Every UI component should ask: *"What does a Hustler see? What does a Boss see?"*
- **Immersive routes** – Must be dark, borderless, and full‑viewport. No standard UI chrome.
- **Micro‑interactions** – Use scale transforms and transitions (`scale-110`, `active:scale-95`, `duration-500`); no abrupt changes.
- **Tailwind conventions** – Follow the design tokens in `globals.css`; avoid inline styles.
- **Accessibility** – Colour contrast meets WCAG AA (especially glassmorphic overlays), keyboard navigation, screen reader `aria-` labels.
- **Performance** – Use Next.js dynamic imports for heavy modals, virtualised lists for feed/gigs.
- **Safe‑area awareness** – Always use `env(safe-area-inset-bottom)` on fixed bottom elements for iPhone/Android home bar compatibility.

---

## 💡 8. Key Takeaways

| Principle | Implementation |
|-----------|---------------|
| **Role‑First Design** | Bottom dock, top bar actions, and colour scheme all change per role — reduces cognitive load and prevents cross-role accidents |
| **Dual Visual Modes** | Immersive vs Standard is a **behavioural shift**, not just a theme — removes all chrome on video routes |
| **Modal Over Direct Navigation** | The central ➕ "Create" button uses a modal intermediary — intentional friction reduces abandoned recording sessions |
| **Micro‑interactions** | `scale-110 / active:scale-95 / transition-all duration-500` gives every tap a premium, haptic-like feel |
| **Safe‑Area Awareness** | `env(safe-area-inset-bottom)` on the floating nav respects iPhone notches and Android gesture bars |

---

## 9. Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2026-04-09 | System | Initial architecture document from UI/routing breakdown |
| 2026-04-09 | System | Enhanced with narrative prose, code examples, E2E journey, key takeaways |
