(() => {
  'use strict';

  const works = Array.isArray(window.MOTION_WORKS) ? window.MOTION_WORKS : [];
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const gallery = document.getElementById('gallery');
  const emptyState = document.getElementById('emptyState');
  const filters = [...document.querySelectorAll('.filter')];
  const player = document.getElementById('player');
  const playerStage = document.getElementById('playerStage');
  const mainVideo = document.getElementById('mainVideo');
  const playerLoading = document.getElementById('playerLoading');
  const playerError = document.getElementById('playerError');
  const playerTitle = document.getElementById('playerTitle');
  const playerIndex = document.getElementById('playerIndex');
  const playerDuration = document.getElementById('playerDuration');
  const playerFormat = document.getElementById('playerFormat');
  const playerClose = document.getElementById('playerClose');
  const playerPrev = document.getElementById('playerPrev');
  const playerNext = document.getElementById('playerNext');
  const headerCount = document.getElementById('headerCount');
  const siteHeader = document.getElementById('siteHeader');
  const scrollProgress = document.getElementById('scrollProgress');
  const cursorGlow = document.getElementById('cursorGlow');
  const preloader = document.getElementById('preloader');

  let activeFilter = 'all';
  let visibleWorks = [...works];
  let currentIndex = 0;
  let lastFocusedElement = null;
  let previewTimer = null;
  let touchStartX = 0;

  headerCount.textContent = `${String(works.length).padStart(2, '0')} FILMS`;

  function cardTemplate(work) {
    const number = String(work.id).padStart(2, '0');
    const orientationLabel = work.orientation === 'landscape' ? 'LANDSCAPE' : 'PORTRAIT';
    return `
      <button class="work-card work-card--${work.orientation}" type="button" data-id="${work.id}" aria-label="播放 ${work.title}">
        <span class="work-card__media">
          <img class="work-card__image" src="${work.thumbnail}" alt="${work.title} 视频封面" loading="lazy" decoding="async">
        </span>
        <span class="work-card__chrome">
          <span class="work-card__top"><span>FILM ${number}</span><span>${work.duration} SEC</span></span>
          <span class="work-card__bottom">
            <span>
              <strong class="work-card__title">${work.title}</strong>
              <span class="work-card__meta">${orientationLabel} · ${work.resolution}</span>
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

  function renderGallery(filter = activeFilter) {
    activeFilter = filter;
    visibleWorks = filter === 'all' ? [...works] : works.filter(work => work.orientation === filter);
    gallery.innerHTML = visibleWorks.map(cardTemplate).join('');
    emptyState.hidden = visibleWorks.length > 0;

    const cards = [...gallery.querySelectorAll('.work-card')];
    cards.forEach((card, index) => {
      const workId = Number(card.dataset.id);
      const work = works.find(item => item.id === workId);
      card.addEventListener('click', () => openPlayer(workId));
      card.style.transitionDelay = `${Math.min(index * 45, 360)}ms`;
      setupCardEffects(card, work);
      cardObserver?.observe(card);
    });
  }

  const cardObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            cardObserver.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -7% 0px', threshold: 0.08 })
    : null;

  function setupCardEffects(card, work) {
    const media = card.querySelector('.work-card__media');

    if (!cardObserver) card.classList.add('is-visible');

    card.addEventListener('pointermove', event => {
      if (!canHover || prefersReducedMotion) return;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${y * -3.6}deg) rotateY(${x * 4.2}deg) translateY(-4px)`;
    });

    card.addEventListener('pointerenter', () => {
      if (!canHover || prefersReducedMotion) return;
      clearTimeout(previewTimer);
      previewTimer = window.setTimeout(() => startPreview(card, media, work), 550);
    });

    card.addEventListener('pointerleave', () => {
      clearTimeout(previewTimer);
      card.style.transform = '';
      stopPreview(card);
    });
  }

  function startPreview(card, media, work) {
    if (card.querySelector('video') || player.classList.contains('is-open')) return;
    const preview = document.createElement('video');
    preview.className = 'work-card__preview';
    preview.muted = true;
    preview.loop = true;
    preview.playsInline = true;
    preview.preload = 'metadata';
    preview.src = work.video;
    preview.addEventListener('canplay', () => {
      card.classList.add('is-previewing');
      preview.play().catch(() => stopPreview(card));
    }, { once: true });
    media.appendChild(preview);
  }

  function stopPreview(card) {
    const preview = card.querySelector('.work-card__preview');
    card.classList.remove('is-previewing');
    if (!preview) return;
    preview.pause();
    preview.removeAttribute('src');
    preview.load();
    preview.remove();
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

  function openPlayer(workId) {
    const foundIndex = works.findIndex(work => work.id === workId);
    if (foundIndex < 0) return;

    currentIndex = foundIndex;
    lastFocusedElement = document.activeElement;
    document.querySelectorAll('.work-card').forEach(stopPreview);
    player.classList.add('is-open');
    player.setAttribute('aria-hidden', 'false');
    document.body.classList.add('player-open');
    loadCurrentWork();
    window.setTimeout(() => playerClose.focus(), 100);
  }

  function closePlayer() {
    if (!player.classList.contains('is-open')) return;
    player.classList.remove('is-open');
    player.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('player-open');
    mainVideo.pause();
    mainVideo.removeAttribute('src');
    mainVideo.load();
    window.setTimeout(() => lastFocusedElement?.focus(), 120);
  }

  function loadCurrentWork(direction = 0) {
    const work = works[currentIndex];
    if (!work) return;

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

    if (direction !== 0 && !prefersReducedMotion) {
      playerStage.animate([
        { opacity: .35, transform: `translateX(${direction * 24}px)` },
        { opacity: 1, transform: 'translateX(0)' }
      ], { duration: 380, easing: 'cubic-bezier(.16,1,.3,1)' });
    }
  }

  function stepPlayer(step) {
    currentIndex = (currentIndex + step + works.length) % works.length;
    loadCurrentWork(step);
  }

  mainVideo.addEventListener('loadeddata', () => {
    playerLoading.classList.add('is-hidden');
    mainVideo.play().catch(() => {});
  });
  mainVideo.addEventListener('canplay', () => playerLoading.classList.add('is-hidden'));
  mainVideo.addEventListener('error', () => {
    playerLoading.classList.add('is-hidden');
    playerError.hidden = false;
  });

  playerClose.addEventListener('click', closePlayer);
  playerPrev.addEventListener('click', () => stepPlayer(-1));
  playerNext.addEventListener('click', () => stepPlayer(1));
  player.querySelector('[data-close-player]').addEventListener('click', closePlayer);

  player.addEventListener('touchstart', event => {
    touchStartX = event.changedTouches[0]?.clientX ?? 0;
  }, { passive: true });
  player.addEventListener('touchend', event => {
    const endX = event.changedTouches[0]?.clientX ?? touchStartX;
    const delta = endX - touchStartX;
    if (Math.abs(delta) > 70) stepPlayer(delta < 0 ? 1 : -1);
  }, { passive: true });

  document.addEventListener('keydown', event => {
    if (!player.classList.contains('is-open')) return;
    if (event.key === 'Escape') closePlayer();
    if (event.key === 'ArrowLeft') stepPlayer(-1);
    if (event.key === 'ArrowRight') stepPlayer(1);
    if (event.key === 'Tab') trapFocus(event);
  });

  function trapFocus(event) {
    const focusable = [...player.querySelectorAll('button,[controls]')].filter(element => !element.disabled);
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
    const reelFrames = [...document.querySelectorAll('.reel-frame')];
    const hero = document.querySelector('.hero');

    if (canHover && !prefersReducedMotion) {
      window.addEventListener('pointermove', event => {
        cursorGlow.style.left = `${event.clientX}px`;
        cursorGlow.style.top = `${event.clientY}px`;
        cursorGlow.classList.add('is-visible');

        const rect = hero.getBoundingClientRect();
        if (rect.bottom > 0) {
          const x = event.clientX / window.innerWidth - 0.5;
          const y = event.clientY / window.innerHeight - 0.5;
          reelFrames.forEach(frame => {
            const depth = Number(frame.dataset.depth || 0.5);
            frame.style.translate = `${x * depth * 24}px ${y * depth * 18}px`;
          });
        }
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
    if (prefersReducedMotion) return;
    const canvas = document.getElementById('atmosphere');
    const context = canvas.getContext('2d', { alpha: true });
    let particles = [];
    let frameId = 0;
    let width = 0;
    let height = 0;
    let active = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(72, Math.max(24, Math.floor((width * height) / 26000)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + .4,
        vx: (Math.random() - .5) * .14,
        vy: (Math.random() - .5) * .14,
        alpha: Math.random() * .45 + .12
      }));
    };

    const draw = () => {
      if (!active) return;
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
      frameId = requestAnimationFrame(draw);
    };

    document.addEventListener('visibilitychange', () => {
      active = !document.hidden;
      cancelAnimationFrame(frameId);
      if (active) draw();
    });
    window.addEventListener('resize', resize, { passive: true });
    resize();
    draw();
  }

  window.addEventListener('load', () => {
    preloader.classList.add('is-hidden');
    document.body.classList.add('is-ready');
  }, { once: true });

  renderGallery();
  setupGlobalMotion();
  setupAtmosphere();
})();
