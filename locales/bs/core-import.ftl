# What the core says of references brought in from elsewhere, in English.
# See locales/README.md.

## Where the references came from, as the list of them says: "3 references in pasted text".

core-import-pasted = zalijepljeni tekst
core-import-files = { $count ->
    [one] { $count } datoteka
    [few] { $count } datoteke
   *[other] { $count } datoteka
}

## Files of BibTeX and BibLaTeX.

core-import-file-not-found = Datoteka „{ $name }“ nije pronađena.
core-import-empty-entry = Red { $line }: unos „{ $key }“ je prazan i izostavljen je.
# Where in a file a reference that has no key was found.
core-import-origin-line = red { $line }
core-import-origin-key-line = { $key }, red { $line }

## What went wrong as the references were taken in, each after the reference
## it concerns: Nagy 1979 “The Best of the Achaeans”.

core-import-title = „{ $title }“
core-import-merge-gone = { $reference }: unosa s kojim bi se spojio više nema

## PDF files.

core-import-not-a-pdf = { $name } nije PDF.
# The service is a name: Crossref, DataCite.
core-import-details-from = Podaci su iz baze { $service }.
core-import-number-unknown = U datoteci je pronađen broj, ali baze podataka o njemu ništa ne znaju; podaci su iz same datoteke i treba ih provjeriti.
core-import-databases-failed = Baze podataka nije bilo moguće upitati ({ $error }); podaci su iz same datoteke i treba ih provjeriti.

## Zotero.

core-import-zotero-my-library = Moja biblioteka
core-import-zotero-group = Grupa { $id }
core-import-zotero-the-library = biblioteka { $id } u Zoteru
core-import-zotero-own-library = korisnikova vlastita biblioteka u Zoteru
core-import-zotero-the-collection = zbirka { $key } u Zoteru
core-import-zotero-unknown-base = Datoteka „{ $name }“ nije pronađena. Zotero na nju upućuje iz foldera koji sam bira, a koji ovdje nije poznat.
core-import-zotero-empty-item = Stavka { $key } u Zoteru je prazna i izostavljena je.
core-import-zotero-alone = { $count ->
    [one] { $count } datoteka ili bilješka u Zoteru ne stoji ni pod jednom referencom i izostavljena je.
    [few] { $count } datoteke i bilješke u Zoteru ne stoje ni pod jednom referencom i izostavljene su.
   *[other] { $count } datoteka i bilješki u Zoteru ne stoji ni pod jednom referencom i izostavljene su.
}
# The role is Zotero's own name for it: "recipient", "reviewed author".
core-import-zotero-not-a-field = Zotero navodi { $name } kao { $role }, za šta BibLaTeX nema polja. Ime je izostavljeno.
core-import-zotero-left-out = Zoterovo polje „{ $field }“ nema parnjaka u BibLaTeX-u i izostavljeno je: { $value }

## Zotero's database.

core-import-zotero-no-database = Zoterova baza podataka ({ $file }) u { $path }
core-import-zotero-copying = kopiranje { $path } u privremeni folder
core-import-zotero-empty = datoteka je prazna
core-import-zotero-disturbed = Zotero je pisao u svoju bazu podataka dok je čitana. Ako nešto nedostaje, zatvorite Zotero i uvezite ponovo.
core-import-zotero-backup-read = Zoterovu bazu podataka nije bilo moguće pročitati ({ $error }). Umjesto nje pročitana je njena sigurnosna kopija, { $backup }: nedostaje ono što je u Zoteru izmijenjeno otkako je kopija napravljena.
core-import-zotero-not-a-database = { $path } nije Zoterova baza podataka.
core-import-zotero-unreadable = Zoterova baza podataka ima oblik koji se ovdje ne može pročitati: { $what }. Ako ju je zapisala stara verzija Zotera, dovoljno ju je jednom otvoriti u novijoj da se osavremeni.
core-import-zotero-unreadable-version = Zoterova baza podataka ima oblik koji se ovdje ne može pročitati (verzija { $version } Zoterove baze): { $what }. Ako ju je zapisala stara verzija Zotera, dovoljno ju je jednom otvoriti u novijoj da se osavremeni.
core-import-zotero-no-table = nedostaje tabela „{ $table }“
core-import-zotero-no-column = tabela „{ $table }“ nema kolonu „{ $column }“
# What is lacking where a table is not there: one of the six below.
core-import-zotero-no-optional = Zoterova baza podataka nema tabelu „{ $table }“ u ovdje poznatom obliku: { $consequence }.
core-import-zotero-no-bin = stavke u Zoterovoj korpi za otpatke ne mogu se razlikovati od ostalih
core-import-zotero-no-collections = zbirke nisu pročitane
core-import-zotero-no-attachments = priložene datoteke nisu pročitane
core-import-zotero-no-notes = bilješke nisu pročitane
core-import-zotero-no-keywords = ključne riječi nisu pročitane
core-import-zotero-no-group-names = nazivi grupnih biblioteka nisu poznati

