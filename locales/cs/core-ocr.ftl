# What the core says of text read from PDFs and pictures, in English.
# See locales/README.md.

## What a file is.

ocr-kind-pdf = PDF
ocr-no-headings = Nebyl nalezen žádný nadpis: prvky jsou stránky.
ocr-kind-picture = Obrázek

## When text cannot be read.

ocr-stopped = Čtení bylo zastaveno.
ocr-no-language = Tesseract nemá data pro jazyk „{ $language }“.
ocr-no-languages = Tesseract nemá data pro žádný jazyk. Importujte některý v Nastavení › Programy, nebo ho nainstalujte správcem balíčků svého systému, například tesseract-data-eng na Archu.
ocr-not-pdf = „{ $file }“ není PDF.
ocr-no-pages = „{ $file }“ nemá žádné stránky.
ocr-locked = „{ $file }“ je zamčen heslem a jeho stránky nelze vykreslit.
ocr-unreadable = „{ $file }“ nelze přečíst jako PDF. Může být poškozen.
ocr-page-not-drawn = Stránku { $page } nelze vykreslit.
ocr-picture-unreadable = Obrázek nelze přečíst: { $message }
ocr-not-made = Tesseract nevytvořil { $path }.
ocr-not-made-said = Tesseract nevytvořil { $path }. Řekl: { $message }
ocr-drawing = Kresba (SVG) v sobě nemá žádný obrázek, z něhož by se dal číst text.

## Making a PDF searchable.

ocr-searchable-locked = PDF je zamčeno a nelze je učinit prohledávatelným. Jeho text lze přesto načíst do projektu jako mapu.
ocr-searchable-unreadable = PDF nelze učinit prohledávatelným: { $message }
ocr-not-whole = co bylo vytvořeno, se nepřečetlo zpět celé, a nebylo uchováno.

## What the one who reads a PDF should know, before the map is made.

ocr-remark-failed = Stránku { $page } nelze přečíst: { $message }
ocr-remark-more-failed = { $count ->
    [one] Ještě jednu stránku nelze přečíst.
    [few] Ještě { $count } stránky nelze přečíst.
   *[other] Ještě { $count } stránek nelze přečíst.
}
ocr-remark-empty = Nebyl nalezen žádný text.

## What a reading of a PDF came to (ADR 0044).

ocr-remark-counts = { $read ->
    [0] Tesseract nepřečetl žádnou stránku
    [one] Tesseract přečetl jednu stránku
    [few] Tesseract přečetl { $read } stránky
   *[other] Tesseract přečetl { $read } stránek
}, { $taken ->
    [0] z vlastního textu PDF nebyla převzata žádná
    [one] z vlastního textu PDF byla převzata jedna
    [few] z vlastního textu PDF byly převzaty { $taken }
   *[other] z vlastního textu PDF bylo převzato { $taken }
} a { $failed ->
    [0] žádnou nebylo možné přečíst.
    [one] jednu nebylo možné přečíst.
    [few] { $failed } nebylo možné přečíst.
   *[other] { $failed } nebylo možné přečíst.
}
# Stands in the element in the place of a page that could not be read.
ocr-page-failed-line = [Tuto stránku se nepodařilo přečíst: { $message }]
ocr-why-no-tesseract = Tesseract, který čte text v obrázcích, není nainstalován.
