# A file of the library shown in a side of the window: its pages, its bar, and what can go wrong.

viewer-file = Fil
# The page in view, of how many: "Page 3 of 271".
viewer-page-of = Side { $page } af { $count }
# The number the page has in print, where it differs from its count: shown after the count, small.
viewer-printed = ({ $label })
viewer-go-to-page = Gå til side
viewer-zoom = Zoom
viewer-fit-width = Så bred som visningen
viewer-zoom-percent = { $percent } %
viewer-not-drawn = Denne side kunne ikke tegnes: { $why }
viewer-not-found = Filen er ikke længere i biblioteket.
viewer-locked = Filen beder om en adgangskode og kan ikke vises.
viewer-not-shown = Denne type fil kan ikke vises her: åbn den i et andet program.
viewer-loading = Åbner filen…
# The zoom of an image, fitted: all of it seen, however small that makes it.
viewer-fit-image = Hele billedet i visningen
# The field in which a zoom is written, in percent.
viewer-zoom-field = Zoom, i procent
viewer-zoom-choose = Vælg en zoom
viewer-files-menu = Bibliotekets filer
viewer-files-search = Find en fil
viewer-tree-empty = Intet her endnu

# A simple image editor (docs/plans/a-simple-image-editor.md): the button in the bar, the row under it, and what it says.
viewer-edit = Rediger
viewer-edit-turn-left = Drej til venstre
viewer-edit-turn-right = Drej til højre
viewer-edit-flip-sideways = Spejlvend
viewer-edit-flip-over = Vend på hovedet
viewer-edit-crop = Beskær
viewer-edit-brightness = Lysstyrke
viewer-edit-contrast = Kontrast
viewer-edit-saturation = Farvemætning
# How much of a colour the image has, 100 being as it is.
viewer-edit-percent = { $percent } %
# Puts one slider back at 100 %.
viewer-edit-as-it-was = Som det var
viewer-edit-start-again = Begynd forfra
viewer-edit-keep = Gem som en ny fil
# The size the crop cuts to, of the size of the whole: "Cut to 800 × 600 of 1600 × 1200".
viewer-edit-cut-to = Beskæres til { $width } × { $height } ud af { $fullWidth } × { $fullHeight }
viewer-edit-leave-title = Forlad uden at gemme?
viewer-edit-leave-message = Det, der blev ændret, går tabt.
viewer-edit-leave = Forlad
viewer-edit-kept = Gemt som { $name }
viewer-edit-not-kept = Det redigerede billede kunne ikke gemmes
viewer-edit-not-opened = Billedet kunne ikke åbnes til redigering
viewer-edit-too-large-title = For stort til at redigere
viewer-edit-too-large-message = Billedet er større end { $most } MB, som er det største, et billede må være. Der kan laves en mindre kopi, som redigeres i stedet.
viewer-edit-make-smaller = Lav en mindre kopi

# Sources in tabs, bookmarks in a file (docs/plans/sources-in-tabs-bookmarks-and-the-scrolling-of-pages.md).
viewer-tabs = Faner
viewer-tab-add = Tilføj en fil…
viewer-tab-add-title = Tilføj filer til fanerne
viewer-tab-menu = Fanens menu
viewer-tab-close = Luk fanen
viewer-tab-close-others = Luk de andre faner
viewer-tab-again = Åbn igen i en ny fane
viewer-tab-in-library = Vis i biblioteket
viewer-tab-gone = Ikke længere i biblioteket
viewer-tabs-none = Ingen filer her endnu
# The tooltip of the project's name in the cell of a file side.
viewer-sources-of = Fanerne i { $name }
viewer-places = Bogmærker og indhold
viewer-bookmark-here = Sæt et bogmærke her
viewer-bookmarks = Bogmærker
viewer-bookmarks-none = Ingen bogmærker endnu
# The default name of a bookmark, and the small page said beside one.
viewer-bookmark-page = Side { $label }
viewer-bookmark-name = Bogmærkets navn
viewer-bookmark-rename = Omdøb
viewer-bookmark-remove = Fjern
viewer-bookmark-not-kept = Bogmærkerne kunne ikke gemmes
viewer-contents = Indhold
viewer-contents-none = Filen har ingen egen indholdsfortegnelse

# The tabs opened, files by their references, a file read in the library (docs/plans/the-tabs-opened-files-by-their-references-and-a-file-read-in-the-library.md).
viewer-back-to-files = Tilbage til filerne

# Printing (docs/plans/printing.md, record 0075).
# The button in the bar of a file, and in the dialog of its pages, that prints.
viewer-print = Udskriv…
# The dialog that asks which pages of a PDF to print, before they are drawn.
viewer-print-pages = Sider, der skal udskrives
viewer-print-all = { $count ->
    [one] Den ene side
   *[other] Alle { $count } sider
}
# "From [3] to [10]": the words around two fields of page numbers.
viewer-print-from = Fra
viewer-print-to = til
# Told while the pages are drawn for printing, before the system's dialog opens.
viewer-print-drawing = { $count ->
    [one] Tegner én side til udskrivning…
   *[other] Tegner { $count } sider til udskrivning…
}
viewer-print-stop = Stop
viewer-print-failed = Siderne kunne ikke tegnes til udskrivning
