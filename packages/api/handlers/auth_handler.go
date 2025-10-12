package handlers

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	db "opendrive/api/db/sqlc"
	"opendrive/api/services"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	openapi_types "github.com/oapi-codegen/runtime/types"
)

// PostApiV1AuthSignOut implements ServerInterface.
func (s Server) PostApiV1AuthSignOut(w http.ResponseWriter, r *http.Request) {
	sessionCookie, err := r.Cookie("session_token")
	if err != nil {
		// If there's no cookie, there's nothing to do
		w.WriteHeader(http.StatusOK)
		return
	}

	sessionID, err := uuid.Parse(sessionCookie.Value)
	if err == nil {
		pgxUUID := pgtype.UUID{Bytes: sessionID, Valid: true}
		err := s.DB.DeleteSession(context.Background(), pgxUUID)
		if err != nil {
			l.Error("Failed to delete session")
		}
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
	})

	http.SetCookie(w, &http.Cookie{
		Name:   "csrf_token",
		Value:  "",
		Path:   "/",
		MaxAge: -1,
	})

	w.WriteHeader(http.StatusOK)
}

// GetApiV1AuthMe implements ServerInterface.
func (s Server) GetApiV1AuthMe(w http.ResponseWriter, r *http.Request) {
	userContextKey := services.GetContextKey()
	session, ok := r.Context().Value(userContextKey).(db.GetSessionWithUserRow)
	if !ok {
		RespondWithError(w, http.StatusInternalServerError, "Could not retrieve user from context (/api/v1/auth/me)")
		return
	}

	// The user's image is not in the GetSessionWithUserRow struct.
	// We still need to fetch the full user object for that.
	user, err := s.DB.GetUserById(context.Background(), session.UserID)
	if err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Could not retrieve user")
		return
	}

	userSessionResponse := services.UserSession{
		User: services.User{
			Id:    (openapi_types.UUID)(user.ID.Bytes),
			Name:  user.Name,
			Email: (openapi_types.Email)(user.Email),
			Image: &user.Image.String, // Now we have the image
		},
		Session: services.Session{
			Id:        (*openapi_types.UUID)(&session.ID.Bytes),
			ExpiresAt: &session.ExpiresAt.Time,
		},
	}

	RespondWithJSON(w, http.StatusOK, userSessionResponse)
}

// GetApiV1AuthOauthProviderCallback implements ServerInterface.
func (s Server) GetApiV1AuthOauthProviderCallback(w http.ResponseWriter, r *http.Request, provider string, params services.GetApiV1AuthOauthProviderCallbackParams) {
	providerRegistry := services.GetProviderRegistry()
	oauthProvider, ok := providerRegistry[provider]
	if !ok {
		services.SetErrorCookie(w, "Unsupported OAuth provider")
		l.Errorf("Unsupported OAuth provider: %s", provider)
		http.Redirect(w, r, "/auth/error", http.StatusSeeOther)
		return
	}

	// Verify state
	stateCookie, err := r.Cookie("oauth_state")
	if err != nil || r.URL.Query().Get("state") != stateCookie.Value {
		services.SetErrorCookie(w, "Invalid state paramter")
		l.Error("Invalid state paramter: %s", err)
		http.Redirect(w, r, "/auth/error", http.StatusSeeOther)
		return
	}

	// Exchange token
	code := r.URL.Query().Get("code")
	token, err := oauthProvider.Config.Exchange(context.Background(), code)
	if err != nil {
		services.SetErrorCookie(w, "Failed to exchange token")
		l.Error("Failed to exchange token: %s", err)
		http.Redirect(w, r, "/auth/error", http.StatusSeeOther)
		return
	}

	// Get user info
	req, _ := http.NewRequest("GET", oauthProvider.UserInfoURL, nil)
	req.Header.Set("Authorization", "Bearer "+token.AccessToken)
	resp, err := (&http.Client{}).Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		services.SetErrorCookie(w, "Failed to get user info")
		l.Error("Failed to get user info: %s", err)
		http.Redirect(w, r, "/auth/error", http.StatusSeeOther)
		return
	}

	defer func() {
		err := resp.Body.Close()
		if err != nil {
			l.Error(err)
			return
		}
	}()

	body, _ := io.ReadAll(resp.Body)
	var userInfo services.UserInfo
	err = json.Unmarshal(body, &userInfo)
	if err != nil {
		l.Error("Failed to unmarshal body")
		return
	}

	// Find or create user
	user, err := s.DB.GetUserByEmail(context.Background(), userInfo.Email)
	if err != nil { // Assuming "no rows" is the error
		newUser, createErr := s.DB.CreateUser(context.Background(), db.CreateUserParams{
			Name:  userInfo.Name,
			Email: userInfo.Email,
			Image: pgtype.Text{String: userInfo.Image, Valid: userInfo.Image != ""},
		})
		if createErr != nil {
			services.SetErrorCookie(w, "Failed to create user")
			l.Error("Failed to create user: %s", createErr)
			http.Redirect(w, r, "/auth/error", http.StatusSeeOther)
			return
		}
		user.ID = newUser.ID
	}

	validUserId, err := uuid.Parse(user.ID.String())

	if err != nil {
		l.Error("Failed to decode UUID: %s", err)
		services.SetErrorCookie(w, "Failed to decode UUID")
		http.Redirect(w, r, "/auth/error", http.StatusSeeOther)
		return
	}

	err = s.Storage.EnsureUserBucket(user)

	if err != nil {
		// Log the error but don't block the login process
		l.Error("CRITICAL: Failed to ensure bucket for user %s: %v", user.ID, err)
	}

	services.SetSessionCookies(w, validUserId, s.DB)
	l.Info("Login callback successful")
	http.Redirect(w, r, "/auth/callback", http.StatusSeeOther)
}

// GetApiV1AuthOauthProviderLogin implements ServerInterface.
func (s Server) GetApiV1AuthOauthProviderLogin(w http.ResponseWriter, r *http.Request, provider string) {
	providerRegistry := services.GetProviderRegistry()
	oauthProvider, ok := providerRegistry[provider]
	if !ok {
		services.SetErrorCookie(w, "Unsupported OAuth provider")
		l.Warnf("Unsupported OAuth provider: %s", provider)
		http.Redirect(w, r, "/auth/error", http.StatusSeeOther)
		return
	}

	state := uuid.NewString()
	http.SetCookie(w, &http.Cookie{
		Name:     "oauth_state",
		Value:    state,
		Expires:  time.Now().Add(10 * time.Minute),
		HttpOnly: true,
		Path:     "/",
	})

	// Also store the provider name in a cookie to use it in the callback
	http.SetCookie(w, &http.Cookie{
		Name:     "oauth_provider",
		Value:    provider,
		Expires:  time.Now().Add(10 * time.Minute),
		HttpOnly: true,
		Path:     "/",
	})

	url := oauthProvider.Config.AuthCodeURL(state)
	l.Info("Login fist step successful")
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

// GetApiV1AuthOauthProviders implements ServerInterface.
func (s Server) GetApiV1AuthOauthProviders(w http.ResponseWriter, r *http.Request) {
	providerRegistry := services.GetProviderRegistry()
	var providers []string
	for name := range providerRegistry {
		providers = append(providers, name)
	}
	RespondWithJSON(w, http.StatusOK, providers)
}
