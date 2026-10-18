# The settings.

settings-title = Indstillinger
settings-error-system = Noget om programmet kunne ikke læses
settings-error-read = Indstillingerne kunne ikke læses
settings-error-save = Indstillingerne kunne ikke gemmes

## Appearance

settings-appearance = Udseende
settings-theme = Farver
settings-theme-system = Som systemet
settings-theme-light = Lyst
settings-theme-dark = Mørkt
# A theme of pastel colours, warm and soft.
settings-theme-mellow = Mildt
settings-theme-own = Dine egne
settings-own = Dine egne farver
settings-own-hint = Fire farver, som resten følger af: papiret, blækket, accenten, der markerer det valgte og trykkede, og den anden stemme, der markerer associationer og kommentarer. Om farverne er lyse eller mørke, følger af papiret.
settings-own-paper = Papir
settings-own-ink = Blæk
settings-own-accent = Accent
settings-own-gold = Anden stemme
settings-own-begin = Begynd fra
# The contrast of the ink and of the accent on the paper, as WCAG counts it; 4.5 and 3 are what reads well.
settings-own-weak = Svært at læse: blækket står { $ink } til 1 mod papiret og accenten { $accent } til 1; 4,5 og 3 eller mere læses godt.
settings-text-size = Størrelsen på din tekst i teksteditoren
settings-text-size-hint = I forhold til grænsefladen. Skriftstørrelserne i forhåndsvisningen og i det, der eksporteres, påvirkes ikke af det.
settings-editor-font = Skrift i teksteditoren
settings-editor-font-hint = Vælg skriften for din tekst i teksteditoren.
settings-editor-font-default = Som grænsefladen (Literata)
# How the text of a map shows how deep each element stands: on the screen only.
# How the text editor shows how deep each element stands: on the screen only.
settings-text-depth = Dokumentstruktur
settings-text-depth-hint = Hvordan teksteditoren viser dokumentstrukturen i din tekst.
settings-text-depth-numbers = Numre
settings-text-depth-dots = Prikker
settings-text-depth-indent = Rykket ind, med streger
settings-interface-size = Grænsefladens størrelse
# A line of text in the size chosen, which shows the face of the letters; a
# line of Homer's Greek follows it.
# A sentence with every letter of the language's alphabet (a pangram), set in
# the size and the font chosen; where no good pangram is known, the alphabet.
settings-sample = Quizdeltagerne spiste jordbær med fløde, mens cirkusklovnen Walther spillede på xylofon.
# The three levels of the sample of the document structure, the sample sentence under the third.
settings-sample-heading = Overskrift
settings-sample-subheading = Underoverskrift
settings-sample-third = Et tredje niveau

## New documents

settings-new-documents = Nye dokumenter
# Whether a new project opens in its diagram or in its text; the choices are the names of the two views.
settings-new-project-view = Nye projekter åbnes i
settings-new-project-view-hint = Den visning, som et projekt åbnes i, når det lige er oprettet.
settings-template = Skabelon
settings-document-format = Opsætning
settings-reference-style = Referencestil

## You

settings-you = Dine oplysninger
settings-first-name = Fornavn
settings-last-name = Efternavn
settings-organization = Organisation
settings-position = Titel/stilling
settings-address = Adresse
settings-phone = Telefon
settings-email = E-mail
settings-orcid = ORCID
settings-orcid-problem = Et ORCID iD er fire grupper med fire cifre: 0000-0002-1825-0097.
settings-contact-problem = Det ligner ikke en adresse.

## Programs: Pandoc and Typst

settings-programs = Programmer
settings-programs-about = Glaukopis laver dokumenter med Pandoc, som findes af sig selv, hvor det er installeret på den sædvanlige måde. Siderne i forhåndsvisningen og i en PDF sættes af Typst, som er en del af Glaukopis.
settings-pandoc-need = Behøves til forhåndsvisningen og til al eksport.
settings-looking = Leder…
# "need" is what the program is needed for: settings-pandoc-need.
settings-program-missing = Ikke fundet. { $need } Installer det med dit systems pakkehåndtering, eller sig nedenfor, hvor det er.
settings-program-old = Ældre, end Glaukopis behøver: { $least } eller nyere.
# The field for the path to a program, and the title of the dialog that chooses it.
settings-program-where = Hvor { $program } er
settings-program-found-by-itself = Fundet af sig selv
settings-no-latex = Der blev ikke fundet nogen LaTeX. Det behøves ikke: LaTeX-kilde kan eksporteres uden, og PDF laves med Typst.
settings-look-again = Se efter igen
settings-error-programs = Der kunne ikke ledes efter programmerne

## About

settings-about = Om
settings-licence = Fri software under GNU General Public License, version 3 eller senere. Den leveres uden garanti.
settings-data = Hvor alt gemmes
# "file" is the name of the file of the library, shown as code.
settings-data-hint = Dine referencer er i { $file }, som ethvert BibLaTeX-værktøj kan læse. Kopiér denne mappe for at have en kopi af dit arbejde.

## Language

settings-language = Sprog
settings-language-interface = Grænsefladen
settings-language-system = Som systemet ({ $language })
settings-language-texts = Sprog for nye tekster

## The log of the runs.

settings-logs = Loggen
settings-logs-hint = Det, Glaukopis fortæller om sig selv, hver gang det kører, for de seneste { $count } gange: hvad det gjorde, hvad der gik galt, og hvad der blev af dets vindue. Nyttigt, når noget er gået galt, og ingen så hvorfor.
