import { normalizeActivitySetup } from "../activity/activityModel.js";

const DB_NAME = "kalaframe";
const DB_VERSION = 1;
const STORE_NAME = "activityHistory";

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB is not available in this browser."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("lastUsedAt", "lastUsedAt");
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveActivityHistoryItem(activitySetup) {
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  const item = {
    ...normalizeActivitySetup(activitySetup),
    lastUsedAt: new Date().toISOString(),
    useCount: (activitySetup.useCount ?? 0) + 1,
  };

  store.put(item);

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(item);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getRecentActivityHistory(limit = 10) {
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const items = request.result
        .map((item) => normalizeActivitySetup(item))
        .sort((a, b) => String(b.lastUsedAt).localeCompare(String(a.lastUsedAt)))
        .slice(0, limit);
      resolve(items);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function clearActivityHistory() {
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).clear();

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
