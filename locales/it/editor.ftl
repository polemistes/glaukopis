# The editor of texts: the tools for writing, citations and notes.
# See locales/README.md.

## The marks and the kinds of paragraph, in the bar over a selection and in
## the tools over the text.

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
editor-quotation-hint = Parole di un altro, staccate dal testo
editor-list-hint = Un punto di un elenco; un rientro fa un elenco dentro l'elenco
editor-numbered-list = Elenco numerato
editor-numbered-list-hint = Un punto di un elenco numerato; un rientro fa un elenco dentro l'elenco
editor-verse = Versi
editor-verse-hint = Un verso di poesia, di teatro o di una trascrizione, tenuto come riga
editor-speaker = Chi parla
editor-speaker-hint = Chi parla: su una riga a sé, o come parole dentro una riga
editor-direction = Didascalia scenica
editor-direction-hint = Ciò che si fa sulla scena: su una riga a sé, o come parole dentro una riga
editor-line-numbers-from = Numera da
editor-line-numbers-every = Mostra un numero ogni
editor-line-numbers-number = Ci vuole un numero intero.
editor-line-number = Il suo numero o la sua etichetta
editor-line-number-placeholder = Contata come le altre
editor-line-number-held = Contata, e non mostrata nel documento. Premi per darle un numero suo.
# How the lines of a stretch are numbered: see ADR 0041.
editor-numbering = Numerazione
editor-numbering-none = Non numerate
editor-numbering-counted = Contate dal primo numero dato
editor-numbering-given = Solo i numeri dati
editor-line-numbers-every-layout = Come l'impaginazione: ogni { $every }
editor-line-numbers-side = Lato dei numeri
editor-side-layout = Come dice l'impaginazione ({ $side })
editor-side-left = Sinistra
editor-side-right = Destra
# Over a number in the margin of the text, which opens a field for it when pressed.
editor-line-number-press = Il numero di questa riga: premi per cambiarlo

## Numbers belong to what they number (ADR 0041): the Numbers menu offers
## the three, each saying what it numbers.

## The bracket at the left of paragraphs of one kind standing together (a
## run), named by the kind; its menu says what is said of them.
# After the name of the kind, where the lines of the run are numbered: "Verse · numbered".
editor-bracket-numbered = con numeri
editor-run-label-hint = { $kind } · premi per ciò che si dice di questi paragrafi
editor-run-select = Seleziona questi paragrafi
editor-run-to-text = Fanne testo
editor-run-begin = Comincia qui una nuova serie
editor-run-join = Unisci alla serie precedente
editor-kinds-text = Testo
editor-kinds-quotation = Citazione
editor-kinds-verse = Versi
editor-kinds-script = Sceneggiatura
editor-kinds-list = Elenco
editor-kinds-more = Altro
editor-kinds-words = Parole
editor-attribution = Attribuzione
editor-attribution-hint = Di chi sono le parole di una citazione
editor-epigraph = Epigrafe
editor-epigraph-hint = Una citazione in testa a una parte
editor-headword = Lemma
editor-headword-hint = La parola che un glossario spiega
editor-gloss = Glossa
editor-gloss-hint = Che cosa significa il lemma
editor-code = Codice
editor-code-hint = Una riga di codice, o di qualunque cosa tenuta lettera per lettera
editor-break = Stacco
editor-break-hint = Una pausa tra parti, con il segno che l'impaginazione le dà
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
editor-scene = Intestazione di scena
editor-scene-hint = Dove e quando si svolge una scena: INT. CASA – NOTTE
editor-action = Azione
editor-action-hint = Ciò che si vede e si fa
editor-character = Personaggio
editor-character-hint = Chi dice il dialogo che segue
editor-dialogue = Dialogo
editor-dialogue-hint = Ciò che si dice
editor-parenthetical = Parentetica
editor-parenthetical-hint = Come si dice una battuta
editor-transition = Transizione
editor-transition-hint = Come una scena lascia il posto alla seguente: STACCO SU:
editor-comment = Commento
editor-parallel = Due testi affiancati
editor-page-break = Interruzione di pagina
editor-column-break = Interruzione di colonna
editor-paragraph-kind = Tipo di paragrafo
# Said of the button that shows the kind of paragraph the cursor is in.
editor-paragraph-kind-now = Tipo di paragrafo: { $kind }

## The kind menu: the kinds written with those where the cursor is, the kinds at hand,
## the whole catalogue under "More…", and the layout that sets them at its foot.
## The words menu, with the kinds of words. And a kind of the writer's own, in its dialog.

