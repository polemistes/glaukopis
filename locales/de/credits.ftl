# The credits of Glaukopis: what it is built on and comes with, with their
# licences, in the window that a button in the About section of the
# settings opens. The names of the projects and their licences are not
# translated: they are in src/lib/settings/credits.ts.

credits-button = Nachweise und Lizenzen…
credits-title = Nachweise und Lizenzen
credits-own-licence = Glaukopis ist freie Software unter der GNU General Public License, Version 3 oder später (GPL-3.0-or-later). Es ist mit der Arbeit der unten genannten Projekte entstanden, zu den Bedingungen ihrer Lizenzen.
# Before the authors of a project, where its licence asks for them to be named.
credits-by = Von { $who }
# What a name stands for, when it is a link: "Opens { $url }".
credits-open = Öffnet { $url }

## The groups

credits-group-built-on = Worauf es aufbaut
credits-group-copied = Darin übernommener Code
credits-group-fonts = Schriften
credits-group-data = Zitierstile, Wörterbücher und andere Daten
credits-group-programs = Programme, mit denen es arbeitet, wo sie installiert sind
credits-group-icons = Symbole
credits-group-owl = Die Eule
credits-group-lookup = Wo Quellen nachgeschlagen werden
credits-lookup-about = DOIs bei doi.org, Crossref und DataCite; Bücher in den Katalogen K10plus, der norwegischen wissenschaftlichen Bibliotheken, der Deutschen Nationalbibliothek und der Library of Congress; Preprints bei arXiv; medizinische Literatur bei PubMed. Gesendet wird ihnen nur, was Sie zum Nachschlagen eingeben.

## What each is to Glaukopis

