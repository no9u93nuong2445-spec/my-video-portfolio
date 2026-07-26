#!/usr/bin/env bash
set -euo pipefail

MAX_BITRATE=4500000

for input in videos/*.mp4; do
  codec="$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of default=nw=1:nk=1 "$input")"
  width="$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of default=nw=1:nk=1 "$input")"
  height="$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of default=nw=1:nk=1 "$input")"
  bitrate="$(ffprobe -v error -select_streams v:0 -show_entries stream=bit_rate -of default=nw=1:nk=1 "$input")"
  bitrate="${bitrate:-0}"

  if [[ "$codec" == "h264" && "$width" -le 1280 && "$height" -le 1280 && "$bitrate" -gt 0 && "$bitrate" -le "$MAX_BITRATE" ]]; then
    echo "Skipping already web-ready file: $input"
    continue
  fi

  if [[ "$width" -ge "$height" ]]; then
    scale_filter="scale=1280:-2:force_original_aspect_ratio=decrease:flags=lanczos"
  else
    scale_filter="scale=-2:1280:force_original_aspect_ratio=decrease:flags=lanczos"
  fi

  output="${input%.mp4}.optimized.mp4"
  echo "Optimizing $input ($codec, ${width}x${height}, ${bitrate} bps)"

  ffmpeg -hide_banner -loglevel warning -y \
    -i "$input" \
    -map 0:v:0 -map '0:a?' \
    -vf "$scale_filter" \
    -c:v libx264 -preset veryfast -crf 24 \
    -maxrate 4M -bufsize 8M \
    -profile:v main -level:v 4.0 -pix_fmt yuv420p -tag:v avc1 \
    -g 60 -keyint_min 60 -sc_threshold 0 \
    -c:a aac -b:a 96k \
    -movflags +faststart \
    "$output"

  mv "$output" "$input"
done

