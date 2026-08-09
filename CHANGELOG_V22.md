## V2.2.0 — repository-only weak-network playback

- Add low-bandwidth copies for all 16 MP4 files.
- Default the player to smooth quality with a one-click HD switch.
- Probe GitHub Pages, Fastly jsDelivr and standard jsDelivr in parallel with a tiny byte-range request.
- Select the route that returns real bytes first instead of waiting 18 seconds on one route.
- Fail over early on stalled/waiting/error states before first playback.
- Refresh asset cache versions and exclude `videos-lite` range traffic from Service Worker caching.
