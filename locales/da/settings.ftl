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
settings-text-size = Størrelsen på din tekst
settings-text-size-hint = I kortene og i tekstvisningen. Det, der eksporteres, følger dokumentformatet.
settings-interface-size = Grænsefladens størrelse
settings-interface-size-hint = Alt i vinduet, også skriften. For din tekst alene, størrelsen nedenfor.
# A line of text in the size chosen, which shows the face of the letters; a
# line of Homer's Greek follows it.
settings-sample = Syng, gudinde, om Peleus’ søn Achilleus’ vrede

## New documents

settings-new-documents = Nye dokumenter
settings-new-documents-hint = Hvad et kort begynder med. Hvert kort kan få andre i forhåndsvisningen.
settings-reference-style = Referencestil
settings-document-format = Dokumentformat

## You

settings-you = Dig
settings-name = Navn
settings-name-hint = Vises for dem, du deler projekter med. Bruges ikke ellers.
settings-contact = Adresse til bibliografiske tjenester
settings-contact-hint = Tjenester som Crossref svarer hurtigere til dem, der siger, hvordan de kan nås. Indtaster du en adresse, sendes den til dem ved hvert opslag og til ingen andre. Lad feltet stå tomt for ikke at sende nogen.
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
settings-owl = Uglen er tegnet af Robert Emil Berge efter et fotografi af en athensk tetradrakme fra Classical Numismatic Group, Inc. (http://www.cngcoins.com). Tegningen er under licensen Creative Commons Attribution-Share Alike 3.0 Unported.
settings-data = Hvor alt gemmes
# "file" is the name of the file of the library, shown as code.
settings-data-hint = Dine referencer er i { $file }, som ethvert BibLaTeX-værktøj kan læse. Kopiér denne mappe for at have en kopi af dit arbejde.
settings-lookup = Hvor referencer slås op
settings-lookup-about = DOI'er hos doi.org, Crossref og DataCite; bøger i katalogerne K10plus, de norske fagbibliotekers, Deutsche Nationalbibliotheks og Library of Congress'; preprints hos arXiv; medicinsk litteratur hos PubMed. Kun det, du skriver i opslaget, sendes til dem.

## Language

settings-language = Sprog
settings-language-interface = Grænsefladen
settings-language-interface-hint = Programmets ord. Dine tekster er på deres korts sprog.
settings-language-system = Som systemet ({ $language })
settings-language-texts = Sprog for nye tekster
settings-language-texts-hint = Det sprog, et nyt kort skrives på, og som afgør de ord, dets dokument udskriver, og den ordbog, stavningen kontrolleres med. Hvert kort kan få et andet under Sprog… i sin menu, og et projekt et eget sprog for sine nye kort.
