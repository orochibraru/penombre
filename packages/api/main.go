package main

import (
	"context"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"os/signal"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"
	"time"

	"opendrive/api/config"
	"opendrive/api/handlers"
	"opendrive/api/logger"

	"opendrive/api/services"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	httpSwagger "github.com/swaggo/http-swagger"
)

var l = logger.Get()

func main() {
	config.Init()
	storage, err := services.NewStorageService()
	if err != nil {
		l.Errorf("failed to connect to storage service: %v", err)
	}

	ctx := context.Background()
	database, err := services.NewDatabase(ctx)
	if err != nil {
		l.Errorf("failed to connect to database: %v", err)
	}
	defer database.Close()

	migrationsRun := false
	if database.Available {
		RunMigrations(database.URL)
		migrationsRun = true
	}

	// Start a goroutine to periodically check database availability and run migrations if needed
	go func() {
		ticker := time.NewTicker(5 * time.Second)
		defer ticker.Stop()

		for range ticker.C {
			if !migrationsRun && !database.Available {
				checkCtx := context.Background()
				err := services.CheckDb(database, checkCtx)
				if err == nil {
					database.Available = true
					l.Info("Database is now available. Running migrations...")
					RunMigrations(database.URL)
					migrationsRun = true
					return // Stop checking once migrations are run
				}
			} else if migrationsRun {
				return // Stop checking if migrations have been run
			}
		}
	}()

	api := &handlers.Server{
		Storage: storage,
		DB:      database,
	}

	r := chi.NewMux()

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://*", "https://*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Use(middleware.Recoverer)
	r.Use(middleware.Compress(5)) // gzip compression
	r.Use(middleware.Timeout(60 * time.Second))

	err = services.InitOAuthProviders()

	if err != nil {
		l.Fatal("Failed to initialize OAuth providers: %v", err)
	}

	r.Group(func(r chi.Router) {
		r.Use(middleware.Logger)
		r.Use(services.ApiAuthMiddleware(database))
		services.HandlerFromMux(api, r)
	})

	r.Get("/docs/*", httpSwagger.Handler(
		httpSwagger.URL("/public/openapi.json"),
	))

	workDir, _ := os.Getwd()
	filesDir := http.Dir(filepath.Join(workDir, "public"))
	FileServer(r, "/public", filesDir)

	if config.Get(config.DevProxy) == "true" {
		l.Info("Running in DEV Proxy mode. Proxying frontend requests here. Make sure the Vite dev server is running on port 5173.")
		viteServerURL, err := url.Parse("http://0.0.0.0:5173")
		if err != nil {
			l.Fatal("Failed to parse Vite server URL: %v", err)
		}

		proxy := httputil.NewSingleHostReverseProxy(viteServerURL)

		// We need to modify the Director to correctly handle WebSocket upgrades for HMR
		proxy.Director = func(req *http.Request) {
			req.URL.Scheme = viteServerURL.Scheme
			req.URL.Host = viteServerURL.Host
			req.Host = viteServerURL.Host
		}

		r.HandleFunc("/*", proxy.ServeHTTP)
	} else {
		r.Group(func(r chi.Router) {
			r.Use(services.PageAuthMiddleware(database))

			frontendDir := "./dist"
			fs := http.FileServer(http.Dir(frontendDir))

			r.Get("/*", func(w http.ResponseWriter, r *http.Request) {
				filePath := filepath.Join(frontendDir, r.URL.Path)
				fileInfo, err := os.Stat(filePath)

				if os.IsNotExist(err) {
					// Serve index.html for SPA routing
					w.Header().Set("Cache-Control", "no-cache")
					http.ServeFile(w, r, filepath.Join(frontendDir, "index.html"))
					return
				}

				// Set cache headers based on file type
				if !fileInfo.IsDir() {
					setCacheHeaders(w, r.URL.Path)
				}

				fs.ServeHTTP(w, r)
			})
			l.Infof("Serving UI from %s", frontendDir)
		})
	}

	port := strconv.Itoa(8080)

	s := &http.Server{
		Handler: r,
		Addr:    "0.0.0.0:" + port,
	}
	go func() {
		l.Infof("Starting server on port: %s", port)
		l.Infof("Server started at http://%s", s.Addr)
		l.Infof("Swagger UI is available at http://%s/docs/index.html", s.Addr)
		err := s.ListenAndServe()
		if err != nil && err != http.ErrServerClosed {
			l.Fatal("Could not start server: %v", err)
		}

	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	l.Info("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := s.Shutdown(ctx); err != nil {
		l.Fatal("Server forced to shutdown: %v", err)
	}

	l.Info("Server exiting")
}

func setCacheHeaders(w http.ResponseWriter, path string) {
	// Cache static assets aggressively, but not HTML files
	if strings.HasSuffix(path, ".js") || strings.HasSuffix(path, ".css") ||
		strings.HasSuffix(path, ".woff") || strings.HasSuffix(path, ".woff2") ||
		strings.HasSuffix(path, ".ttf") || strings.HasSuffix(path, ".eot") {
		// Cache for 1 year (immutable assets with content hashes)
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	} else if strings.HasSuffix(path, ".png") || strings.HasSuffix(path, ".jpg") ||
		strings.HasSuffix(path, ".jpeg") || strings.HasSuffix(path, ".gif") ||
		strings.HasSuffix(path, ".svg") || strings.HasSuffix(path, ".ico") ||
		strings.HasSuffix(path, ".webp") {
		// Cache images for 1 week
		w.Header().Set("Cache-Control", "public, max-age=604800")
	} else if strings.HasSuffix(path, ".html") {
		// Don't cache HTML files
		w.Header().Set("Cache-Control", "no-cache")
	} else {
		// Default: cache for 1 hour
		w.Header().Set("Cache-Control", "public, max-age=3600")
	}
}

func FileServer(r chi.Router, path string, root http.FileSystem) {
	if strings.ContainsAny(path, "{}*") {
		panic("FileServer does not permit any URL parameters.")
	}

	if path != "/" && path[len(path)-1] != '/' {
		r.Get(path, http.RedirectHandler(path+"/", http.StatusMovedPermanently).ServeHTTP)
		path += "/"
	}
	path += "*"

	r.Get(path, func(w http.ResponseWriter, r *http.Request) {
		rctx := chi.RouteContext(r.Context())
		pathPrefix := strings.TrimSuffix(rctx.RoutePattern(), "/*")
		fs := http.StripPrefix(pathPrefix, http.FileServer(root))
		fs.ServeHTTP(w, r)
	})
}
