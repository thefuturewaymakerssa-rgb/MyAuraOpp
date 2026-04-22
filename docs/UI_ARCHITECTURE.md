# Future WayMakers Platform UI Architecture & Routing
*Rewritten in structure, tone, and technical depth.*

🚀 1. Application Startup & Initialization
When a user opens the Future WayMakers app (or loads the web app), the system initialises with a clear awareness of user role and intended experience.

**Authentication & Role Resolution:** After login via the `GoogleSignInButton`, the backend resolves whether the user is a Hustler (Talent) or a Boss (Employer). This role is injected into the global state and dictates every subsequent UI decision.

**Routing Shell:** All authenticated routes are wrapped in a central `<NavWrapper>` component (similar to Instagram’s tab + stack navigator). This shell listens to the Next.js `pathname` and decides which navigation components to render and what visual mode to activate.

**Client Architecture:** Built with React (Next.js App Router) and Tailwind CSS, using CSS `env(safe-area-inset-*)` for native-feeling mobile layouts. The UI feels like a native app, even on the web.

📱 2. The Core UI System: From Foundation to Fine Details
The UI system is built around two distinct visual worlds – Immersive Mode (for video/content) and Standard Mode (for dashboards and tools).

🎨 Design System (Tailwind + Custom Tokens)
Global design tokens are defined in `globals.css`:
```css
--font-display: "Outfit", sans-serif;   // bold, editorial headings
--font-body: "Inter", sans-serif;       // clean, readable text
--color-brand-teal: #0F766E;            // Hustler primary
--color-shapa-green: #13EC6A;           // accent for CTAs
```
**Typography:** Heavy, dramatic styling (`font-black tracking-tighter uppercase italic`) gives the platform a streetwear / modern editorial feel.

**Borders & Glassmorphism:** Instead of solid borders, the platform uses `backdrop-blur-3xl border border-white/20` and complex shadows (`shadow-[0_20px_50px_rgba(0,0,0,0.1)]`) to create “glass” panels that lift off the background.

🧱 Layout Strategy: Immersive vs. Standard
The `NavWrapper` watches the pathname and toggles the entire environment:

| Mode | Trigger routes | Background | TopBar style | Use case |
| :--- | :--- | :--- | :--- | :--- |
| Immersive | `/feed, /studio, /record, /apply` | `#0F172A` (dark slate) | Translucent `bg-black/20` overlay | Full-screen video, VibeCV recording, TikTok-style feed |
| Standard | All other routes (dashboards, wallet, settings) | `#F0FDFA` (airy teal-white) | Solid with teal/purple accents | Gig management, contracts, profile editing |

This dual-mode system lets the platform feel like a professional tool and a media-first social network, depending on where the user is.

🧩 Component Architecture (Reusable, Role-Aware)
The UI is a hierarchy of React components:

* `<NavWrapper />` – Top-level shell that conditionally renders `<TopBar>`, `<SideDrawer>`, and `<MobileNav>`.
* `<TopBar />` – A dynamic header that completely changes its centre text and right actions based on the route.
* `<MobileNav />` – A floating bottom dock that renders different tabs for Hustlers vs. Bosses.

Each component uses Tailwind’s `group-hover`, `active:scale-95`, and `transition-all duration-500` to provide snappy, iOS‑style haptic feedback.

🧭 3. The Routing & Navigation Engine
Future WayMakers uses a role‑aware, context‑sensitive routing system built on Next.js App Router and client‑side navigation.

🗂️ Primary Navigation: Role‑Based Bottom Dock (`MobileNav.tsx`)
The floating bottom bar is the user’s primary way to move between major sections. It sits at `fixed bottom-0` with `env(safe-area-inset-bottom)` to avoid overlapping native gesture bars.

Tabs are completely different per role:

| Hustler (Talent) | Boss (Employer) |
| :--- | :--- |
| Feed (video feed) | Hub (operations dashboard) |
| Gigs (list/map view) | Post Gig (central CTA) |
| ➕ Create (floating modal) | Contracts |
| Messages | Messages |
| Profile | Profile |

**Active visual feedback:** Hustler active items pulse in Brand Teal (`#0F766E`); Boss active items shift to Royal Purple (`#8B5CF6`). This subconscious colour coding reminds the user which “hat” they are wearing.

