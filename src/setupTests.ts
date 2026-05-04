// Minimal localStorage polyfill for Vitest/node environment
class SimpleStorage {
  private store: Record<string, string> = {};
  clear() {
    this.store = {};
  }
  getItem(key: string) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }
  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }
  removeItem(key: string) {
    delete this.store[key];
  }
}

(globalThis as any).localStorage = new SimpleStorage();

// Ensure a DOM exists when tests run in Node environment
import { JSDOM } from 'jsdom'
if (typeof (globalThis as any).document === 'undefined') {
  const dom = new JSDOM('<!doctype html><html><body></body></html>')
  ;(globalThis as any).window = dom.window
  ;(globalThis as any).document = dom.window.document
  try {
    Object.defineProperty(globalThis, 'navigator', {
      value: dom.window.navigator,
      configurable: true,
      writable: true,
      enumerable: true,
    })
  } catch (e) {
    // If navigator is a read-only getter on this environment, skip assigning it.
  }
}

// minimal alert/confirm polyfills used by some UI code
(globalThis as any).alert = (msg?: any) => {}
(globalThis as any).confirm = (msg?: any) => true

export {};
