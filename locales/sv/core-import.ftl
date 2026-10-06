# What the core says of references brought in from elsewhere, in English.
# See locales/README.md.

## Where the references came from, as the list of them says: "3 references in pasted text".

core-import-pasted = inklistrad text
core-import-files = { $count ->
    [one] { $count } fil
   *[other] { $count } filer
}

## Files of BibTeX and BibLaTeX.

core-import-file-not-found = Filen ”{ $name }” hittades inte.
core-import-empty-entry = Rad { $line }: posten ”{ $key }” är tom och utelämnades.
# Where in a file a reference that has no key was found.
core-import-origin-line = rad { $line }
core-import-origin-key-line = { $key }, rad { $line }

## What went wrong as the references were taken in, each after the reference
## it concerns: Nagy 1979 “The Best of the Achaeans”.

core-import-title = ”{ $title }”
core-import-merge-gone = { $reference }: posten att slå ihop med finns inte längre

## PDF files.

core-import-not-a-pdf = { $name } är inte en PDF.
# The service is a name: Crossref, DataCite.
core-import-details-from = Uppgifterna kommer från { $service }.
core-import-number-unknown = Ett nummer hittades i filen, men databaserna vet inget om det; uppgifterna kommer från själva filen och bör kontrolleras.
core-import-databases-failed = Databaserna kunde inte tillfrågas ({ $error }); uppgifterna kommer från själva filen och bör kontrolleras.

## Zotero.

core-import-zotero-my-library = Mitt bibliotek
core-import-zotero-group = Grupp { $id }
core-import-zotero-the-library = biblioteket { $id } i Zotero
core-import-zotero-own-library = användarens eget bibliotek i Zotero
core-import-zotero-the-collection = samlingen { $key } i Zotero
core-import-zotero-unknown-base = Filen ”{ $name }” hittades inte. Zotero länkar till den från en mapp som Zotero själv valt, och som inte är känd här.
core-import-zotero-empty-item = Posten { $key } i Zotero är tom och utelämnades.
core-import-zotero-alone = { $count ->
    [one] { $count } fil eller anteckning står i Zotero utan någon referens, och utelämnades.
   *[other] { $count } filer och anteckningar står i Zotero utan någon referens, och utelämnades.
}
# The role is Zotero's own name for it: "recipient", "reviewed author".
core-import-zotero-not-a-field = Zotero anger { $name } som { $role }, vilket BibLaTeX inte har något fält för. Namnet utelämnades.
core-import-zotero-left-out = Zoteros fält ”{ $field }” har ingen motsvarighet i BibLaTeX och utelämnades: { $value }

## Zotero's database.

core-import-zotero-no-database = en Zotero-databas ({ $file }) i { $path }
core-import-zotero-copying = kopieringen av { $path } till en tillfällig mapp
core-import-zotero-empty = filen är tom
core-import-zotero-disturbed = Zotero skrev i sin databas medan den lästes. Om något saknas, stäng Zotero och importera igen.
core-import-zotero-backup-read = Zoteros databas kunde inte läsas ({ $error }). Dess säkerhetskopia, { $backup }, lästes i stället: det som ändrats i Zotero sedan kopian gjordes saknas.
core-import-zotero-not-a-database = { $path } är inte en databas från Zotero.
core-import-zotero-unreadable = Zotero-databasen har en form som inte kan läsas här: { $what }. Om den skrevs av en gammal version av Zotero, räcker det att öppna den en gång i en aktuell version för att föra den à jour.
core-import-zotero-unreadable-version = Zotero-databasen har en form som inte kan läsas här (version { $version } av Zoteros databas): { $what }. Om den skrevs av en gammal version av Zotero, räcker det att öppna den en gång i en aktuell version för att föra den à jour.
core-import-zotero-no-table = tabellen ”{ $table }” saknas
core-import-zotero-no-column = tabellen ”{ $table }” har ingen kolumn ”{ $column }”
# What is lacking where a table is not there: one of the six below.
core-import-zotero-no-optional = Zotero-databasen har ingen tabell ”{ $table }” av den form som är känd här: { $consequence }.
core-import-zotero-no-bin = poster i Zoteros papperskorg kan inte skiljas från de andra
core-import-zotero-no-collections = samlingarna lästes inte
core-import-zotero-no-attachments = bifogade filer lästes inte
core-import-zotero-no-notes = anteckningarna lästes inte
core-import-zotero-no-keywords = nyckelorden lästes inte
core-import-zotero-no-group-names = gruppbibliotekens namn är inte kända

## PDF files, as they are read for a reference.

