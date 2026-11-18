#!/usr/bin/env python3
"""Inline all CSS and JS references in index.html to produce a single self-contained HTML file."""
import re
import os
import sys
from pathlib import Path

OUT_DIR = Path("/home/z/my-project/out")
HTML_FILE = OUT_DIR / "index.html"
SINGLE_FILE = Path("/home/z/my-project/download/in-the-crowd.html")

def read_file(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        print(f"WARN: could not read {path}: {e}")
        return ""

def inline_css(html):
    """Replace <link rel="stylesheet" href="/_next/..."> with <style>...</style>"""
    def replace(m):
        href = m.group(1)
        if href.startswith("/"):
            local = OUT_DIR / href.lstrip("/")
        else:
            local = OUT_DIR / href
        css = read_file(local)
        if css:
            return f"<style>{css}</style>"
        return m.group(0)
    return re.sub(r'<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*/?>', replace, html)

def inline_js(html):
    """Replace <script src="/_next/..."></script> with <script>...</script>"""
    def replace(m):
        src = m.group(1)
        if src.startswith("http"):
            return m.group(0)  # keep CDN scripts
        if src.startswith("/"):
            local = OUT_DIR / src.lstrip("/")
        else:
            local = OUT_DIR / src
        js = read_file(local)
        if js:
            # Preserve type attribute if present
            return f"<script>{js}</script>"
        return m.group(0)
    # Match script tags with src attribute (self-closing or with </script>)
    return re.sub(r'<script[^>]*src="([^"]+)"[^>]*>\s*</script>', replace, html)

def inline_icons(html):
    """Convert icon links to data URIs so they work without external files."""
    def replace_link(m):
        href = m.group(1)
        if href.startswith("http"):
            return m.group(0)
        local = OUT_DIR / href.lstrip("/") if href.startswith("/") else OUT_DIR / href
        if not local.exists():
            return m.group(0)
        data = read_file(local)
        if not data:
            return m.group(0)
        if href.endswith(".svg"):
            import urllib.parse
            encoded = urllib.parse.quote(data, safe="")
            return m.group(0).replace(href, f"data:image/svg+xml,{encoded}")
        return m.group(0)
    return re.sub(r'<link[^>]*href="([^"]+\.svg)"[^>]*/?>', replace_link, html)

def remove_manifest(html):
    """Remove the manifest link (can't be inlined easily; the app still works without it)."""
    html = re.sub(r'<link[^>]*rel="manifest"[^>]*/?>', '', html)
    return html

def disable_sw(html):
    """Remove service worker registration (won't work from a single HTML file)."""
    # The SW registration is in a script tag — remove it
    html = re.sub(r'<script[^>]*>[^<]*navigator\.serviceWorker[^<]*</script>', '', html, flags=re.DOTALL)
    return html

def main():
    html = read_file(HTML_FILE)
    if not html:
        print("ERROR: could not read index.html")
        sys.exit(1)

    print(f"Original size: {len(html):,} chars")

    # Inline CSS
    html = inline_css(html)
    # Inline JS
    html = inline_js(html)
    # Inline icons as data URIs
    html = inline_icons(html)
    # Remove manifest link (app works without it)
    html = remove_manifest(html)
    # Disable SW registration (can't work from single file)
    html = disable_sw(html)

    # Add a comment at the top
    html = f"<!-- In the Crowd — single-file deploy. Upload this one file to GitHub or any static host. -->\n" + html

    SINGLE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(SINGLE_FILE, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"Final size: {len(html):,} chars ({len(html)/1024:.1f} KB)")
    print(f"Written to: {SINGLE_FILE}")

if __name__ == "__main__":
    main()
