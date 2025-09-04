-- api/db/query.sql

-- name: GetUserByEmail :one
SELECT * FROM users
WHERE email = $1 LIMIT 1;

-- name: GetUserById :one
SELECT * FROM users
WHERE id = $1 LIMIT 1;


-- name: CreateUser :one
INSERT INTO users (name, email, image)
VALUES ($1, $2, $3)
RETURNING *;

-- name: CreateSession :one
INSERT INTO sessions (id, user_id, csrf_token, expires_at)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetSessionWithUser :one
SELECT s.*, u.id as user_id, u.name as user_name, u.email as user_email FROM sessions s
JOIN users u ON s.user_id = u.id
WHERE s.id = $1 LIMIT 1;

-- name: DeleteSession :exec
DELETE FROM sessions
WHERE id = $1;
