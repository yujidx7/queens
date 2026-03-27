import React from 'react';

export default function SettingsScreen(props: {
  settings: any;
  setSettings: (s: any) => void;
  back: () => void;
}) {
  return (
    <div>
      <h2>Settings</h2>
      <div>
        <label>
          <input
            type="checkbox"
            checked={props.settings.showDifficultyEstimate}
            onChange={(e) =>
              props.setSettings({ ...props.settings, showDifficultyEstimate: e.target.checked })
            }
          />{' '}
          Show Difficulty
        </label>
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={props.back}>Close</button>
      </div>
    </div>
  );
}
