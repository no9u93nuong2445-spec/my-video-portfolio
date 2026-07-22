'use strict';

const CACHE_PREFIX = 'motion-gallery-';
const CACHE_NAME = `${CACHE_PREFIX}2026-07-23-v2`;
const CORE_ASSETS = [
  './',
  './index.html',
  './favicon.svg',
  './assets/styles.css?v=20260723-2',
  './assets/resilience.css?v=20260723-2',
  './assets/data.js?v=20260723-2',
  './assets/app.js?v=20260723-2',
  './assets/resilience.js?v=20260723-2',
  './thumbnails/1_thumb.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(CORE_ASSETS.map(asset => cache.add(new Request(asset, { cache: 'reload' }))));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

function isVideoRequest(request, url) {
  return request.destination === 'video' ||
    request.headers.has('range') ||
    /\/(videos|previews)\//i.test(url.pathname) ||
    /\.(mp4|webm|mov|m3u8)(?:$|\?)/i.test(url.href);
}

async function cacheResponse(request, response) {
  if (!response || !response.ok || response.type === 'opaque') return response;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
  return response;
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    return cacheResponse(request, response);
  } catch (error) {
    return (await caches.match(request, { ignoreSearch: true })) ||
      (await caches.match('./index.html', { ignoreSearch: true })) ||
      (await caches.match('./')) ||
      Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request, { ignoreSearch: false });
  const network = fetch(request)
    .then(response => cacheResponse(request, response))
    .catch(() => null);
  return cached || (await network) || Response.error();
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || isVideoRequest(request, url)) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (['style', 'script', 'image', 'font'].includes(request.destination)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
