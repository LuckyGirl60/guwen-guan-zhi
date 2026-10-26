#!/usr/bin/env python3
from __future__ import annotations
"""Render deterministic sentence learning cards without external AI services."""

import argparse
import json
import os
from pathlib import Path
from textwrap import wrap

from PIL import Image, ImageDraw, ImageFont


WIDTH, HEIGHT = 1280, 720
BACKGROUND = (249, 244, 232)
INK = (49, 42, 34)
MUTED = (112, 101, 87)
RED = (145, 55, 39)
TEAL = (39, 91, 84)
GOLD = (184, 135, 55)


def pick_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        r"C:\Windows\Fonts\NotoSerifSC-VF.ttf",
        r"C:\Windows\Fonts\msyhbd.ttc" if bold else r"C:\Windows\Fonts\msyh.ttc",
        r"C:\Windows\Fonts\simsunb.ttf" if bold else r"C:\Windows\Fonts\simsun.ttc",
        "/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc",
    ]
    for candidate in candidates:
        if os.path.exists(candidate):
            return ImageFont.truetype(candidate, size=size)
    return ImageFont.load_default()


def text_width(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont) -> int:
    if hasattr(draw, "textlength"):
        return int(draw.textlength(text, font=font))
    return int(draw.textsize(text, font=font)[0])


def text_height(font: ImageFont.FreeTypeFont) -> int:
    if hasattr(font, "getbbox"):
        box = font.getbbox("国")
        return int(box[3] - box[1])
    return int(font.getsize("国")[1])


def draw_wrapped(draw: ImageDraw.ImageDraw, text: str, xy: tuple[int, int], font: ImageFont.FreeTypeFont, fill, max_width: int, line_gap: int = 12) -> int:
    x, y = xy
    line = ""
    lines = []
    for char in text:
        candidate = line + char
        if text_width(draw, candidate, font) > max_width and line:
            lines.append(line)
            line = char
        else:
            line = candidate
    if line:
        lines.append(line)
    line_height = text_height(font)
    for item in lines:
        draw.text((x, y), item, font=font, fill=fill)
        y += line_height + line_gap
    return y


def render_card(article: dict, sentence: dict, index: int, output: Path) -> None:
    image = Image.new("RGB", (WIDTH, HEIGHT), BACKGROUND)
    draw = ImageDraw.Draw(image)
    draw.rectangle((36, 36, WIDTH - 36, HEIGHT - 36), fill=(255, 252, 244), outline=(229, 216, 189), width=3)
    draw.ellipse((WIDTH - 260, -120, WIDTH + 90, 230), fill=(244, 231, 202))
    draw.ellipse((WIDTH - 170, -40, WIDTH + 30, 160), outline=(184, 135, 55), width=5)
    draw.rectangle((80, 92, 94, HEIGHT - 92), fill=RED)

    small = pick_font(24)
    number = pick_font(30, bold=True)
    title = pick_font(30, bold=True)
    sentence_font = pick_font(58, bold=True)
    translation_font = pick_font(28)
    hint_font = pick_font(22)

    draw.text((130, 92), "古文观止 · 逐句学习", font=small, fill=TEAL)
    draw.text((WIDTH - 205, 92), f"{index + 1:02d} / {len(article['sentences']):02d}", font=number, fill=RED)
    draw.text((130, 145), article["title"], font=title, fill=INK)
    draw.text((130, 190), "原文", font=small, fill=GOLD)
    y = draw_wrapped(draw, sentence["text"], (130, 235), sentence_font, RED, WIDTH - 280, 16)
    draw.line((130, y + 12, WIDTH - 130, y + 12), fill=(229, 216, 189), width=2)
    draw.text((130, y + 42), "白话", font=small, fill=GOLD)
    y = draw_wrapped(draw, sentence["translation"], (130, y + 84), translation_font, INK, WIDTH - 280, 12)
    draw.text((130, HEIGHT - 105), "思考：" + sentence["hint"], font=hint_font, fill=MUTED)
    image.save(output, format="PNG", optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--article", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    article = json.loads(Path(args.article).read_text(encoding="utf-8"))
    output = Path(args.out)
    output.mkdir(parents=True, exist_ok=True)
    rendered = []
    for index, sentence in enumerate(article["sentences"]):
        filename = f"sentence-{index + 1:03d}.png"
        render_card(article, sentence, index, output / filename)
        rendered.append({"sentenceId": sentence["id"], "path": filename, "width": WIDTH, "height": HEIGHT})
    (output / "render-info.json").write_text(json.dumps({"renderer": "Pillow", "cards": rendered}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
