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
