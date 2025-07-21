package main

import (
	"context"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"opendrive/api/handlers"

	"opendrive/api/services"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/joho/godotenv"
	httpSwagger "github.com/swaggo/http-swagger"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, continuing with environment variables")
	}

	storage, err := services.NewStorageService()
	if err != nil {
		log.Fatalf("Failed to initialize storage service: %v", err)
	}

	if err != nil {
		log.Fatalf("Failed to initialize storage service: %v", err)
	}

	ctx := context.Background()
	database, err := services.NewDatabase(ctx)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
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
		log.Fatalf("Failed to initialize OAuth providers: %v", err)
	}

	r.Group(func(r chi.Router) {
		r.Use(middleware.Logger)
		r.Use(services.ApiAuthMiddleware(database))
		services.HandlerFromMux(api, r)
	})

	r.Get("/docs/*", httpSwagger.Handler(
		httpSwagger.URL("/public/openapi.json"),
	))
	log.Println("Swagger UI is available at http://localhost:8080/docs/index.html")

	workDir, _ := os.Getwd()
	filesDir := http.Dir(filepath.Join(workDir, "public"))
	FileServer(r, "/public", filesDir)

	devProxyMode := os.Getenv("DEV_PROXY") == "true"

	if devProxyMode {
		log.Println("Running in DEV Proxy mode. Proxying frontend requests to Vite at http://localhost:5173")
		viteServerURL, err := url.Parse("http://localhost:5173")
		if err != nil {
			log.Fatalf("Failed to parse Vite server URL: %v", err)
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

			frontendDir := "frontend"
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
		})
	}

	log.Println("Serving frontend from ./frontend at http://localhost:8080")

	s := &http.Server{
		Handler: r,
		Addr:    "0.0.0.0:8080",
	}
	go func() {
		log.Println("Starting server on port 8080")
		if err := s.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Could not start server: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := s.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exiting")
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
