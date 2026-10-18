# The credits of Glaukopis: what it is built on and comes with, with their
# licences, in the window that a button in the About section of the
# settings opens. The names of the projects and their licences are not
# translated: they are in src/lib/settings/credits.ts.

credits-button = Poděkování a licence…
credits-title = Poděkování a licence
credits-own-licence = Glaukopis je svobodný software pod licencí GNU General Public License, verze 3 nebo pozdější (GPL-3.0-or-later). Stojí na práci projektů uvedených níže, podle licencí, pod nimiž ji poskytují.
# Before the authors of a project, where its licence asks for them to be named.
credits-by = Autorství: { $who }
# What a name stands for, when it is a link: "Opens { $url }".
credits-open = Otevře { $url }

## The groups

credits-group-built-on = Na čem stojí
credits-group-copied = Převzatý kód
credits-group-fonts = Písma
credits-group-data = Styly, slovníky a další data
credits-group-programs = Programy, s nimiž spolupracuje, jsou-li nainstalovány
credits-group-icons = Ikony
credits-group-owl = Sova
credits-group-lookup = Kde se dohledávají záznamy
credits-lookup-about = DOI v doi.org, Crossrefu a DataCite; knihy v katalozích K10plus, norských akademických knihoven, Deutsche Nationalbibliothek a Library of Congress; preprinty v arXivu; lékařská literatura v PubMedu. Posílá se jim jen to, co napíšete do dohledání.

## What each is to Glaukopis

