package main

import (
	"context"
	"flag"
	"fmt"
	"io"
	"io/fs"
	"log/slog"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/orochibraru/penombre/internal/envelope"
	"github.com/orochibraru/penombre/internal/jobs/copyfiles"
	"github.com/orochibraru/penombre/internal/jobs/deletefiles"
	"github.com/orochibraru/penombre/internal/jobs/encryptfiles"
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
		"encrypt":     encryptfiles.Run,
	}
}

func main() {
	showVersion := flag.Bool("version", false, "print the version and exit")
	decrypt := flag.String("decrypt", "", "write the plaintext of a sealed file to stdout, using ENCRYPTION_KEY(_FILE, _PREVIOUS), and exit")
	check := flag.String("encrypt-check", "", "count plaintext and sealed files under a directory, and exit")
	flag.Parse()
	if *showVersion {
		fmt.Println(version)
		return
	}
	if *decrypt != "" || *check != "" {
		if err := offline(*decrypt, *check); err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
		return
	}

	log := slog.New(slog.NewTextHandler(os.Stderr, nil))
	cfg, err := worker.LoadConfig(os.Getenv)
	if err != nil {
		log.Error("config", "err", err)
		os.Exit(1)
	}
	envelope.SetDefault(cfg.Keyring)
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

	worker.Preflight(log, exec.LookPath, func() (string, error) {
		encodersCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
		defer cancel()
		out, err := exec.CommandContext(encodersCtx, "ffmpeg", "-hide_banner", "-encoders").CombinedOutput()
		return string(out), err
	})

	warnMissingKey(ctx, log, store, cfg.Keyring)
	log.Info("worker started", "id", cfg.ID, "concurrency", cfg.Concurrency, "version", version)
	_ = worker.Run(ctx, cfg, store, registry(), log)
	log.Info("worker stopped")
}

// warnMissingKey says so once at boot when the app seals files with a key
// this worker was not given: every job touching them would fail.
func warnMissingKey(ctx context.Context, log *slog.Logger, store *worker.Store, keys envelope.Keyring) {
	id, err := store.EncryptionKeyID(ctx)
	if err != nil || id == "" || keys.Has(id) {
		return
	}
	log.Warn("files are sealed with key " + id + ", which this worker does not have; set ENCRYPTION_KEY (or ENCRYPTION_KEY_FILE) as on the app")
}

// offline runs the recovery flags: no database, only the keys from the env.
func offline(decrypt, check string) error {
	keys, err := envelope.LoadKeyring(os.Getenv)
	if err != nil {
		return err
	}
	if decrypt != "" {
		f, _, err := keys.OpenFile(decrypt)
		if err != nil {
			return err
		}
		defer f.Close()
		_, err = io.Copy(os.Stdout, f)
		return err
	}
	counts := map[string]int{}
	err = filepath.WalkDir(check, func(path string, d fs.DirEntry, err error) error {
		if err != nil || !d.Type().IsRegular() {
			return err
		}
		f, err := os.Open(path)
		if err != nil {
			return err
		}
		h := make([]byte, envelope.HeaderSize)
		n, _ := io.ReadFull(f, h)
		f.Close()
		switch _, current, err := keys.OpenHeader(h[:n]); {
		case !envelope.IsSealed(h[:n]):
			counts["plaintext"]++
		case err != nil:
			counts["unreadable ("+err.Error()+")"]++
		case current:
			counts["sealed, current key"]++
		default:
			counts["sealed, previous key"]++
		}
		return nil
	})
	for kind, n := range counts {
		fmt.Printf("%d\t%s\n", n, kind)
	}
	return err
}
