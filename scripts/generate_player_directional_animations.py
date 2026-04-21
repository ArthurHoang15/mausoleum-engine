#!/usr/bin/env python3
"""Generate the latest player strip with directional walk families."""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
LOCK_ROOT = ROOT / "art" / "review-packs" / "player-final-lock-01"
IDLE_FRAMES_ROOT = LOCK_ROOT / "runtime-frames" / "idle"
PACK_ROOT = ROOT / "art" / "review-packs" / "player-final-animations-02"
PUBLIC_PLAYER_ROOT = ROOT / "public" / "assets" / "pixel" / "sprites" / "player"

FRAME_SIZE = (48, 64)
FRAME_COUNT = 8
TRANSPARENT = (0, 0, 0, 0)
BG = (15, 18, 28, 255)
PANEL = (24, 30, 44, 255)
TEXT = (236, 239, 245, 255)
SUBTLE = (169, 178, 194, 255)
CYAN = (99, 225, 255, 210)
CYAN_SOFT = (99, 225, 255, 92)
CRIMSON = (127, 36, 65, 150)
GOLD = (214, 178, 84, 210)
DARK = (18, 16, 19, 235)
IVORY_SHADOW = (188, 176, 150, 220)


def mkdir(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def save_png(image: Image.Image, path: Path) -> None:
    mkdir(path.parent)
    image.save(path)


def load_idle_frames() -> list[Image.Image]:
    frames: list[Image.Image] = []
    for index in range(1, FRAME_COUNT + 1):
        path = IDLE_FRAMES_ROOT / f"{index:02}.png"
        frame = Image.open(path).convert("RGBA")
        if frame.size != FRAME_SIZE:
            raise ValueError(f"Expected {FRAME_SIZE}, got {frame.size}: {path}")
        frames.append(frame)
    return frames


def alpha_bbox(frame: Image.Image) -> tuple[int, int, int, int]:
    return frame.getchannel("A").getbbox() or (0, 0, FRAME_SIZE[0], FRAME_SIZE[1])


def offset_frame(frame: Image.Image, dx: int, dy: int) -> Image.Image:
    output = Image.new("RGBA", FRAME_SIZE, TRANSPARENT)
    output.alpha_composite(frame, (dx, dy))
    return output


def compose_strip(frames: list[Image.Image]) -> Image.Image:
    strip = Image.new("RGBA", (FRAME_SIZE[0] * len(frames), FRAME_SIZE[1]), TRANSPARENT)
    for index, frame in enumerate(frames):
        strip.alpha_composite(frame, (index * FRAME_SIZE[0], 0))
    return strip


def scale_nearest(image: Image.Image, scale: int) -> Image.Image:
    return image.resize((image.width * scale, image.height * scale), Image.Resampling.NEAREST)


def checkerboard(width: int, height: int, tile: int = 12) -> Image.Image:
    image = Image.new("RGBA", (width, height), BG)
    draw = ImageDraw.Draw(image)
    colors = ((18, 24, 36, 255), (24, 30, 44, 255))
    for top in range(0, height, tile):
        for left in range(0, width, tile):
            draw.rectangle(
                (left, top, left + tile - 1, top + tile - 1),
                fill=colors[((left // tile) + (top // tile)) % 2]
            )
    return image


def preview_sheet(name: str, frames: list[Image.Image], scale: int = 4) -> Image.Image:
    columns = 4
    rows = 2
    gap = 12
    title_h = 30
    cell_w = FRAME_SIZE[0] * scale
    cell_h = FRAME_SIZE[1] * scale
    width = 24 + columns * cell_w + (columns - 1) * gap
    height = title_h + 24 + rows * cell_h + (rows - 1) * gap
    image = checkerboard(width, height)
    draw = ImageDraw.Draw(image)
    draw.text((12, 8), name, fill=TEXT, font=ImageFont.load_default())

    for index, frame in enumerate(frames):
        row = index // columns
        column = index % columns
        left = 12 + column * (cell_w + gap)
        top = title_h + 12 + row * (cell_h + gap)
        image.alpha_composite(scale_nearest(frame, scale), (left, top))

    return image


def down_walk_frames(idle_frames: list[Image.Image]) -> list[Image.Image]:
    offsets = [(0, 0), (1, -1), (1, 0), (0, 1), (0, 0), (-1, -1), (-1, 0), (0, 1)]
    frames = []
    for index, frame in enumerate(idle_frames):
        moved = offset_frame(frame, *offsets[index])
        draw = ImageDraw.Draw(moved)
        _, _, right, bottom = alpha_bbox(frame)
        foot_y = min(FRAME_SIZE[1] - 2, bottom - 1)
        if index in (1, 2):
            draw.rectangle((right - 16, foot_y - 1, right - 12, foot_y), fill=GOLD)
        if index in (5, 6):
            draw.rectangle((right - 10, foot_y - 1, right - 6, foot_y), fill=GOLD)
        frames.append(moved)
    return frames


def up_walk_frames(idle_frames: list[Image.Image]) -> list[Image.Image]:
    offsets = [(0, 0), (-1, -1), (-1, 0), (0, 1), (0, 0), (1, -1), (1, 0), (0, 1)]
    frames = []
    for index, frame in enumerate(idle_frames):
        moved = offset_frame(frame, *offsets[index])
        draw = ImageDraw.Draw(moved)
        left, top, right, bottom = alpha_bbox(moved)
        hood_mid = (left + right) // 2
        # Make the same locked sprite read as a back view without changing its silhouette.
        draw.ellipse((hood_mid - 8, top + 10, hood_mid + 8, top + 27), fill=DARK)
        draw.arc((hood_mid - 11, top + 7, hood_mid + 11, top + 30), 200, 340, fill=IVORY_SHADOW, width=2)
        draw.rectangle((hood_mid - 3, top + 30, hood_mid + 3, top + 43), fill=CRIMSON)
        step_x = hood_mid - 6 if index in (1, 2, 3) else hood_mid + 5
        draw.rectangle((step_x, min(FRAME_SIZE[1] - 3, bottom - 3), step_x + 3, min(FRAME_SIZE[1] - 2, bottom - 2)), fill=GOLD)
        frames.append(moved)
    return frames


def right_walk_frames(down_frames: list[Image.Image]) -> list[Image.Image]:
    offsets = [0, 1, 2, 1, 0, -1, -2, -1]
    frames = []
    for index, frame in enumerate(down_frames):
        moved = offset_frame(frame, offsets[index], 0)
        draw = ImageDraw.Draw(moved)
        left, top, right, bottom = alpha_bbox(moved)
        face_x = min(FRAME_SIZE[0] - 8, right - 13)
        draw.rectangle((face_x, top + 20, face_x + 6, top + 27), fill=DARK)
        draw.rectangle((face_x + 5, top + 24, face_x + 7, top + 25), fill=CYAN)
        draw.line((max(0, left - 2), top + 34, max(0, left - 8), top + 39), fill=CRIMSON, width=2)
        step_x = right - 13 if index in (1, 2, 3) else right - 8
        draw.rectangle((step_x, min(FRAME_SIZE[1] - 3, bottom - 3), step_x + 3, min(FRAME_SIZE[1] - 2, bottom - 2)), fill=GOLD)
        frames.append(moved)
    return frames


def left_walk_frames(right_frames: list[Image.Image]) -> list[Image.Image]:
    return [ImageOps.mirror(frame) for frame in right_frames]


def dash_frames(idle_frames: list[Image.Image]) -> list[Image.Image]:
    offsets = [0, 2, 4, 5, 4, 2, 1, 0]
    frames = []
    for index, frame in enumerate(idle_frames):
        output = Image.new("RGBA", FRAME_SIZE, TRANSPARENT)
        left, top, _, _ = alpha_bbox(frame)
        draw = ImageDraw.Draw(output)
        trail_len = 4 + index
        for step in range(3):
            x0 = max(0, left - trail_len - step * 4)
            y0 = top + 18 + step * 7
            draw.rectangle((x0, y0, max(0, left - step * 3), y0 + 2), fill=CRIMSON)
        draw.rectangle((max(0, left - 7), top + 22, max(0, left - 1), top + 24), fill=CYAN_SOFT)
        output.alpha_composite(frame, (offsets[index], 0))
        frames.append(output)
    return frames


def scan_frames(idle_frames: list[Image.Image]) -> list[Image.Image]:
    radii = [5, 8, 12, 16, 20, 16, 12, 8]
    frames = []
    for index, frame in enumerate(idle_frames):
        output = frame.copy()
        draw = ImageDraw.Draw(output)
        cx, cy = 24, 35
        radius = radii[index]
        draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), outline=CYAN, width=1)
        draw.arc((cx - radius - 4, cy - radius - 4, cx + radius + 4, cy + radius + 4), 20, 160, fill=CYAN_SOFT, width=1)
        draw.line((cx, cy - radius, cx, cy - radius - 5), fill=CYAN_SOFT, width=1)
        draw.rectangle((cx - 1, cy - 1, cx + 1, cy + 1), fill=CYAN)
        frames.append(output)
    return frames


def interact_frames(idle_frames: list[Image.Image]) -> list[Image.Image]:
    reach = [0, 1, 2, 3, 3, 2, 1, 0]
    frames = []
    for index, frame in enumerate(idle_frames):
        output = frame.copy()
        draw = ImageDraw.Draw(output)
        _, top, right, _ = alpha_bbox(frame)
        hand_x = min(FRAME_SIZE[0] - 3, right - 8 + reach[index])
        hand_y = top + 31
        draw.rectangle((hand_x, hand_y, hand_x + 2, hand_y + 2), fill=GOLD)
        if index in (2, 3, 4):
            draw.line((hand_x + 3, hand_y + 1, min(FRAME_SIZE[0] - 1, hand_x + 8), hand_y + 1), fill=CYAN)
            draw.rectangle((min(FRAME_SIZE[0] - 7, hand_x + 7), hand_y - 3, min(FRAME_SIZE[0] - 3, hand_x + 11), hand_y + 3), outline=CYAN_SOFT)
        frames.append(offset_frame(output, 1 if index in (2, 3, 4) else 0, 0))
    return frames


def write_family(name: str, frames: list[Image.Image]) -> None:
    family_root = mkdir(PACK_ROOT / "frames" / name)
    for index, frame in enumerate(frames, start=1):
        save_png(frame, family_root / f"{index:02}.png")
    save_png(compose_strip(frames), PACK_ROOT / f"player-{name}-strip.png")
    save_png(preview_sheet(f"Player {name} 48x64", frames), PACK_ROOT / f"player-{name}-preview.png")


def render_board(families: dict[str, list[Image.Image]]) -> Image.Image:
    scale = 2
    cell_w = FRAME_SIZE[0] * scale
    cell_h = FRAME_SIZE[1] * scale
    gap = 8
    label_w = 112
    row_h = cell_h + gap
    width = label_w + FRAME_COUNT * (cell_w + gap) + 16
    height = 44 + len(families) * row_h + 24
    board = checkerboard(width, height, tile=10)
    draw = ImageDraw.Draw(board)
    draw.rectangle((0, 0, width, 42), fill=PANEL)
    draw.text((12, 12), "Player Final Animations 02 | directional runtime fallback", fill=TEXT, font=ImageFont.load_default())

    top = 52
    for name, frames in families.items():
        draw.text((12, top + cell_h // 2 - 4), name, fill=SUBTLE, font=ImageFont.load_default())
        for index, frame in enumerate(frames):
            left = label_w + index * (cell_w + gap)
            board.alpha_composite(scale_nearest(frame, scale), (left, top))
        top += row_h

    return board


def write_metadata(families: dict[str, list[Image.Image]]) -> None:
    metadata = {
        "pack_id": "player-final-animations-02",
        "status": "runtime-ready-directional-fallback",
        "source": "art/review-packs/player-final-lock-01/runtime-frames/idle",
        "note": "Generated locally from the locked SpriteCook idle. Directional walk families were added for top-down movement while preserving the final player design.",
        "frame_size": list(FRAME_SIZE),
        "anchor": "bottom-center",
        "runtime_key": "pixel-player-proxy",
        "runtime_strip": "public/assets/pixel/sprites/player/player-runtime-strip-v6.png",
        "families": {
            name: {
                "start": family_index * FRAME_COUNT,
                "count": FRAME_COUNT,
                "source": "repo-normalized fallback from locked idle"
            }
            for family_index, name in enumerate(families)
        }
    }
    (PACK_ROOT / "batch-metadata.json").write_text(
        json.dumps(metadata, indent=2),
        encoding="utf-8"
    )


def write_readme() -> None:
    readme = """# Player Final Animations 02

Latest runtime player animation pack.

## Families

- `idle`
- `walk-down`
- `walk-up`
- `walk-left`
- `walk-right`
- `dash`
- `scan`
- `interact`

All families use `8` frames at `48x64`, bottom-center anchor.

The runtime strip is `public/assets/pixel/sprites/player/player-runtime-strip-v6.png`.

These are local directional fallbacks from the locked SpriteCook idle source. Replace with SpriteCook animation outputs when credits are available.
"""
    (PACK_ROOT / "README.md").write_text(readme, encoding="utf-8")


def main() -> None:
    idle = load_idle_frames()
    walk_down = down_walk_frames(idle)
    walk_up = up_walk_frames(idle)
    walk_right = right_walk_frames(walk_down)
    walk_left = left_walk_frames(walk_right)
    families = {
        "idle": idle,
        "walk-down": walk_down,
        "walk-up": walk_up,
        "walk-left": walk_left,
        "walk-right": walk_right,
        "dash": dash_frames(idle),
        "scan": scan_frames(idle),
        "interact": interact_frames(idle)
    }

    mkdir(PACK_ROOT)
    for name, frames in families.items():
        if len(frames) != FRAME_COUNT:
            raise ValueError(f"{name} expected {FRAME_COUNT} frames, got {len(frames)}")
        if any(frame.size != FRAME_SIZE for frame in frames):
            raise ValueError(f"{name} contains a frame that is not {FRAME_SIZE}")
        write_family(name, frames)

    runtime_strip = compose_strip([frame for frames in families.values() for frame in frames])
    save_png(runtime_strip, PACK_ROOT / "player-runtime-strip-v6.png")
    save_png(runtime_strip, PUBLIC_PLAYER_ROOT / "player-runtime-strip-v6.png")
    save_png(render_board(families), PACK_ROOT / "player-animation-board.png")
    write_metadata(families)
    write_readme()


if __name__ == "__main__":
    main()
