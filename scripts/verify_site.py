#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Verify a minimal static offline app using only Python's standard library."""
from __future__ import annotations

import re
import sys
from pathlib import Path
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parents[1]
FILES = (
    "index.html", "style.css",
    "src/app.mjs", "src/core.mjs", "src/archive-store.mjs",
    "src/reply-reactor.mjs", "src/reply-reactor-ui.mjs",
    "vendor/vanillajs/gf3/index.js",
    "vendor/vanillajs/symbolic-events/index.js",
    "vendor/vanillajs/audio2d/index.js",
)

class Resources(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = []
        self.ids = set()

    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        if "id" in data:
            if data["id"] in self.ids:
                raise ValueError("duplicate id: " + data["id"])
            self.ids.add(data["id"])
        if tag in {"script", "link", "img"}:
            attr = "href" if tag == "link" else "src"
            if data.get(attr):
                self.paths.append(data[attr])

def verify(root: Path) -> None:
    for path in FILES:
        file = root / path
        if not file.is_file() or file.is_symlink():
            raise ValueError("missing/symlink runtime file: " + path)
        if file.stat().st_size > 160_000:
            raise ValueError("excessive runtime bytes: " + path)
    html = (root / "index.html").read_text(encoding="utf-8")
    js = (root / "src/app.mjs").read_text(encoding="utf-8")
    css = (root / "style.css").read_text(encoding="utf-8")
    parser = Resources()
    parser.feed(html)
    for path in parser.paths:
        if "://" in path or path.startswith("//"):
            raise ValueError("external runtime asset: " + path)
        actual = (root / path.lstrip("./")).resolve()
        if not actual.is_relative_to(root.resolve()) or not actual.is_file():
            raise ValueError("missing/escaping runtime asset: " + path)
    if "connect-src 'none'" not in html or "script-src 'self'" not in html:
        raise ValueError("offline CSP missing")
    if "from './core.mjs'" not in js or "from './archive-store.mjs'" not in js or "from './reply-reactor-ui.mjs'" not in js:
        raise ValueError("required source-owned ES module import missing")
    # Every executable module must resolve imports locally, including the
    # pinned VANILLAJS vendored modules; fail closed on escaping paths.
    for path in FILES:
        if not path.endswith((".mjs", ".js")):
            continue
        source = (root / path).read_text(encoding="utf-8")
        for spec in re.findall(r"""from\s+['"](\.[^'"]+)['"]""", source):
            target = ((root / path).parent / spec).resolve()
            if not target.is_relative_to(root.resolve()) or not target.is_file():
                raise ValueError("missing/escaping module import: " + path + " -> " + spec)
    if re.search(r"\b(fetch|XMLHttpRequest|WebSocket)\s*\(", js):
        raise ValueError("networking primitive in runtime")
    if "innerHTML" in js:
        raise ValueError("unsafe DOM HTML injection")
    if re.search(r"@import|url\s*\(\s*['\"]?https?://", css, re.I):
        raise ValueError("external CSS resource")
    print("PASS: 10 offline runtime files, local ES dependencies, CSP, DOM injection and resource bounds")

if __name__ == "__main__":
    verify(Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT)
