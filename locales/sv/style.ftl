# Reference styles: their kinds, the search for more, and the style editor,
# with the words it tells the parts of a style by.

## The kinds of reference style, as the styles are grouped by them.

style-kind-note = Noter
style-kind-author-date = Författare och år
style-kind-numeric = Nummer
style-kind-label = Etiketter
style-kind-author = Författare
style-kind-other = Övriga

## The search for reference styles of journals and publishers.

style-browser = Referensstilar
style-browser-subtitle = Över tiotusen stilar från tidskrifter och förlag, efter namn
style-browser-placeholder = Namnet på en tidskrift, ett förlag eller en stil
style-browser-search = Sök stilar
# Beside a style that has been fetched already.
style-browser-here = Här
style-browser-fetch = Hämta
style-browser-none-found = Ingen stil har de här orden i sitt namn.
style-browser-about = Stilar hämtas från Citation Style Language-projektets förråd och sparas med dina egna. De du har kan ändras efter ett förlags önskemål i stilredigeraren.
style-browser-import = Importera en fil…
style-browser-import-title = Importera en referensstil
style-browser-fetch-failed = Stilen kunde inte hämtas.
style-browser-file-unread = Filen kunde inte läsas.

## The style editor.

style-editor = Referensstil
style-name = Stilens namn
# The name a style of one's own is first given, made from that of the style it is made from.
style-name-changed = { $name }, ändrad
style-depth = Hur djupt att gå
style-depth-options = Vanliga ändringar
style-depth-parts = Del för del
style-depth-source = Källtext
style-scope = Vad som ska ändras
style-scope-citations = Källhänvisningar
style-scope-notes = Noter
style-scope-bibliography = Litteraturförteckning
style-bundled = Stilar som följer med Glaukopis förblir som de är. Dina ändringar sparas som en egen stil.
style-delete = Radera den här stilen
style-save-own = Spara som min egen
style-saved = ”{ $name }” är sparad bland dina egna stilar
style-read-failed = Stilen kunde inte läsas.
style-save-failed = Stilen kunde inte sparas.
style-delete-failed = Stilen kunde inte raderas.
style-delete-title = Radera stilen ”{ $name }”?
style-delete-message = Kartor som använder den kommer att använda en annan stil i stället.
style-delete-confirm = Radera stilen
style-leave-title = Lämna utan att spara?
style-leave-message = Ändringarna du har gjort i stilen går förlorade.
style-leave-confirm = Lämna
style-leave-cancel = Fortsätt redigera

## Common changes: names.

style-names = Namn
# A sentence with two fields in it, where numbers are written: the least number of
# authors for which "et al." is used, and how many are named before it.
style-et-al = Vid { $min } författare eller fler, ange de första { $first } och ”m.fl.”
style-et-al-min = Antal författare från vilket m.fl. används
style-et-al-first = Antal författare som anges före m.fl.
style-et-al-empty = Lämnas tomt anges alla
# As the one before, for a work that has been cited before.
style-et-al-again = När verket hänvisas till igen, vid { $min } eller fler ange de första { $first }
style-et-al-again-min = Antal författare från vilket m.fl. används i senare hänvisningar
style-et-al-again-first = Antal författare som anges i senare hänvisningar
style-et-al-again-empty = Lämnas tomt, som första gången
style-before-last-name = Före det sista namnet
# The word the style prints there, in the language of the document.
style-and-word = och
style-and-nothing = Inget
style-as-the-style-has-it = Som stilen har det
style-comma-before-last = Ett komma före
style-comma-contextual = Vid tre namn eller fler: A, B, och C
style-comma-always = Alltid: A, och B
style-comma-never = Aldrig: A, B och C
style-comma-after-inverted = Efter ett namn som är omvänt
style-given-names = Förnamn
style-given-full = Fullt ut: John Miles
style-given-spaced = Initialer: J. M.
style-given-close = Initialer, tätt: J.M.
style-given-bare = Initialer utan punkter: JM
style-given-bare-spaced = Initialer utan punkter: J M
style-family-first = Efternamnet först
style-family-first-none = För ingen: John Foley
style-family-first-first = För den första författaren: Foley, John, och Robert Fowler
style-family-first-all = För alla: Foley, John, och Fowler, Robert
style-sort-separator = Mellan efternamn och förnamn
style-sort-separator-hint = När efternamnet kommer först

