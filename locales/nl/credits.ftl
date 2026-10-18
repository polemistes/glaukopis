# The credits of Glaukopis: what it is built on and comes with, with their
# licences, in the window that a button in the About section of the
# settings opens. The names of the projects and their licences are not
# translated: they are in src/lib/settings/credits.ts.

credits-button = Verantwoording en licenties…
credits-title = Verantwoording en licenties
credits-own-licence = Glaukopis is vrije software onder de GNU General Public License, versie 3 of later (GPL-3.0-or-later). Het is gemaakt met het werk van de projecten hieronder, onder de licenties die zij geven.
# Before the authors of a project, where its licence asks for them to be named.
credits-by = Door { $who }
# What a name stands for, when it is a link: "Opens { $url }".
credits-open = Opent { $url }

## The groups

credits-group-built-on = Waarop het is gebouwd
credits-group-copied = Code die erin is overgenomen
credits-group-fonts = Lettertypen
credits-group-data = Stijlen, woordenboeken en andere gegevens
credits-group-programs = Programma's waarmee het werkt, waar ze zijn geïnstalleerd
credits-group-icons = Pictogrammen
credits-group-owl = De uil
credits-group-lookup = Waar referenties worden opgezocht
credits-lookup-about = DOI's bij doi.org, Crossref en DataCite; boeken in de catalogi K10plus, van de Noorse wetenschappelijke bibliotheken, van de Deutsche Nationalbibliothek en van de Library of Congress; preprints bij arXiv; medische literatuur bij PubMed. Alleen wat je bij het opzoeken intypt, wordt naar hen gestuurd.

## What each is to Glaukopis

