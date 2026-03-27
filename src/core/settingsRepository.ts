export type SettingsData = {
  showDifficultyEstimate: boolean;
  autoCrossAssist: boolean;
  haptics: boolean;
  sound: boolean;
};

const KEY = 'queens_settings_v1';

export const defaultSettings: SettingsData = {
  showDifficultyEstimate: true,
  autoCrossAssist: true,
  haptics: false,
  sound: false,
};

export function loadSettings(): SettingsData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaultSettings };
    return JSON.parse(raw) as SettingsData;
  } catch (e) {
    return { ...defaultSettings };
  }
}

export function saveSettings(s: SettingsData) {
  localStorage.setItem(KEY, JSON.stringify(s));
}
