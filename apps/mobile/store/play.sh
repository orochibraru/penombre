#!/usr/bin/env bash
# Publishes this folder to Google Play in one edit: every listing under
# listings/, the images (the default language's, which the others fall back
# to) and, given one, a bundle released to a track.
#
#   TOKEN=… bash mobile/store/play.sh [--dry-run] [<track> <version> <bundle.aab>]
#
# TOKEN is an OAuth token with the androidpublisher scope. --dry-run has Play
# validate the edit, then discards it.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
app=applications/com.orochibraru.penombre
api="https://androidpublisher.googleapis.com/androidpublisher/v3/$app"
upload="https://androidpublisher.googleapis.com/upload/androidpublisher/v3/$app"
dry=
if [ "${1:-}" = --dry-run ]; then
  dry=1
  shift
fi

call() {
  local body
  body="$(curl -sS --fail-with-body -H "Authorization: Bearer $TOKEN" "$@")" || {
    echo "$body" >&2
    return 1
  }
  echo "$body"
}

edit="$(call -X POST -d '' "$api/edits" | jq -r .id)"
at="$api/edits/$edit"

for dir in "$here"/listings/*/; do
  language="$(basename "$dir")"
  jq -n --arg language "$language" --rawfile title "$dir/title.txt" \
    --rawfile short "$dir/short-description.txt" --rawfile full "$dir/full-description.txt" \
    '{language: $language, title: ($title | rtrimstr("\n")),
      shortDescription: ($short | rtrimstr("\n")), fullDescription: ($full | rtrimstr("\n"))}' |
    call -X PUT -H "Content-Type: application/json" --data-binary @- "$at/listings/$language" >/dev/null
done
# The folders are the whole truth: a language Play has and this folder lacks goes.
for language in $(call "$at/listings" | jq -r '.listings[]?.language'); do
  [ -d "$here/listings/$language" ] || call -X DELETE "$at/listings/$language" >/dev/null
done
echo "Listings: $(cd "$here/listings" && echo *)."

default="$(call "$at/details" | jq -r .defaultLanguage)"
# images <type> <file>…: replaced only when the hashes differ, in this order.
images() {
  local type="$1" want have file mime
  shift
  want="$(for file in "$@"; do shasum -a 256 "$file" | cut -d' ' -f1; done)"
  have="$(call "$at/listings/$default/$type" | jq -r '.images[]?.sha256')"
  if [ "$want" = "$have" ]; then
    echo "$type: unchanged."
    return
  fi
  call -X DELETE "$at/listings/$default/$type" >/dev/null
  for file in "$@"; do
    case "$file" in
      *.png) mime=image/png ;;
      *) mime=image/jpeg ;;
    esac
    call -X POST -H "Content-Type: $mime" --data-binary "@$file" \
      "$upload/edits/$edit/listings/$default/$type?uploadType=media" >/dev/null
  done
  echo "$type: uploaded $#."
}
images icon "$here/icon.png"
images featureGraphic "$here/feature-graphic.jpg"
images phoneScreenshots "$here"/phone-*.jpg

if [ $# -gt 0 ]; then
  track="$1" version="$2" bundle="$3"
  code="$(call -X POST -H "Content-Type: application/octet-stream" --data-binary "@$bundle" \
    "$upload/edits/$edit/bundles?uploadType=media" | jq -r .versionCode)"
  jq -n --arg name "$version" --arg code "$code" \
    '{releases: [{name: $name, versionCodes: [$code], status: "completed"}]}' |
    call -X PUT -H "Content-Type: application/json" --data-binary @- "$at/tracks/$track" >/dev/null
  echo "Version code $code to the $track track."
fi

if [ -n "$dry" ]; then
  call -X POST -d '' "$at:validate" >/dev/null
  call -X DELETE "$at" >/dev/null
  echo "Valid. Nothing committed."
else
  call -X POST -d '' "$at:commit" >/dev/null
  echo "Committed."
fi
