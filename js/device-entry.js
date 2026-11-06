(() => {
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && (navigator.platform === 'MacIntel' || Math.min(screen.width, screen.height) < 1100));
  if (mobile && !location.pathname.endsWith('/admin.html')) location.replace('admin.html');
  else if (!mobile && /(?:\/|\/index.html)$/.test(location.pathname)) location.replace('desktop.html');
})();