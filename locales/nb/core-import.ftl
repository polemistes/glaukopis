# Det kjernen sier om referanser som hentes inn utenfra, på bokmål.
# Se locales/README.md.

## Hvor referansene kom fra, slik listen over dem sier det: «3 referanser i innlimt tekst».

core-import-pasted = innlimt tekst
core-import-files = { $count ->
    [one] { $count } fil
   *[other] { $count } filer
}

## Filer med BibTeX og BibLaTeX.

core-import-file-not-found = Filen «{ $name }» ble ikke funnet.
core-import-empty-entry = Linje { $line }: oppføringen «{ $key }» er tom og ble utelatt.
core-import-origin-line = linje { $line }
core-import-origin-key-line = { $key }, linje { $line }

## Det som gikk galt da referansene ble tatt inn, hver etter referansen det gjelder.

core-import-title = «{ $title }»
core-import-merge-gone = { $reference }: oppføringen den skulle slås sammen med, finnes ikke lenger

## PDF-filer.

core-import-not-a-pdf = { $name } er ikke en PDF.
core-import-details-from = Opplysningene er hentet fra { $service }.
core-import-number-unknown = Et nummer ble funnet i filen, men databasene vet ingenting om det; opplysningene er hentet fra selve filen og bør kontrolleres.
core-import-databases-failed = Databasene kunne ikke spørres ({ $error }); opplysningene er hentet fra selve filen og bør kontrolleres.

## Zotero.

core-import-zotero-my-library = Mitt bibliotek
core-import-zotero-group = Gruppe { $id }
core-import-zotero-the-library = biblioteket { $id } i Zotero
core-import-zotero-own-library = ditt eget bibliotek i Zotero
core-import-zotero-the-collection = samlingen { $key } i Zotero
core-import-zotero-unknown-base = Filen «{ $name }» ble ikke funnet. Zotero lenker til den fra en mappe Zotero har valgt selv, og som ikke er kjent her.
core-import-zotero-empty-item = Elementet { $key } i Zotero er tomt og ble utelatt.
core-import-zotero-alone = { $count ->
    [one] { $count } fil eller notat i Zotero hører ikke til noen referanse, og ble utelatt.
   *[other] { $count } filer og notater i Zotero hører ikke til noen referanse, og ble utelatt.
}
core-import-zotero-not-a-field = Zotero oppgir { $name } som { $role }, men BibLaTeX har ikke noe felt for det. Navnet ble utelatt.
core-import-zotero-left-out = Zotero-feltet «{ $field }» har ikke noe motstykke i BibLaTeX og ble utelatt: { $value }

## Databasen til Zotero.

core-import-zotero-no-database = en Zotero-database ({ $file }) i { $path }
core-import-zotero-copying = kunne ikke kopiere { $path } til en midlertidig mappe
core-import-zotero-empty = filen er tom
core-import-zotero-disturbed = Zotero skrev til databasen sin mens den ble lest. Hvis noe mangler, lukk Zotero og importer på nytt.
core-import-zotero-backup-read = Databasen til Zotero kunne ikke leses ({ $error }). Sikkerhetskopien, { $backup }, ble lest i stedet: det som er endret i Zotero etter at sikkerhetskopien ble tatt, mangler.
core-import-zotero-not-a-database = { $path } er ikke en Zotero-database.
core-import-zotero-unreadable = Zotero-databasen har en form som ikke kan leses her: { $what }. Hvis den ble skrevet av en gammel versjon av Zotero, blir den oppdatert når den åpnes én gang i en nyere versjon.
core-import-zotero-unreadable-version = Zotero-databasen har en form som ikke kan leses her (versjon { $version } av Zoteros database): { $what }. Hvis den ble skrevet av en gammel versjon av Zotero, blir den oppdatert når den åpnes én gang i en nyere versjon.
core-import-zotero-no-table = tabellen «{ $table }» mangler
core-import-zotero-no-column = tabellen «{ $table }» har ingen kolonne «{ $column }»
core-import-zotero-no-optional = Zotero-databasen har ingen tabell «{ $table }» i den formen som er kjent her: { $consequence }.
core-import-zotero-no-bin = elementer i papirkurven til Zotero kan ikke skilles fra de andre
core-import-zotero-no-collections = samlingene ble ikke lest
core-import-zotero-no-attachments = vedlagte filer ble ikke lest
core-import-zotero-no-notes = notatene ble ikke lest
core-import-zotero-no-keywords = nøkkelordene ble ikke lest
core-import-zotero-no-group-names = navnene på gruppebibliotekene er ikke kjent

