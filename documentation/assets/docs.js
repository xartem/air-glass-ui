/*
 * Air Glass UI — Buyer documentation, progressive enhancement.
 * No framework, no build. The page is fully readable with JavaScript disabled;
 * this only adds nice-to-haves:
 *   1. Active-section highlighting in the sidebar table of contents.
 *   2. Smooth-scroll for TOC links (a fallback for browsers without CSS
 *      `scroll-behavior: smooth`).
 *   3. A "Print / Save as PDF" button that triggers window.print().
 */
(function () {
  'use strict';

  var tocLinks = Array.prototype.slice.call(
    document.querySelectorAll('.doc-toc a[href^="#"]')
  );
  if (!tocLinks.length) return;

  // Map each anchor id -> its TOC link for O(1) lookups on scroll.
  var linkById = {};
  var sections = [];
  tocLinks.forEach(function (link) {
    var id = link.getAttribute('href').slice(1);
    var section = document.getElementById(id);
    if (!section) return;
    linkById[id] = link;
    sections.push(section);
  });

  // 1. Active-section highlight via IntersectionObserver (falls back silently
  //    when unsupported — the docs are still perfectly usable).
  if ('IntersectionObserver' in window && sections.length) {
    var visible = {};
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          visible[entry.target.id] = entry.isIntersecting;
        });
        // Highlight the first section currently intersecting the viewport.
        for (var i = 0; i < sections.length; i++) {
          var id = sections[i].id;
          if (visible[id]) {
            setActive(id);
            break;
          }
        }
      },
      { rootMargin: '-10% 0px -80% 0px', threshold: 0 }
    );
    sections.forEach(function (section) { observer.observe(section); });
  }

  function setActive(id) {
    tocLinks.forEach(function (link) { link.classList.remove('is-active'); });
    if (linkById[id]) linkById[id].classList.add('is-active');
  }

  // 2. Smooth-scroll fallback + update the active link immediately on click.
  tocLinks.forEach(function (link) {
    link.addEventListener('click', function (event) {
      var id = link.getAttribute('href').slice(1);
      var target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', '#' + id);
      setActive(id);
    });
  });

  // 3. Wire any "Print / Save as PDF" buttons.
  Array.prototype.forEach.call(
    document.querySelectorAll('[data-doc-print]'),
    function (btn) {
      btn.addEventListener('click', function () { window.print(); });
    }
  );
})();
