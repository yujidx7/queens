export type Locale = 'ja' | 'en';

let locale: Locale = 'ja';

const strings: Record<Locale, Record<string, string>> = {
  ja: {
    title: 'Queens',
    newPuzzle: 'New Puzzle',
    generating: '生成中…',
    continue: 'Continue',
    clearSave: 'Clear Save',
    undo: 'Undo',
    redo: 'Redo',
    hint: 'Hint',
    settings: 'Settings',
    stats: 'Stats',
    share: 'Share',
    solved: 'クリア！',
    shareCopied: '共有URLをクリップボードにコピーしました',
    replay: 'リプレイ',
    home: 'Home',
  },
  en: {
    title: 'Queens',
    newPuzzle: 'New Puzzle',
    generating: 'Generating…',
    continue: 'Continue',
    clearSave: 'Clear Save',
    undo: 'Undo',
    redo: 'Redo',
    hint: 'Hint',
    settings: 'Settings',
    stats: 'Stats',
    share: 'Share',
    solved: 'Cleared!',
    shareCopied: 'Share URL copied to clipboard',
    replay: 'Replay',
    home: 'Home',
  },
};

export function t(key: string) {
  return strings[locale][key] ?? key;
}

export function setLocale(l: Locale) {
  locale = l;
}

export function getLocale() {
  return locale;
}
