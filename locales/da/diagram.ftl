# A map as a diagram: the elements on a canvas, their branches and associations.

diagram-map = Kort
diagram-idea = Navn
diagram-new-here = Nyt element her
diagram-open-as-map = Gå ind
diagram-show-all = Vis hele kortet
diagram-tidy = Ryd op i hele kortet
# The keys are shown as keys, where the variables stand.
diagram-hint-empty = { $alt }+{ $enter } tilføjer et element efter det valgte · { $alt }+{ $shift }+{ $enter } et under det · dobbeltklik for at skrive
diagram-hint-linking = Klik på det element, der skal knyttes til, eller gå til det med pilene og tryk { $enter } · { $esc } for at lade være
diagram-link-handle = Træk til et andet element for at knytte dem sammen

## The view

diagram-view = Visning
diagram-zoom-out = Zoom ud
diagram-zoom-in = Zoom ind
diagram-actual-size = Faktisk størrelse
# How large the map is shown, in hundredths of its size.
diagram-zoom = { $percent }{" "}%

## Copying and pasting elements.

diagram-copied = { $count ->
    [one] Ét element kopieret, med alt under det
   *[other] { $count } elementer kopieret, med alt under dem
}
diagram-cut = { $count ->
    [one] Ét element er klippet ud: det flyttes derhen, hvor du sætter det ind
   *[other] { $count } elementer er klippet ud: de flyttes derhen, hvor du sætter dem ind
}
diagram-paste-here = Sæt ind her
diagram-nothing-copied = Intet er kopieret endnu
diagram-pasted-elsewhere = Det, der blev kopieret, er fra et andet projekt og kan ikke sættes ind her

## Fewer words, stage 2 (agent "chrome"): the words of the menus.

# The tooltips of the mark that folds an element in the diagram.
diagram-unfold-sub = Fold underelementerne ud
diagram-fold-sub = Fold underelementerne sammen

## The diagram as a picture (2026-10-26).

diagram-save-svg = Gem diagrammet som SVG…
diagram-save-image = Gem diagrammet som et billede…
diagram-save-svg-title = Gem diagrammet som SVG
diagram-save-image-title = Gem diagrammet som et billede
diagram-file-svg = SVG
diagram-file-png = PNG-billede
# $name is the name of the file.
diagram-saved = Diagrammet blev gemt som »{ $name }«
diagram-saved-size = Diagrammet blev gemt som »{ $name }«, { $width } × { $height } pixel
diagram-saved-no-fonts = Skrifterne kunne ikke lægges ind i filen: den vises med skrifterne hos den, der åbner den.
diagram-save-failed = Diagrammet kunne ikke gemmes
diagram-too-large-for-image = Kortet er for stort til et billede: gem det som SVG.
