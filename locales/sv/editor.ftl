# The editor of texts: the tools for writing, citations and notes.
# See locales/README.md.

## The marks and the kinds of paragraph, in the bar over a selection and in
## the tools over the text.

editor-format = Format
editor-writing = Skrivning
editor-italic = Kursiv
editor-bold = Fet
editor-small-capitals = Kapitäler
editor-superscript = Upphöjd
editor-subscript = Nedsänkt
editor-struck = Genomstruken
editor-quotation = Citat
editor-block-quotation = Blockcitat
editor-list = Lista
editor-text = Text
editor-text-hint = Ett stycke
editor-quotation-hint = Någon annans ord, avskilda från texten
editor-list-hint = En punkt i en lista; ett indrag gör en lista i listan
editor-numbered-list = Numrerad lista
editor-numbered-list-hint = En numrerad punkt i en lista; ett indrag gör en lista i listan
editor-verse = Vers
editor-verse-hint = En rad ur poesi, drama eller en utskrift, bevarad som rad
editor-speaker = Talare
editor-speaker-hint = Vem som talar: på en egen rad, eller som ord inne i en rad
editor-direction = Scenanvisning
editor-direction-hint = Vad som görs på scenen: på en egen rad, eller som ord inne i en rad
editor-line-numbers-from = Numrera från
editor-line-numbers-every = Visa ett nummer var
editor-line-numbers-number = Ett helt tal behövs.
editor-line-number = Dess nummer eller beteckning
editor-line-number-placeholder = Räknas som de andra
editor-line-number-held = Räknas, och visas inte i dokumentet. Tryck för att ge den ett eget nummer.
# How the lines of a stretch are numbered: see ADR 0041.
editor-numbering = Numrering
editor-numbering-none = Inte numrerade
editor-numbering-counted = Räknade från det första nummer som anges
editor-numbering-given = Bara de nummer som anges
editor-line-numbers-every-layout = Som layouten: var { $every }:e
editor-line-numbers-side = Numren till
editor-side-layout = Den sida layouten anger ({ $side })
editor-side-left = Vänster
editor-side-right = Höger
# Over a number in the margin of the text, which opens a field for it when pressed.
editor-line-number-press = Den här radens nummer: tryck för att ändra det

## Numbers belong to what they number (ADR 0041): the Numbers menu offers
## the three, each saying what it numbers.

## The bracket at the left of paragraphs of one kind standing together (a
## run), named by the kind; its menu says what is said of them.
# After the name of the kind, where the lines of the run are numbered: "Verse · numbered".
editor-bracket-numbered = numrerad
editor-run-label-hint = { $kind } · tryck för det som sägs om de här styckena
editor-run-select = Markera de här styckena
editor-run-to-text = Gör det till text
editor-run-begin = Börja en ny följd här
editor-run-join = Foga ihop med följden före
editor-kinds-text = Text
editor-kinds-quotation = Citat
editor-kinds-verse = Vers
editor-kinds-script = Manus
editor-kinds-list = Lista
editor-kinds-more = Mer
editor-kinds-words = Ord
editor-attribution = Källa
editor-attribution-hint = Vems ord ett citat är
editor-epigraph = Motto
editor-epigraph-hint = Ett citat i början av en del
editor-headword = Uppslagsord
editor-headword-hint = Ordet som en ordlista förklarar
editor-gloss = Förklaring
editor-gloss-hint = Vad uppslagsordet betyder
editor-code = Kod
editor-code-hint = En rad kod, eller av något som bevaras bokstav för bokstav
editor-break = Avdelare
editor-break-hint = En paus mellan delar, med det tecken layouten ger den
editor-draft = Arbetsanteckning
editor-draft-hint = För dina ögon: den hamnar inte i något dokument
editor-foreign = Främmande ord
editor-foreign-hint = Ord på ett annat språk, som stavningen rättar sig efter
editor-title-of-work = Verktitel
editor-title-of-work-hint = Titeln på en bok, en pjäs, en målning
editor-term = Term
editor-term-hint = En term där den används första gången
editor-mention = Omnämnande
editor-mention-hint = Ett ord talat om som ord, inom citationstecken
editor-highlight = Överstrykning
editor-highlight-hint = För ögat på skärmen: den hamnar inte i något dokument
editor-underline = Understruken
editor-code-words = Kod i raden
editor-scene = Scenrubrik
editor-scene-hint = Var och när en scen utspelar sig: INT. HUS – NATT
editor-action = Handling
editor-action-hint = Vad som syns och görs
editor-character = Rollfigur
editor-character-hint = Vem som säger repliken som följer
editor-dialogue = Dialog
editor-dialogue-hint = Vad som sägs
editor-parenthetical = Parentes
editor-parenthetical-hint = Hur en replik sägs
editor-transition = Övergång
editor-transition-hint = Hur en scen går över i nästa: KLIPP TILL:
editor-comment = Kommentar
editor-parallel = Två texter sida vid sida
editor-page-break = Sidbrytning
editor-column-break = Spaltbrytning
editor-paragraph-kind = Slag av stycke
# Said of the button that shows the kind of paragraph the cursor is in.
editor-paragraph-kind-now = Slag av stycke: { $kind }

