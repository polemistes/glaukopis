# A map as a diagram: the elements on a canvas, their branches and associations.

diagram-map = Mappa
diagram-idea = Nome
diagram-new-here = Nuovo elemento qui
diagram-open-as-map = Entra
diagram-show-all = Mostra tutta la mappa
diagram-tidy = Riordina tutta la mappa
# The keys are shown as keys, where the variables stand.
diagram-hint-empty = { $alt }+{ $enter } aggiunge un elemento dopo quello selezionato · { $alt }+{ $shift }+{ $enter } uno sotto · doppio clic per scrivere
diagram-hint-linking = Fai clic sull'elemento da associare, o vai ad esso con le frecce e premi { $enter } · { $esc } per lasciar perdere
diagram-link-handle = Trascina su un altro elemento per associarli

## The view

diagram-view = Vista
diagram-zoom-out = Riduci
diagram-zoom-in = Ingrandisci
diagram-actual-size = Dimensione reale
# How large the map is shown, in hundredths of its size.
diagram-zoom = { $percent }%

## Copying and pasting elements.

diagram-copied = { $count ->
    [one] Un elemento copiato, con tutto ciò che ha sotto
    [many] { $count } elementi copiati, con tutto ciò che hanno sotto
   *[other] { $count } elementi copiati, con tutto ciò che hanno sotto
}
diagram-cut = { $count ->
    [one] Un elemento è tagliato: si sposta dove lo incolli
    [many] { $count } elementi sono tagliati: si spostano dove li incolli
   *[other] { $count } elementi sono tagliati: si spostano dove li incolli
}
diagram-paste-here = Incolla qui
diagram-nothing-copied = Non è ancora stato copiato nulla
diagram-pasted-elsewhere = Ciò che è stato copiato è di un altro progetto, e qui non si può incollare

## Fewer words, stage 2 (agent "chrome"): the words of the menus.

# The tooltips of the mark that folds an element in the diagram.
diagram-unfold-sub = Dispiega i sottoelementi
diagram-fold-sub = Ripiega i sottoelementi

## The diagram as a picture (2026-10-26).

diagram-save-svg = Salva il diagramma come SVG…
diagram-save-image = Salva il diagramma come immagine…
diagram-save-svg-title = Salva il diagramma come SVG
diagram-save-image-title = Salva il diagramma come immagine
diagram-file-svg = SVG
diagram-file-png = Immagine PNG
# $name is the name of the file.
diagram-saved = Il diagramma è stato salvato come «{ $name }»
diagram-saved-size = Il diagramma è stato salvato come «{ $name }», { $width } × { $height } pixel
diagram-saved-no-fonts = I font non si sono potuti mettere nel file: è mostrato con i font di chi lo apre.
diagram-save-failed = Il diagramma non si è potuto salvare
diagram-too-large-for-image = La mappa è troppo grande per un'immagine: salvala come SVG.
