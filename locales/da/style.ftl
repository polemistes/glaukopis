# Reference styles: their kinds, the search for more, and the style editor,
# with the words it tells the parts of a style by.

## The kinds of reference style, as the styles are grouped by them.

style-kind-note = Noter
style-kind-author-date = Forfatter og år
style-kind-numeric = Numre
style-kind-label = Mærkater
style-kind-author = Forfatter
style-kind-other = Andre

## The search for reference styles of journals and publishers.

style-browser = Referencestile
style-browser-subtitle = Over ti tusind stile for tidsskrifter og forlag, efter navn
style-browser-placeholder = Navnet på et tidsskrift, et forlag eller en stil
style-browser-search = Søg i stilene
# Beside a style that has been fetched already.
style-browser-here = Her
style-browser-fetch = Hent
style-browser-none-found = Ingen stil har disse ord i sit navn.
style-browser-about = Stile hentes fra Citation Style Language-projektets samling og gemmes sammen med dine egne. Dem, du har, kan ændres efter et forlags ønsker i stileditoren.
style-browser-import = Importer en fil…
style-browser-import-title = Importer en referencestil
style-browser-fetch-failed = Stilen kunne ikke hentes.
style-browser-file-unread = Filen kunne ikke læses.

## The style editor.

style-editor = Referencestil
style-name = Stilens navn
# The name a style of one's own is first given, made from that of the style it is made from.
style-name-changed = { $name }, ændret
style-depth = Hvor dybt der skal gås
style-depth-options = Almindelige ændringer
style-depth-parts = Del for del
style-depth-source = Kilde
style-scope = Hvad der skal ændres
style-scope-citations = Kildehenvisninger
style-scope-notes = Noter
style-scope-bibliography = Litteraturliste
style-bundled = Stile, der følger med Glaukopis, bliver, som de er. Dine ændringer gemmes som en stil af dine egne.
style-delete = Slet denne stil
style-save-own = Gem som min egen
style-saved = »{ $name }« er gemt blandt dine egne stile
style-read-failed = Stilen kunne ikke læses.
style-save-failed = Stilen kunne ikke gemmes.
style-delete-failed = Stilen kunne ikke slettes.
style-delete-title = Slet stilen »{ $name }«?
style-delete-message = Kort, der bruger den, vil bruge en anden stil i stedet.
style-delete-confirm = Slet stilen
style-leave-title = Forlad uden at gemme?
style-leave-message = De ændringer, du har lavet i stilen, går tabt.
style-leave-confirm = Forlad
style-leave-cancel = Rediger videre

## Common changes: names.

style-names = Navne
# A sentence with two fields in it, where numbers are written: the least number of
# authors for which "et al." is used, and how many are named before it.
style-et-al = Med { $min } forfattere eller flere, giv de første { $first } og »et al.«
style-et-al-min = Antal forfattere, fra hvilket et al. bruges
style-et-al-first = Antal forfattere, der gives før et al.
style-et-al-empty = Står feltet tomt, nævnes alle
# As the one before, for a work that has been cited before.
style-et-al-again = Ved senere henvisninger, med { $min } eller flere, giv de første { $first }
style-et-al-again-min = Antal forfattere, fra hvilket et al. bruges i senere henvisninger
style-et-al-again-first = Antal forfattere, der gives i senere henvisninger
style-et-al-again-empty = Står feltet tomt, som første gang
style-before-last-name = Før det sidste navn
# The word the style prints there, in the language of the document.
style-and-word = og
style-and-nothing = Intet
style-as-the-style-has-it = Som stilen har det
style-comma-before-last = Et komma foran
style-comma-contextual = Med tre navne eller flere: A, B, og C
style-comma-always = Altid: A, og B
style-comma-never = Aldrig: A, B og C
style-comma-after-inverted = Efter et navn, der er vendt om
style-given-names = Fornavne
style-given-full = Fuldt ud: John Miles
style-given-spaced = Initialer: J. M.
style-given-close = Initialer, tæt: J.M.
style-given-bare = Initialer uden punktum: JM
style-given-bare-spaced = Initialer uden punktum: J M
style-family-first = Efternavnet først
style-family-first-none = For ingen: John Foley
style-family-first-first = For den første forfatter: Foley, John, og Robert Fowler
style-family-first-all = For alle: Foley, John, og Fowler, Robert
style-sort-separator = Mellem efternavn og fornavn
style-sort-separator-hint = Når efternavnet kommer først

