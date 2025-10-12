package config

import (
	"opendrive/api/logger"
	"os"

	"github.com/joho/godotenv"
)

var l = logger.Get()

func Init() {
	err := godotenv.Load(".env", "../.env", "../../../.env")
	if err != nil {
		l.Info("Skipping .env file as none was found.")
	}
}

type ConfigKey string

const (
	Environment            ConfigKey = "APP_ENV"
	DevProxy               ConfigKey = "DEV_PROXY"
	StorageAccessKeyId     ConfigKey = "STORAGE_ACCESS_KEY_ID"
	StorageAccessKeySecret ConfigKey = "STORAGE_ACCESS_KEY_SECRET"
	DatabaseUrl            ConfigKey = "DATABASE_URL"
	StorageUrl             ConfigKey = "STORAGE_URL"
)

func Get(c ConfigKey) string {
	return os.Getenv(string(c))
}
