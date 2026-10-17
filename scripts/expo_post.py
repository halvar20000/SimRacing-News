"""Live photo coverage from a fair (e.g. SimRacing Expo) on simracing-hub.com.

    python scripts/expo_post.py init --slug simracing-expo-2026 --name "SimRacing Expo 2026" --place "Dortmund"
    python scripts/expo_post.py add PHOTO.jpg --en "English caption" --de "Deutsche Bildunterschrift"
    python scripts/expo_post.py build            # pages only

Photos: auto-rotated, max 1600 px, JPEG q82, ALL metadata removed (EXIF incl.
GPS position, camera serial) — img/expo/<slug>/NN.jpg. Data: expo/<slug>.json.
Pages: expo/<slug>.html (EN) and de/expo/<slug>.html (DE), newest first,
built from about.html's header / nav / footer so they look like the site.
"""
from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import re
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
CUR = ROOT / "expo" / "current.txt"


def _data_path(slug):
    return ROOT / "expo" / f"{slug}.json"


def _load(slug):
    return json.loads(_data_path(slug).read_text(encoding="utf-8"))


def _save(slug, d):
    _data_path(slug).parent.mkdir(parents=True, exist_ok=True)
    _data_path(slug).write_text(json.dumps(d, ensure_ascii=False, indent=1), encoding="utf-8")


def _shell(lang: str) -> str:
    return (ROOT / ("about.html" if lang == "en" else "de/about.html")).read_text(encoding="utf-8")


def _page(d: dict, lang: str) -> str:
    slug = d["slug"]
    en = lang == "en"
    name = d["name"]
    title = f"{name} – live" + (" photos" if en else " Fotos")
    where = f" in {d['place']}" if d.get("place") else ""
    desc = (f"Photos and first impressions live from {name}{where}: new sim racing hardware, "
            f"stands and highlights." if en else
            f"Fotos und erste Eindrücke live von der {name}{where}: neue Sim-Racing-Hardware, "
            f"Stände und Highlights.")
    url = f"https://simracing-hub.com/{'' if en else 'de/'}expo/{slug}.html"
    s = _shell(lang)
    # paths: the page lives one folder deeper than about.html
    s = re.sub(r'(href|src)="(?!https?:|mailto:|#|/)([^"]+)"', lambda m: f'{m.group(1)}="../{m.group(2)}"', s)
    seo = f"""<!-- BEGIN SEO-MANAGED -->
    <title>{html.escape(title)} | SimRacing Hub</title>
    <meta name="description" content="{html.escape(desc)}">
    <link rel="canonical" href="{url}">
    <link rel="alternate" hreflang="en" href="https://simracing-hub.com/expo/{slug}.html">
    <link rel="alternate" hreflang="de" href="https://simracing-hub.com/de/expo/{slug}.html">
    <link rel="alternate" hreflang="x-default" href="https://simracing-hub.com/expo/{slug}.html">
    <meta name="robots" content="index,follow,max-image-preview:large">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="SimRacing Hub">
    <meta property="og:title" content="{html.escape(title)}">
    <meta property="og:description" content="{html.escape(desc)}">
    <meta property="og:url" content="{url}">
    <meta property="og:image" content="https://simracing-hub.com/{d['entries'][0]['img'] if d['entries'] else 'img/logo.svg'}">
    <meta name="twitter:card" content="summary_large_image">
  <!-- END SEO-MANAGED -->"""
    s = re.sub(r"<!-- BEGIN SEO-MANAGED -->.*?<!-- END SEO-MANAGED -->", lambda m: seo, s, flags=re.S)
    s = s.replace(' class="active"', "")
    # language switch: the other language's expo page
    if en:
        sw = (f'<div class="lang-switch">\n          <a href="{slug}.html" class="active-lang" title="English">&#127468;&#127463;</a>\n'
              f'          <a href="../de/expo/{slug}.html" title="Deutsch">&#127465;&#127466;</a>\n        </div>')
    else:
        sw = (f'<div class="lang-switch">\n          <a href="../../expo/{slug}.html" title="English">&#127468;&#127463;</a>\n'
              f'          <a href="{slug}.html" class="active-lang" title="Deutsch">&#127465;&#127466;</a>\n        </div>')
    s = re.sub(r'<div class="lang-switch">.*?</div>', lambda m: sw, s, count=1, flags=re.S)
    hero = (f'<section class="hero">\n    <h1>{html.escape(name)} <span>{"live" if en else "live"}</span></h1>\n'
            f'    <p>{html.escape(d["place"]) + " &middot; " if d.get("place") else ""}'
            + ("photos straight from the show floor, newest first" if en else "Fotos direkt aus den Messehallen, neueste zuerst")
            + "</p>\n</section>")
    s = re.sub(r'<section class="hero">.*?</section>', lambda m: hero, s, count=1, flags=re.S)
    # short day reports above the photos (newest first)
    notes = d.get("notes") or []
    note_html = "".join(
        f'      <div class="expo-note"><strong>{html.escape(n["title_" + lang])}</strong> '
        f'{html.escape(n[lang])}</div>\n' for n in reversed(notes))
    cards = []
    up = "../" if en else "../../"
    for e in reversed(d["entries"]):
        cap = html.escape(e["en"] if en else e["de"])
        t = dt.datetime.fromisoformat(e["t"])
        when = t.strftime("%d.%m. %H:%M")
        cards.append(
            f'      <figure class="expo-card">\n'
            f'        <a href="{up}{e["img"]}"><img src="{up}{e["img"]}" '
            f'alt="{cap}" width="{e["w"]}" height="{e["h"]}" loading="lazy"></a>\n'
            f'        <figcaption><time datetime="{e["t"]}">{when}</time> {cap}</figcaption>\n'
            f'      </figure>')
    empty = ("      <p style=\"text-align:center;opacity:.7\">"
             + ("First photos coming soon." if en else "Die ersten Fotos folgen in Kürze.") + "</p>")
    main = ("<main>\n    <style>\n"
            "      .expo-grid { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem 2rem; display: grid; gap: 1.5rem;"
            " grid-template-columns: repeat(auto-fill, minmax(min(100%, 460px), 1fr)); align-items: start; }\n"
            "      .expo-card { margin: 0; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);"
            " border-radius: 10px; overflow: hidden; }\n"
            "      .expo-card img { width: 100%; height: auto; display: block; }\n"
            "      .expo-card figcaption { padding: .9rem 1.1rem 1.1rem; font-size: 1.05rem; line-height: 1.6;"
            " color: rgba(255,255,255,0.88); }\n"
            "      .expo-card time { color: var(--accent-orange); font-weight: 600; margin-right: .4rem; }\n"
            "      .expo-note { max-width: 1200px; margin: 0 auto 1.2rem; padding: 1rem 1.3rem; border-left: 4px solid"
            " var(--accent-orange); background: rgba(255,107,53,0.08); border-radius: 6px; font-size: 1.05rem;"
            " line-height: 1.6; color: rgba(255,255,255,0.9); }\n"
            "    </style>\n" + ('    <div style="padding:0 1.5rem">\n' + note_html + '    </div>\n' if note_html else "")
            + "    <div class=\"expo-grid\">\n"
            + ("\n".join(cards) if cards else empty) + "\n    </div>\n  </main>")
    s = re.sub(r"<main>.*?</main>", lambda m: main, s, count=1, flags=re.S)
    s = re.sub(r"<!-- Visitor Counter.*?</script>\n", "", s, flags=re.S)
    return s


