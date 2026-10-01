# Et prosjekt: visningen av det, fanene til kartene, det som gjøres med
# elementer, og panelene ved siden av med referansene og bildene.

project-list-unreadable = Prosjektene kunne ikke leses

## Visningen av et prosjekt

project-open-failed = Prosjektet kunne ikke åpnes
project-open-failed-detail = Prosjektet kunne ikke åpnes.
project-back = Tilbake til prosjektene
project-fetching = Henter prosjektet
project-fetching-offline = Serveren kan ikke nås. Prosjektet hentes når det lar seg gjøre.
project-fetching-on-the-way = Det er på vei fra serveren.
project-all-projects = Alle prosjekter
project-name = Navnet på prosjektet
project-rename = Gi prosjektet nytt navn
project-not-saved = Ikke lagret
project-redo = Gjør om
project-view = Visning av kartet
project-view-this = Visning av dette kartet
project-diagram = Diagram
project-text = Tekst
project-one-at-a-time = Ett om gangen
project-side-by-side = To side om side
project-close-side = Lukk denne siden
project-references = Referanser
project-pictures = Bilder
project-side = Referanser, bilder, historikk og endringer
project-side-tabs = Hva sidepanelet viser
project-preview = Forhåndsvisning og eksport
project-share = Del
project-shared = Delt
project-shared-offline = Delt · serveren kan ikke nås
project-shared-too-large = Delt · serveren tar ikke imot de siste endringene
project-between-maps = Mellom de to kartene
project-between-preview = Mellom kartet og forhåndsvisningen
project-between-pictures = Mellom kartet og bildene
project-between-references = Mellom kartet og referansene

## Når delingen avsluttes fra den andre siden

project-unshared = Prosjektet er ikke lenger delt
project-unshared-this = Dette prosjektet er ikke lenger delt
project-left-out = Du er ikke lenger med i samarbeidet
project-unshared-unfetched = Det var ikke hentet ennå, så ingenting av det er på denne datamaskinen.
project-unshared-kept = Den som delte det, har tatt det bort fra serveren. Du beholder prosjektet slik det er nå, og kan arbeide videre med det på egen hånd.
project-left-out-kept = Du beholder prosjektet slik det er nå, og kan arbeide videre med det på egen hånd. Det de andre skriver etter dette, når ikke fram til deg.
project-understood = Forstått

## Filer som slippes på prosjektet

project-drop-picture = Slipp bildet på elementet det hører til
project-cited-in = { $count ->
    [one] Det er vist til referansen i «{ $name }»
   *[other] Det er vist til { $count } referanser i «{ $name }»
}
project-cited-in-element = { $count ->
    [one] Det er vist til referansen i elementet
   *[other] Det er vist til { $count } referanser i elementet
}

## Fanene til kartene

project-untitled = Uten navn
project-map-copy = { $name }, kopi
project-maps = Kart
project-map-name = Navnet på kartet
project-new-map = Nytt kart
project-map-from-document = Et kart fra et dokument …
project-drop-on-map = Slipp på et kart for å flytte dit · hold Ctrl for å kopiere
project-duplicate = Lag en kopi
project-duplicate-hint = En kopi å arbeide videre med; dette kartet blir som det er
project-open-beside = Åpne ved siden av
project-open-beside-hint = To kart side om side, for å flytte elementer mellom dem
project-maps-hint = Kartene i prosjektet, og hva som kan gjøres med dette
project-map-label = Kart
project-map-beside = ved siden av dette
project-map-menu = Dette kartet: { $name }
project-map-earlier = Flytt tidligere
project-map-later = Flytt senere
project-side-by-side-short = Side om side
project-preview-short = Forhåndsvisning
project-found = Funne kildehenvisninger …
project-found-hint = { $count } å gå gjennom og gjøre om til kildehenvisninger
project-found-none = Og tekst som ser ut som kildehenvisninger
project-delete-map = Slett kartet
project-delete-map-title = Slette kartet «{ $name }»?
project-delete-map-message = { $count ->
    [one] { $count } element og teksten i det forsvinner. Dette kan angres så lenge prosjektet er åpent.
   *[other] { $count } elementer og teksten i dem forsvinner. Dette kan angres så lenge prosjektet er åpent.
}
project-copied-to = Kopiert til «{ $name }»
project-moved-to = Flyttet til «{ $name }»

## Det som gjøres med elementer, i diagrammet og i teksten

project-add-under = Legg til et element under
project-add = Legg til et element
project-add-after = Legg til et element etter
project-write-text = Skriv teksten
project-double-click = Dobbeltklikk
project-associate = Knytt til …
project-associate-hint = Klikk så på det andre elementet
project-heading = Skriv ut navnet som overskrift
project-heading-hint = Av: navnet er en merkelapp for deg; bare teksten skrives ut
project-leave-out = Utelat fra dokumentet
project-leave-out-hint = Med alt som står under
project-stands-for = Står for «{ $name }»
project-stand-for = La det stå for et annet kart
project-stand-for-heading = I dokumentet tar kartet elementets plass
project-stand-for-none = Ingen
project-copy-to-map = Kopier til kart
project-move-to-map = Flytt til kart
project-map-from-branch = Nytt kart av denne grenen
project-map-from-branch-hint = En kopi å arbeide videre med; grenen blir stående
project-detach = Løsne fra elementet over
project-detach-hint = Et løst element, som kan plasseres senere
project-tidy-branch = Rydd i denne grenen
project-place-automatically = Plasser automatisk
project-delete-keeping = Slett, men behold det som står under
project-centre-stays = Midten av et kart blir stående
project-centre-stays-detail = Slett selve kartet fra fanen.
project-deleted = { $under ->
    [0] «{ $name }» ble slettet
    [one] «{ $name }» ble slettet, sammen med { $under } element under det
   *[other] «{ $name }» ble slettet, sammen med { $under } elementer under det
}
project-deleted-many = { $count ->
    [one] { $count } element ble slettet
   *[other] { $count } elementer ble slettet
}