## Common changes: the citation, or the note, and the entries of the bibliography.

style-the-citation = Källhänvisningen
style-the-note = Noten
style-begins-with = Börjar med
style-ends-with = Slutar med
style-between-works = Mellan verk som hänvisas till tillsammans
style-collapse = Verk av en författare som hänvisas till tillsammans
style-collapse-none = Vart och ett fullt ut
style-collapse-year = Namnet en gång: Nagy 1979, 1996
style-collapse-year-suffix = Och året en gång: Nagy 1979a, b
style-collapse-year-suffix-ranged = Med intervall: Nagy 1979a–c
style-collapse-citation-number = Nummer som intervall: [1–3]
style-disambiguate = När två verk skulle hänvisas till lika
style-disambiguate-year-suffix = Lägg en bokstav till året
style-disambiguate-names = Nämn fler författare
style-disambiguate-given-names = Lägg till förnamn eller initialer
style-near-note = En not räknas som nära inom
style-near-note-hint = Noter; för stilar som förkortar det som nyss hänvisats till
style-entries = Posterna
style-entry-ends-with = Var och en slutar med
style-author-repeated = För en upprepad författare
style-author-repeated-hint = I namnets ställe, i posterna efter den första
style-hanging-indent = Hängande indrag
style-hanging-indent-hint = Dokumentformatet avgör hur djupt
style-second-field = Nummer eller etiketter står
style-second-field-line = I raden
style-second-field-column = I en egen kolumn
style-second-field-margin = I marginalen
style-second-field-hint = För stilar som numrerar sina poster

## Common changes: throughout the style.

style-throughout = Genomgående
style-page-ranges = Sidintervall
style-page-ranges-as-entered = Som inskrivet
style-page-ranges-expanded = Fullt ut: 321–328
style-page-ranges-minimal = Kortast: 321–8
style-page-ranges-minimal-two = Minst två siffror: 321–28
style-page-ranges-chicago = Som Chicago Manual har det
style-particles = ”van”, ”de”, ”von” före ett efternamn
style-particles-never = Står kvar, och sorteras under v, d
style-particles-sort-only = Står kvar, men sorteras inte efter
style-particles-display-and-sort = Hamnar efter förnamnet: Gogh, Vincent van
style-hyphen = Bindestreck mellan initialer
style-hyphen-hint = J.-P. Sartre, inte J.P. Sartre
style-locale = Stilens ord är på
style-locale-document = Dokumentets språk
style-locale-hint = ”red.”, ”i”, ”hämtad”, månaderna

## Part by part.

# The scope is citation or bibliography.
style-parts-of = { $scope ->
    [citation] Källhänvisningens delar
   *[bibliography] Litteraturförteckningens delar
}
style-parts-none = { $scope ->
    [citation] Den här stilen har ingen källhänvisning.
   *[bibliography] Den här stilen har ingen litteraturförteckning.
}
style-parts-hint = Välj en del till vänster för att ändra hur den skrivs ut: vad som står före och efter den, dess skrift, dess stora bokstäver. Delar öppnas för att visa vad de är gjorda av.
style-part-unfold = Öppna
style-part-fold = Stäng
style-part-up = Flytta upp
style-part-down = Flytta ner
style-part-add-after = Lägg till efter
style-part-take-away = Ta bort
style-part-add-within = Lägg till inuti
# A part of a macro: a part of the style that is used in several places.
style-part-shared = Detta hör till ”{ $macro }”, som används på { $count } ställen. En ändring här syns i alla.
style-add-words = Egna ord
style-add-words-hint = Som ”i”, ”hämtad”, eller skiljetecken
# Over the fields of a reference that a part can print.
style-add-from-reference = Från referensen
style-part-words = Orden
style-part-before = Före
style-part-before-hint = Skrivs bara ut när själva delen skrivs ut
style-part-after = Efter
style-part-between = Mellan dess delar
style-slant = Lutning
style-slant-upright = Rak
style-slant-italic = Kursiv
style-weight = Vikt
style-weight-regular = Normal
style-weight-bold = Fet
style-letters = Bokstäver
style-letters-as-written = Som skrivet
style-letters-small-caps = Kapitäler
style-case = Stora bokstäver
style-case-as-entered = Som inskrivet
style-case-title = Som en engelsk titel
style-case-sentence = Som en mening
style-case-capitalize-first = Första bokstaven stor
style-case-capitalize-all = Varje Ord Med Stor Bokstav
style-case-uppercase = VERSALER
style-case-lowercase = gemener
style-height = Höjd
style-height-baseline = På raden
style-height-raised = Upphöjd
style-height-lowered = Nedsänkt
style-quotes = Inom citationstecken
style-strip-periods = Utan punkter
style-strip-periods-hint = För förkortningar: ”red” för ”red.”
style-text-form = Form
style-text-form-long = Fullt ut
style-text-form-short = Kort, där referensen har en
style-term-form = Ordets form
style-term-form-long = Fullt ut: redaktör, sida
style-term-form-short = Kort: red., s.
style-term-form-verb = Som verb: redigerad av
style-term-form-verb-short = Som verb, kort: red. av
style-term-form-symbol = Som tecken: §
style-date-parts = Datumet anges
style-date-parts-year = Som bara året
style-date-parts-year-month = Som år och månad
style-date-parts-full = Fullt ut

