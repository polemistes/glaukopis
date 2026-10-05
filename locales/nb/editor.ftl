# Redigeringen av tekster: verktøyene for skriving, kildehenvisninger og noter.
# Se locales/README.md.

## Formateringen og slagene avsnitt, i linjen over det som er merket og i
## verktøyene over teksten.

editor-format = Formatering
editor-writing = Skriving
editor-italic = Kursiv
editor-bold = Fet
editor-small-capitals = Kapitéler
editor-superscript = Hevet skrift
editor-subscript = Senket skrift
editor-struck = Gjennomstreket
editor-quotation = Sitat
editor-block-quotation = Blokksitat
editor-list = Liste
editor-text = Tekst
editor-text-hint = Et avsnitt
editor-quotation-hint = Skilt ut fra teksten
editor-list-hint = Med et merke foran hvert punkt
editor-numbered-list = Nummerert liste
editor-numbered-list-hint = Med et tall foran hvert punkt
editor-verse = Vers
editor-verse-hint = Linjer av dikt eller drama, hver beholdt som en linje
editor-speaker = Taler
editor-speaker-hint = Hvem som taler, på en egen linje
editor-direction = Sceneanvisning
editor-direction-hint = Det som gjøres, i kursiv
editor-line-numbers = Linjenummer
editor-line-numbers-hint = Nummerer linjene i dette verset: fra hvilken linje, og hver hvor mange
editor-line-numbers-from = Nummerer linjene fra
editor-line-numbers-none = La stå tomt for ingen nummer
editor-line-numbers-every = Vis et nummer hver
editor-line-numbers-number = Et helt tall trengs.
editor-kinds-text = Tekst
editor-kinds-quotation = Sitat
editor-kinds-verse = Vers
editor-kinds-script = Manus
editor-kinds-more = Mer
editor-kinds-words = Ord
editor-attribution = Kildeangivelse
editor-attribution-hint = Hvem ordene er fra, under et sitat, til høyre
editor-epigraph = Epigraf
editor-epigraph-hint = Et sitat i begynnelsen av en del
editor-headword = Oppslagsord
editor-headword-hint = Ordet en ordliste forklarer
editor-gloss = Forklaring
editor-gloss-hint = Hva oppslagsordet betyr
editor-code = Kode
editor-code-hint = Beholdt bokstav for bokstav, i bokstaver med lik bredde
editor-break = Skille
editor-break-hint = Et opphold mellom deler, med tegnet formatet gir det
editor-draft = Kladd
editor-draft-hint = For dine øyne: det kommer ikke med i noe dokument
editor-foreign = Annet språk
editor-foreign-hint = Ord på et annet språk, som stavingen følger
editor-title-of-work = Tittel på et verk
editor-title-of-work-hint = Tittelen på en bok, et skuespill, et maleri
editor-term = Term
editor-term-hint = En term der den brukes første gang
editor-mention = Omtalt ord
editor-mention-hint = Et ord omtalt som ord, i anførselstegn
editor-highlight = Utheving
editor-highlight-hint = For øyet på skjermen: det kommer ikke med i noe dokument
editor-underline = Understreket
editor-code-words = Kode i linjen
editor-code-words-hint = Bokstaver med lik bredde, inne i linjen
editor-scene = Sceneoverskrift
editor-scene-hint = INT. HUS – NATT
editor-action = Handling
editor-action-hint = Det som ses og gjøres
editor-character = Rolle
editor-character-hint = Hvem som snakker, over replikken
editor-dialogue = Replikk
editor-dialogue-hint = Det som sies
editor-parenthetical = Parentes
editor-parenthetical-hint = Hvordan det sies, i parentes
editor-transition = Overgang
editor-transition-hint = KLIPP TIL:, til høyre
editor-comment = Kommentar
editor-comment-hint = En kommentar til det som er merket
editor-comment-element-hint = En kommentar til dette elementet; merk ord for å kommentere dem
editor-parallel = To tekster side om side
editor-parallel-hint = En original og dens oversettelse, hver sin tekst
editor-paragraph-kind = Slags avsnitt
# Sies om knappen som viser hva slags avsnitt markøren står i.
editor-paragraph-kind-now = Slags avsnitt: { $kind }

## Menyen over slagene: slagene for hånden, hele katalogen under «Mer …», og
## formatet som setter dem, nederst. Menyen over ordene, med slagene ord. Og
## et eget slag, i vinduet sitt.

editor-kinds-menu-more = Mer …
editor-kinds-in-hand = Slag for hånden
editor-kinds-own = Dine egne
editor-kinds-make = Lag et slag …
editor-kinds-change-own = Endre et av dine egne …
# Over valget som åpner formatredigeringen: formatet bestemmer hvordan hvert slag ser ut.
editor-kinds-set-by = Satt slik «{ $format }» har dem
editor-kinds-change-format = Endre formatet …
editor-kinds-change-format-hint = Hvordan hvert slag settes i dette dokumentet
editor-words = Ord
editor-words-hint = Understreking, hevet skrift, kode; ord på et annet språk, tittelen på et verk, en term
editor-words-make = Lag et slag ord …
# Ved siden av språket i kartet, først blant språkene ord på et annet språk kan være på.
editor-foreign-of-map = Språket i kartet
# Det et slag ord bygger på når det ikke bygger på noe bestemt slag.
editor-plain-words = Vanlige ord
editor-own-kind-new = Et eget slag
editor-own-kind-change = Endre slaget
editor-own-kind-name = Navn
editor-own-kind-name-placeholder = Brev, telegram, bønn …
editor-own-kind-words-placeholder = Skipsnavn, latin, et nøkkelord …
editor-own-kind-name-taken = Det finnes alt et slag med det navnet.
editor-own-kind-based-on = Bygger på
editor-own-kind-based-on-hint = Det som ikke sies nedenfor, er som dette slaget har det
editor-own-kind-look = Hvordan det skiller seg
editor-own-kind-create = Opprett
editor-own-kind-delete-title = Slette slaget «{ $name }»?
editor-own-kind-delete-message = { $count ->
    [0] Ingen tekst er av det.
    [one] Det som er av det i ett element, blir stående som det er, og settes som tekst i dokumenter.
   *[other] Det som er av det i { $count } elementer, blir stående som det er, og settes som tekst i dokumenter.
}

