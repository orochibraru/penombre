package config

import (
	"os"
)

type Config struct {
	Environment            string
	DevProxy               bool
	StorageAccessKeyId     string
	StorageAccessKeySecret string
}

var Environment string = os.Getenv("APP_ENV")
var DevProxy bool = os.Getenv("DEV_PROXY") == "true"
var StorageAccessKeyId string = os.Getenv("STORAGE_ACCESS_KEY_ID")
var StorageAccessKeySecret string = os.Getenv("STORAGE_ACCESS_KEY_SECRET")
