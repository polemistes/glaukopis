#!/usr/bin/env python3
"""Fetch pages of old Norwegian books from the National Library (nb.no), for
the ground truth of the Fraktur model.

Takes a CSV with the columns nr, title, author, year (…), and for every
row searches the library's catalogue, chooses an edition (public domain
and readable from everywhere first, then readable from Norway, then the
nearest year), and downloads a handful of pages spread through the body
of the book, skipping the front matter and pages with little text: each
page's picture at the scan's full size through IIIF, and the library's
ALTO text of it (its own OCR, with the lines' positions). Each book gets a
folder `NN-slug/` with `book.json` saying what was chosen. A `report.tsv`
in the output folder says for every row what became of it; rows whose
folder exists already are skipped, so a run can be taken up again.

    fetch-nb.py LIST.csv OUT-DIR [--pages 6] [--only 1,5,12] [--public-only]

`--public-only` takes only editions and issues in the public domain and
readable from everywhere, and leaves a row without one as "no hit".

A row may give the library's `id` of the edition wanted, which is then
taken as it is, and `kind` = `newspaper`, which takes one page from each
of as many issues as pages are asked, spread over the years of the row.

One request at a time, with a pause between, and the project named in the
request. Nothing of the person is sent.
"""
import argparse
import csv
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request

API = "https://api.nb.no/catalog/v1"
AGENT = "Glaukopis Fraktur ground truth (https://github.com/polemistes/glaukopis)"
PAUSE = 0.4
PUBLIC_ONLY = False


def usable(item):
    """Whether an item is digitised and, if only public items are asked
    for, in the public domain and readable from everywhere."""
    a = item.get("accessInfo", {})
    return bool(a.get("isDigital")) and (not PUBLIC_ONLY or (a.get("isPublicDomain") and a.get("accessAllowedFrom") == "EVERYWHERE"))


def get(url, binary=False):
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": AGENT}), timeout=120) as r:
                data = r.read()
            time.sleep(PAUSE)
            return data if binary else json.loads(data) if url.endswith(".json") or "/catalog/v1/items" in url or "/manifest" in url else data.decode("utf-8")
        except (urllib.error.URLError, TimeoutError) as e:
            if attempt == 2:
                raise
            time.sleep(3)


def years(text):
    """The first and last year a row's year field means: '1820–35' is
    1820 to 1835, '1830s–1900s' 1830 to 1909, 'annual' the century."""
    nums = re.findall(r"\d{4}s?|(?<=[–-])\d{2}s?", text)
    if not nums:
        return 1800, 1899
    lo = int(nums[0][:4])
    hi = lo
    for n in nums[1:]:
        if len(n.rstrip("s")) == 2:
            n = str(lo)[:2] + n
        hi = max(hi, int(n[:4]) + (9 if n.endswith("s") else 0))
    if nums[0].endswith("s"):
        hi = max(hi, lo + 9)
    return lo, hi


def clean_title(title):
    t = re.sub(r"\(.*?\)", " ", title)
    t = re.sub(r",\s*\d+\s*(vols|parts).*", " ", t)
    t = re.sub(r"\bany\b.*", " ", t)
    t = t.replace("…", " ").replace('"', " ")
    return " ".join(t.split())


def clean_author(author):
    a = re.sub(r"\(.*?\)", " ", author)
    a = re.sub(r"^\s*(tr\.|ed\.)\s*", "", a)
    a = re.split(r"&|,| og ", a)[0]
    a = a.replace("Brynjolf Bjarme", "Ibsen").replace("various", "")
    words = a.split()
    return words[-1] if words else ""


def search(q, lo, hi, size=20):
    params = urllib.parse.urlencode([("q", q), ("filter", "mediatype:bøker"),
                                     ("filter", f"date:[{lo}0101 TO {hi}1231]"), ("size", str(size))])
    d = get(f"{API}/items?{params}")
    return d.get("_embedded", {}).get("items", [])


def choose(items, title, lo):
    first = clean_title(title).split()[0].lower() if clean_title(title) else ""

    def score(it):
        a = it.get("accessInfo", {})
        m = it.get("metadata", {})
        issued = re.findall(r"\d{4}", str(m.get("originInfo", {}).get("issued", "")))
        year = int(issued[0]) if issued else 9999
        return (
            0 if not a.get("isDigital") else 1,
            2 if a.get("isPublicDomain") and a.get("accessAllowedFrom") == "EVERYWHERE" else 1 if a.get("accessAllowedFrom") in ("EVERYWHERE", "NORWAY") else 0,
            1 if first and first in (m.get("title") or "").lower() else 0,
            -abs(year - lo),
        )
    items = [it for it in items if usable(it)]
    if not items:
        return None
    return max(items, key=score)


