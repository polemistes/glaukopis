# Det kjernen sier om tekst som leses fra PDF-er og bilder, på bokmål.
# Se locales/README.md.

## Hva en fil er.

ocr-kind-pdf = PDF
ocr-kind-picture = Bilde

## Når tekst ikke kan leses.

ocr-stopped = Lesingen ble stoppet.
ocr-no-language = Tesseract har ikke data for språket «{ $language }».
ocr-no-languages = Tesseract har ikke data for noe språk. Importer ett under Innstillinger › Programmer, eller installer ett med pakkebehandleren på systemet, for eksempel tesseract-data-eng på Arch.
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

ocr-remark-failed = Side { $page } kunne ikke leses: { $message }
ocr-remark-more-failed = { $count ->
    [one] Én side til kunne ikke leses.
   *[other] { $count } sider til kunne ikke leses.
}
ocr-remark-empty = Ingen tekst ble funnet.

## Hva en lesning av en PDF ga.

ocr-remark-counts = { $read ->
    [0] Ingen side lest av Tesseract
    [one] Én side lest av Tesseract
   *[other] { $read } sider lest av Tesseract
}, { $taken ->
    [one] én tatt fra PDF-ens egen tekst
   *[other] { $taken } tatt fra PDF-ens egen tekst
}, { $failed ->
    [0] ingen som ikke kunne leses.
    [one] én som ikke kunne leses.
   *[other] { $failed } som ikke kunne leses.
}
ocr-page-failed-line = [Denne siden kunne ikke leses: { $message }]
ocr-why-no-tesseract = Tesseract, som leser tekst i bilder, er ikke installert.
