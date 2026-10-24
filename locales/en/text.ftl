# An element as text: its name the title, the elements under it one after
# another, each a heading and its text.

text-title = Title
text-name = Name of the element
text-grip = Move or change this element
# The element an element stands for, whose name is shown in bold where the variable stands.
text-include = In the document, { $name } stands here, with all under it.
text-include-open = Open it
# Where elements dragged in the text would go, said by the line drawn there.
text-drop-under = Under “{ $name }”
text-drop-after = After “{ $name }”
text-drop-before = Before “{ $name }”
text-split = Split here
text-heading-kept = What follows the cursor holds what a name cannot, such as a citation or a note, and is the first paragraph of the new element
text-join = Join to the element above
text-open-as-map = Enter

## Folding away what is under an element, and its text

text-open = Open it
text-fold = Fold it away
text-open-shift = Open it · with Shift, all that is folded under it as well
text-fold-hint = Fold away its text and what is under it
text-fold-shift = Fold away its text and what is under it · with Shift, open all that is folded under it
text-open-all = Open all
text-open-all-under = Open all that is folded under it
text-fold-all-under = Fold away all under it
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
text-outline-fold = Fold away what is under it
text-outline-open = Open what is under it
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
