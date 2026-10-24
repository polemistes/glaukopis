# An element as text: its name the title, the elements under it one after
# another, each a heading and its text.

text-title = Title
text-name = Name of the element
text-grip = Move or change this element
# Where elements dragged in the text would go, said by the line drawn there.
text-drop-under = Under “{ $name }”
text-drop-after = After “{ $name }”
text-drop-before = Before “{ $name }”
text-split = Split here
text-heading-kept = What follows the cursor holds what a name cannot, such as a citation or a note, and is the first paragraph of the new element
text-join = Join to the element above
text-open-as-map = Enter

## Folding away what is under an element, and its text

# What is folded away, in its place: whether the element's own text is (text is
# "yes" or "no"), how many elements under it, and how many words in all, which
# may be none.
text-folded = { $text ->
    [yes] { $parts ->
        [0] Its text folded away
        [one] Its text and { $parts } element folded away
       *[other] Its text and { $parts } elements folded away
    }
   *[no] { $parts ->
        [one] { $parts } element folded away
       *[other] { $parts } elements folded away
    }
}{ $words ->
    [0] {""}
    [one] , { $words } word
   *[other] , { $words } words
}

## Associations, in the margin

text-associations = Associations
text-outline = Outline
text-outline-between = Between the outline and the text
text-go-to = Go to “{ $name }”
text-add-label = Add a label…
text-change-label = Change the label…
text-remove-association = Remove the association
text-hint-linking = Click the name of the element to associate with · { $esc } to leave it

## Under the text

text-notes = { $count ->
    [one] { $count } note
   *[other] { $count } notes
}
# The keys are shown as keys, where the variables stand.
text-keys = { $alt }+{ $enter } new element · { $alt }+{ $shift }+{ $enter } one under it · { $at } cite

## Fewer words, stage 2 (agent "chrome")

# A clone in the text: the original's name is shown in bold where the variable stands.
text-clone = Clone of { $name }
text-clone-go = Go to the original
text-unfold = Unfold this element
text-fold-this = Fold this element
text-unfold-all-under = Unfold all sub-elements
text-fold-all-sub = Fold all sub-elements
text-unfold-all = Unfold all
# The tooltips of the mark that folds an element in the text.
text-unfold-shift = Unfold · with Shift, all sub-elements as well
text-fold-this-shift = Fold this element · with Shift, unfold all sub-elements
# The buttons of the outline.
text-outline-unfold = Unfold sub-elements
text-outline-fold-sub = Fold sub-elements
