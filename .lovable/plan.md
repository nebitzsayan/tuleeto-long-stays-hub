

# Plan: Enhanced Admin Panel + Image Preview Zoom Feature

## Overview
This plan addresses two main requests:
1. Make the admin panel more responsive and feature-rich with working functionality
2. Add zoom in/zoom out buttons to the image preview lightbox

---

## Part A: Image Preview Zoom Controls

### Current State
The `ImageLightbox.tsx` component displays images in full-screen with swipe navigation but lacks zoom functionality.

### Changes

**Update `src/components/property/ImageLightbox.tsx`**:
- Add zoom state (1x, 1.5x, 2x, 3x scale levels)
- Add ZoomIn and ZoomOut buttons to the header
- Display current zoom level indicator
- Support pinch-to-zoom on mobile using touch event handling
- Add "Reset Zoom" double-tap/double-click functionality
- When zoomed in, enable pan/drag to move around the image
- Disable swipe navigation when zoomed in (to prevent conflicts with panning)

**UI Layout (Header)**:
```
+-------------------------------------------+
| [X]  [Zoom-] 1x [Zoom+]      1 / 5  [Grid]|
+-------------------------------------------+
```

**Zoom Behavior**:
- Zoom levels: 1x (fit) -> 1.5x -> 2x -> 3x
- ZoomIn button: increases zoom one step
- ZoomOut button: decreases zoom one step  
- At 1x: image uses `object-contain` (current behavior)
- At >1x: image scales up with CSS transform, draggable to pan
- Double-tap resets to 1x
- Mobile pinch-to-zoom support

---

## Part B: Admin Panel Enhancements

### Current State Analysis
The admin panel already has:
- Dashboard with stats cards and charts
- Users/Properties/Tenants/Reviews management
- Mobile-responsive card layouts
- Audit logs
- Basic Settings page (placeholder buttons)

### Improvements

#### B1. Enhanced Dashboard (`src/pages/admin/Dashboard.tsx`)
- Add real-time refresh button with loading indicator
- Add "Last updated" timestamp display
- Add sortable/filterable recent activity feed (last 10 admin actions)
- Improve stats cards with trend indicators (up/down arrows based on period comparison)
- Add "Pending Actions" card showing items needing attention

#### B2. Improved Admin Layout (`src/pages/admin/AdminLayout.tsx`)
- Add breadcrumb navigation for better context
- Add keyboard shortcuts hint (Escape to close sidebar on mobile)
- Improve loading states with skeleton placeholders

#### B3. Enhanced Sidebar (`src/components/admin/AdminSidebar.tsx`)
- Add collapsible state memory (localStorage)
- Add search/filter for menu items on desktop
- Add "Pending" count badges for:
  - Reviews (pending approval)
  - Properties (flagged/reported)
- Improve mobile drawer animation

#### B4. Users Management Enhancements (`src/pages/admin/UsersManagement.tsx`)
- Add pagination for large user lists
- Add bulk actions (select multiple users for ban/delete)
- Add user role management (promote to admin)
- Add "Last Active" column if data available
- Add confirmation for destructive actions with summary

#### B5. Properties Management Enhancements (`src/pages/admin/PropertiesManagement.tsx`)
- Add pagination
- Add thumbnail preview in the list
- Add bulk visibility toggle
- Add "Sort by" dropdown (date, price, reports)
- Add image count indicator

#### B6. Reviews Management Enhancements (`src/pages/admin/ReviewsManagement.tsx`)
- Add bulk approve/reject actions
- Add filter by rating (1-5 stars)
- Add "Reply as Admin" feature (if supported by schema)

#### B7. Settings Page - Make Functional (`src/pages/admin/Settings.tsx`)
- Security Settings: Show current admin users, allow adding new admins
- Data Management: Add actual export all data button with progress
- Email Notifications: Toggle settings (store in localStorage for now)
- System Alerts: Show real-time system health based on recent errors

#### B8. Add New Feature: Announcements/Notifications
Create `src/pages/admin/Announcements.tsx`:
- Allow admin to create announcements
- Show announcement history
- (This would need a new DB table, so mark as optional)

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/admin/DashboardActivityFeed.tsx` | Recent admin actions component |
| `src/components/admin/StatsCardEnhanced.tsx` | Stats card with trend indicators |
| `src/components/admin/Pagination.tsx` | Reusable pagination component |
| `src/components/admin/BulkActions.tsx` | Bulk action toolbar component |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/property/ImageLightbox.tsx` | Add zoom controls, pinch-to-zoom, pan when zoomed |
| `src/pages/admin/Dashboard.tsx` | Add refresh, activity feed, trends, pending items |
| `src/pages/admin/AdminLayout.tsx` | Add breadcrumbs, improve loading |
| `src/components/admin/AdminSidebar.tsx` | Add pending badges, collapse memory |
| `src/pages/admin/UsersManagement.tsx` | Add pagination, bulk actions, role management |
| `src/pages/admin/PropertiesManagement.tsx` | Add pagination, thumbnails, sorting |
| `src/pages/admin/ReviewsManagement.tsx` | Add bulk actions, rating filter |
| `src/pages/admin/Settings.tsx` | Make buttons functional, add real features |
| `src/hooks/useAdminAnalytics.ts` | Add trend calculations, activity feed data |

---

## Technical Details

### Image Zoom Implementation
```text
State:
- zoom: number (1, 1.5, 2, 3)
- position: { x: number, y: number } (for panning)
- isDragging: boolean

Touch handling:
- Single touch: swipe navigation (only when zoom=1)
- Pinch: detect distance change, adjust zoom
- Double-tap: reset to zoom=1

Mouse handling:
- Click+drag when zoomed: pan image
- Double-click: reset zoom
- Mouse wheel: optional zoom (can conflict with scroll)

Image CSS when zoomed:
transform: scale(${zoom}) translate(${x}px, ${y}px)
transform-origin: center center
```

### Pagination Component
```text
Props:
- currentPage: number
- totalPages: number
- onPageChange: (page: number) => void
- itemsPerPage: number (default 20)

Features:
- "Previous/Next" buttons
- Page number display
- Jump to first/last
- Mobile-friendly touch targets
```

### Bulk Actions Pattern
```text
State:
- selectedIds: Set<string>
- Select All checkbox in header
- Action bar appears when selection > 0
- Actions: Delete Selected, Ban Selected, etc.
```

---

## Priority Order

1. **High Priority**: Image zoom controls (user explicitly requested)
2. **High Priority**: Fix any broken admin features
3. **Medium Priority**: Add pagination to lists
4. **Medium Priority**: Make Settings page functional
5. **Lower Priority**: Add bulk actions
6. **Lower Priority**: Add activity feed

---

## Testing Checklist

After implementation, verify:
- [ ] Zoom buttons work in image lightbox
- [ ] Pinch-to-zoom works on mobile
- [ ] Double-tap/click resets zoom
- [ ] Panning works when zoomed in
- [ ] Admin dashboard loads with all stats
- [ ] Refresh button works on dashboard
- [ ] Pagination works on Users/Properties pages
- [ ] Bulk actions select/deselect work
- [ ] Settings page buttons are functional
- [ ] Mobile responsive design maintained throughout
- [ ] No console errors on any admin page

