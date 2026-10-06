# Citations that were found in a text written elsewhere, and the panel at
# the side in which they are gone through (ADR 0015), in English. See
# locales/README.md.

## The panel.

found-title = Gevonden verwijzingen
# On the tab of the panel, beside the other tabs: short.
found-tab = Gevonden
found-between = Tussen de mindmap en de gevonden verwijzingen
found-taken = Wat voor verwijzingen wordt aangezien
found-taken-always = Wat een programma heeft gemaakt, en tags
found-taken-years = Haakjes met een jaartal erin
found-taken-named = Noten die een werk uit de bibliotheek noemen
found-taken-notes = Elke noot
found-asking = De bibliotheek wordt geraadpleegd…
found-make-certain = { $count ->
    [one] Van de zekere een verwijzing maken
   *[other] Van de { $count } zekere verwijzingen maken
}
found-made = { $count ->
    [one] Eén verwijzing is gemaakt
   *[other] { $count } verwijzingen zijn gemaakt
}
found-made-undo = Ctrl+Z neemt ze terug, als één stap.
found-library-failed = De bibliotheek kon niet worden geraadpleegd.
found-nothing = Niets om door te nemen
found-nothing-looked = In deze mindmap is geen gevonden verwijzing meer over, en niets erin lijkt op een verwijzing.
found-nothing-looked-more = In deze mindmap is geen gevonden verwijzing meer over, en niets erin lijkt op een verwijzing. Hierboven kan meer voor verwijzingen worden aangezien.
found-nothing-not-looked = In deze mindmap is geen gevonden verwijzing meer over. Tekst die alleen maar op een verwijzing lijkt, wordt gezocht wanneer je hierboven zegt wat ervoor moet worden aangezien: haakjes met een jaartal erin, of noten.
found-list-label = Wat er door te nemen is
found-untitled = Zonder titel
found-in-a-note = In een noot
# The element of the map a citation stands in.
found-in = In ‘{ $element }’
found-in-note-of = In een noot van ‘{ $element }’
# Set small and high after the words a note stands after.
found-note-mark = noot
found-position = { $index } van { $count }
found-previous = De vorige
found-next = De volgende
found-list-show = De lijst tonen
found-list-hide = De lijst verbergen
found-later = Later
found-leave = Als tekst laten
found-make = Er een verwijzing van maken

## How sure the library is of what it proposes.

found-sure-certain = De bibliotheek heeft het met zekerheid
found-sure-likely = De bibliotheek heeft wat het waarschijnlijk is
found-sure-possible = De bibliotheek heeft wat het kan zijn
found-sure-none = Een werk ervan heeft nog geen referentie

## By what a citation was found.

found-by-zotero = Gemaakt door Zotero
found-by-mendeley = Gemaakt door Mendeley, of een programma dat schrijft zoals Mendeley
found-by-key = Een tag die een referentie noemt
found-by-form = Voor een verwijzing aangezien om hoe ze eruitziet

## The citation that is to be made.

found-the-citation = De verwijzing
found-no-works = Ze noemt geen werk. Voeg er een toe, of laat haar de tekst die ze is.
found-add-work = Een werk toevoegen
found-author-in-text = Auteur in de tekst: Nagy (1979)
found-pick-work = Het werk dat wordt geciteerd: auteur, titel, jaar
found-pick-add = Een werk aan de verwijzing toevoegen
found-too-little = Het bestand zegt te weinig over dit werk om er een referentie van te maken
found-reference-failed = De referentie kon niet worden gemaakt

## A citation that stands in a note.

found-in-note = Ze staat in een noot
found-note-becomes = De noot wordt een verwijzing
# What the note says besides its works, which becomes the words before them, after them, or both.
found-note-around = Wat de noot verder zegt, komt voor en na haar werken{ $has ->
        [before] : ‘{ $before }’ ervoor
        [after] : ‘{ $after }’ erna
       *[both] : ‘{ $before }’ ervoor, ‘{ $after }’ erna
    }. De citeerstijl zet het in de regel of in een noot.
found-note-style = De citeerstijl zet het in de regel of in een noot.
found-citation-in-note = De verwijzing staat in de noot
    .hint = De noot blijft een noot, met wat ze verder zegt.
found-for-all = Zo voor alle volgende
found-note-not = Ze staat niet in een noot.
# What else the note holds, by the name of what it is in the text.
found-note-holds = De noot bevat { $what ->
        [math] een formule
        [crossref] een kruisverwijzing
        [citation] een verwijzing
        [hard_break] een tweede regel
       *[other] iets dat geen tekst is
    }, wat de woorden voor en na een werk niet kunnen bevatten.
found-note-another = De noot bevat nog een gevonden verwijzing, die verloren zou gaan in de woorden na deze.

## Why what was asked could not be done.

found-trouble-gone = Ze staat niet meer in de tekst.
found-trouble-changed = De tekst is hier veranderd sinds het voorstel, en is opnieuw bekeken.
found-trouble-cannot = Er kan hier geen verwijzing van worden gemaakt.

## One work of a citation, as the text says it is.

# Those who made it: “Nagy and Lord”, “Nagy et al.”
found-people-two = { $first } en { $second }
found-people-more = { $first } e.a.
found-work-a-work = Een werk
found-work-looking = { $work } wordt gezocht in je bibliotheek…
found-work-no-tag = { $work } is een tag die geen referentie in je bibliotheek heeft.
found-work-not-found = { $work } is niet gevonden in je bibliotheek.
found-work-chosen = Door jou gekozen
# The writer chose this reference for another citation of the same work, and this one followed.
found-work-followed = Zoals je voor hetzelfde werk hebt gekozen
found-work-certain = Zeker
found-work-likely = Waarschijnlijk
found-work-possible = Mogelijk
# What the text says the work is.
found-work-for = voor ‘{ $work }’
found-work-others = Andere referenties die het kunnen zijn
found-work-or = Of
found-work-may-be = Het kan zijn
found-work-another = Een andere…
found-work-find = Zoek het…
found-work-add = Aan de bibliotheek toevoegen
