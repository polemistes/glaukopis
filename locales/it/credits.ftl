# The credits of Glaukopis: what it is built on and comes with, with their
# licences, in the window that a button in the About section of the
# settings opens. The names of the projects and their licences are not
# translated: they are in src/lib/settings/credits.ts.

credits-button = Riconoscimenti e licenze…
credits-title = Riconoscimenti e licenze
credits-own-licence = Glaukopis è software libero, sotto la GNU General Public License, versione 3 o successiva (GPL-3.0-or-later). È fatto con il lavoro dei progetti qui sotto, secondo le licenze che danno.
# Before the authors of a project, where its licence asks for them to be named.
credits-by = Di { $who }
# What a name stands for, when it is a link: "Opens { $url }".
credits-open = Apre { $url }

## The groups

credits-group-built-on = Su che cosa è costruito
credits-group-copied = Codice incorporato
credits-group-fonts = Font
credits-group-data = Stili, dizionari e altri dati
credits-group-programs = Programmi con cui lavora, dove sono installati
credits-group-icons = Icone
credits-group-owl = La civetta
credits-group-lookup = Dove si cercano i riferimenti
credits-lookup-about = I DOI presso doi.org, Crossref e DataCite; i libri nei cataloghi K10plus, delle biblioteche universitarie norvegesi, della Deutsche Nationalbibliothek e della Library of Congress; i preprint presso arXiv; la letteratura medica presso PubMed. A loro si manda solo ciò che scrivi nella ricerca in rete.

## What each is to Glaukopis

