# Kinds of elements: what the writer calls them (character, place, source…), each with a colour.

kinds-kind = Kind
kinds-title = Kinds of elements
kinds-subtitle = What the elements of this project can be: as many kinds as the work needs, each with a colour.
kinds-new = New kind
kinds-new-ellipsis = New kind…
kinds-change = Change the kind
kinds-manage = Kinds of this project…
kinds-none-of-them = None
kinds-none = No kinds yet. A kind is a name and a colour: character, place, event, source, argument, whatever the work needs.
kinds-name = Name
kinds-name-placeholder = Character, place, event…
kinds-name-taken = There is a kind of that name already.
kinds-colour = Colour
kinds-colour-teal = Teal
kinds-colour-amber = Amber
kinds-colour-violet = Violet
kinds-colour-rose = Rose
kinds-colour-green = Green
kinds-colour-blue = Blue
kinds-colour-rust = Rust
kinds-colour-olive = Olive
kinds-colour-slate = Slate
kinds-colour-plum = Plum
kinds-template = Text to begin with
kinds-template-placeholder = Appearance
    Wants
    Fears
kinds-template-hint = An element without text that is given this kind begins with these lines, one paragraph each.
kinds-begins = An element of this kind writes in
kinds-begins-hint = The text begins in this kind of paragraph, where the element has none yet
kinds-create = Create
kinds-elements = { $count ->
    [one] { $count } element
   *[other] { $count } elements
}
kinds-delete-title = Delete the kind “{ $name }”?
kinds-delete-message = { $count ->
    [0] No element is of it.
    [one] The one element that is of it will be of no kind.
   *[other] The { $count } elements that are of it will be of no kind.
}
