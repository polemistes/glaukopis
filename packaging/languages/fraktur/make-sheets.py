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
<li>A hyphen at the end of a line is a hyphen; a dash is —. For quotation marks just type <b>"</b>, for an apostrophe <b>'</b>: they become „ “ and ’ as these books print them.</li>
<li>Antiqua words, numbers and punctuation exactly as they stand. One printed line is one box; nothing joined or split.</li>
<li>Where a letter cannot be told, tick <b>unsure</b>: the line is then left out rather than guessed.</li>
<li>A line that is not text, or cut wrongly, gets <b>skip</b>.</li>
</ol>
<p>A line counts as checked once the cursor has been in it; it turns white. Lines never visited are saved as <i>unchecked</i> and left out, so a sheet may be done in parts. Enter moves to the next line. <b>Save</b> downloads the file of this page; put it in the book's folder, or send it on. <b>Load</b> takes a saved file back in.</p>"""

SCRIPT = """
function seen(li){li.classList.add('seen');count();}
function count(){const all=document.querySelectorAll('[data-line]').length,s=document.querySelectorAll('[data-line].seen').length;document.getElementById('count').textContent=s+' of '+all+' checked';}
document.querySelectorAll('textarea').forEach(t=>t.addEventListener('focus',()=>seen(t.closest('[data-line]'))));
function next(i){const t=document.querySelector('[data-line="'+(i+1)+'"] textarea');if(t){t.focus();t.select();}}
document.querySelectorAll('textarea').forEach(t=>{t.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();next(+t.closest('[data-line]').dataset.line);}});});
document.querySelectorAll('[data-take]').forEach(b=>{b.addEventListener('click',()=>{const li=b.closest('[data-line]');li.querySelector('textarea').value=b.dataset.take;});});
function rows(){return [...document.querySelectorAll('[data-line]')].map(li=>{const f=!li.classList.contains('seen')?'unchecked':li.querySelector('.skip').checked?'skip':li.querySelector('.unsure').checked?'unsure':'';return [li.dataset.name,f,li.querySelector('textarea').value.replace(/\\s+/g,' ').trim()];});}
document.getElementById('save').addEventListener('click',()=>{const text=rows().map(r=>r.join('\\t')).join('\\n')+'\\n';const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/tab-separated-values'}));a.download=document.body.dataset.file;a.click();});
document.getElementById('load').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;f.text().then(t=>{t.split('\\n').forEach(l=>{const [name,flag,text]=l.split('\\t');const li=document.querySelector('[data-name="'+name+'"]');if(!li)return;li.querySelector('textarea').value=text||'';li.querySelector('.skip').checked=flag==='skip';li.querySelector('.unsure').checked=flag==='unsure';if(flag!=='unchecked')li.classList.add('seen');});count();});});
count();
"""

STYLE = """body{font-family:sans-serif;max-width:1400px;margin:1em auto;padding:0 1em;background:#faf8f3;color:#222}
img{display:block;max-width:100%;border:1px solid #ccc;background:#fff}
.line{margin:1.2em 0;padding:.5em;background:#ece8dc;border-radius:4px}
.line.seen{background:#fff}
#count{color:#555;font-size:.9em}
textarea{width:100%;font-size:1.25em;font-family:serif;margin-top:.3em;box-sizing:border-box}
.alt{color:#666;font-size:.95em;font-family:serif}
.alt button{font-size:.8em;margin-right:.5em}
.mode{background:#fff4d6;padding:.5em;border-radius:4px}
.flags{font-size:.9em;color:#444}
.top{position:sticky;top:0;background:#faf8f3;padding:.5em 0;border-bottom:1px solid #ccc;display:flex;gap:1em;align-items:center}
h1{font-size:1.2em;margin:0}
li{margin:.6em 0}
[data-type]{font-size:.8em;padding:1px 5px;border-radius:3px;background:#e8e2d0}
[data-type=antiqua]{background:#eee;color:#888}
[data-heldout]{font-size:.8em;padding:1px 5px;border-radius:3px;background:#2d5a8a;color:#fff}
.num{color:#999;font-size:.85em}"""


