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

	httpSwagger "github.com/swaggo/http-swagger"
)

var l = logger.Get()

func main() {
	config.Init()
	storage, err := services.NewStorageService()
	if err != nil {
		os.Exit(1)
	}

	ctx := context.Background()
	database, err := services.NewDatabase(ctx)
	if err != nil {
		l.Fatal("failed to connect to database: %v", err)
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
	l.Info("Swagger UI is available at http://0.0.0.0:8080/docs/index.html")

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

			frontendDir := "../ui/dist"
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
			l.Infof("Serving UI from %s at http://localhost:8080", frontendDir)
		})
	}

	s := &http.Server{
		Handler: r,
		Addr:    "0.0.0.0:8080",
	}
	go func() {
		l.Info("Starting server on port 8080")
		l.Info("Server started at http://localhost:8080")
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
