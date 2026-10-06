# The editor of texts: the tools for writing, citations and notes.
# See locales/README.md.

## The marks and the kinds of paragraph, in the bar over a selection and in
## the tools over the text.

editor-format = Formatering
editor-writing = Skrivning
editor-italic = Kursiv
editor-bold = Fed
editor-small-capitals = Kapitæler
editor-superscript = Hævet skrift
editor-subscript = Sænket skrift
editor-struck = Gennemstreget
editor-quotation = Citat
editor-block-quotation = Blokcitat
editor-list = Liste
editor-text = Tekst
editor-text-hint = Et afsnit
editor-quotation-hint = Sat for sig, adskilt fra teksten
editor-list-hint = Med et tegn foran hvert punkt
editor-numbered-list = Nummereret liste
editor-numbered-list-hint = Med et tal foran hvert punkt
editor-verse = Vers
editor-verse-hint = Linjer af digt eller drama, hver bevaret som en linje
editor-speaker = Taler
editor-speaker-hint = Hvem der taler, på en linje for sig
editor-direction = Regibemærkning
editor-direction-hint = Det, der gøres, i kursiv
editor-line-numbers = Linjenumre
editor-line-numbers-hint = Nummerer linjerne i dette vers: fra hvilken linje, og for hver hvor mange
editor-line-numbers-from = Nummerer linjerne fra
editor-line-numbers-none = Lad stå tomt for ingen numre
editor-line-numbers-every = Vis et nummer for hver
editor-line-numbers-number = Der skal stå et helt tal.
editor-kinds-text = Tekst
editor-kinds-quotation = Citat
editor-kinds-verse = Vers
editor-kinds-script = Manus
editor-kinds-more = Mere
editor-kinds-words = Ord
editor-attribution = Kildeangivelse
editor-attribution-hint = Hvis ord det er, under et citat, til højre
editor-epigraph = Epigraf
editor-epigraph-hint = Et citat i begyndelsen af en del
editor-headword = Opslagsord
editor-headword-hint = Det ord, en ordliste forklarer
editor-gloss = Forklaring
editor-gloss-hint = Hvad opslagsordet betyder
editor-code = Kode
editor-code-hint = Bevaret bogstav for bogstav, med bogstaver af samme bredde
editor-break = Skille
editor-break-hint = En pause mellem dele, med det tegn formatet giver den
editor-draft = Arbejdsnotat
editor-draft-hint = Kun for dine øjne: det kommer ikke med i noget dokument
editor-foreign = Andet sprog
editor-foreign-hint = Ord på et andet sprog, som stavningen følger
editor-title-of-work = Titel på et værk
editor-title-of-work-hint = Titlen på en bog, et skuespil, et maleri
editor-term = Term
editor-term-hint = En term, hvor den bruges første gang
editor-mention = Omtalt ord
editor-mention-hint = Et ord omtalt som ord, i anførselstegn
editor-highlight = Fremhævning
editor-highlight-hint = For øjet på skærmen: det kommer ikke med i noget dokument
editor-underline = Understreget
editor-code-words = Kode i linjen
editor-code-words-hint = Bogstaver af samme bredde, inde i linjen
editor-scene = Sceneoverskrift
editor-scene-hint = INT. HUS – NAT
editor-action = Handling
editor-action-hint = Det, der ses og gøres
editor-character = Rolle
editor-character-hint = Hvem der taler, over replikken
editor-dialogue = Replik
editor-dialogue-hint = Det, der siges
editor-parenthetical = Parentes
editor-parenthetical-hint = Hvordan det siges, i parentes
editor-transition = Overgang
editor-transition-hint = KLIP TIL:, til højre
editor-comment = Kommentar
editor-comment-hint = En kommentar til det markerede
editor-comment-element-hint = En kommentar til dette element; markér ord for at kommentere dem
editor-parallel = To tekster side om side
editor-parallel-hint = En original og dens oversættelse, hver sin tekst
editor-paragraph-kind = Afsnittets art
# Said of the button that shows the kind of paragraph the cursor is in.
editor-paragraph-kind-now = Afsnittets art: { $kind }

## The kind menu: the kinds in hand, the whole catalogue under "More…", and
## the format that sets them at its foot. The words menu, with the kinds of
## words. And a kind of the writer's own, in its dialog.

editor-kinds-menu-more = Mere…
editor-kinds-in-hand = Arter ved hånden
editor-kinds-own = Dine egne
editor-kinds-make = Lav en art…
editor-kinds-change-own = Ændr en af dine egne…
# Over the item that opens the format editor: the format sets how each kind looks.
editor-kinds-set-by = Sat, som »{ $format }« har dem
editor-kinds-change-format = Ændr formatet…
editor-kinds-change-format-hint = Hvordan hver art sættes i dette dokument
editor-words = Ord
editor-words-hint = Understregning, hævet skrift, kode; ord på et andet sprog, titlen på et værk, en term
editor-words-make = Lav en art ord…
# Beside the language of the map, first among the languages foreign words may be in.
editor-foreign-of-map = Kortets sprog
# What a kind of words is based on when it is based on no kind in particular.
editor-plain-words = Almindelige ord
editor-own-kind-new = En egen art
editor-own-kind-change = Ændr arten
editor-own-kind-name = Navn
editor-own-kind-name-placeholder = Brev, telegram, bøn…
editor-own-kind-words-placeholder = Skibsnavn, latin, et nøgleord…
editor-own-kind-name-taken = Der er allerede en art med det navn.
editor-own-kind-based-on = Bygger på
editor-own-kind-based-on-hint = Det, der ikke siges nedenfor, er som denne art har det
editor-own-kind-look = Hvordan den adskiller sig
editor-own-kind-create = Opret
editor-own-kind-delete-title = Slet arten »{ $name }«?
editor-own-kind-delete-message = { $count ->
    [0] Ingen tekst er af den.
    [one] Det, der er af den i ét element, bliver stående, som det er, og sættes som tekst i dokumenter.
   *[other] Det, der er af den i { $count } elementer, bliver stående, som det er, og sættes som tekst i dokumenter.
}

