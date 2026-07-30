/**
 * Service Worker
 * 支持 PWA 离线运行与 Web Share Target（从安卓相册等应用分享图片/视频到本工具）
 */

const CACHE_NAME = 'meme-generator-v4';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/expression.js',
  './js/meme-engine.js',
  './js/app.js',
  './js/gif.js',
  './js/gif.worker.js',
  './hot-topics.json',
  './assets/models/tiny_face_detector_model-weights_manifest.json',
  './assets/models/tiny_face_detector_model-shard1',
  './assets/models/face_expression_model-weights_manifest.json',
  './assets/models/face_expression_model-shard1',
  './assets/models/face_landmark_68_model-weights_manifest.json',
  './assets/models/face_landmark_68_model-shard1'
];

// 安装时缓存核心资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).catch((err) => {
      console.warn('SW cache failed:', err);
    })
  );
  self.skipWaiting();
});

// 激活时清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 拦截 Web Share Target 的 POST 请求，保存分享的文件
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 处理分享目标
  if (event.request.method === 'POST' && url.pathname.endsWith('/share-target')) {
    event.respondWith(handleShareTarget(event.request));
    return;
  }

  // 缓存优先策略
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        // 缓存成功的 GET 请求
        if (event.request.method === 'GET' && response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(() => {
        // 离线且未缓存时返回离线页面（可选）
        return caches.match('./index.html');
      });
    })
  );
});

async function handleShareTarget(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') || formData.get('media') || formData.get('image');

    if (file && file.size > 0) {
      // 将文件存入 IndexedDB，供主页面读取
      await saveSharedFile(file);
      // 重定向回首页并带上标记
      return Response.redirect('./?share-target=pending', 303);
    }
  } catch (err) {
    console.error('Share target handling failed:', err);
  }
  return Response.redirect('./?share-target=error', 303);
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('meme-generator-db', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('shared-files')) {
        db.createObjectStore('shared-files', { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveSharedFile(file) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('shared-files', 'readwrite');
    const store = tx.objectStore('shared-files');
    const req = store.put({ id: 'latest', file, timestamp: Date.now() });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// 监听消息：主页面请求共享文件
self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'GET_SHARED_FILE') {
    try {
      const db = await openDB();
      const tx = db.transaction('shared-files', 'readonly');
      const store = tx.objectStore('shared-files');
      const req = store.get('latest');
      req.onsuccess = () => {
        const record = req.result;
        event.ports[0].postMessage({ file: record ? record.file : null });
      };
      req.onerror = () => {
        event.ports[0].postMessage({ file: null, error: req.error.message });
      };
    } catch (err) {
      event.ports[0].postMessage({ file: null, error: err.message });
    }
  }
});
