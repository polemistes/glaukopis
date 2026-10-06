# Reference styles: their kinds, the search for more, and the style editor,
# with the words it tells the parts of a style by.

## The kinds of reference style, as the styles are grouped by them.

style-kind-note = Note
style-kind-author-date = Autore e data
style-kind-numeric = Numeri
style-kind-label = Etichette
style-kind-author = Autore
style-kind-other = Altri

## The search for reference styles of journals and publishers.

style-browser = Stili di citazione
style-browser-subtitle = Più di diecimila stili di riviste ed editori, per nome
style-browser-placeholder = Il nome di una rivista, di un editore o di uno stile
style-browser-search = Cerca stili
# Beside a style that has been fetched already.
style-browser-here = Qui
style-browser-fetch = Scarica
style-browser-none-found = Nessuno stile ha queste parole nel nome.
style-browser-about = Gli stili sono scaricati dal repository del progetto Citation Style Language e tenuti con i tuoi. Quelli che hai si possono modificare secondo i desideri di un editore nell'editor degli stili.
style-browser-import = Importa un file…
style-browser-import-title = Importa uno stile di citazione
style-browser-fetch-failed = Lo stile non si è potuto scaricare.
style-browser-file-unread = Il file non si è potuto leggere.

## The style editor.

style-editor = Stile di citazione
style-name = Nome dello stile
# The name a style of one's own is first given, made from that of the style it is made from.
style-name-changed = { $name }, modificato
style-depth = Quanto a fondo
style-depth-options = Modifiche comuni
style-depth-parts = Parte per parte
style-depth-source = Sorgente
style-scope = Che cosa modificare
style-scope-citations = Citazioni
style-scope-notes = Note
style-scope-bibliography = Bibliografia
style-bundled = Gli stili che vengono con Glaukopis restano come sono. Le tue modifiche sono salvate come uno stile tuo.
style-delete = Elimina questo stile
style-save-own = Salva come mio
style-saved = «{ $name }» è salvato tra i tuoi stili
style-read-failed = Lo stile non si è potuto leggere.
style-save-failed = Lo stile non si è potuto salvare.
style-delete-failed = Lo stile non si è potuto eliminare.
style-delete-title = Eliminare lo stile «{ $name }»?
style-delete-message = Le mappe che lo usano useranno invece un altro stile.
style-delete-confirm = Elimina lo stile
style-leave-title = Uscire senza salvare?
style-leave-message = Le modifiche che hai fatto allo stile andranno perdute.
style-leave-confirm = Esci
style-leave-cancel = Continua a modificare

## Common changes: names.

style-names = Nomi
# A sentence with two fields in it, where numbers are written: the least number of
# authors for which "et al." is used, and how many are named before it.
style-et-al = Con { $min } autori o più, dai i primi { $first } e «et al.»
style-et-al-min = Numero di autori da cui si usa et al.
style-et-al-first = Numero di autori dati prima di et al.
style-et-al-empty = Lasciato vuoto, si nominano tutti
# As the one before, for a work that has been cited before.
style-et-al-again = Quando è citato di nuovo, con { $min } o più dai i primi { $first }
style-et-al-again-min = Numero di autori da cui si usa et al. nelle citazioni successive
style-et-al-again-first = Numero di autori dati nelle citazioni successive
style-et-al-again-empty = Lasciato vuoto, come la prima volta
style-before-last-name = Prima dell'ultimo nome
# The word the style prints there, in the language of the document.
style-and-word = e
style-and-nothing = Nulla
style-as-the-style-has-it = Come ha lo stile
style-comma-before-last = Una virgola prima
style-comma-contextual = Con tre nomi o più: A, B, e C
style-comma-always = Sempre: A, e B
style-comma-never = Mai: A, B e C
style-comma-after-inverted = Dopo un nome rovesciato
style-given-names = Nomi
style-given-full = Per intero: John Miles
style-given-spaced = Iniziali: J. M.
style-given-close = Iniziali, attaccate: J.M.
style-given-bare = Iniziali senza punti: JM
style-given-bare-spaced = Iniziali senza punti: J M
style-family-first = Prima il cognome
style-family-first-none = Per nessuno: John Foley
style-family-first-first = Per il primo autore: Foley, John, e Robert Fowler
style-family-first-all = Per tutti: Foley, John, e Fowler, Robert
style-sort-separator = Tra cognome e nome
style-sort-separator-hint = Quando il cognome viene prima

