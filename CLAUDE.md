# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm start` — start the Expo dev server (press `w`/`i`/`a` in the terminal for web/iOS/Android)
- `npm run ios` / `npm run android` / `npm run web` — start directly on a platform
- `npx tsc --noEmit` — typecheck (the tsconfig sets `noEmit`; there is no build step)

There is no test runner (`npm test` intentionally fails) and no linter configured.

## Architecture

An Expo / React Native (TypeScript) diary app. The whole app is client-side with no backend.

**Navigation is hand-rolled, not a router.** `src/App.tsx` is the single stateful container. It holds all screen state (`currentScreen: 'list' | 'details' | 'timeline'`, `selectedId`) and conditionally renders one of three screen components. There is no `@react-navigation` dependency despite what the README/Copilot notes claim — navigation happens by swapping which component `App` returns and passing `onBack`/`onSelect`-style callbacks down as props. Screen components are presentational and receive both data and mutation callbacks from `App`.

**State ownership.** `App` owns the `entries: DiaryEntry[]` array — the single source of truth. All mutations (add entry, delete entry, add photo) live in `App` and flow down as callbacks. Child screens never own diary data.

**Persistence.** Entries are persisted to `AsyncStorage` under the key `@progress_diary_entries`. Two effects in `App.tsx` handle this: one loads on mount (setting `isReady` when done), the other saves on every `entries` change but is gated by `isReady` so the initial empty/seed state never overwrites saved data before the load completes. When changing the `DiaryEntry`/`DiaryPhoto` shape (`src/types.ts`), remember that older serialized data may already exist in storage.

**Screens** (`src/`):
- `DiaryList.tsx` — entry list; swipe-left-to-delete via `react-native-gesture-handler` `Swipeable`. The 📷 timeline button only appears when at least one entry has photos.
- `DiaryDetails.tsx` — single entry; adds photos via `expo-image-picker` (requests media-library permission first). Photos are sorted newest-first by `createdAt ?? selectedAt`.
- `DiaryPhotosTimeline.tsx` — all photos across all entries, flattened and sorted newest-first, rendered as a vertical timeline.

**Entry point.** `index.js` (not `App.tsx`) is the real root: it wraps `App` in `GestureHandlerRootView` — required for the `Swipeable` gestures — and calls `registerRootComponent`.

## Conventions

- Date parsing avoids `Intl` and the strict Hermes `Date` parser. `parseEntryDate` in `DiaryDetails.tsx` manually handles both `YYYY-MM-DD` (seed/`addEntry` data) and `M/D/YYYY` locale strings. Prefer this pattern over `new Date(str)` / `toLocaleDateString` for on-device date formatting.
- IDs are generated with `String(Date.now())` for both entries and photos.
- Styling is per-component `StyleSheet.create` at the bottom of each file; the shared accent color is `#1f69ff`.
- The `@/*` path alias maps to `./src/*` (tsconfig), though current imports use relative paths.
