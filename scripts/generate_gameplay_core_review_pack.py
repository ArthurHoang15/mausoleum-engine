#!/usr/bin/env python3
"""Generate gameplay core review-pack sprites for MAUSOLEUM ENGINE."""

from __future__ import annotations

import json
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
REVIEW_ROOT = ROOT / "art" / "review-packs" / "gameplay-core-batch-01"

TRANSPARENT = (0, 0, 0, 0)
OUTLINE = (14, 18, 30, 255)
SHADOW = (8, 10, 18, 180)
STEEL_DARK = (44, 53, 70, 255)
STEEL = (64, 76, 97, 255)
STEEL_LIGHT = (112, 130, 158, 255)
IVORY = (234, 236, 242, 255)
IVORY_SHADE = (191, 196, 209, 255)
CRIMSON_DARK = (99, 33, 44, 255)
CRIMSON = (149, 49, 64, 255)
CRIMSON_LIGHT = (183, 73, 86, 255)
GOLD_DARK = (127, 95, 48, 255)
GOLD = (206, 167, 92, 255)
GOLD_LIGHT = (239, 219, 165, 255)
CYAN_DARK = (65, 111, 139, 255)
CYAN = (126, 204, 247, 255)
CYAN_LIGHT = (212, 244, 255, 255)
VIOLET_DARK = (68, 68, 119, 255)
VIOLET = (112, 118, 177, 255)
VIOLET_LIGHT = (184, 196, 255, 255)
EMBER = (255, 160, 96, 255)


@dataclass(frozen=True)
class ClipSpec:
    entity: str
    family: str
    width: int
    height: int
    frame_count: int
    anchor: str
    runtime_key: str
    review_status: str
    generator: Callable[[int, int], Image.Image]


