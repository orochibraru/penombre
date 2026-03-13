variable "TAG" {
  default = "latest"
  validation {
    condition = TAG != ""
    error_message = "The variable 'TAG' must not be empty."
  }
}

variable "IMAGE" {
  default = "orochibraru/penombre"
  validation {
    condition = IMAGE != ""
    error_message = "The variable 'IMAGE' must not be empty."
  }
}

// Special target: https://github.com/docker/metadata-action#bake-definition
target "docker-metadata-action" {
  tags = ["orochibraru/penombre:latest","orochibraru/penombre:${TAG}"]
}

group "default" {
  targets = ["image-local"]
}

target "image" {
  inherits = ["docker-metadata-action"]
  context    = "."
  dockerfile = "./Dockerfile"
  args = {
    APP_VERSION = "${TAG}"
  }
}

target "image-local" {
  inherits = ["image"]
  output = ["type=docker"]
}


target "image-all" {
  inherits = ["image"]
  cache-from = ["type=gha"]
  cache-to = ["type=gha,mode=max"]
  platforms = [
    "linux/amd64",
    "linux/arm64"
  ]
}
