# What the core says of references brought in from elsewhere, in English.
# See locales/README.md.

## Where the references came from, as the list of them says: "3 references in pasted text".

core-import-pasted = indsat tekst
core-import-files = { $count ->
    [one] { $count } fil
   *[other] { $count } filer
}

## Files of BibTeX and BibLaTeX.

core-import-file-not-found = Filen »{ $name }« blev ikke fundet.
core-import-empty-entry = Linje { $line }: posten »{ $key }« er tom og blev udeladt.
# Where in a file a reference that has no key was found.
core-import-origin-line = linje { $line }
core-import-origin-key-line = { $key }, linje { $line }

## What went wrong as the references were taken in, each after the reference
## it concerns: Nagy 1979 “The Best of the Achaeans”.

core-import-title = »{ $title }«
core-import-merge-gone = { $reference }: den post, den skulle slås sammen med, findes ikke længere

## PDF files.

core-import-not-a-pdf = { $name } er ikke en PDF.
# The service is a name: Crossref, DataCite.
core-import-details-from = Oplysningerne er fra { $service }.
core-import-number-unknown = Der blev fundet et nummer i filen, men databaserne kender intet til det; oplysningerne er fra selve filen og bør kontrolleres.
core-import-databases-failed = Databaserne kunne ikke spørges ({ $error }); oplysningerne er fra selve filen og bør kontrolleres.

## Zotero.

core-import-zotero-my-library = Mit bibliotek
core-import-zotero-group = Gruppe { $id }
core-import-zotero-the-library = biblioteket { $id } i Zotero
core-import-zotero-own-library = brugerens eget bibliotek i Zotero
core-import-zotero-the-collection = samlingen { $key } i Zotero
core-import-zotero-unknown-base = Filen »{ $name }« blev ikke fundet. Zotero henviser til den fra en mappe, Zotero selv har valgt, og som ikke kendes her.
core-import-zotero-empty-item = Posten { $key } i Zotero er tom og blev udeladt.
core-import-zotero-alone = { $count ->
    [one] { $count } fil eller notat står i Zotero uden nogen reference og blev udeladt.
   *[other] { $count } filer og notater står i Zotero uden nogen reference og blev udeladt.
}
# The role is Zotero's own name for it: "recipient", "reviewed author".
core-import-zotero-not-a-field = Zotero angiver { $name } som { $role }, hvilket BibLaTeX ikke har noget felt for. Navnet blev udeladt.
core-import-zotero-left-out = Zoteros felt »{ $field }« har intet modstykke i BibLaTeX og blev udeladt: { $value }

## Zotero's database.

core-import-zotero-no-database = en Zotero-database ({ $file }) i { $path }
core-import-zotero-copying = kunne ikke kopiere { $path } til en midlertidig mappe
core-import-zotero-empty = filen er tom
core-import-zotero-disturbed = Zotero skrev til sin database, mens den blev læst. Hvis noget mangler, så luk Zotero og importer igen.
core-import-zotero-backup-read = Zoteros database kunne ikke læses ({ $error }). Sikkerhedskopien, { $backup }, blev læst i stedet: det, der er ændret i Zotero, siden sikkerhedskopien blev taget, mangler.
core-import-zotero-not-a-database = { $path } er ikke en Zotero-database.
core-import-zotero-unreadable = Zotero-databasen har en form, der ikke kan læses her: { $what }. Hvis den er skrevet af en gammel version af Zotero, bliver den ført ajour, når den åbnes én gang i en nyere.
core-import-zotero-unreadable-version = Zotero-databasen har en form, der ikke kan læses her (version { $version } af Zoteros database): { $what }. Hvis den er skrevet af en gammel version af Zotero, bliver den ført ajour, når den åbnes én gang i en nyere.
core-import-zotero-no-table = tabellen »{ $table }« mangler
core-import-zotero-no-column = tabellen »{ $table }« har ingen kolonne »{ $column }«
# What is lacking where a table is not there: one of the six below.
core-import-zotero-no-optional = Zotero-databasen har ingen tabel »{ $table }« i den form, der kendes her: { $consequence }.
core-import-zotero-no-bin = poster i Zoteros papirkurv kan ikke skelnes fra de andre
core-import-zotero-no-collections = samlingerne blev ikke læst
core-import-zotero-no-attachments = vedhæftede filer blev ikke læst
core-import-zotero-no-notes = notaterne blev ikke læst
core-import-zotero-no-keywords = nøgleordene blev ikke læst
core-import-zotero-no-group-names = navnene på gruppebibliotekerne kendes ikke

## PDF files, as they are read for a reference.

