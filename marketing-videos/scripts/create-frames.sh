#!/usr/bin/env bash
# Generates the editable 1080 × 1920 scene cards for the Chikwafu short-form campaign.
# Run from the repository root: bash marketing-videos/scripts/create-frames.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUT="$ROOT/marketing-videos/frames"
mkdir -p "$OUT"

FONT="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
MARK="$ROOT/public/brand/apple-touch-icon.png"

BG="#0a0a0f"
PANEL="#18181f"
CARD="#1c1c25"
TEXT="#f0f0f5"
MUTED="#b6b6c8"
ACCENT="#00e5a0"

# Start a scene with the campaign's dark base, a softened mint glow, and a restrained top brand lockup.
base() {
  local output="$1"
  convert -size 1080x1920 "xc:${BG}" \
    \( -size 1080x1920 xc:none -fill 'rgba(0,229,160,0.13)' -draw 'circle 945,190 945,-175' -blur 0x115 \) -composite \
    \( -size 1080x1920 xc:none -fill 'rgba(0,229,160,0.07)' -draw 'circle 100,1725 100,1510' -blur 0x95 \) -composite \
    \( "$MARK" -resize 68x68 \) -geometry +64+64 -composite \
    -font "$BOLD" -fill "$TEXT" -pointsize 36 -gravity NorthWest -annotate +155+78 'CHIKWAFU' \
    -font "$FONT" -fill "$MUTED" -pointsize 16 -gravity NorthWest -annotate +158+123 'TECHNOLOGY LTD.' \
    "$output"
}

# Deliberately use product photography already supplied with the storefront. Most tech product images
# sit on a white field, so a white product tile makes that source art look intentional instead of cut out.
white_tile() {
  local scene="$1" image="$2" width="$3" height="$4" x="$5" y="$6"
  convert "$scene" \
    \( -size "${width}x${height}" "xc:#f6f7f7" -stroke '#ffffff' -strokewidth 3 -fill none -draw "roundrectangle 2,2 $((width-3)),$((height-3)) 38,38" \) -geometry "+${x}+${y}" -composite \
    \( "$image" -resize "$((width-50))x$((height-50))" -background '#f6f7f7' -gravity center -extent "$((width-50))x$((height-50))" +repage \) -gravity NorthWest -geometry "+$((x+25))+$((y+25))" -composite \
    "$scene"
}

dark_tile() {
  local scene="$1" image="$2" width="$3" height="$4" x="$5" y="$6"
  convert "$scene" \
    \( -size "${width}x${height}" "xc:${CARD}" -stroke 'rgba(255,255,255,0.16)' -strokewidth 2 -fill none -draw "roundrectangle 1,1 $((width-2)),$((height-2)) 38,38" \) -geometry "+${x}+${y}" -composite \
    \( "$image" -resize "$((width-22))x$((height-22))" -gravity center -extent "$((width-22))x$((height-22))" +repage \) -gravity NorthWest -geometry "+$((x+11))+$((y+11))" -composite \
    "$scene"
}

# Brand video — scene 1
base "$OUT/01-brand-01.png"
convert "$OUT/01-brand-01.png" \
  -font "$BOLD" -fill "$ACCENT" -pointsize 21 -gravity NorthWest -annotate +68+286 'SMART LIVING STARTS HERE' \
  -font "$BOLD" -fill "$TEXT" -pointsize 92 -gravity NorthWest -interline-spacing -14 -annotate +64+350 'SMART\nCHOICES,\nMADE SIMPLE.' \
  -font "$FONT" -fill "$MUTED" -pointsize 31 -gravity NorthWest -interline-spacing 8 -annotate +70+688 'Everyday tech and home upgrades\nfor the way you live.' \
  -font "$FONT" -fill "$ACCENT" -pointsize 19 -gravity NorthWest -annotate +70+823 'GENUINE  •  CLEAR  •  DEPENDABLE' \
  \( "$ROOT/public/products/kettle.webp" -resize 825x825 \) -geometry +130+905 -composite \
  -font "$FONT" -fill "$MUTED" -pointsize 22 -gravity SouthWest -annotate +68+66 'SHOP ONLINE  /  CHAT ON WHATSAPP' \
  "$OUT/01-brand-01.png"

