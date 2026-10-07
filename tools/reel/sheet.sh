#!/usr/bin/env bash
# Contact sheet of a reel's stills: tools/reel/sheet.sh <variant> [columns]
set -euo pipefail
dir="out/reels/$1-stills"
cols="${2:-6}"
count=$(ls "$dir"/*.png | wc -l)
rows=$(( (count + cols - 1) / cols ))
ffmpeg -loglevel error -y -pattern_type glob -i "$dir/*.png" \
  -vf "scale=360:640,drawtext=text='%{metadata\:lavf.image2dec.source_basename}':x=8:y=8:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6,tile=${cols}x${rows}:padding=6:color=0x222222" \
  -frames:v 1 "out/reels/$1-sheet.png"
echo "out/reels/$1-sheet.png"
