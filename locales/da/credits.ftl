# The credits of Glaukopis: what it is built on and comes with, with their
# licences, in the window that a button in the About section of the
# settings opens. The names of the projects and their licences are not
# translated: they are in src/lib/settings/credits.ts.

credits-button = Tak og licenser…
credits-title = Tak og licenser
credits-own-licence = Glaukopis er fri software under GNU General Public License, version 3 eller senere (GPL-3.0-or-later). Programmet er lavet med arbejdet fra projekterne nedenfor, under de licenser, de giver.
# Before the authors of a project, where its licence asks for them to be named.
credits-by = Af { $who }
# What a name stands for, when it is a link: "Opens { $url }".
credits-open = Åbner { $url }

## The groups

credits-group-built-on = Det, Glaukopis bygger på
credits-group-copied = Kode, der er taget ind i Glaukopis
credits-group-fonts = Skrifter
credits-group-data = Stile, ordbøger og andre data
credits-group-programs = Programmer, Glaukopis arbejder sammen med, hvor de er installeret
credits-group-icons = Ikoner
credits-group-owl = Uglen
credits-group-lookup = Hvor referencer slås op
credits-lookup-about = DOI'er hos doi.org, Crossref og DataCite; bøger i K10plus og i katalogerne fra de norske forskningsbiblioteker, Deutsche Nationalbibliothek og Library of Congress; preprints hos arXiv; medicinsk litteratur hos PubMed. Kun det, du skriver i opslaget, sendes til dem.

## What each is to Glaukopis

