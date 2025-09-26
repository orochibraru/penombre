package services

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"

	// Adjust to your module path

	"golang.org/x/oauth2"
)

// OAuthProvider holds the configuration for a single OAuth2 provider.
type OAuthProvider struct {
	Config      *oauth2.Config
	UserInfoURL string
}

// OIDCProviderConfig holds the endpoint URLs discovered from a provider.
type OIDCProviderConfig struct {
	AuthURL     string `json:"authorization_endpoint"`
	TokenURL    string `json:"token_endpoint"`
	UserInfoURL string `json:"userinfo_endpoint"`
}

type UserInfo struct {
	Email string `json:"email"`
	Name  string `json:"name"`
	Image string `json:"picture"` // Maps the 'picture' JSON key to the 'Image' Go field
}

// providerRegistry holds all configured OAuth providers, keyed by their name (e.g., "google").
var providerRegistry = make(map[string]*OAuthProvider)

type OauthBaseConf struct {
	DiscoveryUrl string
	ClientID     string
	ClientSecret string
	RedirectUrl  string
}

func GetProviderRegistry() map[string]*OAuthProvider {
	return providerRegistry
}

// initOAuthProviders discovers and configures all OAuth providers specified in env variables.
func InitOAuthProviders() error {
	// OAUTH_PROVIDERS should be a comma-separated list, e.g., "pocketid,google"
	providers := os.Getenv("OAUTH_PROVIDERS")
	if providers == "" {
		l.Warn("No OAuth providers configured. Skipping OAuth initialization.")
		return nil
	}

	for _, providerName := range strings.Split(providers, ",") {
		providerName = strings.TrimSpace(providerName)
		l.Info("Initializing OAuth provider: %s", providerName)

		// Construct env var names from the provider name
		envPrefix := "OAUTH_" + strings.ToUpper(providerName) + "_"
		discoveryVar := envPrefix + "DISCOVERY_URL"
		clientIDVar := envPrefix + "CLIENT_ID"
		clientSecretVar := envPrefix + "CLIENT_SECRET"
		redirectUrlVar := envPrefix + "REDIRECT_URL"

		discoveryURL := os.Getenv(discoveryVar)
		clientID := os.Getenv(clientIDVar)
		clientSecret := os.Getenv(clientSecretVar)
		redirectURL := os.Getenv(redirectUrlVar)

		envVarConf := OauthBaseConf{
			DiscoveryUrl: discoveryVar,
			ClientID:     clientIDVar,
			ClientSecret: clientSecretVar,
			RedirectUrl:  redirectUrlVar,
		}

		if discoveryURL == "" || clientID == "" || clientSecret == "" || redirectURL == "" {
			return fmt.Errorf("missing required environment variables for provider: %s. Required variables are: %s", providerName, envVarConf)
		}

		resp, err := http.Get(discoveryURL)
		if err != nil {
			return fmt.Errorf("failed to fetch OIDC discovery for %s: %w", providerName, err)
		}

		defer func() {
			err := resp.Body.Close()
			if err != nil {
				l.Error(err)
				return
			}
		}()

		body, _ := io.ReadAll(resp.Body)
		var providerConfig OIDCProviderConfig
		if err := json.Unmarshal(body, &providerConfig); err != nil {
			return fmt.Errorf("failed to parse OIDC discovery for %s: %w", providerName, err)
		}

		providerRegistry[providerName] = &OAuthProvider{
			UserInfoURL: providerConfig.UserInfoURL,
			Config: &oauth2.Config{
				RedirectURL:  redirectURL,
				ClientID:     clientID,
				ClientSecret: clientSecret,
				Scopes:       []string{"openid", "email", "profile"},
				Endpoint: oauth2.Endpoint{
					AuthURL:  providerConfig.AuthURL,
					TokenURL: providerConfig.TokenURL,
				},
			},
		}
		l.Info("Successfully configured OAuth provider: %s", providerName)
	}
	return nil
}
