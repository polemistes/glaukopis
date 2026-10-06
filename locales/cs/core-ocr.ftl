# What the core says of text read from PDFs and pictures, in English.
# See locales/README.md.

## What a file is.

ocr-kind-pdf = PDF
ocr-kind-picture = Obrázek

## When text cannot be read.

ocr-stopped = Čtení bylo zastaveno.
ocr-no-language = Tesseract nemá data pro jazyk „{ $language }“.
ocr-no-languages = Tesseract nemá data pro žádný jazyk. Nainstalujte data některého, například tesseract-data-eng na Archu.
ocr-not-pdf = „{ $file }“ není PDF.
ocr-no-pages = „{ $file }“ nemá žádné stránky.
ocr-locked = „{ $file }“ je zamčen heslem a jeho stránky nelze vykreslit.
ocr-unreadable = „{ $file }“ nelze přečíst jako PDF. Může být poškozen.
ocr-page-not-drawn = Stránku { $page } nelze vykreslit.
ocr-picture-unreadable = Obrázek nelze přečíst: { $message }
ocr-drawing = Kresba (SVG) v sobě nemá žádný obrázek, z něhož by se dal číst text.

## Making a PDF searchable.

ocr-searchable-locked = PDF je zamčeno a nelze je učinit prohledávatelným. Jeho text lze přesto načíst do projektu jako mapu.
ocr-searchable-unreadable = PDF nelze učinit prohledávatelným: { $message }
ocr-not-whole = co bylo vytvořeno, se nepřečetlo zpět celé, a nebylo uchováno.

## What the one who reads a PDF should know, before the map is made.

ocr-remark-read = { $count ->
    [one] Jedna stránka byla přečtena ze svého obrazu.
    [few] { $count } stránky byly přečteny ze svých obrazů.
   *[other] { $count } stránek bylo přečteno ze svých obrazů.
}
ocr-remark-text = { $count ->
    [one] Jedna stránka měla text, který je převzat tak, jak jej má soubor.
    [few] { $count } stránky měly text, který je převzat tak, jak jej má soubor.
   *[other] { $count } stránek mělo text, který je převzat tak, jak jej má soubor.
}
ocr-remark-no-tesseract = { $count ->
    [one] Jedna stránka nemá text a zůstává prázdná: Tesseract, který čte text v obrázcích, není nainstalován.
    [few] { $count } stránky nemají text a zůstávají prázdné: Tesseract, který čte text v obrázcích, není nainstalován.
   *[other] { $count } stránek nemá text a zůstává prázdných: Tesseract, který čte text v obrázcích, není nainstalován.
}
ocr-remark-not-read = Stránky bez textu nelze přečíst: { $message }
ocr-remark-failed = Stránku { $page } nelze přečíst: { $message }
ocr-remark-more-failed = { $count ->
    [one] Ještě jednu stránku nelze přečíst.
    [few] Ještě { $count } stránky nelze přečíst.
   *[other] Ještě { $count } stránek nelze přečíst.
}
ocr-remark-empty = Nebyl nalezen žádný text.
