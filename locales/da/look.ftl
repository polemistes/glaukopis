## The look of a document, in one place: the panel beside the preview where
## everything is set that decides how the pages look. What is changed there
## is kept as the document's own changes over its layout.

look-title = Udseende
look-between = Mellem teksten og dokumentets udseende
look-whole = Det, der giver udseendet

# Under the button at the top of Look that names what the document is.
look-what-hint = Det, du skriver, afgør delene, siderne og kildehenvisningerne; alt sammen kan ændres nedenfor.
look-scope = Disse ændringer gælder for
# The whole document, by the name of its element.
look-scope-document = Hele dokumentet: { $name }
# Only one element under the document, by its name.
look-scope-only = Kun { $name }
look-scope-hint = Ændringer her gælder for { $name }, hvor det end udskrives. Sideindstillinger får det til at begynde på en ny side.
# The line under it, which goes down to the layout at the foot of Look; the count of changes follows it.
look-layout-line = Opsætning: { $layout }
look-layout-hint = Hvordan siderne ser ud: siden, skriften, afstanden, overskrifterne, arternes udseender
look-citations-hint = Hvordan kildehenvisninger og litteraturlisten skrives

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

look-open-preview = Åbn forhåndsvisningen for at se ændringerne, mens du laver dem.
look-open-preview-button = Åbn forhåndsvisningen
look-search = Find en indstilling: skrift, margener, sidetal…
look-search-nothing = Ingen indstilling har disse ord.
look-sections = Udseendets dele

look-section-page = Side
look-section-type = Skrift
look-section-paragraphs = Afsnit
look-section-headings = Overskrifter
look-section-numbers = Numre
look-section-notes = Noter og kildehenvisninger
look-section-figures = Figurer og tabeller
look-section-front = Forside
look-section-contents = Hvad dokumentet indeholder
look-section-layout = Opsætningen

look-kinds-in-use = I dette dokument
look-heading-levels = Overskriftsniveauer
look-quotations-hint = Citater, der sættes for sig fra teksten på grund af deres længde, hvor de ikke selv er markeret som citater. Arten Citat indstilles under Arter af afsnit og ord nedenfor.
# The first rows of Look, which most writers reach for; each is also in its part further down.
look-first-type-size = Skriftstørrelse
look-first-page-size = Sidestørrelse
look-first-headings-numbered = Overskrifterne nummereres
# Headings within the parts of Look.
look-at-quotations = Lange citater
look-at-kinds = Arter af afsnit og ord
look-at-citations = Kildehenvisninger
look-at-bibliography = Litteraturliste
look-layout-changes = Det, dette dokument ændrer

look-keep = Gem disse ændringer som min egen opsætning…
look-keep-save = Gem
# Where the layout is one of the writer's own.
look-put-into = Læg disse ændringer ind i »{ $name }«
look-delete-layout = Slet denne af mine opsætninger…
look-bundled = De opsætninger, der følger med Glaukopis, bliver, som de er. Det, du ændrer her, gemmes med dokumentet eller, når du vælger det, som din egen opsætning.

## What the document contains, a section of Look: the parts the program
## makes itself, the kinds of elements given a place of their own, and what
## is required. What is changed there is kept as the document's own changes
## over what it is. The name in quotes is what the document is: "Journal
## article", "Novel".

look-contents-parts = Dokumentets dele
look-contents-parts-hint = Som »{ $template }« har dem. En del, der slås til eller fra her, ændres for dette dokument og dem under det og intet andet sted.
# Under the parts that are always made: when each is printed.
look-contents-part-body = Altid med i dokumentet
look-contents-part-notes = Hvor teksten har noter
look-contents-part-bibliography = Hvor teksten henviser til et værk
look-contents-part-keywords = Udskrives, hvor dokumentet har nøgleord
look-contents-kinds = Elementer med en plads for sig
look-contents-kinds-hint = De arter af elementer, »{ $template }« giver en plads, og de elementer under dette, der udfylder hver af dem. Hvert er et element som alle andre: dets tekst skrives i træet.
look-contents-kinds-none = »{ $template }« giver ingen art element en plads for sig.
look-contents-kinds-missing = Ingen endnu
look-contents-kinds-make = Lav et
# On the second element of a kind a document has one of.
look-contents-kinds-doubled = Kun det første bruges
look-contents-requirements = Hvad der kræves
look-contents-requirements-hint = Som »{ $template }« kræver, medmindre det ændres her. Tjeklisten og forhåndsvisningen tæller op mod disse grænser; intet skæres væk.
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
look-layout = Opsætning
look-style = Referencestil
look-style-change = Ændr denne referencestil…

# The switch of the title page, first in the part of the front page.
look-front-title-page = Et titelblad
look-front-title-page-hint = Om dokumentet overhovedet har et; den samme kontakt som under Hvad dokumentet indeholder

# The groups of the fonts to choose from.
look-fonts-document = I dette dokument
look-fonts-project = Andre steder i dette projekt
look-fonts-all = Alle skrifter
