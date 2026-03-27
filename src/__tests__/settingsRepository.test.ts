import '../setupTests';
import { describe, it, expect, beforeEach } from 'vitest';
import { loadSettings, saveSettings, defaultSettings } from '../core/settingsRepository';

describe('settingsRepository', () => {
  beforeEach(() => localStorage.clear());

  it('loads default when none saved', () => {
    const s = loadSettings();
    expect(s).toEqual(defaultSettings);
  });

  it('saves and loads settings', () => {
    const s = { ...defaultSettings, sound: true };
    saveSettings(s);
    const loaded = loadSettings();
    expect(loaded.sound).toBe(true);
  });
});
