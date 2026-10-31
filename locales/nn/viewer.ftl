# A file of the library shown in a side of the window: its pages, its bar, and what can go wrong.

viewer-file = Fil
# The page in view, of how many: "Page 3 of 271".
viewer-page-of = Side { $page } av { $count }
# The number the page has in print, where it differs from its count: shown after the count, small.
viewer-printed = ({ $label })
viewer-go-to-page = Gå til side
viewer-zoom = Forstørring
viewer-fit-width = Så brei som visinga
viewer-zoom-percent = { $percent } %
viewer-not-drawn = Denne sida kunne ikkje teiknast: { $why }
viewer-not-found = Fila er ikkje lenger i biblioteket.
viewer-locked = Fila ber om eit passord, og kan ikkje visast.
viewer-not-shown = Denne typen fil kan ikkje visast her: opne den i eit anna program.
viewer-loading = Opnar fila …
# The zoom of an image, fitted: all of it seen, however small that makes it.
viewer-fit-image = Heile biletet i visinga
# The field in which a zoom is written, in percent.
viewer-zoom-field = Forstørring, i prosent
viewer-zoom-choose = Vel ei forstørring
viewer-files-menu = Filene i biblioteket
viewer-files-search = Finn ei fil
viewer-tree-empty = Ingenting her enno

# A simple image editor (docs/plans/a-simple-image-editor.md): the button in the bar, the row under it, and what it says.
viewer-edit = Rediger
viewer-edit-turn-left = Drei til venstre
viewer-edit-turn-right = Drei til høgre
viewer-edit-flip-sideways = Spegelvend
viewer-edit-flip-over = Snu opp ned
viewer-edit-crop = Skjer til
viewer-edit-brightness = Lysstyrke
viewer-edit-contrast = Kontrast
viewer-edit-saturation = Metting
# How much of a colour the image has, 100 being as it is.
viewer-edit-percent = { $percent } %
# Puts one slider back at 100 %.
viewer-edit-as-it-was = Som det var
viewer-edit-start-again = Byrj på nytt
viewer-edit-keep = Ta vare på som ny fil
# The size the crop cuts to, of the size of the whole: "Cut to 800 × 600 of 1600 × 1200".
viewer-edit-cut-to = Skore til { $width } × { $height } av { $fullWidth } × { $fullHeight }
viewer-edit-leave-title = Gå ut utan å ta vare på endringane?
viewer-edit-leave-message = Det som vart endra, går tapt.
viewer-edit-leave = Gå ut
viewer-edit-kept = Teke vare på som { $name }
viewer-edit-not-kept = Det redigerte biletet kunne ikkje takast vare på
viewer-edit-not-opened = Biletet kunne ikkje opnast for redigering
viewer-edit-too-large-title = For stort til å redigerast
viewer-edit-too-large-message = Biletet er større enn { $most } MB, som er det meste eit bilete kan vere. Ein mindre kopi kan lagast og redigerast i staden.
viewer-edit-make-smaller = Lag ein mindre kopi

# Sources in tabs, bookmarks in a file (docs/plans/sources-in-tabs-bookmarks-and-the-scrolling-of-pages.md).
viewer-tabs = Faner
viewer-tab-add = Legg til ei fil …
viewer-tab-add-title = Legg til filer i fanene
viewer-tab-menu = Menyen til fana
viewer-tab-close = Lukk fana
viewer-tab-close-others = Lukk dei andre fanene
viewer-tab-again = Opne att i ei ny fane
viewer-tab-in-library = Vis i biblioteket
viewer-tab-gone = Ikkje lenger i biblioteket
viewer-tabs-none = Ingen filer her enno
# The tooltip of the project's name in the cell of a file side.
viewer-sources-of = Fanene til { $name }
viewer-places = Bokmerke og innhald
viewer-bookmark-here = Merk denne staden
viewer-bookmarks = Bokmerke
viewer-bookmarks-none = Ingen bokmerke enno
# The default name of a bookmark, and the small page said beside one.
viewer-bookmark-page = Side { $label }
viewer-bookmark-name = Namnet på bokmerket
viewer-bookmark-rename = Gi nytt namn
viewer-bookmark-remove = Fjern
viewer-bookmark-not-kept = Bokmerka kunne ikkje lagrast
viewer-contents = Innhald
viewer-contents-none = Fila har inga eiga innhaldsliste

# The tabs opened, files by their references, a file read in the library (docs/plans/the-tabs-opened-files-by-their-references-and-a-file-read-in-the-library.md).
viewer-back-to-files = Tilbake til filene

# Printing (docs/plans/printing.md, record 0075).
# The button in the bar of a file, and in the dialog of its pages, that prints.
viewer-print = Skriv ut …
# The dialog that asks which pages of a PDF to print, before they are drawn.
viewer-print-pages = Sider som skal skrivast ut
viewer-print-all = { $count ->
    [one] Den eine sida
   *[other] Alle { $count } sidene
}
# "From [3] to [10]": the words around two fields of page numbers.
viewer-print-from = Frå
viewer-print-to = til
# Told while the pages are drawn for printing, before the system's dialog opens.
viewer-print-drawing = { $count ->
    [one] Teiknar éi side for utskrift …
   *[other] Teiknar { $count } sider for utskrift …
}
viewer-print-stop = Stopp
viewer-print-failed = Sidene kunne ikkje teiknast for utskrift
