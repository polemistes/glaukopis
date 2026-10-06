# The editor of texts: the tools for writing, citations and notes.
# See locales/README.md.

## The marks and the kinds of paragraph, in the bar over a selection and in
## the tools over the text.

editor-format = Format
editor-writing = Scriere
editor-italic = Cursiv
editor-bold = Aldin
editor-small-capitals = Capităluțe
editor-superscript = Exponent
editor-subscript = Indice
editor-struck = Tăiat
editor-quotation = Citat
editor-block-quotation = Citat în bloc
editor-list = Listă
editor-text = Text
editor-text-hint = Un paragraf
editor-quotation-hint = Despărțit de text
editor-list-hint = Cu un semn înaintea fiecărui punct
editor-numbered-list = Listă numerotată
editor-numbered-list-hint = Cu un număr înaintea fiecărui punct
editor-verse = Versuri
editor-verse-hint = Rânduri de poezie sau de teatru, fiecare păstrat ca rând
editor-speaker = Vorbitor
editor-speaker-hint = Cine vorbește, pe un rând al lui
editor-direction = Indicație scenică
editor-direction-hint = Ce se face, cu cursive
editor-line-numbers = Numerele versurilor
editor-line-numbers-hint = Numerotează versurile de aici: de la care vers și din câte în câte
editor-line-numbers-from = Numerotează versurile de la
editor-line-numbers-none = Lăsați gol pentru niciun număr
editor-line-numbers-every = Arată un număr la fiecare
editor-line-numbers-number = Este nevoie de un număr întreg.
editor-kinds-text = Text
editor-kinds-quotation = Citat
editor-kinds-verse = Versuri
editor-kinds-script = Scenariu
editor-kinds-more = Altele
editor-kinds-words = Cuvinte
editor-attribution = Atribuire
editor-attribution-hint = Ale cui sunt cuvintele, sub un citat, la dreapta
editor-epigraph = Motto
editor-epigraph-hint = Un citat în fruntea unei părți
editor-headword = Cuvânt-titlu
editor-headword-hint = Cuvântul pe care îl explică un glosar
editor-gloss = Glosă
editor-gloss-hint = Ce înseamnă cuvântul-titlu
editor-code = Cod
editor-code-hint = Păstrat literă cu literă, în litere de lățime egală
editor-break = Pauză
editor-break-hint = O pauză între părți, cu semnul pe care i-l dă formatul
editor-draft = Notă de lucru
editor-draft-hint = Pentru ochii dumneavoastră: nu intră în niciun document
editor-foreign = Cuvinte străine
editor-foreign-hint = Cuvinte în altă limbă, pe care ortografia o urmează
editor-title-of-work = Titlu de lucrare
editor-title-of-work-hint = Titlul unei cărți, al unei piese, al unui tablou
editor-term = Termen
editor-term-hint = Un termen acolo unde este folosit prima dată
editor-mention = Mențiune
editor-mention-hint = Un cuvânt despre care se vorbește ca despre un cuvânt, între ghilimele
editor-highlight = Evidențiere
editor-highlight-hint = Pentru ochi, pe ecran: nu intră în niciun document
editor-underline = Subliniat
editor-code-words = Cod în rând
editor-code-words-hint = Litere de lățime egală, în rând
editor-scene = Titlu de scenă
editor-scene-hint = INT. CASĂ – NOAPTE
editor-action = Acțiune
editor-action-hint = Ce se vede și ce se face
editor-character = Personaj
editor-character-hint = Cine vorbește, deasupra dialogului
editor-dialogue = Dialog
editor-dialogue-hint = Ce se spune
editor-parenthetical = Paranteză
editor-parenthetical-hint = Cum se spune, între paranteze
editor-transition = Tranziție
editor-transition-hint = TRECERE LA:, la dreapta
editor-comment = Comentariu
editor-comment-hint = Un comentariu la ce este selectat
editor-comment-element-hint = Un comentariu la acest element; selectați cuvinte ca să le comentați
editor-parallel = Două texte alăturate
editor-parallel-hint = Un original și traducerea lui, fiecare un text al lui
editor-paragraph-kind = Tip de paragraf
# Said of the button that shows the kind of paragraph the cursor is in.
editor-paragraph-kind-now = Tip de paragraf: { $kind }

## The kind menu: the kinds in hand, the whole catalogue under "More…", and
## the format that sets them at its foot. The words menu, with the kinds of
## words. And a kind of the writer's own, in its dialog.

editor-kinds-menu-more = Altele…
editor-kinds-in-hand = Tipuri la îndemână
editor-kinds-own = Ale dumneavoastră
editor-kinds-make = Fă un tip…
editor-kinds-change-own = Modifică un tip propriu…
# Over the item that opens the format editor: the format sets how each kind looks.
editor-kinds-set-by = Așezate cum le are „{ $format }”
editor-kinds-change-format = Modifică formatul…
editor-kinds-change-format-hint = Cum este așezat fiecare tip în acest document
editor-words = Cuvinte
editor-words-hint = Subliniere, exponent, cod; cuvinte străine, titlul unei lucrări, un termen
editor-words-make = Fă un tip de cuvinte…
# Beside the language of the map, first among the languages foreign words may be in.
editor-foreign-of-map = Limba hărții
# What a kind of words is based on when it is based on no kind in particular.
editor-plain-words = Cuvinte simple
editor-own-kind-new = Un tip propriu
editor-own-kind-change = Modifică tipul
editor-own-kind-name = Nume
editor-own-kind-name-placeholder = Scrisoare, telegramă, rugăciune…
editor-own-kind-words-placeholder = Numele unei nave, latină, un cuvânt-cheie…
editor-own-kind-name-taken = Există deja un tip cu acest nume.
editor-own-kind-based-on = Bazat pe
editor-own-kind-based-on-hint = Ce nu se spune mai jos este cum are acest tip
editor-own-kind-look = Prin ce se deosebește
editor-own-kind-create = Creează
editor-own-kind-delete-title = Ștergeți tipul „{ $name }”?
editor-own-kind-delete-message = { $count ->
    [0] Niciun text nu este de acest tip.
    [one] Ce este de acest tip într-un element rămâne cum este și se așază ca text în documente.
    [few] Ce este de acest tip în { $count } elemente rămâne cum este și se așază ca text în documente.
   *[other] Ce este de acest tip în { $count } de elemente rămâne cum este și se așază ca text în documente.
}