# Brand video — scene 2
base "$OUT/01-brand-02.png"
white_tile "$OUT/01-brand-02.png" "$ROOT/public/ayne/anker-soundcore-space-one-headphone.webp" 438 540 576 652
dark_tile "$OUT/01-brand-02.png" "$ROOT/public/products/blender.webp" 438 540 66 652
convert "$OUT/01-brand-02.png" \
  -font "$BOLD" -fill "$ACCENT" -pointsize 20 -gravity NorthWest -annotate +68+282 'TECH THAT FITS YOUR DAY' \
  -font "$BOLD" -fill "$TEXT" -pointsize 71 -gravity NorthWest -interline-spacing -8 -annotate +64+340 'HOME.\nWORK. PLAY.' \
  -font "$FONT" -fill "$MUTED" -pointsize 27 -gravity NorthWest -interline-spacing 7 -annotate +70+538 'Find practical technology for the\nrooms, routines and moments that matter.' \
  -font "$BOLD" -fill "$TEXT" -pointsize 25 -gravity NorthWest -annotate +90+1225 'HOME ESSENTIALS' \
  -font "$BOLD" -fill "$TEXT" -pointsize 25 -gravity NorthWest -annotate +602+1225 'EVERYDAY TECH' \
  -font "$FONT" -fill "$ACCENT" -pointsize 19 -gravity SouthWest -annotate +68+66 'CHIKWAFU TECHNOLOGY LTD.' \
  "$OUT/01-brand-02.png"

# Brand video — scene 3
base "$OUT/01-brand-03.png"
convert "$OUT/01-brand-03.png" \
  -font "$BOLD" -fill "$ACCENT" -pointsize 20 -gravity NorthWest -annotate +68+290 'SHOP WITH CONFIDENCE' \
  -font "$BOLD" -fill "$TEXT" -pointsize 68 -gravity NorthWest -interline-spacing -8 -annotate +64+350 'THE DETAILS\nMATTER.' \
  \( -size 944x188 "xc:${CARD}" -stroke 'rgba(255,255,255,0.13)' -strokewidth 2 -fill none -draw 'roundrectangle 1,1 942,186 30,30' \) -geometry +68+650 -composite \
  \( -size 944x188 "xc:${CARD}" -stroke 'rgba(255,255,255,0.13)' -strokewidth 2 -fill none -draw 'roundrectangle 1,1 942,186 30,30' \) -geometry +68+882 -composite \
  \( -size 944x188 "xc:${CARD}" -stroke 'rgba(255,255,255,0.13)' -strokewidth 2 -fill none -draw 'roundrectangle 1,1 942,186 30,30' \) -geometry +68+1114 -composite \
  -fill "$ACCENT" -draw 'circle 126,743 126,708' -draw 'circle 126,975 126,940' -draw 'circle 126,1207 126,1172' \
  -font "$BOLD" -fill "$TEXT" -pointsize 34 -gravity NorthWest -annotate +190+708 'GENUINE PRODUCTS' \
  -font "$FONT" -fill "$MUTED" -pointsize 24 -gravity NorthWest -annotate +190+757 'Technology selected for real life.' \
  -font "$BOLD" -fill "$TEXT" -pointsize 34 -gravity NorthWest -annotate +190+940 'CLEAR PRICES' \
  -font "$FONT" -fill "$MUTED" -pointsize 24 -gravity NorthWest -annotate +190+989 'Know what you are getting before you buy.' \
  -font "$BOLD" -fill "$TEXT" -pointsize 34 -gravity NorthWest -annotate +190+1172 'WARRANTY SUPPORT' \
  -font "$FONT" -fill "$MUTED" -pointsize 24 -gravity NorthWest -annotate +190+1221 'Support that stays with your purchase.' \
  -font "$FONT" -fill "$ACCENT" -pointsize 19 -gravity SouthWest -annotate +68+66 'MADE FOR KAMPALA. DELIVERED WITH CARE.' \
  "$OUT/01-brand-03.png"

