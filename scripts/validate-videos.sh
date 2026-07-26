#!/usr/bin/env bash
set -euo pipefail

failed=0

for input in videos/*.mp4; do
  codec="$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of default=nw=1:nk=1 "$input")"
  pixel_format="$(ffprobe -v error -select_streams v:0 -show_entries stream=pix_fmt -of default=nw=1:nk=1 "$input")"
  width="$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of default=nw=1:nk=1 "$input")"
  height="$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of default=nw=1:nk=1 "$input")"
  size="$(stat -c%s "$input")"

  if [[ "$codec" != "h264" || "$pixel_format" != "yuv420p" || "$width" -gt 1280 || "$height" -gt 1280 ]]; then
    echo "::error file=$input::Invalid web video: codec=$codec pixel_format=$pixel_format resolution=${width}x${height}"
    failed=1
  fi

  if [[ "$size" -gt 52428800 ]]; then
    echo "::error file=$input::Video remains larger than 50 MiB ($size bytes)"
    failed=1
  fi

  echo "$input codec=$codec pixel_format=$pixel_format resolution=${width}x${height} size=$size"
done

exit "$failed"