## Citing, notes, and what is put into the text.

editor-cite = Henvis
editor-cite-here = Henvis til et værk her
editor-cite-at-cursor = Henvis til et værk, hvor markøren står
editor-note = Note
editor-note-selection = Gør det markerede til en note
editor-note-hint = En note, nederst på siden eller til sidst
editor-insert = Indsæt
editor-insert-hint = Et billede, en tabel, matematik, en krydshenvisning
editor-new-element = Nyt element
editor-new-element-hint = Et nyt element efter dette, eller under det
editor-new-after = Nyt element efter dette
editor-new-under = Nyt element under dette
editor-new-split = Del her
editor-new-split-hint = Det, der følger efter markøren, bliver et nyt element
editor-spelling-on = Stavningen kontrolleres, mens du skriver · tryk for at stoppe
editor-spelling-off = Stavningen kontrolleres ikke · tryk for at kontrollere den
editor-picture-file = Billede fra en fil…
editor-picture-file-hint = En figur, med det, der siges om den
editor-picture-store = Billede fra billedlageret…
editor-picture-store-hint = Dem, du har, vises i siden
editor-equation = Ligning
editor-equation-hint = Matematik på en linje for sig
editor-table = Tabel…
editor-table-hint = Med så og så mange rækker og kolonner
editor-table-file = Tabel fra en fil…
editor-table-file-hint = CSV, eller et regneark fra LibreOffice eller Excel
editor-formula = Formel
editor-formula-hint = Matematik i linjen
editor-pointer = Krydshenvisning…
editor-pointer-hint = Til en figur, en tabel, en ligning eller en del: »se figur 2«
# What a picture that was pasted without a name of its own is called in the store of pictures.
editor-pasted-picture = billede

## More.

editor-found = Fundne kildehenvisninger…
editor-found-count = { $count } at gennemgå og gøre til kildehenvisninger
editor-found-none = Og tekst, der ligner kildehenvisninger, i dette kort

## Choosing a work to cite.

editor-picker = Vælg en reference
editor-picker-placeholder = Henvis til: forfatter, titel, år
editor-picker-search = Søg i referencerne
editor-picker-results = Referencer
editor-picker-in-project = I dette projekt
editor-picker-recent = Senest tilføjet
editor-picker-empty = Dit bibliotek er tomt.
editor-picker-no-match = Intet i dit bibliotek indeholder disse ord.
editor-picker-type = Skriv for at søge i dit bibliotek.
editor-picker-new = Ny reference…
editor-picker-import = Importer…

## A citation, and each work in it.

editor-citation = Kildehenvisning
editor-citation-add = Tilføj et værk
editor-citation-add-purpose = Tilføj et værk til kildehenvisningen
editor-citation-in-text = Forfatteren i teksten: Nagy (1979)
editor-citation-remove = Fjern kildehenvisningen
editor-citation-split = Skil ordene fra kildehenvisningen
editor-citation-split-hint = Ordene før og efter bliver tekst i linjen, og hvert værk en kildehenvisning for sig, med sin side og intet andet
editor-citation-not-in-library = Denne reference er ikke i dit bibliotek.
editor-citation-edit-reference = Rediger referencen
editor-citation-before = Før
editor-citation-before-placeholder = se, jf.
editor-citation-after = Efter
editor-citation-after-placeholder = og passim
editor-citation-locator-kind = Stedets art
editor-citation-suppress-author = Forfatteren nævnes i min sætning: giv kun årstallet
editor-citation-remove-work = Fjern dette værk
# Stands in the text in place of a citation of a work that is in neither the library nor the project.
editor-citation-missing = [referencen blev ikke fundet]
# Stands in the text in place of a citation of no work.
editor-citation-empty = (kildehenvisning)

## The kinds of place in a work a citation can point to, as the menu of a
## citation names them.

editor-locator-page = Side
editor-locator-chapter = Kapitel
editor-locator-section = Paragraf
editor-locator-paragraph = Afsnit
editor-locator-line = Linje
editor-locator-verse = Vers
editor-locator-book = Bog
editor-locator-volume = Bind
editor-locator-part = Del
editor-locator-column = Spalte
editor-locator-folio = Folio
editor-locator-figure = Figur
editor-locator-note = Note
editor-locator-number = Nummer
editor-locator-sub-verbo = Sub verbo

## A note, in the panel it is written in.

# The number is that of the note, or a letter for a note that stands in a place of its own.
editor-note-numbered = Note { $number }
editor-note-place = Hvor noten står
editor-note-place-format = Hvor formatet har sine noter
editor-note-place-foot = Nederst på siden
editor-note-place-end = Sidst i teksten
editor-note-placeholder = Notens tekst
