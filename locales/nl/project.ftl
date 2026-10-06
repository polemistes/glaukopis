# A project: its view, the tabs of its maps, what is done to elements, and
# the panels at the side with the references and the pictures.

project-list-unreadable = De projecten konden niet worden gelezen

## The view of a project

project-open-failed = Het project kon niet worden geopend
# Shown under the words above when nothing more is known of why.
project-open-failed-detail = Het project kon niet worden geopend.
project-back = Terug naar de projecten
project-fetching = Het project wordt opgehaald
project-fetching-offline = De server kan niet worden bereikt. Het project wordt opgehaald zodra dat kan.
project-fetching-on-the-way = Het is onderweg van de server.
project-all-projects = Alle projecten
project-name = Naam van het project
project-rename = Het project hernoemen
project-not-saved = Niet opgeslagen
project-redo = Opnieuw
project-view = Weergave van de mindmap
project-view-this = Weergave van deze mindmap
project-diagram = Diagram
project-text = Tekst
project-one-at-a-time = Eén tegelijk
project-side-by-side = Twee naast elkaar
project-close-side = Deze kant sluiten
project-references = Referenties
project-pictures = Afbeeldingen
project-side = Referenties, afbeeldingen, geschiedenis en wijzigingen
project-side-tabs = Wat het zijpaneel toont
project-side-map = Mindmap
project-preview = Voorbeeld en exporteren
project-share = Delen
project-shared = Gedeeld
project-shared-offline = Gedeeld · de server kan niet worden bereikt
project-shared-too-large = Gedeeld · de server neemt de laatste wijzigingen niet aan
project-between-maps = Tussen de twee mindmaps
project-between-preview = Tussen de mindmap en het voorbeeld
project-between-pictures = Tussen de mindmap en de afbeeldingen
project-between-references = Tussen de mindmap en de referenties

## When the sharing ends from the other side

project-unshared = Het project wordt niet meer gedeeld
project-unshared-this = Dit project wordt niet meer gedeeld
project-left-out = Je hoort niet meer bij de medewerkers
project-unshared-unfetched = Het was nog niet opgehaald, dus er is niets van op deze computer.
project-unshared-kept = Degene die het deelde, heeft het van de server gehaald. Je houdt het project zoals het nu is, en kunt er zelf aan verder werken.
project-left-out-kept = Je houdt het project zoals het nu is, en kunt er zelf aan verder werken. Wat de anderen hierna schrijven, bereikt je niet.
project-understood = Begrepen

## Files dropped on the project

project-drop-picture = Laat een afbeelding vallen op het element waar ze bij hoort
project-cited-in = { $count ->
    [one] De referentie wordt geciteerd in ‘{ $name }’
   *[other] { $count } referenties worden geciteerd in ‘{ $name }’
}
# As above, where the element has no name.
project-cited-in-element = { $count ->
    [one] De referentie wordt geciteerd in ‘het element’
   *[other] { $count } referenties worden geciteerd in ‘het element’
}

## The tabs of the maps

# The name of a map, or of an element, that has none.
project-untitled = Zonder titel
# The name of a copy of a map.
project-map-copy = { $name }, kopie
project-maps = Mindmaps
project-map-name = Naam van de mindmap
project-new-map = Nieuwe mindmap
project-map-from-document = Een mindmap uit een document…
project-drop-on-map = Laat vallen op een mindmap om ernaartoe te verplaatsen · houd Ctrl ingedrukt om te kopiëren
project-duplicate = Dupliceren
project-duplicate-hint = Een kopie om aan te werken; deze blijft zoals ze is
project-open-beside = Ernaast openen
project-open-beside-hint = Twee mindmaps naast elkaar, om elementen ertussen te verplaatsen
project-this-map-actions = Deze mindmap, en de mindmaps
project-maps-hint = De mindmaps van het project: kies er een om ze te openen
project-map-beside = naast deze
project-side-by-side-short = Naast elkaar
project-preview-short = Voorbeeld
project-found = Gevonden verwijzingen…
# The count is of those found in the map.
project-found-hint = { $count } om door te nemen en verwijzingen van te maken
project-found-none = En tekst die op verwijzingen lijkt
project-delete-map = Mindmap wissen
project-delete-map-title = De mindmap ‘{ $name }’ wissen?
project-delete-map-message = { $count ->
    [one] { $count } element en de tekst erin verdwijnen. Dit kan ongedaan worden gemaakt zolang het project open is.
   *[other] { $count } elementen en de tekst erin verdwijnen. Dit kan ongedaan worden gemaakt zolang het project open is.
}
project-copied-to = Gekopieerd naar ‘{ $name }’
project-moved-to = Verplaatst naar ‘{ $name }’

