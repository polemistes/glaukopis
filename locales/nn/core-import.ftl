# What the core says of references brought in from elsewhere, in English.
# See locales/README.md.

## Where the references came from, as the list of them says: "3 references in pasted text".

core-import-pasted = innlimt tekst
core-import-files = { $count ->
    [one] { $count } fil
   *[other] { $count } filer
}

## Files of BibTeX and BibLaTeX.

core-import-file-not-found = Fila «{ $name }» vart ikkje funnen.
core-import-empty-entry = Linje { $line }: oppføringa «{ $key }» er tom og vart utelaten.
# Where in a file a reference that has no key was found.
core-import-origin-line = linje { $line }
core-import-origin-key-line = { $key }, linje { $line }

## What went wrong as the references were taken in, each after the reference
## it concerns: Nagy 1979 “The Best of the Achaeans”.

core-import-title = «{ $title }»
core-import-merge-gone = { $reference }: oppføringa den skulle slåast saman med, finst ikkje lenger

## PDF files.

core-import-not-a-pdf = { $name } er ikkje ein PDF.
# The service is a name: Crossref, DataCite.
core-import-details-from = Opplysningane er henta frå { $service }.
core-import-number-unknown = Eit nummer vart funne i fila, men databasane veit ingenting om det; opplysningane er henta frå sjølve fila og bør kontrollerast.
core-import-databases-failed = Databasane kunne ikkje spørjast ({ $error }); opplysningane er henta frå sjølve fila og bør kontrollerast.

## Zotero.

core-import-zotero-my-library = Mitt bibliotek
core-import-zotero-group = Gruppe { $id }
core-import-zotero-the-library = biblioteket { $id } i Zotero
core-import-zotero-own-library = ditt eige bibliotek i Zotero
core-import-zotero-the-collection = samlinga { $key } i Zotero
core-import-zotero-unknown-base = Fila «{ $name }» vart ikkje funnen. Zotero lenkjer til den frå ei mappe Zotero har valt sjølv, og som ikkje er kjend her.
core-import-zotero-empty-item = Elementet { $key } i Zotero er tomt og vart utelate.
core-import-zotero-alone = { $count ->
    [one] { $count } fil eller notat i Zotero høyrer ikkje til nokon referanse, og kom ikkje med.
   *[other] { $count } filer og notat i Zotero høyrer ikkje til nokon referanse, og kom ikkje med.
}
# The role is Zotero's own name for it: "recipient", "reviewed author".
core-import-zotero-not-a-field = Zotero oppgir { $name } som { $role }, men BibLaTeX har ikkje noko felt for det. Namnet vart utelate.
core-import-zotero-left-out = Zotero-feltet «{ $field }» har ikkje noko motstykke i BibLaTeX og vart utelate: { $value }

## Zotero's database.

core-import-zotero-no-database = ein Zotero-database ({ $file }) i { $path }
core-import-zotero-copying = kunne ikkje kopiere { $path } til ei mellombels mappe
core-import-zotero-empty = fila er tom
core-import-zotero-disturbed = Zotero skreiv til databasen sin medan den vart lesen. Om noko manglar, lukk Zotero og importer på nytt.
core-import-zotero-backup-read = Databasen til Zotero kunne ikkje lesast ({ $error }). Tryggingskopien, { $backup }, vart lesen i staden: det som er endra i Zotero etter at tryggingskopien vart teken, manglar.
core-import-zotero-not-a-database = { $path } er ikkje ein Zotero-database.
core-import-zotero-unreadable = Zotero-databasen har ei form som ikkje kan lesast her: { $what }. Om den vart skriven av ein gammal versjon av Zotero, blir den oppdatert når den blir opna éin gong i ein nyare versjon.
core-import-zotero-unreadable-version = Zotero-databasen har ei form som ikkje kan lesast her (versjon { $version } av Zotero sin database): { $what }. Om den vart skriven av ein gammal versjon av Zotero, blir den oppdatert når den blir opna éin gong i ein nyare versjon.
core-import-zotero-no-table = tabellen «{ $table }» manglar
core-import-zotero-no-column = tabellen «{ $table }» har inga kolonne «{ $column }»
# What is lacking where a table is not there: one of the six below.
core-import-zotero-no-optional = Zotero-databasen har ingen tabell «{ $table }» i den forma som er kjend her: { $consequence }.
core-import-zotero-no-bin = element i papirkorga til Zotero kan ikkje skiljast frå dei andre
core-import-zotero-no-collections = samlingane vart ikkje lesne
core-import-zotero-no-attachments = vedlagde filer vart ikkje lesne
core-import-zotero-no-notes = notata vart ikkje lesne
core-import-zotero-no-keywords = nøkkelorda vart ikkje lesne
core-import-zotero-no-group-names = namna på gruppebiblioteka er ikkje kjende

## PDF files, as they are read for a reference.

