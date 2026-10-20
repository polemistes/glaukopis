## The look of a document, in one place: the panel beside the preview where
## everything is set that decides how the pages look. What is changed there
## is kept as the document's own changes over its layout.

look-title = Utseende
look-between = Mellan texten och dokumentets utseende
look-whole = Det som avgör utseendet

# Under the button at the top of Look that names what the document is.
look-what-hint = Det du skriver avgör delarna, sidorna och källhänvisningarna; vad som helst av det kan ändras nedan.
look-scope = De här ändringarna gäller för
# The whole document, by the name of its element.
look-scope-document = Hela dokumentet: { $name }
# Only one element under the document, by its name.
look-scope-only = Bara { $name }
look-scope-hint = Ändringar här gäller för { $name }, var det än skrivs ut. Sidinställningar gör att det börjar på en ny sida.
# The line under it, which goes down to the layout at the foot of Look; the count of changes follows it.
look-layout-line = Layout: { $layout }
look-layout-hint = Hur sidorna ser ut: sidan, typografin, avstånden, rubrikerna, slagens utseenden
look-citations-hint = Hur källhänvisningar och litteraturförteckningen skrivs

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

look-open-preview = Öppna förhandsvisningen för att se ändringarna medan du gör dem.
look-open-preview-button = Öppna förhandsvisningen
look-search = Hitta en inställning: typsnitt, marginaler, sidnummer…
look-search-nothing = Ingen inställning har de här orden.
look-sections = Utseendets delar

look-section-page = Sida
look-section-type = Typografi
look-section-paragraphs = Stycken
look-section-headings = Rubriker
look-section-numbers = Numrering
look-section-notes = Noter och källhänvisningar
look-section-figures = Figurer och tabeller
look-section-front = Framsida
look-section-contents = Vad dokumentet innehåller
look-section-layout = Layouten

look-kinds-in-use = I det här dokumentet
look-heading-levels = Rubriknivåer
look-quotations-hint = Citat som avskiljs från texten för sin längd, där de inte själva är märkta som citat. Slaget Citat ställs in under slagen av stycken och ord, nedan.
# The first rows of Look, which most writers reach for; each is also in its part further down.
look-first-type-size = Teckenstorlek
look-first-page-size = Sidstorlek
look-first-headings-numbered = Rubrikerna numreras
# Headings within the parts of Look.
look-at-quotations = Långa citat
look-at-kinds = Slag av stycken och ord
look-at-citations = Källhänvisningar
look-at-bibliography = Litteraturförteckning
look-layout-changes = Det som det här dokumentet ändrar

look-keep = Spara de här ändringarna som en egen layout…
look-keep-save = Spara
# Where the layout is one of the writer's own.
look-put-into = För in de här ändringarna i ”{ $name }”
look-delete-layout = Radera den här egna layouten…
look-bundled = Layouterna som följer med Glaukopis förblir som de är. Det du ändrar här sparas med dokumentet, eller, om du vill, som en egen layout.

## What the document contains, a section of Look: the parts the program
## makes itself, the kinds of elements given a place of their own, and what
## is required. What is changed there is kept as the document's own changes
## over what it is. The name in quotes is what the document is: "Journal
## article", "Novel".

look-contents-parts = Dokumentets delar
look-contents-parts-hint = Så som ”{ $template }” har dem. En del som slås på eller av här ändras för det här dokumentet och dem under det, och ingen annanstans.
# Under the parts that are always made: when each is printed.
look-contents-part-body = Alltid med i dokumentet
look-contents-part-notes = Där texten har noter
look-contents-part-bibliography = Där texten hänvisar till ett verk
look-contents-part-keywords = Skrivs ut där dokumentet har nyckelord
look-contents-kinds = Element med en egen plats
look-contents-kinds-hint = De slag av element som ”{ $template }” ger en plats, och de element under det här som fyller var och en. Vart och ett är ett element som alla andra: dess text skrivs i trädet.
look-contents-kinds-none = ”{ $template }” ger inget slag av element en egen plats.
look-contents-kinds-missing = Inget ännu
look-contents-kinds-make = Gör ett
# On the second element of a kind a document has one of.
look-contents-kinds-doubled = Bara det första används
look-contents-requirements = Vad som krävs
look-contents-requirements-hint = Så som ”{ $template }” kräver, om det inte ändras här. Checklistan och förhandsvisningen räknar mot de här gränserna; inget skärs bort.
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
look-layout = Layout
look-style = Referensstil
look-style-change = Ändra den här referensstilen…

# The switch of the title page, first in the part of the front page.
look-front-title-page = En titelsida
look-front-title-page-hint = Om dokumentet över huvud taget har en; samma brytare som under Vad dokumentet innehåller

# The groups of the fonts to choose from.
look-fonts-document = I det här dokumentet
look-fonts-project = På andra ställen i projektet
look-fonts-all = Alla typsnitt