credits-what-tauri = L'ossatura dell'applicazione: la sua finestra, e la via tra l'interfaccia e il resto.
credits-what-tauri-plugins = Le finestre per scegliere file e cartelle, e l'apertura di file e indirizzi in altri programmi.
credits-what-webkitgtk = Il motore web in cui si mostra l'interfaccia, su Linux. È una parte del sistema, non di Glaukopis.
credits-what-gtk = Ciò che avviene della finestra e della pagina su Linux, per il registro.
credits-what-svelte = L'interfaccia è scritta con esso.
credits-what-prosemirror = L'editor dei testi.
credits-what-yjs = Tiene i progetti, così che le modifiche si possano annullare e condividere con gli altri mentre si fanno.
credits-what-y-prosemirror = Unisce l'editor dei testi a ciò che un progetto tiene.
credits-what-y-protocols = Il modo in cui le modifiche a un progetto condiviso vanno al server e ne tornano.
credits-what-lib0 = Piccoli strumenti con cui è costruito Yjs, e con cui l'interfaccia scrive ciò che manda al server.
credits-what-yrs = Tiene i progetti condivisi nel server fornito con Glaukopis.
credits-what-fractional-indexing = Tiene l'ordine degli elementi e dei tipi quando più persone li spostano insieme.
credits-what-fluent-js = Le parole dell'interfaccia, in ogni lingua.
credits-what-fluent-rs = Le parole del nucleo, in ogni lingua, e il controllo di quelle che si cambiano da sé.
credits-what-pluralrules = Quale forma di una parola va con un numero, in ogni lingua.
credits-what-unic-langid = Legge i nomi delle lingue.
credits-what-sys-locale = Scopre la lingua del sistema.
credits-what-typst = Compone le pagine dell'anteprima e fa i file PDF.
credits-what-comemo = Ricorda ciò che Typst ha già calcolato, così che le pagine si ricompongano in fretta.
credits-what-hayro = Disegna le pagine dei file PDF, per leggerne il testo e per mostrarle.
credits-what-lopdf = Legge e scrive i file PDF, per il testo che un PDF ha e per il testo posto sopra una scansione.
credits-what-pdf-text-part = Legge i font e le mappe dei caratteri dei file PDF, per il codice di pdf-extract incorporato in Glaukopis.
credits-what-image = Legge e scrive le immagini.
credits-what-rusqlite = Legge il database di Zotero, per importarne i riferimenti.
credits-what-sqlite = Il database in cui Zotero tiene i suoi riferimenti, letto per mezzo di rusqlite. Compilato dentro su Windows e macOS; su Linux, quello del sistema.
credits-what-roxmltree = Legge l'XML: gli stili di citazione, i documenti Word e ciò che mandano i cataloghi.
credits-what-zip = Legge e scrive i file Word e OpenDocument, i progetti come file e i pacchetti linguistici.
credits-what-calamine = Legge i fogli di calcolo, per le tabelle portate dentro.
credits-what-encoding-rs = Legge il testo nelle codifiche dei file più vecchi.
credits-what-spellbook = Controlla l'ortografia, con dizionari di Hunspell.
credits-what-icu = Sa che cosa è ogni carattere, per trovare le parole.
credits-what-unicode-normalization = Riporta a una sola forma le lettere con diacritici, così che si trovino e si confrontino.
credits-what-strsim = Quanto si somigliano due nomi o titoli, per trovare i doppioni.
credits-what-ureq = Parla con i servizi in cui si cercano i riferimenti, e con il server dei pacchetti linguistici.
credits-what-sha2 = Distingue i file da ciò che contengono.
credits-what-base64 = Porta immagini e file come testo.
credits-what-serde = Legge e scrive i dati di Glaukopis come JSON.
credits-what-uuid = Dà un nome proprio a tutto ciò che si conserva.
credits-what-time = Date e ore.
credits-what-tempfile = Scrive i file con sicurezza, per mezzo di un file accanto.
credits-what-tracing = Il registro di ciò che fa l'applicazione.
credits-what-thiserror = Gli errori del server fornito con Glaukopis.
credits-what-tokio = Fa girare il server fornito con Glaukopis, per condividere i progetti.
credits-what-axum = Risponde a chi si collega al server fornito con Glaukopis.
credits-what-futures = Lavora con ciò che il server riceve e manda, man mano che arriva.
credits-what-clap = Legge ciò con cui si avvia il server fornito con Glaukopis.
credits-what-getrandom = Fa i token e i codici d'invito del server fornito con Glaukopis.
credits-what-pdf-extract = Legge il testo dei file PDF. Incorporato in Glaukopis come pdf-text e modificato, perché dia i nomi dei glifi.
credits-what-wrap-it = Fa scorrere il testo intorno a ciò che gli sta accanto, nelle pagine che Typst compone. Fornito con Glaukopis, accorciato.
credits-what-literata = Il font dei testi nell'interfaccia.
credits-what-inter = Il font dell'interfaccia.
credits-what-stix = Il font della matematica nell'interfaccia.
credits-what-typst-font = Un font fornito con Typst, per le pagine dei documenti. Negli installatori per Windows e macOS; su Linux, quello del sistema.
credits-what-foxit = I font che stanno al posto dei quattordici font standard del PDF, quando si disegnano file PDF e quando si compongono immagini in PDF.
credits-what-csl-styles = Gli stili di citazione forniti con Glaukopis, e quelli scaricati dal repository.
credits-what-csl-locales = Le parole delle citazioni in ogni lingua: «pagina», «capitolo» e simili.
credits-what-ordboka = Le parole dei dizionari del norvegese bokmål e nynorsk, forniti con Glaukopis.
credits-what-ordbank = Le flessioni delle parole dei dizionari del norvegese.
credits-what-spell-norwegian = Le regole dei dizionari del norvegese.
credits-what-spelling-en-us = Il dizionario dell'inglese americano, dal server dei pacchetti linguistici.
credits-what-spelling-en-gb = Il dizionario dell'inglese britannico, dal server dei pacchetti linguistici.
credits-what-spelling-sv = Il dizionario dello svedese, dal server dei pacchetti linguistici.
credits-what-spelling-da = Il dizionario del danese, dal server dei pacchetti linguistici.
credits-what-spelling-de = Il dizionario del tedesco, dal server dei pacchetti linguistici.
credits-what-spelling-fr = Il dizionario del francese, dal server dei pacchetti linguistici.
credits-what-spelling-it = Il dizionario dell'italiano, dal server dei pacchetti linguistici.
credits-what-tessdata = Ciò con cui Tesseract legge ogni lingua, dal server dei pacchetti linguistici.
credits-what-pandoc = Porta dentro documenti da Word e da altri formati, e fa documenti in Word, OpenDocument, LaTeX, HTML ed EPUB.
credits-what-tesseract = Legge il testo di scansioni e immagini.
credits-what-poppler = Disegna le pagine dei file PDF che non si possono disegnare altrimenti, per leggerne il testo.
credits-what-latex = Fa file PDF dal LaTeX in cui si fa un documento, con LuaLaTeX, XeLaTeX o pdfLaTeX.
credits-what-lucide = Le icone dell'interfaccia.
credits-what-feather = Alcune delle icone di Lucide sono disegnate a partire da quelle di Feather.
credits-name-owl = La civetta di Glaukopis
credits-what-owl = Il marchio e l'icona di Glaukopis: la civetta di Atena, disegnata da Robert Emil Berge da una fotografia di un tetradramma ateniese. Chi usa il disegno nomina lui come autore del disegno, e Classical Numismatic Group, Inc. (http://www.cngcoins.com) come fonte di ciò da cui è tratto.
credits-what-owl-photo = La fotografia da cui è disegnata la civetta: un tetradramma ateniese del 454–404 a.C., di Classical Numismatic Group, Inc. (http://www.cngcoins.com).
