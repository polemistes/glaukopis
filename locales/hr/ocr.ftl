# Text read from PDFs and pictures by Tesseract: in the dialog of documents
# brought in, in the files of a reference, in the store of pictures, and in
# the settings. See locales/README.md.

## Reading

ocr-filter = PDF-ovi i slike
ocr-no-tesseract = Tesseract, koji čita tekst na slikama, nije instaliran ili ga nije moguće pronaći. Instalirajte ga upraviteljem paketa svojega sustava, s podacima za jezike koje čitate (na Archu: tesseract i tesseract-data-eng, tesseract-data-hrv i tako dalje), ili u postavkama recite gdje je.
ocr-failed = Tekst nije bilo moguće pročitati.
ocr-looking = Gledanje { $file }…
ocr-about-picture = Tekst se čita sa slike.
ocr-about-scan = { $pages ->
    [one] PDF nema teksta: čita se sa slike njegove stranice.
    [few] Nijedna od { $pages } stranice nema teksta: čitaju se s njihovih slika.
   *[other] Nijedna od { $pages } stranica nema teksta: čitaju se s njihovih slika.
}
ocr-about-some = { $without ->
    [one] { $without } od { $pages } stranica nema teksta i čita se sa slike; ostale se uzimaju kakve jesu.
    [few] { $without } od { $pages } stranica nemaju teksta i čitaju se sa slika; ostale se uzimaju kakve jesu.
   *[other] { $without } od { $pages } stranica nema teksta i čitaju se sa slika; ostale se uzimaju kakve jesu.
}
ocr-about-text = { $pages ->
    [one] Stranica ima tekst, koji se uzima kakav jest.
    [few] Svaka stranica ima tekst, koji se uzima kakav jest.
   *[other] Svaka stranica ima tekst, koji se uzima kakav jest.
}
ocr-read-all = Čitaj i stranice koje imaju tekst
ocr-read-all-hint = Njihov tekst ostaje, a pročitano se polaže preko njega.
ocr-read-all-map-hint = Pročitano zauzima mjesto njihova teksta: za kad je loš, ili se ne može pročitati.
ocr-read = Pročitaj tekst
ocr-read-text-pages = Uzmi stranice koje imaju tekst
ocr-take-text = Uzmi tekst
ocr-reading = Čitanje { $file }…
ocr-reading-pages = { $total ->
    [one] Pročitano { $done } od { $total } stranice
    [few] Pročitano { $done } od { $total } stranice
   *[other] Pročitano { $done } od { $total } stranica
}
ocr-reading-hint = Stranica traje nekoliko sekundi. Odustani zaustavlja čitanje.

## How the text is read: what to try when a reading goes badly

ocr-how = Kako se čita
ocr-how-dpi = Razlučivost, u točkama po inču
ocr-how-layout = Raspored stranice
ocr-how-layout-auto = Kako Tesseract prosudi
ocr-how-layout-column = Jedan stupac
ocr-how-layout-block = Jedan blok teksta
ocr-how-layout-sparse = Rijedak tekst
ocr-how-contrast = Crno-bijelo
ocr-how-hint = Što pokušati kad čitanje pođe loše: veću razlučivost za sitan tisak, jedan stupac gdje se stupci miješaju, jedan blok teksta za jedan odlomak, a crno-bijelo za tisak koji je blijed ili neujednačen.

## The languages of the text

ocr-languages = Jezici teksta
ocr-languages-hint = Najvjerojatniji prvi. Svaki daljnji usporava čitanje, a ne čini ga uvijek boljim.
ocr-language-add = Dodaj jezik…
ocr-language-remove = Makni { $language }
# A script rather than a language: "Latin script".
ocr-language-script = { $script }, pismo
ocr-language-fraktur = { $language }, fraktura
ocr-language-old = { $language }, stariji
ocr-language-vertical = { $language }, pisano okomito

