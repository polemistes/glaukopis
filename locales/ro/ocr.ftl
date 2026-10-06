# Text read from PDFs and pictures by Tesseract: in the dialog of documents
# brought in, in the files of a reference, in the store of pictures, and in
# the settings. See locales/README.md.

## Reading

ocr-filter = PDF-uri și imagini
ocr-no-tesseract = Tesseract, care citește textul din imagini, nu este instalat sau nu a putut fi găsit. Instalați-l cu gestionarul de pachete al sistemului, cu datele limbilor pe care le citiți (pe Arch: tesseract și tesseract-data-eng, tesseract-data-ron și așa mai departe), sau spuneți în setări unde este.
ocr-failed = Textul nu s-a putut citi.
ocr-looking = Se privește { $file }…
ocr-about-picture = Textul se citește din imagine.
ocr-about-scan = { $pages ->
    [one] PDF-ul nu are text: se citește dintr-o imagine a paginii lui.
    [few] Niciuna dintre cele { $pages } pagini nu are text: se citesc din imagini ale lor.
   *[other] Niciuna dintre cele { $pages } de pagini nu are text: se citesc din imagini ale lor.
}
ocr-about-some = { $without ->
    [one] Una dintre cele { $pages ->
            [one] { $pages } pagină
            [few] { $pages } pagini
           *[other] { $pages } de pagini
        } nu are text și se citește dintr-o imagine a ei; celelalte se iau cum sunt.
    [few] { $without } dintre cele { $pages ->
            [one] { $pages } pagină
            [few] { $pages } pagini
           *[other] { $pages } de pagini
        } nu au text și se citesc din imagini ale lor; celelalte se iau cum sunt.
   *[other] { $without } dintre cele { $pages ->
            [one] { $pages } pagină
            [few] { $pages } pagini
           *[other] { $pages } de pagini
        } nu au text și se citesc din imagini ale lor; celelalte se iau cum sunt.
}
ocr-about-text = { $pages ->
    [one] Pagina are text, care se ia cum este.
    [few] Fiecare pagină are text, care se ia cum este.
   *[other] Fiecare pagină are text, care se ia cum este.
}
ocr-read-all = Citește și paginile care au text
ocr-read-all-hint = Textul lor rămâne, iar ce se citește se așază peste el.
ocr-read-all-map-hint = Ce se citește ia locul textului lor: pentru când acesta este slab sau nu se poate citi.
ocr-read = Citește textul
ocr-read-text-pages = Ia paginile care au text
ocr-take-text = Ia textul
ocr-reading = Se citește { $file }…
ocr-reading-pages = { $total ->
    [one] { $done } din { $total } pagină citită
    [few] { $done } din { $total } pagini citite
   *[other] { $done } din { $total } de pagini citite
}
ocr-reading-hint = O pagină ia câteva secunde. Anulează oprește citirea.

## How the text is read: what to try when a reading goes badly

ocr-how = Cum se citește
ocr-how-dpi = Rezoluția, în puncte pe inch
ocr-how-layout = Așezarea paginii
ocr-how-layout-auto = Cum socotește Tesseract
ocr-how-layout-column = O coloană
ocr-how-layout-block = Un bloc de text
ocr-how-layout-sparse = Text răzleț
ocr-how-contrast = Alb și negru
ocr-how-hint = Ce să încercați când o citire merge prost: o rezoluție mai mare pentru literele mici, o coloană acolo unde coloanele se încurcă, un bloc de text pentru un singur paragraf și alb și negru pentru un tipar șters sau neuniform.

## The languages of the text

ocr-languages = Limbile textului
ocr-languages-hint = Cea mai probabilă prima. Fiecare în plus face citirea mai înceată, și nu întotdeauna mai bună.
ocr-language-add = Adaugă o limbă…
ocr-language-remove = Scoate { $language }
# A script rather than a language: "Latin script".
ocr-language-script = scrierea { $script }
ocr-language-fraktur = { $language }, Fraktur
ocr-language-old = { $language }, mai veche
ocr-language-vertical = { $language }, scrisă pe verticală

