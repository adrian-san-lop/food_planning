import { CURRENT_STATE_VERSION } from './state-normalization.js?v=20261023-planning-persistence';

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
      // A current-format planning draft must not be silently replaced by an
      // empty account if it is invalid. Keep the original bytes for recovery.
      if (original.v >= CURRENT_STATE_VERSION) throw Object.assign(
        new Error('La copia de trabajo guardada no pasa las validaciones. Se conserva en este navegador.'),
        { code: 'PERSISTED_STATE_INVALID' },
      );
    }
  } catch (error) {
    onError();
    if (error.code === 'PERSISTED_STATE_INVALID') throw error;
  }
  return emptyState();
}

export function saveLocalState({ key, state, getStorage = () => globalThis.localStorage, updateEditedAt = true }) {
  state.v = CURRENT_STATE_VERSION;
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