## Common changes: the citation, or the note, and the entries of the bibliography.

style-the-citation = La citazione
style-the-note = La nota
style-begins-with = Comincia con
style-ends-with = Finisce con
style-between-works = Tra opere citate insieme
style-collapse = Opere di uno stesso autore citate insieme
style-collapse-none = Ciascuna per intero
style-collapse-year = Il nome una volta: Nagy 1979, 1996
style-collapse-year-suffix = E l'anno una volta: Nagy 1979a, b
style-collapse-year-suffix-ranged = Con intervalli: Nagy 1979a–c
style-collapse-citation-number = Numeri come intervalli: [1–3]
style-disambiguate = Quando due opere si citerebbero allo stesso modo
style-disambiguate-year-suffix = Aggiungi una lettera all'anno
style-disambiguate-names = Nomina più autori
style-disambiguate-given-names = Aggiungi nomi o iniziali
style-near-note = Una nota conta come vicina entro
style-near-note-hint = Note; per gli stili che abbreviano ciò che è citato poco prima
style-entries = Le voci
style-entry-ends-with = Ciascuna finisce con
style-author-repeated = Per un autore ripetuto
style-author-repeated-hint = Al posto del nome, nelle voci dopo la prima
style-hanging-indent = Rientro sporgente
style-hanging-indent-hint = Quanto profondo lo decide il formato del documento
style-second-field = Numeri o etichette stanno
style-second-field-line = Nel rigo
style-second-field-column = In una colonna a sé
style-second-field-margin = Nel margine
style-second-field-hint = Per gli stili che numerano le voci

## Common changes: throughout the style.

style-throughout = In tutto lo stile
style-page-ranges = Intervalli di pagine
style-page-ranges-as-entered = Come inseriti
style-page-ranges-expanded = Per intero: 321–328
style-page-ranges-minimal = Più corti possibile: 321–8
style-page-ranges-minimal-two = Almeno due cifre: 321–28
style-page-ranges-chicago = Come vuole il Chicago Manual
style-particles = «van», «de», «von» davanti a un cognome
style-particles-never = Restano con esso, e si ordinano sotto v, d
style-particles-sort-only = Restano con esso, ma non contano nell'ordinamento
style-particles-display-and-sort = Vanno dopo il nome: Gogh, Vincent van
style-hyphen = Un trattino tra le iniziali
style-hyphen-hint = J.-P. Sartre, non J.P. Sartre
style-locale = Le parole dello stile sono in
style-locale-document = La lingua del documento
style-locale-hint = «a cura di», «in», «consultato», i mesi

## Part by part.

# The scope is citation or bibliography.
style-parts-of = { $scope ->
    [citation] Parti della citazione
   *[bibliography] Parti della bibliografia
}
style-parts-none = { $scope ->
    [citation] Questo stile non ha citazione.
   *[bibliography] Questo stile non ha bibliografia.
}
style-parts-hint = Scegli una parte a sinistra per cambiare come è stampata: che cosa sta prima e dopo, il suo carattere, le sue maiuscole. Le parti si aprono per mostrare di che cosa sono fatte.
style-part-unfold = Apri
style-part-fold = Chiudi
style-part-up = Sposta su
style-part-down = Sposta giù
style-part-add-after = Aggiungi dopo
style-part-take-away = Togli
style-part-add-within = Aggiungi dentro
# A part of a macro: a part of the style that is used in several places.
style-part-shared = Questo appartiene a «{ $macro }», che è usato in { $count } punti. Una modifica qui si vede in tutti.
style-add-words = Parole mie
style-add-words-hint = Come «in», «consultato», o punteggiatura
# Over the fields of a reference that a part can print.
style-add-from-reference = Dal riferimento
style-part-words = Le parole
style-part-before = Prima
style-part-before-hint = Stampato solo quando lo è la parte stessa
style-part-after = Dopo
style-part-between = Tra le sue parti
style-slant = Inclinazione
style-slant-upright = Tondo
style-slant-italic = Corsivo
style-weight = Peso
style-weight-regular = Normale
style-weight-bold = Grassetto
style-letters = Lettere
style-letters-as-written = Come scritte
style-letters-small-caps = Maiuscoletto
style-case = Maiuscole
style-case-as-entered = Come inserito
style-case-title = Iniziali Maiuscole Come In Un Titolo
style-case-sentence = Come in una frase
style-case-capitalize-first = Prima lettera maiuscola
style-case-capitalize-all = Ogni Parola Maiuscola
style-case-uppercase = MAIUSCOLE
style-case-lowercase = minuscole
style-height = Altezza
style-height-baseline = Sulla riga
style-height-raised = In apice
style-height-lowered = In pedice
style-quotes = Tra virgolette
style-strip-periods = Senza punti
style-strip-periods-hint = Per le abbreviazioni: «ed» per «ed.»
style-text-form = Forma
style-text-form-long = Per intero
style-text-form-short = Breve, dove il riferimento ne ha una
style-term-form = Forma della parola
style-term-form-long = Per intero: curatore, pagina
style-term-form-short = Breve: cur., p.
style-term-form-verb = Come verbo: a cura di
style-term-form-verb-short = Come verbo, breve: a c. di
style-term-form-symbol = Come segno: §
style-date-parts = La data è data
style-date-parts-year = Solo come anno
style-date-parts-year-month = Come anno e mese
style-date-parts-full = Per intero

