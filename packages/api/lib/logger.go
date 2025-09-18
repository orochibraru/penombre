package lib

import (
	"log"

	"go.uber.org/zap"
)

func GetLogger() *zap.SugaredLogger {
	var logger, err = zap.NewDevelopment()
	if err != nil {
		log.Fatalf("can't initialize zap logger: %v", err)
	}
	sugar := logger.Sugar()
	defer sugar.Sync()
	return sugar
}