## Common changes: the citation, or the note, and the entries of the bibliography.

style-the-citation = Kildehenvisningen
style-the-note = Noten
style-begins-with = Begynder med
style-ends-with = Slutter med
style-between-works = Mellem værker, der citeres sammen
style-collapse = Værker af én forfatter, citeret sammen
style-collapse-none = Hvert fuldt ud
style-collapse-year = Navnet én gang: Nagy 1979, 1996
style-collapse-year-suffix = Og året én gang: Nagy 1979a, b
style-collapse-year-suffix-ranged = Med intervaller: Nagy 1979a–c
style-collapse-citation-number = Numre som intervaller: [1–3]
style-disambiguate = Når to værker ville blive citeret ens
style-disambiguate-year-suffix = Føj et bogstav til året
style-disambiguate-names = Nævn flere forfattere
style-disambiguate-given-names = Tilføj fornavne eller initialer
style-near-note = En note regnes som nær inden for
style-near-note-hint = Noter; for stile, der forkorter det, der blev citeret i nærheden
style-entries = Posterne
style-entry-ends-with = Hver slutter med
style-author-repeated = For en gentaget forfatter
style-author-repeated-hint = I stedet for navnet, i posterne efter den første
style-hanging-indent = Hængende indrykning
style-hanging-indent-hint = Dokumentformatet afgør hvor dybt
style-second-field = Numre eller mærkater står
style-second-field-line = I linjen
style-second-field-column = I en spalte for sig
style-second-field-margin = I margenen
style-second-field-hint = For stile, der nummererer deres poster

## Common changes: throughout the style.

style-throughout = Overalt
style-page-ranges = Sideintervaller
style-page-ranges-as-entered = Som indtastet
style-page-ranges-expanded = Fuldt ud: 321–328
style-page-ranges-minimal = Kortest: 321–8
style-page-ranges-minimal-two = Mindst to cifre: 321–28
style-page-ranges-chicago = Som Chicago Manual har det
style-particles = »van«, »de«, »von« foran et efternavn
style-particles-never = Bliver ved det og sorteres under v, d
style-particles-sort-only = Bliver ved det, men sorteres ikke efter
style-particles-display-and-sort = Kommer efter fornavnet: Gogh, Vincent van
style-hyphen = En bindestreg mellem initialer
style-hyphen-hint = J.-P. Sartre, ikke J.P. Sartre
style-locale = Stilens ord er på
style-locale-document = Dokumentets sprog
style-locale-hint = »red.«, »i«, »hentet«, månederne

## Part by part.

# The scope is citation or bibliography.
style-parts-of = { $scope ->
    [citation] Kildehenvisningens dele
   *[bibliography] Litteraturlistens dele
}
style-parts-none = { $scope ->
    [citation] Denne stil har ingen kildehenvisning.
   *[bibliography] Denne stil har ingen litteraturliste.
}
style-parts-hint = Vælg en del til venstre for at ændre, hvordan den trykkes: hvad der står før og efter den, dens skrift, dens store bogstaver. Dele åbnes for at vise, hvad de består af.
style-part-unfold = Åbn
style-part-fold = Luk
style-part-up = Flyt op
style-part-down = Flyt ned
style-part-add-after = Tilføj efter den
style-part-take-away = Fjern
style-part-add-within = Tilføj inden i den
# A part of a macro: a part of the style that is used in several places.
style-part-shared = Dette hører til »{ $macro }«, som bruges { $count } steder. En ændring her ses alle stederne.
style-add-words = Egne ord
style-add-words-hint = Såsom »i«, »hentet« eller tegnsætning
# Over the fields of a reference that a part can print.
style-add-from-reference = Fra referencen
style-part-words = Ordene
style-part-before = Før den
style-part-before-hint = Trykkes kun, når selve delen trykkes
style-part-after = Efter den
style-part-between = Mellem dens dele
style-slant = Hældning
style-slant-upright = Opret
style-slant-italic = Kursiv
style-weight = Vægt
style-weight-regular = Normal
style-weight-bold = Fed
style-letters = Bogstaver
style-letters-as-written = Som skrevet
style-letters-small-caps = Kapitæler
style-case = Store bogstaver
style-case-as-entered = Som indtastet
style-case-title = Engelsk titelform
style-case-sentence = Sætningsform
style-case-capitalize-first = Stort begyndelsesbogstav
style-case-capitalize-all = Stort Begyndelsesbogstav I Hvert Ord
style-case-uppercase = STORE BOGSTAVER
style-case-lowercase = små bogstaver
style-height = Højde
style-height-baseline = På linjen
style-height-raised = Hævet
style-height-lowered = Sænket
style-quotes = I anførselstegn
style-strip-periods = Uden punktummer
style-strip-periods-hint = For forkortelser: »red« for »red.«
style-text-form = Form
style-text-form-long = Fuldt ud
style-text-form-short = Kort, hvor referencen har en
style-term-form = Ordets form
style-term-form-long = Fuldt ud: redaktør, side
style-term-form-short = Kort: red., s.
style-term-form-verb = Som verbum: redigeret af
style-term-form-verb-short = Som verbum, kort: red. af
style-term-form-symbol = Som tegn: §
style-date-parts = Datoen angives
style-date-parts-year = Kun som år
style-date-parts-year-month = Som år og måned
style-date-parts-full = Fuldt ud

