#!/usr/bin/env python3
"""Make correction sheets of the pages fetched from the National Library.

For every book folder (`NN-slug/book.json`, made by fetch-nb.py) and every
page in it, the lines are cut from the page's picture where the library's
ALTO places them (its units are scaled to the picture), each line is read
with the Fraktur model, and a sheet `sheet-NNNN.html` is written beside
the page: one file with no outside parts, showing every line's picture
over a box holding the model's reading, with the library's own reading
under it to take instead. The rules of transcription stand at the top.
**Save** downloads `page-NNNN.truth.tsv` (line, flag, text), and **Load**
takes such a file back into the boxes. The line pictures and their boxes
are kept under `lines/` in the book's folder for the training to come,
and `index.html` in the books folder lists every book and sheet.

    make-sheets.py BOOKS-DIR --tessdata DIR [--lang dan_latf] [--only 01,04]
"""
import argparse
import base64
import glob
import html
import io
import json
import os
import re
import subprocess
import sys
import tempfile

from PIL import Image

RULES = """<h2>How to correct</h2>
<ol>
<li>Write what is printed, with the spelling of the time: <i>faa</i>, <i>gaar</i>, <i>Kjærlighed</i>. Never modernise.</li>
<li>ſ is s. Ligatures of type are their letters (ff, fi, ſt, ch, ck, tz). æ ø å Æ Ø Å ß and &amp; stay themselves.</li>
<li>Spaced-out emphasis is written as an ordinary word, without the spaces.</li>
<li>A hyphen at the end of a line is a hyphen. Dashes and quotation marks as printed: — „ “ » «.</li>
<li>Antiqua words, numbers and punctuation exactly as they stand. One printed line is one box; nothing joined or split.</li>
<li>Where a letter cannot be told, tick <b>unsure</b>: the line is then left out rather than guessed.</li>
<li>A line that is not text, or cut wrongly, gets <b>skip</b>.</li>
</ol>
<p>Enter moves to the next line. <b>Save</b> downloads the file of this page; put it in the book's folder, or send it on. <b>Load</b> takes a saved file back in.</p>"""

SCRIPT = """
function next(i){const t=document.querySelector('[data-line="'+(i+1)+'"] textarea');if(t){t.focus();t.select();}}
document.querySelectorAll('textarea').forEach(t=>{t.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();next(+t.closest('[data-line]').dataset.line);}});});
document.querySelectorAll('[data-take]').forEach(b=>{b.addEventListener('click',()=>{const li=b.closest('[data-line]');li.querySelector('textarea').value=b.dataset.take;});});
function rows(){return [...document.querySelectorAll('[data-line]')].map(li=>{const f=li.querySelector('.skip').checked?'skip':li.querySelector('.unsure').checked?'unsure':'';return [li.dataset.name,f,li.querySelector('textarea').value.replace(/\\s+/g,' ').trim()];});}
document.getElementById('save').addEventListener('click',()=>{const text=rows().map(r=>r.join('\\t')).join('\\n')+'\\n';const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/tab-separated-values'}));a.download=document.body.dataset.file;a.click();});
document.getElementById('load').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;f.text().then(t=>{t.split('\\n').forEach(l=>{const [name,flag,text]=l.split('\\t');const li=document.querySelector('[data-name="'+name+'"]');if(!li)return;li.querySelector('textarea').value=text||'';li.querySelector('.skip').checked=flag==='skip';li.querySelector('.unsure').checked=flag==='unsure';});});});
"""

STYLE = """body{font-family:sans-serif;max-width:1400px;margin:1em auto;padding:0 1em;background:#faf8f3;color:#222}
img{display:block;max-width:100%;border:1px solid #ccc;background:#fff}
.line{margin:1.2em 0;padding:.5em;background:#fff;border-radius:4px}
textarea{width:100%;font-size:1.25em;font-family:serif;margin-top:.3em;box-sizing:border-box}
.alt{color:#666;font-size:.95em;font-family:serif}
.alt button{font-size:.8em;margin-right:.5em}
.flags{font-size:.9em;color:#444}
.top{position:sticky;top:0;background:#faf8f3;padding:.5em 0;border-bottom:1px solid #ccc;display:flex;gap:1em;align-items:center}
h1{font-size:1.2em;margin:0}
.num{color:#999;font-size:.85em}"""


