package main

import (
	"context"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"os/signal"
	"path/filepath"
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

	"github.com/joho/godotenv"
	httpSwagger "github.com/swaggo/http-swagger"
)

func main() {
	logger.Init()

	err := godotenv.Load()
	if err != nil {
		logger.Info("No .env file found, continuing with environment variables")
	}

	storage, err := services.NewStorageService()
	if err != nil {
		logger.Fatal("Failed to initialize storage service: %v", err)
	}

	if err != nil {
		logger.Fatal("Failed to initialize storage service: %v", err)
	}

	ctx := context.Background()
	database, err := services.NewDatabase(ctx)
	if err != nil {
		logger.Fatal("failed to connect to database: %v", err)
	}
	defer database.Close()

	if database.Available {
		RunMigrations(database.URL)
	}

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
	r.Use(middleware.Timeout(60 * time.Second))

	err = services.InitOAuthProviders()

	if err != nil {
		logger.Fatal("Failed to initialize OAuth providers: %v", err)
	}

	r.Group(func(r chi.Router) {
		r.Use(middleware.Logger)
		r.Use(services.ApiAuthMiddleware(database))
		services.HandlerFromMux(api, r)
	})

	r.Get("/docs/*", httpSwagger.Handler(
		httpSwagger.URL("/public/openapi.json"),
	))
	logger.Info("Swagger UI is available at http://localhost:8080/docs/index.html")

	workDir, _ := os.Getwd()
	filesDir := http.Dir(filepath.Join(workDir, "public"))
	FileServer(r, "/public", filesDir)

	if config.DevProxy == true {
		logger.Info("Running in DEV Proxy mode. Proxying frontend requests to Vite at http://localhost:5173")
		viteServerURL, err := url.Parse("http://localhost:5173")
		if err != nil {
			logger.Fatal("Failed to parse Vite server URL: %v", err)
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

			frontendDir := "dist"
			fs := http.FileServer(http.Dir(frontendDir))

			r.Get("/*", func(w http.ResponseWriter, r *http.Request) {
				filePath := filepath.Join(frontendDir, r.URL.Path)
				_, err := os.Stat(filePath)

				if os.IsNotExist(err) {
					http.ServeFile(w, r, filepath.Join(frontendDir, "index.html"))
					return
				}

				fs.ServeHTTP(w, r)
			})
			logger.Info("Serving frontend from %s at http://localhost:8080", frontendDir)
		})
	}

	s := &http.Server{
		Handler: r,
		Addr:    "0.0.0.0:8080",
	}
	go func() {
		logger.Info("Starting server on port 8080")
		if err := s.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("Could not start server: %v", err)
		}

		logger.Info("Server started at http://localhost:8080")
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	logger.Info("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := s.Shutdown(ctx); err != nil {
		logger.Fatal("Server forced to shutdown: %v", err)
	}

	logger.Info("Server exiting")
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
