# Det kjernen sier om tekst som leses fra PDF-er og bilder, på bokmål.
# Se locales/README.md.

## Hva en fil er.

ocr-kind-pdf = PDF
ocr-no-headings = Ingen overskrift ble funnet: sidene er elementene.
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
ocr-no-such-page = PDF-en har ingen side { $page }: den har { $pages }.
ocr-picture-unreadable = Bildet kunne ikke leses: { $message }
ocr-not-made = Tesseract laget ikke { $path }.
ocr-not-made-said = Tesseract laget ikke { $path }. Den sa: { $message }
ocr-child-time = Lesingen av «{ $file }» tok lengre tid enn den får, og ble stoppet. Filen kan være skadet, eller laget slik at den ikke kan leses.
ocr-child-memory = Lesingen av «{ $file }» tok mer minne enn den får, og ble stoppet. Filen kan være skadet, eller laget slik at den ikke kan leses.
ocr-child-failed = «{ $file }» kunne ikke leses: { $message }
ocr-child-not-started = «{ $file }» kunne ikke leses, fordi ingen prosess kunne startes for å lese den: { $message }
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
ocr-remark-poorly = { $count ->
    [one] Én side ble lest dårlig: { $pages }. Et annet språk, frakturmodellen for gotisk skrift eller et annet oppsett av siden kan lese den bedre; prøv den før du leser den på nytt.
   *[other] { $count } sider ble lest dårlig: { $pages }. Et annet språk, frakturmodellen for gotisk skrift eller et annet oppsett av siden kan lese dem bedre; prøv en side før du leser alle på nytt.
}
ocr-remark-fraktur = Bøker med gotisk skrift, slik mange norske, danske, svenske og tyske bøker hadde før omkring 1900, leses med frakturmodellen, valgt først eller alene, uansett språk. Den kjenner ikke æ, ø og å, og leser dem som e, o og a.
# Det samme, der norsk eller dansk ble lest: frakturmodellen fra Glaukopis' tjener, som kjenner æ, ø og å.
ocr-remark-fraktur-dan = Norske og danske bøker med gotisk skrift, slik mange hadde før omkring 1900, leses med Fraktur, dansk og norsk, hentet fra Glaukopis' tjener og valgt først eller alene, uansett hvilke språk som står ved siden av: den kjenner æ, ø og å, som frakturmodellen laget for tysk ikke gjør.

## Hva en lesning av en PDF ga.

ocr-remark-counts = { $read ->
    [0] Ingen side lest av Tesseract
    [one] Én side lest av Tesseract
   *[other] { $read } sider lest av Tesseract
}, { $taken ->
    [0] ingen tatt fra PDF-ens egen tekst
    [one] én tatt fra PDF-ens egen tekst
   *[other] { $taken } tatt fra PDF-ens egen tekst
}, { $failed ->
    [0] ingen som ikke kunne leses.
    [one] én som ikke kunne leses.
   *[other] { $failed } som ikke kunne leses.
}
ocr-page-failed-line = [Denne siden kunne ikke leses: { $message }]
ocr-why-no-tesseract = Tesseract, som leser tekst i bilder, er ikke installert.