credits-what-tauri = Der Rahmen der Anwendung: ihr Fenster und der Weg zwischen der Oberfläche und allem Übrigen.
credits-what-tauri-plugins = Die Fenster zum Auswählen von Dateien und Ordnern, und das Öffnen von Dateien und Adressen in anderen Programmen.
credits-what-webkitgtk = Unter Linux die Web-Engine, in der die Oberfläche gezeigt wird. Sie gehört zum System, nicht zu Glaukopis.
credits-what-gtk = Was unter Linux aus dem Fenster und der Seite wird, für das Protokoll.
credits-what-svelte = Die Oberfläche ist damit geschrieben.
credits-what-prosemirror = Der Editor der Texte.
credits-what-yjs = Bewahrt die Projekte auf, so dass Änderungen rückgängig gemacht und, während sie entstehen, mit anderen geteilt werden können.
credits-what-y-prosemirror = Verbindet den Editor der Texte mit dem, was ein Projekt aufbewahrt.
credits-what-y-protocols = Der Weg, auf dem Änderungen an einem geteilten Projekt zum Server und von ihm kommen.
credits-what-lib0 = Kleine Werkzeuge, mit denen Yjs gebaut ist und mit denen die Oberfläche schreibt, was sie an den Server sendet.
credits-what-yrs = Bewahrt geteilte Projekte in dem Server auf, der Glaukopis beiliegt.
credits-what-fractional-indexing = Hält die Folge der Elemente und Arten fest, wenn mehrere sie zugleich verschieben.
credits-what-fluent-js = Die Texte der Oberfläche, in jeder Sprache.
credits-what-fluent-rs = Die Texte des Kerns, in jeder Sprache, und das Prüfen eigener Texte.
credits-what-pluralrules = Welche Form eines Wortes zu einer Zahl gehört, in jeder Sprache.
credits-what-unic-langid = Liest die Namen von Sprachen.
credits-what-sys-locale = Findet die Sprache des Systems heraus.
credits-what-typst = Setzt die Seiten der Vorschau und erzeugt die PDF-Dateien.
credits-what-comemo = Merkt sich, was Typst ausgerechnet hat, so dass Seiten schnell neu gesetzt werden.
credits-what-hayro = Zeichnet die Seiten von PDF-Dateien, um ihren Text zu lesen und um sie zu zeigen.
credits-what-lopdf = Liest und schreibt PDF-Dateien, für den Text, den ein PDF hat, und für den Text, der über einen Scan gelegt wird.
credits-what-pdf-text-part = Liest die Schriften und Zeichenzuordnungen von PDF-Dateien, für den Code von pdf-extract, der in Glaukopis übernommen ist.
credits-what-image = Liest und schreibt Bilder.
credits-what-rusqlite = Liest die Datenbank von Zotero, um seine Quellen zu importieren.
credits-what-sqlite = Die Datenbank, in der Zotero seine Quellen aufbewahrt, gelesen über rusqlite. Unter Windows und macOS einkompiliert; unter Linux die des Systems.
credits-what-roxmltree = Liest XML: Zitierstile, Word-Dokumente und was Kataloge senden.
credits-what-zip = Liest und schreibt Word- und OpenDocument-Dateien, Projekte als Dateien und Sprachpakete.
credits-what-calamine = Liest Tabellenkalkulationen, für eingelesene Tabellen.
credits-what-encoding-rs = Liest Text in den Kodierungen, die ältere Dateien haben.
credits-what-spellbook = Prüft die Rechtschreibung, mit Wörterbüchern von Hunspell.
credits-what-icu = Weiß, was jedes Zeichen ist, um Wörter zu finden.
credits-what-unicode-normalization = Bringt Buchstaben mit diakritischen Zeichen auf eine Form, damit sie gefunden und verglichen werden.
credits-what-strsim = Wie ähnlich sich zwei Namen oder Titel sind, um Dubletten zu finden.
credits-what-ureq = Spricht mit den Diensten, bei denen Quellen nachgeschlagen werden, und mit dem Server der Sprachpakete.
credits-what-sha2 = Unterscheidet Dateien nach dem, was sie enthalten.
credits-what-base64 = Trägt Bilder und Dateien als Text.
credits-what-serde = Liest und schreibt die Daten von Glaukopis als JSON.
credits-what-uuid = Gibt allem, was aufbewahrt wird, einen eigenen Namen.
credits-what-time = Datum und Uhrzeit.
credits-what-tempfile = Schreibt Dateien sicher, über eine Datei daneben.
credits-what-tracing = Das Protokoll dessen, was die Anwendung tut.
credits-what-thiserror = Die Fehler des Servers, der Glaukopis beiliegt.
credits-what-tokio = Betreibt den Server, der Glaukopis beiliegt, zum Teilen von Projekten.
credits-what-axum = Antwortet denen, die sich mit dem Server verbinden, der Glaukopis beiliegt.
credits-what-futures = Verarbeitet, was der Server empfängt und sendet, so wie es kommt.
credits-what-clap = Liest, womit der Server, der Glaukopis beiliegt, gestartet wird.
credits-what-getrandom = Erzeugt die Tokens und die Einladungscodes des Servers, der Glaukopis beiliegt.
credits-what-pdf-extract = Liest den Text von PDF-Dateien. In Glaukopis als pdf-text übernommen und geändert, so dass es die Namen der Glyphen angibt.
credits-what-wrap-it = Lässt Text um das fließen, was daneben steht, in den Seiten, die Typst setzt. Liegt Glaukopis gekürzt bei.
credits-what-literata = Die Schrift der Texte in der Oberfläche.
credits-what-inter = Die Schrift der Oberfläche.
credits-what-stix = Die Schrift für Mathematik in der Oberfläche.
credits-what-typst-font = Eine Schrift, die Typst mitbringt, für die Seiten von Dokumenten. In den Installationsprogrammen für Windows und macOS; unter Linux die des Systems.
credits-what-foxit = Die Schriften, die für die vierzehn Standardschriften von PDF einspringen, wenn PDF-Dateien gezeichnet und wenn Bilder im PDF-Format gesetzt werden.
credits-what-csl-styles = Die Zitierstile, die Glaukopis mitbringt, und die aus dem Repository geholten.
credits-what-csl-locales = Die Wörter der Zitationen in jeder Sprache: „Seite“, „Kapitel“ und dergleichen.
credits-what-ordboka = Die Wörter der Wörterbücher für norwegisches Bokmål und Nynorsk, die Glaukopis mitbringt.
credits-what-ordbank = Die Flexionsformen der Wörter der norwegischen Wörterbücher.
credits-what-spell-norwegian = Die Regeln der norwegischen Wörterbücher.
credits-what-spelling-en-us = Das Wörterbuch für amerikanisches Englisch, vom Server der Sprachpakete.
credits-what-spelling-en-gb = Das Wörterbuch für britisches Englisch, vom Server der Sprachpakete.
credits-what-spelling-sv = Das Wörterbuch für Schwedisch, vom Server der Sprachpakete.
credits-what-spelling-da = Das Wörterbuch für Dänisch, vom Server der Sprachpakete.
credits-what-spelling-de = Das Wörterbuch für Deutsch, vom Server der Sprachpakete.
credits-what-spelling-fr = Das Wörterbuch für Französisch, vom Server der Sprachpakete.
credits-what-spelling-it = Das Wörterbuch für Italienisch, vom Server der Sprachpakete.
credits-what-tessdata = Womit Tesseract jede Sprache liest, vom Server der Sprachpakete.
credits-what-pandoc = Liest Dokumente aus Word und anderen Formaten ein und erzeugt Dokumente als Word, OpenDocument, LaTeX, HTML und EPUB.
credits-what-tesseract = Liest den Text von Scans und Bildern.
credits-what-poppler = Zeichnet die Seiten von PDF-Dateien, die sich anders nicht zeichnen lassen, um ihren Text zu lesen.
credits-what-latex = Erzeugt PDF-Dateien aus dem LaTeX, als das ein Dokument erzeugt wird, mit LuaLaTeX, XeLaTeX oder pdfLaTeX.
credits-what-lucide = Die Symbole der Oberfläche.
credits-what-feather = Einige Symbole von Lucide sind nach denen von Feather gezeichnet.
credits-name-owl = Die Eule von Glaukopis
credits-what-owl = Das Signet und das Programmsymbol von Glaukopis: die Eule der Athene, von Robert Emil Berge nach einer Fotografie einer athenischen Tetradrachme gezeichnet. Wer die Zeichnung verwendet, nennt ihn als den, der sie gezeichnet hat, und Classical Numismatic Group, Inc. (http://www.cngcoins.com) als die Quelle dessen, wonach sie gezeichnet ist.
credits-what-owl-photo = Die Fotografie, nach der die Eule gezeichnet ist: eine athenische Tetradrachme aus den Jahren 454–404 v. Chr., von Classical Numismatic Group, Inc. (http://www.cngcoins.com).
