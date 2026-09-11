(() => {
  const key = 'portfolio-appearance';
  const root = document.documentElement;
  let preference = 'system';
  try {
    const saved = localStorage.getItem(key);
    if (saved === 'light' || saved === 'dark') preference = saved;
  } catch {}

  function apply() {
    if (preference === 'system') delete root.dataset.theme;
    else root.dataset.theme = preference;
  }
  apply();

  document.addEventListener('DOMContentLoaded', () => {
    const control = document.querySelector('#appearance');
    control.value = preference;
    control.addEventListener('change', () => {
      preference = control.value;
      apply();
      try {
        if (preference === 'system') localStorage.removeItem(key);
        else localStorage.setItem(key, preference);
      } catch {}
    });
  }, { once: true });
})();
