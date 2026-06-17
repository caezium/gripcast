CREATE TABLE IF NOT EXISTS contributions (
  id            TEXT PRIMARY KEY,
  track         TEXT,
  lat           REAL,
  lon           REAL,
  klass         TEXT,
  handle        TEXT,
  session_date  TEXT,
  session_time  TEXT,
  n_laps        INTEGER,
  best_lap      REAL,
  laps_json     TEXT,
  file_key      TEXT,
  ua            TEXT,
  created_at    TEXT
);
CREATE INDEX IF NOT EXISTS idx_contrib_track   ON contributions(track);
CREATE INDEX IF NOT EXISTS idx_contrib_created ON contributions(created_at);
