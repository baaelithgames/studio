// Particules dorées décoratives (désactivées si l'utilisateur réduit les animations).
(function () {
  var box = document.querySelector('.particles');
  if (!box || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (var i = 0; i < 25; i++) {
    var p = document.createElement('div');
    var s = Math.random() * 2 + 1;
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.width = p.style.height = s + 'px';
    p.style.animationDuration = Math.random() * 15 + 10 + 's';
    p.style.animationDelay = Math.random() * 10 + 's';
    box.appendChild(p);
  }
})();

// Retient la langue choisie quand le visiteur clique sur FR / EN.
document.querySelectorAll('a.lang').forEach(function (a) {
  a.addEventListener('click', function () {
    try { localStorage.setItem('lang', a.getAttribute('hreflang')); } catch (e) {}
  });
});
