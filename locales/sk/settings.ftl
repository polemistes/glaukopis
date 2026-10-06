# The settings.

settings-title = Nastavenia
settings-error-system = Niečo o aplikácii sa nepodarilo prečítať
settings-error-read = Nastavenia sa nepodarilo prečítať
settings-error-save = Nastavenia sa nepodarilo uložiť

## Appearance

settings-appearance = Vzhľad
settings-theme = Farby
settings-theme-system = Ako systém
settings-theme-light = Svetlé
settings-theme-dark = Tmavé
# A theme of pastel colours, warm and soft.
settings-theme-mellow = Jemné
settings-theme-own = Vlastné
settings-own = Vaše vlastné farby
settings-own-hint = Štyri farby, z ktorých vyplývajú ostatné: papier, atrament, dôraz, ktorý označuje vybrané a stlačené, a druhý hlas, ktorý označuje spojenia a komentáre. Či je schéma svetlá alebo tmavá, vyplýva z papiera.
settings-own-paper = Papier
settings-own-ink = Atrament
settings-own-accent = Dôraz
settings-own-gold = Druhý hlas
settings-own-begin = Začať od
# The contrast of the ink and of the accent on the paper, as WCAG counts it; 4.5 and 3 are what reads well.
settings-own-weak = Ťažko čitateľné: atrament má na papieri kontrast { $ink } : 1 a dôraz { $accent } : 1; dobre sa číta od 4,5 a 3.
settings-text-size = Veľkosť vášho textu
settings-text-size-hint = V mapách a v textovom zobrazení. Čo sa exportuje, sa riadi formátom dokumentu.
settings-interface-size = Veľkosť rozhrania
settings-interface-size-hint = Všetko v okne, aj písanie. Pre samotný text veľkosť nižšie.
# A line of text in the size chosen, which shows the face of the letters; a
# line of Homer's Greek follows it.
settings-sample = Hnev, bohyňa, ospievaj Achilla, Péleovho syna

## New documents

settings-new-documents = Nové dokumenty
settings-new-documents-hint = S čím mapa začína. Každej mape možno v náhľade dať iný.
settings-reference-style = Citačný štýl
settings-document-format = Formát dokumentu

## You

settings-you = Vy
settings-name = Meno
settings-name-hint = Zobrazuje sa tým, s ktorými zdieľate projekty. Inak sa nepoužíva.
settings-contact = Adresa pre bibliografické služby
settings-contact-hint = Služby ako Crossref odpovedajú ochotnejšie tým, ktorí povedia, ako ich zastihnúť. Ak zadáte adresu, posiela sa im s každým dohľadaním, a nikomu inému. Nechajte prázdne, ak nechcete posielať žiadnu.
settings-contact-problem = To nevyzerá ako adresa.

## Programs: Pandoc and Typst

settings-programs = Programy
settings-programs-about = Glaukopis vytvára dokumenty Pandocom, ktorý sa nájde sám, ak je nainštalovaný zvyčajným spôsobom. Strany náhľadu a PDF sádže Typst, ktorý je súčasťou Glaukopisu.
settings-pandoc-need = Potrebný pre náhľad a pre každý export.
settings-looking = Hľadá sa…
# "need" is what the program is needed for: settings-pandoc-need.
settings-program-missing = Nenašiel sa. { $need } Nainštalujte ho správcom balíkov vášho systému alebo nižšie povedzte, kde je.
settings-program-old = Starší, než Glaukopis potrebuje: { $least } alebo novší.
# The field for the path to a program, and the title of the dialog that chooses it.
settings-program-where = Kde je { $program }
settings-program-found-by-itself = Nájdený sám
settings-no-latex = Nenašiel sa žiadny LaTeX. Nie je potrebný: zdroj LaTeXu sa dá exportovať aj bez neho a PDF sa vytvára Typstom.
settings-look-again = Hľadať znova
settings-error-programs = Programy sa nepodarilo hľadať

## About

settings-about = O aplikácii
settings-licence = Slobodný softvér pod licenciou GNU General Public License, verzia 3 alebo novšia. Dodáva sa bez záruky.
settings-owl = Sovu nakreslil Robert Emil Berge podľa fotografie aténskej tetradrachmy od Classical Numismatic Group, Inc. (http://www.cngcoins.com). Kresba je pod licenciou Creative Commons Attribution-Share Alike 3.0 Unported.
settings-data = Kde sa všetko uchováva
# "file" is the name of the file of the library, shown as code.
settings-data-hint = Vaše záznamy sú v { $file }, ktorý prečíta každý nástroj pre BibLaTeX. Ak si chcete uchovať kópiu svojej práce, skopírujte tento priečinok.
settings-lookup = Kde sa dohľadávajú záznamy
settings-lookup-about = DOI na doi.org, v Crossrefe a DataCite; knihy v katalógoch K10plus, nórskych akademických knižníc, Deutsche Nationalbibliothek a Kongresovej knižnice; preprinty na arXive; medicínska literatúra v PubMede. Posiela sa im len to, čo napíšete do dohľadania.

## Language

settings-language = Jazyk
settings-language-interface = Rozhranie
settings-language-interface-hint = Slová aplikácie. Vaše texty sú v jazyku svojich máp.
settings-language-system = Ako systém ({ $language })
settings-language-texts = Jazyk nových textov
settings-language-texts-hint = V čom sa píše nová mapa, čo určuje slová, ktoré jej dokument tlačí, a slovník, podľa ktorého sa kontroluje pravopis. Každej mape možno dať iný pod Jazyky… v jej ponuke a projektu vlastný jazyk pre jeho nové mapy.
