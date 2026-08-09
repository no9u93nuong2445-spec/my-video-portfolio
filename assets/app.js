(() => {
  'use strict';

  const works = Array.isArray(window.MOTION_WORKS) ? window.MOTION_WORKS : [];
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const saveData = Boolean(connection?.saveData);
  const slowConnection = ['slow-2g', '2g', '3g'].includes(connection?.effectiveType);
  const configuredCdns = Array.isArray(window.MOTION_ASSET_CDNS) ? window.MOTION_ASSET_CDNS : [];
  const legacyCdn = String(window.MOTION_ASSET_CDN || '').trim();
  const assetCdns = configuredCdns.length
    ? configuredCdns
    : (legacyCdn ? [{ name: 'cdn', base: legacyCdn }] : []);
  const assetVersion = String(window.MOTION_ASSET_VERSION || '').trim();
  const defaultQuality = String(window.MOTION_DEFAULT_QUALITY || 'smooth') === 'hd' ? 'hd' : 'smooth';

  const gallery = document.getElementById('gallery');
  const emptyState = document.getElementById('emptyState');
  const filters = [...document.querySelectorAll('.filter')];
  const player = document.getElementById('player');
  const playerStage = document.getElementById('playerStage');
  const mainVideo = document.getElementById('mainVideo');
  const playerLoading = document.getElementById('playerLoading');
  const playerLoadingText = document.getElementById('playerLoadingText') || playerLoading?.querySelector('p');
  const playerError = document.getElementById('playerError');
  const playerRetry = document.getElementById('playerRetry');
  const playerOpenExternal = document.getElementById('playerOpenExternal');
  const playerQuality = document.getElementById('playerQuality');
  const playerTitle = document.getElementById('playerTitle');
  const playerIndex = document.getElementById('playerIndex');
  const playerDuration = document.getElementById('playerDuration');
  const playerFormat = document.getElementById('playerFormat');
  const playerClose = document.getElementById('playerClose');
  const playerPrev = document.getElementById('playerPrev');
  const playerNext = document.getElementById('playerNext');
  const headerCount = document.getElementById('headerCount');
  const siteHeader = document.getElementById('siteHeader');
  const pageMain = document.querySelector('main');
  const scrollProgress = document.getElementById('scrollProgress');
  const preloader = document.getElementById('preloader');

  const PROBE_TIMEOUT = slowConnection ? 5200 : 3200;
  const SOURCE_TIMEOUT = slowConnection ? 12000 : 6500;
  const PROBE_RANGE = 'bytes=0-32767';

  let activeFilter = 'all';
  let visibleWorks = [...works];
  let currentIndex = 0;
  let lastFocusedElement = null;
  let touchStartX = 0;
  let touchStartY = 0;
  let loadTimeout = null;
  let stallTimeout = null;
  let currentVideoSources = [];
  let currentVideoSourceIndex = 0;
  let currentLoadToken = 0;
  let playbackStarted = false;
  let pendingSeekTime = null;
  let qualityMode = readQualityPreference();

  headerCount.textContent = `${String(works.length).padStart(2, '0')} FILMS`;
  updateQualityButton();

  function readQualityPreference() {
    try {
      const stored = localStorage.getItem('motion-quality');
      if (stored === 'hd' || stored === 'smooth') return stored;
    } catch {}
    if (saveData || slowConnection) return 'smooth';
    return defaultQuality;
  }

  function saveQualityPreference() {
    try { localStorage.setItem('motion-quality', qualityMode); } catch {}
  }

  function updateQualityButton() {
    if (!playerQuality) return;
    const isSmooth = qualityMode === 'smooth';
    playerQuality.textContent = isSmooth ? '流畅' : '高清';
    playerQuality.setAttribute('aria-label', isSmooth ? '当前流畅画质，点击切换高清' : '当前高清画质，点击切换流畅');
    playerQuality.dataset.quality = qualityMode;
  }

  function localAssetUrl(path) {
    try {
      return new URL(String(path || ''), document.baseURI).href;
    } catch {
      return String(path || '');
    }
  }

  function appendVersion(urlString) {
    if (!urlString) return '';
    try {
      const url = new URL(urlString);
      if (assetVersion) url.searchParams.set('v', assetVersion);
      return url.href;
    } catch {
      return urlString;
    }
  }

  function cdnAssetUrl(cdn, path) {
    const base = String(cdn?.base || '').trim().replace(/\/+$/, '');
    if (!base || !path) return '';
    const cleanPath = String(path).replace(/^\/+/, '');
    return appendVersion(`${base}/${cleanPath}`);
  }

  function liteVideoPath(path) {
    return String(path || '').replace(/^videos\//, 'videos-lite/');
  }

  function sourceCandidates(path) {
    const candidates = [
      { key: 'site', label: 'site', url: localAssetUrl(path) },
      ...assetCdns.map((cdn, index) => ({
        key: String(cdn?.name || `cdn-${index + 1}`),
        label: String(cdn?.name || `cdn-${index + 1}`),
        url: cdnAssetUrl(cdn, path)
      }))
    ].filter(item => item.url);

    const seen = new Set();
    return candidates.filter(item => {
      if (seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    });
  }

  function pathsForWork(work, preferredQuality) {
    const hd = String(work.video || '');
    const smooth = liteVideoPath(hd);
    return preferredQuality === 'hd'
      ? [{ quality: 'hd', path: hd }, { quality: 'smooth', path: smooth }]
      : [{ quality: 'smooth', path: smooth }, { quality: 'hd', path: hd }];
  }

  async function probeSource(candidate, token) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), PROBE_TIMEOUT);
    const startedAt = performance.now();
    try {
      const response = await fetch(candidate.url, {
        method: 'GET',
        headers: { Range: PROBE_RANGE },
        cache: 'force-cache',
        signal: controller.signal
      });
      if (!response.ok && response.status !== 206) throw new Error(`HTTP ${response.status}`);
      if (token !== currentLoadToken) throw new Error('stale probe');

      if (response.body?.getReader) {
        const reader = response.body.getReader();
        const first = await reader.read();
        try { await reader.cancel(); } catch {}
        if (!first.value?.byteLength) throw new Error('empty probe');
      }

      return { ...candidate, probeMs: Math.round(performance.now() - startedAt) };
    } finally {
      window.clearTimeout(timer);
      controller.abort();
    }
  }

  function preferredCachedSource(candidates) {
    try {
      const cachedKey = sessionStorage.getItem('motion-fast-source');
      if (!cachedKey) return candidates;
      const preferred = candidates.find(item => item.key === cachedKey);
      return preferred ? [preferred, ...candidates.filter(item => item !== preferred)] : candidates;
    } catch {
      return candidates;
    }
  }

  async function chooseSourceOrder(work, preferredQuality, token) {
    const pathGroups = pathsForWork(work, preferredQuality);
    const preferredCandidates = preferredCachedSource(sourceCandidates(pathGroups[0].path));
    let winner = null;

    if (navigator.onLine !== false && typeof fetch === 'function' && preferredCandidates.length > 1) {
      if (playerLoadingText) playerLoadingText.textContent = '正在选择最快线路';
      try {
        winner = await Promise.any(preferredCandidates.map(candidate => probeSource(candidate, token)));
        try { sessionStorage.setItem('motion-fast-source', winner.key); } catch {}
      } catch {}
    }

    const orderedPreferred = winner
      ? [winner, ...preferredCandidates.filter(item => item.url !== winner.url)]
      : preferredCandidates;

    const primary = orderedPreferred.map(item => ({ ...item, quality: pathGroups[0].quality }));
    const fallback = sourceCandidates(pathGroups[1].path).map(item => ({ ...item, quality: pathGroups[1].quality }));
    const seen = new Set();
    return [...primary, ...fallback].filter(item => {
      if (!item.url || seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    });
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function cardTemplate(work, index) {
    const number = String(work.id).padStart(2, '0');
    const eager = index < 3;
    const highPriority = index === 0;
    return `
      <button class="work-card work-card--${escapeHtml(work.orientation)}" type="button" data-id="${Number(work.id)}" aria-label="播放 ${escapeHtml(work.title)}">
        <span class="work-card__media">
          <img class="work-card__image" src="${escapeHtml(work.thumbnail)}" alt="${escapeHtml(work.title)} 视频封面" loading="${eager ? 'eager' : 'lazy'}" fetchpriority="${highPriority ? 'high' : 'auto'}" decoding="async">
          <span class="work-card__duration">${escapeHtml(work.duration)}s</span>
          <span class="work-card__play" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </span>
        </span>
        <span class="work-card__caption">
          <span>
            <strong class="work-card__title">${escapeHtml(work.title)}</strong>
            <span class="work-card__meta">${escapeHtml(work.subtitle || '')}</span>
          </span>
          <span class="work-card__number">FILM ${number}</span>
        </span>
      </button>`;
  }

  const cardObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            cardObserver.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -5% 0px', threshold: 0.06 })
    : null;

  function renderGallery(filter = activeFilter) {
    activeFilter = filter;
    gallery.dataset.filter = filter;
    visibleWorks = filter === 'all' ? [...works] : works.filter(work => work.orientation === filter);
    cardObserver?.disconnect();
    gallery.innerHTML = visibleWorks.map(cardTemplate).join('');
    emptyState.hidden = visibleWorks.length > 0;

    const cards = [...gallery.querySelectorAll('.work-card')];
    cards.forEach((card, index) => {
      const workId = Number(card.dataset.id);
      const work = works.find(item => item.id === workId);
      card.addEventListener('click', () => openPlayer(workId));
      const image = card.querySelector('.work-card__image');
      image?.addEventListener('error', () => {
        if (image.dataset.fallbackUsed === 'true') return;
        image.dataset.fallbackUsed = 'true';
        image.src = localAssetUrl(work?.thumbnail);
      }, { once: true });
      card.style.transitionDelay = prefersReducedMotion ? '0ms' : `${Math.min(index * 35, 280)}ms`;
      cardObserver ? cardObserver.observe(card) : card.classList.add('is-visible');
    });
  }

  filters.forEach(button => {
    button.addEventListener('click', () => {
      filters.forEach(item => {
        const selected = item === button;
        item.classList.toggle('is-active', selected);
        item.setAttribute('aria-pressed', String(selected));
      });
      renderGallery(button.dataset.filter);
    });
  });

  function setPageInert(isInert) {
    [siteHeader, pageMain].forEach(element => {
      if (element) element.inert = isInert;
    });
  }

  function openPlayer(workId) {
    const foundIndex = works.findIndex(work => work.id === workId);
    if (foundIndex < 0) return;
    currentIndex = foundIndex;
    lastFocusedElement = document.activeElement;
    player.classList.add('is-open');
    player.setAttribute('aria-hidden', 'false');
    document.body.classList.add('player-open');
    setPageInert(true);
    loadCurrentWork();
    window.setTimeout(() => playerClose.focus(), 80);
  }

  function clearTimers() {
    clearTimeout(loadTimeout);
    clearTimeout(stallTimeout);
  }

  function clearVideo() {
    currentLoadToken += 1;
    clearTimers();
    mainVideo.pause();
    mainVideo.removeAttribute('src');
    mainVideo.load();
    currentVideoSources = [];
    currentVideoSourceIndex = 0;
    playbackStarted = false;
    pendingSeekTime = null;
  }

  function closePlayer() {
    if (!player.classList.contains('is-open')) return;
    player.classList.remove('is-open');
    player.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('player-open');
    setPageInert(false);
    clearVideo();
    playerLoading.classList.add('is-hidden');
    playerError.hidden = true;
    window.setTimeout(() => lastFocusedElement?.focus(), 100);
  }

  function showLoadError() {
    clearTimers();
    playerLoading.classList.add('is-hidden');
    playerError.hidden = false;
    if (playerLoadingText) playerLoadingText.textContent = '视频线路暂不可用';
  }

  function scheduleLoadTimeout() {
    clearTimeout(loadTimeout);
    loadTimeout = window.setTimeout(() => {
      if (!playbackStarted && currentVideoSourceIndex < currentVideoSources.length - 1) {
        retryFromNextVideoSource();
      } else if (!playbackStarted) {
        showLoadError();
      }
    }, SOURCE_TIMEOUT);
  }

  function scheduleStallFallback() {
    if (playbackStarted) return;
    clearTimeout(stallTimeout);
    stallTimeout = window.setTimeout(() => {
      if (!playbackStarted) retryFromNextVideoSource();
    }, slowConnection ? 6000 : 3500);
  }

  function setVideoSource(index) {
    const source = currentVideoSources[index];
    if (!source) {
      showLoadError();
      return;
    }
    currentVideoSourceIndex = index;
    playbackStarted = false;
    playerLoading.classList.remove('is-hidden');
    playerError.hidden = true;
    if (playerLoadingText) {
      const qualityLabel = source.quality === 'smooth' ? '流畅版' : '高清版';
      playerLoadingText.textContent = `加载${qualityLabel} · ${source.label}`;
    }
    mainVideo.src = source.url;
    mainVideo.dataset.sourceOrigin = source.key;
    mainVideo.dataset.quality = source.quality;
    mainVideo.load();
    scheduleLoadTimeout();
  }

  async function loadCurrentWork(direction = 0, options = {}) {
    const work = works[currentIndex];
    if (!work) return;

    const token = ++currentLoadToken;
    clearTimers();
    playbackStarted = false;
    pendingSeekTime = Number.isFinite(options.resumeAt) ? Math.max(0, options.resumeAt) : null;
    playerLoading.classList.remove('is-hidden');
    playerError.hidden = true;
    if (playerLoadingText) playerLoadingText.textContent = '准备视频线路';
    mainVideo.pause();
    mainVideo.removeAttribute('src');
    mainVideo.poster = localAssetUrl(work.thumbnail);
    playerStage.classList.toggle('is-portrait', work.orientation === 'portrait');
    playerTitle.textContent = work.title;
    playerIndex.textContent = `FILM ${String(work.id).padStart(2, '0')} / ${String(works.length).padStart(2, '0')}`;
    playerDuration.textContent = `${work.duration} SEC`;
    playerFormat.textContent = `${work.orientation.toUpperCase()} · ${work.resolution}`;
    if (playerOpenExternal) {
      playerOpenExternal.href = localAssetUrl(work.video);
      playerOpenExternal.setAttribute('aria-disabled', 'false');
    }

    const sources = await chooseSourceOrder(work, qualityMode, token);
    if (token !== currentLoadToken || !player.classList.contains('is-open')) return;
    currentVideoSources = sources;
    currentVideoSourceIndex = 0;
    setVideoSource(0);

    if (direction !== 0 && !prefersReducedMotion) {
      playerStage.animate([
        { opacity: .35, transform: `translateX(${direction * 18}px)` },
        { opacity: 1, transform: 'translateX(0)' }
      ], { duration: 320, easing: 'cubic-bezier(.16,1,.3,1)' });
    }
  }

  function retryFromNextVideoSource() {
    if (!player.classList.contains('is-open') || !currentVideoSources.length || playbackStarted) return;
    clearTimers();
    const nextIndex = currentVideoSourceIndex + 1;
    if (nextIndex >= currentVideoSources.length) {
      showLoadError();
      return;
    }
    setVideoSource(nextIndex);
  }

  function stepPlayer(step) {
    currentIndex = (currentIndex + step + works.length) % works.length;
    loadCurrentWork(step);
  }

  function toggleQuality() {
    const resumeAt = Number.isFinite(mainVideo.currentTime) ? mainVideo.currentTime : 0;
    qualityMode = qualityMode === 'smooth' ? 'hd' : 'smooth';
    saveQualityPreference();
    updateQualityButton();
    loadCurrentWork(0, { resumeAt });
  }

  mainVideo.addEventListener('loadedmetadata', () => {
    if (pendingSeekTime !== null && Number.isFinite(mainVideo.duration)) {
      const seekTo = Math.min(pendingSeekTime, Math.max(0, mainVideo.duration - 0.15));
      try { mainVideo.currentTime = seekTo; } catch {}
      pendingSeekTime = null;
    }
  });

  mainVideo.addEventListener('loadeddata', () => {
    clearTimers();
    playbackStarted = true;
    playerLoading.classList.add('is-hidden');
    playerError.hidden = true;
    mainVideo.play().catch(() => {});
  });

  mainVideo.addEventListener('canplay', () => {
    clearTimers();
    playbackStarted = true;
    playerLoading.classList.add('is-hidden');
  });

  mainVideo.addEventListener('error', retryFromNextVideoSource);
  mainVideo.addEventListener('stalled', scheduleStallFallback);
  mainVideo.addEventListener('waiting', () => {
    if (!playbackStarted || mainVideo.currentTime < 0.35) scheduleStallFallback();
  });

  playerRetry.addEventListener('click', () => loadCurrentWork());
  playerQuality?.addEventListener('click', toggleQuality);
  playerClose.addEventListener('click', closePlayer);
  playerPrev.addEventListener('click', () => stepPlayer(-1));
  playerNext.addEventListener('click', () => stepPlayer(1));
  player.querySelector('[data-close-player]').addEventListener('click', closePlayer);

  playerStage.addEventListener('touchstart', event => {
    if (event.target === mainVideo) return;
    touchStartX = event.changedTouches[0]?.clientX ?? 0;
    touchStartY = event.changedTouches[0]?.clientY ?? 0;
  }, { passive: true });

  playerStage.addEventListener('touchend', event => {
    if (event.target === mainVideo) return;
    const touch = event.changedTouches[0];
    const deltaX = (touch?.clientX ?? touchStartX) - touchStartX;
    const deltaY = (touch?.clientY ?? touchStartY) - touchStartY;
    if (Math.abs(deltaX) > 80 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
      stepPlayer(deltaX < 0 ? 1 : -1);
    }
  }, { passive: true });

  document.addEventListener('keydown', event => {
    if (!player.classList.contains('is-open')) return;
    if (event.key === 'Escape') closePlayer();
    if (event.key === 'ArrowLeft') stepPlayer(-1);
    if (event.key === 'ArrowRight') stepPlayer(1);
    if (event.key === 'Tab') trapFocus(event);
  });

  function trapFocus(event) {
    const focusable = [...player.querySelectorAll('button,video[controls],a[href]')].filter(element => !element.disabled && !element.hidden);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function setupGlobalMotion() {
    const updateScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      scrollProgress.style.width = `${ratio * 100}%`;
      siteHeader.classList.toggle('is-scrolled', window.scrollY > 18);
    };
    window.addEventListener('scroll', updateScroll, { passive: true });
    updateScroll();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !mainVideo.paused) mainVideo.pause();
  });

  const hidePreloader = () => preloader?.classList.add('is-hidden');
  document.addEventListener('DOMContentLoaded', hidePreloader, { once: true });
  window.setTimeout(hidePreloader, 350);

  renderGallery();
  setupGlobalMotion();
})();
