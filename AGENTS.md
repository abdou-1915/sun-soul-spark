# Project rules
- App data lives in localStorage as a fast cache and is mirrored per collection (JSON) to the `user_store` table keyed by the signed-in user; all writes must go through `src/lib/localdb.ts` or `setCollection` in `src/lib/cloud-sync.ts` so they reach the cloud. Why: lets every device share the same data without rewriting each page.
- The whole app is gated by `AuthGate` in `__root.tsx` (Google sign-in). Why: data is per-user and must be protected.
- The service worker must stay network-first, same-origin only, and skip `/~oauth`. Why: cache-first served stale data and can break sign-in.
