package main

import (
	"context"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/orochibraru/penombre/internal/jobs/copyfiles"
	"github.com/orochibraru/penombre/internal/jobs/deletefiles"
	"github.com/orochibraru/penombre/internal/jobs/mediaprobe"
	"github.com/orochibraru/penombre/internal/jobs/scanlist"
	"github.com/orochibraru/penombre/internal/jobs/thumbnail"
	"github.com/orochibraru/penombre/internal/jobs/ziparchive"
	"github.com/orochibraru/penombre/internal/worker"
)

var version = "dev"

// registry wires job types to executors — one line per job type.
func registry() worker.Registry {
	return worker.Registry{
		"thumbnail":   thumbnail.Run,
		"scan-list":   scanlist.Run,
		"media-probe": mediaprobe.Run,
		"zip":         ziparchive.Run,
		"copy":        copyfiles.Run,
		"delete":      deletefiles.Run,
	}
}

func main() {
	showVersion := flag.Bool("version", false, "print the version and exit")
	flag.Parse()
	if *showVersion {
		fmt.Println(version)
		return
	}

	log := slog.New(slog.NewTextHandler(os.Stderr, nil))
	cfg, err := worker.LoadConfig(os.Getenv)
	if err != nil {
		log.Error("config", "err", err)
		os.Exit(1)
	}
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	if cfg.ParentPID != 0 {
		go func() {
			worker.WatchParent(ctx, cfg.ParentPID, time.Second, stop)
			if ctx.Err() != nil && os.Getppid() != cfg.ParentPID {
				log.Warn("the app that started this worker is gone; shutting down")
			}
		}()
	}

	store, err := worker.Open(cfg.DatabaseURL)
	if err != nil {
		log.Error("open database", "err", err)
		os.Exit(1)
	}
	defer store.Close()
	for store.Ready(ctx) != nil {
		log.Info("waiting for the jobs table (the app runs migrations)")
		select {
		case <-ctx.Done():
			return
		case <-time.After(2 * time.Second):
		}
	}

	log.Info("worker started", "id", cfg.ID, "concurrency", cfg.Concurrency, "version", version)
	_ = worker.Run(ctx, cfg, store, registry(), log)
	log.Info("worker stopped")
}
