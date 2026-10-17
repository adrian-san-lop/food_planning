// The four local pages are the single source of legal content, including drafts.
const DOCUMENTS = new Map([
  ['privacidad.html', 'Privacidad y protección de datos'],
  ['cookies.html', 'Cookies y almacenamiento'],
  ['aviso-legal.html', 'Aviso legal'],
  ['condiciones.html', 'Condiciones de uso'],
].map(([file, title]) => [file, { file, title, url: new URL(`../../${file}`, import.meta.url) }]));

function legalTarget(href) {
  let url;
  try { url = new URL(href, document.baseURI); } catch { return null; }
  const entry = [...DOCUMENTS.values()].find(item => item.url.origin === url.origin && item.url.pathname === url.pathname);
  return entry ? { ...entry, hash: url.hash } : null;
}

export function setupLegalDialogs({ embedded = false, authFrame = null, canOpen = () => true } = {}) {
  let dialog, title, content, opener, activeDocument;
  let revision = 0;
  let restoreFocus = true;
  const documents = new Map();

  function ensureDialog() {
    if (dialog) return;
    dialog = document.createElement('dialog');
    dialog.className = 'legal-dialog';
    dialog.setAttribute('aria-labelledby', 'legalDialogTitle');
    const header = document.createElement('header');
    header.className = 'legal-dialog-header';
    title = document.createElement('h2');
    title.id = 'legalDialogTitle';
    title.tabIndex = -1;
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'legal-dialog-close';
    closeButton.textContent = 'Cerrar';
    closeButton.autofocus = true;
    closeButton.addEventListener('click', () => close());
    content = document.createElement('div');
    content.className = 'legal-dialog-content';
    header.append(title, closeButton);
    dialog.append(header, content);
    document.body.append(dialog);
    dialog.addEventListener('click', event => { if (event.target === dialog) close(); });
    dialog.addEventListener('close', () => {
      // A preceding close event must not clear a dialog that was reopened.
      if (dialog.open) return;
      revision++;
      document.documentElement.classList.remove('legal-dialog-open');
      content.replaceChildren();
      content.removeAttribute('aria-busy');
      if (restoreFocus && opener?.isConnected) opener.focus({ preventScroll: true });
      opener = null;
      activeDocument = null;
    });
  }

  async function loadDocument(entry) {
    const url = entry.url.href;
    if (!documents.has(url)) {
      documents.set(url, fetch(url, { credentials: 'omit' }).then(response => {
        if (!response.ok) throw new Error('Legal document unavailable');
        return response.text();
      }).then(html => {
        const source = new DOMParser().parseFromString(html, 'text/html').querySelector('.legal-main');
        if (!source) throw new Error('Legal document content missing');
        return source;
      }).catch(error => { documents.delete(url); throw error; }));
    }
    return documents.get(url);
  }

  function scrollToSection(hash) {
    let id;
    try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
    const section = [...content.querySelectorAll('[id]')].find(element => element.id === id);
    if (!section) return;
    content.scrollTop += section.getBoundingClientRect().top - content.getBoundingClientRect().top - 16;
    section.tabIndex = -1;
    section.focus({ preventScroll: true });
  }

  async function showDocument(entry) {
    const request = ++revision;
    activeDocument = entry.file;
    title.textContent = entry.title;
    content.setAttribute('aria-busy', 'true');
    const loading = document.createElement('p');
    loading.className = 'legal-dialog-status';
    loading.setAttribute('role', 'status');
    loading.textContent = 'Cargando documento…';
    content.replaceChildren(loading);
    content.scrollTop = 0;
    try {
      const source = await loadDocument(entry);
      if (request !== revision || !dialog.open) return;
      const documentBody = document.createElement('div');
      documentBody.className = 'legal-document';
      for (const child of source.children) {
        // Reuse the main text, omitting the standalone title and scripts.
        if (child.matches('h1, .legal-eyebrow, script')) continue;
        const copy = document.importNode(child, true);
        copy.querySelectorAll('script').forEach(script => script.remove());
        copy.querySelectorAll('a[href]').forEach(link => {
          if (new URL(link.href, document.baseURI).origin !== window.location.origin) {
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.setAttribute('aria-label', `${link.textContent} (nueva pestaña)`);
          }
        });
        documentBody.append(copy);
      }
      content.replaceChildren(documentBody);
      content.removeAttribute('aria-busy');
      content.scrollTop = 0;
      title.focus({ preventScroll: true });
      if (entry.hash) scrollToSection(entry.hash);
    } catch {
      if (request !== revision || !dialog.open) return;
      content.removeAttribute('aria-busy');
      const message = document.createElement('p');
      message.className = 'legal-dialog-status';
      message.setAttribute('role', 'alert');
      message.textContent = 'No se pudo cargar el documento. Puedes reintentarlo o cerrar esta ventana.';
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'legal-dialog-retry';
      retry.textContent = 'Reintentar';
      retry.addEventListener('click', () => showDocument(entry));
      content.replaceChildren(message, retry);
      title.focus({ preventScroll: true });
    }
  }

  function open(entry, trigger = document.activeElement) {
    if (!canOpen() || typeof HTMLDialogElement === 'undefined' || !HTMLDialogElement.prototype.showModal) return false;
    ensureDialog();
    if (!dialog.open) {
      opener = trigger;
      restoreFocus = true;
      title.textContent = entry.title;
      dialog.showModal();
      document.documentElement.classList.add('legal-dialog-open');
    }
    showDocument(entry);
    return true;
  }

  function close({ restore = true } = {}) {
    if (!dialog?.open) return;
    restoreFocus = restore;
    revision++;
    dialog.close();
  }

  document.addEventListener('click', event => {
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !canOpen()) return;
    const href = link.getAttribute('href');
    if (dialog?.open && content.contains(link) && href.startsWith('#')) {
      event.preventDefault();
      scrollToSection(href);
      return;
    }
    const entry = legalTarget(link.href);
    if (!entry) return;
    if (typeof HTMLDialogElement === 'undefined' || !HTMLDialogElement.prototype.showModal) return;
    if (dialog?.open && content.contains(link) && activeDocument === entry.file && entry.hash) {
      event.preventDefault();
      scrollToSection(entry.hash);
      return;
    }
    if (embedded) {
      // The parent owns the top-level popup so it cannot be clipped by Auth's iframe.
      event.preventDefault();
      window.parent.postMessage({ type: 'menuki-legal-open', document: entry.file, hash: entry.hash }, window.location.origin);
    } else if (open(entry, link)) {
      event.preventDefault();
    }
  });

  if (authFrame) window.addEventListener('message', event => {
    if (event.origin !== window.location.origin || event.source !== authFrame.contentWindow || event.data?.type !== 'menuki-legal-open') return;
    const entry = DOCUMENTS.get(event.data.document);
    // Only the currently open Auth dialog may request one of the four local documents.
    if (!entry || !authFrame.closest('dialog')?.open) return;
    const hash = typeof event.data.hash === 'string' && event.data.hash.startsWith('#') ? event.data.hash : '';
    open({ ...entry, hash }, authFrame.contentDocument?.activeElement || authFrame);
  });

  return { close };
}
