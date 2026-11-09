import { computeScrollTop, ensureVisible } from '../../src/ui/scroll.js';

const base = { viewTop: 100, viewBottom: 900, scrollTop: 0, margin: 20 };

describe('computeScrollTop', () => {
  test('does nothing when the element is already visible', () => {
    expect(computeScrollTop({ ...base, elTop: 300, elBottom: 400 })).toBe(0);
  });

  test('scrolls down just enough to reveal an element below the view', () => {
    expect(computeScrollTop({ ...base, scrollTop: 50, elTop: 880, elBottom: 980 })).toBe(50 + 100);
  });

  test('scrolls up to reveal an element above the view', () => {
    expect(computeScrollTop({ ...base, scrollTop: 400, elTop: 60, elBottom: 160 })).toBe(400 - 60);
  });

  test('an element taller than the view is aligned to its top', () => {
    expect(computeScrollTop({ ...base, scrollTop: 0, elTop: 300, elBottom: 1500 })).toBe(300 - 20 - 100);
  });

  test('center: true scrolls to center the element vertically in the view', () => {
    // view is 100 to 900 (height 800). element is 600 to 700 (height 100).
    // target top is viewTop + (800 - 100) / 2 = 100 + 350 = 450.
    // scrollTop should be scrollTop + (600 - 450) = 150.
    expect(computeScrollTop({ ...base, elTop: 600, elBottom: 700, center: true })).toBe(150);
  });
});

describe('ensureVisible', () => {
  function makePage(rects, scrollTop = 0) {
    const page = document.createElement('section');
    page.className = 'page';
    const el = document.createElement('div');
    page.appendChild(el);
    page.scrollTop = scrollTop;
    page.getBoundingClientRect = () => rects.page;
    el.getBoundingClientRect = () => rects.el;
    return { page, el };
  }

  test('writes the computed scrollTop on the closest .page', () => {
    const { page, el } = makePage({ page: { top: 0, bottom: 800 }, el: { top: 900, bottom: 1000 } });
    ensureVisible(el, { margin: 0 });
    expect(page.scrollTop).toBe(200);
  });

  test('center: true centers the element vertically on the page', () => {
    const { page, el } = makePage({ page: { top: 0, bottom: 800 }, el: { top: 700, bottom: 800 } });
    ensureVisible(el, { center: true });
    // viewHeight = 800, elHeight = 100. target top = (800 - 100)/2 = 350.
    // scroll offset = 700 - 350 = 350.
    expect(page.scrollTop).toBe(350);
  });

  test('first: true goes back to the top so the heading shows', () => {
    const { page, el } = makePage({ page: { top: 0, bottom: 800 }, el: { top: 10, bottom: 20 } }, 300);
    ensureVisible(el, { first: true });
    expect(page.scrollTop).toBe(0);
  });

  test('elements outside a page are ignored', () => {
    expect(() => ensureVisible(document.createElement('div'))).not.toThrow();
  });
});
