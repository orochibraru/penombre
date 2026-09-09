variable "TAG" {
  default = "latest"
}

group "default" {
  targets = ["app", "docs"]
}

group "ci" {
  targets = ["app-ci", "docs-ci"]
}

target "base" {
  context    = "."
  dockerfile = "./Dockerfile"
}

target "ci-base" {
  inherits = [ "base" ]
  platforms = [
    "linux/amd64",
    "linux/arm64"
  ]
}

target "app-base" {
  target = "app"
  tags       = ["docker.io/orochibraru/penombre:latest", "docker.io/orochibraru/penombre:${TAG}"]
  cache-from = ["type=gha,scope=app"]
  cache-to   = ["type=gha,mode=max,scope=app"]
}

target "docs-base" {
  target = "docs"
  tags       = ["docker.io/orochibraru/penombre-docs:latest", "docker.io/orochibraru/penombre-docs:${TAG}"]
  cache-from = ["type=gha,scope=docs"]
  cache-to   = ["type=gha,mode=max,scope=docs"]
}

target "app" {
  inherits   = ["base", "app-base"]
}

target "docs" {
  inherits   = ["base", "docs-base"]
}

target "app-ci" {
  inherits   = ["ci-base", "app-base"]
}

target "docs-ci" {
  inherits   = ["ci-base", "docs-base"]
}
