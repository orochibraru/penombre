package services

import (
	"context"
	"net/http"
	"os"
	"path"
	"strings"
	"time"

	db "opendrive/api/db/sqlc"
	"opendrive/api/logger"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type contextKey string

const userContextKey = contextKey("user")

func GetContextKey() contextKey {
	return userContextKey
}

func cookieSecure() bool {
	return os.Getenv("ENV") == "prod"
}

func SetErrorCookie(w http.ResponseWriter, err string) {
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_error",
		Value:    err,
		HttpOnly: true,
		MaxAge:   3600,
		Path:     "/",
		Secure:   cookieSecure(),
		SameSite: http.SameSiteLaxMode,
	})
}

// setSessionCookies creates a new session in the database for the given user ID,
// then sets a secure, HttpOnly session cookie and a client-accessible CSRF cookie.
func SetSessionCookies(w http.ResponseWriter, userID uuid.UUID, database *Database) {
	sessionToken := uuid.New()
	csrfToken := uuid.NewString()
	expiresAt := time.Now().Add(24 * 7 * time.Hour) // 7-day session

	_, err := database.CreateSession(context.Background(), db.CreateSessionParams{
		ID:        pgtype.UUID{Bytes: sessionToken, Valid: true},
		UserID:    pgtype.UUID{Bytes: userID, Valid: true},
		CsrfToken: csrfToken,
		ExpiresAt: pgtype.Timestamptz{Time: expiresAt, Valid: true},
	})

	if err != nil {
		return
	}

	// Set the HttpOnly session cookie for security
	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    sessionToken.String(),
		Expires:  expiresAt,
		HttpOnly: true,
		Path:     "/",
		Secure:   cookieSecure(),
		SameSite: http.SameSiteLaxMode,
	})

	// Set the CSRF cookie that the client-side JavaScript can read
	http.SetCookie(w, &http.Cookie{
		Name:     "csrf_token",
		Value:    csrfToken,
		Expires:  expiresAt,
		Path:     "/",
		Secure:   cookieSecure(),
		SameSite: http.SameSiteLaxMode,
	})
}

// ApiAuthMiddleware is a Chi middleware that protects API endpoints.
// It verifies the session token and CSRF token for every request.
func ApiAuthMiddleware(database *Database) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Define paths that are always allowed, regardless of authentication status
			allowlist := []string{
				"/api/v1/healthz",
				"/api/v1/auth/sign-out",
				"/api/v1/auth/oauth/providers",
				"/api/v1/auth/oauth/pocketid/login",
				"/api/v1/auth/oauth/pocketid/callback",
				"/p",
			}

			// Check if the request path is explicitly in the allowlist
			for _, path := range allowlist {
				match := strings.HasPrefix(r.URL.Path, path)
				if match {
					next.ServeHTTP(w, r)
					return
				}
			}

			sessionCookie, err := r.Cookie("session_token")
			if err != nil {
				http.Error(w, "Unauthorized: No session token", http.StatusUnauthorized)
				return
			}

			csrfHeader := r.Header.Get("X-CSRF-Token")
			if csrfHeader == "" {
				logger.Error("Invalid CSRF Token")
				http.Error(w, "Forbidden: Missing CSRF token header", http.StatusForbidden)
				return
			}

			sessionID, err := uuid.Parse(sessionCookie.Value)
			if err != nil {
				logger.Error("Malformed Session Token")
				http.Error(w, "Forbidden: Malformed session token", http.StatusForbidden)
				return
			}

			pgxUUID := pgtype.UUID{Bytes: sessionID, Valid: true}

			session, err := database.GetSessionWithUser(context.Background(), pgxUUID)
			if err != nil || session.ExpiresAt.Time.Before(time.Now()) {
				http.Error(w, "Forbidden: Invalid or expired session", http.StatusForbidden)
				return
			}

			if session.CsrfToken != csrfHeader {
				http.Error(w, "Forbidden: Invalid CSRF token", http.StatusForbidden)
				return
			}

			ctx := context.WithValue(r.Context(), userContextKey, session)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// PageAuthMiddleware is a Chi middleware that protects page routes.
// It allows static assets and unauthenticated pages to pass through,
// but redirects all other requests to the sign-in page if no valid session is found.
func PageAuthMiddleware(database *Database) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Define paths that are always allowed, regardless of authentication status
			signInPath := "/auth/sign-in"

			allowlist := []string{
				signInPath,
				"/auth/error",
			}

			// Allow static assets to pass through without an auth check.
			// SvelteKit assets are in /_app/, and we also allow the favicon.
			// Checking for a file extension covers other potential assets like images.
			if path.Ext(r.URL.Path) != "" || strings.HasPrefix(r.URL.Path, "/_app/") || r.URL.Path == "/favicon.png" {
				next.ServeHTTP(w, r)
				return
			}

			// Check if the request path is explicitly in the allowlist
			for _, path := range allowlist {
				if strings.HasPrefix(r.URL.Path, path) {
					next.ServeHTTP(w, r)
					return
				}
			}

			// For all other paths, a valid session is required
			c, err := r.Cookie("session_token")
			if err != nil {
				logger.Error("Failed to get session token")
				http.Redirect(w, r, signInPath, http.StatusSeeOther)
				return
			}

			sessionID, err := uuid.Parse(c.Value)
			if err != nil {
				logger.Error("Failed to parse Session UUID")
				// Invalid cookie format, treat as unauthenticated
				http.Redirect(w, r, signInPath, http.StatusSeeOther)
				return
			}

			pgxUUID := pgtype.UUID{Bytes: sessionID, Valid: true}
			session, err := database.GetSessionWithUser(context.Background(), pgxUUID)
			if err != nil || session.ExpiresAt.Time.Before(time.Now()) {
				logger.Error("Session has expired")
				// If session is not found or is expired, redirect to sign-in
				http.Redirect(w, r, signInPath, http.StatusSeeOther)
				return
			}

			ctx := context.WithValue(r.Context(), userContextKey, session)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
