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
editor-quotation-hint = En andens ord, adskilt fra teksten
editor-list-hint = Et punkt i en liste; en indrykning laver en liste i listen
editor-numbered-list = Nummereret liste
editor-numbered-list-hint = Et punkt i en nummereret liste; en indrykning laver en liste i listen
editor-verse = Vers
editor-verse-hint = En linje af digt, drama eller en transskription, bevaret som en linje
editor-speaker = Taler
editor-speaker-hint = Hvem der taler: på en linje for sig eller som ord inde i en linje
editor-direction = Regibemærkning
editor-direction-hint = Det, der gøres på scenen: på en linje for sig eller som ord inde i en linje
editor-line-numbers = Numre
editor-line-numbers-hint = Nummerer disse linjer: hvordan de tælles, fra hvilket nummer, for hver hvor mange og i hvilken side; og angiv, hvad der gælder for den linje, markøren står i. Linjer, der nummereres sammen med de samme indstillinger, tælles under ét, uanset deres art.
editor-line-numbers-from = Nummerer fra
editor-line-numbers-from-hint = Den første linje, der tælles, får dette nummer, og tællingen fortsætter derfra.
editor-line-numbers-every = Vis et nummer for hver
editor-line-numbers-number = Der skal stå et helt tal.
editor-line-this = Denne linje
editor-line-number = Dens nummer eller betegnelse
editor-line-number-placeholder = Tælles som de andre
editor-line-number-hint = 1234, 567a: vises altid; linjerne efter den tælles videre derfra.
editor-line-uncounted = Tælles ikke
editor-line-uncounted-hint = Som anden halvdel af en linje, der er delt mellem to talere: tællingen springer den over.
editor-line-hidden = Tælles, men nummeret vises ikke
editor-line-hidden-hint = Tællingen går igennem den som gennem enhver anden linje, men der står intet nummer ud for den i dokumentet, heller ikke hvor der ville falde et. Der, hvor du skriver, står det i parentes.
editor-line-number-held = Tælles, men vises ikke i dokumentet. Tryk for at give den et nummer for sig.
editor-line-margin = Ord i margenen
editor-line-margin-placeholder = Et versemål, en anden udgaves nummer
editor-line-margin-hint = Vises i margenen ud for den, i den modsatte side af numrene; tælles ikke.
# How the lines of a stretch are numbered: see ADR 0041.
editor-numbering = Nummerering
editor-numbering-none = Ikke nummereret
editor-numbering-counted = Talt fra det første angivne nummer
editor-numbering-given = Kun de angivne numre
editor-line-numbers-every-layout = Som opsætningen: for hver { $every }
editor-line-numbers-side = Side for numrene
editor-side-layout = Som opsætningen siger ({ $side })
editor-side-left = Venstre
editor-side-right = Højre
# The first counted line of the stretch is the one the cursor is in: its number is where the count begins.
editor-line-number-first-hint = Tællingen begynder her.
# Over a number in the margin of the text, which opens a field for it when pressed.
editor-line-number-press = Denne linjes nummer: tryk for at ændre det

## Numbers belong to what they number (ADR 0041): the Numbers menu offers
## the three, each saying what it numbers.
editor-numbers-lines = Nummerer disse linjer…
editor-numbers-lines-hint = Linjerne i de afsnit, hvor markøren står, eller i de markerede: fra hvilket nummer, for hver hvor mange, i hvilken side
editor-numbers-page = Nummerer sidens linjer
editor-numbers-page-hint = Hver linje på den trykte side, nummereret i margenen, i dette dokument og dem under det