# Brand video — scene 4
base "$OUT/01-brand-04.png"
convert "$OUT/01-brand-04.png" \
  -font "$BOLD" -fill "$ACCENT" -pointsize 20 -gravity NorthWest -annotate +68+314 'READY WHEN YOU ARE' \
  -font "$BOLD" -fill "$TEXT" -pointsize 82 -gravity NorthWest -interline-spacing -10 -annotate +64+380 'MAKE THE\nSMART CHOICE.' \
  -font "$FONT" -fill "$MUTED" -pointsize 30 -gravity NorthWest -interline-spacing 7 -annotate +70+625 'Browse online, send a message,\nand bring home technology that works.' \
  \( -size 944x220 "xc:${ACCENT}" -stroke 'rgba(255,255,255,0.42)' -strokewidth 2 -fill none -draw 'roundrectangle 1,1 942,218 42,42' \) -geometry +68+1000 -composite \
  -font "$BOLD" -fill "$BG" -pointsize 36 -gravity NorthWest -annotate +125+1068 'SHOP  •  WHATSAPP  •  CALL' \
  -font "$BOLD" -fill "$TEXT" -pointsize 46 -gravity NorthWest -annotate +70+1355 '+256 780 844 098' \
  -font "$FONT" -fill "$MUTED" -pointsize 24 -gravity NorthWest -annotate +74+1420 'sales@chikwafu.ug' \
  \( "$MARK" -resize 180x180 \) -geometry +450+1550 -composite \
  -font "$BOLD" -fill "$TEXT" -pointsize 38 -gravity South -annotate +0+110 'CHIKWAFU TECHNOLOGY' \
  -font "$FONT" -fill "$MUTED" -pointsize 19 -gravity South -annotate +0+74 'TECH THAT WORKS BEAUTIFULLY FROM DAY ONE.' \
  "$OUT/01-brand-04.png"

# Tech video — scene 1
base "$OUT/02-tech-01.png"
white_tile "$OUT/02-tech-01.png" "$ROOT/public/ayne/anker-soundcore-space-one-headphone.webp" 840 770 120 925
convert "$OUT/02-tech-01.png" \
  -font "$BOLD" -fill "$ACCENT" -pointsize 20 -gravity NorthWest -annotate +68+290 'EVERYDAY TECH, ELEVATED' \
  -font "$BOLD" -fill "$TEXT" -pointsize 82 -gravity NorthWest -interline-spacing -10 -annotate +64+350 'POWER\nYOUR DAY.' \
  -font "$FONT" -fill "$MUTED" -pointsize 30 -gravity NorthWest -interline-spacing 7 -annotate +70+600 'For work, movement, downtime\nand everything in between.' \
  -font "$BOLD" -fill "$BG" -pointsize 32 -gravity North -annotate +0+143 'SOUND  /  SMART DEVICES  /  POWER' \
  -font "$FONT" -fill "$ACCENT" -pointsize 19 -gravity SouthWest -annotate +68+66 'CHIKWAFU TECHNOLOGY LTD.' \
  "$OUT/02-tech-01.png"

# Tech video — scene 2
base "$OUT/02-tech-02.png"
white_tile "$OUT/02-tech-02.png" "$ROOT/public/ayne/anker-charger-336-powerport-67w-usb-c-gan-charger-a2674.webp" 438 525 66 760
white_tile "$OUT/02-tech-02.png" "$ROOT/public/ayne/green-lion-50000-mah-power-bank-100-w.webp" 438 525 576 760
convert "$OUT/02-tech-02.png" \
  -font "$BOLD" -fill "$ACCENT" -pointsize 20 -gravity NorthWest -annotate +68+290 'STAY CONNECTED' \
  -font "$BOLD" -fill "$TEXT" -pointsize 72 -gravity NorthWest -interline-spacing -8 -annotate +64+350 'CHARGE.\nCONNECT. GO.' \
  -font "$FONT" -fill "$MUTED" -pointsize 28 -gravity NorthWest -interline-spacing 7 -annotate +70+540 'Chargers, cables and power you can\nreach for every single day.' \
  -font "$BOLD" -fill "$TEXT" -pointsize 25 -gravity NorthWest -annotate +88+1325 'FAST CHARGING' \
  -font "$BOLD" -fill "$TEXT" -pointsize 25 -gravity NorthWest -annotate +601+1325 'POWER ON THE GO' \
  -font "$FONT" -fill "$ACCENT" -pointsize 19 -gravity SouthWest -annotate +68+66 'GREAT TECH SHOULD FEEL EASY.' \
  "$OUT/02-tech-02.png"