core-import-pdf-empty = Fila «{ $name }» er tom.
core-import-pdf-not-a-pdf = Fila «{ $name }» er ikkje ein PDF.
core-import-pdf-unreadable = Fila kunne ikkje lesast: den er skadd, verna med passord eller for stor.
core-import-pdf-scan = Fila har ikkje noko tekstlag: den er skanna.
core-import-pdf-from-file = Opplysningane er henta frå sjølve fila, ikkje frå ein katalog, og bør kontrollerast.
core-import-pdf-from-metadata = Ingen DOI eller ISBN vart funne i fila; opplysningane er henta frå metadataa til fila sjølv og bør kontrollerast.
core-import-pdf-unknown = Ingen DOI eller ISBN vart funne i fila, og metadataa seier ikkje kva den er: opplysningane må fyllast inn.

## Tables, from files of text and of sheets.

core-import-table-too-large = Fila er på { $size } MB. Ein tabell blir lesen frå ei fil på høgst { $most } MB.
core-import-table-kinds = Tabellar blir lesne frå CSV og annan tekst der verdiane er skilde med komma, semikolon eller tabulator, og frå arka i LibreOffice (.ods) og Excel (.xlsx, .xls).
core-import-table-empty = Det står ingenting i fila.
# The rows are a number, or where the counting was given up, the message below.
core-import-table-rows = Tabellen har { $rows } rader. Ein tabell i ein tekst kan ha høgst { $most }: den er ikkje eit rekneark.
core-import-table-columns = Tabellen har { $columns } kolonnar. Ein tabell i ein tekst kan ha høgst { $most }: den er ikkje eit rekneark.
core-import-table-more-than = meir enn { $count }

## Documents brought in, to become maps.

core-import-document-stopped = Lesinga vart stoppa.
core-import-pdfs-stopped = Å finne ut kva filene er, vart stoppa. Ingenting vart lagt til.
core-import-document-kind = «{ $file }» er ikkje av ein type som kan hentast inn som dokument. Dei som kan, er Word (DOCX), OpenDocument (ODT), Markdown, HTML, LaTeX, RTF, EPUB, Org, reStructuredText, Typst og rein tekst.
core-import-document-too-large = «{ $file }» er større enn 50 MB, og det er meir enn det som kan hentast inn som dokument.
# The kind is the kind of file: Word (DOCX), plain text.
core-import-document-unreadable = «{ $file }» kunne ikkje lesast som { $kind }. Fila kan vere skadd, eller av ein annan type enn namnet seier. Pandoc, som les den, sa: { $message }
core-import-document-pandoc-unreadable = det Pandoc gjorde av «{ $file }», kunne ikkje lesast: { $error }
# The title of a map made of a document that has none, nor a name of its file.
core-import-document-untitled = Utan namn
core-import-document-plain-text = rein tekst
core-import-document-notebook = Jupyter-notatbok

## What the one who brings a document in should know of it.