## PDF files, as they are read for a reference.

core-import-pdf-empty = Datoteka „{ $name }“ je prazna.
core-import-pdf-not-a-pdf = Datoteka „{ $name }“ nije PDF.
core-import-pdf-unreadable = Datoteku nije bilo moguće pročitati: oštećena je, zaštićena lozinkom ili prevelika.
core-import-pdf-scan = Datoteka nema tekstualni sloj: to je sken.
core-import-pdf-from-file = Podaci su iz same datoteke, a ne iz kataloga, i treba ih provjeriti.
core-import-pdf-from-metadata = U datoteci nije pronađen ni DOI ni ISBN; podaci su iz metapodataka same datoteke i treba ih provjeriti.
core-import-pdf-unknown = U datoteci nije pronađen ni DOI ni ISBN, a njeni metapodaci ne kažu šta je: podatke treba popuniti.

## Tables, from files of text and of sheets.

core-import-table-too-large = Datoteka ima { $size } MB. Tabela se čita iz datoteke od najviše { $most } MB.
core-import-table-kinds = Tabele se čitaju iz CSV-a i drugog teksta s vrijednostima razdvojenim zarezima, tačka-zarezima ili tabulatorima, te iz proračunskih tabela LibreOfficea (.ods) i Excela (.xlsx, .xls).
core-import-table-empty = U datoteci nema ničega.
# The rows are a number, or where the counting was given up, the message below.
core-import-table-rows = { $rows ->
    [one] Tabela ima { $rows } red. Tabela u tekstu može ih imati najviše { $most }: to nije proračunska tabela.
    [few] Tabela ima { $rows } reda. Tabela u tekstu može ih imati najviše { $most }: to nije proračunska tabela.
   *[other] Tabela ima { $rows } redova. Tabela u tekstu može ih imati najviše { $most }: to nije proračunska tabela.
}
core-import-table-columns = { $columns ->
    [one] Tabela ima { $columns } kolonu. Tabela u tekstu može ih imati najviše { $most }: to nije proračunska tabela.
    [few] Tabela ima { $columns } kolone. Tabela u tekstu može ih imati najviše { $most }: to nije proračunska tabela.
   *[other] Tabela ima { $columns } kolona. Tabela u tekstu može ih imati najviše { $most }: to nije proračunska tabela.
}
core-import-table-more-than = više od { $count }

## Documents brought in, to become maps.

core-import-document-stopped = Čitanje je zaustavljeno.
core-import-pdfs-stopped = Utvrđivanje šta su datoteke je zaustavljeno. Ništa nije dodano.
core-import-document-kind = „{ $file }“ nije vrste koja se može učitati kao dokument. Mogu se učitati Word (DOCX), OpenDocument (ODT), Markdown, HTML, LaTeX, RTF, EPUB, Org, reStructuredText, Typst i običan tekst.
core-import-document-too-large = „{ $file }“ ima više od 50 MB, što je više nego što se može učitati kao dokument.
# The kind is the kind of file: Word (DOCX), plain text.
core-import-document-unreadable = „{ $file }“ nije bilo moguće pročitati kao { $kind }. Možda je oštećen ili druge vrste nego što mu ime kaže. Pandoc, koji ga čita, kaže: { $message }
core-import-document-pandoc-unreadable = ono što je Pandoc napravio od „{ $file }“ nije bilo moguće pročitati: { $error }
# The title of a map made of a document that has none, nor a name of its file.
core-import-document-untitled = Bez naslova
core-import-document-plain-text = običan tekst
core-import-document-notebook = Jupyterova bilježnica

