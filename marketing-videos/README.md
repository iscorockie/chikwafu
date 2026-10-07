# Chikwafu Technology — Short-form marketing video campaign

Three ready-to-post vertical marketing videos for **Chikwafu Technology Ltd.** The campaign uses the store's supplied product photography, brand mark, existing customer contact details and original voice-over audio.

## Deliverables

| Video | Runtime | Primary message | File |
| --- | ---: | --- | --- |
| Brand introduction | 27.77 s | Smart choices, made simple | [`videos/01-brand-intro.mp4`](videos/01-brand-intro.mp4) |
| Tech essentials | 27.60 s | Power your day | [`videos/02-tech-essentials.mp4`](videos/02-tech-essentials.mp4) |
| Home upgrade | 25.33 s | A better home setup | [`videos/03-home-upgrade.mp4`](videos/03-home-upgrade.mp4) |

All final MP4s are **1080 × 1920**, 30 fps, H.264 video with AAC voice-over audio, ready for Reels, TikTok, WhatsApp Status, Facebook Stories and YouTube Shorts. Each ends with the existing Chikwafu phone number and sales email. There is no third-party music track, so the voice-over remains clear and the assets are easy to publish or edit further.

## Voice-over scripts

### 01 — Brand introduction

> Your everyday should feel easier. With Chikwafu Technology, find the appliances and tech that make home life work better. From the kitchen to your entertainment and power needs, shop genuine products at clear prices, with dependable warranty support. Order online, chat with us on WhatsApp, and choose technology that keeps up with your life. Chikwafu Technology. Smart choices, made simple.

### 02 — Tech essentials

> Power your day with tech you can trust. At Chikwafu Technology, discover headphones, speakers, smart devices, chargers, cables, and more, selected for the way you live, work, and move. No guesswork, no complicated shopping. Just genuine everyday technology, easy to find and easy to order. Explore Chikwafu Technology today.

### 03 — Home upgrade

> Ready for a better home setup? Discover fridges, cookers, washers, kitchen essentials, and the practical upgrades that make every day smoother. Chikwafu Technology brings you genuine appliances, transparent prices, and warranty support you can rely on. Shop from wherever you are, then get back to living well. Chikwafu Technology. Built for the way you live.

## Included production assets

- `audio/` — the three selected-voice MP3 voice overs.
- `frames/` — twelve editable 1080 × 1920 scene cards (four per video). They make it straightforward to swap a product image, call-to-action or price in a graphics editor.
- `scripts/create-frames.sh` — reproducibly creates the scene cards using the checked-in product photography and brand palette.
- `scripts/render-videos.sh` — joins scene cards, applies the subtle push-in and fades, then muxes the matching voice-over.

The visual references use facts already represented in the storefront: Chikwafu Technology Ltd., genuine products, transparent pricing, warranty support, WhatsApp ordering, **+256 780 844 098**, and **sales@chikwafu.ug**.

## Re-rendering

The final rendered files are included; re-render only when you change the copy, contact details, a product photo or scene design.

1. Install ImageMagick with WebP support and FFmpeg with `libx264`.
2. From the repository root, run:

   ```bash
   bash marketing-videos/scripts/create-frames.sh
   bash marketing-videos/scripts/render-videos.sh
   ```

`render-videos.sh` uses `ffmpeg` on `PATH`, or an explicit `FFMPEG=/path/to/ffmpeg` value. It also recognises the local `ffmpeg-static-electron` binary when one is present for development.