## What is done to elements, in the diagram and in the text

project-add-under = Een element eronder toevoegen
project-add = Een element toevoegen
project-add-after = Een element erna toevoegen
project-write-text = De tekst schrijven
project-double-click = Dubbelklik
project-associate = Verbinden met…
project-associate-hint = Klik daarna op het andere element
project-heading = De naam als kop drukken
project-heading-hint = Uit: de naam is een label voor jou; alleen de tekst wordt gedrukt
project-leave-out = Uit het document weglaten
project-leave-out-hint = Met alles eronder
# An element that stands for another map: in the document, that map is in its place.
project-stands-for = Staat voor ‘{ $name }’
project-stand-for = Voor een andere mindmap staan
project-stand-for-heading = In het document neemt deze mindmap zijn plaats in
project-stand-for-none = Geen
project-copy-to-map = Kopiëren naar mindmap
project-copy = Kopiëren
# Pasting what was copied under the element the menu is of.
project-paste-under = Eronder plakken
project-move-to-map = Verplaatsen naar mindmap
project-map-from-branch = Nieuwe mindmap van deze tak
project-map-from-branch-hint = Een kopie om aan te werken; deze blijft
project-detach = Losmaken van zijn ouder
project-detach-hint = Een los element, om later te plaatsen
project-tidy-branch = Deze tak opruimen
project-place-automatically = Automatisch plaatsen
project-delete-keeping = Wissen, met behoud van wat eronder staat
project-centre-stays = De kern van een mindmap blijft
project-centre-stays-detail = Wis de mindmap zelf vanaf haar tabblad.
# One element was deleted, with the elements that were under it.
project-deleted = { $under ->
    [0] ‘{ $name }’ is gewist
    [one] ‘{ $name }’ is gewist, met { $under } element eronder
   *[other] ‘{ $name }’ is gewist, met { $under } elementen eronder
}
project-deleted-many = { $count ->
    [one] { $count } element gewist
   *[other] { $count } elementen gewist
}

project-delete-busy-title = Iemand schrijft hier
# $names: those who are at what would be deleted, as a list.
project-delete-busy-message = { $names } { $count ->
    [one] is
   *[other] zijn
} aan het werk in wat gewist zou worden. Wat daar nu wordt geschreven, zou ermee verloren gaan en kan niet worden teruggehaald.
project-delete-busy-confirm = Toch wissen

## An element, open for writing, and as it is shown when the pointer rests on it

project-element = Element
project-name-placeholder = Naam
project-write-here = Schrijf hier. Typ @ om te citeren.
project-words = { $count ->
    [one] { $count } woord
   *[other] { $count } woorden
}
project-read-on = Dubbelklik om verder te lezen
project-stands-for-map = Staat voor de mindmap ‘{ $name }’
project-name-not-printed = De naam wordt niet gedrukt
project-left-out-of-document = Uit het document weggelaten

## The panels at the side: the references and the pictures