def build(slug):
    d = _load(slug)
    for lang, path in (("en", ROOT / "expo" / f"{slug}.html"), ("de", ROOT / "de" / "expo" / f"{slug}.html")):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(_page(d, lang), encoding="utf-8")
    return d


def add(slug, photo: Path, en: str, de: str):
    from PIL import Image, ImageOps
    d = _load(slug)
    n = len(d["entries"]) + 1
    rel = f"img/expo/{slug}/{n:02d}.jpg"
    out = ROOT / rel
    out.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(photo) as im:
        im = ImageOps.exif_transpose(im).convert("RGB")
        im.thumbnail((1600, 1600))
        clean = Image.new("RGB", im.size)          # pixels only: no EXIF / GPS / maker notes
        clean.paste(im)
        clean.save(out, "JPEG", quality=82, optimize=True, progressive=True)
        w, h = clean.size
    # local time of the fair (the server runs on UTC)
    now = dt.datetime.now(ZoneInfo(d.get("tz") or "Europe/Berlin")).replace(microsecond=0)
    d["entries"].append({"t": now.isoformat(), "img": rel,
                         "w": w, "h": h, "en": en.strip(), "de": de.strip()})
    _save(slug, d)
    build(slug)
    return rel


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    i = sub.add_parser("init"); i.add_argument("--slug", required=True); i.add_argument("--name", required=True)
    i.add_argument("--place", required=True)
    a = sub.add_parser("add"); a.add_argument("photo"); a.add_argument("--en", required=True); a.add_argument("--de", required=True)
    a.add_argument("--slug")
    b = sub.add_parser("build"); b.add_argument("--slug")
    ns = ap.parse_args()
    if ns.cmd == "init":
        _save(ns.slug, {"slug": ns.slug, "name": ns.name, "place": ns.place, "entries": []})
        CUR.write_text(ns.slug, encoding="utf-8")
        build(ns.slug)
        print("ok", ns.slug)
    else:
        slug = ns.slug or CUR.read_text(encoding="utf-8").strip()
        if ns.cmd == "add":
            print(add(slug, Path(ns.photo), ns.en, ns.de))
        else:
            build(slug)
            print("built", slug)