credits-what-tauri = Rámec aplikace: její okno a cesta mezi rozhraním a vším ostatním.
credits-what-tauri-plugins = Okna pro výběr souborů a složek a otevírání souborů a adres v jiných programech.
credits-what-webkitgtk = Webové jádro, v němž se na Linuxu zobrazuje rozhraní. Je součástí systému, ne Glaukopis.
credits-what-gtk = Co se na Linuxu děje s oknem a se stránkou, pro protokol.
credits-what-svelte = Je v něm napsáno rozhraní.
credits-what-prosemirror = Editor textů.
credits-what-yjs = Uchovává projekty, takže změny lze vracet a sdílet s ostatními hned, jak vznikají.
credits-what-y-prosemirror = Spojuje editor textů s tím, co uchovává projekt.
credits-what-y-protocols = Cesta, kterou změny sdíleného projektu putují na server a zpět.
credits-what-lib0 = Drobné nástroje, z nichž je postaven Yjs a jimiž rozhraní zapisuje, co posílá na server.
credits-what-yrs = Uchovává sdílené projekty na serveru dodávaném s Glaukopis.
credits-what-fractional-indexing = Udržuje pořadí prvků a druhů, když je přesouvá více lidí najednou.
credits-what-fluent-js = Slova rozhraní ve všech jazycích.
credits-what-fluent-rs = Slova jádra ve všech jazycích a kontrola vlastních překladů.
credits-what-pluralrules = Který tvar slova patří k číslu, v každém jazyce.
credits-what-unic-langid = Čte názvy jazyků.
credits-what-sys-locale = Zjišťuje jazyk systému.
credits-what-typst = Sází stránky náhledu a vytváří soubory PDF.
credits-what-comemo = Pamatuje si, co Typst už spočítal, aby se stránky znovu vysázely rychle.
credits-what-hayro = Vykresluje stránky souborů PDF, aby se dal číst jejich text a aby se daly zobrazit.
credits-what-lopdf = Čte a zapisuje soubory PDF: pro text, který PDF má, i pro text položený přes sken.
credits-what-pdf-text-part = Čte písma a mapy znaků souborů PDF pro kód pdf-extract převzatý do Glaukopis.
credits-what-image = Čte a zapisuje obrázky.
credits-what-rusqlite = Čte databázi Zotera, aby se daly importovat jeho záznamy.
credits-what-sqlite = Databáze, v níž Zotero uchovává své záznamy, čtená pomocí rusqlite. Na Windows a macOS je zakompilována; na Linuxu se používá systémová.
credits-what-roxmltree = Čte XML: citační styly, dokumenty Wordu a to, co posílají katalogy.
credits-what-zip = Čte a zapisuje soubory Wordu a OpenDocument, projekty jako soubory a jazykové balíčky.
credits-what-calamine = Čte tabulkové sešity, pro načítané tabulky.
credits-what-encoding-rs = Čte text v kódováních, která mají starší soubory.
credits-what-spellbook = Kontroluje pravopis se slovníky Hunspellu.
credits-what-icu = Ví, co je který znak, pro hledání slov.
credits-what-unicode-normalization = Převádí písmena s diakritikou na jednu podobu, aby se dala najít a porovnat.
credits-what-strsim = Jak jsou si podobná dvě jména nebo dva názvy, pro hledání duplicit.
credits-what-ureq = Komunikuje se službami, v nichž se dohledávají záznamy, a se serverem jazykových balíčků.
credits-what-sha2 = Rozlišuje soubory podle toho, co obsahují.
credits-what-base64 = Přenáší obrázky a soubory jako text.
credits-what-serde = Čte a zapisuje data Glaukopis jako JSON.
credits-what-uuid = Dává všemu, co se uchovává, vlastní jméno.
credits-what-time = Data a časy.
credits-what-tempfile = Zapisuje soubory bezpečně, přes soubor vedle nich.
credits-what-tracing = Protokol toho, co aplikace dělá.
credits-what-thiserror = Chyby serveru dodávaného s Glaukopis.
credits-what-tokio = Pohání server dodávaný s Glaukopis, pro sdílení projektů.
credits-what-axum = Odpovídá těm, kdo se připojí k serveru dodávanému s Glaukopis.
credits-what-futures = Zpracovává, co server přijímá a odesílá, průběžně, jak to přichází.
credits-what-clap = Čte, s čím se spouští server dodávaný s Glaukopis.
credits-what-getrandom = Vytváří tokeny a kódy pozvánek serveru dodávaného s Glaukopis.
credits-what-pdf-extract = Čte text souborů PDF. Převzat do Glaukopis jako pdf-text a upraven tak, aby udával názvy glyfů.
credits-what-wrap-it = Nechává text obtékat to, co stojí vedle něj, na stránkách, které sází Typst. Dodává se s Glaukopis, zkrácený.
credits-what-literata = Písmo textů v rozhraní.
credits-what-inter = Písmo rozhraní.
credits-what-stix = Písmo matematiky v rozhraní.
credits-what-typst-font = Písmo, které se dodává s Typstem, pro stránky dokumentů. V instalátorech pro Windows a macOS; na Linuxu se používá systémové.
credits-what-foxit = Písma, která zastupují čtrnáct standardních písem PDF, když se vykreslují soubory PDF a když se sázejí obrázky v PDF.
credits-what-csl-styles = Citační styly, které jsou součástí Glaukopis, a ty, které se stahují z repozitáře.
credits-what-csl-locales = Slova citací v každém jazyce: „strana“, „kapitola“ a podobně.
credits-what-ordboka = Slova slovníků norského bokmålu a nynorsku, které jsou součástí Glaukopis.
credits-what-ordbank = Tvary slov ve slovnících norštiny.
credits-what-spell-norwegian = Pravidla slovníků norštiny.
credits-what-spelling-en-us = Slovník americké angličtiny, ze serveru jazykových balíčků.
credits-what-spelling-en-gb = Slovník britské angličtiny, ze serveru jazykových balíčků.
credits-what-spelling-sv = Slovník švédštiny, ze serveru jazykových balíčků.
credits-what-spelling-da = Slovník dánštiny, ze serveru jazykových balíčků.
credits-what-spelling-de = Slovník němčiny, ze serveru jazykových balíčků.
credits-what-spelling-fr = Slovník francouzštiny, ze serveru jazykových balíčků.
credits-what-spelling-it = Slovník italštiny, ze serveru jazykových balíčků.
credits-what-tessdata = Data, jimiž Tesseract čte jednotlivé jazyky, ze serveru jazykových balíčků.
credits-what-pandoc = Načítá dokumenty z Wordu a jiných formátů a vytváří dokumenty jako Word, OpenDocument, LaTeX, HTML a EPUB.
credits-what-tesseract = Čte text skenů a obrázků.
credits-what-poppler = Vykresluje stránky souborů PDF, které jinak vykreslit nelze, aby se dal číst jejich text.
credits-what-latex = Vytváří soubory PDF z dokumentu vytvořeného jako LaTeX, pomocí LuaLaTeXu, XeLaTeXu nebo pdfLaTeXu.
credits-what-lucide = Ikony rozhraní.
credits-what-feather = Některé ikony Lucide jsou nakresleny podle ikon Feather.
credits-name-owl = Sova Glaukopis
credits-what-owl = Znak a ikona Glaukopis: sova Athény, kterou nakreslil Robert Emil Berge podle fotografie athénské tetradrachmy. Kdo kresbu použije, uvede jej jako jejího autora a Classical Numismatic Group, Inc. (http://www.cngcoins.com) jako zdroj předlohy.
credits-what-owl-photo = Fotografie, podle níž je sova nakreslena: athénská tetradrachma z let 454–404 př. n. l., od Classical Numismatic Group, Inc. (http://www.cngcoins.com).
