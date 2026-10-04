# Frontend: Shree Laxminarayan Mandir website

The Next.js 16 (App Router) website, in English and Nepali.

- Overview, features and architecture: [`../README.md`](../README.md)
- First-time setup (keys, Supabase, login providers): [`../MANUAL_STEPS.md`](../MANUAL_STEPS.md)

```powershell
npm install
npm run dev          # http://localhost:3000  (needs the backend on :8000)
npx tsc --noEmit     # type-check
npx eslint src       # lint
```

Every visible string lives in `src/messages/en.json` and `src/messages/ne.json`. Add new text to **both**.
