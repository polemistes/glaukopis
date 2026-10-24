## The look of a document, in one place: the panel beside the preview where
## everything is set that decides how the pages look. What is changed there
## is kept as the document's own changes over its layout.

look-title = Utsjånad
look-whole = Det som gir utsjånaden

look-scope = Desse endringane gjeld for
# The whole document, by the name of its element.
look-scope-document = Heile dokumentet: { $name }
# Only one element under the document, by its name.
look-scope-only = Berre { $name }
# The line under it, which goes down to the layout at the foot of Look; the count of changes follows it.
look-layout-line = Oppsett: { $layout }

# After the name of the layout at the top of the panel: "Manuscript · 2 changes".
look-changes = { $count ->
    [one] { $count } endring
   *[other] { $count } endringar
  }
# Under a setting the document sets otherwise than its layout.
look-changed-here = Endra her
# A change made on an element over this one, as a book over its chapters.
look-changed-in = Endra i «{ $name }»
look-take-again = ta det frå { $layout } igjen

look-search = Finn ei innstilling: skrift, margar, sidetal …
look-search-nothing = Inga innstilling har desse orda.
look-sections = Delane av utsjånaden

look-section-page = Side
look-section-type = Skrift
look-section-paragraphs = Avsnitt
look-section-headings = Overskrifter
look-section-notes = Notar og kjeldetilvisingar
look-section-figures = Figurar og tabellar
look-section-front = Framsida

look-kinds-in-use = I dette dokumentet
look-heading-levels = Overskriftsnivå
# The first rows of Look, which most writers reach for; each is also in its part further down.
look-first-type-size = Skriftstorleik
look-first-page-size = Sidestorleik
look-first-headings-numbered = Overskriftene er nummererte
look-at-citations = Kjeldetilvisingar
look-at-bibliography = Litteraturliste

look-keep = Ta vare på desse endringane som eit eige oppsett …
look-keep-save = Ta vare på
# Where the layout is one of the writer's own.
look-put-into = Legg desse endringane inn i «{ $name }»
look-delete-layout = Slett dette oppsettet mitt …

## What the document contains, a section of Look: the parts the program
## makes itself, the kinds of elements given a place of their own, and what
## is required. What is changed there is kept as the document's own changes
## over what it is. The name in quotes is what the document is: "Journal
## article", "Novel".

look-contents-parts = Delane av dokumentet
look-contents-kinds = Element med ein eigen plass
look-contents-kinds-missing = Ingen enno
look-contents-kinds-make = Lag eitt
# On the second element of a kind a document has one of.
look-contents-kinds-doubled = Berre det første blir brukt
look-contents-limit-words = Ord i teksten, høgst
look-contents-limit-abstract-words = Ord i samandraget, høgst
look-contents-limit-keywords = Nøkkelord, høgst
# What the limits count, as what the document is says it.
look-contents-requirements-note = Kva grensene tel: { $note }

# A layout, a style or a template that is neither chosen nor inherited: the one from the settings, named.
look-usual = Som vanleg ({ $name })
# The first choice of a layout or a style: what the template brings, named.
look-as-template = Som malen har det ({ $name })
# The first choice where an element over this one has chosen: the element, and what it chose.
look-from-with = Frå { $name } ({ $what })
look-style = Referansestil
look-style-change = Endre denne referansestilen …

# The switch of the title page, first in the part of the front page.
look-front-title-page = Ei tittelside

# The groups of the fonts to choose from.
look-fonts-document = I dette dokumentet
look-fonts-project = Andre stader i prosjektet
look-fonts-all = Alle skrifter
