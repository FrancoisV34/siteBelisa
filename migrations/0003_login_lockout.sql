-- Track failed login attempts per account for progressive lockout.
-- login_fails: count of consecutive failures since last successful login.
-- locked_until: unix epoch seconds; if > now(), account login is rejected.

ALTER TABLE users ADD COLUMN login_fails INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until INTEGER;