project-delete-busy-title = Noen skriver her
# $names: de som er i det som ville bli slettet, som en liste.
project-delete-busy-message = { $names } { $count ->
    [one] arbeider
   *[other] arbeider
} i det som ville bli slettet. Det som skrives der nå, ville gå tapt sammen med det, og kan ikke hentes tilbake.
project-delete-busy-confirm = Slett likevel

## Et element, åpent for skriving, og slik det vises når pekeren hviler på det

project-element = Element
project-name-placeholder = Navn
project-write-here = Skriv her. Skriv @ for å henvise til en kilde.
project-words = { $count } ord
project-read-on = Dobbeltklikk for å lese videre
project-stands-for-map = Står for kartet «{ $name }»
project-name-not-printed = Navnet skrives ikke ut
project-left-out-of-document = Utelatt fra dokumentet

## Panelene ved siden av: referansene og bildene

project-this-map = Dette kartet
project-project = Prosjekt
project-library = Bibliotek
project-nothing-found = Ingenting funnet
project-edit-reference = Rediger referansen …
project-new-reference = Ny referanse
project-import-file = Importer en fil
project-which-references = Hvilke referanser
project-search-references = Søk i referansene
project-library-empty = Biblioteket ditt er tomt
project-library-empty-hint = Legg til en referanse, eller importer dem du har.
project-no-references = Ingen referanser ennå
project-no-references-hint = Det du viser til mens du skriver, står her. For å vise til en kilde, velg Henvis over teksten, eller skriv @.
project-cited-in-heading = Sitert i
project-not-cited = Ikke sitert i dette prosjektet.
project-references-drag = Dra en referanse inn i en tekst for å henvise til den der, eller til et element for å henvise til den på slutten av teksten.
project-references-foreign = { $count } i dette prosjektet er ikke i biblioteket ditt.
project-store = Bildelager
project-open-picture = Åpne …
project-put-into-text = Sett det inn i teksten
project-add-pictures = Legg til bilder fra filer
project-which-pictures = Hvilke bilder
project-search-pictures = Søk i bildene
project-a-picture = Et bilde
project-with-notes = Med notater
project-not-on-computer = Ikke på denne datamaskinen
project-nothing-said = Ingenting er skrevet om det ennå
project-store-empty = Bildelageret er tomt
project-store-empty-hint = Legg til bilder fra filer, eller slipp dem på en tekst.
project-no-pictures = Ingen bilder ennå
project-no-pictures-map = Bildene i figurene i dette kartet står her. Bildene i bildelageret står under Bildelager.
project-no-pictures-project = Bildene i figurene i prosjektet står her. Bildene i bildelageret står under Bildelager.
project-pictures-drag = Dra et bilde inn i en tekst for å lage en figur av det der, eller til et element for å sette det inn på slutten av teksten.
project-pictures-absent-map = { $count } i dette kartet er ikke på denne datamaskinen.
project-pictures-absent-project = { $count } i dette prosjektet er ikke på denne datamaskinen.

## Felles for diagrammet og teksten

project-elements = { $count ->
    [one] { $count } element
   *[other] { $count } elementer
}
project-other-here = { $name } er her
project-link-placeholder = Hvordan de henger sammen
project-link-label = Merkelapp på assosiasjonen

## En kopi og originalen, i et annet kart.
copy-title = Kopien og originalen
copy-from = Kopiert fra «{ $name }» i kartet «{ $map }»
copy-original-changed = Originalen er endret siden den ble kopiert, eller siden det sist ble sett.
copy-original-same = Originalen er som den var da den ble kopiert.
copy-original-unknown = Om originalen er endret siden den ble kopiert, vites ikke: kopien ble laget før det ble tatt vare på.
copy-original-gone = Originalen finnes ikke lenger.
copy-how-shown = Nedenfor står det bare originalen har, strøket over, og det bare denne kopien har, markert.
copy-alike = Navnene og tekstene er like. De kan være ulike i det som ikke er ord: kildehenvisninger, bilder, merker.
copy-only-original = Bare i originalen
copy-only-copy = Bare i denne kopien
copy-go = Gå til originalen
copy-seen = Behold kopien som den er
copy-take = Ta over originalens navn og tekst
copy-changed-mark = Originalen er endret siden dette ble kopiert
copy-compare = Sammenlign med originalen …
copy-copied-from = Kopiert fra «{ $name }» i «{ $map }»
copy-copied-from-changed = Kopiert fra «{ $name }» i «{ $map }», som er endret siden

## Hvor langt skrivingen av et element er kommet, slik den som skriver sier.
status = Status
status-idea = Idé
status-draft = Utkast
status-done = Ferdig
status-none = Ingen status
status-of = { $status } · { $count } ord
status-count-idea = { $count ->
    [one] { $count } idé
   *[other] { $count } idéer
}
status-count-draft = { $count } utkast
status-count-done = { $count } ferdig
status-words-written = { $count } ord skrevet
status-progress = Hvor langt kartet er kommet
