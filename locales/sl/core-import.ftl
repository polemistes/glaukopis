# What the core says of references brought in from elsewhere, in English.
# See locales/README.md.

## Where the references came from, as the list of them says: "3 references in pasted text".

core-import-pasted = prilepljenem besedilu
core-import-files = { $count ->
    [one] { $count } datoteki
    [two] { $count } datotekah
    [few] { $count } datotekah
   *[other] { $count } datotekah
}

## Files of BibTeX and BibLaTeX.

core-import-file-not-found = Datoteke »{ $name }« ni bilo mogoče najti.
core-import-empty-entry = Vrstica { $line }: vnos »{ $key }« je prazen in je izpuščen.
# Where in a file a reference that has no key was found.
core-import-origin-line = vrstica { $line }
core-import-origin-key-line = { $key }, vrstica { $line }

## What went wrong as the references were taken in, each after the reference
## it concerns: Nagy 1979 “The Best of the Achaeans”.

core-import-title = »{ $title }«
core-import-merge-gone = { $reference }: vnosa, s katerim naj bi se združil, ni več

## PDF files.

core-import-not-a-pdf = { $name } ni PDF.
# The service is a name: Crossref, DataCite.
core-import-details-from = Podatke je dal { $service }.
core-import-number-unknown = V datoteki je bila najdena številka, a podatkovne baze o njej ne vedo ničesar; podatki so iz same datoteke in jih je treba preveriti.
core-import-databases-failed = Podatkovnih baz ni bilo mogoče vprašati ({ $error }); podatki so iz same datoteke in jih je treba preveriti.

## Zotero.

core-import-zotero-my-library = Moja knjižnica
core-import-zotero-group = Skupina { $id }
core-import-zotero-the-library = knjižnica { $id } v Zoteru
core-import-zotero-own-library = uporabnikova lastna knjižnica v Zoteru
core-import-zotero-the-collection = zbirka { $key } v Zoteru
core-import-zotero-unknown-base = Datoteke »{ $name }« ni bilo mogoče najti. Zotero kaže nanjo iz mape, ki si jo je sam izbral in ki tu ni znana.
core-import-zotero-empty-item = Vnos { $key } v Zoteru je prazen in je izpuščen.
core-import-zotero-alone = { $count ->
    [one] { $count } datoteka ali zapisek v Zoteru ne spada pod noben vir in je izpuščen.
    [two] { $count } datoteki ali zapiska v Zoteru ne spadata pod noben vir in sta izpuščena.
    [few] { $count } datoteke ali zapiski v Zoteru ne spadajo pod noben vir in so izpuščeni.
   *[other] { $count } datotek ali zapiskov v Zoteru ne spada pod noben vir in so izpuščeni.
}
# The role is Zotero's own name for it: "recipient", "reviewed author".
core-import-zotero-not-a-field = Zotero navaja { $name } v vlogi »{ $role }«, za katero BibLaTeX nima polja. Ime je izpuščeno.
core-import-zotero-left-out = Zoterovo polje »{ $field }« nima ustreznice v BibLaTeXu in je izpuščeno: { $value }

## Zotero's database.

