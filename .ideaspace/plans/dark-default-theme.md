# Make Dark Mode the Default

## Summary

Switch Ideaspace's first-run theme behavior from the current light/system-leaning default to a dark default across the desktop app shell, preload path, and native window chrome, while preserving user-selected overrides and the existing theme picker.

## Clarified Goal

- Make the default appearance selection `dark` instead of `system` for first-run users.
- Keep the appearance controls (`system`, `light`, `dark`) available after the change.
- Preserve saved user preferences so existing installs are not reset.

## Kanban

### Todo

- [ ] Change `packages/ui/src/theme/context.tsx` so the default `colorScheme` is `"dark"` instead of `"system"`.
- [ ] Change `packages/ui/src/theme/context.tsx` so the initial `mode` is `"dark"` before saved preferences load.
- [ ] Keep the default `themeId` unchanged unless design also wants a different bundled theme.
- [ ] Preserve the current precedence rule so saved `ideaspace-theme-id` and `ideaspace-color-scheme` values still override the new default.
- [ ] Update `packages/app/public/oc-theme-preload.js` so missing `ideaspace-color-scheme` falls back to `dark` instead of `system`.
- [ ] Review `packages/ui/src/theme/loader.ts` for any light-first fallback behavior that could still produce a light initial paint.
- [ ] Review `packages/ui/src/styles/theme.css` for root-level `color-scheme: light` fallback declarations and adjust them if they can appear before runtime theme injection.
- [ ] Ensure cached per-theme CSS (`ideaspace-theme-css-*`) still works for returning users with saved `light`, `dark`, or `system` preferences.
- [ ] Verify `packages/app/src/components/titlebar.tsx` still sends the correct theme to Tauri window chrome when the default scheme becomes `dark`.
- [ ] Audit `packages/app/src/pages/layout.tsx` and `packages/app/src/components/settings-general.tsx` for any UI logic that assumes the active default is `system`.
- [ ] Check `packages/app/src/components/terminal.tsx` so terminal fallback colors still derive from the active dark variant.
- [ ] Test first launch with empty `localStorage` and confirm the app paints dark before Solid mounts.
- [ ] Test returning users with saved `light`, `dark`, and `system` preferences and confirm nothing is overwritten.
- [ ] Test switching themes and schemes from settings and the command palette, then reload to confirm persistence still works.
- [ ] Test desktop window chrome on macOS via `packages/desktop/BUILD_APP.md` and confirm no light titlebar mismatch remains.
- [ ] Test a plain web run of `packages/app` to catch any preload or hydration mismatch outside the desktop shell.
- [ ] Update any theme docs, screenshots, or release notes that still describe the previous default behavior.
- [ ] Add or adjust tests around theme initialization if coverage exists near `packages/ui/src/theme/context.tsx` or preload behavior.
- [ ] Capture the final product decision in the eventual PR notes so teammates know that new installs now default to `dark` instead of `system`.

### In Progress

- [ ] None.

### Done

- [x] Clarified that the goal is changing the default appearance selection from `system` to `dark`, not forcing dark mode for all users.
- [x] Identified the primary implementation points: `packages/ui/src/theme/context.tsx` and `packages/app/public/oc-theme-preload.js`.
- [x] Confirmed the desired behavior that existing saved user preferences should remain untouched.

## Likely Files

- `packages/ui/src/theme/context.tsx`
- `packages/app/public/oc-theme-preload.js`
- `packages/ui/src/theme/loader.ts`
- `packages/ui/src/styles/theme.css`
- `packages/app/src/components/titlebar.tsx`
- `packages/app/src/pages/layout.tsx`
- `packages/app/src/components/settings-general.tsx`
- `packages/app/src/components/terminal.tsx`

## Risks

- Existing users may not appear to change because saved preferences should override the new default.
- A partial change can cause a light flash before hydration if preload, fallback CSS, and runtime defaults disagree.
- Native titlebar theming can drift from the webview if Tauri receives `system`/`dark` values inconsistent with the actual first paint.
- If `oc-1` remains the default theme id, some fallback token sets may still be biased toward light unless all baseline CSS paths are updated together.

## What Changes

- The main implementation change is to replace the default `colorScheme` value of `"system"` with `"dark"` in the theme provider.
- The preload script should also default to `dark` when no saved scheme exists, otherwise first paint may still follow system appearance.
- Most existing UI and persistence behavior can stay as-is because the setting picker already supports `dark`.

## Kanban Export

Use this board payload when writing `.ideaspace/kanban.json`:

```json
{
  "items": [
    {
      "id": "dark-default-1",
      "title": "Default theme store to dark",
      "detail": "Change packages/ui/src/theme/context.tsx so first-run colorScheme and mode default to dark instead of system.",
      "status": "planned",
      "priority": "high"
    },
    {
      "id": "dark-default-2",
      "title": "Make preload paint dark first",
      "detail": "Update packages/app/public/oc-theme-preload.js so missing ideaspace-color-scheme falls back to dark.",
      "status": "planned",
      "priority": "high"
    },
    {
      "id": "dark-default-3",
      "title": "Review loader and fallback CSS",
      "detail": "Check packages/ui/src/theme/loader.ts and packages/ui/src/styles/theme.css for light-first fallback behavior before runtime theme injection.",
      "status": "planned",
      "priority": "high"
    },
    {
      "id": "dark-default-4",
      "title": "Preserve saved user preferences",
      "detail": "Keep localStorage precedence so existing light, dark, and system selections continue to win over the new default.",
      "status": "planned",
      "priority": "high"
    },
    {
      "id": "dark-default-5",
      "title": "Verify desktop titlebar theme sync",
      "detail": "Confirm packages/app/src/components/titlebar.tsx still sends the correct dark value to Tauri window chrome.",
      "status": "planned",
      "priority": "medium"
    },
    {
      "id": "dark-default-6",
      "title": "Audit UI for system-default assumptions",
      "detail": "Review packages/app/src/pages/layout.tsx and packages/app/src/components/settings-general.tsx for logic that assumes system is the active default.",
      "status": "planned",
      "priority": "medium"
    },
    {
      "id": "dark-default-7",
      "title": "Check terminal dark fallback colors",
      "detail": "Ensure packages/app/src/components/terminal.tsx still derives fallback terminal colors from the active dark variant.",
      "status": "planned",
      "priority": "medium"
    },
    {
      "id": "dark-default-8",
      "title": "Test empty storage first launch",
      "detail": "Verify the app paints dark before Solid mounts when no saved preference exists.",
      "status": "planned",
      "priority": "high"
    },
    {
      "id": "dark-default-9",
      "title": "Test saved preference migrations",
      "detail": "Verify returning users with saved light, dark, and system preferences are not reset.",
      "status": "planned",
      "priority": "high"
    },
    {
      "id": "dark-default-10",
      "title": "Test settings and command persistence",
      "detail": "Switch themes and schemes from settings and command palette, reload, and confirm persistence still works.",
      "status": "planned",
      "priority": "medium"
    },
    {
      "id": "dark-default-11",
      "title": "Validate macOS desktop chrome",
      "detail": "Run the packages/desktop build flow and confirm there is no light titlebar mismatch.",
      "status": "planned",
      "priority": "medium"
    },
    {
      "id": "dark-default-12",
      "title": "Update docs and test coverage",
      "detail": "Adjust any docs, screenshots, release notes, and theme-init tests that still describe system as the default.",
      "status": "planned",
      "priority": "low"
    }
  ]
}
```
