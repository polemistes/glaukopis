# An element as text: its name the title, the elements under it one after
# another, each a heading and its text.

text-title = Titel
text-name = Elementets namn
text-grip = Flytta eller ändra det här elementet
# Where elements dragged in the text would go, said by the line drawn there.
text-drop-under = Under ”{ $name }”
text-drop-after = Efter ”{ $name }”
text-drop-before = Före ”{ $name }”
text-split = Dela här
text-heading-kept = Det som följer efter markören rymmer något som ett namn inte kan rymma, som en källhänvisning eller en not, och är det nya elementets första stycke
text-join = Foga till elementet ovanför
text-open-as-map = Gå in

## Folding away what is under an element, and its text

# What is folded away, in its place: whether the element's own text is (text is
# "yes" or "no"), how many elements under it, and how many words in all, which
# may be none.
text-folded = { $text ->
    [yes] { $parts ->
        [0] Dess text ihopfälld
        [one] Dess text och { $parts } element ihopfällda
       *[other] Dess text och { $parts } element ihopfällda
    }
   *[no] { $parts ->
        [one] { $parts } element ihopfällt
       *[other] { $parts } element ihopfällda
    }
}{ $words ->
    [0] {""}
    [one] , { $words } ord
   *[other] , { $words } ord
}

## Associations, in the margin

text-associations = Associationer
text-outline = Disposition
text-outline-between = Mellan dispositionen och texten
text-go-to = Gå till ”{ $name }”
text-add-label = Lägg till en etikett…
text-change-label = Ändra etiketten…
text-remove-association = Ta bort associationen
text-hint-linking = Klicka på namnet på elementet att associera med · { $esc } för att låta bli

## Under the text

text-notes = { $count ->
    [one] { $count } not
   *[other] { $count } noter
}
# The keys are shown as keys, where the variables stand.
text-keys = { $alt }+{ $enter } nytt element · { $alt }+{ $shift }+{ $enter } ett under det · { $at } hänvisa

## Fewer words, stage 2 (agent "chrome")

# A clone in the text: the original's name is shown in bold where the variable stands.
text-clone = Klon av { $name }
text-clone-go = Gå till originalet
text-unfold = Fäll ut det här elementet
text-fold-this = Fäll ihop det här elementet
text-unfold-all-under = Fäll ut alla underelement
text-fold-all-sub = Fäll ihop alla underelement
text-unfold-all = Fäll ut allt
# The tooltips of the mark that folds an element in the text.
text-unfold-shift = Fäll ut · med Skift även alla underelement
text-fold-this-shift = Fäll ihop det här elementet · med Skift fäll ut alla underelement
# The buttons of the outline.
text-outline-unfold = Fäll ut underelementen
text-outline-fold-sub = Fäll ihop underelementen