## The source of the style, and the sample it is tried on.

style-source = Stilens kilde
style-source-try = Prøv den
style-source-unread = Kilden kunne ikke læses.
style-sample-unusable = Stilen kan ikke bruges, som den er
style-sample-failed = Stilen kunne ikke prøves.
style-sample-in-text = I teksten
style-sample-in-notes = I noterne
style-sample-in-bibliography = I litteraturlisten
style-sample-cited = Et citeret værk
style-sample-same-page = Det samme, på en side
style-sample-another = Et andet, med et ord foran
style-sample-first-again = Det første igen, på et kapitel
style-sample-together = To værker sammen
style-sample-in-sentence = Med forfatteren i sætningen
style-sample-examples = Vist på eksempler: dit bibliotek er tomt.
style-sample-library = Vist på værker fra dit bibliotek.

## The source of a style, where it cannot be read as one.

style-source-not-xml = Kilden er ikke velformet XML.
style-source-not-style = Dette er ikke en stil: den begynder ikke med <style>.
style-source-dependent = Stilen har ingen <citation>: den nævner kun en anden stil og kan ikke ændres.

## The parts of a style, as the style editor tells them in words.

style-part-layout = Helheden
style-part-text = Tekst
# A part that prints a word of the style's language: the term is its name in CSL.
style-part-term = Ordet for »{ $term }«
# A part that prints words written into the style.
style-part-value = Ordene »{ $value }«
style-part-name = Hvordan navnene skrives
# The name is family or given, as CSL has them.
style-part-name-part = { $name ->
    [family] Efternavnet
    [given] Fornavnet
   *[other] Navnet ({ $name })
}
style-part-et-al = »et al.«
# The variables are one or more of those below: "the pages".
style-part-label = Ordet foran { $variables } (»s.«, »red.«)
style-part-role = Ordet for rollen (»red.«, »overs.«)
style-part-substitute = Når der ikke er et sådant navn, i stedet
# The name is day, month or year, as CSL has them, or part.
style-part-date-part = { $name ->
    [day] Dagen
    [month] Måneden
    [year] Året
   *[other] Delen ({ $name })
}
style-part-group = Sammen
style-part-choose = Én af disse
# The condition is made of those below.
style-part-if = Hvis { $condition }
style-part-else-if = Eller ellers, hvis { $condition }
style-part-else = Ellers
# A name the style has, of a part of it (a macro) or of a variable it does not know.
style-quoted = »{ $text }«

## Words that join others: "the author, or else the editor", "a book or a chapter".
## The first may be a list of several, joined by commas.

style-or = { $first } eller { $last }
style-and = { $first } og { $last }
style-or-else = { $first }, eller ellers { $last }

## When a part of a style is printed: "If the work is a book".

