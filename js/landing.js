(() => {
  const root = document.documentElement;
  const header = document.getElementById('siteHeader');
  const year = document.getElementById('currentYear');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  root.classList.add('has-js');

  if (year) year.textContent = String(new Date().getFullYear());

  const authDialog = document.getElementById('landingAuthDialog');
  const authFrame = document.getElementById('landingAuthFrame');
  const authClose = document.getElementById('landingAuthClose');
  let authOpener = null;
  let authNavigationStarted = false;
  let authFrameResizeObserver = null;

  const syncAuthDialogSize = () => {
    if (!authDialog?.open || !authFrame) return;
    let frameDocument;
    try {
      frameDocument = authFrame.contentDocument;
    } catch {
      return;
    }
    const shell = frameDocument?.querySelector('.auth-shell');
    const layout = frameDocument?.querySelector('.auth-layout');
    if (!shell || !layout) return;
    const contentHeight = layout.getBoundingClientRect().height;
    if (!contentHeight) return;
    const shellStyle = frameDocument.defaultView.getComputedStyle(shell);
    const verticalPadding = (parseFloat(shellStyle.paddingTop) || 0) + (parseFloat(shellStyle.paddingBottom) || 0);
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const availableHeight = Math.max(240, viewportHeight - 40);
    authFrame.style.height = `${Math.min(Math.ceil(contentHeight + verticalPadding), availableHeight)}px`;
  };

  authFrame?.addEventListener('load', () => {
    authFrameResizeObserver?.disconnect();
    const layout = authFrame.contentDocument?.querySelector('.auth-layout');
    if (layout && typeof ResizeObserver === 'function') {
      authFrameResizeObserver = new ResizeObserver(() => window.requestAnimationFrame(syncAuthDialogSize));
      authFrameResizeObserver.observe(layout);
    }
    window.requestAnimationFrame(syncAuthDialogSize);
  });
  window.addEventListener('resize', syncAuthDialogSize);
  window.visualViewport?.addEventListener('resize', syncAuthDialogSize);

  const openAuthDialog = (mode, opener = document.activeElement) => {
    const selectedMode = mode === 'signup' ? 'signup' : 'login';
    if (!authDialog || !authFrame || typeof authDialog.showModal !== 'function') {
      window.location.assign(selectedMode === 'signup' ? './menuki.html?auth=signup' : './menuki.html');
      return;
    }

    if (authDialog.open) return;
    authOpener = opener;
    authNavigationStarted = false;
    authFrame.style.height = '';
    authFrame.src = `./menuki.html?auth=${selectedMode}&auth_embed=1`;
    authDialog.showModal();
    document.documentElement.classList.add('auth-dialog-open');
    document.body.classList.add('auth-dialog-open');
  };

  authDialog?.addEventListener('click', (event) => {
    if (event.target === authDialog) authDialog.close();
  });
  authClose?.addEventListener('click', () => authDialog?.close());
  authDialog?.addEventListener('close', () => {
    authFrameResizeObserver?.disconnect();
    authFrameResizeObserver = null;
    authFrame?.setAttribute('src', 'about:blank');
    authFrame?.style.removeProperty('height');
    document.documentElement.classList.remove('auth-dialog-open');
    document.body.classList.remove('auth-dialog-open');
    if (!authNavigationStarted) authOpener?.focus();
    authOpener = null;
  });

  document.querySelectorAll('[data-auth-open]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      openAuthDialog(link.dataset.authOpen, link);
    });
  });

  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin || event.source !== authFrame?.contentWindow) return;
    if (event.data?.type !== 'menuki-authenticated' || !authDialog?.open || authNavigationStarted) return;
    authNavigationStarted = true;
    authDialog.close();
    window.location.assign('./menuki.html');
  });

  const requestedAuthMode = new URLSearchParams(window.location.search).get('auth');
  if (requestedAuthMode === 'login' || requestedAuthMode === 'signup') {
    const landingUrl = new URL(window.location.href);
    landingUrl.searchParams.delete('auth');
    window.history.replaceState(null, '', `${landingUrl.pathname}${landingUrl.search}${landingUrl.hash}`);
    window.requestAnimationFrame(() => openAuthDialog(requestedAuthMode, null));
  }

  const updateHeader = () => {
    header?.classList.toggle('is-scrolled', window.scrollY > 6);
  };
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const revealItems = document.querySelectorAll('[data-reveal]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -36px 0px' });
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  const track = document.querySelector('[data-feature-carousel]');
  if (track) {
    const controls = document.querySelector('[data-feature-carousel-controls]');
    const previous = document.querySelector('[data-feature-previous]');
    const next = document.querySelector('[data-feature-next]');
    const desktop = window.matchMedia('(min-width: 1051px)');
    const cards = [...track.querySelectorAll('.feature-card')];

    if (controls && previous && next && cards.length) {
      const updateButtons = () => {
        previous.disabled = !desktop.matches || track.scrollLeft <= 1;
        next.disabled = !desktop.matches || track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
      };

      const updateMode = () => {
        const isDesktop = desktop.matches;
        controls.hidden = !isDesktop;
        track.tabIndex = isDesktop ? 0 : -1;
        track.classList.toggle('is-enhanced', isDesktop);
        if (!isDesktop) track.scrollLeft = 0;
        updateButtons();
      };

      const scrollOneCard = (direction) => {
        const card = cards[0];
        const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 0;
        track.scrollBy({ left: direction * (card.getBoundingClientRect().width + gap), behavior: reduceMotion ? 'auto' : 'smooth' });
      };

      previous.addEventListener('click', () => scrollOneCard(-1));
      next.addEventListener('click', () => scrollOneCard(1));
      track.addEventListener('scroll', updateButtons, { passive: true });
      window.addEventListener('resize', updateButtons, { passive: true });
      desktop.addEventListener('change', updateMode);
      updateMode();
    }
  }

  const sampleMenus = [
    { breakfast: 'Yogur con fruta', lunch: 'Arroz con pollo', dinner: 'Merluza con verduras' },
    { breakfast: 'Tostada y tomate', lunch: 'Pasta con verduras', dinner: 'Tortilla de patata' },
    { breakfast: 'Avena con plátano', lunch: 'Lentejas caseras', dinner: 'Salmón con ensalada' },
    { breakfast: 'Yogur con granola', lunch: 'Pollo con patata', dinner: 'Crema de verduras' },
    { breakfast: 'Pan integral y huevo', lunch: 'Arroz con verduras', dinner: 'Merluza al horno' },
    { breakfast: 'Avena y frutos rojos', lunch: 'Garbanzos salteados', dinner: 'Pavo con calabacín' },
    { breakfast: 'Tostada con aguacate', lunch: 'Pasta con atún', dinner: 'Revuelto de champiñón' }
  ];
  const mealLabels = { breakfast: 'Desayuno', lunch: 'Comida', dinner: 'Cena' };
  const dayButtons = [...document.querySelectorAll('[data-demo-day]')];
  const sampleMealNodes = Object.keys(mealLabels).map((slot) => document.querySelector(`[data-demo-meal="${slot}"]`));

  dayButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const selectedDay = Number(button.dataset.demoDay);
      const meals = sampleMenus[selectedDay];
      if (!meals) return;
      dayButtons.forEach((dayButton) => dayButton.setAttribute('aria-pressed', String(dayButton === button)));
      Object.keys(mealLabels).forEach((slot, index) => {
        const mealNode = sampleMealNodes[index];
        if (!mealNode) return;
        const mealRow = mealNode.closest('.demo-meal');
        mealRow?.classList.add('is-changing');
        window.setTimeout(() => {
          mealNode.textContent = meals[slot];
          mealRow?.classList.remove('is-changing');
        }, reduceMotion ? 0 : 120);
      });
    });
  });

  document.querySelectorAll('[data-demo-check]').forEach((item) => {
    item.addEventListener('click', () => {
      const isChecked = item.getAttribute('aria-pressed') !== 'true';
      item.setAttribute('aria-pressed', String(isChecked));
      item.classList.toggle('is-checked', isChecked);
    });
  });
})();
