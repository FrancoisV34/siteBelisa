-- Editable SEO fields, so metadata is authored rather than always derived.
--
-- Additive and nullable throughout: the resolver falls back to excerpt /
-- description / cover image whenever a field is empty, so this migration can be
-- applied before the code that reads it.

ALTER TABLE posts ADD COLUMN meta_description TEXT;
ALTER TABLE posts ADD COLUMN og_image TEXT;
ALTER TABLE posts ADD COLUMN image_alt TEXT;

ALTER TABLE oeuvres ADD COLUMN meta_description TEXT;
ALTER TABLE oeuvres ADD COLUMN og_image TEXT;
ALTER TABLE oeuvres ADD COLUMN image_alt TEXT;