core-import-pdf-empty = Filen ”{ $name }” är tom.
core-import-pdf-not-a-pdf = Filen ”{ $name }” är inte en PDF.
core-import-pdf-unreadable = Filen kunde inte läsas: den är skadad, skyddad av ett lösenord, eller för stor.
core-import-pdf-scan = Filen har inget textlager: den är en inskanning.
core-import-pdf-from-file = Uppgifterna kommer från själva filen, inte från någon katalog, och bör kontrolleras.
core-import-pdf-from-metadata = Ingen DOI eller ISBN hittades i filen; uppgifterna kommer från filens egna metadata och bör kontrolleras.
core-import-pdf-unknown = Ingen DOI eller ISBN hittades i filen, och dess metadata säger inte vad den är: uppgifterna måste fyllas i.

## Tables, from files of text and of sheets.

core-import-table-too-large = Filen rymmer { $size } MB. En tabell läses från en fil på högst { $most } MB.
core-import-table-kinds = Tabeller läses från CSV och annan text med värdena åtskilda av kommatecken, semikolon eller tabbar, och från kalkylblad från LibreOffice (.ods) och Excel (.xlsx, .xls).
core-import-table-empty = Det finns inget i filen.
# The rows are a number, or where the counting was given up, the message below.
core-import-table-rows = Tabellen har { $rows } rader. En tabell i en text kan ha högst { $most }: den är inget kalkylblad.
core-import-table-columns = Tabellen har { $columns } kolumner. En tabell i en text kan ha högst { $most }: den är inget kalkylblad.
core-import-table-more-than = fler än { $count }

## Documents brought in, to become maps.

core-import-document-stopped = Läsningen avbröts.
core-import-pdfs-stopped = Utrönandet av vad filerna är avbröts. Inget lades till.
core-import-document-kind = ”{ $file }” är inte av ett slag som kan hämtas in som dokument. De som kan är Word (DOCX), OpenDocument (ODT), Markdown, HTML, LaTeX, RTF, EPUB, Org, reStructuredText, Typst och ren text.
core-import-document-too-large = ”{ $file }” är större än 50 MB, vilket är mer än vad som kan hämtas in som dokument.
# The kind is the kind of file: Word (DOCX), plain text.
core-import-document-unreadable = ”{ $file }” kunde inte läsas som { $kind }. Den kan vara skadad, eller av ett annat slag än namnet säger. Pandoc, som läser den, sade: { $message }
core-import-document-pandoc-unreadable = det Pandoc gjorde av ”{ $file }” kunde inte läsas: { $error }
# The title of a map made of a document that has none, nor a name of its file.
core-import-document-untitled = Utan titel
core-import-document-plain-text = ren text
core-import-document-notebook = Jupyter-anteckningsbok

## What the one who brings a document in should know of it.

