# The editor of texts: the tools for writing, citations and notes.
# See locales/README.md.

## The marks and the kinds of paragraph, in the bar over a selection and in
## the tools over the text.

editor-format = Formato
editor-writing = Scrittura
editor-italic = Corsivo
editor-bold = Grassetto
editor-small-capitals = Maiuscoletto
editor-superscript = Apice
editor-subscript = Pedice
editor-struck = Barrato
editor-quotation = Citazione
editor-block-quotation = Citazione a blocco
editor-list = Elenco
editor-text = Testo
editor-text-hint = Un paragrafo
editor-quotation-hint = Staccata dal testo
editor-list-hint = Con un segno davanti a ogni punto
editor-numbered-list = Elenco numerato
editor-numbered-list-hint = Con un numero davanti a ogni punto
editor-verse = Versi
editor-verse-hint = Versi di poesia o di teatro, ciascuno tenuto su una riga
editor-speaker = Chi parla
editor-speaker-hint = Chi parla, su una riga a sé
editor-direction = Didascalia scenica
editor-direction-hint = Ciò che si fa, in corsivo
editor-line-numbers = Numeri dei versi
editor-line-numbers-hint = Numera i versi di questo brano: da quale verso, e ogni quanti
editor-line-numbers-from = Numera i versi da
editor-line-numbers-none = Lascia vuoto per nessun numero
editor-line-numbers-every = Mostra un numero ogni
editor-line-numbers-number = Ci vuole un numero intero.
editor-kinds-text = Testo
editor-kinds-quotation = Citazione
editor-kinds-verse = Versi
editor-kinds-script = Sceneggiatura
editor-kinds-more = Altro
editor-kinds-words = Parole
editor-attribution = Attribuzione
editor-attribution-hint = Di chi sono le parole, sotto una citazione, a destra
editor-epigraph = Epigrafe
editor-epigraph-hint = Una citazione in testa a una parte
editor-headword = Lemma
editor-headword-hint = La parola che un glossario spiega
editor-gloss = Glossa
editor-gloss-hint = Che cosa significa il lemma
editor-code = Codice
editor-code-hint = Tenuto lettera per lettera, in lettere di larghezza uguale
editor-break = Stacco
editor-break-hint = Una pausa tra parti, con il segno che il formato le dà
editor-draft = Appunto di lavoro
editor-draft-hint = Per i tuoi occhi: non va in nessun documento
editor-foreign = Parole straniere
editor-foreign-hint = Parole in un'altra lingua, che l'ortografia segue
editor-title-of-work = Titolo di un'opera
editor-title-of-work-hint = Il titolo di un libro, un dramma, un quadro
editor-term = Termine
editor-term-hint = Un termine dove è usato per la prima volta
editor-mention = Menzione
editor-mention-hint = Una parola di cui si parla in quanto parola, tra virgolette
editor-highlight = Evidenziato
editor-highlight-hint = Per l'occhio sullo schermo: non va in nessun documento
editor-underline = Sottolineato
editor-code-words = Codice nel rigo
editor-code-words-hint = Lettere di larghezza uguale, dentro il rigo
editor-scene = Intestazione di scena
editor-scene-hint = INT. CASA – NOTTE
editor-action = Azione
editor-action-hint = Ciò che si vede e si fa
editor-character = Personaggio
editor-character-hint = Chi parla, sopra il dialogo
editor-dialogue = Dialogo
editor-dialogue-hint = Ciò che si dice
editor-parenthetical = Parentetica
editor-parenthetical-hint = Come lo si dice, tra parentesi
editor-transition = Transizione
editor-transition-hint = STACCO SU:, a destra
editor-comment = Commento
editor-comment-hint = Un commento su ciò che è selezionato
editor-comment-element-hint = Un commento su questo elemento; seleziona delle parole per commentarle
editor-parallel = Due testi affiancati
editor-parallel-hint = Un originale e la sua traduzione, ciascuno un testo a sé
editor-paragraph-kind = Tipo di paragrafo
# Said of the button that shows the kind of paragraph the cursor is in.
editor-paragraph-kind-now = Tipo di paragrafo: { $kind }

## The kind menu: the kinds in hand, the whole catalogue under "More…", and
## the format that sets them at its foot. The words menu, with the kinds of
## words. And a kind of the writer's own, in its dialog.

editor-kinds-menu-more = Altro…
editor-kinds-in-hand = Tipi a portata di mano
editor-kinds-own = I tuoi
editor-kinds-make = Crea un tipo…
editor-kinds-change-own = Modifica un tipo tuo…
# Over the item that opens the format editor: the format sets how each kind looks.
editor-kinds-set-by = Resi come li ha «{ $format }»
editor-kinds-change-format = Modifica il formato…
editor-kinds-change-format-hint = Come ogni tipo è reso in questo documento
editor-words = Parole
editor-words-hint = Sottolineato, apice, codice; parole straniere, il titolo di un'opera, un termine
editor-words-make = Crea un tipo di parole…
# Beside the language of the map, first among the languages foreign words may be in.
editor-foreign-of-map = La lingua della mappa
# What a kind of words is based on when it is based on no kind in particular.
editor-plain-words = Parole semplici
editor-own-kind-new = Un tipo tuo
editor-own-kind-change = Modifica il tipo
editor-own-kind-name = Nome
editor-own-kind-name-placeholder = Lettera, telegramma, preghiera…
editor-own-kind-words-placeholder = Nome di nave, latino, una parola chiave…
editor-own-kind-name-taken = C'è già un tipo con quel nome.
editor-own-kind-based-on = Basato su
editor-own-kind-based-on-hint = Ciò che non è detto qui sotto è come lo ha questo tipo
editor-own-kind-look = In che cosa differisce
editor-own-kind-create = Crea
editor-own-kind-delete-title = Eliminare il tipo «{ $name }»?
editor-own-kind-delete-message = { $count ->
    [0] Nessun testo è di questo tipo.
    [one] Ciò che ne è in un elemento resta com'è, ed è reso come testo nei documenti.
    [many] Ciò che ne è in { $count } elementi resta com'è, ed è reso come testo nei documenti.
   *[other] Ciò che ne è in { $count } elementi resta com'è, ed è reso come testo nei documenti.
}