## The kind menu: the kinds written with those where the cursor is, the kinds at hand,
## the whole catalogue under "More…", and the layout that sets them at its foot.
## The words menu, with the kinds of words. And a kind of the writer's own, in its dialog.

editor-kinds-menu-more = Mer…
editor-kinds-mixed = Blandat
editor-kinds-own = Dina egna
editor-kinds-make = Skapa ett slag…
editor-kinds-change-own = Ändra ett eget slag…
# Over the item that opens the look of the document at the kind the cursor is in.
editor-kinds-set-by = Satta som ”{ $format }” har dem
editor-kinds-change-look = Hur ”{ $kind }” ser ut…
editor-words-make = Skapa ett slag av ord…
# Beside the language of the map, first among the languages foreign words may be in.
editor-foreign-of-text = Textens språk
# What a kind of words is based on when it is based on no kind in particular.
editor-plain-words = Vanliga ord
# The language of a passage, from a word to many paragraphs: it has no look of its own.
editor-language = Språk
editor-language-of-text = Textens eget språk
editor-language-other = Ett annat språk…
editor-language-other-title = Passagens språk
editor-language-tag = Språkkod
editor-language-no-tag = Det är ingen språkkod: en kod är till exempel ”grc”, ”la” eller ”de-CH”.
editor-language-unnamed = Ett språk som systemet inte har något namn för: koden behålls som den är skriven.
editor-language-suggested = Språk som ofta citeras
editor-language-other-hint = Passagen kontrolleras med ordlistan för sitt språk, där en är importerad, och lämnas i fred där ingen finns; ett dokument som görs anger språket för Word, OpenDocument, Typst och LaTeX.
editor-own-kind-new = Ett eget slag
editor-own-kind-change = Ändra slaget
editor-own-kind-name = Namn
editor-own-kind-name-placeholder = Brev, telegram, bön…
editor-own-kind-words-placeholder = Fartygsnamn, latin, ett nyckelord…
editor-own-kind-name-taken = Det finns redan ett slag med det namnet.
editor-own-kind-based-on = Bygger på
editor-own-kind-based-on-hint = Det som inte sägs nedan är som det här slaget har det
editor-own-kind-look = Hur det skiljer sig
editor-own-kind-create = Skapa
editor-own-kind-delete-title = Radera slaget ”{ $name }”?
editor-own-kind-delete-message = { $count ->
    [0] Ingen text är av det.
    [one] Det som är av det i ett element står kvar som det är, och sätts som text i dokument.
   *[other] Det som är av det i { $count } element står kvar som det är, och sätts som text i dokument.
}

## Citing, notes, and what is put into the text.