def alto_lines(xml, img_w, img_h):
    # The page's size in the ALTO's own units, its attributes in any order
    # (the library's texts were made by more than one program).
    page = dict(re.findall(r'\b(WIDTH|HEIGHT)="(\d+)"', re.search(r'<Page\b[^>]*>', xml).group(0)))
    sx = img_w / int(page["WIDTH"])
    sy = img_h / int(page["HEIGHT"])
    out = []
    for m in re.finditer(r'<TextLine\b([^>]*)>(.*?)</TextLine>', xml, re.S):
        attrs, body = m.group(1), m.group(2)
        box = {k: int(v) for k, v in re.findall(r'(HPOS|VPOS|WIDTH|HEIGHT)="(\d+)"', attrs)}
        # The words as printed on this line: CONTENT, never SUBS_CONTENT
        # (a word broken over two lines, joined), and the hyphen of a
        # broken word where the ALTO marks it.
        words = []
        for el in re.finditer(r'<(String|HYP)\b([^>]*)>', body):
            content = re.search(r'\sCONTENT="([^"]*)"', el.group(2))
            if not content:
                continue
            if el.group(1) == "HYP":
                if words:
                    words[-1] += html.unescape(content.group(1))
            else:
                words.append(html.unescape(content.group(1)))
        if len(words) < 2 or box.get("HEIGHT", 0) * sy < 12 or box.get("WIDTH", 0) * sx < 60:
            continue
        x, y, w, h = box["HPOS"] * sx, box["VPOS"] * sy, box["WIDTH"] * sx, box["HEIGHT"] * sy
        out.append({"box": [round(x), round(y), round(w), round(h)], "alto": " ".join(words)})
    out.sort(key=lambda l: (l["box"][1], l["box"][0]))
    return out


def read_lines(paths, tessdata, lang):
    if not paths:
        return []
    with tempfile.TemporaryDirectory() as tmp:
        listing = os.path.join(tmp, "list.txt")
        with open(listing, "w") as f:
            f.write("\n".join(paths) + "\n")
        subprocess.run(["tesseract", listing, os.path.join(tmp, "out"), "--tessdata-dir", tessdata, "-l", lang,
                        "--psm", "7"], check=True, capture_output=True)
        with open(os.path.join(tmp, "out.txt"), encoding="utf-8") as f:
            text = f.read()
    pages = text.split("\f")
    return [" ".join(p.split()).replace("ſ", "s") for p in pages[: len(paths)]] + [""] * (len(paths) - len(pages))


def sheet(book, page, lines, folder):
    parts = [f"<!doctype html><html lang='en'><head><meta charset='utf-8'><title>{html.escape(book['title'][:60])} p. {page}</title>",
             f"<style>{STYLE}</style></head><body data-file='page-{page}.truth.tsv'>",
             f"<div class='top'><h1>{html.escape(book['title'][:80])}, {html.escape(str(book['issued']))} — page {page} of the scan</h1>",
             "<button id='save'>Save</button><label>Load <input id='load' type='file' accept='.tsv,.txt'></label>",
             f"<a href='{book['link']}' target='_blank'>at nb.no</a></div>", RULES]
    for i, l in enumerate(lines):
        with open(l["png"], "rb") as f:
            data = base64.b64encode(f.read()).decode()
        name = os.path.basename(l["png"])[:-4]
        parts.append(f"<div class='line' data-line='{i}' data-name='{name}'><span class='num'>{name}</span>"
                     f"<img src='data:image/png;base64,{data}' alt=''>"
                     f"<textarea rows='1' spellcheck='false'>{html.escape(l['model'])}</textarea>"
                     f"<div class='alt'><button data-take=\"{html.escape(l['alto'], quote=True)}\">take</button>library: {html.escape(l['alto'])}</div>"
                     f"<div class='flags'><label><input type='checkbox' class='unsure'> unsure</label> &nbsp; <label><input type='checkbox' class='skip'> skip</label></div></div>")
    parts.append(f"<script>{SCRIPT}</script></body></html>")
    with open(os.path.join(folder, f"sheet-{page}.html"), "w", encoding="utf-8") as f:
        f.write("\n".join(parts))


