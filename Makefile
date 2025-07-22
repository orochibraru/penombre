dev-api:
	DEV_PROXY=true make -C api dev

dev-ui:
	pnpm -C ui run dev:silent

dev: dev-api dev-ui

api:
	make -C api

.PHONY: dev api