# Tech video — scene 3
base "$OUT/02-tech-03.png"
white_tile "$OUT/02-tech-03.png" "$ROOT/public/ayne/anker-soundcore-motion-300-portable-bluetooth-speaker.webp" 840 690 120 880
convert "$OUT/02-tech-03.png" \
  -font "$BOLD" -fill "$ACCENT" -pointsize 20 -gravity NorthWest -annotate +68+290 'BRING THE SOUND' \
  -font "$BOLD" -fill "$TEXT" -pointsize 76 -gravity NorthWest -interline-spacing -8 -annotate +64+350 'TECH THAT\nKEEPS UP.' \
  -font "$FONT" -fill "$MUTED" -pointsize 29 -gravity NorthWest -interline-spacing 7 -annotate +70+555 'Sound, gear and smart essentials\nselected for how you actually live.' \
  -font "$BOLD" -fill "$BG" -pointsize 35 -gravity North -annotate +0+200 'WORK  •  MOVE  •  PLAY' \
  -font "$FONT" -fill "$ACCENT" -pointsize 19 -gravity SouthWest -annotate +68+66 'FIND YOUR EVERYDAY TECH.' \
  "$OUT/02-tech-03.png"

# Tech video — scene 4
base "$OUT/02-tech-04.png"
convert "$OUT/02-tech-04.png" \
  \( "$ROOT/public/ayne/anker-soundcore-space-one-headphone.webp" -resize 480x480 -background '#f6f7f7' -gravity center -extent 480x480 +repage \) -gravity NorthWest -geometry +300+580 -composite \
  -font "$BOLD" -fill "$ACCENT" -pointsize 20 -gravity North -annotate +0+290 'THE CHIKWAFU TECH EDIT' \
  -font "$BOLD" -fill "$TEXT" -pointsize 76 -gravity North -interline-spacing -8 -annotate +0+355 'FIND YOUR\nEVERYDAY TECH.' \
  -font "$FONT" -fill "$MUTED" -pointsize 28 -gravity NorthWest -interline-spacing 7 -annotate +196+1118 'Genuine products. Easy ordering.\nHelp when you need it.' \
  \( -size 820x178 "xc:${ACCENT}" -stroke 'rgba(255,255,255,0.42)' -strokewidth 2 -fill none -draw 'roundrectangle 1,1 818,176 38,38' \) -geometry +130+1240 -composite \
  -font "$BOLD" -fill "$BG" -pointsize 31 -gravity NorthWest -annotate +188+1310 'SHOP ONLINE  •  CHAT ON WHATSAPP' \
  -font "$BOLD" -fill "$TEXT" -pointsize 39 -gravity South -annotate +0+116 'CHIKWAFU TECHNOLOGY' \
  -font "$FONT" -fill "$MUTED" -pointsize 19 -gravity South -annotate +0+76 '+256 780 844 098  •  sales@chikwafu.ug' \
  "$OUT/02-tech-04.png"

# Home video — scene 1
base "$OUT/03-home-01.png"
dark_tile "$OUT/03-home-01.png" "$ROOT/public/jumia/fridge-hisense270.webp" 840 760 120 930
convert "$OUT/03-home-01.png" \
  -font "$BOLD" -fill "$ACCENT" -pointsize 20 -gravity NorthWest -annotate +68+290 'MAKE ROOM FOR BETTER DAYS' \
  -font "$BOLD" -fill "$TEXT" -pointsize 80 -gravity NorthWest -interline-spacing -10 -annotate +64+350 'A BETTER\nHOME SETUP.' \
  -font "$FONT" -fill "$MUTED" -pointsize 29 -gravity NorthWest -interline-spacing 7 -annotate +70+600 'Appliances that make everyday\nlife feel simpler from the start.' \
  -font "$BOLD" -fill "$TEXT" -pointsize 29 -gravity North -annotate +0+142 'HOME UPGRADES START HERE' \
  -font "$FONT" -fill "$ACCENT" -pointsize 19 -gravity SouthWest -annotate +68+66 'CHIKWAFU TECHNOLOGY LTD.' \
  "$OUT/03-home-01.png"

