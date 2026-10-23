# A project: its view, the bar over the map, what is done to elements, and
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
project-name = Namnet på prosjektet
project-rename = Gi prosjektet nytt namn
project-not-saved = Ikkje lagra
project-redo = Gjer om
project-view-this = Vising av dette kartet
project-diagram = Diagram
project-text = Tekst
project-one-at-a-time = Eitt om gongen
project-side-by-side = To side om side
project-close-side = Lukk denne sida
project-references = Referansar
project-side-map = Kart
project-between-maps = Mellom dei to karta

## When the sharing ends from the other side

project-unshared = Prosjektet er ikkje lenger delt
project-unshared-this = Dette prosjektet er ikkje lenger delt
project-left-out = Du er ikkje lenger med i samarbeidet
project-unshared-unfetched = Det var ikkje henta enno, så ingenting av det er på denne datamaskina.
project-unshared-not-removed = Prosjektet var ikkje henta, og kunne ikkje takast bort frå lista over prosjekt
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

## The bar over the map: where one is, and what is done with the element in view

# The name of an element that has none.
project-untitled = Utan namn
project-where = Kvar du er
# The tooltip of the crumb of the parent of the element in view, in the path over a side.
project-up-hint = Opp til «{ $name }» · Alt+Shift+Pil opp
# The small round button by the element in view, in the diagram and the text: up to the element over it.
project-leave-map = Opp til «{ $name }»
# The owl before the name of the project itself, in the first pane: up to all the projects.
# The sign of a project, read aloud, where it is shared.
project-badge-shared = { $name }, delt av deg
project-badge-joined = { $name }, som du har blitt med i
# Two projects side by side.
project-beside-failed = Prosjektet kunne ikkje opnast ved sida av dette
project-beside-no-comments = Kommentarane høyrer til prosjektet du opna: opne det andre for seg sjølv for å kommentere i det
# A template of the writer's own was saved anew, and the copy of it the project carries could not be made afresh.
project-template-not-renewed = Kopien prosjektet har av malen, kunne ikkje oppdaterast
# Said over the other pane while elements of one project are dragged over it.
project-copy-to-project = Kopier til «{ $name }»
project-move-to-project = Flytt til «{ $name }»
project-document-into = Eit dokument inn i det …
project-drop-on-map = Slepp på eit kart for å flytte dit · hald Ctrl for å kopiere
project-open-beside = Opne ved sida av
project-open-beside-hint = To kart side om side, for å flytte element mellom dei
project-side-by-side-short = Side om side
# The count is of those found in the element in view, and under it.
project-found-hint = { $count } å gå gjennom og gjere til kjeldetilvisingar
project-copied-to = Kopiert til «{ $name }»
project-moved-to = Flytta til «{ $name }»
project-other-projects = Andre prosjekt
project-send-failed = Kunne ikkje skrive i «{ $project }». Ingenting vart endra her.
project-send-no-element = Elementet er ikkje lenger i det prosjektet.

## What is done to elements, in the diagram and in the text

project-add-under = Legg til eit element under
project-add = Legg til eit element
project-add-after = Legg til eit element etter
project-write-text = Skriv teksten
project-associate = Knyt til …
project-associate-hint = Klikk så på det andre elementet
project-heading = Skriv ut namnet som overskrift
project-heading-hint = Av: namnet er ein merkelapp for deg; berre teksten blir skriven ut
project-leave-out = Utelat frå dokumentet
project-leave-out-hint = Med alt som står under
# An element that stands for another element: in the document, that element is in its place.
project-stands-for = Står for «{ $name }»
project-stand-for = La det stå for eit anna element
project-stand-for-heading = I dokumentet tek elementet du vel, plassen til dette
project-stand-for-none = Ingen
# Copying or moving elements to the project itself, to one of its trees, or to another project.
project-copy-to = Kopier til
project-cut = Klipp ut
project-cut-not-removed = Det som vart klipt ut, vart lima inn, men kunne ikkje takast bort frå prosjektet det kom frå
project-copy = Kopier
# Pasting what was copied under the element the menu is of.
project-paste-under = Lim inn under
project-move-to = Flytt til
# Opening a dialog with the tree of the project, to choose where the elements go: first in Copy to and Move to.
project-choose-where = Vel kvar …
# Opening the same dialog, to choose the element this one stands for.
project-choose-element = Vel eit element …
# The title of the dialog that chooses where elements are copied to: the name of the one copied, or how many.
project-pick-copy-title = { $count ->
    [one] Kopier «{ $name }» til
   *[other] Kopier { $count } element til
}
project-pick-move-title = { $count ->
    [one] Flytt «{ $name }» til
   *[other] Flytt { $count } element til
}
project-pick-stand-title = Kva «{ $name }» står for
# The buttons of the dialog, saying what will be done with the element chosen.
project-pick-copy = Kopier hit
project-pick-move = Flytt hit
project-pick-stand = Stå for dette
project-pick-find = Finn eit element etter namn
project-pick-none = Ingen element har det namnet
# Why an element cannot be chosen, when it is hovered.
project-pick-itself = Eit element kan ikkje leggjast i seg sjølv eller i det som står under det
project-pick-self = Eit element kan ikkje stå for seg sjølv
project-pick-loop = Dokumentet ville innehalde seg sjølv
project-tidy-branch = Rydd i denne greina
project-place-automatically = Plasser automatisk
project-delete-keeping = Slett, men hald på det som står under
project-itself-stays = Sjølve prosjektet blir ståande
project-itself-stays-detail = Slett prosjektet frå prosjektsida.
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
project-stands-for-map = Står for «{ $name }»
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

## A copy and its original.
copy-title = Kopien og originalen
copy-from = Kopiert frå «{ $name }»
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
copy-copied-from = Kopiert frå «{ $name }»
copy-copied-from-changed = Kopiert frå «{ $name }», som er endra sidan

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
