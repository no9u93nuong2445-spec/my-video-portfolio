# Mainland playback V2.2

This iteration keeps every asset inside the existing GitHub repository and focuses on reducing startup cost and avoiding long waits on a dead route.

- Generates 16 low-bandwidth MP4 copies at up to 854px, 24fps, H.264 Main + AAC, Fast Start.
- Defaults playback to the lightweight copy; users can switch to HD in the player.
- Probes same-origin GitHub Pages, fastly.jsdelivr.net and cdn.jsdelivr.net with a tiny Range request and uses the first route that actually returns bytes.
- Remembers the fastest route for the current browser session.
- Reduces initial route timeout from 18s to about 6.5s and adds early stalled/waiting failover.
- Falls back across both quality levels before showing a hard error.
- Keeps video Range requests out of the Service Worker cache.

This is a repository-only mitigation. It improves weak-network startup but does not turn GitHub into a mainland-hosted origin.
