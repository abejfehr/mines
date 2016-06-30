/**
 * Minesweeper - serviceworker.js
 *
 * @author Abe Fehr
 */

const CACHE_NAME = 'minesweeper-cache-v0.0.3';

/**
 * Initially adds the files used to the cache
 */
let handleInstall = function(event) {
    var urlsToCache = [
        'index.html',
        'js/game.js'
    ];

    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(function (cache) {
            console.log('Opened cache');
            return cache.addAll(urlsToCache);
        })
    );

};

/**
 * Handles the request in the same way as stale-while-revalidate
 */
let handleFetch = function (event) {
    event.respondWith(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.match(event.request).then(function (response) {
                var fetchPromise = fetch(event.request).then(function (networkResponse) {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
                return response || fetchPromise;
            })
        })
    );
};

self.addEventListener('install', handleInstall);
self.addEventListener('fetch', handleFetch);