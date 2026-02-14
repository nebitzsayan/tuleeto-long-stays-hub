# Fix: Admin Actions Reflecting on Main Pages + Mobile UI Polish

## Problem Summary

1. **Property actions not syncing**: When admin deletes/unpublishes/verifies a property, the main listings page and featured properties section still show stale data because `FEATURED_PROPERTIES_QUERY_KEY` and dashboard analytics aren't being invalidated comprehensively.
2. **Review actions not syncing**: The PropertyDetailPage's review system (`PropertyReviewSystem.tsx`) fetches reviews using local `useState`/`useEffect` -- NOT React Query. So invalidating `['reviews']` does nothing for the detail page. There's no mechanism for admin review changes to propagate.
3. **Mobile UI**: Buttons, cards, and action areas need better spacing, sizing, and layout on small screens.

---

## Part A: Fix Data Sync

### A1. Comprehensive invalidation helper

**Modify `src/hooks/useProperties.ts**`:

- Add a new exported `useInvalidateAdminData()` hook that invalidates ALL relevant query keys in one call:
  - `['properties']` (matches ListingsPage)
  - `['properties', 'featured', ...]` (matches FeaturedProperties -- already covered by prefix match, but add explicit for safety)
  - `['profiles']`
  - `['reviews']`
  - `['admin-analytics']` or whatever key `useAdminAnalytics` uses (if it uses React Query; currently it uses local state, so we handle via refetch)

### A2. Update PropertiesManagement invalidation

**Modify `src/pages/admin/PropertiesManagement.tsx**`:

- Update `invalidateQueries()` to also invalidate `FEATURED_PROPERTIES_QUERY_KEY` explicitly
- Invalidate `['reviews']` when deleting a property (reviews for that property become orphaned)

### A3. Update ReviewsManagement invalidation

**Modify `src/pages/admin/ReviewsManagement.tsx**`:

- The `invalidateQueries()` already invalidates `PROPERTIES_QUERY_KEY` and `['reviews']`
- This covers the ListingsPage (which fetches reviews as part of properties query: `select('*, reviews:property_reviews(rating)')`)
- For the PropertyDetailPage review section: since it uses local state, we need a different approach

### A4. Convert PropertyReviewSystem to React Query (targeted change)

**Modify `src/components/property/PropertyReviewSystem.tsx**`:

- Replace the `useState` + `useEffect` fetch pattern with `useQuery` using a query key like `['property-reviews', propertyId]`
- This way, when admin invalidates `['property-reviews']` or the prefix `['reviews']`, the detail page will refetch
- Update the `invalidateQueries` in ReviewsManagement to also invalidate `['property-reviews']`

### A5. Update UsersManagement

**Modify `src/pages/admin/UsersManagement.tsx**`:

- Already invalidates `PROFILES_QUERY_KEY` and `PROPERTIES_QUERY_KEY` -- add `FEATURED_PROPERTIES_QUERY_KEY` for completeness

---

## Part B: Mobile UI Polish

### B1. BulkActions improvements

**Modify `src/components/admin/BulkActions.tsx**`:

- Increase touch target sizes to minimum 44x44px on mobile
- Add proper padding and gap between action buttons
- Make "Select all" row more compact on small screens
- Make the popup button more optimise for mobile devices

### B2. Property cards mobile layout

**Modify `src/pages/admin/PropertiesManagement.tsx**` (mobile card section):

- Improve button row at bottom of cards: use full-width grid layout instead of flex-wrap
- Add proper spacing between action buttons
- Make action button labels more readable

### B3. Review cards mobile layout

**Modify `src/pages/admin/ReviewsManagement.tsx**` (mobile card section):

- Improve action button sizing and spacing
- Better badge layout
- Improve comment text display

### B4. Users cards mobile layout

**Modify `src/pages/admin/UsersManagement.tsx**` (mobile card section):

- Improve action button row spacing
- Better touch targets for expand/collapse

### B5. Pagination mobile improvement

**Modify `src/components/admin/Pagination.tsx**`:

- Increase button sizes to 44x44px minimum on mobile
- Better spacing between pagination controls

### B6. Dashboard mobile tweaks

**Modify `src/pages/admin/Dashboard.tsx**`:

- Ensure stats cards have consistent padding on all screen sizes
- Quick action buttons: slightly larger icons and better spacing

---

## Files to Modify


| File                                               | Changes                                         |
| -------------------------------------------------- | ----------------------------------------------- |
| `src/hooks/useProperties.ts`                       | Add comprehensive `useInvalidateAdminData` hook |
| `src/pages/admin/PropertiesManagement.tsx`         | Better invalidation + mobile card UI            |
| `src/pages/admin/ReviewsManagement.tsx`            | Better invalidation + mobile card UI            |
| `src/pages/admin/UsersManagement.tsx`              | Better invalidation + mobile card UI            |
| `src/components/property/PropertyReviewSystem.tsx` | Convert review fetching to React Query          |
| `src/components/admin/BulkActions.tsx`             | Mobile touch target improvements                |
| `src/components/admin/Pagination.tsx`              | Mobile button size improvements                 |
| `src/pages/admin/Dashboard.tsx`                    | Minor mobile spacing tweaks                     |


---

## Technical Details

### React Query Cache Invalidation Flow

After admin actions (delete property, verify, unpublish, approve/reject review):

```text
Admin Action (e.g., delete property)
  |
  v
Supabase mutation succeeds
  |
  v
invalidateQueries called:
  - ['properties']          --> ListingsPage refetches on next visit
  - ['properties','featured',...] --> FeaturedProperties refetches
  - ['property-reviews']    --> PropertyDetailPage reviews refetch
  - ['reviews']             --> Any review-specific queries
  - ['profiles']            --> Profile data refreshes
  |
  v
fetchData() called locally  --> Admin panel refreshes immediately
```

### PropertyReviewSystem React Query Migration

Current pattern (local state):

```text
useState(reviews) + useEffect(() => fetchReviews(), [propertyId])
```

New pattern:

```text
useQuery({
  queryKey: ['property-reviews', propertyId],
  queryFn: () => fetchReviews(propertyId),
})
```

All mutation functions inside PropertyReviewSystem (add review, delete review, etc.) will also call `queryClient.invalidateQueries({ queryKey: ['property-reviews', propertyId] })` after success.