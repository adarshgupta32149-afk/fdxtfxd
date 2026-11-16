/* Runs before the page paints: one section on screen at a time, chosen from the address
   (#cylinders, #order, …). If site.js never arrives, fall back to one long scrolling page. */
(function () {
  var views = ['top', 'range', 'cylinders', 'order', 'orders', 'build', 'process', 'industries', 'contact'];
  var want = location.hash.slice(1), root = document.documentElement;
  root.classList.add('slides');
  root.setAttribute('data-view', views.indexOf(want) > -1 ? want : 'top');
  addEventListener('load', function () { if (!window.automechReady) root.classList.remove('slides'); });
})();
