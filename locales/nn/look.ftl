## The look of a document, in one place: the panel beside the preview where
## everything is set that decides how the pages look. What is changed there
## is kept as the document's own changes over its layout.

look-title = Utsjånad
look-whole = Det som gir utsjånaden

# Under the button at the top of Look that names what the document is.
look-what-hint = Det du skriv, avgjer delane, sidene og kjeldetilvisingane; alt dette kan endrast nedanfor.
look-scope = Desse endringane gjeld for
# The whole document, by the name of its element.
look-scope-document = Heile dokumentet: { $name }
# Only one element under the document, by its name.
look-scope-only = Berre { $name }
look-scope-hint = Endringar her gjeld for { $name }, kvar det enn blir skrive ut. Sideinnstillingar får det til å byrje på ei ny side.
# The line under it, which goes down to the layout at the foot of Look; the count of changes follows it.
look-layout-line = Oppsett: { $layout }
look-layout-hint = Korleis sidene ser ut: sida, skrifta, avstanden, overskriftene, utsjånaden til slaga
look-citations-hint = Korleis kjeldetilvisingane og litteraturlista blir skrivne

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
look-section-numbers = Nummer
look-section-notes = Notar og kjeldetilvisingar
look-section-figures = Figurar og tabellar
look-section-front = Framsida
look-section-contents = Kva dokumentet inneheld
look-section-layout = Oppsettet

look-kinds-in-use = I dette dokumentet
look-heading-levels = Overskriftsnivå
look-quotations-hint = Sitat som blir sette som blokksitat fordi dei er lange, der dei ikkje sjølve er merkte som sitat. Slaget Sitat blir stilt inn under slaga av avsnitt og ord nedanfor.
# The first rows of Look, which most writers reach for; each is also in its part further down.
look-first-type-size = Skriftstorleik
look-first-page-size = Sidestorleik
look-first-headings-numbered = Overskriftene er nummererte
# Headings within the parts of Look.
look-at-quotations = Lange sitat
look-at-kinds = Slag av avsnitt og ord
look-at-citations = Kjeldetilvisingar
look-at-bibliography = Litteraturliste
look-layout-changes = Det dette dokumentet endrar

look-keep = Ta vare på desse endringane som eit eige oppsett …
look-keep-save = Ta vare på
# Where the layout is one of the writer's own.
look-put-into = Legg desse endringane inn i «{ $name }»
look-delete-layout = Slett dette oppsettet mitt …
look-bundled = Oppsetta som følgjer med Glaukopis, blir verande som dei er. Det du endrar her, blir teke vare på saman med dokumentet, eller, når du vel det, som eit eige oppsett.

## What the document contains, a section of Look: the parts the program
## makes itself, the kinds of elements given a place of their own, and what
## is required. What is changed there is kept as the document's own changes
## over what it is. The name in quotes is what the document is: "Journal
## article", "Novel".

look-contents-parts = Delane av dokumentet
look-contents-parts-hint = Slik «{ $template }» har dei. Slår du ein del på eller av her, blir den endra for dette dokumentet og dei under det, og ingen andre stader.
# Under the parts that are always made: when each is printed.
look-contents-part-body = Alltid med i dokumentet
look-contents-part-notes = Der teksten har notar
look-contents-part-bibliography = Der teksten viser til eit verk
look-contents-part-keywords = Blir skrive ut der dokumentet har nøkkelord
look-contents-kinds = Element med ein eigen plass
look-contents-kinds-hint = Typane av element som «{ $template }» gir plass til, og elementa under dette som fyller kvar av dei. Kvart av dei er eit element som alle andre: teksten blir skriven i treet.
look-contents-kinds-none = «{ $template }» gir ingen type element ein eigen plass.
look-contents-kinds-missing = Ingen enno
look-contents-kinds-make = Lag eitt
# On the second element of a kind a document has one of.
look-contents-kinds-doubled = Berre det første blir brukt
look-contents-requirements = Kva som er kravd
look-contents-requirements-hint = Slik «{ $template }» krev det, om det ikkje blir endra her. Sjekklista og førehandsvisinga tel mot desse grensene; ingenting blir kutta.
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
look-layout = Oppsett
look-style = Referansestil
look-style-change = Endre denne referansestilen …

# The switch of the title page, first in the part of the front page.
look-front-title-page = Ei tittelside
look-front-title-page-hint = Om dokumentet har ei i det heile; den same brytaren som under Kva dokumentet inneheld

# The groups of the fonts to choose from.
look-fonts-document = I dette dokumentet
look-fonts-project = Andre stader i prosjektet
look-fonts-all = Alle skrifter
