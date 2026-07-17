# React + TypeScript + Vite + Convex

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules, wired up to [Convex](https://www.convex.dev/) as the backend.

## Convex setup

The `convex/` directory contains a sample `tasks` table/schema and query/mutation, and `src/main.tsx` already wraps the app in `ConvexProvider`. To connect a real Convex deployment:

1. Copy `.env.local.example` to `.env.local`.
2. Run `npx convex dev` in one terminal — this logs you into Convex (opens a browser), creates/links a deployment, fills in `VITE_CONVEX_URL` in `.env.local`, and generates `convex/_generated`.
3. Run `yarn dev` in another terminal to start the Vite dev server.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
