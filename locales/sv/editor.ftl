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
editor-quotation-hint = Avskilt från texten
editor-list-hint = Med ett tecken före varje punkt
editor-numbered-list = Numrerad lista
editor-numbered-list-hint = Med ett nummer före varje punkt
editor-verse = Vers
editor-verse-hint = Rader av poesi eller drama, var och en bevarad som rad
editor-speaker = Talare
editor-speaker-hint = Vem som talar, på en egen rad
editor-direction = Scenanvisning
editor-direction-hint = Vad som görs, i kursiv
editor-line-numbers = Radnummer
editor-line-numbers-hint = Numrera raderna i den här versen: från vilken rad, och var hur mångte
editor-line-numbers-from = Numrera raderna från
editor-line-numbers-none = Lämna tomt för inga nummer
editor-line-numbers-every = Visa ett nummer var
editor-line-numbers-number = Ett helt tal behövs.
editor-kinds-text = Text
editor-kinds-quotation = Citat
editor-kinds-verse = Vers
editor-kinds-script = Manus
editor-kinds-more = Mer
editor-kinds-words = Ord
editor-attribution = Källa
editor-attribution-hint = Vems ord det är, under ett citat, till höger
editor-epigraph = Motto
editor-epigraph-hint = Ett citat i början av en del
editor-headword = Uppslagsord
editor-headword-hint = Ordet som en ordlista förklarar
editor-gloss = Förklaring
editor-gloss-hint = Vad uppslagsordet betyder
editor-code = Kod
editor-code-hint = Bevarad bokstav för bokstav, med lika breda tecken
editor-break = Avdelare
editor-break-hint = En paus mellan delar, med det tecken formatet ger den
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
editor-code-words-hint = Lika breda tecken, inne i raden
editor-scene = Scenrubrik
editor-scene-hint = INT. HUS – NATT
editor-action = Handling
editor-action-hint = Vad som syns och görs
editor-character = Rollfigur
editor-character-hint = Vem som talar, över repliken
editor-dialogue = Dialog
editor-dialogue-hint = Vad som sägs
editor-parenthetical = Parentes
editor-parenthetical-hint = Hur det sägs, inom parentes
editor-transition = Övergång
editor-transition-hint = KLIPP TILL:, till höger
editor-comment = Kommentar
editor-comment-hint = En kommentar till det markerade
editor-comment-element-hint = En kommentar till det här elementet; markera ord för att kommentera dem
editor-parallel = Två texter sida vid sida
editor-parallel-hint = Ett original och dess översättning, var och en som egen text
editor-paragraph-kind = Slag av stycke
# Said of the button that shows the kind of paragraph the cursor is in.
editor-paragraph-kind-now = Slag av stycke: { $kind }

## The kind menu: the kinds in hand, the whole catalogue under "More…", and
## the format that sets them at its foot. The words menu, with the kinds of
## words. And a kind of the writer's own, in its dialog.

editor-kinds-menu-more = Mer…
editor-kinds-in-hand = Slag till hands
editor-kinds-own = Dina egna
editor-kinds-make = Skapa ett slag…
editor-kinds-change-own = Ändra ett eget slag…
# Over the item that opens the format editor: the format sets how each kind looks.
editor-kinds-set-by = Satta som ”{ $format }” har dem
editor-kinds-change-format = Ändra formatet…
editor-kinds-change-format-hint = Hur varje slag sätts i det här dokumentet
editor-words = Ord
editor-words-hint = Understrykning, upphöjt, kod; främmande ord, verktitel, term
editor-words-make = Skapa ett slag av ord…
# Beside the language of the map, first among the languages foreign words may be in.
editor-foreign-of-map = Kartans språk
# What a kind of words is based on when it is based on no kind in particular.
editor-plain-words = Vanliga ord
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

editor-cite = Hänvisa
editor-cite-here = Hänvisa till ett verk här
editor-cite-at-cursor = Hänvisa till ett verk där markören står
editor-note = Not
editor-note-selection = Gör det markerade till en not
editor-note-hint = En not, längst ner på sidan eller i slutet
editor-insert = Infoga
editor-insert-hint = En bild, en tabell, matematik, en korshänvisning
editor-new-element = Nytt element
editor-new-element-hint = Ett nytt element efter det här, eller under det
editor-new-after = Nytt element efter det här
editor-new-under = Nytt element under det här
editor-new-split = Dela här
editor-new-split-hint = Det som följer efter markören blir ett nytt element
editor-spelling-on = Stavningen kontrolleras medan du skriver · tryck för att sluta
editor-spelling-off = Stavningen kontrolleras inte · tryck för att kontrollera den
editor-picture-file = Bild från en fil…
editor-picture-file-hint = En figur, med det som sägs om den
editor-picture-store = Bild från förrådet…
editor-picture-store-hint = De du har visas vid sidan
editor-equation = Ekvation
editor-equation-hint = Matematik på en egen rad
editor-table = Tabell…
editor-table-hint = Med så och så många rader och kolumner
editor-table-file = Tabell från en fil…
editor-table-file-hint = CSV, eller ett kalkylblad från LibreOffice eller Excel
editor-formula = Formel
editor-formula-hint = Matematik i raden
editor-pointer = Korshänvisning…
editor-pointer-hint = Till en figur, en tabell, en ekvation eller en del: ”se figur 2”
# What a picture that was pasted without a name of its own is called in the store of pictures.
editor-pasted-picture = bild

## More.

editor-found = Hittade källhänvisningar…
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
editor-note-place-format = Där formatet har sina noter
editor-note-place-foot = Längst ner på sidan
editor-note-place-end = I slutet av texten
editor-note-placeholder = Notens text
