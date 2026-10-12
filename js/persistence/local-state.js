export function loadLocalState({ key, cleanState, emptyState, getStorage = () => globalThis.localStorage, onError = () => {} }) {
  try {
    const storage = getStorage();
    const raw = storage.getItem(key);
    if (raw) {
      const original = JSON.parse(raw);
      const parsed = cleanState(original);
      if (parsed) {
        if (parsed.v !== original.v) {
          try {
            storage.setItem(key, JSON.stringify(parsed));
          } catch {
            onError();
          }
        }
        return parsed;
      }
    }
  } catch {
    onError();
  }
  return emptyState();
}

export function saveLocalState({ key, state, getStorage = () => globalThis.localStorage, updateEditedAt = true }) {
  state.v = 8;
  try {
    const storage = getStorage();
    storage.setItem(key, JSON.stringify(state));
    if (updateEditedAt) {
      try {
        storage.setItem(`${key}:edited_at`, new Date().toISOString());
      } catch {
        // The state itself was saved; the optional conflict timestamp was not.
      }
    }
    return true;
  } catch {
    return false;
  }
}