# Home video — scene 2
base "$OUT/03-home-02.png"
dark_tile "$OUT/03-home-02.png" "$ROOT/public/products/kettle.webp" 438 520 66 745
dark_tile "$OUT/03-home-02.png" "$ROOT/public/products/blender.webp" 438 520 576 745
convert "$OUT/03-home-02.png" \
  -font "$BOLD" -fill "$ACCENT" -pointsize 20 -gravity NorthWest -annotate +68+290 'THE DAILY ESSENTIALS' \
  -font "$BOLD" -fill "$TEXT" -pointsize 72 -gravity NorthWest -interline-spacing -8 -annotate +64+350 'SIMPLE.\nUSEFUL. READY.' \
  -font "$FONT" -fill "$MUTED" -pointsize 28 -gravity NorthWest -interline-spacing 7 -annotate +70+545 'The pieces that help your kitchen\nand home run beautifully.' \
  -font "$BOLD" -fill "$TEXT" -pointsize 25 -gravity NorthWest -annotate +92+1313 'KITCHEN ESSENTIALS' \
  -font "$BOLD" -fill "$TEXT" -pointsize 25 -gravity NorthWest -annotate +620+1313 'EVERYDAY HELPERS' \
  -font "$FONT" -fill "$ACCENT" -pointsize 19 -gravity SouthWest -annotate +68+66 'MAKE EVERYDAY EASIER.' \
  "$OUT/03-home-02.png"

# Home video — scene 3
base "$OUT/03-home-03.png"
dark_tile "$OUT/03-home-03.png" "$ROOT/public/jumia/cooker-spark5050.webp" 840 655 120 870
convert "$OUT/03-home-03.png" \
  -font "$BOLD" -fill "$ACCENT" -pointsize 20 -gravity NorthWest -annotate +68+290 'CHOOSE WITH CONFIDENCE' \
  -font "$BOLD" -fill "$TEXT" -pointsize 72 -gravity NorthWest -interline-spacing -8 -annotate +64+350 'GENUINE.\nCLEAR. SUPPORTED.' \
  -font "$FONT" -fill "$MUTED" -pointsize 28 -gravity NorthWest -interline-spacing 7 -annotate +70+550 'Transparent prices and warranty\nsupport you can rely on.' \
  \( -size 840x142 "xc:${ACCENT}" -stroke 'rgba(255,255,255,0.35)' -strokewidth 2 -fill none -draw 'roundrectangle 1,1 838,140 34,34' \) -geometry +120+1598 -composite \
  -font "$BOLD" -fill "$BG" -pointsize 27 -gravity NorthWest -annotate +221+1648 'SHOP FROM WHEREVER YOU ARE' \
  -font "$FONT" -fill "$ACCENT" -pointsize 19 -gravity SouthWest -annotate +68+66 'SMART APPLIANCES. REAL SUPPORT.' \
  "$OUT/03-home-03.png"

# Home video — scene 4
base "$OUT/03-home-04.png"
convert "$OUT/03-home-04.png" \
  \( "$ROOT/public/products/ricecooker.webp" -resize 560x560 \) -geometry +260+635 -composite \
  -font "$BOLD" -fill "$ACCENT" -pointsize 20 -gravity North -annotate +0+290 'LIVING WELL STARTS AT HOME' \
  -font "$BOLD" -fill "$TEXT" -pointsize 76 -gravity North -interline-spacing -8 -annotate +0+350 'BUILT FOR\nTHE WAY YOU LIVE.' \
  -font "$FONT" -fill "$MUTED" -pointsize 28 -gravity NorthWest -interline-spacing 7 -annotate +270+1108 'Find your next essential, then\nget back to what matters most.' \
  \( -size 820x178 "xc:${ACCENT}" -stroke 'rgba(255,255,255,0.42)' -strokewidth 2 -fill none -draw 'roundrectangle 1,1 818,176 38,38' \) -geometry +130+1240 -composite \
  -font "$BOLD" -fill "$BG" -pointsize 31 -gravity NorthWest -annotate +188+1310 'SHOP ONLINE  •  CHAT ON WHATSAPP' \
  -font "$BOLD" -fill "$TEXT" -pointsize 39 -gravity South -annotate +0+116 'CHIKWAFU TECHNOLOGY' \
  -font "$FONT" -fill "$MUTED" -pointsize 19 -gravity South -annotate +0+76 '+256 780 844 098  •  sales@chikwafu.ug' \
  "$OUT/03-home-04.png"

echo "Scene cards written to $OUT"
