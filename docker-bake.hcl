variable "TAG" {
  default = "latest"
  validation {
    condition = TAG != ""
    error_message = "The variable 'TAG' must not be empty."
  }
}

variable "IMAGE" {
  default = "git.ombrage.space/penombre/penombre"
  validation {
    condition = IMAGE != ""
    error_message = "The variable 'IMAGE' must not be empty."
  }
}

group "default" {
  targets = ["app"]
}


target "app" {
  context    = "."
  args = {
    APP_VERSION = "${TAG}"
  }
  dockerfile = "./Dockerfile"
  tags       = ["git.ombrage.space/penombre/penombre:latest","git.ombrage.space/penombre/penombre:${TAG}"]
  platforms = ["linux/amd64"]
  cache-from = ["type=gha"]
  cache-to = ["type=gha,mode=max"]
}

