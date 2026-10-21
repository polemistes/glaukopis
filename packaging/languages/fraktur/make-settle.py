#!/usr/bin/env python3
"""Make one sheet of the lines two readers read differently, to be
settled by a person looking at the picture.

Reads BOOKS-DIR/disagreements.tsv (book, line, reading, reading), written
by gather.py, and writes BOOKS-DIR/settle.html: every line's picture,
large, with the two readings as buttons (in no fixed order, unnamed, so
neither is favoured) and a box for the text as printed, with a flag for
unsure. Lines settled before (BOOKS-DIR/settled.tsv) are left out. Save
downloads `settled-new.tsv` (book, line, flag, text), to be added to
BOOKS-DIR/settled.tsv, which gather.py reads before everything else.

    make-settle.py BOOKS-DIR
"""
import base64
import html
import os
import random
import sys

STYLE = """body{font-family:sans-serif;max-width:1400px;margin:1em auto;padding:0 1em;background:#faf8f3;color:#222}
img{display:block;max-width:100%;border:1px solid #ccc;background:#fff;image-rendering:auto}
.line{margin:1.5em 0;padding:.6em;background:#ece8dc;border-radius:4px}.line.seen{background:#fff}
textarea{width:100%;font-size:1.3em;font-family:serif;margin-top:.4em;box-sizing:border-box}
.take{font-family:serif;font-size:1.1em;margin:.3em .5em .3em 0;padding:.2em .5em;cursor:pointer}
.top{position:sticky;top:0;background:#faf8f3;padding:.5em 0;border-bottom:1px solid #ccc;display:flex;gap:1em;align-items:center}
.num{color:#999;font-size:.85em}"""

SCRIPT = """
function count(){const a=document.querySelectorAll('.line').length,s=document.querySelectorAll('.line.seen').length;document.getElementById('count').textContent=s+' of '+a+' settled';}
document.querySelectorAll('.take').forEach(b=>b.addEventListener('click',()=>{const li=b.closest('.line');li.querySelector('textarea').value=b.dataset.text;li.classList.add('seen');count();}));
document.querySelectorAll('textarea').forEach(t=>t.addEventListener('input',()=>{t.closest('.line').classList.add('seen');count();}));
document.querySelectorAll('.unsure').forEach(c=>c.addEventListener('change',()=>{c.closest('.line').classList.add('seen');count();}));
document.getElementById('save').addEventListener('click',()=>{const rows=[...document.querySelectorAll('.line.seen')].map(li=>[li.dataset.book,li.dataset.name,li.querySelector('.unsure').checked?'unsure':'',li.querySelector('textarea').value.replace(/\\s+/g,' ').trim()].join('\\t'));const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([rows.join('\\n')+'\\n'],{type:'text/tab-separated-values'}));a.download='settled-new.tsv';a.click();});
count();
"""


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    books = sys.argv[1]
    done = set()
    if os.path.exists(os.path.join(books, "settled.tsv")):
        with open(os.path.join(books, "settled.tsv"), encoding="utf-8") as f:
            done = {tuple(l.split("\t")[:2]) for l in f if l.strip()}
    rows = []
    with open(os.path.join(books, "disagreements.tsv"), encoding="utf-8") as f:
        for l in f:
            parts = l.rstrip("\n").split("\t")
            if len(parts) >= 4 and (parts[0], parts[1]) not in done:
                rows.append(parts)
    rng = random.Random(1)
    parts = ["<!doctype html><html lang='en'><head><meta charset='utf-8'><title>Lines to settle</title>",
             f"<style>{STYLE}</style></head><body>",
             "<div class='top'><b>Lines two readers read differently</b><span id='count'></span><button id='save'>Save</button></div>",
             "<p>Look at each picture and click the reading that is what is printed, or write it in the box. "
             "Tick <b>unsure</b> where the picture does not tell. Rules as on the sheets: the spelling as printed, ſ as s, "
             "ligatures as letters, I before a consonant, J before a vowel. Save gives <i>settled-new.tsv</i>; put it in the books folder.</p>"]
    for book, name, *readings in rows:
        png = os.path.join(books, book, "lines", name + ".png")
        with open(png, "rb") as f:
            data = base64.b64encode(f.read()).decode()
        readings = list(dict.fromkeys(readings))
        rng.shuffle(readings)
        buttons = "".join(f"<button class='take' data-text=\"{html.escape(r, quote=True)}\">{html.escape(r)}</button><br>" for r in readings)
        parts.append(f"<div class='line' data-book='{book}' data-name='{name}'><span class='num'>{book[:2]} {name}</span>"
                     f"<img src='data:image/png;base64,{data}' alt=''>{buttons}"
                     f"<textarea rows='1' spellcheck='false'></textarea>"
                     f"<label><input type='checkbox' class='unsure'> unsure</label></div>")
    parts.append(f"<script>{SCRIPT}</script></body></html>")
    with open(os.path.join(books, "settle.html"), "w", encoding="utf-8") as f:
        f.write("\n".join(parts))
    print(f"{len(rows)} lines to settle in {os.path.join(books, 'settle.html')}")


if __name__ == "__main__":
    main()
