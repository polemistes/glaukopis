# Citations that were found in a text written elsewhere, and the panel at
# the side in which they are gone through (ADR 0015), in English. See
# locales/README.md.

## The panel.

found-title = Citazioni trovate
# On the tab of the panel, beside the other tabs: short.
found-tab = Citazioni trovate
found-between = Tra la mappa e le citazioni trovate
found-taken = Che cosa è preso per citazione
found-taken-always = Ciò che ha fatto un programma, e le etichette
found-taken-years = Parentesi con dentro un anno
found-taken-named = Note che nominano un'opera della biblioteca
found-taken-notes = Ogni nota
found-asking = Interrogazione della biblioteca…
found-make-certain = { $count ->
    [one] Fai una citazione di quella certa
    [many] Fai citazioni delle { $count } certe
   *[other] Fai citazioni delle { $count } certe
}
found-made = { $count ->
    [one] È stata fatta una citazione
    [many] Sono state fatte { $count } citazioni
   *[other] Sono state fatte { $count } citazioni
}
found-made-undo = Ctrl+Z le riprende, in un passo solo.
found-library-failed = Non si è potuta interrogare la biblioteca.
found-nothing = Nulla da passare in rassegna
found-nothing-looked = In questa mappa non resta nessuna citazione trovata, e nulla vi somiglia a una citazione.
found-nothing-looked-more = In questa mappa non resta nessuna citazione trovata, e nulla vi somiglia a una citazione. Si può prendere altro per citazione, qui sopra.
found-nothing-not-looked = In questa mappa non resta nessuna citazione trovata. Il testo che somiglia soltanto a una citazione si cerca quando dici qui sopra che cosa prendere per citazione: parentesi con dentro un anno, o note.
found-list-label = Ciò che c'è da passare in rassegna
found-untitled = Senza titolo
found-in-a-note = In una nota
# The element of the map a citation stands in.
found-in = In «{ $element }»
found-in-note-of = In una nota di «{ $element }»
# Set small and high after the words a note stands after.
found-note-mark = nota
found-position = { $index } di { $count }
found-previous = La precedente
found-next = La successiva
found-list-show = Mostra l'elenco
found-list-hide = Nascondi l'elenco
found-later = Più tardi
found-leave = Lasciala come testo
found-make = Fanne una citazione

## How sure the library is of what it proposes.

found-sure-certain = La biblioteca ce l'ha di certo
found-sure-likely = La biblioteca ha ciò che probabilmente è
found-sure-possible = La biblioteca ha ciò che potrebbe essere
found-sure-none = Un'opera che cita non ha ancora un riferimento

## By what a citation was found.

found-by-zotero = Fatta da Zotero
found-by-mendeley = Fatta da Mendeley, o da un programma che scrive come lui
found-by-key = Un'etichetta che nomina un riferimento
found-by-form = Presa per citazione dall'aspetto

## The citation that is to be made.

found-the-citation = La citazione
found-no-works = Non nomina nessun'opera. Aggiungine una, o lasciala come il testo che è.
found-add-work = Aggiungi un'opera
found-author-in-text = Autore nel testo: Nagy (1979)
found-pick-work = L'opera citata: autore, titolo, anno
found-pick-add = Aggiungi un'opera alla citazione
found-too-little = Il file dice troppo poco di quest'opera per farne un riferimento
found-reference-failed = Il riferimento non si è potuto fare

## A citation that stands in a note.

found-in-note = Sta in una nota
found-note-becomes = La nota diventa una citazione
# What the note says besides its works, which becomes the words before them, after them, or both.
found-note-around = Ciò che la nota dice d'altro va prima e dopo le sue opere{ $has ->
        [before] : «{ $before }» prima
        [after] : «{ $after }» dopo
       *[both] : «{ $before }» prima, «{ $after }» dopo
    }. Lo stile delle citazioni la mette nel rigo o in una nota.
found-note-style = Lo stile delle citazioni la mette nel rigo o in una nota.
found-citation-in-note = La citazione sta nella nota
    .hint = La nota resta una nota, con ciò che dice d'altro.
found-for-all = Così per tutte quelle che seguono
found-note-not = Non sta in una nota.
# What else the note holds, by the name of what it is in the text.
found-note-holds = La nota contiene { $what ->
        [math] una formula
        [crossref] un rimando
        [citation] una citazione
        [hard_break] una seconda riga
       *[other] qualcosa che non è testo
    }, che le parole prima e dopo un'opera non possono contenere.
found-note-another = La nota contiene un'altra citazione trovata, che andrebbe perduta nelle parole dopo questa.

## Why what was asked could not be done.

found-trouble-gone = Non è più nel testo.
found-trouble-changed = Il testo qui è cambiato da quando è stata proposta, ed è stato riguardato.
found-trouble-cannot = Qui non se ne può fare una citazione.

## One work of a citation, as the text says it is.

# Those who made it: “Nagy and Lord”, “Nagy et al.”
found-people-two = { $first } e { $second }
found-people-more = { $first } et al.
found-work-a-work = Un'opera
found-work-looking = { $work } si cerca nella tua biblioteca…
found-work-no-tag = { $work } è un'etichetta che nessun riferimento della tua biblioteca ha.
found-work-not-found = { $work } non è stato trovato nella tua biblioteca.
found-work-chosen = Scelto da te
# The writer chose this reference for another citation of the same work, and this one followed.
found-work-followed = Come hai scelto per la stessa opera
found-work-certain = Certo
found-work-likely = Probabile
found-work-possible = Possibile
# What the text says the work is.
found-work-for = per «{ $work }»
found-work-others = Altri riferimenti che potrebbe essere
found-work-or = Oppure
found-work-may-be = Potrebbe essere
found-work-another = Un altro…
found-work-find = Trovalo…
found-work-add = Aggiungilo alla biblioteca
