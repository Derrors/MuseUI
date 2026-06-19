export const createId = (prefix = 'id'): string => {
  try {
    const randomUUID = globalThis.crypto?.randomUUID;
    if (typeof randomUUID === 'function') {
      return randomUUID.call(globalThis.crypto);
    }
  } catch {
    // Some browsers expose crypto but block randomUUID outside secure contexts.
  }

  const random = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}-${time}-${random}`;
};
