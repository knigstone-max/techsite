// UI: theme toggle (persisted), mobile menu, current-nav highlight. No dependencies.
(function () {
  var root = document.documentElement;
  var btn = document.querySelector('.theme-toggle');
  function setTheme(t) {
    root.dataset.theme = t;
    try { localStorage.setItem('theme', t); } catch (e) {}
    if (btn) btn.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
  }
  if (btn) {
    btn.setAttribute('aria-pressed', root.dataset.theme === 'dark' ? 'true' : 'false');
    btn.addEventListener('click', function () { setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'); });
  }
  // Follow OS changes only if the user never picked a theme.
  try {
    var mq = matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', function (e) { /* dark is the default; OS changes no longer switch themes */ });
  } catch (e) {}

  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); toggle.focus(); }
    });
  }
  var here = location.pathname.replace(/index\.html$/, '');
  document.querySelectorAll('.site-nav a, .cat-bar a').forEach(function (a) {
    if (a.pathname === here) a.setAttribute('aria-current', 'page');
  });
})();
