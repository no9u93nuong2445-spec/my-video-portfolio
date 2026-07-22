(() => {
  'use strict';

  const works = Array.isArray(window.MOTION_WORKS) ? window.MOTION_WORKS : [];
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const saveData = Boolean(connection?.saveData);
  const slowConnection = ['slow-2g', '2g', '3g'].includes(connection?.effectiveType);
  const allowPreview = canHover && !prefersReducedMotion && !saveData && !slowConnection;
  const allowAtmosphere = window.innerWidth > 860 && !prefersReducedMotion && !saveData && !slowConnection;

  const gallery = document.getElementById('gallery');
  const emptyState = document.getElementById('emptyState');
  const filters = [...document.querySelectorAll('.filter')];
  const player = document.getElementById('player');
  const playerStage = document.getElementById('playerStage');
  const mainVideo = document.getElementById('mainVideo');
  const playerLoading = document.getElementById('playerLoading');
  const playerError = document.getElementById('playerError');
  const playerRetry = document.getElementById('playerRetry');
  const playerTitle = document.getElementById('playerTitle');
  const playerIndex = document.getElementById('playerIndex');
  const playerDuration = document.getElementById('playerDuration');
  const playerFormat = document.getElementById('playerFormat');
  const playerClose = document.getElementById('playerClose');
  const playerPrev = document.getElementById('playerPrev');
  const playerNext = document.getElementById('playerNext');
  const headerCount = document.getElementById('headerCount');
  const siteHeader = document.getElementById('siteHeader');
  const siteFooter = document.getElementById('siteFooter');
  const pageMain = document.querySelector('main');
  const scrollProgress = document.getElementById('scrollProgress');
  const cursorGlow = document.getElementById('cursorGlow');
  const preloader = document.getElementById('preloader');

  let activeFilter = 'all';
  let visibleWorks = [...works];
  let currentIndex = 0;
  let lastFocusedElement = null;
  let previewTimer = null;
  let activePreviewCard = null;
  let touchStartX = 0;
  let touchStartY = 0;
  let loadTimeout = null;
  let resizeTimer = null;

  headerCount.textContent = `${String(works.length).padStart(2, '0')} FILMS`;

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
    const orientationLabel = work.orientation === 'landscape' ? 'LANDSCAPE' : 'PORTRAIT';
    const eager = index < 2;
    const highPriority = index === 0;
    return `
      <button class="work-card work-card--${escapeHtml(work.orientation)}" type="button" data-id="${Number(work.id)}" aria-label="播放 ${escapeHtml(work.title)}">
        <span class="work-card__media">
          <img class="work-card__image" src="${escapeHtml(work.thumbnail)}" alt="${escapeHtml(work.title)} 视频封面" loading="${eager ? 'eager' : 'lazy'}" fetchpriority="${highPriority ? 'high' : 'auto'}" decoding="async">
        </span>
        <span class="work-card__chrome">
          <span class="work-card__top"><span>FILM ${number}</span><span>${escapeHtml(work.duration)} SEC</span></span>
          <span class="work-card__bottom">
            <span>
              <strong class="work-card__title">${escapeHtml(work.title)}</strong>
              <span class="work-card__meta">${escapeHtml(work.subtitle || `${orientationLabel} · ${work.resolution}`)}</span>
            </span>
            <span class="work-card__play" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </span>
          </span>
        </span>
        <span class="work-card__shine"></span>
        <span class="work-card__outline"></span>
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

  function layoutMasonry() {
    if (!gallery || !gallery.children.length) return;
    const styles = getComputedStyle(gallery);
    const rowHeight = parseFloat(styles.gridAutoRows) || 8;
    const gap = parseFloat(styles.rowGap) || 0;

    [...gallery.children].forEach(card => {
      card.style.gridRowEnd = 'auto';
      const height = card.getBoundingClientRect().height;
      const span = Math.max(1, Math.ceil((height + gap) / (rowHeight + gap)));
      card.style.gridRowEnd = `span ${span}`;
    });
  }

  function renderGallery(filter = activeFilter) {
    activeFilter = filter;
    visibleWorks = filter === 'all' ? [...works] : works.filter(work => work.orientation === filter);
    stopAllPreviews();
    cardObserver?.disconnect();
    gallery.innerHTML = visibleWorks.map(cardTemplate).join('');
    emptyState.hidden = visibleWorks.length > 0;

    const cards = [...gallery.querySelectorAll('.work-card')];
    cards.forEach((card, index) => {
      const workId = Number(card.dataset.id);
      const work = works.find(item => item.id === workId);
      card.addEventListener('click', () => openPlayer(workId));
      card.style.transitionDelay = prefersReducedMotion ? '0ms' : `${Math.min(index * 35, 280)}ms`;
      setupCardEffects(card, work);
      cardObserver ? cardObserver.observe(card) : card.classList.add('is-visible');
      card.querySelector('img')?.addEventListener('load', layoutMasonry, { once: true });
    });

    requestAnimationFrame(layoutMasonry);
  }

  function setupCardEffects(card, work) {
    const media = card.querySelector('.work-card__media');

    card.addEventListener('pointermove', event => {
      if (!canHover || prefersReducedMotion) return;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${y * -2.4}deg) rotateY(${x * 2.8}deg) translateY(-3px)`;
    });

    card.addEventListener('pointerenter', () => {
      if (!allowPreview || !work?.preview) return;
      clearTimeout(previewTimer);
      previewTimer = window.setTimeout(() => startPreview(card, media, work), 700);
    });

    card.addEventListener('pointerleave', () => {
      clearTimeout(previewTimer);
      card.style.transform = '';
      stopPreview(card);
    });
  }

  function startPreview(card, media, work) {
    if (!allowPreview || !work.preview || player.classList.contains('is-open')) return;
    if (activePreviewCard && activePreviewCard !== card) stopPreview(activePreviewCard);
    if (card.querySelector('video')) return;

    const preview = document.createElement('video');
    preview.className = 'work-card__preview';
    preview.muted = true;
    preview.loop = true;
    preview.playsInline = true;
    preview.preload = 'metadata';
    preview.src = work.preview;
    preview.addEventListener('canplay', () => {
      card.classList.add('is-previewing');
      activePreviewCard = card;
      preview.play().catch(() => stopPreview(card));
    }, { once: true });
    preview.addEventListener('error', () => stopPreview(card), { once: true });
    media.appendChild(preview);
  }

  function stopPreview(card) {
    if (!card) return;
    const preview = card.querySelector('.work-card__preview');
    card.classList.remove('is-previewing');
    if (activePreviewCard === card) activePreviewCard = null;
    if (!preview) return;
    preview.pause();
    preview.removeAttribute('src');
    preview.load();
    preview.remove();
  }

  function stopAllPreviews() {
    clearTimeout(previewTimer);
    document.querySelectorAll('.work-card').forEach(stopPreview);
    activePreviewCard = null;
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
    [siteHeader, pageMain, siteFooter].forEach(element => {
      if (element) element.inert = isInert;
    });
  }

  function openPlayer(workId) {
    const foundIndex = works.findIndex(work => work.id === workId);
    if (foundIndex < 0) return;

    currentIndex = foundIndex;
    lastFocusedElement = document.activeElement;
    stopAllPreviews();
    player.classList.add('is-open');
    player.setAttribute('aria-hidden', 'false');
    document.body.classList.add('player-open');
    setPageInert(true);
    loadCurrentWork();
    window.setTimeout(() => playerClose.focus(), 80);
  }

  function clearVideo() {
    clearTimeout(loadTimeout);
    mainVideo.pause();
    mainVideo.removeAttribute('src');
    mainVideo.load();
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
    clearTimeout(loadTimeout);
    playerLoading.classList.add('is-hidden');
    playerError.hidden = false;
  }

  function loadCurrentWork(direction = 0) {
    const work = works[currentIndex];
    if (!work) return;

    clearTimeout(loadTimeout);
    playerLoading.classList.remove('is-hidden');
    playerError.hidden = true;
    mainVideo.pause();
    mainVideo.removeAttribute('src');
    mainVideo.poster = work.thumbnail;
    mainVideo.src = work.video;
    playerStage.classList.toggle('is-portrait', work.orientation === 'portrait');
    playerTitle.textContent = work.title;
    playerIndex.textContent = `FILM ${String(work.id).padStart(2, '0')} / ${String(works.length).padStart(2, '0')}`;
    playerDuration.textContent = `${work.duration} SEC`;
    playerFormat.textContent = `${work.orientation.toUpperCase()} · ${work.resolution}`;
    mainVideo.load();

    loadTimeout = window.setTimeout(showLoadError, slowConnection ? 18000 : 12000);

    if (direction !== 0 && !prefersReducedMotion) {
      playerStage.animate([
        { opacity: .35, transform: `translateX(${direction * 18}px)` },
        { opacity: 1, transform: 'translateX(0)' }
      ], { duration: 320, easing: 'cubic-bezier(.16,1,.3,1)' });
    }
  }

  function stepPlayer(step) {
    currentIndex = (currentIndex + step + works.length) % works.length;
    loadCurrentWork(step);
  }

  mainVideo.addEventListener('loadeddata', () => {
    clearTimeout(loadTimeout);
    playerLoading.classList.add('is-hidden');
    playerError.hidden = true;
    mainVideo.play().catch(() => {});
  });
  mainVideo.addEventListener('canplay', () => {
    clearTimeout(loadTimeout);
    playerLoading.classList.add('is-hidden');
  });
  mainVideo.addEventListener('error', showLoadError);

  playerRetry.addEventListener('click', () => loadCurrentWork());
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
    const focusable = [...player.querySelectorAll('button,video[controls]')].filter(element => !element.disabled && !element.hidden);
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
    if (canHover && !prefersReducedMotion) {
      window.addEventListener('pointermove', event => {
        cursorGlow.style.left = `${event.clientX}px`;
        cursorGlow.style.top = `${event.clientY}px`;
        cursorGlow.classList.add('is-visible');
      }, { passive: true });
      document.addEventListener('mouseleave', () => cursorGlow.classList.remove('is-visible'));
    }

    const updateScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      scrollProgress.style.width = `${ratio * 100}%`;
      siteHeader.classList.toggle('is-scrolled', window.scrollY > 18);
    };
    window.addEventListener('scroll', updateScroll, { passive: true });
    updateScroll();
  }

  function setupAtmosphere() {
    if (!allowAtmosphere) return;
    const canvas = document.getElementById('atmosphere');
    const context = canvas?.getContext('2d', { alpha: true });
    if (!canvas || !context) return;

    let particles = [];
    let frameId = 0;
    let width = 0;
    let height = 0;
    let active = true;
    let lastFrame = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(46, Math.max(20, Math.floor((width * height) / 42000)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.3 + .35,
        vx: (Math.random() - .5) * .12,
        vy: (Math.random() - .5) * .12,
        alpha: Math.random() * .35 + .10
      }));
      layoutMasonry();
    };

    const draw = timestamp => {
      if (!active) return;
      frameId = requestAnimationFrame(draw);
      if (timestamp - lastFrame < 33) return;
      lastFrame = timestamp;
      context.clearRect(0, 0, width, height);
      particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        if (particle.x < -5) particle.x = width + 5;
        if (particle.x > width + 5) particle.x = -5;
        if (particle.y < -5) particle.y = height + 5;
        if (particle.y > height + 5) particle.y = -5;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(255,255,255,${particle.alpha})`;
        context.fill();
      });
    };

    document.addEventListener('visibilitychange', () => {
      active = !document.hidden;
      cancelAnimationFrame(frameId);
      if (active) frameId = requestAnimationFrame(draw);
    });
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 120);
    }, { passive: true });
    resize();
    frameId = requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(layoutMasonry, 120);
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAllPreviews();
      if (!mainVideo.paused) mainVideo.pause();
    }
  });

  const hidePreloader = () => preloader?.classList.add('is-hidden');
  document.addEventListener('DOMContentLoaded', hidePreloader, { once: true });
  window.setTimeout(hidePreloader, 1400);

  renderGallery();
  setupGlobalMotion();
  setupAtmosphere();
})();
