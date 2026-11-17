self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // Minimal fetch handler agar memenuhi syarat installasi WebAPK
});