def mkdir(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def rect(draw: ImageDraw.ImageDraw, x: int, y: int, w: int, h: int, fill: tuple[int, int, int, int]) -> None:
    draw.rectangle((x, y, x + w - 1, y + h - 1), fill=fill)


def pixel(img: Image.Image, x: int, y: int, fill: tuple[int, int, int, int]) -> None:
    if 0 <= x < img.width and 0 <= y < img.height:
        img.putpixel((x, y), fill)


def mirrored_points(points: list[tuple[int, int]], center_x: int) -> list[tuple[int, int]]:
    mirrored: list[tuple[int, int]] = []
    for x, y in points:
        mirrored.append((x, y))
        mirrored.append((center_x + (center_x - x), y))
    return mirrored


def new_frame(width: int, height: int) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    image = Image.new("RGBA", (width, height), TRANSPARENT)
    return image, ImageDraw.Draw(image)


def save_frame(frame: Image.Image, path: Path) -> None:
    mkdir(path.parent)
    frame.save(path)


def compose_strip(frames: list[Image.Image]) -> Image.Image:
    width = sum(frame.width for frame in frames)
    height = max(frame.height for frame in frames)
    strip = Image.new("RGBA", (width, height), TRANSPARENT)
    offset_x = 0
    for frame in frames:
        strip.alpha_composite(frame, (offset_x, 0))
        offset_x += frame.width
    return strip


def checkerboard(width: int, height: int, tile: int = 8) -> Image.Image:
    board = Image.new("RGBA", (width, height), (18, 22, 33, 255))
    draw = ImageDraw.Draw(board)
    colors = ((20, 25, 39, 255), (30, 36, 54, 255))
    for top in range(0, height, tile):
        for left in range(0, width, tile):
            color = colors[((left // tile) + (top // tile)) % 2]
            rect(draw, left, top, tile, tile, color)
    return board


def compose_preview(frames: list[Image.Image], columns: int = 4, scale: int = 4) -> Image.Image:
    rows = (len(frames) + columns - 1) // columns
    frame_w = max(frame.width for frame in frames) * scale
    frame_h = max(frame.height for frame in frames) * scale
    gap = 10
    width = columns * frame_w + (columns - 1) * gap
    height = rows * frame_h + (rows - 1) * gap
    preview = checkerboard(width, height, tile=12)
    for index, frame in enumerate(frames):
        scaled = frame.resize((frame.width * scale, frame.height * scale), Image.Resampling.NEAREST)
        row = index // columns
        column = index % columns
        left = column * (frame_w + gap) + (frame_w - scaled.width) // 2
        top = row * (frame_h + gap) + (frame_h - scaled.height) // 2
        preview.alpha_composite(scaled, (left, top))
    return preview


def draw_seed_card(board: Image.Image, title: str, native: Image.Image, left: int, top: int, width: int, height: int) -> None:
    draw = ImageDraw.Draw(board)
    card_fill = (10, 15, 25, 255)
    border = (63, 81, 110, 255)
    rect(draw, left, top, width, height, card_fill)
    draw.rectangle((left, top, left + width - 1, top + height - 1), outline=border, width=2)

    font = ImageFont.load_default()
    draw.text((left + 12, top + 10), title, fill=IVORY, font=font)
    draw.text((left + 12, top + 28), "native", fill=STEEL_LIGHT, font=font)
    native_x = left + 18
    native_y = top + 50
    board.alpha_composite(native, (native_x, native_y))

    draw.text((left + 12, top + 102), "2x review", fill=STEEL_LIGHT, font=font)
    scaled = native.resize((native.width * 2, native.height * 2), Image.Resampling.NEAREST)
    scaled_x = left + (width - scaled.width) // 2
    scaled_y = top + 126
    board.alpha_composite(scaled, (scaled_x, scaled_y))


def player_frame(index: int, total: int) -> Image.Image:
    img, draw = new_frame(24, 32)
    bob = [0, 1, 0, 1, 0, 1][index % 6]
    sway = [-1, 0, 1, 0, -1, 0][index % 6]

    rect(draw, 7, 29, 10, 2, SHADOW)
    rect(draw, 9 + sway, 4 + bob, 6, 2, IVORY_SHADE)
    rect(draw, 8 + sway, 6 + bob, 8, 4, STEEL_DARK)
    rect(draw, 10 + sway, 7 + bob, 4, 2, IVORY)
    rect(draw, 7 + sway, 10 + bob, 10, 3, STEEL)
    rect(draw, 6 + sway, 12 + bob, 12, 4, CRIMSON_DARK)
    rect(draw, 7 + sway, 13 + bob, 10, 10, CRIMSON)
    rect(draw, 6 + sway, 13 + bob, 2, 9, GOLD_DARK)
    rect(draw, 16 + sway, 13 + bob, 2, 8, STEEL_DARK)
    rect(draw, 10 + sway, 13 + bob, 4, 1, GOLD_LIGHT)
    rect(draw, 11 + sway, 14 + bob, 2, 2, GOLD)
    rect(draw, 7 + sway, 16 + bob, 1, 8, STEEL_DARK)
    rect(draw, 16 + sway, 18 + bob, 1, 7, STEEL_DARK)
    rect(draw, 8 + sway, 22 + bob, 9, 2, CRIMSON_LIGHT)
    rect(draw, 7 + sway, 24 + bob, 4, 5, STEEL_DARK)
    rect(draw, 13 + sway, 24 + bob, 3, 5, STEEL_DARK)
    rect(draw, 16 + sway, 22 + bob, 2, 5, CRIMSON_DARK)
    rect(draw, 17 + sway, 14 + bob, 1, 6, GOLD_LIGHT)
    return img


def player_idle(index: int, total: int) -> Image.Image:
    return player_frame(index, total)


def player_walk(index: int, total: int) -> Image.Image:
    img = player_frame(index, total)
    draw = ImageDraw.Draw(img)
    bob = [0, 1, 0, 1, 0, 1][index % 6]
    swing = [-1, 0, 1, 1, 0, -1][index % 6]
    rect(draw, 8 + swing, 24 + bob, 2, 5, STEEL_LIGHT)
    rect(draw, 14 - swing, 24 + bob, 2, 5, STEEL_LIGHT)
    rect(draw, 7 + swing, 22 + bob, 4, 2, CRIMSON_LIGHT)
    rect(draw, 13 - swing, 22 + bob, 4, 2, CRIMSON_LIGHT)
    rect(draw, 16 - swing, 21 + bob, 2, 5, CRIMSON_DARK)
    return img


def player_dash(index: int, total: int) -> Image.Image:
    img, draw = new_frame(24, 32)
    shift = [0, 1, 2, 1][index]
    rect(draw, 5, 29, 12, 2, SHADOW)
    rect(draw, 8 + shift, 4, 6, 2, IVORY_SHADE)
    rect(draw, 6 + shift, 6, 8, 4, STEEL_DARK)
    rect(draw, 8 + shift, 7, 4, 2, IVORY)
    rect(draw, 5 + shift, 10, 10, 3, STEEL)
    rect(draw, 4 + shift, 12, 12, 4, CRIMSON_DARK)
    rect(draw, 5 + shift, 13, 10, 9, CRIMSON)
    rect(draw, 3 + shift, 13, 2, 8, GOLD_DARK)
    rect(draw, 15 - shift, 14, 4 + shift, 7, CRIMSON_LIGHT)
    rect(draw, 16 - shift, 14, 2, 6, GOLD_LIGHT)
    rect(draw, 8 + shift, 13, 4, 1, GOLD_LIGHT)
    rect(draw, 10 + shift, 14, 2, 2, GOLD)
    rect(draw, 6 + shift, 21, 3, 7, STEEL_DARK)
    rect(draw, 12 + shift, 22, 3, 6, STEEL_DARK)
    return img


def player_scan(index: int, total: int) -> Image.Image:
    img = player_frame(index, total)
    draw = ImageDraw.Draw(img)
    pulse = [0, 1, 2, 1][index]
    rect(draw, 16, 13, 2, 8, GOLD)
    rect(draw, 18, 13, 2, 2, GOLD_LIGHT)
    rect(draw, 18, 11 - pulse, 1, 2 + pulse, CYAN_LIGHT)
    rect(draw, 17, 10 - pulse, 3, 1, CYAN)
    rect(draw, 17, 15 + pulse, 3, 1, CYAN)
    rect(draw, 19, 12, 2, 2, CYAN_DARK)
    pixel(img, 18, 12, CYAN)
    pixel(img, 18, 14, CYAN)
    return img


def player_interact(index: int, total: int) -> Image.Image:
    img = player_frame(index, total)
    draw = ImageDraw.Draw(img)
    extend = [0, 1, 2, 1][index]
    rect(draw, 16, 16, 3 + extend, 2, GOLD_DARK)
    rect(draw, 17, 17, 3 + extend, 1, GOLD)
    rect(draw, 19 + extend, 16, 1, 2, GOLD_LIGHT)
    rect(draw, 8, 23, 3, 6, STEEL_LIGHT)
    return img


def draw_drone_core(draw: ImageDraw.ImageDraw, x: int, y: int, glow: tuple[int, int, int, int], wing_shift: int) -> None:
    rect(draw, x + 1, y + 1, 4, 4, CYAN_DARK)
    rect(draw, x + 2, y, 2, 6, CYAN)
    rect(draw, x, y + 2, 6, 2, CYAN)
    rect(draw, x + 2, y + 2, 2, 2, CYAN_LIGHT)
    rect(draw, x - 2 - wing_shift, y + 2, 2, 2, IVORY_SHADE)
    rect(draw, x + 6 + wing_shift, y + 2, 2, 2, IVORY_SHADE)
    rect(draw, x + 2, y - 1, 2, 1, GOLD_LIGHT)


def drone_seed(index: int, total: int) -> Image.Image:
    img, draw = new_frame(16, 16)
    rect(draw, 4, 13, 8, 1, SHADOW)
    draw_drone_core(draw, 5, 5, CYAN, 0)
    rect(draw, 2, 6, 1, 4, CYAN_LIGHT)
    rect(draw, 13, 6, 1, 4, CYAN_LIGHT)
    rect(draw, 4, 4, 1, 1, VIOLET_LIGHT)
    rect(draw, 11, 4, 1, 1, VIOLET_LIGHT)
    return img


def drone_hover(index: int, total: int) -> Image.Image:
    img, draw = new_frame(16, 16)
    bob = [0, 1, 0, 1][index]
    rect(draw, 4, 13, 8, 1, SHADOW)
    draw_drone_core(draw, 5, 4 + bob, CYAN, 0)
    rect(draw, 2, 5 + bob, 1, 4, CYAN_LIGHT)
    rect(draw, 13, 5 + bob, 1, 4, CYAN_LIGHT)
    rect(draw, 6, 3 + bob, 4, 1, GOLD_LIGHT)
    rect(draw, 4, 4 + bob, 1, 1, VIOLET_LIGHT)
    rect(draw, 11, 4 + bob, 1, 1, VIOLET_LIGHT)
    return img


def drone_patrol(index: int, total: int) -> Image.Image:
    img, draw = new_frame(16, 16)
    offset = [-1, 0, 1, 0][index]
    rect(draw, 4, 13, 8, 1, SHADOW)
    draw_drone_core(draw, 5 + offset, 5, CYAN, abs(offset))
    rect(draw, 2 + offset, 6, 1, 4, CYAN_LIGHT)
    rect(draw, 13 + offset, 6, 1, 4, CYAN_LIGHT)
    rect(draw, 6 + offset, 4, 4, 1, GOLD)
    rect(draw, 4 + offset, 5, 1, 1, VIOLET_LIGHT)
    rect(draw, 11 + offset, 5, 1, 1, VIOLET_LIGHT)
    return img


def drone_alert(index: int, total: int) -> Image.Image:
    img, draw = new_frame(16, 16)
    flare = [0, 1, 2, 1][index]
    rect(draw, 3, 13, 10, 1, SHADOW)
    draw_drone_core(draw, 5, 5, CYAN_LIGHT, 0)
    rect(draw, 2 - flare, 5, 1 + flare, 6, CYAN)
    rect(draw, 13, 5, 1 + flare, 6, CYAN)
    rect(draw, 5, 3, 6, 1, GOLD_LIGHT)
    rect(draw, 6, 2, 4, 1, GOLD)
    rect(draw, 4 - flare, 4, 1 + flare, 1, VIOLET_LIGHT)
    rect(draw, 11, 4, 1 + flare, 1, VIOLET_LIGHT)
    return img


def warden_seed(index: int, total: int) -> Image.Image:
    img, draw = new_frame(48, 64)
    rect(draw, 16, 58, 16, 3, SHADOW)
    rect(draw, 22, 8, 4, 6, IVORY)
    rect(draw, 20, 14, 8, 5, IVORY_SHADE)
    rect(draw, 18, 19, 12, 5, GOLD_LIGHT)
    rect(draw, 16, 24, 16, 12, VIOLET_DARK)
    rect(draw, 14, 36, 20, 18, VIOLET)
    rect(draw, 17, 54, 14, 4, VIOLET_LIGHT)
    for x, y in mirrored_points([(15, 18), (13, 19), (11, 21), (9, 24), (8, 27), (7, 30)], 23):
        pixel(img, x, y, GOLD_LIGHT)
    for x, y in mirrored_points([(14, 23), (12, 26), (10, 30), (9, 34), (8, 38), (7, 42)], 23):
        pixel(img, x, y, VIOLET_LIGHT)
    rect(draw, 23, 18, 2, 30, GOLD_DARK)
    return img


def warden_float(index: int, total: int) -> Image.Image:
    img = warden_seed(index, total)
    bob = [0, 1, 0, 1][index]
    if bob:
        shifted = Image.new("RGBA", img.size, TRANSPARENT)
        shifted.alpha_composite(img, (0, -1))
        img = shifted
    return img


def warden_manifest(index: int, total: int) -> Image.Image:
    img = warden_seed(index, total)
    draw = ImageDraw.Draw(img)
    flare = [0, 1, 2, 1][index]
    for step in range(flare + 1):
        rect(draw, 8 - step, 16 - step, 2, 20 + step * 2, GOLD_LIGHT)
        rect(draw, 38 + step, 16 - step, 2, 20 + step * 2, GOLD_LIGHT)
    rect(draw, 21, 7, 6, 2, CYAN_LIGHT)
    rect(draw, 20, 9, 8, 1, CYAN)
    return img


def warden_hunt(index: int, total: int) -> Image.Image:
    img, draw = new_frame(48, 64)
    lean = [0, 1, 2, 3, 2, 1][index]
    rect(draw, 14, 58, 20, 3, SHADOW)
    rect(draw, 22 + lean, 10, 4, 6, IVORY)
    rect(draw, 20 + lean, 16, 8, 4, IVORY_SHADE)
    rect(draw, 18 + lean, 20, 12, 5, GOLD_LIGHT)
    rect(draw, 17 + lean, 25, 14, 11, VIOLET_DARK)
    rect(draw, 12 + lean, 36, 22, 18, VIOLET)
    rect(draw, 16 + lean, 54, 14, 4, VIOLET_LIGHT)
    for x, y in mirrored_points([(13, 20), (10, 22), (8, 25), (6, 29), (5, 34), (4, 39)], 23 + lean):
        pixel(img, x, y, GOLD)
    for x, y in mirrored_points([(14, 27), (11, 31), (9, 36), (8, 42)], 23 + lean):
        pixel(img, x, y, VIOLET_LIGHT)
    rect(draw, 23 + lean, 19, 2, 32, GOLD_DARK)
    return img


def scan_pulse(index: int, total: int) -> Image.Image:
    img, draw = new_frame(32, 32)
    radius = [4, 7, 10, 13][index]
    center = 16
    rect(draw, center - 1, center - 1, 2, 2, CYAN_LIGHT)
    for offset in range(radius):
        alpha = max(50, 180 - offset * 12)
        color = (CYAN[0], CYAN[1], CYAN[2], alpha)
        pixel(img, center - radius, center - offset, color)
        pixel(img, center - radius, center + offset, color)
        pixel(img, center + radius, center - offset, color)
        pixel(img, center + radius, center + offset, color)
        pixel(img, center - offset, center - radius, color)
        pixel(img, center + offset, center - radius, color)
        pixel(img, center - offset, center + radius, color)
        pixel(img, center + offset, center + radius, color)
    rect(draw, 4 + index, 4 + index, 2, 2, GOLD_LIGHT)
    rect(draw, 26 - index, 4 + index, 2, 2, GOLD_LIGHT)
    rect(draw, 4 + index, 26 - index, 2, 2, GOLD_LIGHT)
    rect(draw, 26 - index, 26 - index, 2, 2, GOLD_LIGHT)
    return img


CLIPS = [
    ClipSpec("player", "idle", 24, 32, 4, "bottom-center", "pixel-player-proxy", "pending-review", player_idle),
    ClipSpec("player", "walk", 24, 32, 6, "bottom-center", "pixel-player-proxy", "pending-review", player_walk),
    ClipSpec("player", "dash", 24, 32, 4, "bottom-center", "pixel-player-proxy", "pending-review", player_dash),
    ClipSpec("player", "scan", 24, 32, 4, "bottom-center", "pixel-player-proxy", "pending-review", player_scan),
    ClipSpec("player", "interact", 24, 32, 4, "bottom-center", "pixel-player-proxy", "pending-review", player_interact),
    ClipSpec("drone", "hover", 16, 16, 4, "center", "pixel-drone-proxy", "pending-review", drone_hover),
    ClipSpec("drone", "patrol", 16, 16, 4, "center", "pixel-drone-proxy", "pending-review", drone_patrol),
    ClipSpec("drone", "alert", 16, 16, 4, "center", "pixel-drone-proxy", "pending-review", drone_alert),
    ClipSpec("warden", "float", 48, 64, 4, "lower-center", "pixel-warden-proxy", "pending-review", warden_float),
    ClipSpec("warden", "manifest", 48, 64, 4, "lower-center", "pixel-warden-proxy", "pending-review", warden_manifest),
    ClipSpec("warden", "hunt", 48, 64, 6, "lower-center", "pixel-warden-proxy", "pending-review", warden_hunt),
    ClipSpec("fx", "scan-pulse", 32, 32, 4, "center", "pixel-scan-fx-proxy", "pending-review", scan_pulse),
]


def save_animation(spec: ClipSpec, frames: list[Image.Image]) -> dict[str, object]:
    entity_root = mkdir(REVIEW_ROOT / spec.entity)
    frame_root = mkdir(entity_root / "frames" / spec.family)
    for index, frame in enumerate(frames, start=1):
        save_frame(frame, frame_root / f"{index:02d}.png")

    strip = compose_strip(frames)
    preview = compose_preview(frames, columns=min(4, len(frames)), scale=4)
    strip_name = f"{spec.entity}-{spec.family}-strip.png"
    preview_name = f"{spec.entity}-{spec.family}-preview.png"
    save_frame(strip, entity_root / strip_name)
    save_frame(preview, entity_root / preview_name)

    return {
        "source_family_name": f"{spec.entity}/{spec.family}",
        "frame_size": [spec.width, spec.height],
        "frame_count": spec.frame_count,
        "anchor": spec.anchor,
        "intended_runtime_key": spec.runtime_key,
        "review_status": spec.review_status,
        "strip_path": str((entity_root / strip_name).relative_to(REVIEW_ROOT)).replace("\\", "/"),
        "preview_path": str((entity_root / preview_name).relative_to(REVIEW_ROOT)).replace("\\", "/"),
    }


def write_seed_board(player_seed: Image.Image, drone_seed_img: Image.Image, warden_seed_img: Image.Image) -> None:
    board = checkerboard(930, 300, tile=16)
    draw_seed_card(board, "Player seed", player_seed, 24, 24, 278, 252)
    draw_seed_card(board, "Drone seed", drone_seed_img, 326, 24, 278, 252)
    draw_seed_card(board, "Warden seed", warden_seed_img, 628, 24, 278, 252)
    save_frame(board, REVIEW_ROOT / "seed-board.png")


def write_readme() -> None:
    content = """# Gameplay Core Batch 01

This review pack contains the first production-oriented sacred-noir pixel sprite batch for MAUSOLEUM ENGINE.

Contents:
- triad seed board for player, drone, and Warden
- normalized frame directories for each animation family
- native strips for each family
- enlarged preview sheets for review
- metadata manifest with runtime key mapping

This batch is review-first. It does not replace runtime assets yet.
"""
    (REVIEW_ROOT / "README.md").write_text(content, encoding="utf-8")


def main() -> None:
    if REVIEW_ROOT.exists():
        shutil.rmtree(REVIEW_ROOT)
    mkdir(REVIEW_ROOT)

    player_seed = player_idle(0, 4)
    drone_seed_img = drone_seed(0, 4)
    warden_seed_img = warden_seed(0, 4)

    save_frame(player_seed, REVIEW_ROOT / "player" / "player-seed.png")
    save_frame(drone_seed_img, REVIEW_ROOT / "drone" / "drone-seed.png")
    save_frame(warden_seed_img, REVIEW_ROOT / "warden" / "warden-seed.png")

    manifest: dict[str, object] = {
        "batch_id": "gameplay-core-batch-01",
        "style": "sacred-noir",
        "output_mode": "review-pack-first",
        "review_gate": "triad-seed-review",
        "entities": {},
    }

    entities: dict[str, list[dict[str, object]]] = {
        "player": [],
        "drone": [],
        "warden": [],
        "fx": [],
    }

    for spec in CLIPS:
        frames = [spec.generator(index, spec.frame_count) for index in range(spec.frame_count)]
        entities[spec.entity].append(save_animation(spec, frames))

    manifest["entities"] = entities
    manifest["seeds"] = {
        "player": {
            "frame_size": [24, 32],
            "anchor": "bottom-center",
            "intended_runtime_key": "pixel-player-proxy",
            "review_status": "pending-triad-review",
            "path": "player/player-seed.png",
        },
        "drone": {
            "frame_size": [16, 16],
            "anchor": "center",
            "intended_runtime_key": "pixel-drone-proxy",
            "review_status": "pending-triad-review",
            "path": "drone/drone-seed.png",
        },
        "warden": {
            "frame_size": [48, 64],
            "anchor": "lower-center",
            "intended_runtime_key": "pixel-warden-proxy",
            "review_status": "pending-triad-review",
            "path": "warden/warden-seed.png",
        },
    }

    write_seed_board(player_seed, drone_seed_img, warden_seed_img)
    write_readme()
    (REVIEW_ROOT / "batch-metadata.json").write_text(
        json.dumps(manifest, indent=2),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
