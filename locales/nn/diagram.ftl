# A map as a diagram: the elements on a canvas, their branches and associations.

diagram-map = Kart
diagram-idea = Namn
diagram-new-here = Nytt element her
diagram-open-as-map = Gå inn
diagram-show-all = Vis heile kartet
diagram-tidy = Rydd i heile kartet
# The keys are shown as keys, where the variables stand.
diagram-hint-empty = { $alt }+{ $enter } legg til eit element etter det som er valt · { $alt }+{ $shift }+{ $enter } eitt under det · dobbeltklikk for å skrive
diagram-hint-linking = Klikk på elementet du vil knyte til, eller gå til det med pilene og trykk { $enter } · { $esc } for å avbryte
diagram-link-handle = Dra til eit anna element for å knyte dei saman

## The view

diagram-view = Vising
diagram-zoom-out = Zoom ut
diagram-zoom-in = Zoom inn
diagram-actual-size = Verkeleg storleik
# How large the map is shown, in hundredths of its size.
diagram-zoom = { $percent }{" "}%

## Copying and pasting elements.

diagram-copied = { $count ->
    [one] Eitt element kopiert, med alt under det
   *[other] { $count } element kopierte, med alt under dei
}
diagram-cut = { $count ->
    [one] Eitt element er klipt ut: det blir flytta dit du limer det inn
   *[other] { $count } element er klipte ut: dei blir flytta dit du limer dei inn
}
diagram-paste-here = Lim inn her
diagram-nothing-copied = Ingenting er kopiert enno
diagram-pasted-elsewhere = Det som vart kopiert, er frå eit anna prosjekt og kan ikkje limast inn her

## Fewer words, stage 2 (agent "chrome"): the words of the menus.

# The tooltips of the mark that folds an element in the diagram.
diagram-unfold-sub = Brett ut underelementa
diagram-fold-sub = Brett saman underelementa

## The diagram as a picture (2026-10-26).

diagram-save-svg = Lagre diagrammet som SVG …
diagram-save-image = Lagre diagrammet som bilete …
diagram-save-svg-title = Lagre diagrammet som SVG
diagram-save-image-title = Lagre diagrammet som bilete
diagram-file-svg = SVG
diagram-file-png = PNG-bilete
# $name is the name of the file.
diagram-saved = Diagrammet vart lagra som «{ $name }»
diagram-saved-size = Diagrammet vart lagra som «{ $name }», { $width } × { $height } pikslar
diagram-saved-no-fonts = Skriftene kunne ikkje leggjast i fila: den blir vist i skriftene til den som opnar den.
diagram-save-failed = Diagrammet kunne ikkje lagrast
diagram-too-large-for-image = Kartet er for stort til eit bilete: lagre det som SVG.