core-import-document-found = { $count ->
    [one] { $made ->
        [all] { $count } källhänvisning hittades som ännu inte är knuten till någon referens i ditt bibliotek, gjord av ett program som håller referenser. Den står som den text den skrevs som, och kan gås igenom när kartan görs, och senare.
       *[none] { $count } källhänvisning hittades som ännu inte är knuten till någon referens i ditt bibliotek. Den står som den text den skrevs som, och kan gås igenom när kartan görs, och senare.
    }
   *[other] { $made ->
        [all] { $count } källhänvisningar hittades som ännu inte är knutna till referenser i ditt bibliotek, alla gjorda av ett program som håller referenser. De står som den text de skrevs som, och kan gås igenom när kartan görs, och senare.
        [some] { $count } källhänvisningar hittades som ännu inte är knutna till referenser i ditt bibliotek, { $some } av dem gjorda av ett program som håller referenser. De står som den text de skrevs som, och kan gås igenom när kartan görs, och senare.
       *[none] { $count } källhänvisningar hittades som ännu inte är knutna till referenser i ditt bibliotek. De står som den text de skrevs som, och kan gås igenom när kartan görs, och senare.
    }
}
core-import-document-endnote = { $count ->
    [one] { $count } källhänvisning gjord av EndNote hämtas in som den text den visar, och är inte bland dem som hittades: det EndNote säger om verken kunde inte läsas.
   *[other] { $count } källhänvisningar gjorda av EndNote hämtas in som den text de visar, och är inte bland dem som hittades: det EndNote säger om verken kunde inte läsas.
}
core-import-document-bookmarks = { $count ->
    [one] Dokumentet håller { $count } källhänvisning i ett bokmärke, och vad den hänvisar till kunde inte läsas: den är text som den står. Zotero håller dem på annat sätt där dess dokumentinställningar säger så.
   *[other] Dokumentet håller { $count } källhänvisningar i bokmärken, och vad de hänvisar till kunde inte läsas: de är text som de står. Zotero håller dem på annat sätt där dess dokumentinställningar säger så.
}
core-import-document-bibliography = Dokumentet har en lista över vad det hänvisar till, under ”{ $heading }”. Den hämtas in som text, liksom resten. Kartan gör en egen litteraturförteckning av det som hänvisas till i den.
core-import-document-bibliography-made = Dokumentet har en lista över vad det hänvisar till, gjord av programmet som håller dess referenser. Den hämtas in som text, liksom resten. Kartan gör en egen litteraturförteckning av det som hänvisas till i den.
core-import-document-tracked = Dokumentet har spårade ändringar. Texten hämtas in som den står när alla ändringarna är godtagna.
core-import-document-comments = Dokumentet har kommentarer i marginalen, som utelämnas.
core-import-document-heading-notes = { $count ->
    [one] En not till en rubrik står i början av texten under den: en rubrik kan inte ha någon not.
   *[other] { $count } noter till rubriker står i början av texten under dem: en rubrik kan inte ha någon not.
}
# What a caption began with is shown as the document has it: “Figure 1:”.
core-import-document-labels = { $count ->
    [one] { $count } bildtext började med ett ord och ett nummer, som ”{ $first }”. Det utelämnas: kartan numrerar sina figurer och tabeller själv. Där texten nämner någon av dem med nummer är det text som den skrevs, och den följer inte kartans numrering.
   *[other] { $count } bildtexter började med ett ord och ett nummer, som ”{ $first }”. Det utelämnas: kartan numrerar sina figurer och tabeller själv. Där texten nämner någon av dem med nummer är det text som den skrevs, och den följer inte kartans numrering.
}
core-import-document-label-example = Figur 1:
core-import-document-caption-notes = { $count ->
    [one] En not i det som sägs om en figur eller en tabell står där inom hakparentes.
   *[other] { $count } noter i det som sägs om figurer eller tabeller står där inom hakparentes.
}
core-import-document-headings = { $count ->
    [one] { $count } rubrik i ett citat, en lista eller en tabell hämtas in som ett stycke i fetstil.
   *[other] { $count } rubriker i citat, listor eller tabeller hämtas in som stycken i fetstil.
}
core-import-document-code = { $count ->
    [one] { $count } kodblock hämtas in som vanliga stycken, ett för varje rad.
   *[other] { $count } kodblock hämtas in som vanliga stycken, ett för varje rad.
}
core-import-document-definitions = { $count ->
    [one] { $count } lista över termer med vad de betyder hämtas in som stycken, med termerna i fetstil.
   *[other] { $count } listor över termer med vad de betyder hämtas in som stycken, med termerna i fetstil.
}
core-import-document-rules = { $count ->
    [one] { $count } linje tvärs över sidan utelämnas.
   *[other] { $count } linjer tvärs över sidan utelämnas.
}
core-import-document-raw = { $count ->
    [one] { $count } stycke skrivet i HTML eller TeX för bara det ena slaget av dokument utelämnas.
   *[other] { $count } stycken skrivna i HTML eller TeX för bara det ena slaget av dokument utelämnas.
}
core-import-document-pictures-wanting = { $count ->
    [one] { $count } bild som filen rymmer finns inte i texten som lästes, och utelämnas. Den kan stå i sidhuvudet eller sidfoten, eller i en ritning.
   *[other] { $count } bilder som filen rymmer finns inte i texten som lästes, och utelämnas. De kan stå i sidhuvudet eller sidfoten, eller i en ritning.
}

## A picture of a document that is left out, and why.

core-import-document-picture-left-out = Bilden ”{ $name }” utelämnas: { $why }.
core-import-document-picture-kind = den är av ett slag som inte läses ({ $kind })
core-import-document-picture-not-read = den är inte en bild av ett slag som läses
core-import-document-picture-unreadable = den kunde inte läsas
core-import-document-picture-network = den ligger på nätet, och därifrån hämtas inget
core-import-document-picture-not-taken-out = den kunde inte tas ut ur filen
core-import-document-picture-outside = den ligger inte i filen utan på annat håll på den här datorn, och tas inte därifrån
core-import-document-picture-not-found = filen hittades inte där dokumentet säger att den ligger
core-import-document-picture-too-large = den är större än 50 MB
core-import-document-picture-file-unreadable = filen kunde inte läsas
