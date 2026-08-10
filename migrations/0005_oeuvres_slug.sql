-- Give each oeuvre its own addressable page at /oeuvres/:slug.
--
-- Additive migration: both columns are nullable, so the currently deployed code
-- ignores them and this can be applied before the code that reads them.
--
-- The backfill folds accents and punctuation inline because SQLite has no regex
-- and its lower() is ASCII-only. The expressions are generated, not hand-written,
-- and split across three passes because SQLite caps expression nesting at 100.

ALTER TABLE oeuvres ADD COLUMN slug TEXT;
ALTER TABLE oeuvres ADD COLUMN isbn TEXT;

-- Pass 1: fold accented characters (both cases), then lowercase.
UPDATE oeuvres SET slug = lower(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(title, 'À', 'a'), 'Á', 'a'), 'Â', 'a'), 'Ã', 'a'), 'Ä', 'a'), 'Å', 'a'), 'à', 'a'), 'á', 'a'), 'â', 'a'), 'ã', 'a'), 'ä', 'a'), 'å', 'a'), 'È', 'e'), 'É', 'e'), 'Ê', 'e'), 'Ë', 'e'), 'è', 'e'), 'é', 'e'), 'ê', 'e'), 'ë', 'e'), 'Ì', 'i'), 'Í', 'i'), 'Î', 'i'), 'Ï', 'i'), 'ì', 'i'), 'í', 'i'), 'î', 'i'), 'ï', 'i'), 'Ò', 'o'), 'Ó', 'o'), 'Ô', 'o'), 'Õ', 'o'), 'Ö', 'o'), 'ò', 'o'), 'ó', 'o'), 'ô', 'o'), 'õ', 'o'), 'ö', 'o'), 'Ù', 'u'), 'Ú', 'u'), 'Û', 'u'), 'Ü', 'u'), 'ù', 'u'), 'ú', 'u'), 'û', 'u'), 'ü', 'u'), 'Ý', 'y'), 'ý', 'y'), 'ÿ', 'y'), 'Ç', 'c'), 'ç', 'c'), 'Ñ', 'n'), 'ñ', 'n'), 'Œ', 'oe'), 'œ', 'oe'), 'Æ', 'ae'), 'æ', 'ae'), 'ß', 'ss'));

-- Pass 2: every non-alphanumeric character becomes a hyphen.
UPDATE oeuvres SET slug = replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(slug, ' ', '-'), '	', '-'), '
', '-'), '''', '-'), '’', '-'), '‘', '-'), '"', '-'), '“', '-'), '”', '-'), '«', '-'), '»', '-'), ',', '-'), '.', '-'), ':', '-'), ';', '-'), '!', '-'), '?', '-'), '(', '-'), ')', '-'), '[', '-'), ']', '-'), '{', '-'), '}', '-'), '/', '-'), '\', '-'), '|', '-'), '&', '-'), '+', '-'), '*', '-'), '#', '-'), '@', '-'), '%', '-'), '$', '-'), '=', '-'), '<', '-'), '>', '-'), '~', '-'), '^', '-'), '`', '-'), '_', '-'), '–', '-'), '—', '-'), '…', '-');

-- Pass 3: collapse hyphen runs and trim the edges.
UPDATE oeuvres SET slug = trim(replace(replace(replace(replace(replace(slug, '--', '-'), '--', '-'), '--', '-'), '--', '-'), '--', '-'), '-');

-- Titles that reduce to nothing (emoji-only, punctuation-only) still need a slug.
UPDATE oeuvres SET slug = 'oeuvre-' || id WHERE slug IS NULL OR slug = '';

-- Two works can share a title; disambiguate the later rows before the unique index.
UPDATE oeuvres SET slug = slug || '-' || id
WHERE id NOT IN (SELECT MIN(id) FROM oeuvres GROUP BY slug);

CREATE UNIQUE INDEX idx_oeuvres_slug ON oeuvres(slug);