core-import-document-found = { $count ->
    [one] { $made ->
        [all] Det vart funne éi kjeldetilvising som enno ikkje er knytt til ein referanse i biblioteket ditt, laga av eit referanseprogram. Den står slik den vart skriven, og kan gåast gjennom når kartet blir laga, og seinare.
       *[none] Det vart funne éi kjeldetilvising som enno ikkje er knytt til ein referanse i biblioteket ditt. Den står slik den vart skriven, og kan gåast gjennom når kartet blir laga, og seinare.
    }
   *[other] { $made ->
        [all] Det vart funne { $count } kjeldetilvisingar som enno ikkje er knytte til referansar i biblioteket ditt, alle laga av eit referanseprogram. Dei står slik dei vart skrivne, og kan gåast gjennom når kartet blir laga, og seinare.
        [some] Det vart funne { $count } kjeldetilvisingar som enno ikkje er knytte til referansar i biblioteket ditt, { $some } av dei laga av eit referanseprogram. Dei står slik dei vart skrivne, og kan gåast gjennom når kartet blir laga, og seinare.
       *[none] Det vart funne { $count } kjeldetilvisingar som enno ikkje er knytte til referansar i biblioteket ditt. Dei står slik dei vart skrivne, og kan gåast gjennom når kartet blir laga, og seinare.
    }
}
core-import-document-endnote = { $count ->
    [one] Éi kjeldetilvising laga av EndNote er henta inn som teksten den viser, og er ikkje blant dei som vart funne: det EndNote seier om verka, kunne ikkje lesast.
   *[other] { $count } kjeldetilvisingar laga av EndNote er henta inn som teksten dei viser, og er ikkje blant dei som vart funne: det EndNote seier om verka, kunne ikkje lesast.
}
core-import-document-bookmarks = { $count ->
    [one] Dokumentet har éi kjeldetilvising i eit bokmerke, og det den viser til, kunne ikkje lesast: den står som tekst. Zotero lagrar dei på ein annan måte når dokumentinnstillingane seier det.
   *[other] Dokumentet har { $count } kjeldetilvisingar i bokmerke, og det dei viser til, kunne ikkje lesast: dei står som tekst. Zotero lagrar dei på ein annan måte når dokumentinnstillingane seier det.
}
core-import-document-bibliography = Dokumentet har ei liste over det det viser til, under «{ $heading }». Den blir henta inn som tekst, som resten. Kartet lagar si eiga litteraturliste av det som blir vist til i det.
core-import-document-bibliography-made = Dokumentet har ei liste over det det viser til, laga av programmet som held orden på referansane. Den blir henta inn som tekst, som resten. Kartet lagar si eiga litteraturliste av det som blir vist til i det.
core-import-document-tracked = Dokumentet har spora endringar. Teksten blir henta inn slik den står når alle er godtekne.
core-import-document-comments = Dokumentet har kommentarar i margen, og dei blir utelatne.
core-import-document-heading-notes = { $count ->
    [one] Ein note til ei overskrift står i byrjinga av teksten under den: ei overskrift kan ikkje ha ein note.
   *[other] { $count } notar til overskrifter står i byrjinga av teksten under dei: ei overskrift kan ikkje ha ein note.
}
# What a caption began with is shown as the document has it: “Figure 1:”.
core-import-document-labels = { $count ->
    [one] Éin bilettekst byrja med eit ord og eit tal, som «{ $first }». Ordet og talet er utelatne: kartet nummererer figurane og tabellane sine sjølv. Der teksten viser til ein av dei med nummeret, er det tekst slik den vart skriven, og det følgjer ikkje numra i kartet.
   *[other] { $count } bilettekstar byrja med eit ord og eit tal, som «{ $first }». Orda og tala er utelatne: kartet nummererer figurane og tabellane sine sjølv. Der teksten viser til ein av dei med nummeret, er det tekst slik den vart skriven, og det følgjer ikkje numra i kartet.
}
core-import-document-label-example = Figur 1:
core-import-document-caption-notes = { $count ->
    [one] Ein note i det som blir sagt om ein figur eller ein tabell, står der i parentes.
   *[other] { $count } notar i det som blir sagt om figurar eller tabellar, står der i parentes.
}
core-import-document-headings = { $count ->
    [one] Éi overskrift i eit sitat, ei liste eller ein tabell er henta inn som eit avsnitt i feit skrift.
   *[other] { $count } overskrifter i eit sitat, ei liste eller ein tabell er henta inn som avsnitt i feit skrift.
}
core-import-document-code = { $count ->
    [one] Éi kodeblokk er henta inn som vanlege avsnitt, eitt for kvar linje.
   *[other] { $count } kodeblokker er henta inn som vanlege avsnitt, eitt for kvar linje.
}
core-import-document-definitions = { $count ->
    [one] Éi liste med omgrep og kva dei tyder, er henta inn som avsnitt, med omgrepa i feit skrift.
   *[other] { $count } lister med omgrep og kva dei tyder, er henta inn som avsnitt, med omgrepa i feit skrift.
}
core-import-document-rules = { $count ->
    [one] Éi linje tvers over sida er utelaten.
   *[other] { $count } linjer tvers over sida er utelatne.
}
core-import-document-raw = { $count ->
    [one] Éin bit skriven i HTML eller TeX for berre éin type dokument er utelaten.
   *[other] { $count } bitar skrivne i HTML eller TeX for berre éin type dokument er utelatne.
}
core-import-document-pictures-wanting = { $count ->
    [one] Eitt bilete som fila inneheld, er ikkje med i teksten som vart lesen, og er utelate. Det kan stå i toppteksten eller botnteksten på sidene, eller i ei teikning.
   *[other] { $count } bilete som fila inneheld, er ikkje med i teksten som vart lesen, og er utelatne. Dei kan stå i toppteksten eller botnteksten på sidene, eller i ei teikning.
}

## A picture of a document that is left out, and why.

core-import-document-picture-left-out = Biletet «{ $name }» er utelate: { $why }.
core-import-document-picture-kind = det er av ein type som ikkje blir lesen ({ $kind })
core-import-document-picture-not-read = det er ikkje eit bilete av ein type som blir lesen
core-import-document-picture-unreadable = det kunne ikkje lesast
core-import-document-picture-network = det ligg på nettet, og ingenting blir henta derifrå
core-import-document-picture-not-taken-out = det kunne ikkje takast ut av fila
core-import-document-picture-outside = det ligg ikkje i fila, men ein annan stad på denne datamaskina, og blir ikkje henta derifrå
core-import-document-picture-not-found = fila vart ikkje funnen der dokumentet seier den er
core-import-document-picture-too-large = det er større enn 50 MB
core-import-document-picture-file-unreadable = fila kunne ikkje lesast