editor-kinds-menu-more = Altro…
editor-kinds-mixed = Misti
editor-kinds-own = I tuoi
editor-kinds-make = Crea un tipo…
editor-kinds-change-own = Modifica un tipo tuo…
# Over the item that opens the look of the document at the kind the cursor is in.
editor-kinds-set-by = Resi come li ha «{ $format }»
editor-kinds-change-look = Come appare «{ $kind }»…
editor-words-make = Crea un tipo di parole…
# Beside the language of the map, first among the languages foreign words may be in.
editor-foreign-of-text = La lingua del testo
# What a kind of words is based on when it is based on no kind in particular.
editor-plain-words = Parole semplici
# The language of a passage, from a word to many paragraphs: it has no look of its own.
editor-language = Lingua
editor-language-of-text = La lingua propria del testo
editor-language-other = Un'altra lingua…
editor-language-other-title = La lingua del passo
editor-language-tag = Codice della lingua
editor-language-no-tag = Questo non è un codice di lingua: un codice è come «grc», «la» o «de-CH».
editor-language-unnamed = Una lingua per cui il sistema non ha un nome: il codice si tiene come è scritto.
editor-language-suggested = Lingue citate spesso
editor-language-other-hint = Il passo è controllato con il dizionario della sua lingua, dove ne è stato importato uno, e lasciato stare dove non ce n'è; un documento che si fa comunica la lingua a Word, OpenDocument, Typst e LaTeX.
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

editor-cite-here = Cita un'opera qui
editor-note = Nota
editor-note-selection = Fai della selezione una nota
editor-insert = Inserisci
editor-spelling-on = L'ortografia è controllata mentre scrivi · premi per smettere
editor-spelling-off = L'ortografia non è controllata · premi per controllarla
editor-equation = Equazione
editor-table = Tabella…
editor-table-file = Tabella da un file…
editor-formula = Formula
editor-pointer = Rimando…
editor-refmark-title = Numero nel testo
editor-refmark-label = Etichetta
editor-refmark-placeholder = 3:16, 327a, 1094a1
editor-refmark-dialog-hint = Il segno non fa parte delle parole: l'ortografia, la ricerca e il conto delle parole lo saltano. L'impaginazione dice se sta in alto nel rigo o a margine.
# What a picture that was pasted without a name of its own is called in the store of pictures.
editor-pasted-picture = immagine

## More.


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
# A reference was dropped where a citation cannot stand, and the cursor is in no such place either.
editor-citation-no-place = Lì non può stare una citazione
# The project keeps a copy of every reference it cites; this one could not be read from the library.
editor-reference-not-kept = Il riferimento non si è potuto tenere con il progetto
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
editor-note-place-format = Dove l'impaginazione ha le sue note
editor-note-place-foot = A piè di pagina
editor-note-place-end = Alla fine del testo
editor-note-placeholder = Il testo della nota

## Stage 3 of the sides, the panes and the bars (agent "bars")
editor-words-kind = Tipo di parole
editor-words-kind-now = Tipo di parole: { $kind }
editor-marks = Segni
editor-marks-shown = Segni degli spazi e dei paragrafi
editor-image = Immagine
editor-inline-number = Numero nel testo…

## The numbering of lines, in two windows, and the side of the annotations (stage 2 of the contributors and the lines)
# The title of the window, and the item of the text's right-click menu that opens it.
editor-numbering-from-here = Numerazione delle righe da qui
editor-numbering-from-here-item = Numerazione delle righe da qui…
editor-numbering-of-line = Numerazione di questa riga
editor-numbering-of-line-item = Numerazione di questa riga…
# In the menu of a run's bracket.
editor-run-numbering = Numerazione delle righe…
# Count the lines of: every kind, or one kind of paragraph.
editor-numbering-only = Conta le righe di
editor-numbering-every-kind = Tutti i tipi
editor-line-counted = Contata
editor-line-shown = Il suo numero è mostrato
editor-line-shown-others = Come per le altre
editor-line-shown-always = Sempre
editor-line-shown-never = Mai
# Named by the margin the annotation goes to.
editor-line-annotation-right = Annotazione nel margine destro
editor-line-annotation-left = Annotazione nel margine sinistro
editor-line-annotation-placeholder = Un metro, il numero di un'altra edizione

## Where a line begins, and the step (stage 4 of the contributors and the lines)
# In the right-click menu of the text, with a check while the line the cursor is in does so.
editor-line-continues = Comincia dove finisce la riga precedente