## A PDF of the library made searchable

ocr-searchable-button = Učini pretraživim…
ocr-searchable-title = Učini PDF pretraživim
ocr-searchable-about = { $without ->
    [one] { $without } od { $pages } stranica nema teksta. Čita se, a njezin se tekst nevidljivo polaže ispod prikazanoga, da se može pretraživati i kopirati. PDF izgleda kao i prije.
    [few] { $without } od { $pages } stranica nemaju teksta. Čitaju se, a njihov se tekst nevidljivo polaže ispod prikazanoga, da se može pretraživati i kopirati. PDF izgleda kao i prije.
   *[other] { $without } od { $pages } stranica nema teksta. Čitaju se, a njihov se tekst nevidljivo polaže ispod prikazanoga, da se može pretraživati i kopirati. PDF izgleda kao i prije.
}
ocr-searchable-has-text = { $pages ->
    [one] Stranica ima tekst: PDF se već može pretraživati.
    [few] Svaka stranica ima tekst: PDF se već može pretraživati.
   *[other] Svaka stranica ima tekst: PDF se već može pretraživati.
}
ocr-searchable-damaged = PDF nije bilo moguće rastaviti da bi se izmijenio: možda je oštećen. Njegov se tekst ipak može učitati u projekt kao mapa.
ocr-searchable-make = Učini pretraživim
ocr-strip = Makni nevidljivi tekst koji imaju i zadrži samo pročitano
ocr-strip-hint = Za loš tekstni sloj, kakav skener polaže ispod stranice. Slova koja se vide ostaju, a stranica izgleda kao i prije.
ocr-searchable-done = { $count ->
    [1] PDF je pretraživ: pročitana je jedna stranica
    [one] PDF je pretraživ: pročitana je { $count } stranica
    [few] PDF je pretraživ: pročitane su { $count } stranice
   *[other] PDF je pretraživ: pročitano je { $count } stranica
}
ocr-searchable-failed = { $count ->
    [1] Jednu stranicu nije bilo moguće pročitati.
    [one] { $count } stranicu nije bilo moguće pročitati.
    [few] { $count } stranice nije bilo moguće pročitati.
   *[other] { $count } stranica nije bilo moguće pročitati.
}

## A map from a PDF of the library

ocr-map-button = Mapa njegova teksta…
ocr-map-title = Mapa teksta
ocr-map-into = U projekt
ocr-map-new-project = Novi projekt, nazvan po njemu
ocr-map-making = Izrada mape…
ocr-map-failed = Mapu nije bilo moguće načiniti.

## The text of a picture of the store

ocr-picture-read = Pročitaj tekst na njoj…
ocr-picture-title = Tekst na slici
ocr-picture-empty = Na slici nije pronađen tekst.
ocr-picture-copy = Kopiraj
ocr-picture-copied = Tekst je kopiran
ocr-picture-map = Načini mapu od njega

## Tesseract in the settings

ocr-settings-looking = Traženje…
ocr-settings-missing = Nije pronađen. Potreban je za čitanje teksta sa skenova i slika. Instalirajte tesseract upraviteljem paketa svojega sustava, s podacima za jezike koje čitate (na Archu tesseract-data-eng za engleski, tesseract-data-hrv za hrvatski, tesseract-data-grc za starogrčki, …), ili dolje recite gdje je.
ocr-settings-by-itself = Pronađen sam od sebe
ocr-settings-where = Gdje je Tesseract
ocr-settings-look-failed = Tesseract nije bilo moguće potražiti
ocr-settings-has = Čita { $languages }.
ocr-settings-has-none = Nema podataka ni za jedan jezik: instalirajte podatke za neki, npr. tesseract-data-eng.
ocr-settings-first = Isprva čitaj na
ocr-settings-first-hint = Kad nijedan nije odabran, jezik teksta i jezik sučelja.
ocr-settings-how = Kako se tekst isprva čita
