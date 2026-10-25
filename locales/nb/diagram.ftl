# Et kart som diagram: elementene på et lerret, med grener og assosiasjoner.

diagram-map = Kart
diagram-idea = Idé
diagram-new-here = Nytt element her
diagram-open-as-map = Gå inn
diagram-show-all = Vis hele kartet
diagram-tidy = Rydd i hele kartet
diagram-hint-empty = { $alt }+{ $enter } legger til en idé etter den som er valgt · { $alt }+{ $shift }+{ $enter } en under den · dobbeltklikk for å skrive
diagram-hint-linking = Klikk på elementet du vil knytte til, eller gå til det med pilene og trykk { $enter } · { $esc } for å avbryte
diagram-link-handle = Dra til et annet element for å knytte dem sammen

## Visningen

diagram-view = Visning
diagram-zoom-out = Zoom ut
diagram-zoom-in = Zoom inn
diagram-actual-size = Faktisk størrelse
# Med et hardt mellomrom mellom tallet og prosenttegnet.
diagram-zoom = { $percent }{" "}%

## Kopiering og innliming av elementer.

diagram-copied = { $count ->
    [one] Ett element kopiert, med alt under det
   *[other] { $count } elementer kopiert, med alt under dem
}
diagram-cut = { $count ->
    [one] Ett element er klippet ut: det flyttes dit du limer det inn
   *[other] { $count } elementer er klippet ut: de flyttes dit du limer dem inn
}
diagram-paste-here = Lim inn her
diagram-nothing-copied = Ingenting er kopiert ennå
diagram-pasted-elsewhere = Det som ble kopiert, er fra et annet prosjekt og kan ikke limes inn her

## Fewer words, stage 2 (agent "chrome"): the words of the menus.

# The tooltips of the mark that folds an element in the diagram.
diagram-unfold-sub = Brett ut underelementene
diagram-fold-sub = Brett sammen underelementene

## Diagrammet som bilde (2026-10-26).

diagram-save-svg = Lagre diagrammet som SVG …
diagram-save-image = Lagre diagrammet som bilde …
diagram-save-svg-title = Lagre diagrammet som SVG
diagram-save-image-title = Lagre diagrammet som bilde
diagram-file-svg = SVG
diagram-file-png = PNG-bilde
# $name er navnet på filen.
diagram-saved = Diagrammet ble lagret som «{ $name }»
diagram-saved-size = Diagrammet ble lagret som «{ $name }», { $width } × { $height } piksler
diagram-saved-no-fonts = Skriftene kunne ikke legges i filen: den vises i skriftene til den som åpner den.
diagram-save-failed = Diagrammet kunne ikke lagres
diagram-too-large-for-image = Kartet er for stort til et bilde: lagre det som SVG.