## The source of the style, and the sample it is tried on.

style-source = Sorgente dello stile
style-source-try = Provalo
style-source-unread = La sorgente non si è potuta leggere.
style-sample-unusable = Lo stile non si può usare com'è
style-sample-failed = Lo stile non si è potuto provare.
style-sample-in-text = Nel testo
style-sample-in-notes = Nelle note
style-sample-in-bibliography = Nella bibliografia
style-sample-cited = Un'opera citata
style-sample-same-page = La stessa, a una pagina
style-sample-another = Un'altra, con una parola davanti
style-sample-first-again = Di nuovo la prima, a un capitolo
style-sample-together = Due opere insieme
style-sample-in-sentence = Con l'autore nella frase
style-sample-examples = Mostrato su esempi: la tua biblioteca è vuota.
style-sample-library = Mostrato su opere della tua biblioteca.

## The source of a style, where it cannot be read as one.

style-source-not-xml = La sorgente non è XML ben formato.
style-source-not-style = Questo non è uno stile: non comincia con <style>.
style-source-dependent = Lo stile non ha <citation>: nomina soltanto un altro stile, e non si può modificare.

## The parts of a style, as the style editor tells them in words.

style-part-layout = L'insieme
style-part-text = Testo
# A part that prints a word of the style's language: the term is its name in CSL.
style-part-term = La parola per «{ $term }»
# A part that prints words written into the style.
style-part-value = Le parole «{ $value }»
style-part-name = Come sono scritti i nomi
# The name is family or given, as CSL has them.
style-part-name-part = { $name ->
    [family] Il cognome
    [given] Il nome
   *[other] Il nome { $name }
}
style-part-et-al = «et al.»
# The variables are one or more of those below: "the pages".
style-part-label = La parola davanti a { $variables } («p.», «cur.»)
style-part-role = La parola per il ruolo («cur.», «trad.»)
style-part-substitute = Quando non c'è un nome così, al suo posto
# The name is day, month or year, as CSL has them, or part.
style-part-date-part = { $name ->
    [day] Il giorno
    [month] Il mese
    [year] L'anno
   *[other] Il { $name }
}
style-part-group = Insieme
style-part-choose = Uno di questi
# The condition is made of those below.
style-part-if = Se { $condition }
style-part-else-if = Oppure, se { $condition }
style-part-else = Altrimenti
# A name the style has, of a part of it (a macro) or of a variable it does not know.
style-quoted = «{ $text }»

## Words that join others: "the author, or else the editor", "a book or a chapter".
## The first may be a list of several, joined by commas.

style-or = { $first } o { $last }
style-and = { $first } e { $last }
style-or-else = { $first }, oppure { $last }

## When a part of a style is printed: "If the work is a book".