core-import-pdf-empty = Filen »{ $name }« er tom.
core-import-pdf-not-a-pdf = Filen »{ $name }« er ikke en PDF.
core-import-pdf-unreadable = Filen kunne ikke læses: den er beskadiget, beskyttet med en adgangskode eller for stor.
core-import-pdf-scan = Filen har intet tekstlag: den er en skanning.
core-import-pdf-from-file = Oplysningerne er fra selve filen, ikke fra et katalog, og bør kontrolleres.
core-import-pdf-from-metadata = Der blev hverken fundet DOI eller ISBN i filen; oplysningerne er fra filens egne metadata og bør kontrolleres.
core-import-pdf-unknown = Der blev hverken fundet DOI eller ISBN i filen, og dens metadata siger ikke, hvad den er: oplysningerne må udfyldes.

## Tables, from files of text and of sheets.

core-import-table-too-large = Filen fylder { $size } MB. En tabel læses fra en fil på højst { $most } MB.
core-import-table-kinds = Tabeller læses fra CSV og anden tekst med værdierne adskilt af kommaer, semikoloner eller tabulatorer, og fra regneark fra LibreOffice (.ods) og Excel (.xlsx, .xls).
core-import-table-empty = Der er intet i filen.
# The rows are a number, or where the counting was given up, the message below.
core-import-table-rows = Tabellen har { $rows } rækker. En tabel i en tekst kan højst have { $most }: den er ikke et regneark.
core-import-table-columns = Tabellen har { $columns } kolonner. En tabel i en tekst kan højst have { $most }: den er ikke et regneark.
core-import-table-more-than = mere end { $count }

## Documents brought in, to become maps.

core-import-document-stopped = Læsningen blev standset.
core-import-pdfs-stopped = Undersøgelsen af, hvad filerne er, blev standset. Intet blev tilføjet.
core-import-document-kind = »{ $file }« er ikke af en type, der kan hentes ind som dokument. De, der kan, er Word (DOCX), OpenDocument (ODT), Markdown, HTML, LaTeX, RTF, EPUB, Org, reStructuredText, Typst og ren tekst.
core-import-document-too-large = »{ $file }« er større end 50 MB, og det er mere, end der kan hentes ind som dokument.
# The kind is the kind of file: Word (DOCX), plain text.
core-import-document-unreadable = »{ $file }« kunne ikke læses som { $kind }. Filen kan være beskadiget eller af en anden type, end navnet siger. Pandoc, som læser den, sagde: { $message }
core-import-document-pandoc-unreadable = det, Pandoc gjorde »{ $file }« til, kunne ikke læses: { $error }
# The title of a map made of a document that has none, nor a name of its file.
core-import-document-untitled = Uden titel
core-import-document-plain-text = ren tekst
core-import-document-notebook = Jupyter-notesbog

## What the one who brings a document in should know of it.

