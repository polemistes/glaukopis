# Templates: what a document of a kind consists of (ADR 0038). Their groups,
# the parts a document is made of, the kinds of file, and the editor of a
# template.

## The groups of templates, as the chooser lists them.

template-group-own = Dine eigne
template-group-plain = Til å byrje med
template-group-article = Artiklar og oppgåver
template-group-book = Bøker og avhandlingar
template-group-fiction = Skjønnlitteratur
template-group-stage = Scene og film
template-group-poetry = Lyrikk
template-group-other = Anna
template-group-journal = Tidsskrift
template-group-publisher = Forlag
template-group-style-guide = Stilguidar

## Where a kind of element stands in the document.


## The parts of a document the application makes itself.

template-generated-half-title = Smusstittel
template-generated-title-page = Tittelside
template-generated-keywords = Nøkkelord
template-generated-contents = Innhaldsliste
template-generated-list-of-figures = Figurliste
template-generated-list-of-tables = Tabelliste
template-generated-body = Teksten
template-generated-notes = Notar
template-generated-bibliography = Litteraturliste

## The kinds of file a template makes.

template-target-pdf = PDF
template-target-pdf-latex = PDF, sett med LaTeX
template-target-docx = Word
template-target-odt = LibreOffice Writer
template-target-latex = LaTeX
template-target-typst = Typst
template-target-markdown = Markdown
template-target-html = Nettside
template-target-epub = E-bok

## The template editor.

template-editor = Mal
template-name = Namnet på malen
# The name a template of one's own is first given, made from that of the template it is made from.
template-name-changed = { $name }, endra
# A template of the writer's own made from another, before it is named: by the other's name.
template-name-own = { $name }, min eigen
template-sections = Delane av malen
template-delete = Slett denne malen
template-save-own = Lagre som min eigen
template-saved = «{ $name }» er lagra blant dine eigne malar
template-read-failed = Malen kunne ikkje lesast.
template-save-failed = Malen kunne ikkje lagrast.
template-delete-failed = Malen kunne ikkje slettast.
template-keep-failed = Malen kunne ikkje takast vare på i prosjektet. På ei anna datamaskin, og i ei fil av prosjektet, får dokumentet den vanlege malen i staden.
template-delete-title = Slette malen «{ $name }»?
template-delete-message = Element som bruker den, vil bruke malen den vart laga av, i staden.
template-delete-confirm = Slett malen
template-leave-title = Gå ut utan å lagre?
template-leave-message = Endringane du har gjort i malen, går tapt.
template-leave-confirm = Gå ut
template-leave-cancel = Hald fram med å redigere

## The parts of the editor, as they are chosen at the left.

template-section-about = Om denne malen
template-section-looks = Oppsett og referansestil
template-section-contents = Innhald
template-section-kinds = Typar av element
template-section-passage-kinds = Slag avsnitt og ord
template-section-requirements = Krav
template-section-outputs = Filer

## About the template.

template-description = Beskriving
template-group = Gruppe
template-based-on = Byggjer på
template-based-on-none = Ikkje noko særskilt

## The layout and the reference style it brings.

template-layout = Oppsett
template-style = Referansestil
# The layout or style the writer has chosen in the settings.
template-usual = Den vanlege, frå innstillingane

## The contents: the order of the document.

# An item of the contents that places every element of a kind.
template-contents-kind = Kvart element av typen { $name }
template-contents-add-part = Ein del …
template-contents-add-kind = Ein type element …
template-contents-up = Opp
template-contents-down = Ned

## The kinds in hand.

template-kinds-in-contents = Står i innhaldet

## The requirements.

template-requirement-words = Ord i teksten
template-requirement-abstract-words = Ord i samandraget
template-requirement-keywords = Nøkkelord
template-requirement-note = Kva grensene tel
# Beside a number of 0, in the place of its unit.
template-no-limit = inga grense

## The files the template makes.

template-output-document = Dokumentet
template-output-cover = Omslaget

## The names of the kinds of text that come with Glaukopis, as the chooser of what you are writing
## and the button over the preview give them; journals, publishers and style guides keep their own.

template-called-plain = Vanleg dokument
template-called-paper = Oppgåve
template-called-article = Tidsskriftartikkel
template-called-report = Rapport
template-called-book = Fagbok
template-called-thesis = Avhandling
template-called-novel = Roman
template-called-novel-manuscript = Romanmanus
template-called-short-story = Novelle
template-called-story-collection = Novellesamling
template-called-poems = Dikt
template-called-play = Skodespel
template-called-screenplay = Filmmanus
template-called-letter = Brev
template-called-blog-post = Blogginnlegg
template-called-news-article = Nyheitsartikkel

## Fewer words, stage 3: the requirement of anonymity, in Look and in the editor of a document type.

template-requirement-anonymity = Anonymt

## Stage 4 of the settings, the zoom and the keys of the kinds: the kinds Ctrl+Alt and a digit gives.
template-kind-keys = Tastar

template-described-plain = Generell tekst.
