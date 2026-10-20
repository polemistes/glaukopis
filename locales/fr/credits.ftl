# The credits of Glaukopis: what it is built on and comes with, with their
# licences, in the window that a button in the About section of the
# settings opens. The names of the projects and their licences are not
# translated: they are in src/lib/settings/credits.ts.

credits-button = Crédits et licences…
credits-title = Crédits et licences
credits-own-licence = Glaukopis est un logiciel libre sous la GNU General Public License, version 3 ou ultérieure (GPL-3.0-or-later). Il est fait avec le travail des projets ci-dessous, sous les licences qu’ils accordent.
# Before the authors of a project, where its licence asks for them to be named.
credits-by = Par { $who }
# What a name stands for, when it is a link: "Opens { $url }".
credits-open = Ouvre { $url }

## The groups

credits-group-built-on = Ce sur quoi il repose
credits-group-copied = Code repris
credits-group-fonts = Polices
credits-group-data = Styles, dictionnaires et autres données
credits-group-programs = Programmes avec lesquels il travaille, là où ils sont installés
credits-group-icons = Icônes
credits-group-owl = La chouette
credits-group-lookup = Où les références sont cherchées
credits-lookup-about = Les DOI sur doi.org et chez Crossref et DataCite ; les livres dans le catalogue K10plus et dans ceux des bibliothèques universitaires norvégiennes, de la Deutsche Nationalbibliothek et de la Library of Congress ; les prépublications sur arXiv ; la littérature médicale sur PubMed. Seul ce que vous tapez dans la recherche en ligne leur est envoyé.

## What each is to Glaukopis