project-this-map = Deze mindmap
project-project = Project
project-library = Bibliotheek
project-nothing-found = Niets gevonden
project-edit-reference = De referentie bewerken…
project-new-reference = Nieuwe referentie
project-import-file = Een bestand importeren
project-which-references = Welke referenties
project-search-references = Referenties zoeken
project-library-empty = Je bibliotheek is leeg
project-library-empty-hint = Voeg een referentie toe, of importeer die je hebt.
project-no-references = Nog geen referenties
project-no-references-hint = Wat je tijdens het schrijven citeert, staat hier. Kies Citeren boven de tekst, of typ @, om te citeren.
project-cited-in-heading = Geciteerd in
project-not-cited = Niet geciteerd in dit project.
project-references-drag = Sleep een referentie in een tekst om haar daar te citeren, of op een element om haar aan het eind van zijn tekst te citeren.
# The count is of the references the project cites that the library lacks.
project-references-foreign = { $count ->
    [one] { $count } in dit project staat niet in je bibliotheek.
   *[other] { $count } in dit project staan niet in je bibliotheek.
}
# The store of pictures.
project-store = Beeldbank
project-open-picture = Openen…
project-put-into-text = In de tekst zetten
project-add-pictures = Afbeeldingen uit bestanden toevoegen
project-which-pictures = Welke afbeeldingen
project-search-pictures = Afbeeldingen zoeken
project-a-picture = Een afbeelding
project-with-notes = Met notities
project-not-on-computer = Niet op deze computer
project-nothing-said = Er is nog niets over gezegd
project-store-empty = De beeldbank is leeg
project-store-empty-hint = Voeg afbeeldingen uit bestanden toe, of laat ze op een tekst vallen.
project-no-pictures = Nog geen afbeeldingen
project-no-pictures-map = De afbeeldingen van de figuren van deze mindmap staan hier. Die van de beeldbank staan onder Beeldbank.
project-no-pictures-project = De afbeeldingen van de figuren van het project staan hier. Die van de beeldbank staan onder Beeldbank.
project-pictures-drag = Sleep een afbeelding in een tekst om er daar een figuur van te maken, of op een element om haar aan het eind van zijn tekst te zetten.
# The count is of the pictures that are used and are not in the store of this computer.
project-pictures-absent-map = { $count ->
    [one] { $count } in deze mindmap staat niet op deze computer.
   *[other] { $count } in deze mindmap staan niet op deze computer.
}
project-pictures-absent-project = { $count ->
    [one] { $count } in dit project staat niet op deze computer.
   *[other] { $count } in dit project staan niet op deze computer.
}

## Shared by the diagram and the text

# A count of elements that stands alone, as a label of what is dragged.
project-elements = { $count ->
    [one] { $count } element
   *[other] { $count } elementen
}
# One of the others who work on a shared project is at an element.
project-other-here = { $name } is hier
project-link-placeholder = Hoe ze samenhangen
project-link-label = Label van de verbinding

## A copy and its original, in another map.
copy-title = De kopie en haar origineel
copy-from = Gekopieerd van ‘{ $name }’ in de mindmap ‘{ $map }’
copy-original-changed = Het origineel is veranderd sinds het is gekopieerd, of sinds dat voor het laatst is bekeken.
copy-original-same = Het origineel is zoals het was toen het werd gekopieerd.
copy-original-unknown = Of het origineel is veranderd sinds het is gekopieerd, is niet bekend: de kopie is gemaakt voordat dat werd bijgehouden.
copy-original-gone = Het origineel is er niet meer.
copy-how-shown = Hieronder staat doorgehaald wat alleen het origineel heeft, en gemarkeerd wat alleen deze kopie heeft.
copy-alike = Hun namen en teksten zijn gelijk. Ze kunnen verschillen in wat geen woorden zijn: verwijzingen, afbeeldingen, opmaak.
copy-only-original = Alleen in het origineel
copy-only-copy = Alleen in deze kopie
copy-go = Naar het origineel gaan
copy-seen = Deze kopie houden zoals ze is
copy-take = De naam en tekst van het origineel overnemen
copy-changed-mark = Het origineel is veranderd sinds dit is gekopieerd
copy-compare = Vergelijken met het origineel…
copy-copied-from = Gekopieerd van ‘{ $name }’ in ‘{ $map }’
copy-copied-from-changed = Gekopieerd van ‘{ $name }’ in ‘{ $map }’, dat sindsdien is veranderd

## How far the writing of an element has come, as its writer says.
status = Status
status-idea = Idee
status-draft = Concept
status-done = Klaar
status-none = Geen status
# Of an element, where its status is shown: "Draft · 340 words".
status-of = { $status } · { $count ->
    [one] { $count } woord
   *[other] { $count } woorden
}
status-count-idea = { $count ->
    [one] { $count } idee
   *[other] { $count } ideeën
}
status-count-draft = { $count ->
    [one] { $count } concept
   *[other] { $count } concepten
}
status-count-done = { $count } klaar
# The words of the drafts and of what is done, in a map.
status-words-written = { $count ->
    [one] { $count } woord geschreven
   *[other] { $count } woorden geschreven
}
status-progress = Hoe ver de mindmap is
