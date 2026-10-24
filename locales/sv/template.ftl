# Templates: what a document of a kind consists of (ADR 0038). Their groups,
# the parts a document is made of, the kinds of file, and the editor of a
# template.

## The groups of templates, as the chooser lists them.

template-group-own = Dina egna
template-group-plain = Att börja med
template-group-article = Artiklar och uppsatser
template-group-book = Böcker och avhandlingar
template-group-fiction = Skönlitteratur
template-group-stage = Scen och film
template-group-poetry = Poesi
template-group-other = Andra slags texter
template-group-journal = Tidskrifter
template-group-publisher = Förlag
template-group-style-guide = Stilguider

## Where a kind of element stands in the document.


## The parts of a document the application makes itself.

template-generated-half-title = Smutstitel
template-generated-title-page = Titelsida
template-generated-keywords = Nyckelord
template-generated-contents = Innehållsförteckning
template-generated-list-of-figures = Figurförteckning
template-generated-list-of-tables = Tabellförteckning
template-generated-body = Texten
template-generated-notes = Noter
template-generated-bibliography = Litteraturförteckning

## The kinds of file a template makes.

template-target-pdf = PDF
template-target-pdf-latex = PDF, satt med LaTeX
template-target-docx = Word
template-target-odt = LibreOffice Writer
template-target-latex = LaTeX
template-target-typst = Typst
template-target-markdown = Markdown
template-target-html = Webbsida
template-target-epub = E-bok

## The template editor.

template-editor = Mall
template-name = Mallens namn
# The name a template of one's own is first given, made from that of the template it is made from.
template-name-changed = { $name }, ändrad
# A template of the writer's own made from another, before it is named: by the other's name.
template-name-own = { $name }, min egen
template-sections = Mallens delar
template-bundled = Mallarna som följer med Glaukopis förblir som de är. Dina ändringar sparas som en egen mall.
template-delete = Radera den här mallen
template-save-own = Spara som min egen
template-saved = ”{ $name }” är sparad bland dina egna mallar
template-read-failed = Mallen kunde inte läsas.
template-save-failed = Mallen kunde inte sparas.
template-delete-failed = Mallen kunde inte raderas.
template-keep-failed = Mallen kunde inte sparas i projektet. På en annan dator, och i en fil av projektet, får dokumentet den vanliga mallen i stället.
template-delete-title = Radera mallen ”{ $name }”?
template-delete-message = Element som använder den kommer att använda mallen den gjordes av i stället.
template-delete-confirm = Radera mallen
template-leave-title = Lämna utan att spara?
template-leave-message = Ändringarna du har gjort i mallen går förlorade.
template-leave-confirm = Lämna
template-leave-cancel = Fortsätt redigera

## The parts of the editor, as they are chosen at the left.

template-section-about = Om den här mallen
template-section-looks = Layout och referensstil
template-section-contents = Innehåll
template-section-kinds = Slag av element
template-section-passage-kinds = Slag av stycken och ord
template-section-requirements = Krav
template-section-outputs = Filer

## About the template.

template-description = Beskrivning
template-group = Grupp
template-based-on = Bygger på
template-based-on-none = Inget särskilt
template-source-changed = Du har ändrat den här mallen; källan beskriver vad den gjordes av.
template-source-none = Den här mallen följer inga särskilda krav från något förlag.

## The layout and the reference style it brings.

template-layout = Layout
template-layout-hint = Hur sidan ser ut, för varje dokument med den här mallen
template-style = Referensstil
template-style-hint = Hur källhänvisningar och litteraturförteckningen skrivs; tomt gäller layoutens egen
# The layout or style the writer has chosen in the settings.
template-usual = Din vanliga, från inställningarna

## The contents: the order of the document.

template-contents-hint = Dokumentets ordning: de delar programmet gör själv, och varje element av ett slag, i trädets ordning. Ett slag som står före texten hör till de inledande delarna, ett som står efter den till de avslutande.
# An item of the contents that places every element of a kind.
template-contents-kind = Varje { $name }
template-contents-add-part = En del…
template-contents-add-kind = Ett slag av element…
template-contents-up = Upp
template-contents-down = Ner

## The kinds in hand.

template-kinds-hint = De slag av element som mallen tar fram: de erbjuds i menyn med slag. De som står i innehållet finns till hands, vare sig de väljs här eller inte.
template-kinds-in-contents = I innehållet
template-passage-kinds-hint = De slag av stycken och ord som mallen tar fram: de erbjuds först i skrivverktygen.

## The requirements.

template-requirements-hint = Vad ett dokument med den här mallen ska uppfylla. Checklistan och förhandsvisningen räknar mot detta; inget skärs bort.
template-requirement-words = Ord i texten
template-requirement-abstract-words = Ord i sammanfattningen
template-requirement-keywords = Nyckelord
template-requirement-note = Vad gränserna räknar
template-requirement-note-placeholder = Noter medräknade; litteraturförteckningen inte
# Beside a number of 0, in the place of its unit.
template-no-limit = ingen gräns

## The files the template makes.

template-outputs-hint = De filformat som dokumentet erbjuds i när det exporteras.
template-output-document = Dokumentet
template-output-cover = Omslaget
template-output-cover-note = Ett eget omslag görs av en senare version; det mallen säger om det behålls som det är.

## The names of the kinds of text that come with Glaukopis, as the chooser of what you are writing
## and the button over the preview give them; journals, publishers and style guides keep their own.

template-called-plain = Vanligt dokument
template-called-paper = Uppsats
template-called-article = Tidskriftsartikel
template-called-report = Rapport
template-called-book = Vetenskaplig bok
template-called-thesis = Avhandling
template-called-novel = Roman
template-called-novel-manuscript = Romanmanus
template-called-short-story = Novell
template-called-story-collection = Novellsamling
template-called-poems = Dikter
template-called-play = Pjäs
template-called-screenplay = Filmmanus
template-called-letter = Brev
template-called-blog-post = Blogginlägg
template-called-news-article = Nyhetsartikel
