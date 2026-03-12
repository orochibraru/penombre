variable "TAG" {
  default = "latest"
  validation {
    condition = TAG != ""
    error_message = "The variable 'TAG' must not be empty."
  }
}

variable "IMAGE" {
  default = "git.ombrage.space/opendrive/opendrive"
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
  tags       = ["git.ombrage.space/opendrive/opendrive:latest","git.ombrage.space/opendrive/opendrive:${TAG}", "orochibraru/opendrive:${TAG}", "orochibraru/opendrive:latest"]
  platforms = ["linux/amd64"]
  cache-from = ["type=gha"]
  cache-to = ["type=gha,mode=max"]
}

