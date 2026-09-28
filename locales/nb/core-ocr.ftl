# Det kjernen sier om tekst som leses fra PDF-er og bilder, på bokmål.
# Se locales/README.md.

## Hva en fil er.

ocr-kind-pdf = PDF
ocr-kind-picture = Bilde

## Når tekst ikke kan leses.

ocr-stopped = Lesingen ble stoppet.
ocr-no-language = Tesseract har ikke data for språket «{ $language }».
ocr-no-languages = Tesseract har ikke data for noe språk. Installer dataene for ett, for eksempel tesseract-data-eng på Arch.
ocr-not-pdf = «{ $file }» er ikke en PDF.
ocr-no-pages = «{ $file }» har ingen sider.
ocr-locked = «{ $file }» er låst med passord, og sidene kan ikke tegnes.
ocr-unreadable = «{ $file }» kunne ikke leses som PDF. Den kan være skadet.
ocr-page-not-drawn = Side { $page } kunne ikke tegnes.
ocr-picture-unreadable = Bildet kunne ikke leses: { $message }
ocr-drawing = En tegning (SVG) har ikke noe bilde å lese tekst fra.

## Å gjøre en PDF søkbar.

ocr-searchable-locked = PDF-en er låst, og kan ikke gjøres søkbar. Teksten kan likevel tas inn i et prosjekt som et kart.
ocr-searchable-unreadable = PDF-en kunne ikke gjøres søkbar: { $message }
ocr-not-whole = det som ble laget, kunne ikke leses helt igjen, og ble ikke beholdt.

## Det den som leser en PDF bør vite før kartet lages.

ocr-remark-read = { $count ->
    [one] Én side ble lest fra et bilde av den.
   *[other] { $count } sider ble lest fra bilder av dem.
}
ocr-remark-text = { $count ->
    [one] Én side hadde tekst, som tas slik filen har den.
   *[other] { $count } sider hadde tekst, som tas slik filen har den.
}
ocr-remark-no-tesseract = { $count ->
    [one] Én side har ingen tekst, og blir stående tom: Tesseract, som leser tekst i bilder, er ikke installert.
   *[other] { $count } sider har ingen tekst, og blir stående tomme: Tesseract, som leser tekst i bilder, er ikke installert.
}
ocr-remark-not-read = Sidene uten tekst kunne ikke leses: { $message }
ocr-remark-failed = Side { $page } kunne ikke leses: { $message }
ocr-remark-more-failed = { $count ->
    [one] Én side til kunne ikke leses.
   *[other] { $count } sider til kunne ikke leses.
}
ocr-remark-empty = Ingen tekst ble funnet.
