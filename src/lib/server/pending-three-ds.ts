type PendingThreeDsPayment = {
  packageId: number;
  userId: string;
  accessToken: string;
  refreshToken: string | null;
  createdAt: number;
};

const TTL_MS = 30 * 60 * 1000;

const globalForPending = globalThis as typeof globalThis & {
  __algoryPendingThreeDs?: Map<string, PendingThreeDsPayment>;
};

function getStore(): Map<string, PendingThreeDsPayment> {
  if (!globalForPending.__algoryPendingThreeDs) {
    globalForPending.__algoryPendingThreeDs = new Map();
  }
  return globalForPending.__algoryPendingThreeDs;
}

function pruneExpired(store: Map<string, PendingThreeDsPayment>) {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.createdAt > TTL_MS) store.delete(key);
  }
}

export function savePendingThreeDsPayment(
  conversationId: string,
  data: Omit<PendingThreeDsPayment, "createdAt">,
) {
  const store = getStore();
  pruneExpired(store);
  const entry = { ...data, createdAt: Date.now() };
  store.set(conversationId, entry);
}

/** Aynı ödeme farklı conversationId anahtarlarıyla kaydedilebilir (request vs iyzico echo). */
export function savePendingThreeDsPaymentAliases(
  conversationIds: string[],
  data: Omit<PendingThreeDsPayment, "createdAt">,
) {
  for (const id of new Set(conversationIds.filter(Boolean))) {
    savePendingThreeDsPayment(id, data);
  }
}

export function takePendingThreeDsPayment(conversationId: string): PendingThreeDsPayment | null {
  const store = getStore();
  pruneExpired(store);
  const entry = store.get(conversationId);
  if (!entry) return null;
  store.delete(conversationId);
  return entry;
}