## A PDF of the library made searchable

ocr-searchable-button = Fă-l căutabil…
ocr-searchable-title = Fă PDF-ul căutabil
ocr-searchable-about = { $without ->
    [one] Una dintre cele { $pages ->
            [one] { $pages } pagină
            [few] { $pages } pagini
           *[other] { $pages } de pagini
        } nu are text. Se citește, iar textul ei se așază nevăzut sub ce se arată, ca să poată fi căutat și copiat. PDF-ul arată ca înainte.
    [few] { $without } dintre cele { $pages ->
            [one] { $pages } pagină
            [few] { $pages } pagini
           *[other] { $pages } de pagini
        } nu au text. Se citesc, iar textul lor se așază nevăzut sub ce se arată, ca să poată fi căutat și copiat. PDF-ul arată ca înainte.
   *[other] { $without } dintre cele { $pages ->
            [one] { $pages } pagină
            [few] { $pages } pagini
           *[other] { $pages } de pagini
        } nu au text. Se citesc, iar textul lor se așază nevăzut sub ce se arată, ca să poată fi căutat și copiat. PDF-ul arată ca înainte.
}
ocr-searchable-has-text = { $pages ->
    [one] Pagina are text: PDF-ul se poate căuta deja.
    [few] Fiecare pagină are text: PDF-ul se poate căuta deja.
   *[other] Fiecare pagină are text: PDF-ul se poate căuta deja.
}
ocr-searchable-damaged = PDF-ul nu s-a putut desface ca să fie modificat: poate fi stricat. Textul lui poate fi totuși adus într-un proiect ca hartă.
ocr-searchable-make = Fă-l căutabil
ocr-strip = Scoate textul nevăzut pe care îl au și păstrează numai ce se citește
ocr-strip-hint = Pentru un strat de text slab, cum îl așază un scaner sub pagină. Literele care se văd rămân, iar pagina arată ca înainte.
ocr-searchable-done = { $count ->
    [one] PDF-ul se poate căuta: s-a citit o pagină
    [few] PDF-ul se poate căuta: s-au citit { $count } pagini
   *[other] PDF-ul se poate căuta: s-au citit { $count } de pagini
}
ocr-searchable-failed = { $count ->
    [one] O pagină nu s-a putut citi.
    [few] { $count } pagini nu s-au putut citi.
   *[other] { $count } de pagini nu s-au putut citi.
}

## A map from a PDF of the library

ocr-map-button = O hartă a textului lui…
ocr-map-title = O hartă a textului
ocr-map-into = În proiectul
ocr-map-new-project = Un proiect nou, numit după el
ocr-map-making = Se face harta…
ocr-map-failed = Harta nu s-a putut face.

## The text of a picture of the store

ocr-picture-read = Citește textul din ea…
ocr-picture-title = Textul din imagine
ocr-picture-empty = Nu s-a găsit niciun text în imagine.
ocr-picture-copy = Copiază
ocr-picture-copied = Textul este copiat
ocr-picture-map = Fă o hartă din el

## Tesseract in the settings

ocr-settings-looking = Se caută…
ocr-settings-missing = Nu s-a găsit. Este nevoie de el ca să se citească text din scanări și imagini. Instalați tesseract cu gestionarul de pachete al sistemului, cu datele limbilor pe care le citiți (pe Arch: tesseract-data-ron pentru română, tesseract-data-eng pentru engleză, tesseract-data-grc pentru greaca veche, …), sau spuneți mai jos unde este.
ocr-settings-by-itself = Găsit de la sine
ocr-settings-where = Unde este Tesseract
ocr-settings-look-failed = Tesseract nu a putut fi căutat
ocr-settings-has = Citește { $languages }.
ocr-settings-has-none = Nu are datele niciunei limbi: instalați-le pe ale uneia, precum tesseract-data-ron.
ocr-settings-first = Se citește la început în
ocr-settings-first-hint = Când nu este aleasă niciuna, limba textului și cea a interfeței.
ocr-settings-how = Cum se citește textul la început
