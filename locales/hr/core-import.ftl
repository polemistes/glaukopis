# What the core says of references brought in from elsewhere, in English.
# See locales/README.md.

## Where the references came from, as the list of them says: "3 references in pasted text".

core-import-pasted = zalijepljenom tekstu
core-import-files = { $count ->
    [one] { $count } datoteci
    [few] { $count } datoteke
   *[other] { $count } datoteka
}

## Files of BibTeX and BibLaTeX.

core-import-file-not-found = Datoteka „{ $name }” nije pronađena.
core-import-empty-entry = Redak { $line }: unos „{ $key }” prazan je i izostavljen.
# Where in a file a reference that has no key was found.
core-import-origin-line = redak { $line }
core-import-origin-key-line = { $key }, redak { $line }

## What went wrong as the references were taken in, each after the reference
## it concerns: Nagy 1979 “The Best of the Achaeans”.

core-import-title = „{ $title }”
core-import-merge-gone = { $reference }: unosa s kojim bi se spojio više nema

## PDF files.

core-import-not-a-pdf = { $name } nije PDF.
# The service is a name: Crossref, DataCite.
core-import-details-from = Podaci su iz servisa { $service }.
core-import-number-unknown = U datoteci je pronađen broj, ali baze podataka o njemu ništa ne znaju; podaci su iz same datoteke i treba ih provjeriti.
core-import-databases-failed = Baze podataka nije bilo moguće upitati ({ $error }); podaci su iz same datoteke i treba ih provjeriti.

## Zotero.

core-import-zotero-my-library = Moja knjižnica
core-import-zotero-group = Grupa { $id }
core-import-zotero-the-library = knjižnica { $id } u Zoteru
core-import-zotero-own-library = korisnikova vlastita knjižnica u Zoteru
core-import-zotero-the-collection = zbirka { $key } u Zoteru
core-import-zotero-unknown-base = Datoteka „{ $name }” nije pronađena. Zotero na nju upućuje iz direktorija koji sam bira, a koji ovdje nije poznat.
core-import-zotero-empty-item = Stavka { $key } u Zoteru prazna je i izostavljena.
core-import-zotero-alone = { $count ->
    [one] { $count } datoteka ili bilješka stoji u Zoteru bez reference i izostavljena je.
    [few] { $count } datoteke ili bilješke stoje u Zoteru bez reference i izostavljene su.
   *[other] { $count } datoteka ili bilježaka stoji u Zoteru bez reference i izostavljene su.
}
# The role is Zotero's own name for it: "recipient", "reviewed author".
core-import-zotero-not-a-field = Zotero navodi { $name } kao { $role }, za što BibLaTeX nema polja. Ime je izostavljeno.
core-import-zotero-left-out = Zoterovo polje „{ $field }” nema parnjaka u BibLaTeX-u i izostavljeno je: { $value }

## Zotero's database.

core-import-zotero-no-database = Zoterova baza podataka ({ $file }) u { $path }
core-import-zotero-copying = kopiranje { $path } u privremeni direktorij
core-import-zotero-empty = datoteka je prazna
core-import-zotero-disturbed = Zotero je pisao u svoju bazu podataka dok se čitala. Ako nešto nedostaje, zatvorite Zotero i uvezite ponovno.
core-import-zotero-backup-read = Zoterovu bazu podataka nije bilo moguće pročitati ({ $error }). Umjesto nje pročitana je njezina sigurnosna kopija, { $backup }: što je u Zoteru promijenjeno otkako je kopija izrađena, nedostaje.
core-import-zotero-not-a-database = { $path } nije Zoterova baza podataka.
core-import-zotero-unreadable = Zoterova baza podataka ima oblik koji se ovdje ne može pročitati: { $what }. Ako ju je zapisala stara inačica Zotera, dovoljno ju je jednom otvoriti u novoj da se osuvremeni.
core-import-zotero-unreadable-version = Zoterova baza podataka ima oblik koji se ovdje ne može pročitati (inačica { $version } Zoterove baze): { $what }. Ako ju je zapisala stara inačica Zotera, dovoljno ju je jednom otvoriti u novoj da se osuvremeni.
core-import-zotero-no-table = nedostaje tablica „{ $table }”
core-import-zotero-no-column = tablica „{ $table }” nema stupac „{ $column }”
# What is lacking where a table is not there: one of the six below.
core-import-zotero-no-optional = Zoterova baza podataka nema tablicu „{ $table }” u ovdje poznatom obliku: { $consequence }.
core-import-zotero-no-bin = stavke u Zoterovu smeću ne mogu se razlučiti od ostalih
core-import-zotero-no-collections = zbirke nisu pročitane
core-import-zotero-no-attachments = priložene datoteke nisu pročitane
core-import-zotero-no-notes = bilješke nisu pročitane
core-import-zotero-no-keywords = ključne riječi nisu pročitane
core-import-zotero-no-group-names = nazivi grupnih knjižnica nisu poznati

