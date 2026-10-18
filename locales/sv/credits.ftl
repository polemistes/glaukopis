# The credits of Glaukopis: what it is built on and comes with, with their
# licences, in the window that a button in the About section of the
# settings opens. The names of the projects and their licences are not
# translated: they are in src/lib/settings/credits.ts.

credits-button = Medverkande och licenser…
credits-title = Medverkande och licenser
credits-own-licence = Glaukopis är fri programvara under GNU General Public License, version 3 eller senare (GPL-3.0-or-later). Det är gjort med arbete från projekten nedan, under de licenser de ger.
# Before the authors of a project, where its licence asks for them to be named.
credits-by = Av { $who }
# What a name stands for, when it is a link: "Opens { $url }".
credits-open = Öppnar { $url }

## The groups

credits-group-built-on = Vad det bygger på
credits-group-copied = Kod som tagits in i det
credits-group-fonts = Typsnitt
credits-group-data = Stilar, ordlistor och andra data
credits-group-programs = Program det arbetar med, där de är installerade
credits-group-icons = Ikoner
credits-group-owl = Ugglan
credits-group-lookup = Där referenser slås upp
credits-lookup-about = DOI:er hos doi.org, Crossref och DataCite; böcker i katalogerna K10plus, de norska akademiska bibliotekens, Deutsche Nationalbibliotheks och Library of Congress; preprints hos arXiv; medicinsk litteratur hos PubMed. Bara det du skriver i uppslagningen skickas till dem.

## What each is to Glaukopis