## The source of the style, and the sample it is tried on.

style-source = Stilens källtext
style-source-try = Pröva den
style-source-unread = Källtexten kunde inte läsas.
style-sample-unusable = Stilen kan inte användas som den är
style-sample-failed = Stilen kunde inte prövas.
style-sample-in-text = I texten
style-sample-in-notes = I noterna
style-sample-in-bibliography = I litteraturförteckningen
style-sample-cited = Ett verk hänvisat till
style-sample-same-page = Detsamma, på en sida
style-sample-another = Ett annat, med ett ord före
style-sample-first-again = Det första igen, vid ett kapitel
style-sample-together = Två verk tillsammans
style-sample-in-sentence = Med författaren i meningen
style-sample-examples = Visat på exempel: ditt bibliotek är tomt.
style-sample-library = Visat på verk ur ditt bibliotek.

## The source of a style, where it cannot be read as one.

style-source-not-xml = Källtexten är inte välformad XML.
style-source-not-style = Det här är inte en stil: den börjar inte med <style>.
style-source-dependent = Stilen har ingen <citation>: den nämner bara en annan stil, och kan inte ändras.

## The parts of a style, as the style editor tells them in words.

style-part-layout = Det hela
style-part-text = Text
# A part that prints a word of the style's language: the term is its name in CSL.
style-part-term = Ordet för ”{ $term }”
# A part that prints words written into the style.
style-part-value = Orden ”{ $value }”
style-part-name = Hur namnen skrivs
# The name is family or given, as CSL has them.
style-part-name-part = { $name ->
    [family] Efternamnet
    [given] Förnamnet
   *[other] Namnet { $name }
}
style-part-et-al = ”m.fl.”
# The variables are one or more of those below: "the pages".
style-part-label = Ordet före { $variables } (”s.”, ”red.”)
style-part-role = Ordet för rollen (”red.”, ”övers.”)
style-part-substitute = När det inte finns något sådant namn, i dess ställe
# The name is day, month or year, as CSL has them, or part.
style-part-date-part = { $name ->
    [day] Dagen
    [month] Månaden
    [year] Året
   *[other] Delen { $name }
}
style-part-group = Tillsammans
style-part-choose = Ett av dessa
# The condition is made of those below.
style-part-if = Om { $condition }
style-part-else-if = Annars, om { $condition }
style-part-else = Annars
# A name the style has, of a part of it (a macro) or of a variable it does not know.
style-quoted = ”{ $text }”

## Words that join others: "the author, or else the editor", "a book or a chapter".
## The first may be a list of several, joined by commas.

style-or = { $first } eller { $last }
style-and = { $first } och { $last }
style-or-else = { $first }, annars { $last }

## When a part of a style is printed: "If the work is a book".