## Kildehenvisninger, noter og det som settes inn i teksten.

editor-cite = Henvis
editor-cite-here = Henvis til et verk her
editor-cite-at-cursor = Henvis til et verk der markøren står
editor-note = Note
editor-note-selection = Gjør det merkede til en note
editor-note-hint = En note, nederst på siden eller til slutt
editor-insert = Sett inn
editor-insert-hint = Et bilde, en tabell, matematikk, en kryssreferanse til en figur
editor-new-element = Nytt element
editor-new-element-hint = Et nytt element etter dette, eller under det
editor-new-after = Nytt element etter dette
editor-new-under = Nytt element under dette
editor-new-split = Del her
editor-new-split-hint = Det som står etter markøren, blir et nytt element
editor-spelling-on = Stavingen kontrolleres mens du skriver · trykk for å slutte
editor-spelling-off = Stavingen kontrolleres ikke · trykk for å kontrollere den
editor-picture-file = Bilde fra en fil …
editor-picture-file-hint = En figur, med bildetekst
editor-picture-store = Bilde fra bildelageret …
editor-picture-store-hint = De du har, vises ved siden av
editor-equation = Ligning
editor-equation-hint = Matematikk på en egen linje
editor-table = Tabell …
editor-table-hint = Med så mange rader og kolonner
editor-table-file = Tabell fra en fil …
editor-table-file-hint = CSV, eller et ark fra LibreOffice eller Excel
editor-formula = Formel
editor-formula-hint = Matematikk i linjen
editor-pointer = Kryssreferanse …
editor-pointer-hint = Til figur, tabell, ligning eller del: «se figur 2»
# Det et bilde som ble limt inn uten eget navn, heter i bildelageret.
editor-pasted-picture = bilde

## Mer.

editor-found = Funne kildehenvisninger …
editor-found-count = { $count } å gå gjennom og gjøre til kildehenvisninger
editor-found-none = Og tekst som ser ut som kildehenvisninger, i dette kartet

## Å velge et verk å henvise til.

editor-picker = Velg en referanse
editor-picker-placeholder = Henvis til: forfatter, tittel, år
editor-picker-search = Søk i referansene
editor-picker-results = Referanser
editor-picker-in-project = I dette prosjektet
editor-picker-recent = Nylig lagt til
editor-picker-empty = Biblioteket ditt er tomt.
editor-picker-no-match = Ingenting i biblioteket ditt inneholder disse ordene.
editor-picker-type = Skriv for å søke i biblioteket ditt.
editor-picker-new = Ny referanse …
editor-picker-import = Importer …

## En kildehenvisning, og hvert verk i den.

editor-citation = Kildehenvisning
editor-citation-add = Legg til verk
editor-citation-add-purpose = Legg til et verk i kildehenvisningen
editor-citation-in-text = Forfatter i teksten: Nagy (1979)
editor-citation-remove = Fjern henvisningen
editor-citation-split = Skill ordene fra henvisningen
editor-citation-split-hint = Ordene før og etter blir tekst i linjen, og hvert verk en henvisning for seg, med siden sin og ikke annet
editor-citation-not-in-library = Denne referansen er ikke i biblioteket ditt.
editor-citation-edit-reference = Rediger referansen
editor-citation-before = Tekst foran
editor-citation-before-placeholder = se, jf.
editor-citation-after = Tekst etter
editor-citation-after-placeholder = og passim
editor-citation-locator-kind = Slags sted i verket
editor-citation-suppress-author = Forfatteren er nevnt i setningen min: vis bare årstallet
editor-citation-remove-work = Fjern dette verket
# Står i teksten i stedet for en kildehenvisning til et verk som verken er i biblioteket eller i prosjektet.
editor-citation-missing = [referansen ble ikke funnet]
# Står i teksten i stedet for en kildehenvisning til ingen verk.
editor-citation-empty = (kildehenvisning)

## Slagene steder i et verk en kildehenvisning kan vise til, slik menyen
## til en kildehenvisning kaller dem.

editor-locator-page = Side
editor-locator-chapter = Kapittel
editor-locator-section = Paragraf
editor-locator-paragraph = Avsnitt
editor-locator-line = Linje
editor-locator-verse = Vers
editor-locator-book = Bok
editor-locator-volume = Bind
editor-locator-part = Del
editor-locator-column = Kolonne
editor-locator-folio = Folio
editor-locator-figure = Figur
editor-locator-note = Note
editor-locator-number = Nummer
editor-locator-sub-verbo = Sub verbo

## En note, i panelet den skrives i.

# Tallet er notens nummer, eller en bokstav for en note som står et eget sted.
editor-note-numbered = Note { $number }
editor-note-place = Hvor noten står
editor-note-place-format = Der formatet har notene sine
editor-note-place-foot = Nederst på siden
editor-note-place-end = Til slutt i teksten
editor-note-placeholder = Teksten i noten
