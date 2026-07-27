(() => {
  'use strict';

  const works = Array.isArray(window.MOTION_WORKS) ? window.MOTION_WORKS : [];
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const saveData = Boolean(connection?.saveData);
  const slowConnection = ['slow-2g', '2g', '3g'].includes(connection?.effectiveType);

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
  const pageMain = document.querySelector('main');
  const scrollProgress = document.getElementById('scrollProgress');
  const preloader = document.getElementById('preloader');

  let activeFilter = 'all';
  let visibleWorks = [...works];
  let currentIndex = 0;
  let lastFocusedElement = null;
  let touchStartX = 0;
  let touchStartY = 0;
  let loadTimeout = null;

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

    loadTimeout = window.setTimeout(showLoadError, slowConnection ? 45000 : 30000);

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
    if (document.hidden) {
      if (!mainVideo.paused) mainVideo.pause();
    }
  });

  const hidePreloader = () => preloader?.classList.add('is-hidden');
  document.addEventListener('DOMContentLoaded', hidePreloader, { once: true });
  window.setTimeout(hidePreloader, 350);

  renderGallery();
  setupGlobalMotion();
})();
