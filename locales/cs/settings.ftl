# The settings.

settings-title = Nastavení
settings-error-system = Něco o aplikaci nelze přečíst
settings-error-read = Nastavení nelze přečíst
settings-error-save = Nastavení nelze uložit

## Appearance

settings-appearance = Vzhled
settings-theme = Barvy
settings-theme-system = Podle systému
settings-theme-light = Světlé
settings-theme-dark = Tmavé
# A theme of pastel colours, warm and soft.
settings-theme-mellow = Jemné
settings-theme-own = Vlastní
settings-own = Vaše vlastní barvy
settings-own-hint = Čtyři barvy, z nichž plyne vše ostatní: papír, inkoust, akcent, který označuje zvolené a stisknuté, a druhý hlas, který označuje spojení a komentáře. Zda je schéma světlé, nebo tmavé, plyne z papíru.
settings-own-paper = Papír
settings-own-ink = Inkoust
settings-own-accent = Akcent
settings-own-gold = Druhý hlas
settings-own-begin = Začít od
# The contrast of the ink and of the accent on the paper, as WCAG counts it; 4.5 and 3 are what reads well.
settings-own-weak = Špatně čitelné: inkoust má na papíře kontrast { $ink } : 1 a akcent { $accent } : 1; dobře se čte 4,5 a 3 a více.
settings-text-size = Velikost vašeho textu
settings-text-size-hint = V mapách a v textovém zobrazení. Co se exportuje, řídí se formátem dokumentu.
settings-interface-size = Velikost rozhraní
settings-interface-size-hint = Vše v okně, i psaní. Jen pro váš text slouží velikost níže.
# A line of text in the size chosen, which shows the face of the letters; a
# line of Homer's Greek follows it.
settings-sample = Hněv mi, bohyně, pěj Péleovce Achilléa

## New documents

settings-new-documents = Nové dokumenty
settings-new-documents-hint = Čím mapa začíná. Každé mapě lze v náhledu dát jiné.
settings-reference-style = Citační styl
settings-document-format = Formát dokumentu

## You

settings-you = Vy
settings-name = Jméno
settings-name-hint = Zobrazuje se těm, s nimiž sdílíte projekty. Jinak se nepoužívá.
settings-contact = Adresa pro bibliografické služby
settings-contact-hint = Služby jako Crossref ochotněji odpovídají těm, kdo řeknou, jak je zastihnout. Zadáte-li adresu, posílá se jim s každým dohledáním a nikomu jinému. Ponecháte-li pole prázdné, neposílá se žádná.
settings-contact-problem = To nevypadá jako adresa.

## Programs: Pandoc and Typst

settings-programs = Programy
settings-programs-about = Glaukopis vytváří dokumenty Pandocem, který se najde sám, je-li nainstalován obvyklým způsobem. Stránky náhledu a PDF sází Typst, který je součástí Glaukopis.
settings-pandoc-need = Je potřeba pro náhled a pro každý export.
settings-looking = Hledá se…
# "need" is what the program is needed for: settings-pandoc-need.
settings-program-missing = Nenalezen. { $need } Nainstalujte ho správcem balíčků svého systému, nebo níže řekněte, kde je.
settings-program-old = Starší, než Glaukopis potřebuje: { $least } nebo novější.
# The field for the path to a program, and the title of the dialog that chooses it.
settings-program-where = Kde je { $program }
settings-program-found-by-itself = Nalezen sám
settings-no-latex = LaTeX nebyl nalezen. Není potřeba: zdroj LaTeXu lze exportovat i bez něj a PDF se vytváří Typstem.
settings-look-again = Hledat znovu
settings-error-programs = Programy nelze hledat

## About

settings-about = O aplikaci
settings-licence = Svobodný software pod licencí GNU General Public License, verze 3 nebo pozdější. Je bez záruky.
settings-owl = Sovu nakreslil Robert Emil Berge podle fotografie athénské tetradrachmy od Classical Numismatic Group, Inc. (http://www.cngcoins.com). Kresba je pod licencí Creative Commons Uveďte původ-Zachovejte licenci 3.0 Unported.
settings-data = Kde se vše uchovává
# "file" is the name of the file of the library, shown as code.
settings-data-hint = Vaše záznamy jsou v { $file }, který přečte kterýkoli nástroj BibLaTeXu. Chcete-li mít kopii své práce, zkopírujte tuto složku.
settings-lookup = Kde se záznamy dohledávají
settings-lookup-about = DOI na doi.org, v Crossrefu a DataCite; knihy v katalozích K10plus, norských akademických knihoven, Deutsche Nationalbibliothek a Library of Congress; preprinty v arXivu; lékařská literatura v PubMedu. Posílá se jim jen to, co napíšete do dohledání.

## Language

settings-language = Jazyk
settings-language-interface = Rozhraní
settings-language-interface-hint = Slova aplikace. Vaše texty jsou v jazyce svých map.
settings-language-system = Podle systému ({ $language })
settings-language-texts = Jazyk nových textů
settings-language-texts-hint = V čem se píše nová mapa, což rozhoduje o slovech, která tiskne její dokument, a o slovníku, podle něhož se kontroluje pravopis. Každé mapě lze dát jiný v Jazyky… v její nabídce a projektu vlastní jazyk pro jeho nové mapy.
