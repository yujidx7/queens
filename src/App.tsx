import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { PuzzleDefinition, createEmptyState, PuzzleState } from './core/puzzle';
import { GameSessionController } from './core/gameSession';
import Board from './components/Board';
import { findHint } from './core/hintEngine';
import * as SaveRepo from './core/saveRepository';
import * as SettingsRepo from './core/settingsRepository';
import * as StatsRepo from './core/statsRepository';
import { encodeBase62FromString } from './utils/base62';
import { isSolved } from './core/puzzleValidator';
import { t, setLocale, getLocale } from './i18n';

const controller = new GameSessionController();

export default function App() {
  const [size] = useState(8);
  const [puzzle, setPuzzle] = useState<PuzzleDefinition | null>(null);
  const [state, setState] = useState<PuzzleState | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<PuzzleState[]>([]);
  const [hasSaved, setHasSaved] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [screen, setScreen] = useState<'home' | 'new' | 'game' | 'settings' | 'stats'>('home');
  const [settings, setSettings] = useState(SettingsRepo.loadSettings());
  const [locale, setLocaleState] = useState(getLocale());
  const [future, setFuture] = useState<PuzzleState[]>([]);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    setLocale(locale);
  }, [locale]);

  const newPuzzle = useCallback(async () => {
    setLoading(true);
    try {
      const p = await controller.generatePuzzle(size, 2000);
      setPuzzle(p);
      const s = createEmptyState(size);
      setState(s);
      setHistory([s]);
      setScreen('game');
    } catch (e) {
      console.error(e);
      alert('パズル生成に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [size]);

  useEffect(() => {
    // check saved session
    const s = SaveRepo.loadSession();
    setHasSaved(!!s);
  }, []);

  useEffect(() => {
    // save settings when changed
    SettingsRepo.saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    // autosave session when puzzle/state/history changes
    if (puzzle && state) {
      SaveRepo.saveSession(puzzle, state, history, future);
      setHasSaved(true);
    }
  }, [puzzle, state, history, future]);

  const pushHistory = useCallback((s: PuzzleState) => {
    setHistory((h) => {
      const nh = [...h, s];
      const MAX = 200;
      if (nh.length > MAX) return nh.slice(nh.length - MAX);
      return nh;
    });
    setFuture([]);
    // immediate persist
    if (puzzle) SaveRepo.saveSession(puzzle, s, undefined, []);
  }, [puzzle]);

  const toggleCell = useCallback(
    (pos: { r: number; c: number }) => {
      if (!puzzle) return;
      setState((curState) => {
        if (!curState) return curState;
        const s = JSON.parse(JSON.stringify(curState)) as PuzzleState;
        const cur = s.cells[pos.r][pos.c];
        const next = cur === 'Empty' ? 'Cross' : cur === 'Cross' ? 'Queen' : 'Empty';
        s.cells[pos.r][pos.c] = next;
        // push history and persist
        pushHistory(s);
        // check solved
        if (isSolved(s, puzzle)) {
          StatsRepo.recordClear({
            timestamp: Date.now(),
            size: puzzle.size,
            timeSeconds: s.elapsedSeconds,
            hintsUsed: s.hintUsedCount,
            difficultyLabel: puzzle.difficulty?.label,
          });
          setShowResult(true);
        }
        return s;
      });
    },
    [puzzle, pushHistory],
  );

  function undo() {
    setHistory((h) => {
      if (h.length <= 1) return h;
      const cur = h[h.length - 1];
      const nh = h.slice(0, h.length - 1);
      setState(nh[nh.length - 1]);
      setFuture((f) => [cur, ...f]);
      // persist
      if (puzzle) SaveRepo.saveSession(puzzle, nh[nh.length - 1], nh, undefined);
      return nh;
    });
  }

  function redo() {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      setState(next);
      setHistory((h) => [...h, next]);
      if (puzzle) SaveRepo.saveSession(puzzle, next, undefined, f.slice(1));
      return f.slice(1);
    });
  }

  function restart() {
    if (!puzzle) return;
    const s = createEmptyState(puzzle.size);
    setState(s);
    setHistory([s]);
    setFuture([]);
    setScreen('game');
    SaveRepo.saveSession(puzzle, s, [s], []);
  }

  function continueSaved() {
    const s = SaveRepo.loadSession();
    if (!s) return alert('セーブが見つかりません');
    setPuzzle(s.def);
    setState(s.state);
    setHistory(s.history && s.history.length ? s.history : [s.state]);
    setFuture(s.future ?? []);
    setScreen('game');
  }

  function clearSave() {
    SaveRepo.clearSession();
    setHasSaved(false);
  }

  function openSettings() {
    setShowSettings(true);
  }
  function openStats() {
    setShowStats(true);
  }

  function goHome() {
    setScreen('home');
  }
  function goNew() {
    setScreen('new');
  }
  function goGame() {
    setScreen('game');
  }
  function goSettings() {
    setScreen('settings');
  }
  function goStats() {
    setScreen('stats');
  }

  function sharePuzzle() {
    if (!puzzle) return alert('共有するパズルがありません');
    const payload = JSON.stringify({
      size: puzzle.size,
      regions: puzzle.regions,
      solution: puzzle.solution,
      seed: puzzle.seed,
    });
    const code = encodeBase62FromString(payload);
    const url = `${location.origin}${location.pathname}?p=${code}`;
    navigator.clipboard?.writeText(url);
    alert(t('shareCopied') + '\n' + url);
  }

  const hint = useMemo(() => {
    if (!puzzle || !state) return null;
    return findHint(puzzle, state);
  }, [puzzle, state]);

  // timer: increment elapsedSeconds when game in progress
  useEffect(() => {
    if (!state || showResult) return;
    const id = setInterval(() => {
      setState((s) => {
        if (!s) return s;
        return { ...s, elapsedSeconds: s.elapsedSeconds + 1 };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [state, showResult]);

  return (
    <div className="app-root">
      <header>
        <h1>Queens</h1>
      </header>
      <main>
        <nav style={{ marginBottom: 12 }}>
          <button onClick={goHome}>Home</button>
          <button onClick={goNew}>New</button>
          <button onClick={goGame} disabled={!puzzle}>
            Game
          </button>
          <button onClick={goSettings}>Settings</button>
          <button onClick={goStats}>Stats</button>
        </nav>

        {screen === 'home' && (
          <div>
            <h2>Home</h2>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button onClick={newPuzzle} disabled={loading}>
                {loading ? t('generating') : `${t('newPuzzle')} (${size}x${size})`}
              </button>
              <button onClick={continueSaved} disabled={!hasSaved}>
                {t('continue')}
              </button>
              <button onClick={clearSave} disabled={!hasSaved}>
                {t('clearSave')}
              </button>
            </div>
          </div>
        )}

        {screen === 'new' && (
          <div>
            <h2>New Game</h2>
            <div>
              <label>Size: </label>
              <select
                value={size}
                onChange={(e) => {
                  /* size fixed for now */
                }}
              >
                <option value={size}>
                  {size}x{size}
                </option>
              </select>
            </div>
            <div style={{ marginTop: 8 }}>
              <button onClick={newPuzzle}>Start</button>
            </div>
          </div>
        )}

        {screen === 'game' &&
          (puzzle && state ? (
            <div>
              <div style={{ marginBottom: 8 }}>
                Difficulty: {puzzle.difficulty?.label} ★{puzzle.difficulty?.stars}
              </div>
              <Board state={state} onToggle={toggleCell} regions={puzzle.regions} />
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <button onClick={undo} disabled={history.length <= 1}>
                  {t('undo')}
                </button>
                <button onClick={redo} disabled={future.length === 0}>
                  {t('redo')}
                </button>
                <button onClick={restart} disabled={!puzzle}>
                  Restart
                </button>
                <button onClick={openSettings}>{t('settings')}</button>
                <button onClick={openStats}>{t('stats')}</button>
                <button onClick={sharePuzzle} disabled={!puzzle}>
                  {t('share')}
                </button>
                <button
                  onClick={() => {
                    if (hint) alert(hint.description);
                  }}
                  disabled={!hint}
                >
                  {t('hint')}
                </button>
              </div>

              {showResult && (
                <div
                  style={{
                    position: 'fixed',
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div style={{ background: 'white', padding: 16, borderRadius: 6, minWidth: 280 }}>
                    <h2>{t('solved')}</h2>
                    <div>Time: {state.elapsedSeconds}s</div>
                    <div>Hints used: {state.hintUsedCount}</div>
                    <div>
                      Difficulty: {puzzle.difficulty?.label} ★{puzzle.difficulty?.stars}
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => {
                          restart();
                          setShowResult(false);
                        }}
                      >
                        {t('replay') || 'Replay'}
                      </button>
                      <button
                        onClick={() => {
                          newPuzzle();
                          setShowResult(false);
                        }}
                      >
                        {t('newPuzzle')}
                      </button>
                      <button
                        onClick={() => {
                          setPuzzle(null);
                          setState(null);
                          setHistory([]);
                          setShowResult(false);
                        }}
                      >
                        {t('home') || 'Home'}
                      </button>
                      <button
                        onClick={() => {
                          StatsRepo.recordClear({
                            timestamp: Date.now(),
                            size: puzzle.size,
                            timeSeconds: state.elapsedSeconds,
                            hintsUsed: state.hintUsedCount,
                            difficultyLabel: puzzle.difficulty?.label,
                          });
                          alert('Result saved');
                        }}
                      >
                        Save Result
                      </button>
                      <button
                        onClick={() => {
                          const payload = JSON.stringify({
                            size: puzzle.size,
                            regions: puzzle.regions,
                            solution: puzzle.solution,
                            seed: puzzle.seed,
                          });
                          const code = encodeBase62FromString(payload);
                          const url = `${location.origin}${location.pathname}?p=${code}`;
                          navigator.clipboard?.writeText(url);
                          alert(t('shareCopied') + '\n' + url);
                        }}
                      >
                        {t('share')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showSettings && (
                <div style={{ marginTop: 8, padding: 8, border: '1px solid #ddd' }}>
                  <h3>{t('settings')}</h3>
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.showDifficultyEstimate}
                      onChange={(e) =>
                        setSettings({ ...settings, showDifficultyEstimate: e.target.checked })
                      }
                    />{' '}
                    Show Difficulty
                  </label>
                  <br />
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.autoCrossAssist}
                      onChange={(e) =>
                        setSettings({ ...settings, autoCrossAssist: e.target.checked })
                      }
                    />{' '}
                    Auto Cross Assist
                  </label>
                  <br />
                  <div>
                    <label>Language: </label>
                    <select value={locale} onChange={(e) => setLocaleState(e.target.value as any)}>
                      <option value="ja">日本語</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <br />
                  <button onClick={() => setShowSettings(false)}>Close</button>
                </div>
              )}

              {showStats && (
                <div style={{ marginTop: 8, padding: 8, border: '1px solid #ddd' }}>
                  <h3>Stats</h3>
                  <pre>{JSON.stringify(StatsRepo.loadStats(), null, 2)}</pre>
                  <button
                    onClick={() => {
                      StatsRepo.clearStats();
                      alert('Stats cleared');
                    }}
                  >
                    Clear Stats
                  </button>
                  <button onClick={() => setShowStats(false)}>Close</button>
                </div>
              )}
            </div>
          ) : (
            <div>No puzzle loaded. Create a new one.</div>
          ))}

        {screen === 'settings' && (
          <div>
            <h2>Settings</h2>
            <div style={{ marginTop: 8 }}>
              <label>
                <input
                  type="checkbox"
                  checked={settings.showDifficultyEstimate}
                  onChange={(e) =>
                    setSettings({ ...settings, showDifficultyEstimate: e.target.checked })
                  }
                />{' '}
                Show Difficulty
              </label>
            </div>
          </div>
        )}

        {screen === 'stats' && (
          <div>
            <h2>Stats</h2>
            <pre>{JSON.stringify(StatsRepo.loadStats(), null, 2)}</pre>
          </div>
        )}
      </main>
    </div>
  );
}
