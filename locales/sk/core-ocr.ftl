# What the core says of text read from PDFs and pictures, in English.
# See locales/README.md.

## What a file is.

ocr-kind-pdf = PDF
ocr-kind-picture = Obrázok

## When text cannot be read.

ocr-stopped = Čítanie bolo zastavené.
ocr-no-language = Tesseract nemá dáta pre jazyk „{ $language }“.
ocr-no-languages = Tesseract nemá dáta pre žiadny jazyk. Nainštalujte dáta niektorého, napríklad tesseract-data-eng na Archu.
ocr-not-pdf = „{ $file }“ nie je PDF.
ocr-no-pages = „{ $file }“ nemá strany.
ocr-locked = „{ $file }“ je zamknutý heslom a jeho strany sa nedajú vykresliť.
ocr-unreadable = „{ $file }“ sa nepodarilo prečítať ako PDF. Môže byť poškodený.
ocr-page-not-drawn = Stranu { $page } sa nepodarilo vykresliť.
ocr-picture-unreadable = Obrázok sa nepodarilo prečítať: { $message }
ocr-drawing = Kresba (SVG) nemá v sebe obrázok, z ktorého by sa dal čítať text.

## Making a PDF searchable.

ocr-searchable-locked = PDF je zamknuté a nedá sa urobiť prehľadávateľným. Jeho text sa však dá načítať do projektu ako mapa.
ocr-searchable-unreadable = PDF sa nepodarilo urobiť prehľadávateľným: { $message }
ocr-not-whole = čo sa vytvorilo, sa nedalo spätne prečítať celé a nebolo uchované.

## What the one who reads a PDF should know, before the map is made.

ocr-remark-failed = Stranu { $page } sa nepodarilo prečítať: { $message }
ocr-remark-more-failed = { $count ->
    [one] Ešte jednu stranu sa nepodarilo prečítať.
    [few] Ešte { $count } strany sa nepodarilo prečítať.
   *[other] Ešte { $count } strán sa nepodarilo prečítať.
}
ocr-remark-empty = Nenašiel sa žiadny text.
