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

group "default" {
  targets = ["app"]
}


target "app" {
  context    = "."
  args = {
    APP_VERSION = "${TAG}"
  }
  dockerfile = "./Dockerfile"
  tags       = ["orochibraru/penombre:latest","orochibraru/penombre:${TAG}"]
  platforms = ["linux/amd64", "linux/arm64"]
  cache-from = ["type=gha"]
  cache-to = ["type=gha,mode=max"]
}