def do_book(folder, tessdata, lang):
    with open(os.path.join(folder, "book.json"), encoding="utf-8") as f:
        book = json.load(f)
    linedir = os.path.join(folder, "lines")
    os.makedirs(linedir, exist_ok=True)
    made = []
    for jpg in sorted(glob.glob(os.path.join(folder, "page-*.jpg"))):
        page = os.path.basename(jpg)[5:-4]
        with open(jpg[:-4] + ".alto.xml", encoding="utf-8") as f:
            xml = f.read()
        im = Image.open(jpg).convert("L")
        lines = alto_lines(xml, im.width, im.height)
        for i, l in enumerate(lines):
            x, y, w, h = l["box"]
            my, mx = int(h * 0.25), int(w * 0.01) + 4
            crop = im.crop((max(0, x - mx), max(0, y - my), min(im.width, x + w + mx), min(im.height, y + h + my)))
            l["png"] = os.path.join(linedir, f"page-{page}-L{i + 1:02d}.png")
            crop.save(l["png"])
        for l, text in zip(lines, read_lines([l["png"] for l in lines], tessdata, lang)):
            l["model"] = text
        with open(os.path.join(linedir, f"page-{page}.lines.json"), "w", encoding="utf-8") as f:
            json.dump([{"name": os.path.basename(l["png"])[:-4], "box": l["box"], "alto": l["alto"], "model": l["model"]} for l in lines],
                      f, ensure_ascii=False, indent=1)
        sheet(book, page, lines, folder)
        made.append((page, len(lines)))
    return book, made


def main():
    p = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    p.add_argument("books")
    p.add_argument("--tessdata", required=True)
    p.add_argument("--lang", default="dan_latf")
    p.add_argument("--only", help="book folder prefixes, comma-separated, as 01,04")
    p.add_argument("--again", action="store_true", help="make the sheets of books that have them already")
    a = p.parse_args()
    only = set(a.only.split(",")) if a.only else None
    entries = []
    for folder in sorted(glob.glob(os.path.join(a.books, "*", "book.json"))):
        folder = os.path.dirname(folder)
        if only and os.path.basename(folder).split("-")[0] not in only:
            continue
        pages = glob.glob(os.path.join(folder, "page-*.jpg"))
        if not a.again and pages and all(os.path.exists(os.path.join(folder, "sheet-" + os.path.basename(j)[5:-4] + ".html")) for j in pages):
            book = json.load(open(os.path.join(folder, "book.json"), encoding="utf-8"))
            made = [(os.path.basename(j)[5:-4], len(json.load(open(os.path.join(folder, "lines", "page-" + os.path.basename(j)[5:-4] + ".lines.json"), encoding="utf-8"))))
                    for j in sorted(pages)]
            entries.append((os.path.basename(folder), book, made))
            continue
        try:
            book, made = do_book(folder, a.tessdata, a.lang)
        except Exception as e:  # one book failing must not end the run
            print(f"{os.path.basename(folder)}: failed: {type(e).__name__}: {str(e)[:100]}", flush=True)
            continue
        print(f"{os.path.basename(folder)}: {len(made)} sheets, {sum(n for _, n in made)} lines", flush=True)
        entries.append((os.path.basename(folder), book, made))
    index = os.path.join(a.books, "index.html")
    old = {}
    if os.path.exists(index):
        with open(index, encoding="utf-8") as f:
            for m in re.finditer(r"<li data-book='([^']*)'>(.*?)</li>", f.read(), re.S):
                old[m.group(1)] = m.group(2)
    for name, book, made in entries:
        links = " ".join(f"<a href='{name}/sheet-{page}.html'>{page}</a> <small>({n})</small>" for page, n in made)
        old[name] = (f"<b>{html.escape(book['title'][:90])}</b>, {html.escape(str(book['issued']))} "
                     f"<small>{html.escape(str(book['access']['accessAllowedFrom']))}{', public domain' if book['access']['isPublicDomain'] else ''}</small><br>pages: {links}")
    with open(index, "w", encoding="utf-8") as f:
        f.write("<!doctype html><html lang='en'><head><meta charset='utf-8'><title>Fraktur ground truth</title>"
                f"<style>{STYLE}</style></head><body><h1>Books fetched from nb.no, with their correction sheets</h1><ul>"
                + "".join(f"<li data-book='{k}'>{v}</li>" for k, v in sorted(old.items())) + "</ul></body></html>")


if __name__ == "__main__":
    main()
