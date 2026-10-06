# The settings.

settings-title = Impostazioni
settings-error-system = Qualcosa dell'applicazione non si è potuto leggere
settings-error-read = Le impostazioni non si sono potute leggere
settings-error-save = Le impostazioni non si sono potute salvare

## Appearance

settings-appearance = Aspetto
settings-theme = Colori
settings-theme-system = Come il sistema
settings-theme-light = Chiari
settings-theme-dark = Scuri
# A theme of pastel colours, warm and soft.
settings-theme-mellow = Morbidi
settings-theme-own = I tuoi
settings-own = I tuoi colori
settings-own-hint = Quattro colori, da cui seguono gli altri: la carta, l'inchiostro, l'accento che segna ciò che è scelto e premuto, e la seconda voce che segna associazioni e commenti. Se lo schema è chiaro o scuro dipende dalla carta.
settings-own-paper = Carta
settings-own-ink = Inchiostro
settings-own-accent = Accento
settings-own-gold = Seconda voce
settings-own-begin = Comincia da
# The contrast of the ink and of the accent on the paper, as WCAG counts it; 4.5 and 3 are what reads well.
settings-own-weak = Difficile da leggere: l'inchiostro sta a { $ink } a 1 sulla carta e l'accento a { $accent } a 1; 4,5 e 3 o più si leggono bene.
settings-text-size = Dimensione del tuo testo
settings-text-size-hint = Nelle mappe e nella vista a testo. Ciò che si esporta segue il formato del documento.
settings-interface-size = Dimensione dell'interfaccia
settings-interface-size-hint = Tutto nella finestra, anche la scrittura. Per il solo tuo testo, la dimensione qui sotto.
# A line of text in the size chosen, which shows the face of the letters; a
# line of Homer's Greek follows it.
settings-sample = Cantami, o Diva, del Pelide Achille l'ira funesta

## New documents

settings-new-documents = Nuovi documenti
settings-new-documents-hint = Con che cosa comincia una mappa. A ogni mappa se ne può dare un altro, nell'anteprima.
settings-reference-style = Stile di citazione
settings-document-format = Formato del documento

## You

settings-you = Tu
settings-name = Nome
settings-name-hint = Mostrato a quelli con cui condividi progetti. Non usato altrimenti.
settings-contact = Indirizzo per i servizi bibliografici
settings-contact-hint = Servizi come Crossref rispondono più volentieri a chi dice come può essere raggiunto. Se inserisci un indirizzo, è mandato a loro a ogni ricerca, e a nessun altro. Lascialo vuoto per non mandarne.
settings-contact-problem = Questo non sembra un indirizzo.

## Programs: Pandoc and Typst

settings-programs = Programmi
settings-programs-about = Glaukopis fa i documenti con Pandoc, che si trova da sé dove è installato nel modo solito. Le pagine dell'anteprima e di un PDF sono composte da Typst, che fa parte di Glaukopis.
settings-pandoc-need = Serve per l'anteprima e per ogni esportazione.
settings-looking = Ricerca…
# "need" is what the program is needed for: settings-pandoc-need.
settings-program-missing = Non trovato. { $need } Installalo con il gestore dei pacchetti del tuo sistema, oppure di' qui sotto dove si trova.
settings-program-old = Più vecchio di quanto serva a Glaukopis: { $least } o più recente.
# The field for the path to a program, and the title of the dialog that chooses it.
settings-program-where = Dove si trova { $program }
settings-program-found-by-itself = Trovato da sé
settings-no-latex = Non è stato trovato nessun LaTeX. Non serve: il sorgente LaTeX si può esportare senza, e il PDF si fa con Typst.
settings-look-again = Cerca di nuovo
settings-error-programs = Non si sono potuti cercare i programmi

## About

settings-about = Informazioni
settings-licence = Software libero sotto la GNU General Public License, versione 3 o successiva. Viene senza garanzia.
settings-owl = La civetta è disegnata da Robert Emil Berge, da una fotografia di un tetradramma ateniese di Classical Numismatic Group, Inc. (http://www.cngcoins.com). Il disegno è sotto licenza Creative Commons Attribuzione – Condividi allo stesso modo 3.0 Unported.
settings-data = Dove è conservato tutto
# "file" is the name of the file of the library, shown as code.
settings-data-hint = I tuoi riferimenti sono in { $file }, che qualunque strumento BibLaTeX può leggere. Per tenere una copia del tuo lavoro, copia questa cartella.
settings-lookup = Dove si cercano i riferimenti
settings-lookup-about = I DOI su doi.org, Crossref e DataCite; i libri nei cataloghi K10plus, delle biblioteche accademiche norvegesi, della Deutsche Nationalbibliothek e della Library of Congress; i preprint su arXiv; la letteratura medica su PubMed. A loro è mandato solo ciò che scrivi nella ricerca.

## Language

settings-language = Lingua
settings-language-interface = L'interfaccia
settings-language-interface-hint = Le parole dell'applicazione. I tuoi testi sono nella lingua delle loro mappe.
settings-language-system = Come il sistema ({ $language })
settings-language-texts = Lingua dei nuovi testi
settings-language-texts-hint = In che lingua è scritta una nuova mappa, il che decide le parole che il suo documento stampa e il dizionario con cui se ne controlla l'ortografia. A ogni mappa se ne può dare un'altra sotto Lingue… nel suo menu, e a un progetto una lingua sua per le sue nuove mappe.
