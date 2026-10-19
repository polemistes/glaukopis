## The look of a document, in one place: the panel beside the preview where
## everything is set that decides how the pages look. What is changed there
## is kept as the document's own changes over its layout.

look-title = Utseende
look-open = Dokumentets utseende: mall, layout och källhänvisningar
look-between = Mellan texten och dokumentets utseende
look-whole = Det som avgör utseendet

look-layout-hint = Hur sidan ser ut: sida, typografi, avstånd, rubriker, slagens utseenden
look-citations-hint = Hur källhänvisningar och litteraturförteckningen skrivs

# After the name of the layout at the top of the panel: "Manuscript · 2 changes".
look-changes = { $count ->
    [one] { $count } ändring
   *[other] { $count } ändringar
  }
look-no-changes = inga ändringar
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

look-section-type = Typografi
look-section-page = Sida
look-section-paragraphs = Stycken
look-section-headings = Rubriker
look-section-numbers = Numrering
look-section-notes = Noter
look-section-figures = Figurer och tabeller

look-kinds-in-use = I det här dokumentet
look-heading-levels = Rubriknivåer
look-quotations-hint = Citat som avskiljs från texten för sin längd, där de inte själva är märkta som citat. Slaget Citat ställs in under Slag.

look-keep = Spara de här ändringarna som en egen layout…
look-keep-save = Spara
# Where the layout is one of the writer's own.
look-put-into = För in de här ändringarna i ”{ $name }”
look-delete-layout = Radera den här egna layouten…
look-bundled = Layouterna som följer med Glaukopis förblir som de är. Det du ändrar här sparas med dokumentet, eller, om du vill, som en egen layout.

# A layout, a style or a template that is neither chosen nor inherited: the one from the settings, named.
look-usual = Din vanliga ({ $name })
# The first choice of a layout or a style: what the template brings, named.
look-as-template = Som mallen har det ({ $name })
# The first choice where an element over this one has chosen: the element, and what it chose.
look-from-with = Från { $name } ({ $what })
look-layout = Layout
look-style = Referensstil
look-style-change = Ändra den här referensstilen…
