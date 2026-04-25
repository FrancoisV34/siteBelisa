CREATE TABLE site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE home_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body_html TEXT NOT NULL,
  image_url TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'visible',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE home_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT NOT NULL,
  label TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE oeuvres (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  year INTEGER,
  technique TEXT,
  dimensions TEXT,
  description TEXT,
  image_url TEXT,
  book_url TEXT,
  ebook_url TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'visible',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_home_sections_position ON home_sections(position);
CREATE INDEX idx_home_stats_position ON home_stats(position);
CREATE INDEX idx_oeuvres_position ON oeuvres(position);

INSERT INTO site_settings (key, value, updated_at) VALUES
  ('home.hero_title',    'Belisa Wagner',                    unixepoch()),
  ('home.hero_subtitle', 'Artiste • Createur • Visionnaire', unixepoch());

INSERT INTO home_sections (title, body_html, image_url, position, status, created_at, updated_at)
VALUES ('À propos',
        '<p>(Texte à éditer depuis l''espace admin.)</p>',
        '/photo-belisa.jpg', 0, 'visible', unixepoch(), unixepoch());

INSERT INTO home_stats (number, label, position, created_at, updated_at) VALUES
  ('50+', 'Œuvres réalisées',     0, unixepoch(), unixepoch()),
  ('20+', 'Expositions',          1, unixepoch(), unixepoch()),
  ('15',  'Années d''expérience', 2, unixepoch(), unixepoch()),
  ('5',   'Prix et distinctions', 3, unixepoch(), unixepoch());