style-if-type = værket er { $types }
style-if-has = det har { $variables }
style-if-lacks = det mangler { $variables }
style-if-numeric = { $variables } er et tal
style-if-uncertain = { $variables } er usikker
# The places are pages, chapters, verses and the like; see style-locator.
style-if-locator = det citerede sted er { $locators }
style-if-disambiguate = det ellers ville blive forvekslet med et andet
style-if-always = altid
style-if-none-holds = intet af dette gælder: { $conditions }
# A kind of place that a citation points to, as CSL names it: page, chapter, verse,
# sub-verbo, and so on. English leaves the names as they are.
style-locator = { $name ->
    [act] en akt
    [appendix] et appendiks
    [article-locator] en artikel
    [book] en bog
    [canon] en kanon
    [chapter] et kapitel
    [column] en spalte
    [elocation] et elektronisk sted
    [equation] en ligning
    [figure] en figur
    [folio] et blad
    [issue] et hæfte
    [line] en linje
    [note] en note
    [opus] et opus
    [page] en side
    [paragraph] et afsnit
    [part] en del
    [rule] en regel
    [scene] en scene
    [section] en paragraf
    [sub-verbo] et opslagsord
    [supplement] et tillæg
    [table] en tabel
    [timestamp] et tidspunkt
    [title-locator] en titel
    [verse] et vers
    [volume] et bind
   *[other] { $name }
}

## When a citation is printed, by where it stands among the others.

style-position-first = det citeres for første gang
style-position-subsequent = det er citeret før
style-position-ibid = det er det samme som den foregående kildehenvisning
style-position-ibid-with-locator = det er det samme som den foregående kildehenvisning, på et andet sted
style-position-near-note = det blev citeret i en note i nærheden

## How a part is set: "italic, in quotation marks, before “, ”".

style-form-italic = kursiv
style-form-bold = fed
style-form-small-caps = kapitæler
style-form-underlined = understreget
style-form-quoted = i anførselstegn
# How the letters are set, as CSL names it; the words are that name with spaces for its dashes.
style-form-case = { $case ->
    [lowercase] små bogstaver
    [uppercase] store bogstaver
    [capitalize-first] stort begyndelsesbogstav
    [capitalize-all] stort begyndelsesbogstav i hvert ord
    [sentence] sætningsform
    [title] titelform
   *[other] { $words }
}
style-form-raised = hævet
style-form-lowered = sænket
# The part comes after these words.
style-form-after = efter »{ $text }«
# The part comes before these words.
style-form-before = før »{ $text }«
style-form-between = med »{ $text }« imellem

## The kinds of work a reference is of, as CSL names them.

style-type-book = en bog
style-type-chapter = et kapitel
style-type-article-journal = en artikel i et tidsskrift
style-type-article-magazine = en artikel i et magasin
style-type-article-newspaper = en artikel i en avis
style-type-article = en artikel
style-type-thesis = en afhandling
style-type-report = en rapport
style-type-webpage = en webside
style-type-paper-conference = et konferencebidrag
style-type-entry-encyclopedia = et opslag i en encyklopædi
style-type-entry-dictionary = et opslag i en ordbog
style-type-entry = et opslag
style-type-review = en anmeldelse
style-type-review-book = en boganmeldelse
style-type-manuscript = et manuskript
style-type-personal_communication = et brev eller anden meddelelse
style-type-legal_case = en retsafgørelse
style-type-legislation = lovgivning
style-type-bill = et lovforslag
style-type-patent = et patent
style-type-dataset = et datasæt
style-type-software = software
style-type-motion_picture = en film
style-type-broadcast = en udsendelse
style-type-song = en indspilning
style-type-speech = en forelæsning
style-type-interview = et interview
style-type-graphic = et billede
style-type-map = et landkort
style-type-pamphlet = en pjece
style-type-post-weblog = et blogindlæg
style-type-post = et indlæg
style-type-classic = et klassisk værk
style-type-collection = en samling
style-type-document = et dokument
style-type-standard = en standard
style-type-treaty = en traktat
style-type-periodical = et tidsskrift
style-type-musical_score = et partitur
style-type-figure = en figur
style-type-event = en begivenhed
style-type-performance = en opførelse
style-type-regulation = en forordning
style-type-hearing = en høring

## What a reference has, as CSL names it: with its article, and without it
## (.bare) as a field of a reference is named.

style-variable-title = titlen
    .bare = titel
style-variable-title-short = den korte titel
    .bare = kort titel
style-variable-container-title = tidsskriftets eller bogens titel
    .bare = tidsskriftets eller bogens titel
style-variable-container-title-short = tidsskriftets korte titel
    .bare = tidsskriftets korte titel
style-variable-collection-title = serien
    .bare = serie
style-variable-collection-number = nummeret i serien
    .bare = nummer i serien
style-variable-original-title = originaltitlen
    .bare = originaltitel
style-variable-reviewed-title = titlen på det anmeldte værk
    .bare = titel på det anmeldte værk
style-variable-author = forfatteren
    .bare = forfatter
style-variable-editor = redaktøren
    .bare = redaktør