## Citing, notes, and what is put into the text.

editor-cite = Citează
editor-cite-here = Citează o lucrare aici
editor-cite-at-cursor = Citează o lucrare acolo unde este cursorul
editor-note = Notă
editor-note-selection = Fă din selecție o notă
editor-note-hint = O notă, la subsolul paginii sau la sfârșit
editor-insert = Inserează
editor-insert-hint = O imagine, un tabel, matematică, o trimitere
editor-new-element = Element nou
editor-new-element-hint = Un element nou după acesta, sau sub el
editor-new-after = Element nou după acesta
editor-new-under = Element nou sub acesta
editor-new-split = Desparte aici
editor-new-split-hint = Ce urmează după cursor devine un element nou
editor-spelling-on = Ortografia se verifică în timp ce scrieți · apăsați ca să opriți
editor-spelling-off = Ortografia nu se verifică · apăsați ca să o verificați
editor-picture-file = Imagine dintr-un fișier…
editor-picture-file-hint = O figură, cu ce se spune despre ea
editor-picture-store = Imagine din depozit…
editor-picture-store-hint = Cele pe care le aveți se arată în lateral
editor-equation = Ecuație
editor-equation-hint = Matematică pe un rând al ei
editor-table = Tabel…
editor-table-hint = Cu atâtea rânduri și coloane
editor-table-file = Tabel dintr-un fișier…
editor-table-file-hint = CSV, sau o foaie de calcul LibreOffice ori Excel
editor-formula = Formulă
editor-formula-hint = Matematică în rând
editor-pointer = Trimitere…
editor-pointer-hint = La o figură, un tabel, o ecuație sau o parte: „vezi figura 2”
# What a picture that was pasted without a name of its own is called in the store of pictures.
editor-pasted-picture = imagine

## More.

editor-found = Citări găsite…
editor-found-count = { $count ->
    [one] Una de parcurs, din care să se facă o citare
    [few] { $count } de parcurs, din care să se facă citări
   *[other] { $count } de parcurs, din care să se facă citări
}
editor-found-none = Și text care seamănă a citări, în această hartă

## Choosing a work to cite.

editor-picker = Alegeți o referință
editor-picker-placeholder = Citează: autor, titlu, an
editor-picker-search = Caută referințe
editor-picker-results = Referințe
editor-picker-in-project = În acest proiect
editor-picker-recent = Adăugate de curând
editor-picker-empty = Biblioteca dumneavoastră este goală.
editor-picker-no-match = Nimic din bibliotecă nu cuprinde aceste cuvinte.
editor-picker-type = Scrieți ca să căutați în bibliotecă.
editor-picker-new = Referință nouă…
editor-picker-import = Importă…

## A citation, and each work in it.

editor-citation = Citare
editor-citation-add = Adaugă o lucrare
editor-citation-add-purpose = Adaugă o lucrare la citare
editor-citation-in-text = Autorul în text: Nagy (1979)
editor-citation-remove = Scoate citarea
editor-citation-split = Desparte cuvintele de citare
editor-citation-split-hint = Cuvintele dinainte și de după devin text al rândului, iar fiecare lucrare o citare a ei, cu pagina ei și nimic altceva
editor-citation-not-in-library = Această referință nu este în biblioteca dumneavoastră.
editor-citation-edit-reference = Modifică referința
editor-citation-before = Înainte
editor-citation-before-placeholder = vezi, cf.
editor-citation-after = După
editor-citation-after-placeholder = și passim
editor-citation-locator-kind = Felul locului
editor-citation-suppress-author = Autorul este numit în propoziția mea: dă numai anul
editor-citation-remove-work = Scoate această lucrare
# Stands in the text in place of a citation of a work that is in neither the library nor the project.
editor-citation-missing = [referință negăsită]
# Stands in the text in place of a citation of no work.
editor-citation-empty = (citare)

## The kinds of place in a work a citation can point to, as the menu of a
## citation names them.

editor-locator-page = Pagină
editor-locator-chapter = Capitol
editor-locator-section = Secțiune
editor-locator-paragraph = Paragraf
editor-locator-line = Rând
editor-locator-verse = Vers
editor-locator-book = Carte
editor-locator-volume = Volum
editor-locator-part = Parte
editor-locator-column = Coloană
editor-locator-folio = Folio
editor-locator-figure = Figură
editor-locator-note = Notă
editor-locator-number = Număr
editor-locator-sub-verbo = Sub verbo

## A note, in the panel it is written in.

# The number is that of the note, or a letter for a note that stands in a place of its own.
editor-note-numbered = Nota { $number }
editor-note-place = Unde stă nota
editor-note-place-format = Unde își are formatul notele
editor-note-place-foot = La subsolul paginii
editor-note-place-end = La sfârșitul textului
editor-note-placeholder = Textul notei