credits-what-tauri = Le cadre de l’application : sa fenêtre, et le lien entre l’interface et le reste.
credits-what-tauri-plugins = Les fenêtres où choisir des fichiers et des dossiers, et l’ouverture de fichiers et d’adresses dans d’autres programmes.
credits-what-webkitgtk = Le moteur web dans lequel l’interface est affichée, sous Linux. Il fait partie du système, pas de Glaukopis.
credits-what-gtk = Ce que deviennent la fenêtre et la page sous Linux, pour le journal.
credits-what-svelte = Ce avec quoi l’interface est écrite.
credits-what-prosemirror = L’éditeur des textes.
credits-what-yjs = Garde les projets, de sorte que les modifications puissent être annulées, et partagées avec d’autres à mesure qu’elles sont faites.
credits-what-y-prosemirror = Relie l’éditeur des textes à ce que garde un projet.
credits-what-y-protocols = La façon dont les modifications d’un projet partagé vont au serveur et en reviennent.
credits-what-lib0 = De petits outils avec lesquels Yjs est fait, et avec lesquels l’interface écrit ce qu’elle envoie au serveur.
credits-what-yrs = Garde les projets partagés dans le serveur fourni avec Glaukopis.
credits-what-fractional-indexing = Garde l’ordre des éléments et des types quand plusieurs personnes les déplacent en même temps.
credits-what-fluent-js = Les mots de l’interface, dans chaque langue.
credits-what-fluent-rs = Les mots du cœur de l’application, dans chaque langue, et la vérification des mots que l’on écrit soi-même.
credits-what-pluralrules = Quelle forme d’un mot va avec un nombre, dans chaque langue.
credits-what-unic-langid = Lit les noms des langues.
credits-what-sys-locale = Trouve la langue du système.
credits-what-typst = Compose les pages de l’aperçu et fait les fichiers PDF.
credits-what-comemo = Retient ce que Typst a calculé, pour que les pages soient vite composées de nouveau.
credits-what-hayro = Dessine les pages des fichiers PDF, pour en lire le texte et pour les montrer.
credits-what-lopdf = Lit et écrit les fichiers PDF, pour le texte qu’a un PDF et pour le texte posé sur une numérisation.
credits-what-flate2 = Décompresse ce que les fichiers PDF contiennent sous forme compressée, jusqu’à une limite seulement, pour qu’un petit fichier ne puisse pas remplir la mémoire.
credits-what-pdf-text-part = Lit les polices et les tables de caractères des fichiers PDF, pour le code de pdf-extract repris dans Glaukopis.
credits-what-image = Lit et écrit les images.
credits-what-rusqlite = Lit la base de données de Zotero, pour en importer les références.
credits-what-sqlite = La base de données où Zotero garde ses références, lue par l’intermédiaire de rusqlite. Compilée dans l’application sous Windows et macOS ; sous Linux, celle du système.
credits-what-roxmltree = Lit le XML : les styles de référence, les documents Word et ce qu’envoient les catalogues.
credits-what-zip = Lit et écrit les fichiers Word et OpenDocument, les fichiers de projet et les paquets de langue.
credits-what-calamine = Lit les feuilles de calcul, pour les tableaux importés.
credits-what-encoding-rs = Lit le texte dans les encodages des fichiers plus anciens.
credits-what-spellbook = Vérifie l’orthographe, avec des dictionnaires de Hunspell.
credits-what-icu = Sait ce qu’est chaque caractère, pour trouver les mots.
credits-what-unicode-normalization = Ramène à une seule forme les lettres qui portent des signes diacritiques, pour qu’elles soient trouvées et comparées.
credits-what-strsim = À quel point deux noms ou deux titres se ressemblent, pour trouver les doublons.
credits-what-ureq = Parle aux services où les références sont cherchées, et au serveur des paquets de langue.
credits-what-sha2 = Distingue les fichiers par ce qu’ils contiennent.
credits-what-base64 = Transporte images et fichiers sous forme de texte.
credits-what-serde = Lit et écrit les données de Glaukopis en JSON.
credits-what-uuid = Donne à tout ce qui est gardé un nom bien à lui.
credits-what-time = Les dates et les heures.
credits-what-tempfile = Écrit les fichiers sans risque, en passant par un fichier à côté d’eux.
credits-what-tracing = Le journal de ce que fait l’application.
credits-what-thiserror = Les erreurs du serveur fourni avec Glaukopis.
credits-what-tokio = Fait tourner le serveur fourni avec Glaukopis, pour le partage des projets.
credits-what-axum = Répond à ceux qui se connectent au serveur fourni avec Glaukopis.
credits-what-futures = Traite ce que le serveur reçoit et envoie, à mesure que cela arrive.
credits-what-clap = Lit les options avec lesquelles est lancé le serveur fourni avec Glaukopis.
credits-what-getrandom = Fait les jetons et les codes d’invitation du serveur fourni avec Glaukopis.
credits-what-libc = Tient la lecture d’un PDF, dans un processus à part, dans des limites de temps et de mémoire, sous Linux et macOS.
credits-what-windows-sys = Tient la lecture d’un PDF, dans un processus à part, dans des limites de temps et de mémoire, sous Windows.
credits-what-pdf-extract = Lit le texte des fichiers PDF. Repris dans Glaukopis sous le nom de pdf-text et modifié, pour qu’il donne les noms des glyphes.
credits-what-wrap-it = Fait couler le texte autour de ce qui se tient à côté, dans les pages que compose Typst. Fourni avec Glaukopis, abrégé.
credits-what-literata = La police des textes dans l’interface.
credits-what-inter = La police de l’interface.
credits-what-stix = La police des mathématiques dans l’interface.
credits-what-typst-font = Une police fournie avec Typst, pour les pages des documents. Dans les programmes d’installation pour Windows et macOS ; sous Linux, celle du système.
credits-what-foxit = Les polices qui remplacent les quatorze polices standard du PDF, quand des fichiers PDF sont dessinés et quand des images en PDF sont composées.
credits-what-csl-styles = Les styles de référence fournis avec Glaukopis, et ceux récupérés du dépôt.
credits-what-csl-locales = Les mots des citations dans chaque langue : « page », « chapitre » et ainsi de suite.
credits-what-ordboka = Les mots des dictionnaires du norvégien bokmål et nynorsk, fournis avec Glaukopis.
credits-what-ordbank = Les flexions des mots des dictionnaires du norvégien.
credits-what-spell-norwegian = Les règles des dictionnaires du norvégien.
credits-what-spelling-en-us = Le dictionnaire de l’anglais américain, du serveur des paquets de langue.
credits-what-spelling-en-gb = Le dictionnaire de l’anglais britannique, du serveur des paquets de langue.
credits-what-spelling-sv = Le dictionnaire du suédois, du serveur des paquets de langue.
credits-what-spelling-da = Le dictionnaire du danois, du serveur des paquets de langue.
credits-what-spelling-de = Le dictionnaire de l’allemand, du serveur des paquets de langue.
credits-what-spelling-fr = Le dictionnaire du français, du serveur des paquets de langue.
credits-what-spelling-it = Le dictionnaire de l’italien, du serveur des paquets de langue.
credits-what-tessdata = Ce avec quoi Tesseract lit chaque langue, du serveur des paquets de langue.
credits-what-pandoc = Importe les documents de Word et d’autres formats, et fait les documents en Word, OpenDocument, LaTeX, HTML et EPUB.
credits-what-tesseract = Lit le texte des numérisations et des images.
credits-what-poppler = Dessine les pages des fichiers PDF qui ne peuvent pas être dessinées autrement, pour en lire le texte.
credits-what-latex = Fait des fichiers PDF du LaTeX dont un document est fait, avec LuaLaTeX, XeLaTeX ou pdfLaTeX.
credits-what-lucide = Les icônes de l’interface.
credits-what-feather = Certaines icônes de Lucide sont dessinées d’après celles de Feather.
credits-name-owl = La chouette de Glaukopis
credits-what-owl = L’emblème et l’icône de Glaukopis : la chouette d’Athéna, dessinée par Robert Emil Berge d’après une photographie d’un tétradrachme athénien. Quiconque utilise le dessin nomme Robert Emil Berge comme celui qui l’a dessiné, et Classical Numismatic Group, Inc. (http://www.cngcoins.com) comme la source de ce d’après quoi il a été dessiné.
credits-what-owl-photo = La photographie d’après laquelle la chouette est dessinée : un tétradrachme athénien de 454–404 av. J.-C., par Classical Numismatic Group, Inc. (http://www.cngcoins.com).