editor-cite-here = Hänvisa till ett verk här
editor-note = Not
editor-note-selection = Gör det markerade till en not
editor-insert = Infoga
editor-spelling-on = Stavningen kontrolleras medan du skriver · tryck för att sluta
editor-spelling-off = Stavningen kontrolleras inte · tryck för att kontrollera den
editor-equation = Ekvation
editor-table = Tabell…
editor-table-file = Tabell från en fil…
editor-formula = Formel
editor-pointer = Korshänvisning…
editor-refmark-title = Referensmärke
editor-refmark-label = Beteckning
editor-refmark-placeholder = 3:16, 327a, 1094a1
editor-refmark-dialog-hint = Märket är ingen del av orden: stavningen, sökningen och ordräkningen går förbi det. Layouten avgör om det sätts upphöjt i raden eller i marginalen.
# What a picture that was pasted without a name of its own is called in the store of pictures.
editor-pasted-picture = bild

## More.

editor-found = Lösa källhänvisningar…
editor-found-count = { $count } att gå igenom och göra till källhänvisningar
editor-found-none = Och text som ser ut som källhänvisningar, i den här kartan

## Choosing a work to cite.

editor-picker = Välj en referens
editor-picker-placeholder = Hänvisa: författare, titel, år
editor-picker-search = Sök referenser
editor-picker-results = Referenser
editor-picker-in-project = I det här projektet
editor-picker-recent = Nyligen tillagda
editor-picker-empty = Ditt bibliotek är tomt.
editor-picker-no-match = Inget i ditt bibliotek innehåller de här orden.
editor-picker-type = Skriv för att söka i ditt bibliotek.
editor-picker-new = Ny referens…
editor-picker-import = Importera…

## A citation, and each work in it.

editor-citation = Källhänvisning
editor-citation-add = Lägg till ett verk
editor-citation-add-purpose = Lägg till ett verk i källhänvisningen
editor-citation-in-text = Författaren i texten: Nagy (1979)
editor-citation-remove = Ta bort källhänvisningen
editor-citation-split = Skilj orden från källhänvisningen
editor-citation-split-hint = Orden före och efter blir text i raden, och varje verk en egen källhänvisning, med sin sida och inget annat
editor-citation-not-in-library = Den här referensen finns inte i ditt bibliotek.
editor-citation-edit-reference = Redigera referensen
editor-citation-before = Före
editor-citation-before-placeholder = se, jfr
editor-citation-after = Efter
editor-citation-after-placeholder = och passim
editor-citation-locator-kind = Slag av ställe
editor-citation-suppress-author = Författaren nämns i min mening: ange bara året
editor-citation-remove-work = Ta bort det här verket
# A reference was dropped where a citation cannot stand, and the cursor is in no such place either.
editor-citation-no-place = En källhänvisning kan inte stå där
# The project keeps a copy of every reference it cites; this one could not be read from the library.
editor-reference-not-kept = Referensen kunde inte sparas med projektet
# Stands in the text in place of a citation of a work that is in neither the library nor the project.
editor-citation-missing = [referensen hittades inte]
# Stands in the text in place of a citation of no work.
editor-citation-empty = (källhänvisning)

## The kinds of place in a work a citation can point to, as the menu of a
## citation names them.

editor-locator-page = Sida
editor-locator-chapter = Kapitel
editor-locator-section = Avsnitt
editor-locator-paragraph = Stycke
editor-locator-line = Rad
editor-locator-verse = Vers
editor-locator-book = Bok
editor-locator-volume = Band
editor-locator-part = Del
editor-locator-column = Spalt
editor-locator-folio = Folio
editor-locator-figure = Figur
editor-locator-note = Not
editor-locator-number = Nummer
editor-locator-sub-verbo = Sub verbo

## A note, in the panel it is written in.

# The number is that of the note, or a letter for a note that stands in a place of its own.
editor-note-numbered = Not { $number }
editor-note-place = Var noten står
editor-note-place-format = Där layouten har sina noter
editor-note-place-foot = Längst ner på sidan
editor-note-place-end = I slutet av texten
editor-note-placeholder = Notens text
