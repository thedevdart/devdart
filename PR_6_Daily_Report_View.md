Refactor Daily Report View to match standalone matrix design
#6

## Status: Ready for Review

## The objective

The in-app Daily Report View was using a basic table layout, whereas the exported "standalone" HTML file featured a highly interactive, split-pane matrix with Center vs. Item toggles, search filters, and smooth accordions. 

The goal was to completely port the standalone design into the native Django app, keeping it wrapped within our global `base.html` layout, while retaining its Server-Side Rendered (SSR) data hydration so it communicates directly with the live database.

## The fix

Multiple files were updated to unify the design and fix minor UI bugs:

1. **`inventory/templates/inventory/daily_report_view.html`**
   - Replaced the entire table structure with the split-pane layout from the standalone file.
   - Shifted the internal "Report Index" sidebar to the right side of the screen to prevent visual conflicts with the global left-hand navigation.
   - Replaced the native HTML5 `<input type="date">` with the standardized Flatpickr component.
   - Injected the missing `@alpinejs/collapse` CDN script to fix console warnings regarding `x-collapse`.
   - Patched an Alpine.js `TypeError` by adding safe optional chaining `(item.centers ? item.centers.length : 0)` when switching between view modes.

2. **`inventory/static/inventory/js/daily_report_view.js`**
   - Removed all development `console.log` traces.
   - Added a `parseInt` fallback when parsing column quantities to ensure strict integer typing.

3. **`inventory/templates/inventory/base.html`**
   - Fixed the "Daily Report View" icon in the main left sidebar. Applied the standard classes (`text-lg w-5 text-center shrink-0`) to perfectly align its size and spacing with the rest of the navigation links.

## Test plan

On staging, navigate to the Daily Report View:

1. Observe the new split-pane layout. Ensure the global navigation is on the left, and the report navigator is on the right.
2. Click between "By Center" and "By Item" in the right sidebar. Ensure the list transitions smoothly without throwing JavaScript errors in the console.
3. Select a center and test the Raw Material and Finished Goods accordions. Confirm they open and close properly.
4. Click the Date picker in the top right. Confirm it opens the Flatpickr UI, and selecting a new date reloads the page with that date's data.
5. Look at the main left sidebar and confirm the "Daily Report View" icon is visually aligned with the rest of the menu items.

## Rollback

Revert the `report-view-fixes` branch. All changes are isolated to the frontend templates and static JS files, so reverting will instantly restore the old basic table layout without affecting the database.