style-if-type = l'opera è { $types }
style-if-has = ha { $variables }
style-if-lacks = non ha { $variables }
style-if-numeric = { $variables } è un numero
style-if-uncertain = { $variables } è incerto
# The places are pages, chapters, verses and the like; see style-locator.
style-if-locator = il luogo citato è { $locators }
style-if-disambiguate = altrimenti si scambierebbe con un'altra
style-if-always = sempre
style-if-none-holds = nulla di questo vale: { $conditions }
# A kind of place that a citation points to, as CSL names it: page, chapter, verse,
# sub-verbo, and so on. English leaves the names as they are.
style-locator = di tipo «{ $name }»

## When a citation is printed, by where it stands among the others.

style-position-first = è citata per la prima volta
style-position-subsequent = è già stata citata
style-position-ibid = è la stessa della citazione precedente
style-position-ibid-with-locator = è la stessa della citazione precedente, in un altro luogo
style-position-near-note = è stata citata in una nota vicina

## How a part is set: "italic, in quotation marks, before “, ”".

style-form-italic = corsivo
style-form-bold = grassetto
style-form-small-caps = maiuscoletto
style-form-underlined = sottolineato
style-form-quoted = tra virgolette
# How the letters are set, as CSL names it; the words are that name with spaces for its dashes.
style-form-case = { $case ->
    [lowercase] minuscole
    [uppercase] maiuscole
    [capitalize-first] prima lettera maiuscola
    [capitalize-all] ogni parola maiuscola
    [sentence] come una frase
    [title] come un titolo
   *[other] { $words }
}
style-form-raised = in apice
style-form-lowered = in pedice
# The part comes after these words.
style-form-after = dopo «{ $text }»
# The part comes before these words.
style-form-before = prima di «{ $text }»
style-form-between = con «{ $text }» in mezzo

## The kinds of work a reference is of, as CSL names them.

style-type-book = un libro
style-type-chapter = un capitolo
style-type-article-journal = un articolo di rivista
style-type-article-magazine = un articolo di periodico
style-type-article-newspaper = un articolo di giornale
style-type-article = un articolo
style-type-thesis = una tesi
style-type-report = un rapporto
style-type-webpage = una pagina web
style-type-paper-conference = una relazione a un convegno
style-type-entry-encyclopedia = una voce di enciclopedia
style-type-entry-dictionary = una voce di dizionario
style-type-entry = una voce
style-type-review = una recensione
style-type-review-book = una recensione di un libro
style-type-manuscript = un manoscritto
style-type-personal_communication = una lettera o altra comunicazione
style-type-legal_case = una sentenza
style-type-legislation = legislazione
style-type-bill = un disegno di legge
style-type-patent = un brevetto
style-type-dataset = un insieme di dati
style-type-software = software
style-type-motion_picture = un film
style-type-broadcast = una trasmissione
style-type-song = una registrazione
style-type-speech = una lezione
style-type-interview = un'intervista
style-type-graphic = un'immagine
style-type-map = una carta geografica
style-type-pamphlet = un opuscolo
style-type-post-weblog = un articolo di blog
style-type-post = un post
style-type-classic = un'opera classica
style-type-collection = una raccolta
style-type-document = un documento
style-type-standard = una norma tecnica
style-type-treaty = un trattato
style-type-periodical = un periodico
style-type-musical_score = una partitura
style-type-figure = una figura
style-type-event = un evento
style-type-performance = uno spettacolo
style-type-regulation = un regolamento
style-type-hearing = un'audizione

## What a reference has, as CSL names it: with its article, and without it
## (.bare) as a field of a reference is named.

style-variable-title = il titolo
    .bare = titolo
style-variable-title-short = il titolo breve
    .bare = titolo breve
style-variable-container-title = il titolo della rivista o del libro
    .bare = titolo della rivista o del libro
style-variable-container-title-short = il titolo breve della rivista
    .bare = titolo breve della rivista
style-variable-collection-title = la collana
    .bare = collana
style-variable-collection-number = il numero nella collana
    .bare = numero nella collana
style-variable-original-title = il titolo originale
    .bare = titolo originale
style-variable-reviewed-title = il titolo dell'opera recensita
    .bare = titolo dell'opera recensita
style-variable-author = l'autore
    .bare = autore
style-variable-editor = il curatore
    .bare = curatore
style-variable-translator = il traduttore
    .bare = traduttore
style-variable-container-author = l'autore del libro
    .bare = autore del libro