def alto_lines(xml):
    return len(re.findall(r"<TextLine\b", xml))


def fetch_book(row, out, pages):
    nr = int(row["nr"])
    title, author = row["title"], row["author"]
    lo, hi = years(row["year"])
    slug = unicodedata.normalize("NFKD", clean_title(title)).encode("ascii", "ignore").decode()
    slug = re.sub(r"[^A-Za-z0-9]+", "-", slug).strip("-")[:40].lower()
    folder = os.path.join(out, f"{nr:02d}-{slug}")
    if os.path.exists(os.path.join(folder, "book.json")):
        return {"nr": nr, "status": "done before"}
    if (row.get("kind") or "").strip() == "newspaper":
        return fetch_newspaper(row, folder, lo, hi, pages)
    t, a = clean_title(title), clean_author(author)
    review = False
    if (row.get("id") or "").strip():
        # The edition chosen by hand, by the library's id.
        pick, used = get(f"{API}/items/{row['id'].strip()}"), "id " + row["id"].strip()
    else:
        tries = [f"{t} {a}".strip(), t, " ".join(t.split()[:3] + [a]).strip()]
        hits, used = [], ""
        for q in tries:
            if not q:
                continue
            hits = search(q, lo, hi)
            if hits:
                used = q
                break
        pick = choose(hits, title, lo)
        if not pick:
            return {"nr": nr, "status": "no hit", "query": tries[0], "years": f"{lo}-{hi}"}
        # A hit without the title's first word in its own title is a guess:
        # taken, but marked for review.
        first = t.split()[0].lower() if t else ""
        review = bool(first) and first not in (pick["metadata"].get("title") or "").lower()
    m, acc = pick["metadata"], pick["accessInfo"]
    manifest = get(pick["_links"]["presentation"]["href"])
    canvases = manifest["sequences"][0]["canvases"]
    n = len(canvases)
    first, last = int(n * 0.15), int(n * 0.9)
    wanted = [first + (last - first) * k // max(1, pages - 1) for k in range(pages)] if last > first else list(range(n))
    os.makedirs(folder, exist_ok=True)
    chosen = []
    taken = set()
    for want in wanted:
        for idx in range(want, min(want + 6, n)):
            if idx in taken:
                continue
            c = canvases[idx]
            urn = c["@id"].rsplit("/", 1)[-1]
            try:
                xml = get(f"{API}/metadata/{pick['id']}/altos/{urn}")
            except urllib.error.HTTPError:
                continue
            if alto_lines(xml) < 8:
                continue
            service = c["images"][0]["resource"]["service"]["@id"]
            jpg = get(f"{service}/full/full/0/default.jpg", binary=True)
            page = urn.rsplit("_", 1)[-1]
            with open(os.path.join(folder, f"page-{page}.jpg"), "wb") as f:
                f.write(jpg)
            with open(os.path.join(folder, f"page-{page}.alto.xml"), "w", encoding="utf-8") as f:
                f.write(xml)
            chosen.append({"index": idx, "page": page, "urn": urn, "width": c["width"], "height": c["height"], "lines": alto_lines(xml)})
            taken.add(idx)
            break
    book = {
        "nr": nr, "list_title": title, "list_author": author, "list_year": row["year"],
        "id": pick["id"], "urn": m.get("identifiers", {}).get("urn"), "title": m.get("title"),
        "creators": m.get("creators"), "issued": m.get("originInfo", {}).get("issued"),
        "publisher": m.get("originInfo", {}).get("publisher"), "place": m.get("originInfo", {}).get("place"),
        "access": {k: acc.get(k) for k in ("isPublicDomain", "accessAllowedFrom", "license")},
        "pages_in_scan": n, "query": used, "pages": chosen,
        "link": f"https://www.nb.no/items/{pick['id']}",
    }
    with open(os.path.join(folder, "book.json"), "w", encoding="utf-8") as f:
        json.dump(book, f, ensure_ascii=False, indent=1)
    status = "ok" if len(chosen) == pages else f"ok, {len(chosen)} pages"
    if review:
        status = "review: " + status
    return {"nr": nr, "status": status, "query": used,
            "chosen": f"{m.get('title')} | {book['issued']} | {acc.get('accessAllowedFrom')}"
                      f"{' | public domain' if acc.get('isPublicDomain') else ' | ' + str(acc.get('license'))}",
            "pages": " ".join(p["page"] for p in chosen), "folder": os.path.basename(folder)}


def fetch_newspaper(row, folder, lo, hi, pages):
    """One page from each of `pages` issues of a newspaper, spread over the
    years asked: a newspaper page holds hundreds of lines, so issues give
    more variety than pages of one. The page taken is the second of the
    issue where it has text enough, else the first."""
    nr, title = int(row["nr"]), row["title"]
    params = urllib.parse.urlencode([("q", title), ("filter", "mediatype:aviser"),
                                     ("filter", f"date:[{lo}0101 TO {hi}1231]"), ("size", "100")])
    items = [it for it in get(f"{API}/items?{params}").get("_embedded", {}).get("items", [])
             if usable(it)
             and clean_title(title).split()[0].lower() in (it["metadata"].get("title") or "").lower()]
    if not items:
        return {"nr": nr, "status": "no hit", "query": title, "years": f"{lo}-{hi}"}
    items.sort(key=lambda it: str(it["metadata"].get("originInfo", {}).get("issued", "")))
    issues = [items[k * (len(items) - 1) // max(1, pages - 1)] for k in range(min(pages, len(items)))]
    os.makedirs(folder, exist_ok=True)
    chosen = []
    for it in issues:
        canvases = get(it["_links"]["presentation"]["href"])["sequences"][0]["canvases"]
        for idx in [1, 0, 2, 3]:
            if idx >= len(canvases):
                continue
            c = canvases[idx]
            urn = c["@id"].rsplit("/", 1)[-1]
            try:
                xml = get(f"{API}/metadata/{it['id']}/altos/{urn}")
            except urllib.error.HTTPError:
                continue
            if alto_lines(xml) < 30:
                continue
            issued = str(it["metadata"].get("originInfo", {}).get("issued", ""))
            page = f"{issued}-{urn.rsplit('_', 1)[-1]}"
            jpg = get(f"{c['images'][0]['resource']['service']['@id']}/full/full/0/default.jpg", binary=True)
            with open(os.path.join(folder, f"page-{page}.jpg"), "wb") as f:
                f.write(jpg)
            with open(os.path.join(folder, f"page-{page}.alto.xml"), "w", encoding="utf-8") as f:
                f.write(xml)
            chosen.append({"page": page, "urn": urn, "id": it["id"], "issued": issued,
                           "width": c["width"], "height": c["height"], "lines": alto_lines(xml),
                           "link": f"https://www.nb.no/items/{it['id']}"})
            break
    first = issues[0]
    acc = first["accessInfo"]
    book = {
        "nr": nr, "kind": "newspaper", "list_title": title, "list_author": row.get("author", ""), "list_year": row["year"],
        "id": first["id"], "title": first["metadata"].get("title"), "issued": f"{chosen[0]['issued'][:4]}–{chosen[-1]['issued'][:4]}" if chosen else "",
        "access": {k: acc.get(k) for k in ("isPublicDomain", "accessAllowedFrom", "license")},
        "query": title, "pages": chosen, "link": f"https://www.nb.no/items/{first['id']}",
    }
    with open(os.path.join(folder, "book.json"), "w", encoding="utf-8") as f:
        json.dump(book, f, ensure_ascii=False, indent=1)
    return {"nr": nr, "status": "ok" if len(chosen) == pages else f"ok, {len(chosen)} pages", "query": title,
            "chosen": f"{book['title']} | {book['issued']} | {acc.get('accessAllowedFrom')}",
            "pages": " ".join(p["page"] for p in chosen), "folder": os.path.basename(folder)}


def main():
    p = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    p.add_argument("csv")
    p.add_argument("out")
    p.add_argument("--pages", type=int, default=6)
    p.add_argument("--only", help="row numbers, comma-separated")
    p.add_argument("--public-only", action="store_true", help="public domain, readable from everywhere, only")
    a = p.parse_args()
    global PUBLIC_ONLY
    PUBLIC_ONLY = a.public_only
    only = {int(x) for x in a.only.split(",")} if a.only else None
    os.makedirs(a.out, exist_ok=True)
    report = os.path.join(a.out, "report.tsv")
    new = not os.path.exists(report)
    with open(a.csv, encoding="utf-8") as f, open(report, "a", encoding="utf-8") as rep:
        if new:
            rep.write("nr\tstatus\tquery\tchosen\tpages\tfolder\n")
        for row in csv.DictReader(f):
            if only and int(row["nr"]) not in only:
                continue
            try:
                r = fetch_book(row, a.out, a.pages)
            except Exception as e:  # one book failing must not end the run
                r = {"nr": row["nr"], "status": f"failed: {type(e).__name__}: {str(e)[:80]}"}
            print(f"{r['nr']:>3} {r['status']}: {r.get('chosen', r.get('query', ''))}", flush=True)
            if r["status"] != "done before":
                rep.write("\t".join(str(r.get(k, "")) for k in ("nr", "status", "query", "chosen", "pages", "folder")) + "\n")
                rep.flush()


if __name__ == "__main__":
    main()