## PDF-filer, slik de leses for en referanse.

core-import-pdf-empty = Filen «{ $name }» er tom.
core-import-pdf-not-a-pdf = Filen «{ $name }» er ikke en PDF.
core-import-pdf-unreadable = Filen kunne ikke leses: den er skadet, beskyttet med passord eller for stor.
core-import-pdf-scan = Filen har ikke noe tekstlag: den er skannet.
core-import-pdf-from-file = Opplysningene er hentet fra selve filen, ikke fra en katalog, og bør kontrolleres.
core-import-pdf-from-metadata = Ingen DOI eller ISBN ble funnet i filen; opplysningene er hentet fra filens egne metadata og bør kontrolleres.
core-import-pdf-unknown = Ingen DOI eller ISBN ble funnet i filen, og metadataene sier ikke hva den er: opplysningene må fylles inn.

## Tabeller, fra tekstfiler og regneark.

core-import-table-too-large = Filen er på { $size } MB. En tabell leses fra en fil på høyst { $most } MB.
core-import-table-kinds = Tabeller leses fra CSV og annen tekst der verdiene er skilt med komma, semikolon eller tabulator, og fra arkene i LibreOffice (.ods) og Excel (.xlsx, .xls).
core-import-table-empty = Det står ingenting i filen.
core-import-table-rows = Tabellen har { $rows } rader. En tabell i en tekst kan ha høyst { $most }: den er ikke et regneark.
core-import-table-columns = Tabellen har { $columns } kolonner. En tabell i en tekst kan ha høyst { $most }: den er ikke et regneark.
core-import-table-more-than = mer enn { $count }

## Dokumenter som hentes inn for å bli kart.

core-import-document-stopped = Lesingen ble stoppet.
core-import-document-kind = «{ $file }» er ikke av en type som kan hentes inn som dokument. De som kan, er Word (DOCX), OpenDocument (ODT), Markdown, HTML, LaTeX, RTF, EPUB, Org, reStructuredText, Typst og ren tekst.
core-import-document-too-large = «{ $file }» er større enn 50 MB, og det er mer enn det som kan hentes inn som dokument.
core-import-document-unreadable = «{ $file }» kunne ikke leses som { $kind }. Filen kan være skadet, eller av en annen type enn navnet sier. Pandoc, som leser den, sa: { $message }
core-import-document-pandoc-unreadable = det Pandoc gjorde av «{ $file }», kunne ikke leses: { $error }
core-import-document-untitled = Uten navn
core-import-document-plain-text = ren tekst
core-import-document-notebook = Jupyter-notatbok

## Det den som henter inn et dokument, bør vite om det.

