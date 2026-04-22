---
description: Checking for zero-rated / data-light compliance
---

1. Run the build to generate the `.next` output.
// turbo
2. Run `npm run build`
3. Analyze duplicate chunks or large assets in `.next/static/chunks`.
4. Ensure no images exceed 500KB without optimized `next/image` usage.
5. Verify `public/manifest.json` has the correct `theme_color` and `icons`.
6. Run a Lighthouse CI check if available.
