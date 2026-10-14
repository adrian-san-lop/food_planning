(() => {
  const root = document.documentElement;
  const header = document.getElementById('siteHeader');
  const year = document.getElementById('currentYear');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  root.classList.add('has-js');

  if (year) year.textContent = String(new Date().getFullYear());

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