style-if-type = verket är { $types }
style-if-has = det har { $variables }
style-if-lacks = det saknar { $variables }
style-if-numeric = { $variables } är ett tal
style-if-uncertain = { $variables } är osäker
# The places are pages, chapters, verses and the like; see style-locator.
style-if-locator = stället som hänvisas till är av slaget { $locators }
style-if-disambiguate = det annars skulle förväxlas med ett annat
style-if-always = alltid
style-if-none-holds = inget av detta gäller: { $conditions }
# A kind of place that a citation points to, as CSL names it: page, chapter, verse,
# sub-verbo, and so on. English leaves the names as they are.
style-locator = { $name }

## When a citation is printed, by where it stands among the others.

style-position-first = det hänvisas till för första gången
style-position-subsequent = det har hänvisats till förut
style-position-ibid = det är detsamma som hänvisningen före
style-position-ibid-with-locator = det är detsamma som hänvisningen före, på ett annat ställe
style-position-near-note = det hänvisades till i en not i närheten

## How a part is set: "italic, in quotation marks, before “, ”".

style-form-italic = kursiv
style-form-bold = fet
style-form-small-caps = kapitäler
style-form-underlined = understruken
style-form-quoted = inom citationstecken
# How the letters are set, as CSL names it; the words are that name with spaces for its dashes.
style-form-case = { $case ->
    [lowercase] gemener
    [uppercase] versaler
    [capitalize-first] första bokstaven stor
    [capitalize-all] varje ord med stor bokstav
    [sentence] som en mening
    [title] som en engelsk titel
   *[other] { $words }
}
style-form-raised = upphöjd
style-form-lowered = nedsänkt
# The part comes after these words.
style-form-after = efter ”{ $text }”
# The part comes before these words.
style-form-before = före ”{ $text }”
style-form-between = med ”{ $text }” emellan

## The kinds of work a reference is of, as CSL names them.

style-type-book = en bok
style-type-chapter = ett kapitel
style-type-article-journal = en artikel i en tidskrift
style-type-article-magazine = en artikel i ett magasin
style-type-article-newspaper = en artikel i en tidning
style-type-article = en artikel
style-type-thesis = en avhandling
style-type-report = en rapport
style-type-webpage = en webbsida
style-type-paper-conference = ett konferensbidrag
style-type-entry-encyclopedia = en artikel i ett uppslagsverk
style-type-entry-dictionary = en artikel i en ordbok
style-type-entry = en post
style-type-review = en recension
style-type-review-book = en recension av en bok
style-type-manuscript = ett manuskript
style-type-personal_communication = ett brev eller annat meddelande
style-type-legal_case = ett domstolsavgörande
style-type-legislation = lagstiftning
style-type-bill = ett lagförslag
style-type-patent = ett patent
style-type-dataset = en datamängd
style-type-software = programvara
style-type-motion_picture = en film
style-type-broadcast = en sändning
style-type-song = en inspelning
style-type-speech = en föreläsning
style-type-interview = en intervju
style-type-graphic = en bild
style-type-map = en karta
style-type-pamphlet = en broschyr
style-type-post-weblog = ett blogginlägg
style-type-post = ett inlägg
style-type-classic = ett klassiskt verk
style-type-collection = en samling
style-type-document = ett dokument
style-type-standard = en standard
style-type-treaty = ett fördrag
style-type-periodical = en tidskrift
style-type-musical_score = ett partitur
style-type-figure = en figur
style-type-event = ett evenemang
style-type-performance = en föreställning
style-type-regulation = en förordning
style-type-hearing = en utfrågning

## What a reference has, as CSL names it: with its article, and without it
## (.bare) as a field of a reference is named.

style-variable-title = titeln
    .bare = titel
style-variable-title-short = den korta titeln
    .bare = kort titel
style-variable-container-title = tidskriftens eller bokens titel
    .bare = tidskriftens eller bokens titel
style-variable-container-title-short = tidskriftens korta titel
    .bare = tidskriftens korta titel
style-variable-collection-title = serien
    .bare = serie
style-variable-collection-number = numret i serien
    .bare = nummer i serien
style-variable-original-title = originaltiteln
    .bare = originaltitel
style-variable-reviewed-title = det recenserade verkets titel
    .bare = det recenserade verkets titel
style-variable-author = författaren
    .bare = författare
style-variable-editor = redaktören
    .bare = redaktör
style-variable-translator = översättaren
    .bare = översättare
