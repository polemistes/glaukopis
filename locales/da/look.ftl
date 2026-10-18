## The look of a document, in one place: the panel beside the preview where
## everything is set that decides how the pages look. What is changed there
## is kept as the document's own changes over its layout.

look-title = Udseende
look-open = Dokumentets udseende: skabelon, opsætning og kildehenvisninger
look-between = Mellem teksten og dokumentets udseende
look-whole = Det, der giver udseendet

look-template = Skabelon
look-template-hint = Hvad dokumentet består af: dets dele, og hvad de kræver
look-layout-hint = Hvordan siden ser ud: side, skrift, afstand, overskrifter, arternes udseende
look-citations-hint = Hvordan kildehenvisninger og litteraturlisten skrives

# After the name of the layout at the top of the panel: "Manuscript · 2 changes".
look-changes = { $count ->
    [one] { $count } ændring
   *[other] { $count } ændringer
  }
look-no-changes = ingen ændringer
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

look-section-type = Skrift
look-section-page = Side
look-section-paragraphs = Afsnit
look-section-headings = Overskrifter
look-section-kinds = Arter
look-section-quotations = Citater
look-section-numbers = Numre
look-section-notes = Noter
look-section-bibliography = Litteraturliste
look-section-figures = Figurer og tabeller
look-section-title = Titel og resumé
look-section-about = Om opsætningen

look-kinds-in-use = I dette dokument
look-heading-levels = Overskriftsniveauer
look-quotations-hint = Citater, der sættes for sig fra teksten på grund af deres længde, hvor de ikke selv er markeret som citater. Arten Citat indstilles under Arter.

look-keep = Gem disse ændringer som min egen opsætning…
look-keep-save = Gem
# Where the layout is one of the writer's own.
look-put-into = Læg disse ændringer ind i »{ $name }«
look-delete-layout = Slet denne af mine opsætninger…
look-bundled = De opsætninger, der følger med Glaukopis, bliver, som de er. Det, du ændrer her, gemmes med dokumentet eller, når du vælger det, som din egen opsætning.
