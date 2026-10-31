# A file of the library shown in a side of the window: its pages, its bar, and what can go wrong.

viewer-file = File
# The page in view, of how many: "Page 3 of 271".
viewer-page-of = Pagina { $page } di { $count }
# The number the page has in print, where it differs from its count: shown after the count, small.
viewer-printed = ({ $label })
viewer-go-to-page = Vai alla pagina
viewer-zoom = Zoom
viewer-fit-width = Alla larghezza della vista
viewer-zoom-percent = { $percent }%
viewer-not-drawn = Questa pagina non si è potuta disegnare: { $why }
viewer-not-found = Il file non è più nella biblioteca.
viewer-locked = Il file chiede una password, e non si può mostrare.
viewer-not-shown = Questo tipo di file non si può mostrare qui: aprilo in un altro programma.
viewer-loading = Apertura del file…
# The zoom of an image, fitted: all of it seen, however small that makes it.
viewer-fit-image = Tutta l'immagine nella vista
# The field in which a zoom is written, in percent.
viewer-zoom-field = Zoom, in percentuale
viewer-zoom-choose = Scegli uno zoom
viewer-files-menu = File della biblioteca
viewer-files-search = Trova un file
viewer-tree-empty = Ancora nulla qui

# A simple image editor (docs/plans/a-simple-image-editor.md): the button in the bar, the row under it, and what it says.
viewer-edit = Modifica
viewer-edit-turn-left = Ruota a sinistra
viewer-edit-turn-right = Ruota a destra
viewer-edit-flip-sideways = Specchia
viewer-edit-flip-over = Capovolgi
viewer-edit-crop = Ritaglia
viewer-edit-brightness = Luminosità
viewer-edit-contrast = Contrasto
viewer-edit-saturation = Saturazione
# How much of a colour the image has, 100 being as it is.
viewer-edit-percent = { $percent }%
# Puts one slider back at 100 %.
viewer-edit-as-it-was = Com'era
viewer-edit-start-again = Ricomincia
viewer-edit-keep = Conserva come nuovo file
# The size the crop cuts to, of the size of the whole: "Cut to 800 × 600 of 1600 × 1200".
viewer-edit-cut-to = Ritagliata a { $width } × { $height } di { $fullWidth } × { $fullHeight }
viewer-edit-leave-title = Uscire senza conservare?
viewer-edit-leave-message = Ciò che è stato cambiato va perduto.
viewer-edit-leave = Esci
viewer-edit-kept = Conservata come { $name }
viewer-edit-not-kept = L'immagine modificata non si è potuta conservare
viewer-edit-not-opened = L'immagine non si è potuta aprire per modificarla
viewer-edit-too-large-title = Troppo grande per essere modificata
viewer-edit-too-large-message = L'immagine è più grande di { $most } MB, il massimo che un'immagine può essere. Se ne può fare una copia più piccola, e modificare quella.
viewer-edit-make-smaller = Fai una copia più piccola

# Sources in tabs, bookmarks in a file (docs/plans/sources-in-tabs-bookmarks-and-the-scrolling-of-pages.md).
viewer-tabs = Schede
viewer-tab-add = Aggiungi un file…
viewer-tab-add-title = Aggiungi file alle schede
viewer-tab-menu = Il menu della scheda
viewer-tab-close = Chiudi la scheda
viewer-tab-close-others = Chiudi le altre schede
viewer-tab-again = Riapri in una nuova scheda
viewer-tab-in-library = Mostra nella biblioteca
viewer-tab-gone = Non più nella biblioteca
viewer-tabs-none = Ancora nessun file qui
# The tooltip of the project's name in the cell of a file side.
viewer-sources-of = Le schede di { $name }
viewer-places = Segnalibri e indice
viewer-bookmark-here = Segna questo punto
viewer-bookmarks = Segnalibri
viewer-bookmarks-none = Ancora nessun segnalibro
# The default name of a bookmark, and the small page said beside one.
viewer-bookmark-page = Pagina { $label }
viewer-bookmark-name = Il nome del segnalibro
viewer-bookmark-rename = Rinomina
viewer-bookmark-remove = Togli
viewer-bookmark-not-kept = I segnalibri non si sono potuti conservare
viewer-contents = Indice
viewer-contents-none = Il file non ha un indice suo

# The tabs opened, files by their references, a file read in the library (docs/plans/the-tabs-opened-files-by-their-references-and-a-file-read-in-the-library.md).
viewer-back-to-files = Torna ai file

# Printing (docs/plans/printing.md, record 0075).
# The button in the bar of a file, and in the dialog of its pages, that prints.
viewer-print = Stampa…
# The dialog that asks which pages of a PDF to print, before they are drawn.
viewer-print-pages = Pagine da stampare
viewer-print-all = { $count ->
    [one] L'unica pagina
    [many] Tutte le { $count } pagine
   *[other] Tutte le { $count } pagine
}
# "From [3] to [10]": the words around two fields of page numbers.
viewer-print-from = Da
viewer-print-to = a
# Told while the pages are drawn for printing, before the system's dialog opens.
viewer-print-drawing = { $count ->
    [one] Disegno di una pagina per la stampa…
    [many] Disegno di { $count } pagine per la stampa…
   *[other] Disegno di { $count } pagine per la stampa…
}
viewer-print-stop = Ferma
viewer-print-failed = Le pagine non si sono potute disegnare per la stampa
