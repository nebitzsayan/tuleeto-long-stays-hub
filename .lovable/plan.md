
# Comprehensive Fix Plan: Image Preview, Phone Formatting, and Admin Panel

## Issues Summary

### Issue 1: Image Preview Component (URGENT/HIGH PRIORITY)
**Current Problems:**
- Images are cut off or not showing properly on mobile
- Images don't maintain original aspect ratio
- The popup is buggy and not optimized for small screens
- Current implementation uses complex Dialog components that don't work well on mobile

**Root Causes:**
- `ImagePreviewModal.tsx` uses nested flex containers with Dialog that conflicts with full-screen display
- `object-contain` is used but container constraints cause cut-off
- ImageKit URL optimization exists but may not be properly applied

### Issue 2: Phone Number Formatting
**Current State:**
- Property details page shows full phone number: `{property.contactPhone}`
- Located in `src/pages/PropertyDetailPage.tsx` lines 437-441

**Required Format:**
- `+91 859xxxxxxxx` (show country code + first 3 digits, mask the rest)

### Issue 3: Admin Panel Not Loading
**Current Problems:**
- Shows "Verifying admin access" and then goes blank
- The admin user has the correct role in database (verified: user_id = a8bac681-0d89-4e1a-beef-2563255c6c37, role = admin)

**Root Causes:**
- RPC `is_current_user_admin` and `has_role` functions exist (verified)
- The RLS policy was recently fixed but may still have issues
- The old `AdminPanel.tsx` uses `userProfile?.isAdmin` which doesn't exist in the role-based system
- Potential race condition or timeout in `AdminRoute.tsx`

---

## Implementation Plan

### Part A: Delete and Recreate Image Preview from Scratch (PRIORITY)

#### Step 1: Create New Simple Full-Screen Image Viewer
Create a completely new component that is simple, mobile-first, and uses ImageKit optimization.

**New File: `src/components/property/MobileImageViewer.tsx`**
- Pure full-screen overlay (no Dialog wrapper)
- Uses `fixed inset-0 z-[9999]` for true full-screen
- Touch swipe navigation with proper gesture handling
- Uses ImageKit `getPreviewUrl` for optimal image quality
- `object-contain` with proper flex layout to prevent cut-off
- Simple close button, navigation arrows, and image counter
- Safe area padding for iOS notch

```text
+---------------------------------------+
|  [X]                      1 / 5       |  <- Header with close + counter
|                                       |
|                                       |
|         +-----------------+           |
|   [<]   |     IMAGE       |   [>]     |  <- Full image with nav arrows
|         | (object-contain)|           |
|         +-----------------+           |
|                                       |
|             • • • • •                 |  <- Dot indicators
+---------------------------------------+
```

#### Step 2: Create New Image Grid Popup
**New File: `src/components/property/ImageGalleryPopup.tsx`**
- Clean full-screen popup for image grid
- Uses ImageKit `getThumbUrl` for grid thumbnails
- Click on thumbnail opens `MobileImageViewer`
- Optimized grid layout (1 column on small mobile, 2 columns on tablet)

#### Step 3: Update ImageKit URL Helper
**File: `src/lib/imagekitUrl.ts`**
- Add `getMobilePreviewUrl` function for mobile-optimized preview sizes
- Ensure proper width calculations based on device

#### Step 4: Delete Old Components
- Delete or rename `ImagePreviewModal.tsx` 
- Delete or rename `ScrollableImagePreview.tsx`
- Delete `SimpleMobileImagePreview.tsx` (unused)

#### Step 5: Update PropertyImageCarousel
- Import and use new `ImageGalleryPopup` instead of `ScrollableImagePreview`

---

### Part B: Phone Number Formatting

#### Step 1: Create Phone Formatting Utility
**New File: `src/lib/formatPhone.ts`**
```typescript
export const formatPhonePartialMask = (phone: string): string => {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Handle Indian numbers
  if (digits.length >= 10) {
    const lastTen = digits.slice(-10);
    const first3 = lastTen.slice(0, 3);
    return `+91 ${first3}${'x'.repeat(7)}`;
  }
  
  return phone; // Return original if format unexpected
};
```

#### Step 2: Update PropertyDetailPage.tsx
- Import the formatting utility
- Apply to phone number display at line 441
- Change from: `{property.contactPhone}`
- Change to: `{formatPhonePartialMask(property.contactPhone)}`

---

### Part C: Admin Panel Fix

#### Step 1: Simplify AdminRoute.tsx
Current issues with the admin route:
- Complex state management with `checkedUserId`
- RPC may fail silently

**Changes:**
1. Add more robust error handling and logging
2. Add a direct database query fallback that doesn't rely on RLS
3. Ensure timeout actually triggers properly
4. Add a "force check" option if previous check failed

#### Step 2: Update the RPC Function (if needed)
Verify the `is_current_user_admin` RPC is working correctly by testing it directly.

#### Step 3: Fix Old AdminPanel.tsx Reference
The old `AdminPanel.tsx` at `/src/pages/AdminPanel.tsx` is still using `userProfile?.isAdmin` which doesn't work with the role-based system. This page needs to be either:
1. Removed from the navigation completely, OR
2. Updated to redirect to `/admin` (the new admin dashboard)

Since App.tsx shows `/admin/*` uses the new role-based system with `AdminRoute`, the old `AdminPanel` component should be deprecated.

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/property/MobileImageViewer.tsx` | New full-screen image viewer |
| `src/components/property/ImageGalleryPopup.tsx` | New image grid popup |
| `src/lib/formatPhone.ts` | Phone number formatting utility |

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/imagekitUrl.ts` | Add mobile-optimized preview function |
| `src/components/property/PropertyImageCarousel.tsx` | Use new image components |
| `src/pages/PropertyDetailPage.tsx` | Apply phone number formatting |
| `src/components/auth/AdminRoute.tsx` | Improve error handling and fallback |
| `src/pages/AdminPanel.tsx` | Redirect to new admin or deprecate |

## Files to Delete/Rename

| File | Action |
|------|--------|
| `src/components/property/ImagePreviewModal.tsx` | Replace with new component |
| `src/components/property/ScrollableImagePreview.tsx` | Replace with new component |
| `src/components/property/SimpleMobileImagePreview.tsx` | Delete (unused) |

---

## Technical Details

### New MobileImageViewer Component Structure
```text
- No Dialog/Sheet wrapper (pure fixed overlay)
- Uses React.createPortal for proper z-index stacking
- Touch gesture handling with threshold detection
- Keyboard navigation (arrow keys, Escape)
- Image sizing: max-w-[95vw] max-h-[85vh] object-contain
- Safe area padding: pt-[env(safe-area-inset-top)]
- ImageKit preview URL: getPreviewUrl(url, window.innerWidth)
```

### Admin Panel Debug Flow
```text
1. User navigates to /admin
2. AdminRoute checks if authLoading
3. If user exists, call is_current_user_admin RPC
4. If RPC fails, fallback to direct user_roles query
5. If all fail within timeout, show error with retry
6. If admin=true, render children (Dashboard)
```

---

## Testing Checklist

After implementation, verify:
1. [ ] Image preview opens in true full-screen on mobile
2. [ ] Images maintain original aspect ratio (no cut-off)
3. [ ] Swipe navigation works on mobile
4. [ ] Image grid popup shows all photos
5. [ ] Clicking grid image opens full-screen viewer
6. [ ] Phone number displays as +91 XXXxxxxxxx
7. [ ] Admin panel loads for admin user
8. [ ] Non-admin users are properly redirected
9. [ ] Admin dashboard shows stats correctly
