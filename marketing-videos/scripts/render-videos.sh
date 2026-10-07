#!/usr/bin/env bash
# Render the three vertical social videos (1080 × 1920, H.264/AAC).
# Run from the repository root: bash marketing-videos/scripts/render-videos.sh
#
# The repository does not require a video renderer at runtime. For local re-renders
# install FFmpeg and either put it on PATH or set FFMPEG=/path/to/ffmpeg.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MEDIA="$ROOT/marketing-videos"
FRAMES="$MEDIA/frames"
AUDIO="$MEDIA/audio"
OUT="$MEDIA/videos"
mkdir -p "$OUT"

if [[ -n "${FFMPEG:-}" ]]; then
  FFMPEG_BIN="$FFMPEG"
elif command -v ffmpeg >/dev/null 2>&1; then
  FFMPEG_BIN="$(command -v ffmpeg)"
elif [[ -x "$ROOT/node_modules/ffmpeg-static-electron/bin/linux/x64/ffmpeg" ]]; then
  FFMPEG_BIN="$ROOT/node_modules/ffmpeg-static-electron/bin/linux/x64/ffmpeg"
else
  echo "FFmpeg was not found. Install FFmpeg or set FFMPEG=/path/to/ffmpeg." >&2
  exit 1
fi

# $1 output filename, $2 narration, $3-$6 scene cards, $7-$10 scene durations.
render_video() {
  local output="$1" audio="$2" one="$3" two="$4" three="$5" four="$6"
  local d1="$7" d2="$8" d3="$9" d4="${10}"
  local f1 f2 f3 f4
  f1=$(awk "BEGIN { printf \"%.2f\", $d1 - 0.42 }")
  f2=$(awk "BEGIN { printf \"%.2f\", $d2 - 0.42 }")
  f3=$(awk "BEGIN { printf \"%.2f\", $d3 - 0.42 }")
  f4=$(awk "BEGIN { printf \"%.2f\", $d4 - 0.42 }")

  "$FFMPEG_BIN" -y \
    -loop 1 -r 30 -t "$d1" -i "$one" \
    -loop 1 -r 30 -t "$d2" -i "$two" \
    -loop 1 -r 30 -t "$d3" -i "$three" \
    -loop 1 -r 30 -t "$d4" -i "$four" \
    -i "$audio" \
    -filter_complex "
      [0:v]zoompan=z='min(zoom+0.00030,1.055)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30,trim=duration=${d1},setpts=PTS-STARTPTS,fade=t=in:st=0:d=0.38,fade=t=out:st=${f1}:d=0.42[v0];
      [1:v]zoompan=z='min(zoom+0.00030,1.055)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30,trim=duration=${d2},setpts=PTS-STARTPTS,fade=t=in:st=0:d=0.38,fade=t=out:st=${f2}:d=0.42[v1];
      [2:v]zoompan=z='min(zoom+0.00030,1.055)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30,trim=duration=${d3},setpts=PTS-STARTPTS,fade=t=in:st=0:d=0.38,fade=t=out:st=${f3}:d=0.42[v2];
      [3:v]zoompan=z='min(zoom+0.00030,1.055)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30,trim=duration=${d4},setpts=PTS-STARTPTS,fade=t=in:st=0:d=0.38,fade=t=out:st=${f4}:d=0.42[v3];
      [v0][v1][v2][v3]concat=n=4:v=1:a=0[v];
      [4:a]afade=t=out:st=$(awk "BEGIN { printf \"%.2f\", $d1 + $d2 + $d3 + $d4 - 0.4 }"):d=0.4[a]" \
    -map '[v]' -map '[a]' -shortest \
    -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -movflags +faststart \
    -c:a aac -b:a 160k "$output"
}

render_video "$OUT/01-brand-intro.mp4" "$AUDIO/01-brand-intro.mp3" \
  "$FRAMES/01-brand-01.png" "$FRAMES/01-brand-02.png" "$FRAMES/01-brand-03.png" "$FRAMES/01-brand-04.png" \
  7 7 7 6.77
render_video "$OUT/02-tech-essentials.mp4" "$AUDIO/02-tech-essentials.mp3" \
  "$FRAMES/02-tech-01.png" "$FRAMES/02-tech-02.png" "$FRAMES/02-tech-03.png" "$FRAMES/02-tech-04.png" \
  7 7 7 6.61
render_video "$OUT/03-home-upgrade.mp4" "$AUDIO/03-home-upgrade.mp3" \
  "$FRAMES/03-home-01.png" "$FRAMES/03-home-02.png" "$FRAMES/03-home-03.png" "$FRAMES/03-home-04.png" \
  6.4 6.4 6.4 6.14

echo "Videos written to $OUT"