## PDF files, as they are read for a reference.

core-import-pdf-empty = Datoteka „{ $name }” je prazna.
core-import-pdf-not-a-pdf = Datoteka „{ $name }” nije PDF.
core-import-pdf-unreadable = Datoteku nije moguće pročitati: oštećena je, zaštićena lozinkom ili prevelika.
core-import-pdf-scan = Datoteka nema tekstnog sloja: to je sken.
core-import-pdf-from-file = Podaci su iz same datoteke, ne iz kataloga, i treba ih provjeriti.
core-import-pdf-from-metadata = U datoteci nije pronađen ni DOI ni ISBN; podaci su iz metapodataka same datoteke i treba ih provjeriti.
core-import-pdf-unknown = U datoteci nije pronađen ni DOI ni ISBN, a njezini metapodaci ne kažu što je: podatke treba upisati.

## Tables, from files of text and of sheets.

core-import-table-too-large = Datoteka ima { $size } MB. Tablica se čita iz datoteke od najviše { $most } MB.
core-import-table-kinds = Tablice se čitaju iz CSV-a i drugog teksta s vrijednostima razdvojenima zarezima, točkama sa zarezom ili tabulatorima, te iz proračunskih tablica LibreOfficea (.ods) i Excela (.xlsx, .xls).
core-import-table-empty = U datoteci nema ničega.
# The rows are a number, or where the counting was given up, the message below.
core-import-table-rows = Tablica ima { $rows } redaka. Tablica u tekstu može ih imati najviše { $most }: to nije proračunska tablica.
core-import-table-columns = Tablica ima { $columns } stupaca. Tablica u tekstu može ih imati najviše { $most }: to nije proračunska tablica.
core-import-table-more-than = više od { $count }

## Documents brought in, to become maps.

core-import-document-stopped = Čitanje je zaustavljeno.
core-import-pdfs-stopped = Utvrđivanje što su datoteke zaustavljeno je. Ništa nije dodano.
core-import-document-kind = „{ $file }” nije vrste koja se može učitati kao dokument. Mogu se učitati Word (DOCX), OpenDocument (ODT), Markdown, HTML, LaTeX, RTF, EPUB, Org, reStructuredText, Typst i običan tekst.
core-import-document-too-large = „{ $file }” veća je od 50 MB, što je više nego što se može učitati kao dokument.
# The kind is the kind of file: Word (DOCX), plain text.
core-import-document-unreadable = „{ $file }” nije bilo moguće pročitati kao { $kind }. Možda je oštećena ili druge vrste nego što joj naziv kaže. Pandoc, koji je čita, rekao je: { $message }
core-import-document-pandoc-unreadable = ono što je Pandoc načinio od „{ $file }” nije bilo moguće pročitati: { $error }
# The title of a map made of a document that has none, nor a name of its file.
core-import-document-untitled = Bez naslova
core-import-document-plain-text = običan tekst
core-import-document-notebook = Jupyterova bilježnica

## What the one who brings a document in should know of it.

