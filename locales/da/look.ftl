## The look of a document, in one place: the column of the typesetting pane where
## everything is set that decides how the pages look. What is changed there
## is kept as the document's own changes over its layout.

look-title = Udseende
look-between = Mellem siderne og dokumentets udseende
look-whole = Det, der giver udseendet

look-scope = Disse ændringer gælder for
# The whole document, by the name of its element.
look-scope-document = Hele dokumentet: { $name }
# Only one element under the document, by its name.
look-scope-only = Kun { $name }
# The line under it, which goes down to the layout at the foot of Look; the count of changes follows it.
look-layout-line = Opsætning: { $layout }

# After the name of the layout at the top of the panel: "Manuscript · 2 changes".
look-changes = { $count ->
    [one] { $count } ændring
   *[other] { $count } ændringer
  }
# Under a setting the document sets otherwise than its layout.
look-changed-here = Ændret her
# A change made on an element over this one, as a book over its chapters.
look-changed-in = Ændret i »{ $name }«
look-take-again = tag den fra { $layout } igen

look-search = Find en indstilling: skrift, margener, sidetal…
look-search-nothing = Ingen indstilling har disse ord.
look-sections = Udseendets dele

look-section-page = Side
look-section-type = Skrift
look-section-paragraphs = Afsnit
look-section-headings = Overskrifter
look-section-notes = Noter og kildehenvisninger
look-section-figures = Figurer og tabeller
look-section-front = Forside

look-kinds-in-use = I dette dokument
look-heading-levels = Overskriftsniveauer
# The first rows of Look, which most writers reach for; each is also in its part further down.
look-first-type-size = Skriftstørrelse
look-first-page-size = Sidestørrelse
look-first-headings-numbered = Overskrifterne nummereres
look-at-citations = Kildehenvisninger
look-at-bibliography = Litteraturliste

look-keep = Gem disse ændringer som min egen opsætning…
look-keep-save = Gem
# Where the layout is one of the writer's own.
look-put-into = Læg disse ændringer ind i »{ $name }«
look-delete-layout = Slet denne af mine opsætninger…

## The parts of the document type, a section of Look: the parts the program
## makes itself and the kinds of elements given a place of their own, in one
## list in the order they are printed, and what is required. What is changed
## there is kept as the document's own changes over what it is.

look-contents-kinds-missing = Ingen endnu
look-contents-kinds-make = Lav et
# On the second element of a kind a document has one of.
look-contents-kinds-doubled = Kun det første bruges
look-contents-limit-words = Ord i teksten, højst
look-contents-limit-abstract-words = Ord i resuméet, højst
look-contents-limit-keywords = Nøgleord, højst
# What the limits count, as what the document is says it.
look-contents-requirements-note = Hvad grænserne tæller: { $note }

# A layout, a style or a template that is neither chosen nor inherited: the one from the settings, named.
look-usual = Din sædvanlige ({ $name })
# The first choice of a layout or a style: what the template brings, named.
look-as-template = Som skabelonen har det ({ $name })
# The first choice where an element over this one has chosen: the element, and what it chose.
look-from-with = Fra { $name } ({ $what })
look-style = Referencestil
look-style-change = Ændr denne referencestil…

# The switch of the title page, first in the part of the front page.
look-front-title-page = Et titelblad

# The groups of the fonts to choose from.
look-fonts-document = I dette dokument
look-fonts-project = Andre steder i dette projekt
look-fonts-all = Alle skrifter

## The sides, the panes and the bars, stage 2: the typesetting pane, the document pane, Document properties.

# Opens Document properties at what the document is.
look-document-type = Dokumenttype…
look-hide = Skjul udseendet

## Fewer words, stage 3: the parts and the headings of Look in plain words.

look-section-line-numbers = Linjenumre
look-section-type-parts = Dokumenttypens dele
look-section-the-layout = Opsætning
look-choose-layout = Vælg en opsætning
look-layout-modifications = Ændringer i opsætningen
look-at-quotations-warning = Citater
look-at-paragraph-kinds = Arter af afsnit
look-at-words-kinds = Arter af ord
look-type-requirements = Dokumenttypens krav

## Stage 4 of the settings, the zoom and the keys of the kinds: the key of a kind, Ctrl+Alt and a digit, as the document type gives it.
look-kind-key = Tast
look-kind-key-none = Ingen
# A digit another kind has: choosing it here leaves that kind without.
look-kind-key-taken = { $keys }, nu { $kind }
