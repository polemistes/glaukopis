# A project: its view, the tabs of its maps, what is done to elements, and
# the panels at the side with the references and the pictures.

project-list-unreadable = Prosjekta kunne ikkje lesast

## The view of a project

project-open-failed = Prosjektet kunne ikkje opnast
# Shown under the words above when nothing more is known of why.
project-open-failed-detail = Prosjektet kunne ikkje opnast.
project-back = Tilbake til prosjekta
project-fetching = Hentar prosjektet
project-fetching-offline = Tenaren kan ikkje nåast. Prosjektet blir henta når det lèt seg gjere.
project-fetching-on-the-way = Det er på veg frå tenaren.
project-all-projects = Alle prosjekt
project-name = Namnet på prosjektet
project-rename = Gi prosjektet nytt namn
project-not-saved = Ikkje lagra
project-redo = Gjer om
project-view = Vising av kartet
project-view-this = Vising av dette kartet
project-diagram = Diagram
project-text = Tekst
project-one-at-a-time = Eitt om gongen
project-side-by-side = To side om side
project-close-side = Lukk denne sida
project-references = Referansar
project-pictures = Bilete
project-side = Referansar, bilete, historikk og endringar
project-side-tabs = Kva sidepanelet viser
project-side-map = Kart
project-preview = Førehandsvising og eksport
project-share = Del
project-shared = Delt
project-shared-offline = Delt · tenaren kan ikkje nåast
project-shared-too-large = Delt · tenaren tek ikkje imot dei siste endringane
project-between-maps = Mellom dei to karta
project-between-preview = Mellom kartet og førehandsvisinga
project-between-pictures = Mellom kartet og bileta
project-between-references = Mellom kartet og referansane

## When the sharing ends from the other side

project-unshared = Prosjektet er ikkje lenger delt
project-unshared-this = Dette prosjektet er ikkje lenger delt
project-left-out = Du er ikkje lenger med i samarbeidet
project-unshared-unfetched = Det var ikkje henta enno, så ingenting av det er på denne datamaskina.
project-unshared-kept = Den som delte det, har teke det bort frå tenaren. Du held på prosjektet slik det er no, og kan arbeide vidare med det på eiga hand.
project-left-out-kept = Du held på prosjektet slik det er no, og kan arbeide vidare med det på eiga hand. Det dei andre skriv etter dette, når ikkje fram til deg.
project-understood = Forstått

## Files dropped on the project

project-drop-picture = Slepp biletet på elementet det høyrer til
project-cited-in = { $count ->
    [one] Det er vist til referansen i «{ $name }»
   *[other] Det er vist til { $count } referansar i «{ $name }»
}
# As above, where the element has no name.
project-cited-in-element = { $count ->
    [one] Det er vist til referansen i elementet
   *[other] Det er vist til { $count } referansar i elementet
}

## The tabs of the maps

# The name of a map, or of an element, that has none.
project-untitled = Utan namn
# The name of a copy of a map.
project-map-copy = { $name }, kopi
project-maps = Kart
project-map-name = Namnet på kartet
project-new-map = Nytt kart
project-map-from-document = Eit kart frå eit dokument …
project-drop-on-map = Slepp på eit kart for å flytte dit · hald Ctrl for å kopiere
project-duplicate = Lag ein kopi
project-duplicate-hint = Ein kopi å arbeide vidare med; dette kartet blir som det er
project-open-beside = Opne ved sida av
project-open-beside-hint = To kart side om side, for å flytte element mellom dei
project-this-map-actions = Dette kartet, og karta
project-maps-hint = Karta i prosjektet: vel eitt for å opne det
project-map-beside = ved sida av dette
project-side-by-side-short = Side om side
project-preview-short = Førehandsvising
project-found = Funne kjeldetilvisingar …
# The count is of those found in the map.
project-found-hint = { $count } å gå gjennom og gjere til kjeldetilvisingar
project-found-none = Og tekst som ser ut som kjeldetilvisingar
project-delete-map = Slett kartet
project-delete-map-title = Slette kartet «{ $name }»?
project-delete-map-message = { $count ->
    [one] { $count } element og teksten i det forsvinn. Dette kan angrast så lenge prosjektet er ope.
   *[other] { $count } element og teksten i dei forsvinn. Dette kan angrast så lenge prosjektet er ope.
}
project-copied-to = Kopiert til «{ $name }»
project-moved-to = Flytta til «{ $name }»