## The bracket at the left of paragraphs of one kind standing together (a
## run), named by the kind; its menu says what is said of them.
# After the name of the kind, where the lines of the run are numbered: "Verse · numbered".
editor-bracket-numbered = nummereret
editor-run-label-hint = { $kind } · tryk for at se, hvad der gælder for disse afsnit
editor-run-numbers = Numre…
editor-run-numbers-hint = Hvordan linjerne her tælles, fra hvilket nummer, for hver hvor mange og i hvilken side
editor-run-select = Markér disse afsnit
editor-run-to-text = Gør det til tekst
editor-run-to-text-hint = Afsnittene af denne art bliver tekst; deres linjer og alt andet bliver, som de er
editor-run-begin = Begynd en ny række her
editor-run-begin-hint = Afsnittet, hvor markøren står, begynder sin egen klamme, selv om det foregående er af samme art
editor-run-join = Slå sammen med rækken før
editor-run-join-hint = Disse afsnit bliver igen ét med dem af samme art før dem
editor-kinds-text = Tekst
editor-kinds-quotation = Citat
editor-kinds-verse = Vers
editor-kinds-script = Manus
editor-kinds-list = Liste
editor-kinds-more = Mere
editor-kinds-words = Ord
editor-attribution = Kildeangivelse
editor-attribution-hint = Hvis ord et citat er
editor-epigraph = Epigraf
editor-epigraph-hint = Et citat i begyndelsen af en del
editor-headword = Opslagsord
editor-headword-hint = Det ord, en ordliste forklarer
editor-gloss = Forklaring
editor-gloss-hint = Hvad opslagsordet betyder
editor-code = Kode
editor-code-hint = En linje kode eller andet, der bevares bogstav for bogstav
editor-break = Skille
editor-break-hint = En pause mellem dele, med det tegn, opsætningen giver den
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
editor-scene = Sceneoverskrift
editor-scene-hint = Hvor og hvornår en scene foregår: INT. HUS – NAT
editor-action = Handling
editor-action-hint = Det, der ses og gøres
editor-character = Rolle
editor-character-hint = Hvem der siger replikken, der følger
editor-dialogue = Replik
editor-dialogue-hint = Det, der siges
editor-parenthetical = Parentes
editor-parenthetical-hint = Hvordan en replik siges
editor-transition = Overgang
editor-transition-hint = Hvordan én scene går over i den næste: KLIP TIL:
editor-comment = Kommentar
editor-parallel = To tekster side om side
editor-page-break = Sideskift
editor-column-break = Spalteskift
editor-paragraph-kind = Afsnittets art
# Said of the button that shows the kind of paragraph the cursor is in.
editor-paragraph-kind-now = Afsnittets art: { $kind }

## The kind menu: the kinds written with those where the cursor is, the kinds at hand,
## the whole catalogue under "More…", and the layout that sets them at its foot.
## The words menu, with the kinds of words. And a kind of the writer's own, in its dialog.

editor-kinds-menu-more = Mere…
editor-kinds-mixed = Blandet
editor-kinds-own = Dine egne
editor-kinds-make = Lav en art…
editor-kinds-change-own = Ændr en af dine egne…
# Over the item that opens the look of the document at the kind the cursor is in.
editor-kinds-set-by = Sat, som »{ $format }« har dem
editor-kinds-change-look = Hvordan »{ $kind }« ser ud…
editor-kinds-change-look-hint = Dens udseende i dette dokument og resten af siden
editor-words-make = Lav en art ord…
# Beside the language of the map, first among the languages foreign words may be in.
editor-foreign-of-text = Tekstens sprog
# What a kind of words is based on when it is based on no kind in particular.
editor-plain-words = Almindelige ord
# The language of a passage, from a word to many paragraphs: it has no look of its own.
editor-language = Sprog
editor-language-of-text = Tekstens eget sprog
editor-language-other = Et andet sprog…
editor-language-other-title = Passagens sprog
editor-language-tag = Sprogkode
editor-language-no-tag = Det er ikke en sprogkode: en kode er f.eks. »grc«, »la« eller »de-CH«.
editor-language-unnamed = Et sprog, systemet ikke har noget navn for: koden bevares, som den er skrevet.
editor-language-suggested = Sprog, der ofte citeres
editor-language-other-hint = Passagen kontrolleres med ordbogen for dens sprog, hvor en sådan er importeret, og lades i fred, hvor der ingen er; et dokument, der laves, fortæller Word, OpenDocument, Typst og LaTeX, hvilket sprog det er.
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

editor-cite-here = Henvis til et værk her
editor-note = Note
editor-note-selection = Gør det markerede til en note
editor-insert = Indsæt
editor-spelling-on = Stavningen kontrolleres, mens du skriver · tryk for at stoppe
editor-spelling-off = Stavningen kontrolleres ikke · tryk for at kontrollere den
editor-equation = Ligning
editor-table = Tabel…
editor-table-file = Tabel fra en fil…
editor-formula = Formel
editor-pointer = Krydshenvisning…
editor-refmark-title = Stedmærke
editor-refmark-label = Betegnelse
editor-refmark-placeholder = 3:16, 327a, 1094a1
editor-refmark-dialog-hint = Mærket er ingen del af ordene: stavekontrol, søgning og ordtælling springer det over. Opsætningen afgør, om det hæves i linjen eller sættes i margenen.
# What a picture that was pasted without a name of its own is called in the store of pictures.
editor-pasted-picture = billede

## More.

editor-found = Løse kildehenvisninger…
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
# A reference was dropped where a citation cannot stand, and the cursor is in no such place either.
editor-citation-no-place = En kildehenvisning kan ikke stå der
# The project keeps a copy of every reference it cites; this one could not be read from the library.
editor-reference-not-kept = Referencen kunne ikke gemmes med projektet
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
editor-note-place-format = Hvor opsætningen har sine noter
editor-note-place-foot = Nederst på siden
editor-note-place-end = Sidst i teksten
editor-note-placeholder = Notens tekst
