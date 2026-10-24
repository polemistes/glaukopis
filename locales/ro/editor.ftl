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
editor-quotation-hint = Cuvintele altcuiva, despărțite de text
editor-list-hint = Un punct al unei liste; retras, face o listă în listă
editor-numbered-list = Listă numerotată
editor-numbered-list-hint = Un punct al unei liste numărate; retras, face o listă în listă
editor-verse = Versuri
editor-verse-hint = Un rând de poezie, de teatru sau dintr-o transcriere, păstrat ca rând
editor-speaker = Vorbitor
editor-speaker-hint = Cine vorbește: pe un rând separat sau ca cuvinte în rând
editor-direction = Indicație scenică
editor-direction-hint = Ce se face pe scenă: pe un rând separat sau ca cuvinte în rând
editor-line-numbers-from = Numerotează de la
editor-line-numbers-every = Arată un număr la fiecare
editor-line-numbers-number = Este nevoie de un număr întreg.
editor-line-number = Numărul sau eticheta lui
editor-line-number-placeholder = Numărat ca celelalte
editor-line-number-held = Numărat și nearătat în document. Apăsați ca să-i dați un număr al lui.
# How the lines of a stretch are numbered: see ADR 0041.
editor-numbering = Numerotare
editor-numbering-none = Nenumerotate
editor-numbering-counted = Numărate de la primul număr dat
editor-numbering-given = Numai numerele date
editor-line-numbers-every-layout = Ca macheta: la fiecare { $every }
editor-line-numbers-side = Partea numerelor
editor-side-layout = Cum spune macheta ({ $side })
editor-side-left = Stânga
editor-side-right = Dreapta
# Over a number in the margin of the text, which opens a field for it when pressed.
editor-line-number-press = Numărul acestui rând: apăsați ca să-l schimbați

## Numbers belong to what they number (ADR 0041): the Numbers menu offers
## the three, each saying what it numbers.

## The bracket at the left of paragraphs of one kind standing together (a
## run), named by the kind; its menu says what is said of them.
# After the name of the kind, where the lines of the run are numbered: "Verse · numbered".
editor-bracket-numbered = cu numere
editor-run-label-hint = { $kind } · apăsați pentru ce se spune despre aceste paragrafe
editor-run-select = Selectează aceste paragrafe
editor-run-to-text = Fă din ele text
editor-run-begin = Începe aici un șir nou
editor-run-join = Unește cu șirul dinainte
editor-kinds-text = Text
editor-kinds-quotation = Citat
editor-kinds-verse = Versuri
editor-kinds-script = Scenariu
editor-kinds-list = Listă
editor-kinds-more = Altele
editor-kinds-words = Cuvinte
editor-attribution = Atribuire
editor-attribution-hint = Ale cui sunt cuvintele unui citat
editor-epigraph = Motto
editor-epigraph-hint = Un citat în fruntea unei părți
editor-headword = Cuvânt-titlu
editor-headword-hint = Cuvântul pe care îl explică un glosar
editor-gloss = Glosă
editor-gloss-hint = Ce înseamnă cuvântul-titlu
editor-code = Cod
editor-code-hint = Un rând de cod sau de orice se păstrează literă cu literă
editor-break = Pauză
editor-break-hint = O pauză între părți, cu semnul pe care i-l dă macheta
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
editor-scene = Titlu de scenă
editor-scene-hint = Unde și când are loc o scenă: INT. CASĂ – NOAPTE
editor-action = Acțiune
editor-action-hint = Ce se vede și ce se face
editor-character = Personaj
editor-character-hint = Cine rostește dialogul care urmează
editor-dialogue = Dialog
editor-dialogue-hint = Ce se spune
editor-parenthetical = Paranteză
editor-parenthetical-hint = Cum se spune o replică
editor-transition = Tranziție
editor-transition-hint = Cum se trece de la o scenă la următoarea: TRECERE LA:
editor-comment = Comentariu
editor-parallel = Două texte alăturate
editor-page-break = Sfârșit de pagină
editor-column-break = Sfârșit de coloană
editor-paragraph-kind = Tip de paragraf
# Said of the button that shows the kind of paragraph the cursor is in.
editor-paragraph-kind-now = Tip de paragraf: { $kind }

## The kind menu: the kinds written with those where the cursor is, the kinds at hand,
## the whole catalogue under "More…", and the layout that sets them at its foot.
## The words menu, with the kinds of words. And a kind of the writer's own, in its dialog.

editor-kinds-menu-more = Altele…
editor-kinds-mixed = Amestecate
editor-kinds-own = Ale dumneavoastră
editor-kinds-make = Fă un tip…
editor-kinds-change-own = Modifică un tip propriu…
# Over the item that opens the look of the document at the kind the cursor is in.
editor-kinds-set-by = Așezate cum le are „{ $format }”
editor-kinds-change-look = Cum arată „{ $kind }”…
editor-words-make = Fă un tip de cuvinte…
# Beside the language of the map, first among the languages foreign words may be in.
editor-foreign-of-text = Limba textului
# What a kind of words is based on when it is based on no kind in particular.
editor-plain-words = Cuvinte simple
# The language of a passage, from a word to many paragraphs: it has no look of its own.
editor-language = Limbă
editor-language-of-text = Limba proprie a textului
editor-language-other = Altă limbă…
editor-language-other-title = Limba pasajului
editor-language-tag = Codul limbii
editor-language-no-tag = Acesta nu este un cod de limbă: un cod este de felul „grc”, „la” sau „de-CH”.
editor-language-unnamed = O limbă pentru care sistemul nu are nume: codul se păstrează așa cum este scris.
editor-language-suggested = Limbi citate des
editor-language-other-hint = Pasajul este verificat cu dicționarul limbii lui, acolo unde s-a importat unul, și lăsat în pace acolo unde nu există; un document care se face transmite limba mai departe către Word, OpenDocument, Typst și LaTeX.
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

editor-cite-here = Citează o lucrare aici
editor-note = Notă
editor-note-selection = Fă din selecție o notă
editor-insert = Inserează
editor-spelling-on = Ortografia se verifică în timp ce scrieți · apăsați ca să opriți
editor-spelling-off = Ortografia nu se verifică · apăsați ca să o verificați
editor-equation = Ecuație
editor-table = Tabel…
editor-table-file = Tabel dintr-un fișier…
editor-formula = Formulă
editor-pointer = Trimitere…
editor-refmark-title = Reper
editor-refmark-label = Etichetă
editor-refmark-placeholder = 3:16, 327a, 1094a1
editor-refmark-dialog-hint = Reperul nu face parte din cuvinte: ortografia, căutarea și numărarea cuvintelor trec peste el. Macheta spune dacă se ridică în rând sau se așază pe margine.
# What a picture that was pasted without a name of its own is called in the store of pictures.
editor-pasted-picture = imagine

## More.

editor-found = Citări nelegate…
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
editor-note-place-format = Unde își are macheta notele
editor-note-place-foot = La subsolul paginii
editor-note-place-end = La sfârșitul textului
editor-note-placeholder = Textul notei
