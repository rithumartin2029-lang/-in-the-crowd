#!/usr/bin/env python3
"""Second pass: remove any remaining external references from the single HTML file."""
import re
from pathlib import Path

SINGLE_FILE = Path("/home/z/my-project/download/in-the-crowd.html")

def main():
    html = SINGLE_FILE.read_text(encoding="utf-8")
    print(f"Before cleanup: {len(html):,} chars")

    # 1. Remove font preload links (they reference .woff2 files we can't inline easily)
    html = re.sub(r'<link[^>]*rel="preload"[^>]*as="font"[^>]*/?>', '', html)
    # 2. Remove any remaining stylesheet links to /_next/
    html = re.sub(r'<link[^>]*rel="stylesheet"[^>]*href="/_next/[^"]*"[^>]*/?>', '', html)
    # 3. Remove any remaining script src tags to /_next/ (dynamically loaded chunks)
    html = re.sub(r'<script[^>]*src="/_next/[^"]*"[^>]*>\s*</script>', '', html)
    # 4. Remove PNG icon links (keep the SVG icon which is already inlined as data URI)
    html = re.sub(r'<link[^>]*href="/icons/[^"]*\.png"[^>]*/?>', '', html)
    # 5. Remove apple-touch-icon that points to missing PNG
    html = re.sub(r'<link[^>]*rel="apple-touch-icon"[^>]*/?>', '', html)
    # 6. Remove any remaining manifest link (just in case)
    html = re.sub(r'<link[^>]*rel="manifest"[^>]*/?>', '', html)
    # 7. Remove theme-color meta tags that might reference external resources (they're fine, just color values)
    # (keep theme-color — it's just a color, no external resource)

    # 8. In the inlined CSS, replace @font-face rules that reference /_next/static/media/
    #    with a system font fallback. The app will use system-ui instead of Geist.
    def remove_fontface(m):
        # If the @font-face references a /_next/ URL, drop the whole rule
        block = m.group(0)
        if '/_next/static/media/' in block:
            return ''
        return block
    html = re.sub(r'@font-face\s*\{[^}]*\}', remove_fontface, html)

    # 9. Add a system font fallback at the top of <head>
    fallback_style = """<style>
      :root { --font-geist-sans: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; --font-geist-mono: ui-monospace, "SF Mono", Menlo, monospace; }
      body, html { font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif !important; }
      * { font-family: inherit; }
    </style>"""
    html = html.replace("<head>", f"<head>{fallback_style}", 1)

    # 10. Add a base style so the page has a dark background by default (matches our theme)
    html = html.replace("</head>", """<style>html{background-color:#0A1228;color:#E8EDF7;}body{background-color:#0A1228;}</style></head>""", 1)

    SINGLE_FILE.write_text(html, encoding="utf-8")
    print(f"After cleanup:  {len(html):,} chars ({len(html)/1024:.1f} KB)")

    # Verify no remaining external references
    remaining = re.findall(r'(?:src|href)="(/[^"]+)"', html)
    remaining = [r for r in remaining if not r.startswith("/icon.svg") and r != "/"]
    if remaining:
        print(f"WARNING: remaining external refs: {set(remaining)}")
    else:
        print("OK: no external /_next references remaining")

if __name__ == "__main__":
    main()
