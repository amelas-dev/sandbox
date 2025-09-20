# Tooling Overview

This directory centralizes all of the ad-hoc scripts that previously lived at the
repository root.

- `apply_helper.py`, `modify_app.py`, and `update_app.py` are one-off maintenance
  helpers for tweaking `src/App.tsx`.
- `experiments/` groups the quick exploratory scripts (prefixed with `tmp_`)
  used to inspect snippets of the codebase while iterating on features.

Run any of these scripts from the `document-merge/` directory so their
project-relative paths resolve correctly, for example:

```bash
cd document-merge
python tools/experiments/tmp_expr.py
```
