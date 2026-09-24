-- The legacy metadata migration turned `.versions` into folder rows on every
-- boot. A personal folder's path is its UUID, and the app owns `.versions` at
-- a volume root, so nothing a user made is on these paths.
DELETE FROM `folders` WHERE `path` = '.versions' OR substr(`path`, 1, 10) = '.versions/';
