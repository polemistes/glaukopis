## The look of a document, in one place: the column of the typesetting pane where
## everything is set that decides how the pages look. What is changed there
## is kept as the document's own changes over its layout.

look-title = Utseende
look-between = Mellan sidorna och dokumentets utseende
look-whole = Det som avgör utseendet

look-scope = De här ändringarna gäller för
# The whole document, by the name of its element.
look-scope-document = Hela dokumentet: { $name }
# Only one element under the document, by its name.
look-scope-only = Bara { $name }
# The line under it, which goes down to the layout at the foot of Look; the count of changes follows it.
look-layout-line = Layout: { $layout }

# After the name of the layout at the top of the panel: "Manuscript · 2 changes".
look-changes = { $count ->
    [one] { $count } ändring
   *[other] { $count } ändringar
  }
# Under a setting the document sets otherwise than its layout.
look-changed-here = Ändrat här
# A change made on an element over this one, as a book over its chapters.
look-changed-in = Ändrat i ”{ $name }”
look-take-again = ta det från { $layout } igen

look-search = Hitta en inställning: typsnitt, marginaler, sidnummer…
look-search-nothing = Ingen inställning har de här orden.
look-sections = Utseendets delar

look-section-page = Sida
look-section-type = Typografi
look-section-paragraphs = Stycken
look-section-headings = Rubriker
look-section-notes = Noter och källhänvisningar
look-section-figures = Figurer och tabeller
look-section-front = Framsida

look-kinds-in-use = I det här dokumentet
look-heading-levels = Rubriknivåer
# The first rows of Look, which most writers reach for; each is also in its part further down.
look-first-type-size = Teckenstorlek
look-first-page-size = Sidstorlek
look-first-headings-numbered = Rubrikerna numreras
look-at-citations = Källhänvisningar
look-at-bibliography = Litteraturförteckning

look-keep = Spara de här ändringarna som en egen layout…
look-keep-save = Spara
# Where the layout is one of the writer's own.
look-put-into = För in de här ändringarna i ”{ $name }”
look-delete-layout = Radera den här egna layouten…

## The parts of the document type, a section of Look: the parts the program
## makes itself and the kinds of elements given a place of their own, in one
## list in the order they are printed, and what is required. What is changed
## there is kept as the document's own changes over what it is.

look-contents-kinds-missing = Inget ännu
look-contents-kinds-make = Gör ett
# On the second element of a kind a document has one of.
look-contents-kinds-doubled = Bara det första används
look-contents-limit-words = Ord i texten, högst
look-contents-limit-abstract-words = Ord i sammanfattningen, högst
look-contents-limit-keywords = Nyckelord, högst
# What the limits count, as what the document is says it.
look-contents-requirements-note = Vad gränserna räknar: { $note }

# A layout, a style or a template that is neither chosen nor inherited: the one from the settings, named.
look-usual = Din vanliga ({ $name })
# The first choice of a layout or a style: what the template brings, named.
look-as-template = Som mallen har det ({ $name })
# The first choice where an element over this one has chosen: the element, and what it chose.
look-from-with = Från { $name } ({ $what })
look-style = Referensstil
look-style-change = Ändra den här referensstilen…

# The switch of the title page, first in the part of the front page.
look-front-title-page = En titelsida

# The groups of the fonts to choose from.
look-fonts-document = I det här dokumentet
look-fonts-project = På andra ställen i projektet
look-fonts-all = Alla typsnitt

## The sides, the panes and the bars, stage 2: the typesetting pane, the document pane, Document properties.

# Opens Document properties at what the document is.
look-document-type = Dokumenttyp…
look-hide = Dölj utseendet

## Fewer words, stage 3: the parts and the headings of Look in plain words.

look-section-line-numbers = Radnummer
look-section-type-parts = Dokumenttypens delar
look-section-the-layout = Layout
look-choose-layout = Välj en layout
look-layout-modifications = Ändringar av layouten
look-at-quotations-warning = Citat
look-at-paragraph-kinds = Slag av stycken
look-at-words-kinds = Slag av ord
look-type-requirements = Dokumenttypens krav

## Stage 4 of the settings, the zoom and the keys of the kinds: the key of a kind, Ctrl+Alt and a digit, as the document type gives it.
look-kind-key = Tangent
look-kind-key-none = Ingen
# A digit another kind has: choosing it here leaves that kind without.
look-kind-key-taken = { $keys }, nu { $kind }
