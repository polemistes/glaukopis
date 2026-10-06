# What the core says of references brought in from elsewhere, in English.
# See locales/README.md.

## Where the references came from, as the list of them says: "3 references in pasted text".

core-import-pasted = geplakte tekst
core-import-files = { $count ->
    [one] { $count } bestand
   *[other] { $count } bestanden
}

## Files of BibTeX and BibLaTeX.

core-import-file-not-found = Het bestand ‘{ $name }’ is niet gevonden.
core-import-empty-entry = Regel { $line }: het item ‘{ $key }’ is leeg en is weggelaten.
# Where in a file a reference that has no key was found.
core-import-origin-line = regel { $line }
core-import-origin-key-line = { $key }, regel { $line }

## What went wrong as the references were taken in, each after the reference
## it concerns: Nagy 1979 “The Best of the Achaeans”.

core-import-title = ‘{ $title }’
core-import-merge-gone = { $reference }: het item om mee samen te voegen is er niet meer

## PDF files.

core-import-not-a-pdf = { $name } is geen PDF.
# The service is a name: Crossref, DataCite.
core-import-details-from = De gegevens komen van { $service }.
core-import-number-unknown = In het bestand is een nummer gevonden, maar de databanken weten er niets van; de gegevens komen uit het bestand zelf en moeten worden nagekeken.
core-import-databases-failed = De databanken konden niet worden geraadpleegd ({ $error }); de gegevens komen uit het bestand zelf en moeten worden nagekeken.

## Zotero.

core-import-zotero-my-library = Mijn bibliotheek
core-import-zotero-group = Groep { $id }
core-import-zotero-the-library = de bibliotheek { $id } in Zotero
core-import-zotero-own-library = de eigen bibliotheek van de gebruiker in Zotero
core-import-zotero-the-collection = de verzameling { $key } in Zotero
core-import-zotero-unknown-base = Het bestand ‘{ $name }’ is niet gevonden. Zotero verwijst ernaar vanuit een map die het zelf heeft gekozen en die hier niet bekend is.
core-import-zotero-empty-item = Het item { $key } in Zotero is leeg en is weggelaten.
core-import-zotero-alone = { $count ->
    [one] { $count } bestand of notitie staat in Zotero onder geen enkele referentie en is weggelaten.
   *[other] { $count } bestanden en notities staan in Zotero onder geen enkele referentie en zijn weggelaten.
}
# The role is Zotero's own name for it: "recipient", "reviewed author".
core-import-zotero-not-a-field = Zotero noemt { $name } als { $role }, waarvoor BibLaTeX geen veld heeft. De naam is weggelaten.
core-import-zotero-left-out = Het veld ‘{ $field }’ van Zotero heeft geen tegenhanger in BibLaTeX en is weggelaten: { $value }

## Zotero's database.

core-import-zotero-no-database = een Zotero-databank ({ $file }) in { $path }
core-import-zotero-copying = het kopiëren van { $path } naar een tijdelijke map
core-import-zotero-empty = het bestand is leeg
core-import-zotero-disturbed = Zotero schreef naar zijn databank terwijl die werd gelezen. Als er iets ontbreekt, sluit dan Zotero en importeer opnieuw.
core-import-zotero-backup-read = De databank van Zotero kon niet worden gelezen ({ $error }). In plaats daarvan is de reservekopie { $backup } gelezen: wat in Zotero is veranderd sinds die kopie werd gemaakt, ontbreekt.
core-import-zotero-not-a-database = { $path } is geen databank van Zotero.
core-import-zotero-unreadable = De databank van Zotero heeft een vorm die hier niet kan worden gelezen: { $what }. Als ze door een oude versie van Zotero is geschreven, brengt eenmaal openen in een huidige versie haar bij de tijd.
core-import-zotero-unreadable-version = De databank van Zotero heeft een vorm die hier niet kan worden gelezen (versie { $version } van de databank van Zotero): { $what }. Als ze door een oude versie van Zotero is geschreven, brengt eenmaal openen in een huidige versie haar bij de tijd.
core-import-zotero-no-table = de tabel ‘{ $table }’ ontbreekt
core-import-zotero-no-column = de tabel ‘{ $table }’ heeft geen kolom ‘{ $column }’
# What is lacking where a table is not there: one of the six below.
core-import-zotero-no-optional = De databank van Zotero heeft geen tabel ‘{ $table }’ in de vorm die hier bekend is: { $consequence }.
core-import-zotero-no-bin = items in de prullenbak van Zotero zijn niet van de andere te onderscheiden
core-import-zotero-no-collections = verzamelingen zijn niet gelezen
core-import-zotero-no-attachments = bijgevoegde bestanden zijn niet gelezen
core-import-zotero-no-notes = notities zijn niet gelezen
core-import-zotero-no-keywords = trefwoorden zijn niet gelezen
core-import-zotero-no-group-names = de namen van groepsbibliotheken zijn niet bekend

