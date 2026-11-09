/**
 * Pure scroll maths (all positions share one coordinate space, e.g. the viewport).
 * Returns the scrollTop that keeps [elTop, elBottom] inside [viewTop, viewBottom] with a margin.
 * When `center: true`, calculates scrollTop to center [elTop, elBottom] vertically in [viewTop, viewBottom].
 */
export function computeScrollTop({ elTop, elBottom, viewTop, viewBottom, scrollTop, margin = 0, center = false }) {
  const viewHeight = viewBottom - viewTop;
  const elHeight = elBottom - elTop;
  if (center) {
    if (elHeight + margin * 2 > viewHeight) return scrollTop + (elTop - margin - viewTop);
    const targetElTop = viewTop + (viewHeight - elHeight) / 2;
    return scrollTop + Math.round(elTop - targetElTop);
  }
  // Taller than the viewport: show its beginning.
  if (elHeight + margin * 2 > viewHeight) return scrollTop + (elTop - margin - viewTop);
  if (elTop - margin < viewTop) return scrollTop - (viewTop - (elTop - margin));
  if (elBottom + margin > viewBottom) return scrollTop + (elBottom + margin - viewBottom);
  return scrollTop;
}

/** Scrolls the closest `.page` so that `el` is fully visible. `first: true` also reveals the page heading. `center: true` centers the element vertically in the view. */
export function ensureVisible(el, { margin = 32, first = false, center = false } = {}) {
  const page = el && el.closest ? el.closest('.page') : null;
  if (!page) return;
  if (first) {
    page.scrollTop = 0;
    return;
  }
  const pageRect = page.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  // A sticky head (title + page number) covers the top of the viewport: keep the element below it.
  const sticky = page.querySelector('.sticky-head');
  const inset = sticky ? sticky.getBoundingClientRect().height : 0;
  const next = Math.max(
    0,
    computeScrollTop({
      elTop: rect.top,
      elBottom: rect.bottom,
      viewTop: pageRect.top + inset,
      viewBottom: pageRect.bottom,
      scrollTop: page.scrollTop,
      margin,
      center,
    }),
  );
  if (next !== page.scrollTop) page.scrollTop = next; // already in view: no write, no extra layout
}
