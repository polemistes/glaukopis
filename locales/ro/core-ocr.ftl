# What the core says of text read from PDFs and pictures, in English.
# See locales/README.md.

## What a file is.

ocr-kind-pdf = PDF
ocr-kind-picture = Imagine

## When text cannot be read.

ocr-stopped = Citirea a fost oprită.
ocr-no-language = Tesseract nu are date pentru limba „{ $language }”.
ocr-no-languages = Tesseract nu are date pentru nicio limbă. Instalați datele uneia, precum tesseract-data-eng pe Arch.
ocr-not-pdf = „{ $file }” nu este un PDF.
ocr-no-pages = „{ $file }” nu are pagini.
ocr-locked = „{ $file }” este încuiat cu o parolă, iar paginile lui nu se pot desena.
ocr-unreadable = „{ $file }” nu s-a putut citi ca PDF. Poate fi stricat.
ocr-page-not-drawn = Pagina { $page } nu s-a putut desena.
ocr-picture-unreadable = Imaginea nu s-a putut citi: { $message }
ocr-drawing = Un desen (SVG) nu are în el nicio imagine din care să se citească text.

## Making a PDF searchable.

ocr-searchable-locked = PDF-ul este încuiat și nu poate primi text căutabil. Textul lui poate fi totuși adus într-un proiect ca hartă.
ocr-searchable-unreadable = PDF-ul nu a putut primi text căutabil: { $message }
ocr-not-whole = ce s-a făcut nu s-a citit înapoi întreg și nu a fost păstrat.

## What the one who reads a PDF should know, before the map is made.

ocr-remark-read = { $count ->
    [one] O pagină a fost citită dintr-o imagine a ei.
    [few] { $count } pagini au fost citite din imagini ale lor.
   *[other] { $count } de pagini au fost citite din imagini ale lor.
}
ocr-remark-text = { $count ->
    [one] O pagină avea text, care este luat așa cum îl are fișierul.
    [few] { $count } pagini aveau text, care este luat așa cum îl are fișierul.
   *[other] { $count } de pagini aveau text, care este luat așa cum îl are fișierul.
}
ocr-remark-no-tesseract = { $count ->
    [one] O pagină nu are text și este lăsată goală: Tesseract, care citește textul din imagini, nu este instalat.
    [few] { $count } pagini nu au text și sunt lăsate goale: Tesseract, care citește textul din imagini, nu este instalat.
   *[other] { $count } de pagini nu au text și sunt lăsate goale: Tesseract, care citește textul din imagini, nu este instalat.
}
ocr-remark-not-read = Paginile care nu au text nu s-au putut citi: { $message }
ocr-remark-failed = Pagina { $page } nu s-a putut citi: { $message }
ocr-remark-more-failed = { $count ->
    [one] Încă o pagină nu s-a putut citi.
    [few] Încă { $count } pagini nu s-au putut citi.
   *[other] Încă { $count } de pagini nu s-au putut citi.
}
ocr-remark-empty = Nu s-a găsit niciun text.