core-import-document-found = { $count ->
    [one] { $made ->
        [all] Der blev fundet én kildehenvisning, som endnu ikke er knyttet til en reference i dit bibliotek, lavet af et referenceprogram. Den står som den tekst, den blev skrevet som, og kan gennemgås, når kortet laves, og senere.
       *[none] Der blev fundet én kildehenvisning, som endnu ikke er knyttet til en reference i dit bibliotek. Den står som den tekst, den blev skrevet som, og kan gennemgås, når kortet laves, og senere.
    }
   *[other] { $made ->
        [all] Der blev fundet { $count } kildehenvisninger, som endnu ikke er knyttet til referencer i dit bibliotek, alle lavet af et referenceprogram. De står som den tekst, de blev skrevet som, og kan gennemgås, når kortet laves, og senere.
        [some] Der blev fundet { $count } kildehenvisninger, som endnu ikke er knyttet til referencer i dit bibliotek, { $some } af dem lavet af et referenceprogram. De står som den tekst, de blev skrevet som, og kan gennemgås, når kortet laves, og senere.
       *[none] Der blev fundet { $count } kildehenvisninger, som endnu ikke er knyttet til referencer i dit bibliotek. De står som den tekst, de blev skrevet som, og kan gennemgås, når kortet laves, og senere.
    }
}
core-import-document-endnote = { $count ->
    [one] Én kildehenvisning lavet af EndNote hentes ind som den tekst, den viser, og er ikke blandt dem, der blev fundet: det, EndNote siger om værkerne, kunne ikke læses.
   *[other] { $count } kildehenvisninger lavet af EndNote hentes ind som den tekst, de viser, og er ikke blandt dem, der blev fundet: det, EndNote siger om værkerne, kunne ikke læses.
}
core-import-document-bookmarks = { $count ->
    [one] Dokumentet har én kildehenvisning i et bogmærke, og det, den henviser til, kunne ikke læses: den står som tekst. Zotero gemmer dem anderledes, hvis dets dokumentindstillinger siger det.
   *[other] Dokumentet har { $count } kildehenvisninger i bogmærker, og det, de henviser til, kunne ikke læses: de står som tekst. Zotero gemmer dem anderledes, hvis dets dokumentindstillinger siger det.
}
core-import-document-bibliography = Dokumentet har en liste over det, det henviser til, under »{ $heading }«. Den hentes ind som tekst, som resten. Kortet laver sin egen litteraturliste af det, der henvises til i det.
core-import-document-bibliography-made = Dokumentet har en liste over det, det henviser til, lavet af det program, der holder styr på dets referencer. Den hentes ind som tekst, som resten. Kortet laver sin egen litteraturliste af det, der henvises til i det.
core-import-document-tracked = Dokumentet har registrerede ændringer. Teksten hentes ind, som den står, når alle er godtaget.
core-import-document-comments = Dokumentet har kommentarer i margenen, og de udelades.
core-import-document-heading-notes = { $count ->
    [one] En note til en overskrift står i begyndelsen af teksten under den: en overskrift kan ikke have en note.
   *[other] { $count } noter til overskrifter står i begyndelsen af teksten under dem: en overskrift kan ikke have en note.
}
# What a caption began with is shown as the document has it: “Figure 1:”.
core-import-document-labels = { $count ->
    [one] Én billed- eller tabeltekst begyndte med et ord og et tal, som »{ $first }«. Ordet og tallet er udeladt: kortet nummererer selv sine figurer og tabeller. Hvor teksten nævner en af dem ved dens nummer, er det tekst, som den blev skrevet, og det følger ikke kortets numre.
   *[other] { $count } billed- og tabeltekster begyndte med et ord og et tal, som »{ $first }«. Ordene og tallene er udeladt: kortet nummererer selv sine figurer og tabeller. Hvor teksten nævner en af dem ved dens nummer, er det tekst, som den blev skrevet, og det følger ikke kortets numre.
}
core-import-document-label-example = Figur 1:
core-import-document-caption-notes = { $count ->
    [one] En note i det, der siges om en figur eller en tabel, står der i parentes.
   *[other] { $count } noter i det, der siges om figurer eller tabeller, står der i parentes.
}
core-import-document-headings = { $count ->
    [one] Én overskrift i et citat, en liste eller en tabel hentes ind som et afsnit med fed skrift.
   *[other] { $count } overskrifter i citater, lister eller tabeller hentes ind som afsnit med fed skrift.
}
core-import-document-code = { $count ->
    [one] Én blok kode hentes ind som almindelige afsnit, ét for hver linje.
   *[other] { $count } blokke kode hentes ind som almindelige afsnit, ét for hver linje.
}
core-import-document-definitions = { $count ->
    [one] Én liste over termer med deres betydning hentes ind som afsnit, med termerne i fed skrift.
   *[other] { $count } lister over termer med deres betydning hentes ind som afsnit, med termerne i fed skrift.
}
core-import-document-rules = { $count ->
    [one] Én streg tværs over siden er udeladt.
   *[other] { $count } streger tværs over siden er udeladt.
}
core-import-document-raw = { $count ->
    [one] Ét stykke skrevet i HTML eller TeX, som kun gælder den ene slags dokument, er udeladt.
   *[other] { $count } stykker skrevet i HTML eller TeX, som kun gælder den ene slags dokument, er udeladt.
}
core-import-document-pictures-wanting = { $count ->
    [one] Ét billede, som filen indeholder, er ikke i den tekst, der blev læst, og er udeladt. Det kan stå i sidehovedet eller sidefoden, eller i en tegning.
   *[other] { $count } billeder, som filen indeholder, er ikke i den tekst, der blev læst, og er udeladt. De kan stå i sidehovedet eller sidefoden, eller i en tegning.
}

## A picture of a document that is left out, and why.

core-import-document-picture-left-out = Billedet »{ $name }« er udeladt: { $why }.
core-import-document-picture-kind = det er af en type, der ikke læses ({ $kind })
core-import-document-picture-not-read = det er ikke et billede af en type, der læses
core-import-document-picture-unreadable = det kunne ikke læses
core-import-document-picture-network = det ligger på nettet, og derfra hentes intet
core-import-document-picture-not-taken-out = det kunne ikke tages ud af filen
core-import-document-picture-outside = det ligger ikke i filen, men et andet sted på denne computer, og hentes ikke derfra
core-import-document-picture-not-found = filen blev ikke fundet, hvor dokumentet siger, den er
core-import-document-picture-too-large = det er større end 50 MB
core-import-document-picture-file-unreadable = filen kunne ikke læses
