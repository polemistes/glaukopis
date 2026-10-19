## The look of a document, in one place: the panel beside the preview where
## everything is set that decides how the pages look. What is changed there
## is kept as the document's own changes over its layout.

look-title = Utsjånad
look-open = Utsjånaden til dette dokumentet: mal, oppsett og kjeldetilvisingar
look-between = Mellom teksten og utsjånaden til dokumentet
look-whole = Det som gir utsjånaden

look-layout-hint = Korleis sida ser ut: side, skrift, avstand, overskrifter, utsjånaden til slaga
look-citations-hint = Korleis kjeldetilvisingane og litteraturlista blir skrivne

# After the name of the layout at the top of the panel: "Manuscript · 2 changes".
look-changes = { $count ->
    [one] { $count } endring
   *[other] { $count } endringar
  }
look-no-changes = ingen endringar
# Under a setting the document sets otherwise than its layout.
look-changed-here = Endra her
# A change made on an element over this one, as a book over its chapters.
look-changed-in = Endra i «{ $name }»
look-take-again = ta det frå { $layout } igjen

look-open-preview = Opne førehandsvisinga for å sjå endringane medan du gjer dei.
look-open-preview-button = Opne førehandsvisinga
look-search = Finn ei innstilling: skrift, margar, sidetal …
look-search-nothing = Inga innstilling har desse orda.
look-sections = Delane av utsjånaden

look-section-type = Skrift
look-section-page = Side
look-section-paragraphs = Avsnitt
look-section-headings = Overskrifter
look-section-numbers = Nummer
look-section-notes = Notar
look-section-figures = Figurar og tabellar

look-kinds-in-use = I dette dokumentet
look-heading-levels = Overskriftsnivå
look-quotations-hint = Sitat som blir sette som blokksitat fordi dei er lange, der dei ikkje sjølve er merkte som sitat. Slaget Sitat blir stilt inn under slaga.

look-keep = Ta vare på desse endringane som eit eige oppsett …
look-keep-save = Ta vare på
# Where the layout is one of the writer's own.
look-put-into = Legg desse endringane inn i «{ $name }»
look-delete-layout = Slett dette oppsettet mitt …
look-bundled = Oppsetta som følgjer med Glaukopis, blir verande som dei er. Det du endrar her, blir teke vare på saman med dokumentet, eller, når du vel det, som eit eige oppsett.
