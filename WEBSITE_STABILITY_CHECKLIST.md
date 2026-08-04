# Website Stability Checklist

- [ ] Every loading flag cleared in `finally` / on redirect
- [ ] Auth guards timeout (≤15s) and clear spinner
- [ ] Images handle `img.complete` (cache) not only `onLoad`
- [ ] Uploads require session; show real error messages
- [ ] DB write errors checked (no silent image wipe)
- [ ] External fetches have AbortSignal timeouts
- [ ] Payment/SMS not called on admin dashboard mount
- [ ] Callbacks excluded from auth middleware
- [ ] Shared DB pool; statement timeout set
- [ ] Admin lists paginated (or bounded)
- [ ] Hard-refresh after deploy (stale Server Actions)
- [ ] Health: `/api/health` → healthy
