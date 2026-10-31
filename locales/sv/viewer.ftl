# A file of the library shown in a side of the window: its pages, its bar, and what can go wrong.

viewer-file = Fil
# The page in view, of how many: "Page 3 of 271".
viewer-page-of = Sida { $page } av { $count }
# The number the page has in print, where it differs from its count: shown after the count, small.
viewer-printed = ({ $label })
viewer-go-to-page = Gå till sida
viewer-zoom = Zoom
viewer-fit-width = Anpassa till bredden
viewer-zoom-percent = { $percent } %
viewer-not-drawn = Den här sidan kunde inte ritas: { $why }
viewer-not-found = Filen finns inte längre i biblioteket.
viewer-locked = Filen är låst med ett lösenord och kan inte visas.
viewer-not-shown = Det här slaget av fil kan inte visas här: öppna den i ett annat program.
viewer-loading = Öppnar filen…
# The zoom of an image, fitted: all of it seen, however small that makes it.
viewer-fit-image = Hela bilden i vyn
# The field in which a zoom is written, in percent.
viewer-zoom-field = Zoom, i procent
viewer-zoom-choose = Välj zoom
viewer-files-menu = Bibliotekets filer
viewer-files-search = Hitta en fil
viewer-tree-empty = Inget här än

# A simple image editor (docs/plans/a-simple-image-editor.md): the button in the bar, the row under it, and what it says.
viewer-edit = Redigera
viewer-edit-turn-left = Vrid åt vänster
viewer-edit-turn-right = Vrid åt höger
viewer-edit-flip-sideways = Spegelvänd
viewer-edit-flip-over = Vänd upp och ner
viewer-edit-crop = Beskär
viewer-edit-brightness = Ljusstyrka
viewer-edit-contrast = Kontrast
viewer-edit-saturation = Mättnad
# How much of a colour the image has, 100 being as it is.
viewer-edit-percent = { $percent } %
# Puts one slider back at 100 %.
viewer-edit-as-it-was = Som den var
viewer-edit-start-again = Börja om
viewer-edit-keep = Spara som en ny fil
# The size the crop cuts to, of the size of the whole: "Cut to 800 × 600 of 1600 × 1200".
viewer-edit-cut-to = Beskär till { $width } × { $height } av { $fullWidth } × { $fullHeight }
viewer-edit-leave-title = Lämna utan att spara?
viewer-edit-leave-message = Det som ändrades går förlorat.
viewer-edit-leave = Lämna
viewer-edit-kept = Sparad som { $name }
viewer-edit-not-kept = Den redigerade bilden kunde inte sparas
viewer-edit-not-opened = Bilden kunde inte öppnas för redigering
viewer-edit-too-large-title = För stor att redigera
viewer-edit-too-large-message = Bilden är större än { $most } MB, vilket är det mesta en bild får vara. En mindre kopia kan göras och redigeras i stället.
viewer-edit-make-smaller = Gör en mindre kopia

# Sources in tabs, bookmarks in a file (docs/plans/sources-in-tabs-bookmarks-and-the-scrolling-of-pages.md).
viewer-tabs = Flikar
viewer-tab-add = Lägg till en fil…
viewer-tab-add-title = Lägg till filer bland flikarna
viewer-tab-menu = Flikens meny
viewer-tab-close = Stäng fliken
viewer-tab-close-others = Stäng de andra flikarna
viewer-tab-again = Öppna igen i en ny flik
viewer-tab-in-library = Visa i biblioteket
viewer-tab-gone = Inte längre i biblioteket
viewer-tabs-none = Inga filer här än
# The tooltip of the project's name in the cell of a file side.
viewer-sources-of = Flikarna i { $name }
viewer-places = Bokmärken och innehåll
viewer-bookmark-here = Sätt ett bokmärke här
viewer-bookmarks = Bokmärken
viewer-bookmarks-none = Inga bokmärken än
# The default name of a bookmark, and the small page said beside one.
viewer-bookmark-page = Sida { $label }
viewer-bookmark-name = Bokmärkets namn
viewer-bookmark-rename = Byt namn
viewer-bookmark-remove = Ta bort
viewer-bookmark-not-kept = Bokmärkena kunde inte sparas
viewer-contents = Innehåll
viewer-contents-none = Filen har ingen egen innehållsförteckning

# The tabs opened, files by their references, a file read in the library (docs/plans/the-tabs-opened-files-by-their-references-and-a-file-read-in-the-library.md).
viewer-back-to-files = Tillbaka till filerna

# Printing (docs/plans/printing.md, record 0075).
# The button in the bar of a file, and in the dialog of its pages, that prints.
viewer-print = Skriv ut…
# The dialog that asks which pages of a PDF to print, before they are drawn.
viewer-print-pages = Sidor att skriva ut
viewer-print-all = { $count ->
    [one] Den enda sidan
   *[other] Alla { $count } sidor
}
# "From [3] to [10]": the words around two fields of page numbers.
viewer-print-from = Från
viewer-print-to = till
# Told while the pages are drawn for printing, before the system's dialog opens.
viewer-print-drawing = { $count ->
    [one] Ritar en sida för utskrift…
   *[other] Ritar { $count } sidor för utskrift…
}
viewer-print-stop = Stoppa
viewer-print-failed = Sidorna kunde inte ritas för utskrift