credits-what-tauri = Programmets ramme: dets vindue og vejen mellem grænsefladen og resten.
credits-what-tauri-plugins = Vinduerne til at vælge filer og mapper og åbningen af filer og adresser i andre programmer.
credits-what-webkitgtk = Den webmotor, grænsefladen vises i på Linux. Den er en del af systemet, ikke af Glaukopis.
credits-what-gtk = Hvad der bliver af vinduet og af siden på Linux, til loggen.
credits-what-svelte = Grænsefladen er skrevet med det.
credits-what-prosemirror = Tekstredigeringen.
credits-what-yjs = Gemmer projekterne, så ændringer kan fortrydes og deles med andre, mens de laves.
credits-what-y-prosemirror = Forbinder tekstredigeringen med det, et projekt gemmer.
credits-what-y-protocols = Den måde, ændringer i et delt projekt går til og fra serveren på.
credits-what-lib0 = Små værktøjer, som Yjs er bygget med, og som grænsefladen bruger til at skrive det, den sender til serveren.
credits-what-yrs = Gemmer delte projekter i den server, der følger med Glaukopis.
credits-what-fractional-indexing = Holder styr på elementernes og arternes rækkefølge, når flere flytter dem på én gang.
credits-what-fluent-js = Grænsefladens ord, på alle sprog.
credits-what-fluent-rs = Kernens ord, på alle sprog, og kontrollen af ens egne ord.
credits-what-pluralrules = Hvilken form af et ord der hører til et tal, på hvert sprog.
credits-what-unic-langid = Læser sprogenes navne.
credits-what-sys-locale = Finder ud af, hvilket sprog systemet har.
credits-what-typst = Sætter siderne i forhåndsvisningen og laver PDF-filerne.
credits-what-comemo = Husker, hvad Typst har regnet ud, så siderne hurtigt kan sættes igen.
credits-what-hayro = Tegner siderne i PDF-filer, for at læse deres tekst og for at vise dem.
credits-what-lopdf = Læser og skriver PDF-filer, for den tekst, en PDF har, og for den tekst, der lægges over en skanning.
credits-what-flate2 = Pakker det ud, PDF-filer har pakket sammen, men kun op til en grænse, så en lille fil ikke kan fylde hukommelsen.
credits-what-pdf-text-part = Læser skrifterne og tegntabellerne i PDF-filer, for den kode fra pdf-extract, der er taget ind i Glaukopis.
credits-what-image = Læser og skriver billeder.
credits-what-rusqlite = Læser Zoteros database for at importere referencerne i den.
credits-what-sqlite = Den database, Zotero gemmer sine referencer i, læst gennem rusqlite. Kompileret ind på Windows og macOS; på Linux systemets egen.
credits-what-roxmltree = Læser XML: referencestile, Word-dokumenter og det, katalogerne sender.
credits-what-zip = Læser og skriver Word- og OpenDocument-filer, projekter som filer og sprogpakker.
credits-what-calamine = Læser regneark, til tabeller, der hentes ind.
credits-what-encoding-rs = Læser tekst i de tegnkodninger, ældre filer har.
credits-what-spellbook = Kontrollerer stavningen med Hunspells ordbøger.
credits-what-icu = Ved, hvad hvert tegn er, for at finde ord.
credits-what-unicode-normalization = Bringer bogstaver med accenter og andre tegn på én form, så de kan findes og sammenlignes.
credits-what-strsim = Hvor ens to navne eller titler er, for at finde dubletter.
credits-what-ureq = Taler med de tjenester, referencer slås op hos, og med sprogpakkernes server.
credits-what-sha2 = Skelner filer fra hinanden ved det, de indeholder.
credits-what-base64 = Bærer billeder og filer som tekst.
credits-what-serde = Læser og skriver Glaukopis’ data som JSON.
credits-what-uuid = Giver alt, hvad der gemmes, sit eget navn.
credits-what-time = Datoer og tidspunkter.
credits-what-tempfile = Skriver filer sikkert, ved hjælp af en fil ved siden af dem.
credits-what-tracing = Loggen over, hvad programmet gør.
credits-what-thiserror = Fejlene i den server, der følger med Glaukopis.
credits-what-tokio = Kører den server, der følger med Glaukopis, til deling af projekter.
credits-what-axum = Svarer dem, der forbinder sig til den server, der følger med Glaukopis.
credits-what-futures = Arbejder med det, serveren får sendt og sender, efterhånden som det kommer.
credits-what-clap = Læser de valg, som serveren, der følger med Glaukopis, startes med.
credits-what-getrandom = Laver adgangsnøglerne og invitationskoderne til den server, der følger med Glaukopis.
credits-what-libc = Holder læsningen af en PDF, i en proces for sig, inden for grænser for tid og hukommelse på Linux og macOS.
credits-what-windows-sys = Holder læsningen af en PDF, i en proces for sig, inden for grænser for tid og hukommelse på Windows.
credits-what-pdf-extract = Læser teksten i PDF-filer. Taget ind i Glaukopis som pdf-text og ændret, så den giver glyffernes navne.
credits-what-wrap-it = Lader tekst løbe omkring det, der står ved siden af den, på de sider, Typst sætter. Følger med Glaukopis, forkortet.
credits-what-literata = Skriften for tekster i grænsefladen.
credits-what-inter = Grænsefladens skrift.
credits-what-stix = Skriften for matematik i grænsefladen.
credits-what-typst-font = En skrift, Typst har med, til dokumenternes sider. I installationsprogrammerne til Windows og macOS; på Linux systemets egen.
credits-what-foxit = De skrifter, der træder i stedet for de fjorten standardskrifter i PDF, når PDF-filer tegnes, og når billeder i PDF sættes.
credits-what-csl-styles = De referencestile, der følger med Glaukopis, og dem, der hentes fra arkivet.
credits-what-csl-locales = Kildehenvisningernes ord på hvert sprog: »side«, »kapitel« og lignende.
credits-what-ordboka = Ordene i ordbøgerne over norsk bokmål og nynorsk, som følger med Glaukopis.
credits-what-ordbank = Bøjningerne af ordene i ordbøgerne over norsk.
credits-what-spell-norwegian = Reglerne i ordbøgerne over norsk.
credits-what-spelling-en-us = Ordbogen over amerikansk engelsk, fra sprogpakkernes server.
credits-what-spelling-en-gb = Ordbogen over britisk engelsk, fra sprogpakkernes server.
credits-what-spelling-sv = Ordbogen over svensk, fra sprogpakkernes server.
credits-what-spelling-da = Ordbogen over dansk, fra sprogpakkernes server.
credits-what-spelling-de = Ordbogen over tysk, fra sprogpakkernes server.
credits-what-spelling-fr = Ordbogen over fransk, fra sprogpakkernes server.
credits-what-spelling-it = Ordbogen over italiensk, fra sprogpakkernes server.
credits-what-tessdata = Det, Tesseract læser hvert sprog med, fra sprogpakkernes server.
credits-what-pandoc = Henter dokumenter ind fra Word og andre formater og laver dokumenter som Word, OpenDocument, LaTeX, HTML og EPUB.
credits-what-tesseract = Læser teksten i skanninger og billeder.
credits-what-poppler = Tegner de sider i PDF-filer, der ikke kan tegnes på anden måde, for at læse deres tekst.
credits-what-latex = Laver PDF-filer af den LaTeX, et dokument laves som, med LuaLaTeX, XeLaTeX eller pdfLaTeX.
credits-what-lucide = Grænsefladens ikoner.
credits-what-feather = Nogle af Lucides ikoner er tegnet efter Feathers.
credits-name-owl = Glaukopis’ ugle
credits-what-owl = Glaukopis’ mærke og ikon: Athenes ugle, tegnet af Robert Emil Berge efter et fotografi af en athensk tetradrakme. Den, der bruger tegningen, nævner ham som den, der tegnede den, og Classical Numismatic Group, Inc. (http://www.cngcoins.com) som kilden til det, den er tegnet efter.
credits-what-owl-photo = Fotografiet, uglen er tegnet efter: en athensk tetradrakme fra 454–404 f.Kr., af Classical Numismatic Group, Inc. (http://www.cngcoins.com).