def alto_lines(xml, img_w, img_h, in_reading_order=False):
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
    # Top to bottom for a book; a newspaper keeps the library's reading
    # order, column by column, so that a sheet does not jump between them.
    if not in_reading_order:
        out.sort(key=lambda l: (l["box"][1], l["box"][0]))
    # A line much taller than the page's others is several lines the
    # library's text took for one: skipped unless one unticks it.
    heights = sorted(l["box"][3] for l in out)
    if heights:
        median = heights[len(heights) // 2]
        for l in out:
            l["tall"] = l["box"][3] > 1.6 * median
    return out


def read_one(path, tessdata, lang):
    r = subprocess.run(["tesseract", path, "-", "--tessdata-dir", tessdata, "-l", lang, "--psm", "7"],
                       capture_output=True, text=True)
    return " ".join(r.stdout.split()).replace("ſ", "s") if r.returncode == 0 else ""


def read_lines(paths, tessdata, lang):
    """The model's reading of every line, all in one run of Tesseract; one
    by one where that run fails (a few cuts make it crash), with nothing
    for a line it cannot read."""
    if not paths:
        return []
    try:
        return read_batch(paths, tessdata, lang)
    except subprocess.CalledProcessError:
        return [read_one(p, tessdata, lang) for p in paths]


def read_batch(paths, tessdata, lang):
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


def read_tsv(path):
    """A reader's file (line, flag, text) as {line: (flag, text)}; empty
    where there is none."""
    rows = {}
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            for row in f:
                parts = row.rstrip("\n").split("\t")
                if len(parts) >= 2 and parts[0]:
                    rows[parts[0]] = (parts[1].strip(), parts[2] if len(parts) > 2 else "")
    return rows


def sheet(book, page, lines, folder, blank=False):
    """The sheet of a page. As a rule its boxes hold the model's reading,
    with the library's beside it, and it saves as `page-NNNN.truth.tsv`.
    Where a reader by eye has read the page (`page-NNNN.claude.tsv`) and
    the book is held out (`blank`), the boxes hold that reading with its
    flags, to be checked against the pictures, the person's own earlier
    reading (`page-NNNN.human.tsv`) beside it where it differs, and it
    saves as `page-NNNN.checked.tsv`, the reader's file untouched. Held
    out and not yet read by eye, the boxes are empty, and it saves as
    `page-NNNN.human.tsv`."""
    reader = read_tsv(os.path.join(folder, f"page-{page}.claude.tsv")) if blank else {}
    human = read_tsv(os.path.join(folder, f"page-{page}.human.tsv")) if reader else {}
    mode = "checked" if reader else "human" if blank else "truth"
    link = next((p.get("link") for p in book.get("pages", []) if p.get("page") == page and p.get("link")), book["link"])
    intro = ("<p class='mode'>The boxes hold a reading by eye. Check each line against its picture and fix what is wrong; "
             "the ticks for unsure and skip are the reader's, change them where you disagree.</p>") if reader else ""
    parts = [f"<!doctype html><html lang='en'><head><meta charset='utf-8'><title>{html.escape(book['title'][:60])} p. {page}</title>",
             f"<style>{STYLE}</style></head><body data-file='page-{page}.{mode}.tsv'>",
             f"<div class='top'><h1>{html.escape(book['title'][:80])}, {html.escape(str(book['issued']))} — page {page} of the scan</h1>",
             "<span id='count'></span> <button id='save'>Save</button><label>Load <input id='load' type='file' accept='.tsv,.txt'></label>",
             f"<a href='{link}' target='_blank'>at nb.no</a></div>", intro, RULES]
    for i, l in enumerate(lines):
        with open(l["png"], "rb") as f:
            data = base64.b64encode(f.read()).decode()
        name = os.path.basename(l["png"])[:-4]
        unsure = skip = False
        alt = ""
        if reader:
            flag, text = reader.get(name, ("skip", ""))
            unsure, skip = flag == "unsure", flag == "skip"
            draft = html.escape(text)
            if name in human and human[name][1].strip() and human[name][1].strip() != text.strip():
                mine = human[name][1]
                alt = (f"<div class='alt'><button data-take=\"{html.escape(mine, quote=True)}\">take</button>"
                       f"your earlier reading: {html.escape(mine)}</div>")
        elif blank:
            draft = ""
            skip = bool(l.get("tall"))
        else:
            draft = html.escape(l["model"])
            skip = bool(l.get("tall"))
            alt = (f"<div class='alt'><button data-take=\"{html.escape(l['alto'], quote=True)}\">take</button>"
                   f"library: {html.escape(l['alto'])}</div>")
        note = " <i>(more than one line? skipped)</i>" if l.get("tall") and not reader else ""
        parts.append(f"<div class='line' data-line='{i}' data-name='{name}'><span class='num'>{name}</span>"
                     f"<img src='data:image/png;base64,{data}' alt=''>"
                     f"<textarea rows='1' spellcheck='false'>{draft}</textarea>{alt}"
                     f"<div class='flags'><label><input type='checkbox' class='unsure'{' checked' if unsure else ''}> unsure</label> &nbsp; "
                     f"<label><input type='checkbox' class='skip'{' checked' if skip else ''}> skip</label>{note}</div></div>")
    parts.append(f"<script>{SCRIPT}</script></body></html>")
    with open(os.path.join(folder, f"sheet-{page}.html"), "w", encoding="utf-8") as f:
        f.write("\n".join(parts))


def do_book(folder, tessdata, lang, blank=False):
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
        lines = alto_lines(xml, im.width, im.height, book.get("kind") == "newspaper")
        for i, l in enumerate(lines):
            x, y, w, h = l["box"]
            my, mx = int(h * 0.25), int(w * 0.01) + 4
            crop = im.crop((max(0, x - mx), max(0, y - my), min(im.width, x + w + mx), min(im.height, y + h + my)))
            l["png"] = os.path.join(linedir, f"page-{page}-L{i + 1:02d}.png")
            crop.save(l["png"])
        for l, text in zip(lines, read_lines([l["png"] for l in lines], tessdata, lang)):
            l["model"] = text
        with open(os.path.join(linedir, f"page-{page}.lines.json"), "w", encoding="utf-8") as f:
            json.dump([{"name": os.path.basename(l["png"])[:-4], "box": l["box"], "alto": l["alto"], "model": l["model"],
                        "tall": l.get("tall", False)} for l in lines],
                      f, ensure_ascii=False, indent=1)
        sheet(book, page, lines, folder, blank)
        made.append((page, len(lines)))
    return book, made


def main():
    p = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    p.add_argument("books")
    p.add_argument("--tessdata", required=True)
    p.add_argument("--lang", default="dan_latf")
    p.add_argument("--only", help="book folder prefixes, comma-separated, as 01,04")
    p.add_argument("--again", action="store_true", help="make the sheets of books that have them already")
    p.add_argument("--blank", action="store_true",
                   help="sheets with empty boxes and no reading shown, saving as page-NNNN.human.tsv")
    p.add_argument("--html-only", action="store_true",
                   help="write the sheets anew from the lines already cut and read, without reading them again")
    a = p.parse_args()
    only = set(a.only.split(",")) if a.only else None
    # The books held out for measuring (heldout.json beside the books: a
    # list of folder names) always get blank sheets, since they are read
    # independently of any model; they are marked and listed first.
    heldout = set()
    if os.path.exists(os.path.join(a.books, "heldout.json")):
        with open(os.path.join(a.books, "heldout.json"), encoding="utf-8") as f:
            heldout = set(json.load(f))
    entries = []
    for folder in sorted(glob.glob(os.path.join(a.books, "*", "book.json"))):
        folder = os.path.dirname(folder)
        if only and os.path.basename(folder).split("-")[0] not in only:
            continue
        pages = glob.glob(os.path.join(folder, "page-*.jpg"))
        if a.html_only:
            with open(os.path.join(folder, "book.json"), encoding="utf-8") as f:
                book = json.load(f)
            made = []
            for j in sorted(pages):
                page = os.path.basename(j)[5:-4]
                with open(os.path.join(folder, "lines", f"page-{page}.lines.json"), encoding="utf-8") as f:
                    lines = json.load(f)
                for l in lines:
                    l["png"] = os.path.join(folder, "lines", l["name"] + ".png")
                sheet(book, page, lines, folder, a.blank or os.path.basename(folder) in heldout)
                made.append((page, len(lines)))
            entries.append((os.path.basename(folder), book, made))
            continue
        if not a.again and pages and all(os.path.exists(os.path.join(folder, "sheet-" + os.path.basename(j)[5:-4] + ".html")) for j in pages):
            book = json.load(open(os.path.join(folder, "book.json"), encoding="utf-8"))
            made = [(os.path.basename(j)[5:-4], len(json.load(open(os.path.join(folder, "lines", "page-" + os.path.basename(j)[5:-4] + ".lines.json"), encoding="utf-8"))))
                    for j in sorted(pages)]
            entries.append((os.path.basename(folder), book, made))
            continue
        try:
            book, made = do_book(folder, a.tessdata, a.lang, os.path.basename(folder) in heldout)
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
                if os.path.isdir(os.path.join(a.books, m.group(1))):  # books moved away are dropped
                    old[m.group(1)] = m.group(2)
    # The type of each book, where it has been judged (types.json beside the
    # books: fraktur, antiqua or hybrid); the Fraktur books are listed first.
    types = {}
    if os.path.exists(os.path.join(a.books, "types.json")):
        with open(os.path.join(a.books, "types.json"), encoding="utf-8") as f:
            types = {k: v["type"] for k, v in json.load(f).items()}
    label = {"fraktur": "Fraktur", "antiqua": "roman type: not for this model", "hybrid": "roman with Fraktur capitals"}
    for name, book, made in entries:
        kind = types.get(name, "")
        links = " ".join(f"<a href='{name}/sheet-{page}.html'>{page}</a> <small>({n})</small>" for page, n in made)
        mark = "<span data-heldout>held out for measuring</span> " if name in heldout else ""
        old[name] = (f"{mark}<span data-type='{kind}'>{label.get(kind, '')}</span> <b>{html.escape(book['title'][:90])}</b>, {html.escape(str(book['issued']))} "
                     f"<small>{html.escape(str(book['access']['accessAllowedFrom']))}{', public domain' if book['access']['isPublicDomain'] else ''}</small><br>pages: {links}")
    with open(index, "w", encoding="utf-8") as f:
        f.write("<!doctype html><html lang='en'><head><meta charset='utf-8'><title>Fraktur ground truth</title>"
                f"<style>{STYLE}</style></head><body><h1>Books fetched from nb.no, with their correction sheets</h1><ul>"
                + "".join(f"<li data-book='{k}'>{v}</li>" for k, v in sorted(old.items(), key=lambda kv: (kv[0] not in heldout, types.get(kv[0], "") != "fraktur", kv[0])))
                + "</ul></body></html>")


if __name__ == "__main__":
    main()