core-import-zotero-no-database = Zoterova podatkovna baza ({ $file }) v { $path }
core-import-zotero-copying = kopiranje { $path } v začasno mapo
core-import-zotero-empty = datoteka je prazna
core-import-zotero-disturbed = Zotero je pisal v svojo podatkovno bazo, medtem ko je bila brana. Če kaj manjka, zaprite Zotero in uvozite znova.
core-import-zotero-backup-read = Zoterove podatkovne baze ni bilo mogoče prebrati ({ $error }). Namesto nje je bila prebrana njena varnostna kopija { $backup }: kar je bilo v Zoteru spremenjeno po njenem nastanku, manjka.
core-import-zotero-not-a-database = { $path } ni Zoterova podatkovna baza.
core-import-zotero-unreadable = Zoterova podatkovna baza ima obliko, ki je tu ni mogoče prebrati: { $what }. Če jo je zapisala stara različica Zotera, jo enkratno odprtje v sodobni posodobi.
core-import-zotero-unreadable-version = Zoterova podatkovna baza ima obliko, ki je tu ni mogoče prebrati (različica { $version } Zoterove baze): { $what }. Če jo je zapisala stara različica Zotera, jo enkratno odprtje v sodobni posodobi.
core-import-zotero-no-table = tabela »{ $table }« manjka
core-import-zotero-no-column = tabela »{ $table }« nima stolpca »{ $column }«
# What is lacking where a table is not there: one of the six below.
core-import-zotero-no-optional = Zoterova podatkovna baza nima tabele »{ $table }« v tu znani obliki: { $consequence }.
core-import-zotero-no-bin = vnosov v Zoterovem košu ni mogoče ločiti od drugih
core-import-zotero-no-collections = zbirke niso bile prebrane
core-import-zotero-no-attachments = priložene datoteke niso bile prebrane
core-import-zotero-no-notes = zapiski niso bili prebrani
core-import-zotero-no-keywords = ključne besede niso bile prebrane
core-import-zotero-no-group-names = imena skupinskih knjižnic niso znana

## PDF files, as they are read for a reference.

core-import-pdf-empty = Datoteka »{ $name }« je prazna.
core-import-pdf-not-a-pdf = Datoteka »{ $name }« ni PDF.
core-import-pdf-unreadable = Datoteke ni bilo mogoče prebrati: je poškodovana, zaščitena z geslom ali prevelika.
core-import-pdf-scan = Datoteka nima besedilne plasti: to je skeniran dokument.
core-import-pdf-from-file = Podatki so iz same datoteke, ne iz kataloga, in jih je treba preveriti.
core-import-pdf-from-metadata = V datoteki ni ne DOI ne ISBN; podatki so iz metapodatkov datoteke in jih je treba preveriti.
core-import-pdf-unknown = V datoteki ni ne DOI ne ISBN, njeni metapodatki pa ne povedo, kaj je: podatke je treba vpisati.

## Tables, from files of text and of sheets.

core-import-table-too-large = Datoteka ima { $size } MB. Tabela se prebere iz datoteke z največ { $most } MB.
core-import-table-kinds = Tabele se berejo iz CSV in drugega besedila z vrednostmi, ločenimi z vejicami, podpičji ali tabulatorji, ter iz preglednic LibreOffice (.ods) in Excel (.xlsx, .xls).
core-import-table-empty = V datoteki ni ničesar.
# The rows are a number, or where the counting was given up, the message below.
core-import-table-rows = Tabela ima { $rows } vrstic. Tabela v besedilu jih ima lahko največ { $most }: ni preglednica.
core-import-table-columns = Tabela ima { $columns } stolpcev. Tabela v besedilu jih ima lahko največ { $most }: ni preglednica.
core-import-table-more-than = več kot { $count }

## Documents brought in, to become maps.

core-import-document-stopped = Branje je bilo ustavljeno.
core-import-pdfs-stopped = Ugotavljanje, kaj so datoteke, je bilo ustavljeno. Nič ni bilo dodano.
core-import-document-kind = »{ $file }« ni vrste, ki bi jo bilo mogoče uvoziti kot dokument. Uvoziti je mogoče Word (DOCX), OpenDocument (ODT), Markdown, HTML, LaTeX, RTF, EPUB, Org, reStructuredText, Typst in navadno besedilo.
core-import-document-too-large = »{ $file }« je večja od 50 MB, kar je več, kot je mogoče uvoziti kot dokument.
# The kind is the kind of file: Word (DOCX), plain text.
core-import-document-unreadable = »{ $file }« ni bilo mogoče prebrati kot { $kind }. Morda je poškodovana ali druge vrste, kot pove njeno ime. Pandoc, ki jo bere, je rekel: { $message }
core-import-document-pandoc-unreadable = tega, kar je Pandoc naredil iz »{ $file }«, ni bilo mogoče prebrati: { $error }
# The title of a map made of a document that has none, nor a name of its file.
core-import-document-untitled = Brez naslova
core-import-document-plain-text = navadno besedilo
core-import-document-notebook = zvezek Jupyter

## What the one who brings a document in should know of it.

