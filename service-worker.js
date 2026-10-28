// Altere a versão sempre que publicar uma atualização do index.html
const VERSAO = 'checkin-byd-v1';
const ARQUIVOS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(chaves => Promise.all(chaves.filter(k => k !== VERSAO).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Nunca guardar respostas do servidor (Apps Script)
  if (url.hostname.endsWith('script.google.com') || url.hostname.endsWith('googleusercontent.com')) return;

  // Página: tenta a rede primeiro (pega atualizações) e usa o cache sem internet
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => { const copia = res.clone(); caches.open(VERSAO).then(c => c.put('./index.html', copia)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Demais arquivos (ícones, fontes): cache primeiro
  e.respondWith(
    caches.match(req).then(emCache => emCache || fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) {
        const copia = res.clone();
        caches.open(VERSAO).then(c => c.put(req, copia));
      }
      return res;
    }).catch(() => emCache))
  );
});
