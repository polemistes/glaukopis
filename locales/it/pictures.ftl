# The store of pictures: all the pictures of the application, and one of them.

pictures-title = Immagini
pictures-all = Tutte le immagini
pictures-picture = Immagine
pictures-search-placeholder = Cerca tra le immagini
pictures-clear-search = Azzera la ricerca
pictures-count = { $count ->
    [one] { $count } immagine
    [many] { $count } immagini
   *[other] { $count } immagini
}
# How many pictures a search finds, of all there are.
pictures-shown = { $shown } di { $count ->
    [one] { $count } immagine
    [many] { $count } immagini
   *[other] { $count } immagini
}
pictures-add = Aggiungi immagini…
pictures-empty = Il deposito è vuoto
pictures-empty-text = Le immagini che aggiungi qui si possono usare in tutti i tuoi progetti, e un'immagine messa in un testo è conservata qui. Aggiungine qualcuna, o lasciale cadere su questa finestra.
pictures-nothing-found = Nulla di trovato
pictures-nothing-found-text = Nessuna immagine contiene tutte queste parole.
# What a picture that has no name is called.
pictures-unnamed = Un'immagine
pictures-with-notes = Con note

## Taking pictures in, and removing them

# The title of the dialog that chooses files, and what it calls the files it offers.
pictures-add-title = Aggiungi immagini
pictures-files = Immagini
pictures-taken-in = { $count ->
    [one] «{ $name }» è nel deposito
    [many] { $count } immagini sono nel deposito
   *[other] { $count } immagini sono nel deposito
}
pictures-remove-title = Togliere «{ $name }» dal deposito?
pictures-remove-unused = Nessun progetto usa l'immagine. Ciò che se ne dice qui, e le tue note su di essa, sono tolti con lei.
pictures-remove-used = { $count ->
    [one] { $count } progetto usa l'immagine. Le sue figure resteranno senza l'immagine. Ciò che se ne dice qui, e le tue note su di essa, sono tolti con lei.
    [many] { $count } progetti usano l'immagine. Le loro figure resteranno senza l'immagine. Ciò che se ne dice qui, e le tue note su di essa, sono tolti con lei.
   *[other] { $count } progetti usano l'immagine. Le loro figure resteranno senza l'immagine. Ciò che se ne dice qui, e le tue note su di essa, sono tolti con lei.
}
pictures-no-backend = Non c'è un backend.

## One picture

pictures-name = Nome
pictures-name-placeholder = Come si chiama l'immagine
pictures-caption = Didascalia
pictures-caption-placeholder = Ciò che si dice dell'immagine
pictures-caption-hint = Le figure fatte con l'immagine cominciano con queste parole. Ciò che si dice di una figura si può cambiare lì senza cambiare questo.
pictures-italic = Corsivo
pictures-small-caps = Maiuscoletto
# What the picture shows, in words, for those who do not see it.
pictures-alt = Mostra
pictures-alt-placeholder = A parole, per chi non può vederla
pictures-absent = L'immagine non è su questo computer. È usata nel progetto, ed è mostrata quando arriva da chi ce l'ha messa.
pictures-notes = Note
pictures-note-project = In questo progetto
pictures-note-project-placeholder = Che cosa ne pensi, per questo lavoro
pictures-note-project-hint = Ciò che si scrive qui è presso tutti quelli che hanno il progetto.
pictures-note-for-all = Tienila per tutti i progetti
pictures-note-write-for-all = Scrivi per tutti i progetti
pictures-note-all = In tutti i progetti
pictures-note-all-placeholder = Che cosa ne pensi, ovunque la usi
pictures-note-all-hint = Tenuta con l'immagine nel deposito, su questo computer.
pictures-note-placeholder = Che cosa ne pensi. Per te: non fa parte di nessun documento.
pictures-note-label = Le tue note su questa immagine
pictures-file = Il file
pictures-kind = Tipo
pictures-kind-svg = SVG, un disegno
pictures-dimensions-label = Larga e alta
pictures-dimensions = { $width } × { $height } punti
pictures-size = Dimensione
# When the picture was taken into the store.
pictures-added = Aggiunta
pictures-used-in = Usata in
pictures-this-project = Questo progetto
# A map that has no name.
pictures-untitled = Senza titolo
pictures-unused = Nessun progetto usa l'immagine.
pictures-remove = Togli dal deposito
