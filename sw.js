/* Sistem Global Cari Kart — Service Worker
   Amaç: ana ekrandan açıldığında internet olmasa bile sayfayı açmak.
   Strateji: kurulumda dosyaları önbelleğe al, sonra önce-önbellek (cache-first). */

var CACHE = 'sg-cari-v1';

/* Önbelleğe alınacak dosyalar — hepsi göreceli yol (GitHub Pages alt dizini için).
   index.html zaten QR kütüphanesini içinde barındırıyor, dış bağımlılık yok. */
var ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return c.addAll(ASSETS).catch(function(){ /* bir dosya eksik olsa da kurulum sürsün */ });
    })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        if(k !== CACHE) return caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function(hit){
      if(hit) return hit;
      // Önbellekte yoksa ağdan dene, başarılıysa önbelleğe ekle
      return fetch(e.request).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, copy); }).catch(function(){});
        return res;
      }).catch(function(){
        // Tamamen çevrimdışı ve istek sayfa navigasyonuysa index'i ver
        if(e.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