style-variable-container-author = bokens författare
    .bare = bokens författare
style-variable-collection-editor = seriens redaktör
    .bare = seriens redaktör
style-variable-editorial-director = huvudredaktören
    .bare = huvudredaktör
style-variable-original-author = originalförfattaren
    .bare = originalförfattare
style-variable-reviewed-author = det recenserade verkets författare
    .bare = det recenserade verkets författare
style-variable-interviewer = intervjuaren
    .bare = intervjuare
style-variable-recipient = mottagaren
    .bare = mottagare
style-variable-director = regissören
    .bare = regissör
style-variable-composer = kompositören
    .bare = kompositör
style-variable-illustrator = illustratören
    .bare = illustratör
style-variable-issued = datumet
    .bare = datum
style-variable-accessed = hämtningsdatumet
    .bare = hämtningsdatum
style-variable-original-date = det ursprungliga datumet
    .bare = ursprungligt datum
style-variable-event-date = evenemangets datum
    .bare = evenemangets datum
style-variable-submitted = inlämningsdatumet
    .bare = inlämningsdatum
style-variable-volume = bandet
    .bare = band
style-variable-number-of-volumes = antalet band
    .bare = antal band
style-variable-issue = häftet
    .bare = häfte
style-variable-edition = upplagan
    .bare = upplaga
style-variable-page = sidorna
    .bare = sidor
style-variable-page-first = första sidan
    .bare = första sida
style-variable-number-of-pages = antalet sidor
    .bare = antal sidor
style-variable-number = numret
    .bare = nummer
style-variable-chapter = kapitlet
    .bare = kapitel
style-variable-chapter-number = kapitlets nummer
    .bare = kapitlets nummer
style-variable-publisher = förlaget
    .bare = förlag
style-variable-publisher-place = utgivningsorten
    .bare = utgivningsort
style-variable-original-publisher = det ursprungliga förlaget
    .bare = ursprungligt förlag
style-variable-original-publisher-place = den ursprungliga utgivningsorten
    .bare = ursprunglig utgivningsort
style-variable-locator = stället som hänvisas till
    .bare = ställe som hänvisas till
style-variable-citation-number = hänvisningens nummer
    .bare = hänvisningens nummer
style-variable-citation-label = hänvisningens etikett
    .bare = hänvisningens etikett
style-variable-year-suffix = bokstaven efter året
    .bare = bokstav efter året
style-variable-first-reference-note-number = numret på noten där det först hänvisades till
    .bare = nummer på noten där det först hänvisades till
style-variable-DOI = DOI
    .bare = DOI
style-variable-URL = adressen
    .bare = adress
style-variable-ISBN = ISBN
    .bare = ISBN
style-variable-ISSN = ISSN
    .bare = ISSN
style-variable-PMID = PMID
    .bare = PMID
style-variable-genre = slaget av verk
    .bare = slag av verk
style-variable-medium = mediet
    .bare = medium
style-variable-note = anmärkningen
    .bare = anmärkning
style-variable-annote = annotationen
    .bare = annotation
style-variable-abstract = sammanfattningen
    .bare = sammanfattning
style-variable-archive = arkivet
    .bare = arkiv
style-variable-archive_location = stället i arkivet
    .bare = ställe i arkivet
style-variable-archive-place = arkivets ort
    .bare = arkivets ort
style-variable-authority = myndigheten
    .bare = myndighet
style-variable-call-number = hyllsignum
    .bare = hyllsignum
style-variable-event = evenemanget
    .bare = evenemang
style-variable-event-place = evenemangets plats
    .bare = evenemangets plats
style-variable-event-title = evenemangets titel
    .bare = evenemangets titel
style-variable-section = avsnittet
    .bare = avsnitt
style-variable-source = källan
    .bare = källa
style-variable-status = utgivningsstatusen
    .bare = utgivningsstatus
style-variable-version = versionen
    .bare = version
style-variable-language = språket
    .bare = språk
style-variable-dimensions = måtten
    .bare = mått
style-variable-scale = skalan
    .bare = skala
style-variable-references = referenserna
    .bare = referenser
style-variable-keyword = nyckelorden
    .bare = nyckelord
style-variable-jurisdiction = jurisdiktionen
    .bare = jurisdiktion
