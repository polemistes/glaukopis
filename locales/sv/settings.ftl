# The settings.

settings-title = Inställningar
settings-error-system = Något om programmet kunde inte läsas
settings-error-read = Inställningarna kunde inte läsas
settings-error-save = Inställningarna kunde inte sparas

## Appearance

settings-appearance = Utseende
settings-theme = Färger
settings-theme-system = Som systemet
settings-theme-light = Ljust
settings-theme-dark = Mörkt
# A theme of pastel colours, warm and soft.
settings-theme-mellow = Milt
settings-theme-own = Dina egna
settings-own = Dina egna färger
settings-own-hint = Fyra färger, ur vilka de andra följer: papperet, bläcket, accenten som märker det som är valt och nedtryckt, och andrastämman som märker associationer och kommentarer. Om färgschemat är ljust eller mörkt följer av papperet.
settings-own-paper = Papper
settings-own-ink = Bläck
settings-own-accent = Accent
settings-own-gold = Andrastämma
settings-own-begin = Utgå från
# The contrast of the ink and of the accent on the paper, as WCAG counts it; 4.5 and 3 are what reads well.
settings-own-weak = Svårläst: bläcket står i { $ink } till 1 mot papperet och accenten i { $accent } till 1; 4,5 och 3 eller mer läses väl.
settings-text-size = Storleken på din text i textredigeraren
settings-text-size-hint = I förhållande till gränssnittet. Teckenstorlekarna i dokumentets förhandsvisning och export påverkas inte av detta.
settings-editor-font = Typsnitt i textredigeraren
settings-editor-font-hint = Välj typsnitt för din text i redigeraren.
settings-editor-font-default = Som gränssnittet (Literata)
# How the text of a map shows how deep each element stands: on the screen only.
# How the text editor shows how deep each element stands: on the screen only.
settings-text-depth = Dokumentstruktur
settings-text-depth-hint = Hur textredigeraren visar strukturen i din text.
settings-text-depth-numbers = Nummer
settings-text-depth-dots = Punkter
settings-text-depth-indent = Indraget, med linjer
settings-interface-size = Gränssnittets storlek
# A line of text in the size chosen, which shows the face of the letters; a
# line of Homer's Greek follows it.
# A sentence with every letter of the language's alphabet (a pangram), set in
# the size and the font chosen; where no good pangram is known, the alphabet.
settings-sample = Yxmördaren Julia Blomqvist på fäktning i Schweiz.
# The three levels of the sample of the document structure, the sample sentence under the third.
settings-sample-heading = Rubrik
settings-sample-subheading = Underrubrik
settings-sample-third = En tredje nivå

## New documents

settings-new-documents = Nya dokument
# Whether a new project opens in its diagram or in its text; the choices are the names of the two views.
settings-new-project-view = Nya projekt öppnas i
settings-new-project-view-hint = Vyn som ett projekt öppnas i när det just har skapats.
settings-template = Mall
settings-document-format = Layout
settings-reference-style = Referensstil

## You

settings-you = Dina uppgifter
settings-first-name = Förnamn
settings-last-name = Efternamn
settings-organization = Organisation
settings-position = Titel/befattning
settings-address = Adress
settings-phone = Telefon
settings-email = E-post
settings-orcid = ORCID
settings-orcid-problem = Ett ORCID iD är fyra grupper om fyra siffror: 0000-0002-1825-0097.
settings-contact-problem = Det ser inte ut som en adress.

## Programs: Pandoc and Typst

settings-programs = Program
settings-programs-about = Glaukopis gör dokument med Pandoc, som hittas av sig självt där det är installerat på vanligt sätt. Förhandsvisningens och PDF:ens sidor sätts av Typst, som är en del av Glaukopis.
settings-pandoc-need = Behövs för förhandsvisningen och för varje export.
settings-looking = Letar…
# "need" is what the program is needed for: settings-pandoc-need.
settings-program-missing = Hittades inte. { $need } Installera det med systemets pakethanterare, eller ange nedan var det finns.
settings-program-old = Äldre än vad Glaukopis behöver: { $least } eller nyare.
# The field for the path to a program, and the title of the dialog that chooses it.
settings-program-where = Var { $program } finns
settings-program-found-by-itself = Hittat av sig självt
settings-no-latex = Inget LaTeX hittades. Det behövs inte: LaTeX-källa kan exporteras utan det, och PDF görs med Typst.
settings-look-again = Leta igen
settings-error-programs = Programmen kunde inte letas upp

## About

settings-about = Om
settings-licence = Fri programvara under GNU General Public License, version 3 eller senare. Den levereras utan garanti.
settings-data = Var allt sparas
# "file" is the name of the file of the library, shown as code.
settings-data-hint = Dina referenser finns i { $file }, som vilket BibLaTeX-verktyg som helst kan läsa. För att ta en kopia av ditt arbete, kopiera den här mappen.

## Language

settings-language = Språk
settings-language-interface = Gränssnittet
settings-language-system = Som systemet ({ $language })
settings-language-texts = Språk för nya texter

## The log of the runs.

settings-logs = Loggen
settings-logs-hint = Vad Glaukopis berättar om sig självt varje gång det körs, för de senaste { $count } körningarna: vad det gjorde, vad som gick fel, och vad som hände med dess fönster. Till nytta när något har gått fel och ingen såg varför.
