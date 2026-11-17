# An element as text: its name the title, the elements under it one after
# another, each a heading and its text.

text-title = Titel
text-name = Elementets namn
text-grip = Flytta eller ändra det här elementet
# Where elements dragged in the text would go, said by the line drawn there.
text-drop-under = Under ”{ $name }”
text-drop-after = Efter ”{ $name }”
text-drop-before = Före ”{ $name }”
text-make-paragraph-element = Gör stycket till ett element
text-make-selection-element = Gör det markerade till ett element
text-paragraph-holds = Stycket innehåller { $things } och gjordes inte till ett element
text-selection-holds = Det markerade innehåller { $things } och gjordes inte till ett element
# What stands in a paragraph or a selection that a name cannot hold, as the two messages above name it.
text-holds-citation = en källhänvisning
text-holds-footnote = en not
text-holds-math = en formel
text-holds-refmark = ett nummer i raden
text-holds-crossref = en korshänvisning
text-holds-linemark = ett nummer eller ord i marginalen
text-holds-other = något som ett namn inte kan rymma
text-join = Foga till elementet ovanför
text-open-as-map = Gå in

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
# The tooltips of the mark that folds an element in the text.
text-unfold-shift = Fäll ut · med Skift även alla underelement
text-fold-this-shift = Fäll ihop det här elementet · med Skift fäll ut alla underelement
# The buttons of the outline.
text-outline-unfold = Fäll ut underelementen
text-outline-fold-sub = Fäll ihop underelementen
