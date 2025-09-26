package logger

import (
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

func Get() *zap.SugaredLogger {
	var err error
	enccoderConfig := zap.NewDevelopmentEncoderConfig()
	config := zap.NewDevelopmentConfig()
	enccoderConfig.StacktraceKey = ""
	enccoderConfig.LevelKey = "L"
	enccoderConfig.TimeKey = ""
	enccoderConfig.CallerKey = ""
	enccoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
	config.EncoderConfig = enccoderConfig

	_, err = config.Build(zap.AddCallerSkip(1))
	if err != nil {
		panic(err)
	}

	return zap.Must(config.Build()).Sugar()
}