credits-what-tauri = Het raamwerk van het programma: zijn venster, en de weg tussen de interface en de rest.
credits-what-tauri-plugins = De vensters voor het kiezen van bestanden en mappen, en het openen van bestanden en adressen in andere programma's.
credits-what-webkitgtk = De webengine waarin de interface wordt getoond, op Linux. Die is een deel van het systeem, niet van Glaukopis.
credits-what-gtk = Wat er op Linux met het venster en de pagina gebeurt, voor het logboek.
credits-what-svelte = De interface is ermee geschreven.
credits-what-prosemirror = De editor voor teksten.
credits-what-yjs = Bewaart projecten, zodat wijzigingen ongedaan kunnen worden gemaakt en met anderen gedeeld terwijl ze worden gemaakt.
credits-what-y-prosemirror = Verbindt de editor voor teksten met wat een project bewaart.
credits-what-y-protocols = De weg die wijzigingen aan een gedeeld project naar en van de server nemen.
credits-what-lib0 = Kleine hulpmiddelen waarmee Yjs is gebouwd, en waarmee de interface schrijft wat ze naar de server stuurt.
credits-what-yrs = Bewaart gedeelde projecten in de server die met Glaukopis meekomt.
credits-what-fractional-indexing = Houdt de volgorde van elementen en soorten vast wanneer meerdere mensen ze tegelijk verplaatsen.
credits-what-fluent-js = De woorden van de interface, in elke taal.
credits-what-fluent-rs = De woorden van de kern, in elke taal, en het controleren van zelf gewijzigde woorden van de interface.
credits-what-pluralrules = Welke vorm van een woord bij een getal hoort, in elke taal.
credits-what-unic-langid = Leest de namen van talen.
credits-what-sys-locale = Zoekt uit wat de taal van het systeem is.
credits-what-typst = Zet de pagina's van het voorbeeld en maakt de PDF-bestanden.
credits-what-comemo = Onthoudt wat Typst heeft uitgerekend, zodat pagina's snel opnieuw worden gezet.
credits-what-hayro = Tekent de pagina's van PDF-bestanden, om hun tekst te lezen en om ze te tonen.
credits-what-lopdf = Leest en schrijft PDF-bestanden, voor de tekst die een PDF heeft en voor de tekst die over een scan wordt gelegd.
credits-what-pdf-text-part = Leest de lettertypen en tekentabellen van PDF-bestanden, voor de code van pdf-extract die in Glaukopis is overgenomen.
credits-what-image = Leest en schrijft afbeeldingen.
credits-what-rusqlite = Leest de database van Zotero, om zijn referenties te importeren.
credits-what-sqlite = De database waarin Zotero zijn referenties bewaart, gelezen via rusqlite. Op Windows en macOS meegecompileerd; op Linux die van het systeem.
credits-what-roxmltree = Leest XML: citeerstijlen, Word-documenten en wat catalogi sturen.
credits-what-zip = Leest en schrijft Word- en OpenDocument-bestanden, projecten als bestanden en taalpakketten.
credits-what-calamine = Leest spreadsheets, voor tabellen die worden binnengehaald.
credits-what-encoding-rs = Leest tekst in de coderingen die oudere bestanden hebben.
credits-what-spellbook = Controleert de spelling, met woordenboeken van Hunspell.
credits-what-icu = Weet wat elk teken is, om woorden te vinden.
credits-what-unicode-normalization = Brengt letters met diakritische tekens tot één vorm, zodat ze worden gevonden en vergeleken.
credits-what-strsim = Hoe sterk twee namen of titels op elkaar lijken, om dubbele te vinden.
credits-what-ureq = Spreekt met de diensten waar referenties worden opgezocht, en met de server van de taalpakketten.
credits-what-sha2 = Onderscheidt bestanden naar wat ze bevatten.
credits-what-base64 = Vervoert afbeeldingen en bestanden als tekst.
credits-what-serde = Leest en schrijft de gegevens van Glaukopis als JSON.
credits-what-uuid = Geeft alles wat wordt bewaard een eigen naam.
credits-what-time = Datums en tijden.
credits-what-tempfile = Schrijft bestanden veilig, via een bestand ernaast.
credits-what-tracing = Het logboek van wat het programma doet.
credits-what-thiserror = De fouten van de server die met Glaukopis meekomt.
credits-what-tokio = Laat de server draaien die met Glaukopis meekomt, voor het delen van projecten.
credits-what-axum = Antwoordt wie verbinding maakt met de server die met Glaukopis meekomt.
credits-what-futures = Werkt met wat de server wordt gestuurd en zelf stuurt, naarmate het binnenkomt.
credits-what-clap = Leest waarmee de server die met Glaukopis meekomt, wordt gestart.
credits-what-getrandom = Maakt de tokens en de uitnodigingscodes van de server die met Glaukopis meekomt.
credits-what-pdf-extract = Leest de tekst van PDF-bestanden. Als pdf-text in Glaukopis overgenomen en gewijzigd, zodat het de namen van de glyfen geeft.
credits-what-wrap-it = Laat tekst om wat ernaast staat heen lopen, op de pagina's die Typst zet. Komt met Glaukopis mee, ingekort.
credits-what-literata = Het lettertype van teksten in de interface.
credits-what-inter = Het lettertype van de interface.
credits-what-stix = Het lettertype van wiskunde in de interface.
credits-what-typst-font = Een lettertype dat met Typst meekomt, voor de pagina's van documenten. In de installatieprogramma's voor Windows en macOS; op Linux dat van het systeem.
credits-what-foxit = De lettertypen die in de plaats komen van de veertien standaardlettertypen van PDF, wanneer PDF-bestanden worden getekend en wanneer afbeeldingen in PDF worden gezet.
credits-what-csl-styles = De citeerstijlen die met Glaukopis meekomen, en die welke uit de verzameling worden opgehaald.
credits-what-csl-locales = De woorden van verwijzingen in elke taal: ‘pagina’, ‘hoofdstuk’ en dergelijke.
credits-what-ordboka = De woorden van de woordenboeken van het Noorse Bokmål en Nynorsk, die met Glaukopis meekomen.
credits-what-ordbank = De buigingsvormen van de woorden van de Noorse woordenboeken.
credits-what-spell-norwegian = De regels van de Noorse woordenboeken.
credits-what-spelling-en-us = Het woordenboek van het Amerikaans-Engels, van de server van de taalpakketten.
credits-what-spelling-en-gb = Het woordenboek van het Brits-Engels, van de server van de taalpakketten.
credits-what-spelling-sv = Het woordenboek van het Zweeds, van de server van de taalpakketten.
credits-what-spelling-da = Het woordenboek van het Deens, van de server van de taalpakketten.
credits-what-spelling-de = Het woordenboek van het Duits, van de server van de taalpakketten.
credits-what-spelling-fr = Het woordenboek van het Frans, van de server van de taalpakketten.
credits-what-spelling-it = Het woordenboek van het Italiaans, van de server van de taalpakketten.
credits-what-tessdata = Waarmee Tesseract elke taal leest, van de server van de taalpakketten.
credits-what-pandoc = Haalt documenten binnen uit Word en andere bestandsformaten, en maakt documenten als Word, OpenDocument, LaTeX, HTML en EPUB.
credits-what-tesseract = Leest de tekst van scans en afbeeldingen.
credits-what-poppler = Tekent de pagina's van PDF-bestanden die niet anders kunnen worden getekend, om hun tekst te lezen.
credits-what-latex = Maakt PDF-bestanden van de LaTeX waarin een document wordt gemaakt, met LuaLaTeX, XeLaTeX of pdfLaTeX.
credits-what-lucide = De pictogrammen van de interface.
credits-what-feather = Sommige pictogrammen van Lucide zijn getekend naar die van Feather.
credits-name-owl = De uil van Glaukopis
credits-what-owl = Het merkteken en het pictogram van Glaukopis: de uil van Athena, getekend door Robert Emil Berge naar een foto van een Atheense tetradrachme. Wie de tekening gebruikt, noemt hem als degene die haar heeft getekend, en Classical Numismatic Group, Inc. (http://www.cngcoins.com) als de bron van waarnaar ze is getekend.
credits-what-owl-photo = De foto waarnaar de uil is getekend: een Atheense tetradrachme uit 454–404 v.Chr., door Classical Numismatic Group, Inc. (http://www.cngcoins.com).
