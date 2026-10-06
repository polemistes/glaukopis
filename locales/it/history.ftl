# The full history of a project, in English.
# See locales/README.md.

history-title = Cronologia
history-between = Tra le mappe e la cronologia
history-settings = Impostazioni della cronologia
history-failed = La cronologia non si è potuta leggere.
history-reading = Lettura della cronologia…

## When it is not kept

history-off = La cronologia di questo progetto non è tenuta.
history-on-word = Ogni modifica è conservata
history-off-word = Non tenuta
history-off-about = Finché è tenuta, ogni modifica è conservata, con chi l'ha fatta e quando: il progetto si può guardare com'era in qualunque momento, e riportare indietro. Occupa spazio, e in un progetto condiviso mostra agli altri che cosa ha scritto ciascuno, e quando.
history-turn-on = Tieni la cronologia

## The moments

# Someone whose name the history does not know.
history-someone = Qualcuno
history-began = La cronologia comincia
# The time a session began and ended.
history-span = { $from } – { $to }
# Older history that was merged, so that moments within it are gone.
history-merged = conservata meno finemente
history-added = { $count ->
    [one] +1 carattere
    [many] +{ $count } caratteri
   *[other] +{ $count } caratteri
}
history-removed = { $count ->
    [one] −1 carattere
    [many] −{ $count } caratteri
   *[other] −{ $count } caratteri
}

## The map as it was

history-back = Torna al presente
history-as-it-was = Com'era { $when }
history-marked = Ciò che è cambiato dal momento precedente è segnato nel colore di chi l'ha cambiato.
history-map-not-there = Questa mappa allora non c'era.
history-added-by = Aggiunto da { $name }
history-removed-by = Tolto da { $name }
history-changed-by = Modificato da { $name }
# A cross-reference to a figure, a table or a part, where it is not known what it said.
history-pointer = rimando
history-name-moment = Dai un nome a questo momento
history-name-placeholder = Come chiamarlo
history-named = Il momento si chiama «{ $name }».
history-bring-back-element = Riporta questo elemento com'era
history-bring-back-map = Riporta la mappa com'era
history-brought-back = Riportato com'era. Annulla lo riprende.
history-bring-back-failed = Non si è potuto riportare.
history-open-copy = Apri come progetto a sé
history-copy-name = { $name }, com'era il { $day }
history-copy-failed = Il progetto non si è potuto fare.

## Archives

history-open-archive = Apri un archivio…
history-archive-kind = Cronologia di Glaukopis
history-archive-unread = L'archivio non si è potuto leggere.
history-archive-of = Archivio: { $name }
history-archive-close = Chiudi

## Settings

history-keep = Tieni la cronologia
history-room = La cronologia occupa { $size }.
history-turn-off-title = Smettere di tenere la cronologia?
history-turn-off-message = Ciò che è stato conservato è eliminato. Il progetto in sé resta com'è.
history-turn-off-shared = Ciò che è stato conservato è eliminato, qui e sui computer di quelli con cui il progetto è condiviso. Il progetto in sé resta com'è.
history-turn-off = Elimina la cronologia
history-finely = Cronologia più vecchia
history-finely-about = Le modifiche più vecchie sono fuse, così che occupino meno spazio e si leggano prima; i momenti al loro interno non si possono più distinguere. I momenti con un nome, e quelli con cui le revisioni confrontano, sono conservati.
history-hourly = Fondi ogni ora in una dopo
history-weeks = { $count ->
    [one] settimana
    [many] settimane
   *[other] settimane
}
history-daily = Fondi ogni giorno in uno dopo
history-months = { $count ->
    [one] mese
    [many] mesi
   *[other] mesi
}
history-before = Ciò che è venuto prima
history-before-choose = Scegli un momento nella cronologia per archiviare o eliminare ciò che è venuto prima.
history-before-about = La cronologia prima di { $when } si può archiviare in un file, da guardare più tardi, o eliminare.
history-archive = Archivia…
history-delete = Elimina
history-archive-title = Archiviare la cronologia prima di { $when }?
history-delete-title = Eliminare la cronologia prima di { $when }?
history-cut-message = Ciò che resta comincia con il progetto com'era allora.
history-cut-kept = { $count ->
    [one] Prima di esso c'è un momento con un nome o con una revisione, che qui non si potrà più guardare.
    [many] Prima di esso ci sono { $count } momenti con un nome o con una revisione, che qui non si potranno più guardare.
   *[other] Prima di esso ci sono { $count } momenti con un nome o con una revisione, che qui non si potranno più guardare.
}
history-cut-not-here = La cronologia non si può tagliare prima di questo momento.
history-cut-failed = La cronologia non si è potuta tagliare.
history-archive-until = fino a { $when }
history-archived = La cronologia prima di { $when } è archiviata.
history-deleted = La cronologia prima di { $when } è eliminata.