style-variable-collection-editor = il curatore della collana
    .bare = curatore della collana
style-variable-editorial-director = il direttore editoriale
    .bare = direttore editoriale
style-variable-original-author = l'autore originale
    .bare = autore originale
style-variable-reviewed-author = l'autore dell'opera recensita
    .bare = autore dell'opera recensita
style-variable-interviewer = l'intervistatore
    .bare = intervistatore
style-variable-recipient = il destinatario
    .bare = destinatario
style-variable-director = il regista
    .bare = regista
style-variable-composer = il compositore
    .bare = compositore
style-variable-illustrator = l'illustratore
    .bare = illustratore
style-variable-issued = la data
    .bare = data
style-variable-accessed = la data di consultazione
    .bare = data di consultazione
style-variable-original-date = la data originale
    .bare = data originale
style-variable-event-date = la data dell'evento
    .bare = data dell'evento
style-variable-submitted = la data di invio
    .bare = data di invio
style-variable-volume = il volume
    .bare = volume
style-variable-number-of-volumes = il numero di volumi
    .bare = numero di volumi
style-variable-issue = il fascicolo
    .bare = fascicolo
style-variable-edition = l'edizione
    .bare = edizione
style-variable-page = le pagine
    .bare = pagine
style-variable-page-first = la prima pagina
    .bare = prima pagina
style-variable-number-of-pages = il numero di pagine
    .bare = numero di pagine
style-variable-number = il numero
    .bare = numero
style-variable-chapter = il capitolo
    .bare = capitolo
style-variable-chapter-number = il numero del capitolo
    .bare = numero del capitolo
style-variable-publisher = l'editore
    .bare = editore
style-variable-publisher-place = il luogo di pubblicazione
    .bare = luogo di pubblicazione
style-variable-original-publisher = l'editore originale
    .bare = editore originale
style-variable-original-publisher-place = il luogo di pubblicazione originale
    .bare = luogo di pubblicazione originale
style-variable-locator = il luogo citato
    .bare = luogo citato
style-variable-citation-number = il numero della citazione
    .bare = numero della citazione
style-variable-citation-label = l'etichetta della citazione
    .bare = etichetta della citazione
style-variable-year-suffix = la lettera dopo l'anno
    .bare = lettera dopo l'anno
style-variable-first-reference-note-number = il numero della nota in cui è citata la prima volta
    .bare = numero della nota in cui è citata la prima volta
style-variable-DOI = il DOI
    .bare = DOI
style-variable-URL = l'indirizzo
    .bare = indirizzo
style-variable-ISBN = l'ISBN
    .bare = ISBN
style-variable-ISSN = l'ISSN
    .bare = ISSN
style-variable-PMID = il PMID
    .bare = PMID
style-variable-genre = il tipo di opera
    .bare = tipo di opera
style-variable-medium = il supporto
    .bare = supporto
style-variable-note = la nota
    .bare = nota
style-variable-annote = l'annotazione
    .bare = annotazione
style-variable-abstract = l'abstract
    .bare = abstract
style-variable-archive = l'archivio
    .bare = archivio
style-variable-archive_location = la collocazione nell'archivio
    .bare = collocazione nell'archivio
style-variable-archive-place = il luogo dell'archivio
    .bare = luogo dell'archivio
style-variable-authority = l'autorità
    .bare = autorità
style-variable-call-number = la segnatura
    .bare = segnatura
style-variable-event = l'evento
    .bare = evento
style-variable-event-place = il luogo dell'evento
    .bare = luogo dell'evento
style-variable-event-title = il titolo dell'evento
    .bare = titolo dell'evento
style-variable-section = la sezione
    .bare = sezione
style-variable-source = la fonte
    .bare = fonte
style-variable-status = lo stato di pubblicazione
    .bare = stato di pubblicazione
style-variable-version = la versione
    .bare = versione
style-variable-language = la lingua
    .bare = lingua
style-variable-dimensions = le dimensioni
    .bare = dimensioni
style-variable-scale = la scala
    .bare = scala
style-variable-references = i riferimenti
    .bare = riferimenti
style-variable-keyword = le parole chiave
    .bare = parole chiave
style-variable-jurisdiction = la giurisdizione
    .bare = giurisdizione
