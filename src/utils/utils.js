import pkg from '../../package.json';
let blur, focus, panicListener;

export const resetInstance = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => registrations.forEach((reg) => reg.unregister()));
  }
  if ('caches' in window) {
    caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
  }
  localStorage.clear();
  sessionStorage.clear();

  if ('indexedDB' in window) {
    ['__op', '$scramjet'].forEach((db) => {
      const req = indexedDB.deleteDatabase(db);
      req.onerror = () => console.error(`Failed to clear ${db}`);
    });
  }
  document.cookie
    .split(';')
    .forEach(
      (c) => (document.cookie = `${c.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`),
    );

  location.href = '/';
};

export const ckOff = () => {
  const op = JSON.parse(localStorage.options || '{}');
  import('./config.js').then(({ meta }) => {
    const { tabName: t, tabIcon: i } = op;
    const { tabName: ogName, tabIcon: ogIcon } = meta[0].value;
    const set = (title, icon) => {
      document.title = title;
      document.querySelector("link[rel~='icon']").href = icon;
    };
    blur && window.removeEventListener('blur', blur);
    focus && window.removeEventListener('focus', focus);
    if (op.clkOff) {
      set(t, i);
      blur = () => {
        // use new op for latest value
        const op = JSON.parse(localStorage.options || '{}');
        set(op.tabName || ogName, op.tabIcon || ogIcon);
      };
      focus = () => set(ogName, ogIcon);
      window.addEventListener('blur', blur);
      window.addEventListener('focus', focus);
      set(ogName, ogIcon);
    } else {
      set(t || ogName, i || ogIcon);
      blur = focus = null;
    }
  });
};

export const panic = () => {
  const op = JSON.parse(localStorage.options || '{}');
  const panicConfig = op.panic;
  if (panicListener) {
    window.removeEventListener('keydown', panicListener);
    panicListener = null;
  }
  if (panicConfig?.key && panicConfig?.url && !!op.panicToggleEnabled) {
    panicListener = (e) => {
      const combo = [];
      if (e.ctrlKey) combo.push('Ctrl');
      if (e.altKey) combo.push('Alt');
      if (e.shiftKey) combo.push('Shift');
      if (e.metaKey) combo.push('Meta');
      combo.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);

      const pressed = combo.join('+');
      if (pressed === panicConfig.key) {
        e.preventDefault();
        window.location.href = panicConfig.url;
      }
    };

    window.addEventListener('keydown', panicListener);
  }
};

export const check = (() => {
  const op = JSON.parse(localStorage.options || '{}');
  !op.version && localStorage.setItem('options', JSON.stringify({ version: pkg.version }));
  if (op.beforeUnload) {
    window.addEventListener('beforeunload', (e) => {
      e.preventDefault();
      e.returnValue = '';
    });
  }
  if (window.top === window.self) {
    const w = open('about:blank');
    if (!w || w.closed) {
      alert('Please enable popups to continue.');
      window.location.href = 'about:blank';
    } else {
      const d = w.document,
        f = d.createElement('iframe');
      Object.assign(f, { src: location.href });
      Object.assign(f.style, { width: '100%', height: '100%', border: 'none' });
      Object.assign(d.body.style, { margin: 0, height: '100vh' });
      d.documentElement.style.height = '100%';
      d.body.append(f);
      w.document.title = "Google Classroom";
      const favicon = newWindow.document.createElement('link');
      favicon.rel = 'icon';
      favicon.type = 'image/png'; // Specify the type of the favicon
      favicon.href = 'https://example.com/favicon.png';
      location.href = 'https://classroom.google.com';
      w.document.head.appendChild(favicon);
    }
    history.replaceState(null, '', '/');
  }

  ckOff();
  panic();
})();