credits-what-tauri = Programmets ram: dess fönster, och vägen mellan gränssnittet och resten.
credits-what-tauri-plugins = Fönstren där filer och mappar väljs, och öppnandet av filer och adresser i andra program.
credits-what-webkitgtk = Webbmotorn som gränssnittet visas i, på Linux. Den är en del av systemet, inte av Glaukopis.
credits-what-gtk = Vad som blir av fönstret och sidan på Linux, för loggen.
credits-what-svelte = Gränssnittet är skrivet med det.
credits-what-prosemirror = Redigeraren för texter.
credits-what-yjs = Håller projekten, så att ändringar kan ångras och delas med andra medan de görs.
credits-what-y-prosemirror = Förenar redigeraren för texter med det som ett projekt håller.
credits-what-y-protocols = Hur ändringar i ett delat projekt går till och från servern.
credits-what-lib0 = Små verktyg som Yjs är byggt med, och som gränssnittet skriver det det skickar till servern med.
credits-what-yrs = Håller delade projekt i servern som följer med Glaukopis.
credits-what-fractional-indexing = Håller ordningen mellan element och slag när flera personer flyttar dem samtidigt.
credits-what-fluent-js = Gränssnittets ord, på alla språk.
credits-what-fluent-rs = Kärnans ord, på alla språk, och kontrollen av ord du själv har ändrat.
credits-what-pluralrules = Vilken form av ett ord som hör till ett tal, på varje språk.
credits-what-unic-langid = Läser namnen på språk.
credits-what-sys-locale = Tar reda på systemets språk.
credits-what-typst = Sätter förhandsvisningens sidor och gör PDF-filerna.
credits-what-comemo = Minns vad Typst har räknat ut, så att sidor sätts om snabbt.
credits-what-hayro = Ritar upp sidorna i PDF-filer, för att läsa deras text och för att visa dem.
credits-what-lopdf = Läser och skriver PDF-filer, för den text en PDF har och för texten som läggs över en inskanning.
credits-what-pdf-text-part = Läser typsnitten och teckentabellerna i PDF-filer, för den kod ur pdf-extract som tagits in i Glaukopis.
credits-what-image = Läser och skriver bilder.
credits-what-rusqlite = Läser Zoteros databas, för att importera dess referenser.
credits-what-sqlite = Databasen som Zotero håller sina referenser i, läst genom rusqlite. Följer med i programmet på Windows och macOS; på Linux används systemets.
credits-what-roxmltree = Läser XML: referensstilar, Word-dokument och det som kataloger skickar.
credits-what-zip = Läser och skriver Word- och OpenDocument-filer, projekt som filer och språkpaket.
credits-what-calamine = Läser kalkylblad, för tabeller som hämtas in.
credits-what-encoding-rs = Läser text i de teckenkodningar som äldre filer har.
credits-what-spellbook = Kontrollerar stavningen, med ordlistor för Hunspell.
credits-what-icu = Vet vad varje tecken är, för att hitta ord.
credits-what-unicode-normalization = Ger bokstäver med diakritiska tecken en och samma form, så att de hittas och kan jämföras.
credits-what-strsim = Hur lika två namn eller titlar är, för att hitta dubbletter.
credits-what-ureq = Talar med tjänsterna där referenser slås upp, och med servern för språkpaket.
credits-what-sha2 = Skiljer filer åt efter vad de innehåller.
credits-what-base64 = Bär bilder och filer som text.
credits-what-serde = Läser och skriver Glaukopis data som JSON.
credits-what-uuid = Ger allt som sparas ett eget namn.
credits-what-time = Datum och tider.
credits-what-tempfile = Skriver filer säkert, genom en fil bredvid dem.
credits-what-tracing = Loggen över vad programmet gör.
credits-what-thiserror = Felen i servern som följer med Glaukopis.
credits-what-tokio = Kör servern som följer med Glaukopis, för att dela projekt.
credits-what-axum = Svarar dem som ansluter till servern som följer med Glaukopis.
credits-what-futures = Hanterar det servern får och skickar, efter hand som det kommer.
credits-what-clap = Läser vad servern som följer med Glaukopis startas med.
credits-what-getrandom = Gör nycklarna och inbjudningskoderna för servern som följer med Glaukopis.
credits-what-pdf-extract = Läser texten i PDF-filer. Har tagits in i Glaukopis som pdf-text och ändrats, så att den ger namnen på glyferna.
credits-what-wrap-it = Låter text flyta runt det som står bredvid den, på de sidor Typst sätter. Följer med Glaukopis, förkortad.
credits-what-literata = Typsnittet för texter i gränssnittet.
credits-what-inter = Gränssnittets typsnitt.
credits-what-stix = Typsnittet för matematik i gränssnittet.
credits-what-typst-font = Ett typsnitt som följer med Typst, för dokumentens sidor. I installationsprogrammen för Windows och macOS; på Linux används systemets.
credits-what-foxit = Typsnitten som står i stället för PDF:s fjorton standardtypsnitt, när PDF-filer ritas upp och när bilder i PDF sätts.
credits-what-csl-styles = Referensstilarna som följer med Glaukopis, och de som hämtas från CSL-projektets förråd.
credits-what-csl-locales = Källhänvisningarnas ord på varje språk: ”sida”, ”kapitel” och liknande.
credits-what-ordboka = Orden i ordlistorna för norskt bokmål och nynorska, som följer med Glaukopis.
credits-what-ordbank = Böjningarna av orden i ordlistorna för norska.
credits-what-spell-norwegian = Reglerna i ordlistorna för norska.
credits-what-spelling-en-us = Ordlistan för amerikansk engelska, från servern för språkpaket.
credits-what-spelling-en-gb = Ordlistan för brittisk engelska, från servern för språkpaket.
credits-what-spelling-sv = Ordlistan för svenska, från servern för språkpaket.
credits-what-spelling-da = Ordlistan för danska, från servern för språkpaket.
credits-what-spelling-de = Ordlistan för tyska, från servern för språkpaket.
credits-what-spelling-fr = Ordlistan för franska, från servern för språkpaket.
credits-what-spelling-it = Ordlistan för italienska, från servern för språkpaket.
credits-what-tessdata = Det som Tesseract läser varje språk med, från servern för språkpaket.
credits-what-pandoc = Hämtar in dokument från Word och andra format, och gör dokument som Word, OpenDocument, LaTeX, HTML och EPUB.
credits-what-tesseract = Läser texten i inskanningar och bilder.
credits-what-poppler = Ritar upp sidorna i PDF-filer som inte kan ritas upp på annat sätt, för att läsa deras text.
credits-what-latex = Gör PDF-filer av den LaTeX som ett dokument görs som, med LuaLaTeX, XeLaTeX eller pdfLaTeX.
credits-what-lucide = Gränssnittets ikoner.
credits-what-feather = En del av Lucides ikoner är ritade efter Feathers.
credits-name-owl = Glaukopis uggla
credits-what-owl = Glaukopis märke och ikon: Athenas uggla, ritad av Robert Emil Berge efter ett fotografi av en atensk tetradrachm. Den som använder teckningen anger honom som den som ritade den, och Classical Numismatic Group, Inc. (http://www.cngcoins.com) som källan till det den är ritad efter.
credits-what-owl-photo = Fotografiet som ugglan är ritad efter: en atensk tetradrachm från 454–404 f.Kr., av Classical Numismatic Group, Inc. (http://www.cngcoins.com).
