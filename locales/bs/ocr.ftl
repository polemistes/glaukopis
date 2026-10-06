# Text read from PDFs and pictures by Tesseract: in the dialog of documents
# brought in, in the files of a reference, in the store of pictures, and in
# the settings. See locales/README.md.

## Reading

ocr-filter = PDF-ovi i slike
ocr-no-tesseract = Tesseract, koji čita tekst na slikama, nije instaliran ili ga nije bilo moguće pronaći. Instalirajte ga upraviteljem paketa svog sistema, s podacima za jezike koje čitate (na Archu: tesseract i tesseract-data-eng, tesseract-data-nor i tako dalje), ili u postavkama recite gdje se nalazi.
ocr-failed = Tekst nije bilo moguće pročitati.
ocr-looking = Pregledanje { $file }…
ocr-about-picture = Tekst se čita sa slike.
ocr-about-scan = { $pages ->
    [one] PDF nema teksta: čita se sa slike njegove stranice.
    [few] Nijedna od { $pages } stranice nema teksta: čitaju se s njihovih slika.
   *[other] Nijedna od { $pages } stranica nema teksta: čitaju se s njihovih slika.
}
ocr-about-some = { $without ->
    [one] Jedna od { $pages } stranica nema teksta i čita se s njene slike; ostale se uzimaju kakve jesu.
    [few] { $without } od { $pages } stranica nemaju teksta i čitaju se s njihovih slika; ostale se uzimaju kakve jesu.
   *[other] { $without } od { $pages } stranica nema teksta i čitaju se s njihovih slika; ostale se uzimaju kakve jesu.
}
ocr-about-text = { $pages ->
    [one] Stranica ima tekst, koji se uzima kakav jeste.
    [few] Svaka stranica ima tekst, koji se uzima kakav jeste.
   *[other] Svaka stranica ima tekst, koji se uzima kakav jeste.
}
ocr-read-all = Pročitaj i stranice koje imaju tekst
ocr-read-all-hint = Njihov tekst ostaje, a pročitano se polaže preko njega.
ocr-read-all-map-hint = Pročitano zauzima mjesto njihovog teksta: za kad je loš ili se ne može pročitati.
ocr-read = Pročitaj tekst
ocr-read-text-pages = Uzmi stranice koje imaju tekst
ocr-take-text = Uzmi tekst
ocr-reading = Čitanje { $file }…
ocr-reading-pages = { $done } od { $total } stranica pročitano
ocr-reading-hint = Stranica traje nekoliko sekundi. Odustani zaustavlja čitanje.

## How the text is read: what to try when a reading goes badly

ocr-how = Kako se čita
ocr-how-dpi = Rezolucija, u tačkama po inču
ocr-how-layout = Raspored stranice
ocr-how-layout-auto = Kako Tesseract procijeni
ocr-how-layout-column = Jedna kolona
ocr-how-layout-block = Jedan blok teksta
ocr-how-layout-sparse = Rijedak tekst
ocr-how-contrast = Crno-bijelo
ocr-how-hint = Šta pokušati kad čitanje loše prođe: veću rezoluciju za sitan tisak, jednu kolonu gdje se kolone miješaju, jedan blok teksta za jedan pasus, a crno-bijelo za blijed ili neujednačen otisak.

## The languages of the text

ocr-languages = Jezici teksta
ocr-languages-hint = Najvjerovatniji prvi. Svaki dodatni usporava čitanje, a ne čini ga uvijek boljim.
ocr-language-add = Dodaj jezik…
ocr-language-remove = Ukloni { $language }
# A script rather than a language: "Latin script".
ocr-language-script = { $script } pismo
ocr-language-fraktur = { $language }, fraktura
ocr-language-old = { $language }, stariji
ocr-language-vertical = { $language }, pisan odozgo nadolje

## A PDF of the library made searchable

ocr-searchable-button = Učini pretraživim…
ocr-searchable-title = Učini PDF pretraživim
ocr-searchable-about = { $without ->
    [one] Jedna od { $pages } stranica nema teksta. Čita se, a njen se tekst nevidljivo polaže ispod prikazanog, da se može pretraživati i kopirati. PDF izgleda kao i prije.
    [few] { $without } od { $pages } stranica nemaju teksta. Čitaju se, a njihov se tekst nevidljivo polaže ispod prikazanog, da se može pretraživati i kopirati. PDF izgleda kao i prije.
   *[other] { $without } od { $pages } stranica nema teksta. Čitaju se, a njihov se tekst nevidljivo polaže ispod prikazanog, da se može pretraživati i kopirati. PDF izgleda kao i prije.
}
ocr-searchable-has-text = { $pages ->
    [one] Stranica ima tekst: PDF se već može pretraživati.
    [few] Svaka stranica ima tekst: PDF se već može pretraživati.
   *[other] Svaka stranica ima tekst: PDF se već može pretraživati.
}
ocr-searchable-damaged = PDF nije bilo moguće rastaviti radi izmjene: možda je oštećen. Njegov se tekst ipak može učitati u projekat kao mapa.
ocr-searchable-make = Učini pretraživim
ocr-strip = Ukloni nevidljivi tekst koji imaju i zadrži samo pročitano
ocr-strip-hint = Za loš tekstualni sloj, kakav skener polaže ispod stranice. Slova koja se vide ostaju, a stranica izgleda kao i prije.
ocr-searchable-done = { $count ->
    [one] PDF je pretraživ: pročitana je jedna stranica
    [few] PDF je pretraživ: pročitane su { $count } stranice
   *[other] PDF je pretraživ: pročitano je { $count } stranica
}
ocr-searchable-failed = { $count ->
    [one] Jednu stranicu nije bilo moguće pročitati.
    [few] { $count } stranice nije bilo moguće pročitati.
   *[other] { $count } stranica nije bilo moguće pročitati.
}

## A map from a PDF of the library

ocr-map-button = Mapa njegovog teksta…
ocr-map-title = Mapa teksta
ocr-map-into = U projekat
ocr-map-new-project = Novi projekat, nazvan po njemu
ocr-map-making = Pravljenje mape…
ocr-map-failed = Mapu nije bilo moguće napraviti.

## The text of a picture of the store

ocr-picture-read = Pročitaj tekst na njoj…
ocr-picture-title = Tekst na slici
ocr-picture-empty = Na slici nije pronađen nikakav tekst.
ocr-picture-copy = Kopiraj
ocr-picture-copied = Tekst je kopiran
ocr-picture-map = Napravi mapu od njega

## Tesseract in the settings

ocr-settings-looking = Traženje…
ocr-settings-missing = Nije pronađen. Potreban je za čitanje teksta sa skenova i slika. Instalirajte tesseract upraviteljem paketa svog sistema, s podacima za jezike koje čitate (tesseract-data-eng za engleski na Archu, tesseract-data-nor za norveški, tesseract-data-grc za starogrčki, …), ili dolje recite gdje se nalazi.
ocr-settings-by-itself = Pronađen sam od sebe
ocr-settings-where = Gdje je Tesseract
ocr-settings-look-failed = Tesseract nije bilo moguće potražiti
ocr-settings-has = Čita { $languages }.
ocr-settings-has-none = Nema podatke ni za jedan jezik: instalirajte podatke za neki, kao tesseract-data-eng.
ocr-settings-first = Isprva čitaj na
ocr-settings-first-hint = Kad nijedan nije odabran, jezik teksta i jezik sučelja.
ocr-settings-how = Kako se tekst isprva čita