core-import-document-found = { $count ->
    [one] { $made ->
        [all] Pronađen je { $count } citat koji još nije vezan uz referencu iz vaše knjižnice, a načinio ga je program koji vodi reference. Stoji kao tekst kakvim je napisan, a može se proći kad se mapa načini, i poslije.
       *[none] Pronađen je { $count } citat koji još nije vezan uz referencu iz vaše knjižnice. Stoji kao tekst kakvim je napisan, a može se proći kad se mapa načini, i poslije.
    }
    [few] { $made ->
        [all] Pronađena su { $count } citata koji još nisu vezani uz reference iz vaše knjižnice, a sve ih je načinio program koji vodi reference. Stoje kao tekst kakvim su napisani, a mogu se proći kad se mapa načini, i poslije.
        [some] Pronađena su { $count } citata koji još nisu vezani uz reference iz vaše knjižnice, od kojih je { $some } načinio program koji vodi reference. Stoje kao tekst kakvim su napisani, a mogu se proći kad se mapa načini, i poslije.
       *[none] Pronađena su { $count } citata koji još nisu vezani uz reference iz vaše knjižnice. Stoje kao tekst kakvim su napisani, a mogu se proći kad se mapa načini, i poslije.
    }
   *[other] { $made ->
        [all] Pronađeno je { $count } citata koji još nisu vezani uz reference iz vaše knjižnice, a sve ih je načinio program koji vodi reference. Stoje kao tekst kakvim su napisani, a mogu se proći kad se mapa načini, i poslije.
        [some] Pronađeno je { $count } citata koji još nisu vezani uz reference iz vaše knjižnice, od kojih je { $some } načinio program koji vodi reference. Stoje kao tekst kakvim su napisani, a mogu se proći kad se mapa načini, i poslije.
       *[none] Pronađeno je { $count } citata koji još nisu vezani uz reference iz vaše knjižnice. Stoje kao tekst kakvim su napisani, a mogu se proći kad se mapa načini, i poslije.
    }
}
core-import-document-endnote = { $count ->
    [one] { $count } citat koji je načinio EndNote učitan je kao tekst koji prikazuje i nije među pronađenima: što EndNote kaže o djelima nije bilo moguće pročitati.
    [few] { $count } citata koja je načinio EndNote učitana su kao tekst koji prikazuju i nisu među pronađenima: što EndNote kaže o djelima nije bilo moguće pročitati.
   *[other] { $count } citata koje je načinio EndNote učitano je kao tekst koji prikazuju i nisu među pronađenima: što EndNote kaže o djelima nije bilo moguće pročitati.
}
core-import-document-bookmarks = { $count ->
    [one] Dokument drži { $count } citat u knjižnoj oznaci, a što citira nije bilo moguće pročitati: to je tekst kakav jest. Zotero ih tako drži kad to kažu postavke dokumenta.
    [few] Dokument drži { $count } citata u knjižnim oznakama, a što citiraju nije bilo moguće pročitati: to je tekst kakav jest. Zotero ih tako drži kad to kažu postavke dokumenta.
   *[other] Dokument drži { $count } citata u knjižnim oznakama, a što citiraju nije bilo moguće pročitati: to je tekst kakav jest. Zotero ih tako drži kad to kažu postavke dokumenta.
}
core-import-document-bibliography = Dokument ima popis onoga što citira, pod naslovom „{ $heading }”. Učitan je kao tekst, kao i ostalo. Mapa sama izrađuje popis literature iz onoga što se u njoj citira.
core-import-document-bibliography-made = Dokument ima popis onoga što citira, koji je načinio program koji vodi njegove reference. Učitan je kao tekst, kao i ostalo. Mapa sama izrađuje popis literature iz onoga što se u njoj citira.
core-import-document-tracked = Dokument ima praćene izmjene. Tekst je učitan onakav kakav je kad su sve prihvaćene.
core-import-document-comments = Dokument ima komentare na margini, koji su izostavljeni.
core-import-document-heading-notes = { $count ->
    [one] Bilješka uz naslov stoji na početku teksta pod njim: naslov ne može imati bilješku.
    [few] { $count } bilješke uz naslove stoje na početku teksta pod njima: naslov ne može imati bilješku.
   *[other] { $count } bilježaka uz naslove stoji na početku teksta pod njima: naslov ne može imati bilješku.
}
# What a caption began with is shown as the document has it: “Figure 1:”.
core-import-document-labels = { $count ->
    [one] { $count } opis počinjao je riječju i brojem, kao „{ $first }”. Izostavljen je: mapa sama numerira svoje ilustracije i tablice. Gdje tekst koju od njih imenuje brojem, to je tekst kakav je napisan i ne slijedi brojeve mape.
    [few] { $count } opisa počinjala su riječju i brojem, kao „{ $first }”. Izostavljeni su: mapa sama numerira svoje ilustracije i tablice. Gdje tekst koju od njih imenuje brojem, to je tekst kakav je napisan i ne slijedi brojeve mape.
   *[other] { $count } opisa počinjalo je riječju i brojem, kao „{ $first }”. Izostavljeni su: mapa sama numerira svoje ilustracije i tablice. Gdje tekst koju od njih imenuje brojem, to je tekst kakav je napisan i ne slijedi brojeve mape.
}
core-import-document-label-example = Slika 1:
core-import-document-caption-notes = { $count ->
    [one] Bilješka u opisu ilustracije ili tablice stoji ondje u zagradama.
    [few] { $count } bilješke u opisima ilustracija ili tablica stoje ondje u zagradama.
   *[other] { $count } bilježaka u opisima ilustracija ili tablica stoji ondje u zagradama.
}
core-import-document-headings = { $count ->
    [one] { $count } naslov u navodu, popisu ili tablici učitan je kao podebljani odlomak.
    [few] { $count } naslova u navodu, popisu ili tablici učitana su kao podebljani odlomci.
   *[other] { $count } naslova u navodu, popisu ili tablici učitano je kao podebljani odlomci.
}
core-import-document-code = { $count ->
    [one] { $count } blok koda učitan je kao obični odlomci, redak po odlomak.
    [few] { $count } bloka koda učitana su kao obični odlomci, redak po odlomak.
   *[other] { $count } blokova koda učitano je kao obični odlomci, redak po odlomak.
}
core-import-document-definitions = { $count ->
    [one] { $count } popis termina s njihovim značenjima učitan je kao odlomci, s terminima podebljanima.
    [few] { $count } popisa termina s njihovim značenjima učitana su kao odlomci, s terminima podebljanima.
   *[other] { $count } popisa termina s njihovim značenjima učitano je kao odlomci, s terminima podebljanima.
}
core-import-document-rules = { $count ->
    [one] { $count } crta preko stranice izostavljena je.
    [few] { $count } crte preko stranice izostavljene su.
   *[other] { $count } crta preko stranice izostavljeno je.
}
core-import-document-raw = { $count ->
    [one] { $count } dio napisan u HTML-u ili TeX-u samo za jednu vrstu dokumenta izostavljen je.
    [few] { $count } dijela napisana u HTML-u ili TeX-u samo za jednu vrstu dokumenta izostavljena su.
   *[other] { $count } dijelova napisanih u HTML-u ili TeX-u samo za jednu vrstu dokumenta izostavljeno je.
}
core-import-document-pictures-wanting = { $count ->
    [one] { $count } slika koju datoteka sadrži nije u pročitanom tekstu i izostavljena je. Možda stoji u zaglavlju ili podnožju stranica, ili u crtežu.
    [few] { $count } slike koje datoteka sadrži nisu u pročitanom tekstu i izostavljene su. Možda stoje u zaglavlju ili podnožju stranica, ili u crtežu.
   *[other] { $count } slika koje datoteka sadrži nije u pročitanom tekstu i izostavljene su. Možda stoje u zaglavlju ili podnožju stranica, ili u crtežu.
}

## A picture of a document that is left out, and why.

core-import-document-picture-left-out = Slika „{ $name }” izostavljena je: { $why }.
core-import-document-picture-kind = vrste je koja se ne čita ({ $kind })
core-import-document-picture-not-read = nije slika vrste koja se čita
core-import-document-picture-unreadable = nije ju bilo moguće pročitati
core-import-document-picture-network = na mreži je, a odande se ništa ne dohvaća
core-import-document-picture-not-taken-out = nije ju bilo moguće izvaditi iz datoteke
core-import-document-picture-outside = nije u datoteci, nego drugdje na ovom računalu, a odande se ne uzima
core-import-document-picture-not-found = datoteka nije pronađena gdje dokument kaže da jest
core-import-document-picture-too-large = veća je od 50 MB
core-import-document-picture-file-unreadable = datoteku nije bilo moguće pročitati
