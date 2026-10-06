# The editor of texts: the tools for writing, citations and notes.
# See locales/README.md.

## The marks and the kinds of paragraph, in the bar over a selection and in
## the tools over the text.

editor-format = Opmaak
editor-writing = Schrijven
editor-italic = Cursief
editor-bold = Vet
editor-small-capitals = Klein kapitaal
editor-superscript = Superscript
editor-subscript = Subscript
editor-struck = Doorgehaald
editor-quotation = Citaat
editor-block-quotation = Blokcitaat
editor-list = Lijst
editor-text = Tekst
editor-text-hint = Een alinea
editor-quotation-hint = Los van de tekst gezet
editor-list-hint = Met een teken voor elk punt
editor-numbered-list = Genummerde lijst
editor-numbered-list-hint = Met een nummer voor elk punt
editor-verse = Vers
editor-verse-hint = Regels poëzie of toneel, elk als regel bewaard
editor-speaker = Spreker
editor-speaker-hint = Wie spreekt, op een eigen regel
editor-direction = Regieaanwijzing
editor-direction-hint = Wat er gebeurt, cursief
editor-line-numbers = Regelnummers
editor-line-numbers-hint = De regels van dit vers nummeren: vanaf welke regel, en om de hoeveel
editor-line-numbers-from = De regels nummeren vanaf
editor-line-numbers-none = Leeg laten voor geen nummers
editor-line-numbers-every = Een nummer tonen om de
editor-line-numbers-number = Er wordt een geheel getal verwacht.
editor-kinds-text = Tekst
editor-kinds-quotation = Citaat
editor-kinds-verse = Vers
editor-kinds-script = Scenario
editor-kinds-more = Meer
editor-kinds-words = Woorden
editor-attribution = Bronvermelding
editor-attribution-hint = Van wie de woorden zijn, onder een citaat, rechts
editor-epigraph = Motto
editor-epigraph-hint = Een citaat aan het hoofd van een deel
editor-headword = Lemma
editor-headword-hint = Het woord dat een glossarium verklaart
editor-gloss = Verklaring
editor-gloss-hint = Wat het lemma betekent
editor-code = Code
editor-code-hint = Letter voor letter bewaard, in letters van gelijke breedte
editor-break = Scheiding
editor-break-hint = Een rust tussen delen, met het teken dat het formaat eraan geeft
editor-draft = Kladnotitie
editor-draft-hint = Alleen voor jezelf: komt in geen enkel document
editor-foreign = Anderstalige woorden
editor-foreign-hint = Woorden in een andere taal, waar de spelling zich naar richt
editor-title-of-work = Titel van een werk
editor-title-of-work-hint = De titel van een boek, een toneelstuk, een schilderij
editor-term = Term
editor-term-hint = Een term waar hij voor het eerst wordt gebruikt
editor-mention = Vermelding
editor-mention-hint = Een woord dat als woord wordt genoemd, tussen aanhalingstekens
editor-highlight = Markering
editor-highlight-hint = Voor het oog op het scherm: komt in geen enkel document
editor-underline = Onderstreept
editor-code-words = Code in de regel
editor-code-words-hint = Letters van gelijke breedte, binnen de regel
editor-scene = Scènekop
editor-scene-hint = INT. HUIS – NACHT
editor-action = Actie
editor-action-hint = Wat er wordt gezien en gedaan
editor-character = Personage
editor-character-hint = Wie spreekt, boven de dialoog
editor-dialogue = Dialoog
editor-dialogue-hint = Wat er wordt gezegd
editor-parenthetical = Aanwijzing
editor-parenthetical-hint = Hoe het wordt gezegd, tussen haakjes
editor-transition = Overgang
editor-transition-hint = CUT TO:, rechts
editor-comment = Opmerking
editor-comment-hint = Een opmerking bij wat is geselecteerd
editor-comment-element-hint = Een opmerking bij dit element; selecteer woorden om bij die een opmerking te maken
editor-parallel = Twee teksten naast elkaar
editor-parallel-hint = Een origineel en zijn vertaling, elk een eigen tekst
editor-paragraph-kind = Soort alinea
# Said of the button that shows the kind of paragraph the cursor is in.
editor-paragraph-kind-now = Soort alinea: { $kind }

## The kind menu: the kinds in hand, the whole catalogue under "More…", and
## the format that sets them at its foot. The words menu, with the kinds of
## words. And a kind of the writer's own, in its dialog.

editor-kinds-menu-more = Meer…
editor-kinds-in-hand = Soorten bij de hand
editor-kinds-own = Eigen soorten
editor-kinds-make = Een soort maken…
editor-kinds-change-own = Een eigen soort wijzigen…
# Over the item that opens the format editor: the format sets how each kind looks.
editor-kinds-set-by = Gezet zoals ‘{ $format }’ ze heeft
editor-kinds-change-format = Het formaat wijzigen…
editor-kinds-change-format-hint = Hoe elke soort in dit document wordt gezet
editor-words = Woorden
editor-words-hint = Onderstrepen, superscript, code; anderstalige woorden, de titel van een werk, een term
editor-words-make = Een soort woorden maken…
# Beside the language of the map, first among the languages foreign words may be in.
editor-foreign-of-map = De taal van de mindmap
# What a kind of words is based on when it is based on no kind in particular.
editor-plain-words = Gewone woorden
editor-own-kind-new = Een eigen soort
editor-own-kind-change = De soort wijzigen
editor-own-kind-name = Naam
editor-own-kind-name-placeholder = Brief, telegram, gebed…
editor-own-kind-words-placeholder = Scheepsnaam, Latijn, een sleutelwoord…
editor-own-kind-name-taken = Er is al een soort met die naam.
editor-own-kind-based-on = Gebaseerd op
editor-own-kind-based-on-hint = Wat hieronder niet wordt gezegd, is zoals deze soort het heeft
editor-own-kind-look = Waarin ze verschilt
editor-own-kind-create = Aanmaken
editor-own-kind-delete-title = De soort ‘{ $name }’ wissen?
editor-own-kind-delete-message = { $count ->
    [0] Er is geen tekst van deze soort.
    [one] Wat ervan in één element staat, blijft zoals het is, en wordt in documenten als tekst gezet.
   *[other] Wat ervan in { $count } elementen staat, blijft zoals het is, en wordt in documenten als tekst gezet.
}