## Citing, notes, and what is put into the text.

editor-cite = Cita
editor-cite-here = Cita un'opera qui
editor-cite-at-cursor = Cita un'opera dove sta il cursore
editor-note = Nota
editor-note-selection = Fai della selezione una nota
editor-note-hint = Una nota, a piè di pagina o alla fine
editor-insert = Inserisci
editor-insert-hint = Un'immagine, una tabella, matematica, un rimando
editor-new-element = Nuovo elemento
editor-new-element-hint = Un nuovo elemento dopo questo, o sotto di esso
editor-new-after = Nuovo elemento dopo questo
editor-new-under = Nuovo elemento sotto questo
editor-new-split = Dividi qui
editor-new-split-hint = Ciò che segue il cursore diventa un nuovo elemento
editor-spelling-on = L'ortografia è controllata mentre scrivi · premi per smettere
editor-spelling-off = L'ortografia non è controllata · premi per controllarla
editor-picture-file = Immagine da un file…
editor-picture-file-hint = Una figura, con ciò che se ne dice
editor-picture-store = Immagine dal deposito…
editor-picture-store-hint = Quelle che hai sono mostrate a lato
editor-equation = Equazione
editor-equation-hint = Matematica su una riga a sé
editor-table = Tabella…
editor-table-hint = Di tante righe e colonne
editor-table-file = Tabella da un file…
editor-table-file-hint = CSV, o un foglio di LibreOffice o di Excel
editor-formula = Formula
editor-formula-hint = Matematica nel rigo
editor-pointer = Rimando…
editor-pointer-hint = A una figura, una tabella, un'equazione o una parte: «vedi figura 2»
# What a picture that was pasted without a name of its own is called in the store of pictures.
editor-pasted-picture = immagine

## More.

editor-found = Citazioni trovate…
editor-found-count = { $count } da passare in rassegna, e di cui fare citazioni
editor-found-none = E testo che sembra una citazione, in questa mappa

## Choosing a work to cite.

editor-picker = Scegli un riferimento
editor-picker-placeholder = Cita: autore, titolo, anno
editor-picker-search = Cerca riferimenti
editor-picker-results = Riferimenti
editor-picker-in-project = In questo progetto
editor-picker-recent = Aggiunti di recente
editor-picker-empty = La tua biblioteca è vuota.
editor-picker-no-match = Nulla nella tua biblioteca contiene queste parole.
editor-picker-type = Scrivi per cercare nella tua biblioteca.
editor-picker-new = Nuovo riferimento…
editor-picker-import = Importa…

## A citation, and each work in it.

editor-citation = Citazione
editor-citation-add = Aggiungi un'opera
editor-citation-add-purpose = Aggiungi un'opera alla citazione
editor-citation-in-text = Autore nel testo: Nagy (1979)
editor-citation-remove = Togli la citazione
editor-citation-split = Separa le parole dalla citazione
editor-citation-split-hint = Le parole prima e dopo diventano testo del rigo, e ogni opera una citazione a sé, con la sua pagina e nient'altro
editor-citation-not-in-library = Questo riferimento non è nella tua biblioteca.
editor-citation-edit-reference = Modifica il riferimento
editor-citation-before = Prima
editor-citation-before-placeholder = vedi, cfr.
editor-citation-after = Dopo
editor-citation-after-placeholder = e passim
editor-citation-locator-kind = Tipo di luogo
editor-citation-suppress-author = L'autore è nominato nella mia frase: dai solo l'anno
editor-citation-remove-work = Togli quest'opera
# Stands in the text in place of a citation of a work that is in neither the library nor the project.
editor-citation-missing = [riferimento non trovato]
# Stands in the text in place of a citation of no work.
editor-citation-empty = (citazione)

## The kinds of place in a work a citation can point to, as the menu of a
## citation names them.

editor-locator-page = Pagina
editor-locator-chapter = Capitolo
editor-locator-section = Sezione
editor-locator-paragraph = Paragrafo
editor-locator-line = Riga
editor-locator-verse = Verso
editor-locator-book = Libro
editor-locator-volume = Volume
editor-locator-part = Parte
editor-locator-column = Colonna
editor-locator-folio = Carta
editor-locator-figure = Figura
editor-locator-note = Nota
editor-locator-number = Numero
editor-locator-sub-verbo = Sub voce

## A note, in the panel it is written in.

# The number is that of the note, or a letter for a note that stands in a place of its own.
editor-note-numbered = Nota { $number }
editor-note-place = Dove sta la nota
editor-note-place-format = Dove il formato ha le sue note
editor-note-place-foot = A piè di pagina
editor-note-place-end = Alla fine del testo
editor-note-placeholder = Il testo della nota
