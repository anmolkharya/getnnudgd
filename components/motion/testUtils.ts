/**
 * Test-only helpers: jsdom ships neither IntersectionObserver nor matchMedia.
 * Import from tests only.
 */
import { vi } from "vitest";

type IOCallback = (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => void;

export class MockIntersectionObserver implements IntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = "0px";
  readonly thresholds: ReadonlyArray<number> = [0];
  readonly scrollMargin: string = "0px";
  readonly elements = new Set<Element>();
  private readonly callback: IOCallback;

  constructor(callback: IOCallback) {
    this.callback = callback;
    MockIntersectionObserver.instances.push(this);
  }

  observe(target: Element): void {
    this.elements.add(target);
  }
  unobserve(target: Element): void {
    this.elements.delete(target);
  }
  disconnect(): void {
    this.elements.clear();
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  /** Fire an intersection change for every observed element. */
  trigger(isIntersecting: boolean): void {
    const entries = [...this.elements].map(
      (target) =>
        ({
          target,
          isIntersecting,
          intersectionRatio: isIntersecting ? 1 : 0,
          time: 0,
          boundingClientRect: target.getBoundingClientRect(),
          intersectionRect: target.getBoundingClientRect(),
          rootBounds: null,
        }) satisfies IntersectionObserverEntry,
    );
    if (entries.length > 0) this.callback(entries, this);
  }

  static triggerAll(isIntersecting: boolean): void {
    for (const io of MockIntersectionObserver.instances) io.trigger(isIntersecting);
  }
}

export function installIntersectionObserver(): void {
  MockIntersectionObserver.instances = [];
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
}

/** Stub matchMedia so `(prefers-reduced-motion: reduce)` matches when `reduced` is true. */
export function installMatchMedia({ reduced = false, coarse = false } = {}): void {
  vi.stubGlobal("matchMedia", (query: string): MediaQueryList => {
    const matches =
      (reduced && query.includes("prefers-reduced-motion: reduce")) ||
      (coarse && query.includes("pointer: coarse"));
    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    };
  });
}