## Citing, notes, and what is put into the text.

editor-cite = Citeren
editor-cite-here = Hier een werk citeren
editor-cite-at-cursor = Een werk citeren waar de cursor staat
editor-note = Noot
editor-note-selection = Van de selectie een noot maken
editor-note-hint = Een noot, onderaan de pagina of aan het eind
editor-insert = Invoegen
editor-insert-hint = Een afbeelding, een tabel, wiskunde, een kruisverwijzing
editor-new-element = Nieuw element
editor-new-element-hint = Een nieuw element na dit, of eronder
editor-new-after = Nieuw element na dit
editor-new-under = Nieuw element onder dit
editor-new-split = Hier splitsen
editor-new-split-hint = Wat na de cursor komt, wordt een nieuw element
editor-spelling-on = De spelling wordt gecontroleerd terwijl je schrijft · druk om te stoppen
editor-spelling-off = De spelling wordt niet gecontroleerd · druk om ze te controleren
editor-picture-file = Afbeelding uit een bestand…
editor-picture-file-hint = Een figuur, met wat erover wordt gezegd
editor-picture-store = Afbeelding uit de beeldbank…
editor-picture-store-hint = Die je hebt, worden opzij getoond
editor-equation = Vergelijking
editor-equation-hint = Wiskunde op een eigen regel
editor-table = Tabel…
editor-table-hint = Met zoveel rijen en kolommen
editor-table-file = Tabel uit een bestand…
editor-table-file-hint = CSV, of een werkblad van LibreOffice of Excel
editor-formula = Formule
editor-formula-hint = Wiskunde in de regel
editor-pointer = Kruisverwijzing…
editor-pointer-hint = Naar een figuur, een tabel, een vergelijking of een deel: ‘zie figuur 2’
# What a picture that was pasted without a name of its own is called in the store of pictures.
editor-pasted-picture = afbeelding

## More.

editor-found = Gevonden verwijzingen…
editor-found-count = { $count } om door te nemen en verwijzingen van te maken
editor-found-none = En tekst die op verwijzingen lijkt, in deze mindmap

## Choosing a work to cite.

editor-picker = Kies een referentie
editor-picker-placeholder = Citeren: auteur, titel, jaar
editor-picker-search = Referenties zoeken
editor-picker-results = Referenties
editor-picker-in-project = In dit project
editor-picker-recent = Onlangs toegevoegd
editor-picker-empty = Je bibliotheek is leeg.
editor-picker-no-match = Niets in je bibliotheek bevat deze woorden.
editor-picker-type = Typ om in je bibliotheek te zoeken.
editor-picker-new = Nieuwe referentie…
editor-picker-import = Importeren…

## A citation, and each work in it.

editor-citation = Verwijzing
editor-citation-add = Een werk toevoegen
editor-citation-add-purpose = Een werk aan de verwijzing toevoegen
editor-citation-in-text = Auteur in de tekst: Nagy (1979)
editor-citation-remove = De verwijzing verwijderen
editor-citation-split = De woorden van de verwijzing scheiden
editor-citation-split-hint = De woorden ervoor en erna worden tekst van de regel, en elk werk een eigen verwijzing, met zijn pagina en niets anders
editor-citation-not-in-library = Deze referentie staat niet in je bibliotheek.
editor-citation-edit-reference = De referentie bewerken
editor-citation-before = Ervoor
editor-citation-before-placeholder = zie, vgl.
editor-citation-after = Erna
editor-citation-after-placeholder = en passim
editor-citation-locator-kind = Soort vindplaats
editor-citation-suppress-author = De auteur wordt in mijn zin genoemd: geef alleen het jaar
editor-citation-remove-work = Dit werk verwijderen
# Stands in the text in place of a citation of a work that is in neither the library nor the project.
editor-citation-missing = [referentie niet gevonden]
# Stands in the text in place of a citation of no work.
editor-citation-empty = (verwijzing)

## The kinds of place in a work a citation can point to, as the menu of a
## citation names them.

editor-locator-page = Pagina
editor-locator-chapter = Hoofdstuk
editor-locator-section = Paragraaf
editor-locator-paragraph = Alinea
editor-locator-line = Regel
editor-locator-verse = Vers
editor-locator-book = Boek
editor-locator-volume = Deel
editor-locator-part = Gedeelte
editor-locator-column = Kolom
editor-locator-folio = Folio
editor-locator-figure = Figuur
editor-locator-note = Noot
editor-locator-number = Nummer
editor-locator-sub-verbo = Sub verbo

## A note, in the panel it is written in.

# The number is that of the note, or a letter for a note that stands in a place of its own.
editor-note-numbered = Noot { $number }
editor-note-place = Waar de noot staat
editor-note-place-format = Waar het formaat zijn noten heeft
editor-note-place-foot = Onderaan de pagina
editor-note-place-end = Aan het eind van de tekst
editor-note-placeholder = De tekst van de noot
