# Templates: what a document of a kind consists of (ADR 0038). Their groups,
# the parts a document is made of, the kinds of file, and the editor of a
# template.

## The groups of templates, as the chooser lists them.

template-group-own = Dine egne
template-group-plain = Til at begynde med
template-group-article = Artikler og opgaver
template-group-book = Bøger og afhandlinger
template-group-fiction = Skønlitteratur
template-group-stage = Scene og film
template-group-poetry = Lyrik
template-group-other = Andre tekster
template-group-journal = Tidsskrifter
template-group-publisher = Forlag
template-group-style-guide = Stilmanualer

## Where a kind of element stands in the document.


## The parts of a document the application makes itself.

template-generated-half-title = Smudstitel
template-generated-title-page = Titelblad
template-generated-keywords = Nøgleord
template-generated-contents = Indholdsfortegnelse
template-generated-list-of-figures = Figurliste
template-generated-list-of-tables = Tabelliste
template-generated-body = Teksten
template-generated-notes = Noter
template-generated-bibliography = Litteraturliste

## The kinds of file a template makes.

template-target-pdf = PDF
template-target-pdf-latex = PDF, sat med LaTeX
template-target-docx = Word
template-target-odt = LibreOffice Writer
template-target-latex = LaTeX
template-target-typst = Typst
template-target-markdown = Markdown
template-target-html = Webside
template-target-epub = E-bog

## The template editor.

template-editor = Skabelon
template-name = Skabelonens navn
# The name a template of one's own is first given, made from that of the template it is made from.
template-name-changed = { $name }, ændret
# A template of the writer's own made from another, before it is named: by the other's name.
template-name-own = { $name }, min egen
template-sections = Skabelonens dele
template-bundled = De skabeloner, der følger med Glaukopis, bliver, som de er. Dine ændringer gemmes som din egen skabelon.
template-delete = Slet denne skabelon
template-save-own = Gem som min egen
template-saved = »{ $name }« er gemt blandt dine egne skabeloner
template-read-failed = Skabelonen kunne ikke læses.
template-save-failed = Skabelonen kunne ikke gemmes.
template-delete-failed = Skabelonen kunne ikke slettes.
template-keep-failed = Skabelonen kunne ikke gemmes i projektet. På en anden computer og i en projektfil får dokumentet i stedet den sædvanlige skabelon.
template-delete-title = Slet skabelonen »{ $name }«?
template-delete-message = Elementer, der bruger den, vil bruge den skabelon, den blev lavet ud fra, i stedet.
template-delete-confirm = Slet skabelonen
template-leave-title = Forlad uden at gemme?
template-leave-message = De ændringer, du har lavet i skabelonen, går tabt.
template-leave-confirm = Forlad
template-leave-cancel = Fortsæt med at redigere

## The parts of the editor, as they are chosen at the left.

template-section-about = Om denne skabelon
template-section-looks = Opsætning og referencestil
template-section-contents = Indhold
template-section-kinds = Arter af elementer
template-section-passage-kinds = Arter af afsnit og ord
template-section-requirements = Krav
template-section-outputs = Filer

## About the template.

template-description = Beskrivelse
template-group = Gruppe
template-based-on = Bygger på
template-based-on-none = Intet bestemt
template-source-changed = Du har ændret denne skabelon; kilden beskriver den, den blev lavet ud fra.
template-source-none = Denne skabelon følger ikke nogen bestemt udgivers krav.

## The layout and the reference style it brings.

template-layout = Opsætning
template-layout-hint = Hvordan siden ser ud, for hvert dokument med denne skabelon
template-style = Referencestil
template-style-hint = Hvordan kildehenvisninger og litteraturlisten skrives; står feltet tomt, gælder opsætningens egen
# The layout or style the writer has chosen in the settings.
template-usual = Din sædvanlige, fra indstillingerne

## The contents: the order of the document.

template-contents-hint = Dokumentets rækkefølge: de dele, programmet selv laver, og hvert element af en art, i træets rækkefølge. En art, der står før teksten, hører til de indledende dele, en, der står efter den, til de afsluttende.
# An item of the contents that places every element of a kind.
template-contents-kind = Hvert element af arten { $name }
template-contents-add-part = En del…
template-contents-add-kind = En art element…
template-contents-up = Op
template-contents-down = Ned

## The kinds in hand.

template-kinds-hint = De arter af elementer, skabelonen giver ved hånden: de tilbydes i menuen med arter. Dem, der står i indholdet, er ved hånden, hvad enten de vælges her eller ej.
template-kinds-in-contents = I indholdet
template-passage-kinds-hint = De arter af afsnit og ord, skabelonen giver ved hånden: de tilbydes først i skriveværktøjerne.

## The requirements.

template-requirements-hint = Det, et dokument med denne skabelon skal opfylde. Tjeklisten og forhåndsvisningen tæller op mod disse; intet skæres væk.
template-requirement-words = Ord i teksten
template-requirement-abstract-words = Ord i resuméet
template-requirement-keywords = Nøgleord
template-requirement-note = Hvad grænserne tæller
template-requirement-note-placeholder = Noter medregnet; litteraturlisten ikke
# Beside a number of 0, in the place of its unit.
template-no-limit = ingen grænse

## The files the template makes.

template-outputs-hint = De filtyper, dokumentet tilbydes som, når det eksporteres.
template-output-document = Dokumentet
template-output-cover = Omslaget
template-output-cover-note = Et omslag for sig laves af en senere version; det, skabelonen siger om det, bevares, som det er.

## The names of the kinds of text that come with Glaukopis, as the chooser of what you are writing
## and the button over the preview give them; journals, publishers and style guides keep their own.

template-called-plain = Almindeligt dokument
template-called-paper = Opgave
template-called-article = Tidsskriftsartikel
template-called-report = Rapport
template-called-book = Videnskabelig bog
template-called-thesis = Afhandling
template-called-novel = Roman
template-called-novel-manuscript = Romanmanuskript
template-called-short-story = Novelle
template-called-story-collection = Novellesamling
template-called-poems = Digte
template-called-play = Skuespil
template-called-screenplay = Filmmanuskript
template-called-letter = Brev
template-called-blog-post = Blogindlæg
template-called-news-article = Nyhedsartikel
