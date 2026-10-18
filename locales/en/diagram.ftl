# A map as a diagram: the elements on a canvas, their branches and associations.

diagram-map = Map
diagram-idea = Name
diagram-new-here = New element here
diagram-new-here-hint = A thought that has no place yet, under the element in view
diagram-open-as-map = Open as a map
diagram-open-as-map-hint = The element at the centre, with what is under it
diagram-show-all = Show the whole map
diagram-tidy = Tidy the whole map
diagram-tidy-hint = Every element goes back to its automatic place
# The keys are shown as keys, where the variables stand.
diagram-hint-empty = { $tab } adds an element under the one selected · { $enter } adds one beside it · double-click to write
diagram-hint-linking = Click the element to associate with, or go to it with the arrows and press { $enter } · { $esc } to leave it
diagram-show-under = Show what is under it
diagram-hide-under = Hide what is under it
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
diagram-paste-under-itself = What was cut cannot go under itself: it is still cut, to be pasted somewhere else
