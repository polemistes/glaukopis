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
settings-text-size = Storleken på din text
settings-text-size-hint = I kartorna och textvyn. Det som exporteras följer dokumentformatet.
settings-interface-size = Gränssnittets storlek
settings-interface-size-hint = Allt i fönstret, skriften också. För bara din text, storleken nedan.
# A line of text in the size chosen, which shows the face of the letters; a
# line of Homer's Greek follows it.
settings-sample = Sjung, o gudinna, om vreden som brann hos Peliden Akilles

## New documents

settings-new-documents = Nya dokument
settings-new-documents-hint = Vad en karta börjar med. Varje karta kan ges något annat, i förhandsvisningen.
settings-reference-style = Referensstil
settings-document-format = Dokumentformat

## You

settings-you = Du
settings-name = Namn
settings-name-hint = Visas för dem du delar projekt med. Används inte annars.
settings-contact = Adress till bibliografiska tjänster
settings-contact-hint = Tjänster som Crossref svarar villigare dem som säger hur de kan nås. Om du anger en adress skickas den till dem vid varje uppslagning, och till ingen annan. Lämna tom för att inte skicka någon.
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
settings-owl = Ugglan är tecknad av Robert Emil Berge, efter ett fotografi av en atensk tetradrachm från Classical Numismatic Group, Inc. (http://www.cngcoins.com). Teckningen är under licensen Creative Commons Erkännande-DelaLika 3.0 Unported.
settings-data = Var allt sparas
# "file" is the name of the file of the library, shown as code.
settings-data-hint = Dina referenser finns i { $file }, som vilket BibLaTeX-verktyg som helst kan läsa. För att ta en kopia av ditt arbete, kopiera den här mappen.
settings-lookup = Var referenser slås upp
settings-lookup-about = DOI hos doi.org, Crossref och DataCite; böcker i katalogerna K10plus, de norska akademiska bibliotekens, Deutsche Nationalbibliotheks och Library of Congress; preprints hos arXiv; medicinsk litteratur hos PubMed. Bara det du skriver i uppslagningen skickas till dem.

## Language

settings-language = Språk
settings-language-interface = Gränssnittet
settings-language-interface-hint = Programmets ord. Dina texter är på sina kartors språk.
settings-language-system = Som systemet ({ $language })
settings-language-texts = Språk för nya texter
settings-language-texts-hint = Vad en ny karta skrivs på, vilket avgör vilka ord dess dokument skriver ut och vilken ordlista stavningen kontrolleras mot. Varje karta kan ges ett annat under Språk… i sin meny, och ett projekt ett eget språk för sina nya kartor.
