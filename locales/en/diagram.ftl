# A map as a diagram: the elements on a canvas, their branches and associations.

diagram-map = Map
diagram-idea = Name
diagram-new-here = New element here
diagram-open-as-map = Enter
diagram-show-all = Show the whole map
diagram-tidy = Tidy the whole map
# The keys are shown as keys, where the variables stand.
diagram-hint-empty = { $alt }+{ $enter } adds an element after the one selected · { $alt }+{ $shift }+{ $enter } one under it · double-click to write
diagram-hint-linking = Click the element to associate with, or go to it with the arrows and press { $enter } · { $esc } to leave it
diagram-link-handle = Drag to another element to associate them

## The view

diagram-view = View
diagram-zoom-out = Zoom out
diagram-zoom-in = Zoom in
diagram-actual-size = Actual size
# How large the map is shown, in hundredths of its size.
diagram-zoom = { $percent }%

## Copying and pasting elements.

diagram-copied = { $count ->
    [one] One element copied, with all under it
   *[other] { $count } elements copied, with all under them
}
diagram-cut = { $count ->
    [one] One element is cut: it moves where you paste it
   *[other] { $count } elements are cut: they move where you paste them
}
diagram-paste-here = Paste here
diagram-nothing-copied = Nothing is copied yet
diagram-pasted-elsewhere = What was copied is of another project, and cannot be pasted here

## Fewer words, stage 2 (agent "chrome"): the words of the menus.

# The tooltips of the mark that folds an element in the diagram.
diagram-unfold-sub = Unfold sub-elements
diagram-fold-sub = Fold sub-elements