style-variable-translator = oversætteren
    .bare = oversætter
style-variable-container-author = bogens forfatter
    .bare = bogens forfatter
style-variable-collection-editor = seriens redaktør
    .bare = seriens redaktør
style-variable-editorial-director = den redaktionelle leder
    .bare = redaktionel leder
style-variable-original-author = den oprindelige forfatter
    .bare = oprindelig forfatter
style-variable-reviewed-author = forfatteren af det anmeldte værk
    .bare = forfatter af det anmeldte værk
style-variable-interviewer = intervieweren
    .bare = interviewer
style-variable-recipient = modtageren
    .bare = modtager
style-variable-director = instruktøren
    .bare = instruktør
style-variable-composer = komponisten
    .bare = komponist
style-variable-illustrator = illustratoren
    .bare = illustrator
style-variable-issued = datoen
    .bare = dato
style-variable-accessed = datoen for adgang
    .bare = dato for adgang
style-variable-original-date = den oprindelige dato
    .bare = oprindelig dato
style-variable-event-date = begivenhedens dato
    .bare = begivenhedens dato
style-variable-submitted = indsendelsesdatoen
    .bare = indsendelsesdato
style-variable-volume = bindet
    .bare = bind
style-variable-number-of-volumes = antallet af bind
    .bare = antal bind
style-variable-issue = hæftet
    .bare = hæfte
style-variable-edition = udgaven
    .bare = udgave
style-variable-page = siderne
    .bare = sider
style-variable-page-first = den første side
    .bare = første side
style-variable-number-of-pages = sideantallet
    .bare = sideantal
style-variable-number = nummeret
    .bare = nummer
style-variable-chapter = kapitlet
    .bare = kapitel
style-variable-chapter-number = kapitlets nummer
    .bare = kapitlets nummer
style-variable-publisher = forlaget
    .bare = forlag
style-variable-publisher-place = udgivelsesstedet
    .bare = udgivelsessted
style-variable-original-publisher = det oprindelige forlag
    .bare = oprindeligt forlag
style-variable-original-publisher-place = det oprindelige udgivelsessted
    .bare = oprindeligt udgivelsessted
style-variable-locator = det citerede sted
    .bare = citeret sted
style-variable-citation-number = kildehenvisningens nummer
    .bare = kildehenvisningens nummer
style-variable-citation-label = kildehenvisningens mærkat
    .bare = kildehenvisningens mærkat
style-variable-year-suffix = bogstavet efter året
    .bare = bogstav efter året
style-variable-first-reference-note-number = nummeret på den note, hvor det først blev citeret
    .bare = nummer på den note, hvor det først blev citeret
style-variable-DOI = DOI'en
    .bare = DOI
style-variable-URL = adressen
    .bare = adresse
style-variable-ISBN = ISBN'et
    .bare = ISBN
style-variable-ISSN = ISSN'et
    .bare = ISSN
style-variable-PMID = PMID'et
    .bare = PMID
style-variable-genre = værkets art
    .bare = værkets art
style-variable-medium = mediet
    .bare = medie
style-variable-note = noten
    .bare = note
style-variable-annote = annotationen
    .bare = annotation
style-variable-abstract = resuméet
    .bare = resumé
style-variable-archive = arkivet
    .bare = arkiv
style-variable-archive_location = stedet i arkivet
    .bare = sted i arkivet
style-variable-archive-place = arkivets sted
    .bare = arkivets sted
style-variable-authority = myndigheden
    .bare = myndighed
style-variable-call-number = opstillingssignaturen
    .bare = opstillingssignatur
style-variable-event = begivenheden
    .bare = begivenhed
style-variable-event-place = begivenhedens sted
    .bare = begivenhedens sted
style-variable-event-title = begivenhedens titel
    .bare = begivenhedens titel
style-variable-section = afsnittet
    .bare = afsnit
style-variable-source = kilden
    .bare = kilde
style-variable-status = udgivelsesstatus
    .bare = udgivelsesstatus
style-variable-version = versionen
    .bare = version
style-variable-language = sproget
    .bare = sprog
style-variable-dimensions = målene
    .bare = mål
style-variable-scale = målestokken
    .bare = målestok
style-variable-references = referencerne
    .bare = referencer
style-variable-keyword = nøgleordene
    .bare = nøgleord
style-variable-jurisdiction = jurisdiktionen
    .bare = jurisdiktion
