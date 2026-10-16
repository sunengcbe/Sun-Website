/* Show clean addresses: /about instead of /about.html, / instead of /index.html.
   Only changes what the address bar shows; the page is not reloaded. */
(function () {
  var p = location.pathname;
  if (!/\.html$/.test(p) || !window.history || !history.replaceState) return;
  var clean = p.replace(/index\.html$/, "").replace(/\.html$/, "");
  history.replaceState(history.state, "", clean + location.search + location.hash);
})();
