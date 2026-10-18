# The credits of Glaukopis: what it is built on and comes with, with their
# licences, in the window that a button in the About section of the
# settings opens. The names of the projects and their licences are not
# translated: they are in src/lib/settings/credits.ts.

credits-button = Mulțumiri și licențe…
credits-title = Mulțumiri și licențe
credits-own-licence = Glaukopis este software liber, sub GNU General Public License, versiunea 3 sau mai nouă (GPL-3.0-or-later). Este făcut cu munca proiectelor de mai jos, sub licențele pe care le dau ele.
# Before the authors of a project, where its licence asks for them to be named.
credits-by = De { $who }
# What a name stands for, when it is a link: "Opens { $url }".
credits-open = Deschide { $url }

## The groups

credits-group-built-on = Pe ce este construit
credits-group-copied = Cod preluat în Glaukopis
credits-group-fonts = Fonturi
credits-group-data = Stiluri, dicționare și alte date
credits-group-programs = Programe cu care lucrează, acolo unde sunt instalate
credits-group-icons = Pictograme
credits-group-owl = Bufnița
credits-group-lookup = Unde se caută referințele
credits-lookup-about = DOI-urile la doi.org, Crossref și DataCite; cărțile în cataloagele K10plus, al bibliotecilor academice norvegiene, al Deutsche Nationalbibliothek și al Library of Congress; preprinturile la arXiv; literatura medicală la PubMed. Li se trimite numai ce scrieți în căutare.

## What each is to Glaukopis

