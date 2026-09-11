variable "TAG" {
  default = "latest"
}

# Empty keeps package.json's own version.
variable "APP_VERSION" {
  default = ""
}

group "default" {
  targets = ["app", "docs"]
}

# Platforms are deliberately unset: `docker buildx bake` locally builds for the
# host and loads, while CI (.github/workflows/docker.yaml) overrides
# `*.platform` per matrix job and merges the per-arch digests itself.
target "base" {
  context    = "."
  dockerfile = "./Dockerfile"
}

target "app" {
  inherits   = ["base"]
  target     = "app"
  args       = { APP_VERSION = "${APP_VERSION}" }
  tags       = ["docker.io/orochibraru/penombre:latest", "docker.io/orochibraru/penombre:${TAG}"]
  cache-from = ["type=gha,scope=app"]
  cache-to   = ["type=gha,mode=max,scope=app"]
}

target "docs" {
  inherits   = ["base"]
  target     = "docs"
  tags       = ["docker.io/orochibraru/penombre-docs:latest", "docker.io/orochibraru/penombre-docs:${TAG}"]
  cache-from = ["type=gha,scope=docs"]
  cache-to   = ["type=gha,mode=max,scope=docs"]
}
