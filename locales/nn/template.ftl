# Templates: what a document of a kind consists of (ADR 0038). Their groups,
# the parts a document is made of, the kinds of file, and the editor of a
# template.

## The groups of templates, as the chooser lists them.

template-group-own = Dine eigne
template-group-plain = Enkle
template-group-article = Artiklar og oppgåver
template-group-book = Bøker og avhandlingar
template-group-fiction = Skjønnlitteratur
template-group-stage = Scene og film
template-group-poetry = Lyrikk
template-group-other = Andre tekstar
template-group-journal = Tidsskrift
template-group-publisher = Forlag
template-group-style-guide = Stilguidar

## Where a kind of element stands in the document.

template-part-group-front = Forstoff
template-part-group-back = Etterstoff
template-part-group-cover = Omslag

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
template-sections = Delane av malen
template-bundled = Malane som følgjer med Glaukopis, blir verande som dei er. Endringane dine blir lagra som ein eigen mal.
template-delete = Slett denne malen
template-save-own = Lagre som min eigen
template-saved = «{ $name }» er lagra blant dine eigne malar
template-read-failed = Malen kunne ikkje lesast.
template-save-failed = Malen kunne ikkje lagrast.
template-delete-failed = Malen kunne ikkje slettast.
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
template-source-changed = Du har endra denne malen; kjelda beskriv det den vart laga av.
template-source-none = Denne malen følgjer ikkje krava til noko bestemt forlag.

## The layout and the reference style it brings.

template-layout = Oppsett
template-layout-hint = Korleis sida ser ut, for kvart dokument med denne malen
template-style = Referansestil
template-style-hint = Korleis kjeldetilvisingane og litteraturlista blir skrivne; står feltet tomt, gjeld den oppsettet sjølv har
# The layout or style the writer has chosen in the settings.
template-usual = Den vanlege, frå innstillingane

## The contents: the order of the document.

template-contents-hint = Rekkjefølgja i dokumentet: delane programmet lagar sjølv, og kvart element av ein type, i rekkjefølgja i treet. Ein type som står før teksten, er forstoff, ein som står etter, etterstoff.
# An item of the contents that places every element of a kind.
template-contents-kind = Kvart element av typen { $name }
template-contents-add-part = Ein del …
template-contents-add-kind = Ein type element …
template-contents-up = Opp
template-contents-down = Ned

## The kinds in hand.

template-kinds-hint = Typane av element malen legg i handa: dei blir tilbodne i typemenyen. Dei som står i innhaldet, er i handa anten dei er valde her eller ikkje.
template-kinds-in-contents = Står i innhaldet
template-passage-kinds-hint = Slaga avsnitt og ord malen legg i handa: dei blir tilbodne først i skriveverktøya.

## The requirements.

template-requirements-hint = Det eit dokument med denne malen skal oppfylle. Sjekklista og førehandsvisinga tel mot desse; ingenting blir kutta.
template-requirement-words = Ord i teksten
template-requirement-abstract-words = Ord i samandraget
template-requirement-keywords = Nøkkelord
template-requirement-anonymous = Utan namna på forfattarane
template-requirement-anonymous-hint = Til fagfellevurdering: sjekklista seier frå, og eit oppsett for fagfellevurdering utelèt dei
template-requirement-note = Kva grensene tel
template-requirement-note-placeholder = Notar tekne med; litteraturlista ikkje
# Beside a number of 0, in the place of its unit.
template-no-limit = inga grense

## The files the template makes.

template-outputs-hint = Filtypane dokumentet blir tilbode som når det blir eksportert.
template-output-document = Dokumentet
template-output-cover = Omslaget
template-output-cover-note = Eit eige omslag blir laga i ein seinare versjon; det malen seier om det, blir teke vare på som det er.