core-import-document-found = { $count ->
    [one] { $made ->
        [all] Det ble funnet én kildehenvisning som ennå ikke er knyttet til en referanse i biblioteket ditt, laget av et referanseprogram. Den står slik den ble skrevet, og kan gås gjennom når kartet lages, og senere.
       *[none] Det ble funnet én kildehenvisning som ennå ikke er knyttet til en referanse i biblioteket ditt. Den står slik den ble skrevet, og kan gås gjennom når kartet lages, og senere.
    }
   *[other] { $made ->
        [all] Det ble funnet { $count } kildehenvisninger som ennå ikke er knyttet til referanser i biblioteket ditt, alle laget av et referanseprogram. De står slik de ble skrevet, og kan gås gjennom når kartet lages, og senere.
        [some] Det ble funnet { $count } kildehenvisninger som ennå ikke er knyttet til referanser i biblioteket ditt, { $some } av dem laget av et referanseprogram. De står slik de ble skrevet, og kan gås gjennom når kartet lages, og senere.
       *[none] Det ble funnet { $count } kildehenvisninger som ennå ikke er knyttet til referanser i biblioteket ditt. De står slik de ble skrevet, og kan gås gjennom når kartet lages, og senere.
    }
}
core-import-document-endnote = { $count ->
    [one] Én kildehenvisning laget av EndNote er hentet inn som teksten den viser, og er ikke blant dem som ble funnet: det EndNote sier om verkene, kunne ikke leses.
   *[other] { $count } kildehenvisninger laget av EndNote er hentet inn som teksten de viser, og er ikke blant dem som ble funnet: det EndNote sier om verkene, kunne ikke leses.
}
core-import-document-bookmarks = { $count ->
    [one] Dokumentet har én kildehenvisning i et bokmerke, og det den viser til, kunne ikke leses: den står som tekst. Zotero lagrer dem på en annen måte når dokumentinnstillingene sier det.
   *[other] Dokumentet har { $count } kildehenvisninger i bokmerker, og det de viser til, kunne ikke leses: de står som tekst. Zotero lagrer dem på en annen måte når dokumentinnstillingene sier det.
}
core-import-document-bibliography = Dokumentet har en liste over det det viser til, under «{ $heading }». Den hentes inn som tekst, som resten. Kartet lager sin egen litteraturliste av det som vises til i det.
core-import-document-bibliography-made = Dokumentet har en liste over det det viser til, laget av programmet som holder orden på referansene. Den hentes inn som tekst, som resten. Kartet lager sin egen litteraturliste av det som vises til i det.
core-import-document-tracked = Dokumentet har sporede endringer. Teksten hentes inn slik den står når alle er godtatt.
core-import-document-comments = Dokumentet har kommentarer i margen, og de utelates.
core-import-document-heading-notes = { $count ->
    [one] En note til en overskrift står i begynnelsen av teksten under den: en overskrift kan ikke ha en note.
   *[other] { $count } noter til overskrifter står i begynnelsen av teksten under dem: en overskrift kan ikke ha en note.
}
core-import-document-labels = { $count ->
    [one] Én bildetekst begynte med et ord og et tall, som «{ $first }». Det er utelatt: kartet nummererer figurene og tabellene sine selv. Der teksten viser til en av dem med nummeret, er det tekst slik den ble skrevet, og det følger ikke nummerne i kartet.
   *[other] { $count } bildetekster begynte med et ord og et tall, som «{ $first }». Det er utelatt: kartet nummererer figurene og tabellene sine selv. Der teksten viser til en av dem med nummeret, er det tekst slik den ble skrevet, og det følger ikke nummerne i kartet.
}
core-import-document-label-example = Figur 1:
core-import-document-caption-notes = { $count ->
    [one] En note i det som sies om en figur eller en tabell, står der i parentes.
   *[other] { $count } noter i det som sies om figurer eller tabeller, står der i parentes.
}
core-import-document-headings = { $count ->
    [one] Én overskrift i et sitat, en liste eller en tabell er hentet inn som et avsnitt i fet skrift.
   *[other] { $count } overskrifter i et sitat, en liste eller en tabell er hentet inn som avsnitt i fet skrift.
}
core-import-document-code = { $count ->
    [one] Én kodeblokk er hentet inn som vanlige avsnitt, ett for hver linje.
   *[other] { $count } kodeblokker er hentet inn som vanlige avsnitt, ett for hver linje.
}
core-import-document-definitions = { $count ->
    [one] Én liste med begreper og hva de betyr, er hentet inn som avsnitt, med begrepene i fet skrift.
   *[other] { $count } lister med begreper og hva de betyr, er hentet inn som avsnitt, med begrepene i fet skrift.
}
core-import-document-rules = { $count ->
    [one] Én linje tvers over siden er utelatt.
   *[other] { $count } linjer tvers over siden er utelatt.
}
core-import-document-raw = { $count ->
    [one] Én bit skrevet i HTML eller TeX for bare én type dokument er utelatt.
   *[other] { $count } biter skrevet i HTML eller TeX for bare én type dokument er utelatt.
}
core-import-document-pictures-wanting = { $count ->
    [one] Ett bilde som filen inneholder, er ikke med i teksten som ble lest, og er utelatt. Det kan stå i toppteksten eller bunnteksten på sidene, eller i en tegning.
   *[other] { $count } bilder som filen inneholder, er ikke med i teksten som ble lest, og er utelatt. De kan stå i toppteksten eller bunnteksten på sidene, eller i en tegning.
}

## Et bilde i et dokument som er utelatt, og hvorfor.

core-import-document-picture-left-out = Bildet «{ $name }» er utelatt: { $why }.
core-import-document-picture-kind = det er av en type som ikke leses ({ $kind })
core-import-document-picture-not-read = det er ikke et bilde av en type som leses
core-import-document-picture-unreadable = det kunne ikke leses
core-import-document-picture-network = det ligger på nettet, og ingenting hentes derfra
core-import-document-picture-not-taken-out = det kunne ikke tas ut av filen
core-import-document-picture-not-found = filen ble ikke funnet der dokumentet sier den er
core-import-document-picture-too-large = det er større enn 50 MB
core-import-document-picture-file-unreadable = filen kunne ikke leses
