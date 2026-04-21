#!/usr/bin/env python3
"""Lock the SpriteCook player idle asset and export a 48x64 runtime strip."""

from __future__ import annotations

import json
import shutil
from collections import Counter, deque
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = ROOT / "art" / "review-packs" / "player"
PACK_ROOT = ROOT / "art" / "review-packs" / "player-final-lock-01"

SOURCE_PNG = SOURCE_ROOT / "character_idle.png"
SOURCE_WEBP = SOURCE_ROOT / "character_idle.webp"

FRAME_SOURCE_SIZE = 94
SOURCE_FRAME_COUNT = 8
RUNTIME_FRAME_SIZE = (48, 64)

TRANSPARENT = (0, 0, 0, 0)
BG = (15, 18, 28, 255)
PANEL = (24, 30, 44, 255)
BORDER = (74, 91, 122, 255)
TEXT = (236, 239, 245, 255)
SUBTLE = (169, 178, 194, 255)
CYAN = (107, 222, 255, 255)


def mkdir(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def save_png(image: Image.Image, path: Path) -> None:
    mkdir(path.parent)
    image.save(path)


def copy_source_assets() -> None:
    mkdir(PACK_ROOT / "source")
    shutil.copy2(SOURCE_PNG, PACK_ROOT / "source" / "character_idle.png")
    shutil.copy2(SOURCE_WEBP, PACK_ROOT / "source" / "character_idle.webp")


def flood_remove_background(image: Image.Image, tolerance: int = 10) -> Image.Image:
    rgba = image.convert("RGBA")
    px = rgba.load()
    width, height = rgba.size
    base = px[0, 0][:3]
    seen: set[tuple[int, int]] = set()
    queue = deque()

    for x in range(width):
      queue.append((x, 0))
      queue.append((x, height - 1))
    for y in range(height):
      queue.append((0, y))
      queue.append((width - 1, y))

    while queue:
        x, y = queue.popleft()
        if (x, y) in seen or not (0 <= x < width and 0 <= y < height):
            continue
        seen.add((x, y))
        r, g, b, a = px[x, y]
        if a == 0:
            continue
        if max(abs(r - base[0]), abs(g - base[1]), abs(b - base[2])) <= tolerance:
            px[x, y] = (r, g, b, 0)
            queue.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

    return rgba


def crop_visible(image: Image.Image, padding: int = 2) -> Image.Image:
    bbox = image.getchannel("A").getbbox()
    if not bbox:
        return image
    left, top, right, bottom = bbox
    return image.crop(
        (
            max(0, left - padding),
            max(0, top - padding),
            min(image.width, right + padding),
            min(image.height, bottom + padding)
        )
    )


def normalize_frame(frame: Image.Image) -> Image.Image:
    cleaned = flood_remove_background(frame)
    cropped = crop_visible(cleaned, padding=2)
    target_w, target_h = RUNTIME_FRAME_SIZE
    max_w = target_w - 4
    max_h = target_h - 3
    ratio = min(max_w / cropped.width, max_h / cropped.height)
    scaled = cropped.resize(
        (max(1, int(cropped.width * ratio)), max(1, int(cropped.height * ratio))),
        Image.Resampling.LANCZOS
    )
    scaled = scaled.quantize(
        colors=32,
        method=Image.Quantize.FASTOCTREE,
        dither=Image.Dither.NONE
    ).convert("RGBA")

    normalized = Image.new("RGBA", RUNTIME_FRAME_SIZE, TRANSPARENT)
    left = (target_w - scaled.width) // 2
    top = target_h - scaled.height
    normalized.alpha_composite(scaled, (left, top))
    return normalized


def extract_source_frames() -> list[Image.Image]:
    strip = Image.open(SOURCE_PNG).convert("RGBA")
    if strip.width % SOURCE_FRAME_COUNT != 0:
        raise ValueError("character_idle.png width is not divisible by 8 frames")
    frame_width = strip.width // SOURCE_FRAME_COUNT
    if frame_width != FRAME_SOURCE_SIZE or strip.height != FRAME_SOURCE_SIZE:
        raise ValueError(f"Expected 94x94 source frames, got {frame_width}x{strip.height}")

    frames = [
        strip.crop((index * frame_width, 0, (index + 1) * frame_width, strip.height))
        for index in range(SOURCE_FRAME_COUNT)
    ]

    webp = Image.open(SOURCE_WEBP)
    if getattr(webp, "n_frames", 1) != SOURCE_FRAME_COUNT:
        raise ValueError("character_idle.webp must contain 8 frames")

    return frames


def compose_strip(frames: list[Image.Image]) -> Image.Image:
    width = sum(frame.width for frame in frames)
    height = max(frame.height for frame in frames)
    strip = Image.new("RGBA", (width, height), TRANSPARENT)
    left = 0
    for frame in frames:
        strip.alpha_composite(frame, (left, 0))
        left += frame.width
    return strip


def scale_nearest(image: Image.Image, scale: int) -> Image.Image:
    return image.resize((image.width * scale, image.height * scale), Image.Resampling.NEAREST)


def checkerboard(width: int, height: int, tile: int = 12) -> Image.Image:
    image = Image.new("RGBA", (width, height), BG)
    draw = ImageDraw.Draw(image)
    swatches = ((18, 24, 36, 255), (24, 30, 44, 255))
    for top in range(0, height, tile):
        for left in range(0, width, tile):
            color = swatches[((left // tile) + (top // tile)) % 2]
            draw.rectangle((left, top, left + tile - 1, top + tile - 1), fill=color)
    return image


def compose_preview(frames: list[Image.Image], columns: int, scale: int, title: str) -> Image.Image:
    rows = (len(frames) + columns - 1) // columns
    cell_w = RUNTIME_FRAME_SIZE[0] * scale
    cell_h = RUNTIME_FRAME_SIZE[1] * scale
    gap = 12
    title_h = 28
    width = columns * cell_w + (columns - 1) * gap + 24
    height = title_h + rows * cell_h + (rows - 1) * gap + 24
    preview = checkerboard(width, height, tile=12)
    draw = ImageDraw.Draw(preview)
    draw.text((12, 8), title, fill=TEXT, font=ImageFont.load_default())

    for index, frame in enumerate(frames):
        scaled = scale_nearest(frame, scale)
        row = index // columns
        column = index % columns
        left = 12 + column * (cell_w + gap) + (cell_w - scaled.width) // 2
        top = title_h + 12 + row * (cell_h + gap) + (cell_h - scaled.height) // 2
        preview.alpha_composite(scaled, (left, top))

    return preview


def extract_palette(frames: list[Image.Image], count: int = 10) -> list[tuple[int, int, int]]:
    pixels: list[tuple[int, int, int, int]] = []
    for frame in frames:
        px = frame.load()
        for y in range(frame.height):
            for x in range(frame.width):
                pixel = px[x, y]
                if pixel[3] > 0 and sum(pixel[:3]) > 32:
                    pixels.append(pixel)

    buckets = Counter((r // 16 * 16, g // 16 * 16, b // 16 * 16) for r, g, b, _ in pixels)
    return [color for color, _ in buckets.most_common(count)]


def render_lock_board(source_frames: list[Image.Image], runtime_frames: list[Image.Image]) -> Image.Image:
    board = Image.new("RGBA", (960, 540), BG)
    draw = ImageDraw.Draw(board)
    font = ImageFont.load_default()
    draw.text((24, 20), "Player Final Lock 01 | SpriteCook Source", fill=TEXT, font=font)
    draw.text((24, 40), "Approved source: character_idle.png + character_idle.webp", fill=SUBTLE, font=font)

    draw.rectangle((24, 76, 936, 256), fill=PANEL, outline=BORDER, width=2)
    draw.text((40, 92), "Source 94x94 idle frames", fill=SUBTLE, font=font)
    for index, frame in enumerate(source_frames):
        thumb = scale_nearest(flood_remove_background(frame), 1)
        board.alpha_composite(thumb, (42 + index * 108, 124))

    draw.rectangle((24, 286, 936, 510), fill=PANEL, outline=BORDER, width=2)
    draw.text((40, 302), "Runtime-normalized 48x64 frames, 3x review", fill=SUBTLE, font=font)
    for index, frame in enumerate(runtime_frames):
        thumb = scale_nearest(frame, 3)
        board.alpha_composite(thumb, (42 + index * 108, 332))

    palette = extract_palette(runtime_frames, 8)
    for index, color in enumerate(palette):
        draw.rectangle((744 + index * 22, 302, 764 + index * 22, 322), fill=color)

    return board


def write_metadata(runtime_frames: list[Image.Image]) -> None:
    metadata = {
        "pack_id": "player-final-lock-01",
        "source": {
            "png": "source/character_idle.png",
            "webp": "source/character_idle.webp",
            "source_frame_size": [FRAME_SOURCE_SIZE, FRAME_SOURCE_SIZE],
            "source_frame_count": SOURCE_FRAME_COUNT
        },
        "final_design_lock": {
            "status": "locked",
            "source_of_truth": "SpriteCook character_idle asset",
            "must_keep_traits": [
                "hooded ivory reliquary cowl",
                "dark face and underframe",
                "cyan chest gem",
                "burgundy/crimson cloak and lower cloth",
                "muted gold trim",
                "compact vulnerable pilgrim silhouette"
            ],
            "must_avoid": [
                "generic fantasy king or goblin drift",
                "new crown motif",
                "gore or body-horror detail",
                "costume redesign between animations"
            ]
        },
        "runtime": {
            "frame_size": list(RUNTIME_FRAME_SIZE),
            "anchor": "bottom-center",
            "runtime_key": "pixel-player-proxy",
            "strip_path": "art/review-packs/player-final-lock-01/player-runtime-strip-v4.png",
            "superseded_runtime_strip": "public/assets/pixel/sprites/player/player-runtime-strip-v6.png",
            "animation_ranges": {
                "idle": {"start": 0, "count": 8, "source": "SpriteCook idle"},
                "walk": {
                    "start": 8,
                    "count": 8,
                    "source": "temporary idle reuse",
                    "review_status": "needs-spritecook-walk"
                }
            }
        },
        "asset_checks": {
            "png_width_divisible_by_8": True,
            "webp_has_8_frames": True,
            "normalized_frames_are_48x64": all(frame.size == RUNTIME_FRAME_SIZE for frame in runtime_frames)
        }
    }
    (PACK_ROOT / "player-final-lock-metadata.json").write_text(
        json.dumps(metadata, indent=2),
        encoding="utf-8"
    )


def write_prompt_handoff() -> None:
    prompt = """# Player Final SpriteCook Handoff

Use the approved `source/character_idle.png` and `source/character_idle.webp` as the visual source of truth.

## Required identity
- hooded ivory reliquary cowl
- dark face and mechanical underframe
- cyan chest gem
- burgundy/crimson cloak and lower cloth
- muted gold trim
- compact vulnerable pilgrim silhouette

## SpriteCook prompts

### player-final-idle
```text
Create an 8-frame idle animation strip for the exact same MAUSOLEUM ENGINE player character shown in the approved reference: hooded ivory reliquary cowl, dark face and underframe, cyan chest gem, burgundy/crimson cloak and lower cloth, muted gold trim, compact vulnerable pilgrim silhouette. Keep the same proportions, same side-facing playground read, same costume, same palette, transparent background, fixed scale, no text, no UI, no scenery, no redesign.
```

### player-final-walk
```text
Create an 8-frame walk animation strip for the exact same MAUSOLEUM ENGINE player character shown in the approved reference: hooded ivory reliquary cowl, dark face and underframe, cyan chest gem, burgundy/crimson cloak and lower cloth, muted gold trim, compact vulnerable pilgrim silhouette. Keep the same proportions and costume in every frame. One facing direction, transparent background, fixed scale, no text, no UI, no scenery, no redesign.
```

### player-final-dash
```text
Create an 8-frame dash animation strip for the exact same MAUSOLEUM ENGINE player character shown in the approved reference. Preserve the hooded ivory cowl, dark underframe, cyan chest gem, burgundy cloak, and muted gold trim. Add only a short crimson cloak motion and subtle cyan core streak. One facing direction, transparent background, fixed scale, no new costume details, no scenery.
```

### player-final-scan
```text
Create an 8-frame scan animation strip for the exact same MAUSOLEUM ENGINE player character shown in the approved reference. Preserve the hooded ivory cowl, dark underframe, cyan chest gem, burgundy cloak, and muted gold trim. The cyan chest gem and face optics emit a clean sacred-machine scan pulse. One facing direction, transparent background, fixed scale, no new costume details, no scenery.
```

### player-final-interact
```text
Create an 8-frame interact animation strip for the exact same MAUSOLEUM ENGINE player character shown in the approved reference. Preserve the hooded ivory cowl, dark underframe, cyan chest gem, burgundy cloak, and muted gold trim. The character makes a small terminal reach or relic-touch gesture. One facing direction, transparent background, fixed scale, no new costume details, no scenery.
```
"""
    (PACK_ROOT / "spritecook-player-final-prompts.md").write_text(prompt, encoding="utf-8")


def main() -> None:
    if not SOURCE_PNG.exists() or not SOURCE_WEBP.exists():
        raise FileNotFoundError("Expected character_idle.png and character_idle.webp in art/review-packs/player")

    mkdir(PACK_ROOT)
    copy_source_assets()

    source_frames = extract_source_frames()
    runtime_idle_frames = [normalize_frame(frame) for frame in source_frames]
    runtime_walk_frames = [frame.copy() for frame in runtime_idle_frames]
    runtime_strip = compose_strip(runtime_idle_frames + runtime_walk_frames)

    mkdir(PACK_ROOT / "source-frames" / "idle")
    mkdir(PACK_ROOT / "runtime-frames" / "idle")
    mkdir(PACK_ROOT / "runtime-frames" / "walk-temp")

    for index, frame in enumerate(source_frames, start=1):
        save_png(flood_remove_background(frame), PACK_ROOT / "source-frames" / "idle" / f"{index:02}.png")
    for index, frame in enumerate(runtime_idle_frames, start=1):
        save_png(frame, PACK_ROOT / "runtime-frames" / "idle" / f"{index:02}.png")
    for index, frame in enumerate(runtime_walk_frames, start=1):
        save_png(frame, PACK_ROOT / "runtime-frames" / "walk-temp" / f"{index:02}.png")

    save_png(compose_strip(runtime_idle_frames), PACK_ROOT / "player-idle-48x64-strip.png")
    save_png(compose_strip(runtime_walk_frames), PACK_ROOT / "player-walk-temp-48x64-strip.png")
    save_png(runtime_strip, PACK_ROOT / "player-runtime-strip-v4.png")
    save_png(compose_preview(runtime_idle_frames, 4, 4, "Player final idle 48x64"), PACK_ROOT / "player-idle-preview.png")
    save_png(compose_preview(runtime_walk_frames, 4, 4, "Player final walk-temp 48x64"), PACK_ROOT / "player-walk-temp-preview.png")
    save_png(render_lock_board(source_frames, runtime_idle_frames), PACK_ROOT / "player-final-lock-board.png")

    write_metadata(runtime_idle_frames)
    write_prompt_handoff()


if __name__ == "__main__":
    main()