## PDF files, as they are read for a reference.

core-import-pdf-empty = Het bestand ‘{ $name }’ is leeg.
core-import-pdf-not-a-pdf = Het bestand ‘{ $name }’ is geen PDF.
core-import-pdf-unreadable = Het bestand kon niet worden gelezen: het is beschadigd, met een wachtwoord beveiligd, of te groot.
core-import-pdf-scan = Het bestand heeft geen tekstlaag: het is een scan.
core-import-pdf-from-file = De gegevens komen uit het bestand zelf, niet uit een catalogus, en moeten worden nagekeken.
core-import-pdf-from-metadata = In het bestand is geen DOI of ISBN gevonden; de gegevens komen uit de metadata van het bestand zelf en moeten worden nagekeken.
core-import-pdf-unknown = In het bestand is geen DOI of ISBN gevonden, en de metadata zeggen niet wat het is: de gegevens moeten worden ingevuld.

## Tables, from files of text and of sheets.

core-import-table-too-large = Het bestand is { $size } MB groot. Een tabel wordt gelezen uit een bestand van ten hoogste { $most } MB.
core-import-table-kinds = Tabellen worden gelezen uit CSV en andere tekst met de waarden gescheiden door komma's, puntkomma's of tabs, en uit de werkbladen van LibreOffice (.ods) en Excel (.xlsx, .xls).
core-import-table-empty = Er staat niets in het bestand.
# The rows are a number, or where the counting was given up, the message below.
core-import-table-rows = De tabel heeft { $rows } rijen. Een tabel in een tekst kan er ten hoogste { $most } hebben: het is geen rekenblad.
core-import-table-columns = De tabel heeft { $columns } kolommen. Een tabel in een tekst kan er ten hoogste { $most } hebben: het is geen rekenblad.
core-import-table-more-than = meer dan { $count }

## Documents brought in, to become maps.

core-import-document-stopped = Het lezen is gestopt.
core-import-pdfs-stopped = Het uitzoeken wat de bestanden zijn, is gestopt. Er is niets toegevoegd.
core-import-document-kind = ‘{ $file }’ is niet van een soort die als document kan worden binnengehaald. Dat kunnen Word (DOCX), OpenDocument (ODT), Markdown, HTML, LaTeX, RTF, EPUB, Org, reStructuredText, Typst en platte tekst.
core-import-document-too-large = ‘{ $file }’ is groter dan 50 MB, en dat is meer dan als document kan worden binnengehaald.
# The kind is the kind of file: Word (DOCX), plain text.
core-import-document-unreadable = ‘{ $file }’ kon niet als { $kind } worden gelezen. Het is misschien beschadigd, of van een andere soort dan zijn naam zegt. Pandoc, dat het leest, zei: { $message }
core-import-document-pandoc-unreadable = wat Pandoc van ‘{ $file }’ heeft gemaakt, kon niet worden gelezen: { $error }
# The title of a map made of a document that has none, nor a name of its file.
core-import-document-untitled = Zonder titel
core-import-document-plain-text = platte tekst
core-import-document-notebook = Jupyter-notebook

