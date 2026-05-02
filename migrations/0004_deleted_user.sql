-- Ghost user used as the anonymization target when a user deletes their account.
-- Status 'banned' guarantees the row can never log in. The password_hash is a
-- non-bcrypt sentinel so verifyPassword always returns false.
INSERT INTO users (email, password_hash, display_name, role, status, created_at)
VALUES ('deleted-user@belisa.local', '!deleted!', 'Utilisateur supprimé', 'user', 'banned', unixepoch());
