# Reviewing changes afterwards (ADR 0022): the panel of changes beside the
# text, in English. See locales/README.md.

review-title = Modifiche
# The button over the text that opens the panel.
review-open = Rivedi le modifiche
review-since-last = Dall'ultima revisione
review-since-beginning = Dall'inizio della cronologia
review-since-session = Da quando { $who } ha cominciato, { $when }
review-since-named = Da «{ $name }»
# When the moment compared with was, under what it is.
review-since-when = Da { $when }
review-choose-since = Rivedi da un altro momento
review-own = Anche le tue modifiche
review-unit = Rivedi per
review-by-sentence = Frase
review-by-paragraph = Paragrafo
review-left = { $count ->
    [one] Una modifica rimasta
    [many] { $count } modifiche rimaste
   *[other] { $count } modifiche rimaste
}
review-position = { $index } di { $count }
review-working = Calcolo delle modifiche…
review-failed = Le modifiche non si sono potute calcolare.
review-nothing = Nulla più da rivedere
review-nothing-text = Ogni modifica che gli altri hanno fatto da allora è stata accettata.
review-list = Le modifiche di questa mappa

## What a change is.

review-kind-changed = Modificato
review-kind-added = Testo nuovo
review-kind-removed = Testo eliminato
review-kind-moved = Spostato
review-kind-object = { $what ->
    [figure] Figura
    [table] Tabella
    [equation] Equazione
    [citation] Citazione
    [math] Formula
    [footnote] Nota
    [crossref] Rimando
   *[other] Qualcosa che non è testo
}
review-kind-put-in = Inserito: { $what }
review-kind-taken-out = Tolto: { $what }
review-kind-altered = Modificato: { $what }
review-element-added = Elemento aggiunto
review-element-removed = Elemento eliminato
review-element-moved = Elemento spostato
review-element-heading = Stampato come titolo
review-element-no-heading = Non più stampato come titolo
review-element-excluded = Lasciato fuori dal documento
review-element-included = Rimesso nel documento
review-element-other = Elemento modificato
# Where a change is: the name of the element.
review-in = In «{ $element }»
review-moved-from = Da «{ $element }»
review-untitled = Senza titolo
review-gone-element = Un elemento che non c'è più
review-was = Com'era
review-is = Com'è
review-nothing-there = Nulla
review-someone = Qualcuno
review-now-under = Ora sotto «{ $element }»
review-was-under = Era sotto «{ $element }»

## What is done with a change.

review-accept = Accetta
review-reject = Rifiuta
review-later = Più tardi
review-previous = La precedente
review-reject-cannot = Ciò che è stato eliminato della mappa, o una figura tolta, è riportato indietro dalla cronologia.
review-versions = La sua cronologia
review-versions-count = { $count ->
    [one] Una versione
    [many] { $count } versioni
   *[other] { $count } versioni
}
review-versions-reading = Lettura della sua cronologia…
review-versions-none = Tra i due estremi non è successo nulla.
review-version-by = { $who }, { $when }
review-accept-up-to = Accetta fin qui
review-use-version = Usa questa versione

## Without the history.

review-no-history = La cronologia di questo progetto non è tenuta
review-no-history-text = Le modifiche si rivedono dalla cronologia del progetto, che dice chi ha cambiato che cosa, e quando. È tenuta dal momento in cui si accende.
review-turn-on = Tieni la cronologia
review-turn-on-elsewhere = Si accende con la cronologia del progetto.