## What is done to elements, in the diagram and in the text

project-add-under = Legg til eit element under
project-add = Legg til eit element
project-add-after = Legg til eit element etter
project-write-text = Skriv teksten
project-double-click = Dobbeltklikk
project-associate = Knyt til …
project-associate-hint = Klikk så på det andre elementet
project-heading = Skriv ut namnet som overskrift
project-heading-hint = Av: namnet er ein merkelapp for deg; berre teksten blir skriven ut
project-leave-out = Utelat frå dokumentet
project-leave-out-hint = Med alt som står under
# An element that stands for another map: in the document, that map is in its place.
project-stands-for = Står for «{ $name }»
project-stand-for = La det stå for eit anna kart
project-stand-for-heading = I dokumentet tek kartet plassen til elementet
project-stand-for-none = Ingen
project-copy-to-map = Kopier til kart
project-copy = Kopier
# Pasting what was copied under the element the menu is of.
project-paste-under = Lim inn under
project-move-to-map = Flytt til kart
project-map-from-branch = Nytt kart av denne greina
project-map-from-branch-hint = Ein kopi å arbeide vidare med; greina blir ståande
project-detach = Løys frå elementet over
project-detach-hint = Eit laust element, som kan plasserast seinare
project-tidy-branch = Rydd i denne greina
project-place-automatically = Plasser automatisk
project-delete-keeping = Slett, men hald på det som står under
project-centre-stays = Midten av eit kart blir ståande
project-centre-stays-detail = Slett sjølve kartet frå fana.
# One element was deleted, with the elements that were under it.
project-deleted = { $under ->
    [0] «{ $name }» vart sletta
    [one] «{ $name }» vart sletta, saman med { $under } element under det
   *[other] «{ $name }» vart sletta, saman med { $under } element under det
}
project-deleted-many = { $count ->
    [one] { $count } element vart sletta
   *[other] { $count } element vart sletta
}

project-delete-busy-title = Nokon skriv her
# $names: those who are at what would be deleted, as a list.
project-delete-busy-message = { $names } { $count ->
    [one] arbeider
   *[other] arbeider
} i det som ville bli sletta. Det som blir skrive der no, ville gå tapt saman med det, og kan ikkje hentast tilbake.
project-delete-busy-confirm = Slett likevel

## An element, open for writing, and as it is shown when the pointer rests on it

project-element = Element
project-name-placeholder = Namn
project-write-here = Skriv her. Skriv @ for å vise til ei kjelde.
project-words = { $count ->
    [one] { $count } ord
   *[other] { $count } ord
}
project-read-on = Dobbeltklikk for å lese vidare
project-stands-for-map = Står for kartet «{ $name }»
project-name-not-printed = Namnet blir ikkje skrive ut
project-left-out-of-document = Utelate frå dokumentet

## The panels at the side: the references and the pictures