## What the one who brings a document in should know of it.

core-import-document-found = { $count ->
    [one] { $made ->
        [all] Er is { $count } verwijzing gevonden die nog niet aan een referentie van je bibliotheek is gekoppeld, gemaakt door een programma dat referenties bijhoudt. Ze staat er als de tekst waarin ze is geschreven, en kan worden doorgenomen wanneer de mindmap wordt gemaakt, en later.
       *[none] Er is { $count } verwijzing gevonden die nog niet aan een referentie van je bibliotheek is gekoppeld. Ze staat er als de tekst waarin ze is geschreven, en kan worden doorgenomen wanneer de mindmap wordt gemaakt, en later.
    }
   *[other] { $made ->
        [all] Er zijn { $count } verwijzingen gevonden die nog niet aan referenties van je bibliotheek zijn gekoppeld, alle gemaakt door een programma dat referenties bijhoudt. Ze staan er als de tekst waarin ze zijn geschreven, en kunnen worden doorgenomen wanneer de mindmap wordt gemaakt, en later.
        [some] Er zijn { $count } verwijzingen gevonden die nog niet aan referenties van je bibliotheek zijn gekoppeld, { $some } ervan gemaakt door een programma dat referenties bijhoudt. Ze staan er als de tekst waarin ze zijn geschreven, en kunnen worden doorgenomen wanneer de mindmap wordt gemaakt, en later.
       *[none] Er zijn { $count } verwijzingen gevonden die nog niet aan referenties van je bibliotheek zijn gekoppeld. Ze staan er als de tekst waarin ze zijn geschreven, en kunnen worden doorgenomen wanneer de mindmap wordt gemaakt, en later.
    }
}
core-import-document-endnote = { $count ->
    [one] { $count } verwijzing die door EndNote is gemaakt, wordt binnengehaald als de tekst die ze toont, en hoort niet bij de gevonden verwijzingen: wat EndNote over de werken zegt, kon niet worden gelezen.
   *[other] { $count } verwijzingen die door EndNote zijn gemaakt, worden binnengehaald als de tekst die ze tonen, en horen niet bij de gevonden verwijzingen: wat EndNote over de werken zegt, kon niet worden gelezen.
}
core-import-document-bookmarks = { $count ->
    [one] Het document bewaart { $count } verwijzing in een bladwijzer, en waarnaar ze verwijst kon niet worden gelezen: ze is tekst zoals ze er staat. Zotero bewaart ze anders als zijn documentvoorkeuren dat zeggen.
   *[other] Het document bewaart { $count } verwijzingen in bladwijzers, en waarnaar ze verwijzen kon niet worden gelezen: ze zijn tekst zoals ze er staan. Zotero bewaart ze anders als zijn documentvoorkeuren dat zeggen.
}
core-import-document-bibliography = Het document heeft een lijst van wat het citeert, onder ‘{ $heading }’. Die wordt als tekst binnengehaald, net als de rest. De mindmap maakt een eigen bibliografie van wat erin wordt geciteerd.
core-import-document-bibliography-made = Het document heeft een lijst van wat het citeert, gemaakt door het programma dat zijn referenties bijhoudt. Die wordt als tekst binnengehaald, net als de rest. De mindmap maakt een eigen bibliografie van wat erin wordt geciteerd.
core-import-document-tracked = Het document heeft bijgehouden wijzigingen. De tekst wordt binnengehaald zoals hij is wanneer die alle worden aanvaard.
core-import-document-comments = Het document heeft opmerkingen in de marge; die worden weggelaten.
core-import-document-heading-notes = { $count ->
    [one] Een noot bij een kop staat aan het begin van de tekst eronder: een kop kan geen noot hebben.
   *[other] { $count } noten bij koppen staan aan het begin van de tekst eronder: een kop kan geen noot hebben.
}
# What a caption began with is shown as the document has it: “Figure 1:”.
core-import-document-labels = { $count ->
    [one] { $count } bijschrift begon met een woord en een nummer, zoals ‘{ $first }’. Dat is weggelaten: de mindmap nummert haar figuren en tabellen zelf. Waar de tekst er een bij zijn nummer noemt, is dat tekst zoals ze is geschreven, en volgt ze de nummers van de mindmap niet.
   *[other] { $count } bijschriften begonnen met een woord en een nummer, zoals ‘{ $first }’. Die zijn weggelaten: de mindmap nummert haar figuren en tabellen zelf. Waar de tekst er een bij zijn nummer noemt, is dat tekst zoals ze is geschreven, en volgt ze de nummers van de mindmap niet.
}
core-import-document-label-example = Figuur 1:
core-import-document-caption-notes = { $count ->
    [one] Een noot in wat over een figuur of tabel wordt gezegd, staat daar tussen haakjes.
   *[other] { $count } noten in wat over figuren of tabellen wordt gezegd, staan daar tussen haakjes.
}
core-import-document-headings = { $count ->
    [one] { $count } kop in een citaat, een lijst of een tabel wordt binnengehaald als een vette alinea.
   *[other] { $count } koppen in een citaat, een lijst of een tabel worden binnengehaald als een vette alinea.
}
core-import-document-code = { $count ->
    [one] { $count } blok code wordt binnengehaald als gewone alinea's, een per regel.
   *[other] { $count } blokken code worden binnengehaald als gewone alinea's, een per regel.
}
core-import-document-definitions = { $count ->
    [one] { $count } lijst van termen met wat ze betekenen wordt binnengehaald als alinea's, met de termen vet.
   *[other] { $count } lijsten van termen met wat ze betekenen worden binnengehaald als alinea's, met de termen vet.
}
core-import-document-rules = { $count ->
    [one] { $count } lijn over de pagina is weggelaten.
   *[other] { $count } lijnen over de pagina zijn weggelaten.
}
core-import-document-raw = { $count ->
    [one] { $count } stuk dat in HTML of TeX voor dat ene soort document alleen is geschreven, is weggelaten.
   *[other] { $count } stukken die in HTML of TeX voor dat ene soort document alleen zijn geschreven, zijn weggelaten.
}
core-import-document-pictures-wanting = { $count ->
    [one] { $count } afbeelding in het bestand staat niet in de tekst die is gelezen, en is weggelaten. Ze kan in de kop- of voettekst van de pagina's staan, of in een tekening.
   *[other] { $count } afbeeldingen in het bestand staan niet in de tekst die is gelezen, en zijn weggelaten. Ze kunnen in de kop- of voettekst van de pagina's staan, of in een tekening.
}

## A picture of a document that is left out, and why.

core-import-document-picture-left-out = De afbeelding ‘{ $name }’ is weggelaten: { $why }.
core-import-document-picture-kind = ze is van een soort die niet wordt gelezen ({ $kind })
core-import-document-picture-not-read = het is geen afbeelding van een soort die wordt gelezen
core-import-document-picture-unreadable = ze kon niet worden gelezen
core-import-document-picture-network = ze staat op het netwerk, en daar wordt niets opgehaald
core-import-document-picture-not-taken-out = ze kon niet uit het bestand worden gehaald
core-import-document-picture-outside = ze staat niet in het bestand, maar elders op deze computer, en wordt daar niet vandaan gehaald
core-import-document-picture-not-found = het bestand is niet gevonden waar het document zegt dat het staat
core-import-document-picture-too-large = ze is groter dan 50 MB
core-import-document-picture-file-unreadable = het bestand kon niet worden gelezen