credits-what-tauri = Cadrul aplicației: fereastra ei și calea dintre interfață și rest.
credits-what-tauri-plugins = Ferestrele pentru alegerea fișierelor și a dosarelor și deschiderea fișierelor și a adreselor în alte programe.
credits-what-webkitgtk = Motorul web în care se arată interfața, pe Linux. Face parte din sistem, nu din Glaukopis.
credits-what-gtk = Ce se întâmplă cu fereastra și cu pagina pe Linux, pentru jurnal.
credits-what-svelte = Interfața este scrisă cu el.
credits-what-prosemirror = Editorul de texte.
credits-what-yjs = Ține proiectele, astfel încât modificările să poată fi anulate și partajate cu alții pe măsură ce se fac.
credits-what-y-prosemirror = Leagă editorul de texte de ce ține un proiect.
credits-what-y-protocols = Calea pe care modificările unui proiect partajat merg spre server și vin de la el.
credits-what-lib0 = Unelte mici cu care este construit Yjs și cu care interfața scrie ce trimite serverului.
credits-what-yrs = Ține proiectele partajate în serverul care vine cu Glaukopis.
credits-what-fractional-indexing = Păstrează ordinea elementelor și a tipurilor când mai mulți oameni le mută deodată.
credits-what-fluent-js = Cuvintele interfeței, în fiecare limbă.
credits-what-fluent-rs = Cuvintele nucleului, în fiecare limbă, și verificarea celor pe care le schimbați.
credits-what-pluralrules = Ce formă a unui cuvânt merge cu un număr, în fiecare limbă.
credits-what-unic-langid = Citește numele limbilor.
credits-what-sys-locale = Află limba sistemului.
credits-what-typst = Așază paginile previzualizării și face fișierele PDF.
credits-what-comemo = Ține minte ce a calculat Typst, ca paginile să fie așezate din nou repede.
credits-what-hayro = Desenează paginile fișierelor PDF, ca să li se citească textul și ca să fie arătate.
credits-what-lopdf = Citește și scrie fișiere PDF, pentru textul pe care îl are un PDF și pentru textul așezat peste o scanare.
credits-what-pdf-text-part = Citește fonturile și tabelele de caractere ale fișierelor PDF, pentru codul din pdf-extract preluat în Glaukopis.
credits-what-image = Citește și scrie imagini.
credits-what-rusqlite = Citește baza de date a lui Zotero, ca să-i importe referințele.
credits-what-sqlite = Baza de date în care Zotero își ține referințele, citită prin rusqlite. Compilată în program pe Windows și macOS; pe Linux, cea a sistemului.
credits-what-roxmltree = Citește XML: stiluri de citare, documente Word și ce trimit cataloagele.
credits-what-zip = Citește și scrie fișiere Word și OpenDocument, proiecte ca fișiere și pachete de limbă.
credits-what-calamine = Citește foi de calcul, pentru tabelele aduse.
credits-what-encoding-rs = Citește text în codificările pe care le au fișierele mai vechi.
credits-what-spellbook = Verifică ortografia, cu dicționare Hunspell.
credits-what-icu = Știe ce este fiecare caracter, pentru găsirea cuvintelor.
credits-what-unicode-normalization = Aduce literele cu diacritice la o singură formă, ca să poată fi găsite și comparate.
credits-what-strsim = Cât de asemenea sunt două nume sau titluri, pentru găsirea dublurilor.
credits-what-ureq = Vorbește cu serviciile la care se caută referințele și cu serverul de pachete de limbă.
credits-what-sha2 = Deosebește fișierele după ce cuprind.
credits-what-base64 = Poartă imagini și fișiere ca text.
credits-what-serde = Citește și scrie datele lui Glaukopis ca JSON.
credits-what-uuid = Dă fiecărui lucru păstrat un nume al lui.
credits-what-time = Datele și orele.
credits-what-tempfile = Scrie fișierele în siguranță, printr-un fișier alături de ele.
credits-what-tracing = Jurnalul a ceea ce face aplicația.
credits-what-thiserror = Erorile serverului care vine cu Glaukopis.
credits-what-tokio = Rulează serverul care vine cu Glaukopis, pentru partajarea proiectelor.
credits-what-axum = Le răspunde celor care se conectează la serverul care vine cu Glaukopis.
credits-what-futures = Lucrează cu ce i se trimite serverului și cu ce trimite el, pe măsură ce vine.
credits-what-clap = Citește cu ce este pornit serverul care vine cu Glaukopis.
credits-what-getrandom = Face jetoanele și codurile de invitație ale serverului care vine cu Glaukopis.
credits-what-pdf-extract = Citește textul fișierelor PDF. Preluat în Glaukopis ca pdf-text și schimbat, ca să dea numele glifelor.
credits-what-wrap-it = Lasă textul să curgă în jurul a ceea ce stă alături de el, în paginile pe care le așază Typst. Vine cu Glaukopis, scurtat.
credits-what-literata = Fontul textelor din interfață.
credits-what-inter = Fontul interfeței.
credits-what-stix = Fontul matematicii din interfață.
credits-what-typst-font = Un font care vine cu Typst, pentru paginile documentelor. În programele de instalare pentru Windows și macOS; pe Linux, cel al sistemului.
credits-what-foxit = Fonturile care țin locul celor paisprezece fonturi standard ale PDF-ului, când se desenează fișierele PDF și când se așază imagini PDF.
credits-what-csl-styles = Stilurile de citare care vin cu Glaukopis și cele descărcate din colecția de stiluri CSL.
credits-what-csl-locales = Cuvintele citărilor în fiecare limbă: „pagina”, „capitolul” și altele asemenea.
credits-what-ordboka = Cuvintele dicționarelor de norvegiană bokmål și nynorsk, care vin cu Glaukopis.
credits-what-ordbank = Formele flexionare ale cuvintelor din dicționarele de norvegiană.
credits-what-spell-norwegian = Regulile dicționarelor de norvegiană.
credits-what-spelling-en-us = Dicționarul de engleză americană, de pe serverul de pachete de limbă.
credits-what-spelling-en-gb = Dicționarul de engleză britanică, de pe serverul de pachete de limbă.
credits-what-spelling-sv = Dicționarul de suedeză, de pe serverul de pachete de limbă.
credits-what-spelling-da = Dicționarul de daneză, de pe serverul de pachete de limbă.
credits-what-spelling-de = Dicționarul de germană, de pe serverul de pachete de limbă.
credits-what-spelling-fr = Dicționarul de franceză, de pe serverul de pachete de limbă.
credits-what-spelling-it = Dicționarul de italiană, de pe serverul de pachete de limbă.
credits-what-tessdata = Datele cu care Tesseract citește fiecare limbă, de pe serverul de pachete de limbă.
credits-what-pandoc = Aduce documente din Word și din alte formate și face documente ca Word, OpenDocument, LaTeX, HTML și EPUB.
credits-what-tesseract = Citește textul scanărilor și al imaginilor.
credits-what-poppler = Desenează paginile fișierelor PDF care nu se pot desena altfel, ca să li se citească textul.
credits-what-latex = Face fișiere PDF din codul LaTeX în care este făcut un document, cu LuaLaTeX, XeLaTeX sau pdfLaTeX.
credits-what-lucide = Pictogramele interfeței.
credits-what-feather = Unele dintre pictogramele Lucide sunt desenate după cele ale lui Feather.
credits-name-owl = Bufnița lui Glaukopis
credits-what-owl = Semnul și pictograma lui Glaukopis: bufnița Atenei, desenată de Robert Emil Berge după o fotografie a unei tetradrahme ateniene. Cine folosește desenul îl numește pe el ca autor al desenului, iar pe Classical Numismatic Group, Inc. (http://www.cngcoins.com) ca sursă a imaginii după care este desenat.
credits-what-owl-photo = Fotografia după care este desenată bufnița: o tetradrahmă ateniană din 454–404 î.Hr., de Classical Numismatic Group, Inc. (http://www.cngcoins.com).