project-this-map = Dette kartet
project-project = Prosjekt
project-library = Bibliotek
project-nothing-found = Ingenting funne
project-edit-reference = Rediger referansen …
project-new-reference = Ny referanse
project-import-file = Importer ei fil
project-which-references = Kva referansar
project-search-references = Søk i referansane
project-library-empty = Biblioteket ditt er tomt
project-library-empty-hint = Legg til ein referanse, eller importer dei du har.
project-no-references = Ingen referansar enno
project-no-references-hint = Det du viser til medan du skriv, står her. For å vise til ei kjelde, vel Vis til over teksten, eller skriv @.
project-cited-in-heading = Sitert i
project-not-cited = Ikkje sitert i dette prosjektet.
project-references-drag = Dra ein referanse inn i ein tekst for å vise til den der, eller til eit element for å vise til den på slutten av teksten.
# The count is of the references the project cites that the library lacks.
project-references-foreign = { $count ->
    [one] { $count } i dette prosjektet er ikkje i biblioteket ditt.
   *[other] { $count } i dette prosjektet er ikkje i biblioteket ditt.
}
# The store of pictures.
project-store = Biletlager
project-open-picture = Opne …
project-put-into-text = Set det inn i teksten
project-add-pictures = Legg til bilete frå filer
project-which-pictures = Kva bilete
project-search-pictures = Søk i bileta
project-a-picture = Eit bilete
project-with-notes = Med notat
project-not-on-computer = Ikkje på denne datamaskina
project-nothing-said = Ingenting er skrive om det enno
project-store-empty = Biletlageret er tomt
project-store-empty-hint = Legg til bilete frå filer, eller slepp dei på ein tekst.
project-no-pictures = Ingen bilete enno
project-no-pictures-map = Bileta i figurane i dette kartet står her. Bileta i biletlageret står under Biletlager.
project-no-pictures-project = Bileta i figurane i prosjektet står her. Bileta i biletlageret står under Biletlager.
project-pictures-drag = Dra eit bilete inn i ein tekst for å lage ein figur av det der, eller til eit element for å setje det inn på slutten av teksten.
# The count is of the pictures that are used and are not in the store of this computer.
project-pictures-absent-map = { $count ->
    [one] { $count } i dette kartet er ikkje på denne datamaskina.
   *[other] { $count } i dette kartet er ikkje på denne datamaskina.
}
project-pictures-absent-project = { $count ->
    [one] { $count } i dette prosjektet er ikkje på denne datamaskina.
   *[other] { $count } i dette prosjektet er ikkje på denne datamaskina.
}

## Shared by the diagram and the text

# A count of elements that stands alone, as a label of what is dragged.
project-elements = { $count ->
    [one] { $count } element
   *[other] { $count } element
}
# One of the others who work on a shared project is at an element.
project-other-here = { $name } er her
project-link-placeholder = Korleis dei heng saman
project-link-label = Merkelapp på assosiasjonen

## A copy and its original, in another map.
copy-title = Kopien og originalen
copy-from = Kopiert frå «{ $name }» i kartet «{ $map }»
copy-original-changed = Originalen er endra sidan den vart kopiert, eller sidan det sist vart sett.
copy-original-same = Originalen er som den var då den vart kopiert.
copy-original-unknown = Om originalen er endra sidan den vart kopiert, er ikkje kjent: kopien vart laga før det vart teke vare på.
copy-original-gone = Originalen finst ikkje lenger.
copy-how-shown = Nedanfor står det berre originalen har, gjennomstreka, og det berre denne kopien har, merkt.
copy-alike = Namna og tekstane er like. Dei kan vere ulike i det som ikkje er ord: kjeldetilvisingar, bilete, merke.
copy-only-original = Berre i originalen
copy-only-copy = Berre i denne kopien
copy-go = Gå til originalen
copy-seen = Hald på kopien som den er
copy-take = Ta over namnet og teksten til originalen
copy-changed-mark = Originalen er endra sidan dette vart kopiert
copy-compare = Samanlikn med originalen …
copy-copied-from = Kopiert frå «{ $name }» i «{ $map }»
copy-copied-from-changed = Kopiert frå «{ $name }» i «{ $map }», som er endra sidan

## How far the writing of an element has come, as its writer says.
status = Status
status-idea = Idé
status-draft = Utkast
status-done = Ferdig
status-none = Ingen status
# Of an element, where its status is shown: "Draft · 340 words".
status-of = { $status } · { $count ->
    [one] { $count } ord
   *[other] { $count } ord
}
status-count-idea = { $count ->
    [one] { $count } idé
   *[other] { $count } idear
}
status-count-draft = { $count ->
    [one] { $count } utkast
   *[other] { $count } utkast
}
status-count-done = { $count } ferdig
# The words of the drafts and of what is done, in a map.
status-words-written = { $count ->
    [one] { $count } ord skrive
   *[other] { $count } ord skrivne
}
status-progress = Kor langt kartet er kome
