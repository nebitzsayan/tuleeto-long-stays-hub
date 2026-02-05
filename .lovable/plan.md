
## Goals (in priority order)
1) Rebuild the image preview/lightbox from scratch so images are never cut, never “too small”, keep correct aspect ratio, and feel smooth on mobile + small screens (also works great on desktop).
2) Fix Admin Panel not opening (same “React.Children.only expected to receive a single React element child” error) so admin users can access `/admin` reliably.
3) Add hosting-ready optimizations and config guidance for Vercel, Netlify, AWS (S3/CloudFront), and self-hosting (Nginx).

---

## What I found (current state)
### Image preview
- Current viewer (`src/components/property/MobileImageViewer.tsx`) uses:
  - `img` CSS: `max-w-full max-h-full w-auto h-auto object-contain`
  - This can cause “small image” behavior on large/some mobile screens because `w-auto/h-auto` often renders at intrinsic size (especially if the source is a small transformed image), and `max-*` only prevents overflow (it does not scale up).
- The lightbox logic is split between:
  - `PropertyImageCarousel` (mobile opens viewer, desktop opens grid popup)
  - `ImageGalleryPopup` (grid)
  - `MobileImageViewer` (full-screen)
- ImageKit helper exists, but preview optimization is width-only (`getPreviewUrl(url, viewportWidth)`), which can still download larger-than-needed images on some screens (portrait/tall vs wide), and doesn’t consider viewport height.

### Admin panel
- Admin routes are rendered inside `/admin/*` with a nested `<Routes>` inside the route element in `src/App.tsx`.
- The runtime error `React.Children.only expected to receive a single React element child` is typical of Radix “asChild/Slot” issues, and can also happen with certain patterns where a library expects exactly one child element.
- In admin sidebar we currently use `SidebarMenuButton asChild` + `NavLink` with a `className` function. That combination is fragile with Slot/asChild patterns and is a strong suspect for the error (even if JSX “looks” like one child).

### Hosting
- Netlify is already configured (netlify.toml + redirects/headers).
- Vercel/AWS/self-hosting need SPA rewrites and a clear documented setup (plus optional Vercel config file).

---

## Plan Part A — Delete current image preview and rebuild from scratch (URGENT)

### A1) Remove current preview components
We will delete (or fully deprecate and stop importing) the current preview stack:
- `src/components/property/MobileImageViewer.tsx`
- `src/components/property/ImageGalleryPopup.tsx`

(We’ll also update any imports/usages so nothing references them.)

### A2) Create a single new “Lightbox” that works on all screen sizes (no device detection)
Create a new component that always opens a full-screen overlay for both mobile and desktop:

**New file**
- `src/components/property/ImageLightbox.tsx`

**Key behaviors**
- Full-screen overlay rendered via `createPortal(document.body)` with `fixed inset-0 z-[9999]`.
- Stable layout using flex:
  - Header (close + counter + optional “grid” button)
  - Main image area: `flex-1 min-h-0`
  - Footer: filmstrip thumbnails (optional; hide on very small screens)
- Image rendering that scales correctly:
  - `className="w-full h-full object-contain"`
  - This ensures the image expands to fill the available area while preserving aspect ratio (no cutout, no “small intrinsic image” problem).
- Navigation:
  - Tap/click left/right controls
  - Keyboard arrows + Esc
  - Mobile swipe left/right with a threshold
- Performance:
  - Preload next/previous image when index changes
  - Use ImageKit “thumb” for filmstrip, and a viewport-optimized transform for the main image

### A3) Add a new “Gallery Grid” that is mobile-first but desktop-friendly
**New file**
- `src/components/property/ImageGalleryGrid.tsx`

**Behaviors**
- Full-screen overlay with a responsive grid:
  - `grid-cols-2` on small
  - `grid-cols-3/4` on larger breakpoints
- Uses ImageKit thumbnails (fast)
- Clicking any tile opens `ImageLightbox` at that index
- Clean close behavior, body scroll lock, safe-area padding

### A4) Upgrade ImageKit optimization for full-screen (width + height aware)
Update:
- `src/lib/imagekitUrl.ts`

Add a new helper (example naming):
- `getFullscreenUrl(url: string, viewportWidth: number, viewportHeight: number): string`

Implementation approach:
- Compute target box based on DPR-ish multiplier:
  - `targetW = clamp(viewportWidth * 2, 800, 2400)`
  - `targetH = clamp(viewportHeight * 2, 800, 2400)`
- Use ImageKit “fit within box” transform:
  - `w-${targetW},h-${targetH},c-at_max,q-85,fo-auto`
This avoids downloading unnecessarily large images and keeps quality strong on both portrait and landscape screens.

Also add a tiny utility hook (optional but recommended):
- `src/hooks/useViewportSize.ts` to update width/height on resize/orientation change.

