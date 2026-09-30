#!/bin/sh
# The build number of a release version: what Android's versionCode and iOS's
# CFBundleVersion need, a number that only ever grows. A release outranks its
# own canaries, so it takes the slot after the last of them.
#
#   sh version-code.sh 1.8.60           -> 1086099
#   sh version-code.sh 1.8.60-canary.3  -> 1086003
set -eu
refuse() {
  echo "$1: ${2:-}" >&2
  exit 1
}
version="${1:-}"
canary=99
case "$version" in
  *-canary.*) canary="${version##*-canary.}" ;;
  *-*) refuse "not a release version" "$version" ;;
esac
IFS=. read -r major minor patch extra <<VERSION
${version%%-*}
VERSION
[ -z "$extra" ] || refuse "not a release version" "$version"
for number in "$major" "$minor" "$patch" "$canary"; do
  case "$number" in
    "" | *[!0-9]*) refuse "not a release version" "$version" ;;
  esac
done
# Two digits each: past that, one part would run into the next. Slot 99 is
# the release's own, so a canary stops at 98.
limit=98
[ "$version" != "${version%%-*}" ] || limit=99
if [ "$minor" -gt 99 ] || [ "$patch" -gt 99 ] || [ "$canary" -gt "$limit" ]; then
  refuse "version out of range for a build number" "$version"
fi
echo $((major * 1000000 + minor * 10000 + patch * 100 + canary))