## What the one who brings a document in should know of it.

core-import-document-found = { $count ->
    [one] { $made ->
        [all] Pronađen je { $count } citat koji još nije vezan za referencu iz vaše biblioteke, a napravio ga je program koji čuva reference. Stoji kao tekst kakvim je napisan, a može se pregledati kad se mapa napravi, i kasnije.
       *[none] Pronađen je { $count } citat koji još nije vezan za referencu iz vaše biblioteke. Stoji kao tekst kakvim je napisan, a može se pregledati kad se mapa napravi, i kasnije.
    }
    [few] { $made ->
        [all] Pronađena su { $count } citata koja još nisu vezana za reference iz vaše biblioteke, a sve ih je napravio program koji čuva reference. Stoje kao tekst kakvim su napisani, a mogu se pregledati kad se mapa napravi, i kasnije.
        [some] Pronađena su { $count } citata koja još nisu vezana za reference iz vaše biblioteke, a { $some } od njih napravio je program koji čuva reference. Stoje kao tekst kakvim su napisani, a mogu se pregledati kad se mapa napravi, i kasnije.
       *[none] Pronađena su { $count } citata koja još nisu vezana za reference iz vaše biblioteke. Stoje kao tekst kakvim su napisani, a mogu se pregledati kad se mapa napravi, i kasnije.
    }
   *[other] { $made ->
        [all] Pronađeno je { $count } citata koji još nisu vezani za reference iz vaše biblioteke, a sve ih je napravio program koji čuva reference. Stoje kao tekst kakvim su napisani, a mogu se pregledati kad se mapa napravi, i kasnije.
        [some] Pronađeno je { $count } citata koji još nisu vezani za reference iz vaše biblioteke, a { $some } od njih napravio je program koji čuva reference. Stoje kao tekst kakvim su napisani, a mogu se pregledati kad se mapa napravi, i kasnije.
       *[none] Pronađeno je { $count } citata koji još nisu vezani za reference iz vaše biblioteke. Stoje kao tekst kakvim su napisani, a mogu se pregledati kad se mapa napravi, i kasnije.
    }
}
core-import-document-endnote = { $count ->
    [one] { $count } citat koji je napravio EndNote učitan je kao tekst koji prikazuje i nije među pronađenima: ono što EndNote kaže o djelima nije bilo moguće pročitati.
    [few] { $count } citata koja je napravio EndNote učitana su kao tekst koji prikazuju i nisu među pronađenima: ono što EndNote kaže o djelima nije bilo moguće pročitati.
   *[other] { $count } citata koje je napravio EndNote učitano je kao tekst koji prikazuju i nisu među pronađenima: ono što EndNote kaže o djelima nije bilo moguće pročitati.
}
core-import-document-bookmarks = { $count ->
    [one] Dokument čuva { $count } citat u obilježivaču, a ono što citira nije bilo moguće pročitati: to je tekst kakav jeste. Zotero ih tako čuva kad mu to kažu postavke dokumenta.
    [few] Dokument čuva { $count } citata u obilježivačima, a ono što citiraju nije bilo moguće pročitati: to je tekst kakav jeste. Zotero ih tako čuva kad mu to kažu postavke dokumenta.
   *[other] Dokument čuva { $count } citata u obilježivačima, a ono što citiraju nije bilo moguće pročitati: to je tekst kakav jeste. Zotero ih tako čuva kad mu to kažu postavke dokumenta.
}
core-import-document-bibliography = Dokument ima spisak onoga što citira, pod „{ $heading }“. Učitan je kao tekst, kao i ostalo. Mapa pravi vlastitu bibliografiju od onoga što je u njoj citirano.
core-import-document-bibliography-made = Dokument ima spisak onoga što citira, koji je napravio program koji čuva njegove reference. Učitan je kao tekst, kao i ostalo. Mapa pravi vlastitu bibliografiju od onoga što je u njoj citirano.
core-import-document-tracked = Dokument ima praćene izmjene. Tekst je učitan onakav kakav je kad su sve prihvaćene.
core-import-document-comments = Dokument ima komentare na margini, koji su izostavljeni.
core-import-document-heading-notes = { $count ->
    [one] Fusnota uz naslov stoji na početku teksta pod njim: naslov ne može imati fusnotu.
    [few] { $count } fusnote uz naslove stoje na početku teksta pod njima: naslov ne može imati fusnotu.
   *[other] { $count } fusnota uz naslove stoji na početku teksta pod njima: naslov ne može imati fusnotu.
}
# What a caption began with is shown as the document has it: “Figure 1:”.
core-import-document-labels = { $count ->
    [one] { $count } natpis počinjao je riječju i brojem, kao „{ $first }“. Izostavljen je: mapa sama numerira svoje ilustracije i tabele. Gdje ih tekst imenuje po broju, to je tekst kakav je napisan i ne prati brojeve mape.
    [few] { $count } natpisa počinjala su riječju i brojem, kao „{ $first }“. Izostavljena su: mapa sama numerira svoje ilustracije i tabele. Gdje ih tekst imenuje po broju, to je tekst kakav je napisan i ne prati brojeve mape.
   *[other] { $count } natpisa počinjalo je riječju i brojem, kao „{ $first }“. Izostavljeni su: mapa sama numerira svoje ilustracije i tabele. Gdje ih tekst imenuje po broju, to je tekst kakav je napisan i ne prati brojeve mape.
}
core-import-document-label-example = Slika 1:
core-import-document-caption-notes = { $count ->
    [one] Fusnota u onome što se kaže o ilustraciji ili tabeli stoji ondje u zagradama.
    [few] { $count } fusnote u onome što se kaže o ilustracijama ili tabelama stoje ondje u zagradama.
   *[other] { $count } fusnota u onome što se kaže o ilustracijama ili tabelama stoji ondje u zagradama.
}
core-import-document-headings = { $count ->
    [one] { $count } naslov u navodu, listi ili tabeli učitan je kao podebljani pasus.
    [few] { $count } naslova u navodu, listi ili tabeli učitana su kao podebljani pasusi.
   *[other] { $count } naslova u navodu, listi ili tabeli učitano je kao podebljani pasusi.
}
core-import-document-code = { $count ->
    [one] { $count } blok koda učitan je kao obični pasusi, po jedan za svaki red.
    [few] { $count } bloka koda učitana su kao obični pasusi, po jedan za svaki red.
   *[other] { $count } blokova koda učitano je kao obični pasusi, po jedan za svaki red.
}
core-import-document-definitions = { $count ->
    [one] { $count } lista termina s njihovim značenjima učitana je kao pasusi, s podebljanim terminima.
    [few] { $count } liste termina s njihovim značenjima učitane su kao pasusi, s podebljanim terminima.
   *[other] { $count } lista termina s njihovim značenjima učitano je kao pasusi, s podebljanim terminima.
}
core-import-document-rules = { $count ->
    [one] { $count } linija preko stranice izostavljena je.
    [few] { $count } linije preko stranice izostavljene su.
   *[other] { $count } linija preko stranice izostavljeno je.
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

core-import-document-picture-left-out = Slika „{ $name }“ je izostavljena: { $why }.
core-import-document-picture-kind = vrste je koja se ne čita ({ $kind })
core-import-document-picture-not-read = nije slika vrste koja se čita
core-import-document-picture-unreadable = nije je bilo moguće pročitati
core-import-document-picture-network = na mreži je, a odande se ništa ne dohvaća
core-import-document-picture-not-taken-out = nije je bilo moguće izvući iz datoteke
core-import-document-picture-outside = nije u datoteci, nego drugdje na ovom računaru, a odande se ne uzima
core-import-document-picture-not-found = datoteka nije pronađena ondje gdje dokument kaže da jeste
core-import-document-picture-too-large = veća je od 50 MB
core-import-document-picture-file-unreadable = datoteku nije bilo moguće pročitati
