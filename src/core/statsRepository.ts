export type ResultRecord = {
  timestamp: number;
  size: number;
  timeSeconds: number;
  hintsUsed: number;
  difficultyLabel?: string;
};

const KEY = 'queens_stats_v1';

export type StatsData = {
  totalClears: number;
  bestTimes: Record<string, number>;
  difficultyCounts: Record<string, number>;
  records: ResultRecord[];
};

export function loadStats(): StatsData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { totalClears: 0, bestTimes: {}, difficultyCounts: {}, records: [] };
    return JSON.parse(raw) as StatsData;
  } catch (e) {
    return { totalClears: 0, bestTimes: {}, difficultyCounts: {}, records: [] };
  }
}

export function saveStats(st: StatsData) {
  localStorage.setItem(KEY, JSON.stringify(st));
}

export function recordClear(record: ResultRecord) {
  const st = loadStats();
  st.totalClears = (st.totalClears || 0) + 1;
  st.records.unshift(record);
  const key = `${record.size}`;
  if (!st.bestTimes[key] || record.timeSeconds < st.bestTimes[key])
    st.bestTimes[key] = record.timeSeconds;
  if (record.difficultyLabel)
    st.difficultyCounts[record.difficultyLabel] =
      (st.difficultyCounts[record.difficultyLabel] || 0) + 1;
  saveStats(st);
}

export function clearStats() {
  localStorage.removeItem(KEY);
}
