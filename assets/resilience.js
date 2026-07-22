(() => {
  'use strict';

  const root = document.documentElement;
  const networkNotice = document.getElementById('networkNotice');
  const mainVideo = document.getElementById('mainVideo');
  const playerOpenExternal = document.getElementById('playerOpenExternal');
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  let noticeTimer = 0;

  function getNetworkState() {
    const effectiveType = connection?.effectiveType || '';
    return {
      offline: !navigator.onLine,
      saveData: Boolean(connection?.saveData),
      slow: ['slow-2g', '2g', '3g'].includes(effectiveType)
    };
  }

  function showNotice(message, persistent = false) {
    if (!networkNotice) return;
    window.clearTimeout(noticeTimer);
    networkNotice.textContent = message;
    networkNotice.hidden = false;
    if (!persistent) {
      noticeTimer = window.setTimeout(() => {
        networkNotice.hidden = true;
      }, 4200);
    }
  }

  function applyNetworkState(announce = false) {
    const state = getNetworkState();
    root.classList.toggle('is-offline', state.offline);
    root.classList.toggle('is-save-data', state.saveData);
    root.classList.toggle('is-slow-network', state.slow);

    if (!announce) return;
    if (state.offline) {
      showNotice('当前网络已断开：缓存过的页面和封面仍可浏览，视频播放需要恢复联网。', true);
    } else if (state.saveData || state.slow) {
      showNotice('检测到节省流量或较慢网络，已自动减少动态特效。');
    } else {
      showNotice('网络已恢复。');
    }
  }

  function syncExternalVideoLink() {
    if (!mainVideo || !playerOpenExternal) return;
    const source = mainVideo.currentSrc || mainVideo.getAttribute('src') || '';
    if (!source) {
      playerOpenExternal.href = '#';
      playerOpenExternal.setAttribute('aria-disabled', 'true');
      return;
    }
    playerOpenExternal.href = new URL(source, window.location.href).href;
    playerOpenExternal.setAttribute('aria-disabled', 'false');
  }

  if (mainVideo && playerOpenExternal) {
    ['loadstart', 'loadedmetadata', 'error', 'emptied'].forEach(eventName => {
      mainVideo.addEventListener(eventName, syncExternalVideoLink);
    });
    new MutationObserver(syncExternalVideoLink).observe(mainVideo, {
      attributes: true,
      attributeFilter: ['src']
    });
  }

  window.addEventListener('online', () => applyNetworkState(true));
  window.addEventListener('offline', () => applyNetworkState(true));
  connection?.addEventListener?.('change', () => applyNetworkState(true));

  window.addEventListener('pageshow', event => {
    if (event.persisted) {
      requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    }
  });

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('./service-worker.js', {
          updateViaCache: 'none'
        });
        registration.update().catch(() => {});
      } catch (error) {
        console.warn('Service worker registration failed:', error);
      }
    }, { once: true });
  }

  applyNetworkState(false);
  syncExternalVideoLink();
})();
