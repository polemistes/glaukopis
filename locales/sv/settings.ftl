# The settings.

settings-title = Inställningar
settings-error-system = Något om programmet kunde inte läsas
settings-error-read = Inställningarna kunde inte läsas
settings-error-save = Inställningarna kunde inte sparas
settings-error-fonts = Typsnitten på den här datorn kunde inte listas
settings-error-templates = Mallarna kunde inte listas
# A damaged file of settings was renamed and left beside where it was; $path is where it is now.
settings-set-aside = Inställningarna kunde inte läsas, och har lagts undan som { $path }; standardinställningarna används
settings-set-aside-person = Inställningarna kunde inte läsas, och har lagts undan som { $path }; standardinställningarna används, och den här datorn är en ny person i projektens historik

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
settings-own-paper = Papper
settings-own-ink = Bläck
settings-own-accent = Accent
settings-own-gold = Andrastämma
settings-own-begin = Utgå från
# The contrast of the ink and of the accent on the paper, as WCAG counts it; 4.5 and 3 are what reads well.
settings-own-weak = Svårläst: bläcket står i { $ink } till 1 mot papperet och accenten i { $accent } till 1; 4,5 och 3 eller mer läses väl.
settings-text-size = Storleken på din text i textredigeraren
settings-editor-font = Typsnitt i textredigeraren
settings-editor-font-default = Som gränssnittet (Literata)
# How the text of a map shows how deep each element stands: on the screen only.
# How the text editor shows how deep each element stands: on the screen only.
settings-text-depth = Dokumentstruktur
settings-text-depth-numbers = Nummer
settings-text-depth-dots = Punkter
settings-text-depth-indent = Indraget, med linjer
# Whether the number a heading will print stands before its name in the text view and the diagram: the outline has it always.
settings-heading-numbers = Rubrikernas nummer, som dokumentet skriver ut dem
settings-heading-numbers-shown = Visade
settings-heading-numbers-hidden = Dolda
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

## Language

settings-language = Språk
settings-language-interface = Gränssnittet
settings-language-system = Som systemet ({ $language })
settings-language-texts = Språk för nya texter
# The words of the language chosen for the interface could not be read; it stays in the one it was in.
settings-language-error-load = Orden på { $language } kunde inte läsas in

## The log of the runs.

settings-logs = Loggen

## What a line of the preview is: whether a chip at the edge of a page names it.

settings-page-chips-on = På
settings-page-chips-off = Av

## The settings in plain words, stage 1: the defaults of new projects and documents, and the look chips.

# Whether a new project opens in its diagram or in its text; the choices are the names of the two views.
settings-default-view = Förvald vy för nya projekt
settings-default-type = Förvald dokumenttyp
settings-default-look = Förvalt utseende
settings-default-style = Förvald referensstil
# The first choice of each of the three defaults: none, so that a new document is of the plain type, and the type's look and style hold.
settings-default-none = Ingen, som dokumenttypen har det
# Whether a line of the preview, pressed, shows a chip at the edge of the page that says what it is and opens Look at it.
settings-look-chips = Visa utseendeetiketter i förhandsvisningen