### A5) Replace all usages in property pages/components
Update these to use the new system:
- `src/components/property/PropertyImageCarousel.tsx`
  - On image click: open `ImageLightbox` (always), and provide a “Grid” button inside lightbox to open the grid overlay.
  - Remove `useMobileDetection()` branching (no more “mobile vs desktop behavior mismatch”).
- `src/components/property/PropertyImageCollage.tsx`
  - Same: click opens `ImageLightbox` always; optional grid access.

### A6) Acceptance checks for image preview
- On a small phone screen:
  - opening preview shows the full image (no cut edges)
  - image uses most of the screen (not tiny)
  - swipe left/right works smoothly
  - close always works
- On desktop:
  - arrows + keyboard navigation works
  - grid overlay is responsive and fast
- Images should look sharper than before (fullscreen transform), without extreme bandwidth usage.

---

## Plan Part B — Fix admin panel “Children.only” crash + make access reliable (URGENT)

### B1) Refactor admin routing to React Router’s standard nested route pattern
Update `src/App.tsx`:
- Replace the “/admin/* element contains its own <Routes>” approach with:
  - A dedicated `AdminLayout` route element that renders sidebar/header and an `<Outlet />`
  - Nested `<Route>` definitions under `/admin`

**New file**
- `src/pages/admin/AdminLayout.tsx`
  - Wrap with `SidebarProvider`
  - Render `<AdminSidebar />`, `<AdminMobileHeader />`, and `<Outlet />` for pages

This reduces router complexity and removes a common source of subtle runtime issues.

### B2) Remove fragile `asChild + NavLink(className fn)` pattern in AdminSidebar
Update `src/components/admin/AdminSidebar.tsx`:
- Stop using `SidebarMenuButton asChild` with `NavLink`.
- Safer replacement (recommended):
  - Use `useLocation()` to compute `isActive` for each menu item
  - Render:
    - `<SidebarMenuButton isActive={isActive} onClick={() => navigate(item.url)}>`
    - Put icon/title/badge as normal children inside the button
This removes Radix Slot/asChild from the most critical admin navigation path and should eliminate the `Children.only` error.

### B3) Add better diagnostics if anything still fails
Update `src/components/admin/AdminErrorBoundary.tsx`:
- Display a “Copy error details” button (copies error message + maybe a short hint).
- Keep current fallback UI.

Update `src/components/auth/AdminRoute.tsx`:
- Keep timeout/retry, but add one more fallback check option:
  - If `rpc('is_current_user_admin')` fails and `user_roles` read fails (RLS/network), show a retry UI instead of redirecting immediately.
- Ensure the user never gets stuck on “Verifying…” with a blank screen.

### B4) Acceptance checks for admin
- Log in as the admin user and open `/admin`:
  - No crash
  - Sidebar renders
  - Dashboard loads
- Log in as a non-admin:
  - Redirects away from `/admin` (or shows “access denied” then redirects)

---

## Plan Part C — Hosting optimization for Vercel, Netlify, AWS, self-hosting

### C1) Vercel
Add:
- `vercel.json`
  - SPA rewrites to `/index.html` for all non-asset routes
  - Optional headers (cache for assets, no-cache for HTML)

### C2) Netlify
- Keep current `netlify.toml` and redirects/headers (already good).
- Ensure there’s no duplication conflict between `netlify.toml` and `public/_redirects` (we’ll keep one as source of truth).

### C3) AWS (S3 + CloudFront)
No code changes required, but add documentation in `README.md`:
- S3 static hosting:
  - Index document: `index.html`
  - Error document: `index.html` (SPA routing)
- CloudFront:
  - Custom error response 403/404 -> `/index.html` with 200

### C4) Self-hosting (Nginx)
Add `README.md` snippet:
- `try_files $uri /index.html;` for SPA routing
- Cache headers suggestions for `/assets/*`

---

## Files to be created/modified/deleted

### Create
- `src/components/property/ImageLightbox.tsx`
- `src/components/property/ImageGalleryGrid.tsx`
- `src/pages/admin/AdminLayout.tsx`
- `src/hooks/useViewportSize.ts` (optional but recommended)
- `vercel.json`
- (Update) `README.md` hosting sections

### Modify
- `src/components/property/PropertyImageCarousel.tsx`
- `src/components/property/PropertyImageCollage.tsx`
- `src/lib/imagekitUrl.ts`
- `src/App.tsx`
- `src/components/admin/AdminSidebar.tsx`
- `src/components/auth/AdminRoute.tsx` (minor robustness)
- `src/components/admin/AdminErrorBoundary.tsx` (diagnostics)

### Delete
- `src/components/property/MobileImageViewer.tsx`
- `src/components/property/ImageGalleryPopup.tsx`

---

## Rollout / Testing sequence (recommended)
1) Implement new ImageLightbox + grid and wire them into PropertyImageCarousel first (since PropertyDetailPage uses it).
2) Verify on mobile viewport + desktop viewport.
3) Remove old preview components only after everything is wired and confirmed.
4) Refactor admin routing + sidebar (fix crash).
5) Add hosting config/docs (Vercel + README updates).
