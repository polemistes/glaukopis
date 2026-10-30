# En fil fra biblioteket vist i en side av vinduet: sidene, linjen over dem, og hva som kan gå galt.

viewer-file = Fil
# Siden som vises, av hvor mange: «Side 3 av 271».
viewer-page-of = Side { $page } av { $count }
# Nummeret siden har på trykk, der det er et annet enn tellingen: vist etter tellingen, lite.
viewer-printed = ({ $label })
viewer-go-to-page = Gå til side
viewer-zoom = Zoom
viewer-fit-width = Så bred som visningen
viewer-zoom-percent = { $percent } %
viewer-not-drawn = Denne siden kunne ikke tegnes: { $why }
viewer-not-found = Filen er ikke lenger i biblioteket.
viewer-locked = Filen ber om et passord og kan ikke vises.
viewer-not-shown = Denne typen fil kan ikke vises her: åpne den i et annet program.
viewer-loading = Åpner filen …
# Zoomen til et bilde, tilpasset: hele bildet sees, hvor lite det enn gjør det.
viewer-fit-image = Hele bildet i visningen
# Feltet der en zoom skrives, i prosent.
viewer-zoom-field = Zoom, i prosent
viewer-zoom-choose = Velg en zoom
viewer-tree-files = Filer
viewer-tree-empty = Ingenting her ennå

# En enkel bilderedigering (docs/plans/a-simple-image-editor.md): knappen i linjen, raden under den, og hva den sier.
viewer-edit = Rediger
viewer-edit-turn-left = Drei til venstre
viewer-edit-turn-right = Drei til høyre
viewer-edit-flip-sideways = Speilvend
viewer-edit-flip-over = Snu opp ned
viewer-edit-crop = Beskjær
viewer-edit-brightness = Lysstyrke
viewer-edit-contrast = Kontrast
viewer-edit-saturation = Metning
# Hvor mye av en farge bildet har, der 100 er som det er.
viewer-edit-percent = { $percent } %
# Setter én glidebryter tilbake til 100 %.
viewer-edit-as-it-was = Som det var
viewer-edit-start-again = Begynn på nytt
viewer-edit-keep = Behold som ny fil
# Størrelsen beskjæringen gir, av hele: «Beskåret til 800 × 600 av 1600 × 1200».
viewer-edit-cut-to = Beskåret til { $width } × { $height } av { $fullWidth } × { $fullHeight }
viewer-edit-leave-title = Gå ut uten å beholde?
viewer-edit-leave-message = Det som ble endret, går tapt.
viewer-edit-leave = Gå ut
viewer-edit-kept = Beholdt som { $name }
viewer-edit-not-kept = Det redigerte bildet kunne ikke beholdes
viewer-edit-not-opened = Bildet kunne ikke åpnes for redigering
viewer-edit-too-large-title = For stort til å redigeres
viewer-edit-too-large-message = Bildet er større enn { $most } MB, som er det meste et bilde kan være. En mindre kopi kan lages og redigeres i stedet.
viewer-edit-make-smaller = Lag en mindre kopi

# Kilder i faner, bokmerker i en fil (docs/plans/sources-in-tabs-bookmarks-and-the-scrolling-of-pages.md).
viewer-tabs = Faner
viewer-tab-add = Legg til en fil …
viewer-tab-add-title = Legg til filer blant fanene
viewer-tab-menu = Fanens meny
viewer-tab-close = Lukk fanen
viewer-tab-close-others = Lukk de andre fanene
viewer-tab-again = Åpne igjen i en ny fane
viewer-tab-in-library = Vis i biblioteket
viewer-tab-gone = Ikke lenger i biblioteket
viewer-tabs-none = Ingen filer her ennå
viewer-sources-of = Fanene til { $name }
viewer-places = Bokmerker og innhold
viewer-bookmark-here = Merk dette stedet
viewer-bookmarks = Bokmerker
viewer-bookmarks-none = Ingen bokmerker ennå
viewer-bookmark-page = Side { $label }
viewer-bookmark-name = Bokmerkets navn
viewer-bookmark-rename = Gi nytt navn
viewer-bookmark-remove = Fjern
viewer-bookmark-not-kept = Bokmerkene kunne ikke lagres
viewer-contents = Innhold
viewer-contents-none = Filen har ingen egen innholdsfortegnelse

# Fanene åpnet, filer etter referansene sine, en fil lest i biblioteket (docs/plans/the-tabs-opened-files-by-their-references-and-a-file-read-in-the-library.md).
viewer-back-to-files = Tilbake til filene

# Utskrift (docs/plans/printing.md, record 0075).
viewer-print = Skriv ut …
viewer-print-pages = Sider som skal skrives ut
viewer-print-all = { $count ->
    [one] Den ene siden
   *[other] Alle { $count } sidene
}
viewer-print-from = Fra
viewer-print-to = til
viewer-print-drawing = { $count ->
    [one] Tegner én side for utskrift …
   *[other] Tegner { $count } sider for utskrift …
}
viewer-print-stop = Stopp
viewer-print-failed = Sidene kunne ikke tegnes for utskrift