core-import-document-found = { $count ->
    [one] { $made ->
        [all] Najdena je bila { $count } navedba, ki še ni povezana z virom iz vaše knjižnice; naredil jo je program, ki hrani vire. Ostaja kot besedilo, kakor je bila napisana; pregledati jo je mogoče, ko je miselni vzorec narejen, in tudi pozneje.
       *[none] Najdena je bila { $count } navedba, ki še ni povezana z virom iz vaše knjižnice. Ostaja kot besedilo, kakor je bila napisana; pregledati jo je mogoče, ko je miselni vzorec narejen, in tudi pozneje.
    }
    [two] { $made ->
        [all] Najdeni sta bili { $count } navedbi, ki še nista povezani z viri iz vaše knjižnice; obe je naredil program, ki hrani vire. Ostajata kot besedilo, kakor sta bili napisani; pregledati ju je mogoče, ko je miselni vzorec narejen, in tudi pozneje.
        [some] Najdeni sta bili { $count } navedbi, ki še nista povezani z viri iz vaše knjižnice; { $some } od njiju je naredil program, ki hrani vire. Ostajata kot besedilo, kakor sta bili napisani; pregledati ju je mogoče, ko je miselni vzorec narejen, in tudi pozneje.
       *[none] Najdeni sta bili { $count } navedbi, ki še nista povezani z viri iz vaše knjižnice. Ostajata kot besedilo, kakor sta bili napisani; pregledati ju je mogoče, ko je miselni vzorec narejen, in tudi pozneje.
    }
    [few] { $made ->
        [all] Najdene so bile { $count } navedbe, ki še niso povezane z viri iz vaše knjižnice; vse je naredil program, ki hrani vire. Ostajajo kot besedilo, kakor so bile napisane; pregledati jih je mogoče, ko je miselni vzorec narejen, in tudi pozneje.
        [some] Najdene so bile { $count } navedbe, ki še niso povezane z viri iz vaše knjižnice; { $some } od njih je naredil program, ki hrani vire. Ostajajo kot besedilo, kakor so bile napisane; pregledati jih je mogoče, ko je miselni vzorec narejen, in tudi pozneje.
       *[none] Najdene so bile { $count } navedbe, ki še niso povezane z viri iz vaše knjižnice. Ostajajo kot besedilo, kakor so bile napisane; pregledati jih je mogoče, ko je miselni vzorec narejen, in tudi pozneje.
    }
   *[other] { $made ->
        [all] Najdenih je bilo { $count } navedb, ki še niso povezane z viri iz vaše knjižnice; vse je naredil program, ki hrani vire. Ostajajo kot besedilo, kakor so bile napisane; pregledati jih je mogoče, ko je miselni vzorec narejen, in tudi pozneje.
        [some] Najdenih je bilo { $count } navedb, ki še niso povezane z viri iz vaše knjižnice; { $some } od njih je naredil program, ki hrani vire. Ostajajo kot besedilo, kakor so bile napisane; pregledati jih je mogoče, ko je miselni vzorec narejen, in tudi pozneje.
       *[none] Najdenih je bilo { $count } navedb, ki še niso povezane z viri iz vaše knjižnice. Ostajajo kot besedilo, kakor so bile napisane; pregledati jih je mogoče, ko je miselni vzorec narejen, in tudi pozneje.
    }
}
core-import-document-endnote = { $count ->
    [one] { $count } navedba, ki jo je naredil EndNote, je uvožena kot besedilo, ki ga kaže, in ni med najdenimi: tega, kar EndNote pove o delih, ni bilo mogoče prebrati.
    [two] { $count } navedbi, ki ju je naredil EndNote, sta uvoženi kot besedilo, ki ga kažeta, in nista med najdenimi: tega, kar EndNote pove o delih, ni bilo mogoče prebrati.
    [few] { $count } navedbe, ki jih je naredil EndNote, so uvožene kot besedilo, ki ga kažejo, in niso med najdenimi: tega, kar EndNote pove o delih, ni bilo mogoče prebrati.
   *[other] { $count } navedb, ki jih je naredil EndNote, je uvoženih kot besedilo, ki ga kažejo, in niso med najdenimi: tega, kar EndNote pove o delih, ni bilo mogoče prebrati.
}
core-import-document-bookmarks = { $count ->
    [one] Dokument hrani { $count } navedbo v zaznamku in tega, kar navaja, ni bilo mogoče prebrati: ostaja besedilo, kakršno je. Zotero jih tako hrani, kadar tako določajo njegove nastavitve dokumenta.
    [two] Dokument hrani { $count } navedbi v zaznamkih in tega, kar navajata, ni bilo mogoče prebrati: ostajata besedilo, kakršno je. Zotero jih tako hrani, kadar tako določajo njegove nastavitve dokumenta.
    [few] Dokument hrani { $count } navedbe v zaznamkih in tega, kar navajajo, ni bilo mogoče prebrati: ostajajo besedilo, kakršno je. Zotero jih tako hrani, kadar tako določajo njegove nastavitve dokumenta.
   *[other] Dokument hrani { $count } navedb v zaznamkih in tega, kar navajajo, ni bilo mogoče prebrati: ostajajo besedilo, kakršno je. Zotero jih tako hrani, kadar tako določajo njegove nastavitve dokumenta.
}
core-import-document-bibliography = Dokument ima seznam tega, kar navaja, pod naslovom »{ $heading }«. Uvožen je kot besedilo, kakor vse drugo. Miselni vzorec naredi svojo bibliografijo iz tega, kar je v njem navedeno.
core-import-document-bibliography-made = Dokument ima seznam tega, kar navaja, narejen s programom, ki hrani njegove vire. Uvožen je kot besedilo, kakor vse drugo. Miselni vzorec naredi svojo bibliografijo iz tega, kar je v njem navedeno.
core-import-document-tracked = Dokument ima sledene spremembe. Besedilo je uvoženo tako, kakršno je, ko so vse sprejete.
core-import-document-comments = Dokument ima komentarje ob robu, ki so izpuščeni.
core-import-document-heading-notes = { $count ->
    [one] Opomba k naslovu stoji na začetku besedila pod njim: naslov ne more imeti opombe.
    [two] { $count } opombi k naslovom stojita na začetku besedila pod njimi: naslov ne more imeti opombe.
    [few] { $count } opombe k naslovom stojijo na začetku besedila pod njimi: naslov ne more imeti opombe.
   *[other] { $count } opomb k naslovom stoji na začetku besedila pod njimi: naslov ne more imeti opombe.
}
# What a caption began with is shown as the document has it: “Figure 1:”.
core-import-document-labels = { $count ->
    [one] { $count } napis se je začel z besedo in številko, kot »{ $first }«. Ta del je izpuščen: miselni vzorec sam številči svoje ilustracije in tabele. Kjer besedilo katero od njih imenuje po številki, je to besedilo, kakor je bilo napisano, in ne sledi številkam miselnega vzorca.
    [two] { $count } napisa sta se začela z besedo in številko, kot »{ $first }«. Ta del je izpuščen: miselni vzorec sam številči svoje ilustracije in tabele. Kjer besedilo katero od njih imenuje po številki, je to besedilo, kakor je bilo napisano, in ne sledi številkam miselnega vzorca.
    [few] { $count } napisi so se začeli z besedo in številko, kot »{ $first }«. Ta del je izpuščen: miselni vzorec sam številči svoje ilustracije in tabele. Kjer besedilo katero od njih imenuje po številki, je to besedilo, kakor je bilo napisano, in ne sledi številkam miselnega vzorca.
   *[other] { $count } napisov se je začelo z besedo in številko, kot »{ $first }«. Ta del je izpuščen: miselni vzorec sam številči svoje ilustracije in tabele. Kjer besedilo katero od njih imenuje po številki, je to besedilo, kakor je bilo napisano, in ne sledi številkam miselnega vzorca.
}
core-import-document-label-example = Slika 1:
core-import-document-caption-notes = { $count ->
    [one] Opomba v napisu ilustracije ali tabele stoji tam v oklepaju.
    [two] { $count } opombi v napisih ilustracij ali tabel stojita tam v oklepaju.
    [few] { $count } opombe v napisih ilustracij ali tabel stojijo tam v oklepaju.
   *[other] { $count } opomb v napisih ilustracij ali tabel stoji tam v oklepaju.
}
core-import-document-headings = { $count ->
    [one] { $count } naslov v citatu, seznamu ali tabeli je uvožen kot krepek odstavek.
    [two] { $count } naslova v citatu, seznamu ali tabeli sta uvožena kot krepka odstavka.
    [few] { $count } naslovi v citatu, seznamu ali tabeli so uvoženi kot krepki odstavki.
   *[other] { $count } naslovov v citatu, seznamu ali tabeli je uvoženih kot krepki odstavki.
}
core-import-document-code = { $count ->
    [one] { $count } blok kode je uvožen kot navadni odstavki, vsaka vrstica svoj.
    [two] { $count } bloka kode sta uvožena kot navadni odstavki, vsaka vrstica svoj.
    [few] { $count } bloki kode so uvoženi kot navadni odstavki, vsaka vrstica svoj.
   *[other] { $count } blokov kode je uvoženih kot navadni odstavki, vsaka vrstica svoj.
}
core-import-document-definitions = { $count ->
    [one] { $count } seznam izrazov z razlagami je uvožen kot odstavki, izrazi krepko.
    [two] { $count } seznama izrazov z razlagami sta uvožena kot odstavki, izrazi krepko.
    [few] { $count } seznami izrazov z razlagami so uvoženi kot odstavki, izrazi krepko.
   *[other] { $count } seznamov izrazov z razlagami je uvoženih kot odstavki, izrazi krepko.
}
core-import-document-rules = { $count ->
    [one] { $count } črta čez stran je izpuščena.
    [two] { $count } črti čez stran sta izpuščeni.
    [few] { $count } črte čez stran so izpuščene.
   *[other] { $count } črt čez stran je izpuščenih.
}
core-import-document-raw = { $count ->
    [one] { $count } kos, napisan v HTML ali TeX samo za eno vrsto dokumenta, je izpuščen.
    [two] { $count } kosa, napisana v HTML ali TeX samo za eno vrsto dokumenta, sta izpuščena.
    [few] { $count } kosi, napisani v HTML ali TeX samo za eno vrsto dokumenta, so izpuščeni.
   *[other] { $count } kosov, napisanih v HTML ali TeX samo za eno vrsto dokumenta, je izpuščenih.
}
core-import-document-pictures-wanting = { $count ->
    [one] { $count } slika, ki jo datoteka vsebuje, ni v prebranem besedilu in je izpuščena. Morda stoji v glavi ali nogi strani ali v risbi.
    [two] { $count } sliki, ki ju datoteka vsebuje, nista v prebranem besedilu in sta izpuščeni. Morda stojita v glavi ali nogi strani ali v risbi.
    [few] { $count } slike, ki jih datoteka vsebuje, niso v prebranem besedilu in so izpuščene. Morda stojijo v glavi ali nogi strani ali v risbi.
   *[other] { $count } slik, ki jih datoteka vsebuje, ni v prebranem besedilu in so izpuščene. Morda stojijo v glavi ali nogi strani ali v risbi.
}

## A picture of a document that is left out, and why.

core-import-document-picture-left-out = Slika »{ $name }« je izpuščena: { $why }.
core-import-document-picture-kind = je vrste, ki se ne bere ({ $kind })
core-import-document-picture-not-read = ni slika vrste, ki se bere
core-import-document-picture-unreadable = ni je bilo mogoče prebrati
core-import-document-picture-network = je v omrežju, od koder se nič ne prenaša
core-import-document-picture-not-taken-out = ni je bilo mogoče vzeti iz datoteke
core-import-document-picture-outside = ni v datoteki, ampak drugje na tem računalniku, in se od tam ne jemlje
core-import-document-picture-not-found = datoteke ni tam, kjer dokument pravi, da je
core-import-document-picture-too-large = večja je od 50 MB
core-import-document-picture-file-unreadable = datoteke ni bilo mogoče prebrati
