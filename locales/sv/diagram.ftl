# A map as a diagram: the elements on a canvas, their branches and associations.

diagram-map = Karta
diagram-idea = Namn
diagram-new-here = Nytt element här
diagram-open-as-map = Gå in
diagram-show-all = Visa hela kartan
diagram-tidy = Snygga till hela kartan
# The keys are shown as keys, where the variables stand.
diagram-hint-empty = { $alt }+{ $enter } lägger till ett element efter det markerade · { $alt }+{ $shift }+{ $enter } ett under det · dubbelklicka för att skriva
diagram-hint-linking = Klicka på elementet att associera med, eller gå till det med pilarna och tryck { $enter } · { $esc } för att låta bli
diagram-link-handle = Dra till ett annat element för att associera dem

## The view

diagram-view = Vy
diagram-zoom-out = Zooma ut
diagram-zoom-in = Zooma in
diagram-actual-size = Verklig storlek
# How large the map is shown, in hundredths of its size.
diagram-zoom = { $percent } %

## Copying and pasting elements.

diagram-copied = { $count ->
    [one] Ett element kopierat, med allt under det
   *[other] { $count } element kopierade, med allt under dem
}
diagram-cut = { $count ->
    [one] Ett element är urklippt: det flyttas dit du klistrar in det
   *[other] { $count } element är urklippta: de flyttas dit du klistrar in dem
}
diagram-paste-here = Klistra in här
diagram-nothing-copied = Inget är kopierat än
diagram-pasted-elsewhere = Det kopierade hör till ett annat projekt och kan inte klistras in här

## Fewer words, stage 2 (agent "chrome"): the words of the menus.

# The tooltips of the mark that folds an element in the diagram.
diagram-unfold-sub = Fäll ut underelementen
diagram-fold-sub = Fäll ihop underelementen

## The diagram as a picture (2026-10-26).

diagram-save-svg = Spara diagrammet som SVG…
diagram-save-image = Spara diagrammet som en bild…
diagram-save-svg-title = Spara diagrammet som SVG
diagram-save-image-title = Spara diagrammet som en bild
diagram-file-svg = SVG
diagram-file-png = PNG-bild
# $name is the name of the file.
diagram-saved = Diagrammet sparades som ”{ $name }”
diagram-saved-size = Diagrammet sparades som ”{ $name }”, { $width } × { $height } pixlar
diagram-saved-no-fonts = Typsnitten kunde inte läggas in i filen: den visas i typsnitten hos den som öppnar den.
diagram-save-failed = Diagrammet kunde inte sparas
diagram-too-large-for-image = Kartan är för stor för en bild: spara den som SVG.
