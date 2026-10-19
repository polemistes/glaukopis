## Utseendet til et dokument, på ett sted: panelet ved siden av
## forhåndsvisningen der alt som avgjør hvordan sidene ser ut, stilles inn.

look-title = Utseende
look-open = Utseendet til dette dokumentet: mal, oppsett og kildehenvisninger
look-between = Mellom teksten og utseendet til dokumentet
look-whole = Det som gir utseendet

look-template = Mal
look-template-hint = Hva dokumentet består av: delene og hva de krever
look-layout-hint = Hvordan siden ser ut: side, skrift, avstand, overskrifter, hvordan slagene settes
look-citations-hint = Hvordan kildehenvisningene og litteraturlisten skrives

look-changes = { $count ->
    [one] { $count } endring
   *[other] { $count } endringer
  }
look-no-changes = ingen endringer
look-changed-here = Endret her
look-changed-in = Endret i «{ $name }»
look-take-again = ta { $layout } sitt igjen

look-open-preview = Åpne forhåndsvisningen for å se endringene mens du gjør dem.
look-open-preview-button = Åpne forhåndsvisningen
look-search = Finn en innstilling: skrift, marger, sidetall …
look-search-nothing = Ingen innstilling har disse ordene.
look-sections = Delene av utseendet

look-section-type = Skrift
look-section-page = Side
look-section-paragraphs = Avsnitt
look-section-headings = Overskrifter
look-section-kinds = Slag
look-section-quotations = Sitater
look-section-numbers = Nummer
look-section-notes = Noter
look-section-bibliography = Litteraturliste
look-section-figures = Figurer og tabeller
look-section-title = Tittel og sammendrag
look-section-about = Om oppsettet

look-kinds-in-use = I dette dokumentet
look-heading-levels = Overskriftsnivåer
look-quotations-hint = Sitater som settes ut fra teksten på grunn av lengden, der de ikke selv er merket som sitater. Slaget Sitat stilles inn under slagene.

look-keep = Behold disse endringene som et eget oppsett …
look-keep-save = Behold
look-put-into = Legg disse endringene inn i «{ $name }»
look-delete-layout = Slett dette oppsettet mitt …
look-bundled = Oppsettene som følger med Glaukopis, forblir som de er. Det du endrer her, holdes sammen med dokumentet, eller, når du vil, som et eget oppsett.

## Hva dokumentet inneholder, en del av Utseende: delene programmet lager
## selv, slagene elementer som får en egen plass, og hva som kreves. Det som
## endres der, holdes som dokumentets egne endringer.

look-contents-parts = Delene av dokumentet
look-contents-parts-hint = Slik «{ $template }» har dem. Slår du en del på eller av her, endres den for dette dokumentet og dem under det, og ingen andre steder.
look-contents-part-body = Alltid med i dokumentet
look-contents-part-notes = Der teksten har noter
look-contents-part-bibliography = Der teksten viser til et verk
look-contents-part-keywords = Skrives ut der dokumentet har nøkkelord
look-contents-kinds = Elementer med en egen plass
look-contents-kinds-hint = Slagene elementer «{ $template }» gir plass til, og elementene under dette som fyller hvert av dem. Hvert av dem er et element som alle andre: teksten skrives i treet.
look-contents-kinds-none = «{ $template }» gir ikke noe slag element en egen plass.
look-contents-kinds-missing = Ingen ennå
look-contents-kinds-make = Lag en
look-contents-kinds-doubled = Bare det første brukes
look-contents-requirements = Hva som kreves
look-contents-requirements-hint = Slik «{ $template }» krever det, om det ikke endres her. Sjekklisten og forhåndsvisningen teller mot disse grensene; ingenting kuttes.
look-contents-limit-words = Ord i teksten, høyst
look-contents-limit-abstract-words = Ord i sammendraget, høyst
look-contents-limit-keywords = Nøkkelord, høyst
look-contents-requirements-note = Hva grensene teller: { $note }
