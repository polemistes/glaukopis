# The settings.

settings-title = Innstillingar
settings-error-system = Opplysningane om programmet kunne ikkje lesast
settings-error-read = Innstillingane kunne ikkje lesast
settings-error-save = Innstillingane kunne ikkje lagrast
settings-error-fonts = Skriftene på denne datamaskina kunne ikkje listast opp
settings-error-templates = Malane kunne ikkje listast opp
# A damaged file of settings was renamed and left beside where it was; $path is where it is now.
settings-set-aside = Innstillingane kunne ikkje lesast, og er lagde til side som { $path }; standardinnstillingane blir brukte
settings-set-aside-person = Innstillingane kunne ikkje lesast, og er lagde til side som { $path }; standardinnstillingane blir brukte, og denne datamaskina er ein ny person i historikken til prosjekta

## Appearance

settings-appearance = Utsjånad
settings-theme = Fargar
settings-theme-system = Som systemet
settings-theme-light = Lyst
settings-theme-dark = Mørkt
# A theme of pastel colours, warm and soft.
settings-theme-mellow = Mildt
settings-theme-own = Dine eigne
settings-own = Dine eigne fargar
settings-own-paper = Papir
settings-own-ink = Blekk
settings-own-accent = Aksent
settings-own-gold = Andre stemme
settings-own-begin = Byrj frå
# The contrast of the ink and of the accent on the paper, as WCAG counts it; 4.5 and 3 are what reads well.
settings-own-weak = Vanskeleg å lese: blekket står { $ink } til 1 mot papiret og aksenten { $accent } til 1; 4,5 og 3 eller meir les godt.
settings-text-size = Storleiken på teksten din i tekstredigeringa
settings-editor-font = Skrift i tekstredigeringa
settings-editor-font-default = Som grensesnittet (Literata)
# How the text of a map shows how deep each element stands: on the screen only.
# How the text editor shows how deep each element stands: on the screen only.
settings-text-depth = Dokumentstruktur
settings-text-depth-numbers = Tal
settings-text-depth-dots = Prikkar
settings-text-depth-indent = Rykt inn, med strekar
# Whether the number a heading will print stands before its name in the text view and the diagram: the outline has it always.
settings-heading-numbers = Nummera på overskriftene, slik dokumentet skriv dei ut
settings-heading-numbers-shown = Vist
settings-heading-numbers-hidden = Gøymt
settings-interface-size = Storleiken på grensesnittet
# A line of text in the size chosen, which shows the face of the letters; a
# line of Homer's Greek follows it.
# A sentence with every letter of the language's alphabet (a pangram), set in
# the size and the font chosen; where no good pangram is known, the alphabet.
settings-sample = Eg byrja å fortære ein sandwich medan eg køyrde taxi på veg til quiz.
# The three levels of the sample of the document structure, the sample sentence under the third.
settings-sample-heading = Overskrift
settings-sample-subheading = Underoverskrift
settings-sample-third = Eit tredje nivå

## New documents

settings-new-documents = Nye dokument

## You

settings-you = Opplysningar om deg
settings-first-name = Førenamn
settings-last-name = Etternamn
settings-organization = Organisasjon
settings-position = Tittel/stilling
settings-address = Adresse
settings-phone = Telefon
settings-email = E-post
settings-orcid = ORCID
settings-orcid-problem = Ein ORCID iD er fire grupper med fire siffer: 0000-0002-1825-0097.
settings-contact-problem = Det ser ikkje ut som ei e-postadresse.

## Programs: Pandoc and Typst

settings-programs = Program
settings-pandoc-need = Trengst for førehandsvisinga og for all eksport.
settings-looking = Leitar …
# "need" is what the program is needed for: settings-pandoc-need.
settings-program-missing = Ikkje funne. { $need } Installer det med pakkehandsamaren på systemet ditt, eller skriv nedanfor kvar det er.
settings-program-old = Eldre enn Glaukopis treng: { $least } eller nyare.
# The field for the path to a program, and the title of the dialog that chooses it.
settings-program-where = Kvar { $program } er
settings-program-found-by-itself = Blir funne av seg sjølv
settings-no-latex = Ingen LaTeX vart funnen. Det trengst ikkje: LaTeX-kjelde kan eksporterast utan, og PDF blir laga med Typst.
settings-look-again = Leit igjen
settings-error-programs = Kunne ikkje leite etter programma

## About

settings-about = Om programmet
settings-licence = Fri programvare under GNU General Public License, versjon 3 eller seinare. Det blir ikkje gitt nokon garanti.
settings-data = Kvar alt er lagra

## Language

settings-language = Språk
settings-language-interface = Grensesnittet
settings-language-system = Som systemet ({ $language })
settings-language-texts = Språk for nye tekstar
# The words of the language chosen for the interface could not be read; it stays in the one it was in.
settings-language-error-load = Orda på { $language } kunne ikkje lastast inn

## The log of the runs.

settings-logs = Loggen

## What a line of the preview is: whether a chip at the edge of a page names it.

settings-page-chips-on = På
settings-page-chips-off = Av

## The settings in plain words, stage 1: the defaults of new projects and documents, and the look chips.

# Whether a new project opens in its diagram or in its text; the choices are the names of the two views.
settings-default-view = Standard vising for nye prosjekt
settings-default-type = Standard dokumenttype
settings-default-look = Standard utsjånad
settings-default-style = Standard referansestil
# The first choice of each of the three defaults: none, so that a new document is of the plain type, and the type's look and style hold.
settings-default-none = Ingen: som dokumenttypen har det
# Whether a line of the preview, pressed, shows a chip at the edge of the page that says what it is and opens Look at it.
settings-look-chips = Vis brikker for utsjånaden i førehandsvisinga