🔘 The Central “Create” Interaction (Hustler only)
Tapping the centre `+` button does not immediately navigate. Instead, it renders a full‑screen modal:

```jsx
<div className="fixed inset-0 z-[10002] bg-white/80 backdrop-blur-3xl">
  {/* heavy typography, prompt to record VibeCV */}
</div>
```
Only after the user confirms do they get redirected to `/talent/studio/record`. This modal pattern reduces accidental navigation and keeps the immersive creation flow intentional.

🔀 Context‑Aware TopBar (`TopBar.tsx`)
The top bar uses a switch statement on pathname to remould itself:

| Route | Centre content | Right actions |
| :--- | :--- | :--- |
| `/feed` | “For You \| Following” toggle | Bell notification icon |
| `/gigs` | “Gigs Near You” | Toggle between Map View and List View (using URL query params `?view=map`) |
| Employer routes | “Operations Hub” (purple accent) | `+` button to launch `/gigs/new` |

In Immersive Mode, the TopBar transforms into a completely borderless translucent overlay (`bg-black/20 text-white`) that sits on top of video content without distracting.

🔗 Deep Linking & Push Notifications (Planned / Extensible)
While not explicitly in the provided code, the architecture supports:
* Deep links like `fwm://gigs?id=123` to open a specific gig directly.
* Push notifications that can route the user to a contract, message, or new follower, bypassing the normal navigation stack.

💾 4. Data Flow & Real‑Time Updates
The platform uses a hybrid data strategy. Based on typical Next.js + React patterns:
* **Server‑Side Data:** Dashboard data (gigs, contracts, wallet) is fetched via server components or fetch in client components, then cached.
* **Optimistic UI:** When a Hustler applies to a gig or a Boss posts a new gig, the UI updates instantly, then syncs with the backend.
* **Real‑Time:** The architecture is ready for WebSockets to handle live messaging and gig application status changes.

🔄 5. Complete End‑to‑End User Journey Example
Let’s trace a Hustler opening the app, watching the feed, and creating a VibeCV.

**Launch & Role Resolution**
User logs in via Google. Backend returns role = `"talent"`. Next.js redirects to `/feed` (authenticated layout).

**Shell Initialisation**
* `<NavWrapper>` detects `/feed` → switches to Immersive Mode (`bg-[#0F172A]`).
* `<TopBar>` renders the “For You | Following” toggle with a translucent dark overlay.
* `<MobileNav>` renders the Hustler dock (Feed, Gigs, ＋, Messages, Profile).

**Browsing the Feed**
User scrolls vertically through video posts (similar to TikTok). Each post is a reusable component. Tapping a like button instantly increments the count (optimistic UI).

**Creating a VibeCV**
1. User taps the centre ＋ button.
2. A full‑screen glassmorphic modal opens, prompting: “Record your VibeCV”.
3. User confirms → router pushes to `/talent/studio/record`.
4. The recording interface inherits Immersive Mode (dark, no distractions).

**Post‑Creation Flow**
After recording, the user is taken to a preview/edit screen, then back to their profile. The new VibeCV appears immediately (optimistic update).

**Switching to Employer View (if user has both roles)**
If the same user also acts as a Boss, they can switch roles from settings. The `<MobileNav>` re‑renders with Boss tabs (Hub, Post Gig, Contracts, Messages, Profile), and the active colour changes to purple.

💡 Key Takeaways
* **Role‑First Design:** Every major UI element – the bottom dock, top bar actions, and even colour scheme – changes based on whether the user is a Hustler or Boss. This reduces cognitive load and prevents accidental employer actions from a talent account.
* **Dual Visual Modes:** Immersive vs. Standard mode is not just a theme; it’s a behavioural shift. Immersive routes remove all chrome (borders, padding, bright backgrounds) to prioritise video content, exactly like TikTok or Instagram Reels.
* **Modal Over Direct Navigation:** The central “Create” button uses a modal as an intermediary step. This intentional friction ensures users only enter the recording studio when they’re ready, reducing abandoned sessions.
* **Micro‑interactions:** Heavy use of `scale-110`, `active:scale-95`, and `transition-all duration-500` gives the platform a premium, snappy feel – every tap provides haptic-like feedback.
* **Safe‑Area Awareness:** Using `env(safe-area-inset-bottom)` on the floating nav means the app respects iPhone notches and home indicators, making the web app feel native.
