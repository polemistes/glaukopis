# What the core says of references brought in from elsewhere, in English.
# See locales/README.md.

## Where the references came from, as the list of them says: "3 references in pasted text".

core-import-pasted = testo incollato
core-import-files = { $count } file

## Files of BibTeX and BibLaTeX.

core-import-file-not-found = Il file «{ $name }» non è stato trovato.
core-import-empty-entry = Riga { $line }: la voce «{ $key }» è vuota ed è stata lasciata fuori.
# Where in a file a reference that has no key was found.
core-import-origin-line = riga { $line }
core-import-origin-key-line = { $key }, riga { $line }

## What went wrong as the references were taken in, each after the reference
## it concerns: Nagy 1979 “The Best of the Achaeans”.

core-import-title = «{ $title }»
core-import-merge-gone = { $reference }: la voce con cui unirla non c'è più

## PDF files.

core-import-not-a-pdf = { $name } non è un PDF.
# The service is a name: Crossref, DataCite.
core-import-details-from = I dati vengono da { $service }.
core-import-number-unknown = Nel file è stato trovato un numero, ma le banche dati non ne sanno nulla; i dati vengono dal file stesso e vanno controllati.
core-import-databases-failed = Non si sono potute interrogare le banche dati ({ $error }); i dati vengono dal file stesso e vanno controllati.

## Zotero.

core-import-zotero-my-library = La mia biblioteca
core-import-zotero-group = Gruppo { $id }
core-import-zotero-the-library = la biblioteca { $id } in Zotero
core-import-zotero-own-library = la biblioteca personale in Zotero
core-import-zotero-the-collection = la raccolta { $key } in Zotero
core-import-zotero-unknown-base = Il file «{ $name }» non è stato trovato. Zotero vi rimanda da una cartella di sua scelta, che qui non si conosce.
core-import-zotero-empty-item = La voce { $key } in Zotero è vuota ed è stata lasciata fuori.
core-import-zotero-alone = { $count ->
    [one] In Zotero { $count } file o nota non sta sotto alcun riferimento, ed è stato lasciato fuori.
    [many] In Zotero { $count } file e note non stanno sotto alcun riferimento, e sono stati lasciati fuori.
   *[other] In Zotero { $count } file e note non stanno sotto alcun riferimento, e sono stati lasciati fuori.
}
# The role is Zotero's own name for it: "recipient", "reviewed author".
core-import-zotero-not-a-field = Zotero indica { $name } come { $role }, per cui BibLaTeX non ha un campo. Il nome è stato lasciato fuori.
core-import-zotero-collaborator = Zotero indica { $name } come { $role }, per cui BibLaTeX non ha un campo. Il nome è stato messo fra quelli che vi hanno collaborato (un curatore del tipo «collaboratore»), e il ruolo non si conserva.
core-import-zotero-collaborator-unnamed = Zotero indica { $name } in un ruolo a cui non dà nome, e BibLaTeX non ha un campo per questo. Il nome è stato messo fra quelli che vi hanno collaborato (un curatore del tipo «collaboratore»).
core-import-zotero-left-out = Il campo «{ $field }» di Zotero non ha un corrispondente in BibLaTeX ed è stato lasciato fuori: { $value }

## Zotero's database.

core-import-zotero-no-database = una banca dati di Zotero ({ $file }) in { $path }
core-import-zotero-copying = copia di { $path } in una cartella temporanea
core-import-zotero-locked = Zotero tiene { $path } bloccato mentre è aperto, perciò non si è potuto leggere. Chiudi Zotero e importa di nuovo
core-import-zotero-empty = il file è vuoto
core-import-zotero-disturbed = Zotero stava scrivendo nella sua banca dati mentre veniva letta. Se manca qualcosa, chiudi Zotero e importa di nuovo.
core-import-zotero-backup-read = La banca dati di Zotero non si è potuta leggere ({ $error }). È stata letta invece la sua copia di sicurezza, { $backup }: manca ciò che è cambiato in Zotero da quando la copia è stata fatta.
core-import-zotero-backup-read-locked = Zotero tiene la sua banca dati bloccata mentre è aperto, perciò la banca dati non si è potuta leggere. È stata letta invece la sua copia di sicurezza, { $backup }: manca ciò che è cambiato in Zotero da quando la copia è stata fatta. Chiudi Zotero e importa di nuovo per leggere la banca dati stessa.
core-import-zotero-not-a-database = { $path } non è una banca dati di Zotero.
core-import-zotero-unreadable = La banca dati di Zotero ha una forma che qui non si può leggere: { $what }. Se è stata scritta da una vecchia versione di Zotero, basta aprirla una volta in una versione attuale per aggiornarla.
core-import-zotero-unreadable-version = La banca dati di Zotero ha una forma che qui non si può leggere (versione { $version } della banca dati di Zotero): { $what }. Se è stata scritta da una vecchia versione di Zotero, basta aprirla una volta in una versione attuale per aggiornarla.
core-import-zotero-no-table = manca la tabella «{ $table }»
core-import-zotero-no-column = la tabella «{ $table }» non ha la colonna «{ $column }»
# What is lacking where a table is not there: one of the six below.
core-import-zotero-no-optional = La banca dati di Zotero non ha una tabella «{ $table }» della forma che qui si conosce: { $consequence }.
core-import-zotero-no-bin = le voci nel cestino di Zotero non si distinguono dalle altre
core-import-zotero-no-collections = le raccolte non sono state lette
core-import-zotero-no-attachments = i file allegati non sono stati letti
core-import-zotero-no-notes = le note non sono state lette
core-import-zotero-no-keywords = le parole chiave non sono state lette
core-import-zotero-no-group-names = i nomi delle biblioteche di gruppo non si conoscono

## PDF files, as they are read for a reference.

core-import-pdf-empty = Il file «{ $name }» è vuoto.
core-import-pdf-not-a-pdf = Il file «{ $name }» non è un PDF.
core-import-pdf-not-started = «{ $name }» non si è potuto leggere, perché non si è potuto avviare un processo che lo leggesse: { $message }
core-import-pdf-unreadable = Il file non si è potuto leggere: è danneggiato, protetto da una password, o troppo grande.
core-import-pdf-scan = Il file non ha uno strato di testo: è una scansione.
core-import-pdf-from-file = I dati vengono dal file stesso, non da un catalogo, e vanno controllati.
core-import-pdf-from-metadata = Nel file non è stato trovato né un DOI né un ISBN; i dati vengono dai metadati del file e vanno controllati.
core-import-pdf-unknown = Nel file non è stato trovato né un DOI né un ISBN, e i suoi metadati non dicono che cosa sia: i dati vanno inseriti a mano.

## Tables, from files of text and of sheets.

core-import-table-too-large = Il file pesa { $size } MB. Una tabella si legge da un file di { $most } MB al massimo.
core-import-table-kinds = Le tabelle si leggono da CSV e altri file di testo con i valori separati da virgole, punti e virgola o tabulazioni, e dai fogli di LibreOffice (.ods) ed Excel (.xlsx, .xls).
core-import-table-empty = Nel file non c'è nulla.
# The rows are a number, or where the counting was given up, the message below.
core-import-table-rows = La tabella ha { $rows } righe. Una tabella in un testo può averne al massimo { $most }: non è un foglio di calcolo.
core-import-table-columns = La tabella ha { $columns } colonne. Una tabella in un testo può averne al massimo { $most }: non è un foglio di calcolo.
core-import-table-more-than = più di { $count }

## Documents brought in, to become maps.

core-import-document-stopped = La lettura è stata fermata.
core-import-pdfs-stopped = Il riconoscimento dei file è stato fermato. Non è stato aggiunto nulla.
core-import-document-kind = «{ $file }» non è di un tipo che si possa portare dentro come documento. Si possono portare dentro Word (DOCX), OpenDocument (ODT), Markdown, HTML, LaTeX, RTF, EPUB, Org, reStructuredText, Typst e testo semplice.
core-import-document-too-large = «{ $file }» è più grande di 50 MB, più di quanto si possa portare dentro come documento.
core-import-document-too-deep = «{ $file }» è annidato troppo a fondo per essere portato dentro: le sue parti stanno l'una dentro l'altra più a fondo di quanto si possa leggere, alcune centinaia di livelli. Una pagina salvata da un sito web si può salvare di nuovo come semplice HTML, oppure se ne può copiare il testo in un nuovo documento.
# The kind is the kind of file: Word (DOCX), plain text.
core-import-document-unreadable = «{ $file }» non si è potuto leggere come { $kind }. Può essere danneggiato, o di un altro tipo rispetto a quello che il nome dice. Pandoc, che lo legge, ha detto: { $message }
core-import-document-pandoc-unreadable = ciò che Pandoc ha fatto di «{ $file }» non si è potuto leggere: { $error }
# The title of a map made of a document that has none, nor a name of its file.
core-import-document-untitled = Senza titolo
core-import-document-plain-text = testo semplice
core-import-document-notebook = notebook Jupyter

## What the one who brings a document in should know of it.

core-import-document-found = { $count ->
    [one] { $made ->
        [all] È stata trovata { $count } citazione non ancora legata a un riferimento della tua biblioteca, fatta da un programma che tiene i riferimenti. Resta testo, così come è stata scritta, e si può passare in rassegna quando il documento è stato portato dentro, e più tardi.
       *[none] È stata trovata { $count } citazione non ancora legata a un riferimento della tua biblioteca. Resta testo, così come è stata scritta, e si può passare in rassegna quando il documento è stato portato dentro, e più tardi.
    }
    [many] { $made ->
        [all] Sono state trovate { $count } citazioni non ancora legate a riferimenti della tua biblioteca, tutte fatte da un programma che tiene i riferimenti. Restano testo, così come sono state scritte, e si possono passare in rassegna quando il documento è stato portato dentro, e più tardi.
        [some] Sono state trovate { $count } citazioni non ancora legate a riferimenti della tua biblioteca, { $some } delle quali fatte da un programma che tiene i riferimenti. Restano testo, così come sono state scritte, e si possono passare in rassegna quando il documento è stato portato dentro, e più tardi.
       *[none] Sono state trovate { $count } citazioni non ancora legate a riferimenti della tua biblioteca. Restano testo, così come sono state scritte, e si possono passare in rassegna quando il documento è stato portato dentro, e più tardi.
    }
   *[other] { $made ->
        [all] Sono state trovate { $count } citazioni non ancora legate a riferimenti della tua biblioteca, tutte fatte da un programma che tiene i riferimenti. Restano testo, così come sono state scritte, e si possono passare in rassegna quando il documento è stato portato dentro, e più tardi.
        [some] Sono state trovate { $count } citazioni non ancora legate a riferimenti della tua biblioteca, { $some } delle quali fatte da un programma che tiene i riferimenti. Restano testo, così come sono state scritte, e si possono passare in rassegna quando il documento è stato portato dentro, e più tardi.
       *[none] Sono state trovate { $count } citazioni non ancora legate a riferimenti della tua biblioteca. Restano testo, così come sono state scritte, e si possono passare in rassegna quando il documento è stato portato dentro, e più tardi.
    }
}
core-import-document-endnote = { $count ->
    [one] { $count } citazione fatta da EndNote è portata dentro come il testo che mostra, e non è tra le citazioni sciolte: ciò che EndNote dice delle opere non si è potuto leggere.
    [many] { $count } citazioni fatte da EndNote sono portate dentro come il testo che mostrano, e non sono tra le citazioni sciolte: ciò che EndNote dice delle opere non si è potuto leggere.
   *[other] { $count } citazioni fatte da EndNote sono portate dentro come il testo che mostrano, e non sono tra le citazioni sciolte: ciò che EndNote dice delle opere non si è potuto leggere.
}
core-import-document-bookmarks = { $count ->
    [one] Il documento tiene { $count } citazione in un segnalibro, e ciò che cita non si è potuto leggere: è testo così com'è. Zotero le tiene così dove le preferenze del documento lo dicono.
    [many] Il documento tiene { $count } citazioni in segnalibri, e ciò che citano non si è potuto leggere: sono testo così come stanno. Zotero le tiene così dove le preferenze del documento lo dicono.
   *[other] Il documento tiene { $count } citazioni in segnalibri, e ciò che citano non si è potuto leggere: sono testo così come stanno. Zotero le tiene così dove le preferenze del documento lo dicono.
}
core-import-document-bibliography = Il documento ha un elenco di ciò che cita, sotto «{ $heading }». È portato dentro come testo, come il resto. Glaukopis fa una bibliografia sua da ciò che è citato.
core-import-document-bibliography-made = Il documento ha un elenco di ciò che cita, fatto dal programma che tiene i suoi riferimenti. È portato dentro come testo, come il resto. Glaukopis fa una bibliografia sua da ciò che è citato.
core-import-document-tracked = Il documento ha modifiche tracciate. Il testo è portato dentro così come sta quando sono tutte accettate.
core-import-document-comments = Il documento ha commenti a margine, che sono lasciati fuori.
core-import-document-heading-notes = { $count ->
    [one] Una nota su un titolo sta all'inizio del testo sotto di esso: un titolo non può avere una nota.
    [many] { $count } note su titoli stanno all'inizio del testo sotto di essi: un titolo non può avere una nota.
   *[other] { $count } note su titoli stanno all'inizio del testo sotto di essi: un titolo non può avere una nota.
}
# What a caption began with is shown as the document has it: “Figure 1:”.
core-import-document-labels = { $count ->
    [one] { $count } didascalia cominciava con una parola e un numero, come «{ $first }». La parola e il numero sono lasciati fuori: Glaukopis numera da sé figure e tabelle. Dove il testo ne nomina una con il suo numero, quello resta testo come fu scritto, e non segue i numeri come sono stampati.
    [many] { $count } didascalie cominciavano con una parola e un numero, come «{ $first }». La parola e il numero sono lasciati fuori: Glaukopis numera da sé figure e tabelle. Dove il testo ne nomina una con il suo numero, quello resta testo come fu scritto, e non segue i numeri come sono stampati.
   *[other] { $count } didascalie cominciavano con una parola e un numero, come «{ $first }». La parola e il numero sono lasciati fuori: Glaukopis numera da sé figure e tabelle. Dove il testo ne nomina una con il suo numero, quello resta testo come fu scritto, e non segue i numeri come sono stampati.
}
core-import-document-label-example = Figura 1:
core-import-document-caption-notes = { $count ->
    [one] Una nota in ciò che si dice di una figura o di una tabella vi sta tra parentesi.
    [many] { $count } note in ciò che si dice di figure o tabelle vi stanno tra parentesi.
   *[other] { $count } note in ciò che si dice di figure o tabelle vi stanno tra parentesi.
}
core-import-document-headings = { $count ->
    [one] { $count } titolo in una citazione, un elenco o una tabella è portato dentro come paragrafo in grassetto.
    [many] { $count } titoli in una citazione, un elenco o una tabella sono portati dentro come paragrafi in grassetto.
   *[other] { $count } titoli in una citazione, un elenco o una tabella sono portati dentro come paragrafi in grassetto.
}
core-import-document-code = { $count ->
    [one] { $count } blocco di codice è portato dentro come paragrafi semplici, uno per riga.
    [many] { $count } blocchi di codice sono portati dentro come paragrafi semplici, uno per riga.
   *[other] { $count } blocchi di codice sono portati dentro come paragrafi semplici, uno per riga.
}
core-import-document-definitions = { $count ->
    [one] { $count } elenco di termini con il loro significato è portato dentro come paragrafi, con i termini in grassetto.
    [many] { $count } elenchi di termini con il loro significato sono portati dentro come paragrafi, con i termini in grassetto.
   *[other] { $count } elenchi di termini con il loro significato sono portati dentro come paragrafi, con i termini in grassetto.
}
core-import-document-rules = { $count ->
    [one] { $count } linea attraverso la pagina è lasciata fuori.
    [many] { $count } linee attraverso la pagina sono lasciate fuori.
   *[other] { $count } linee attraverso la pagina sono lasciate fuori.
}
core-import-document-raw = { $count ->
    [one] { $count } pezzo scritto in HTML o TeX per un solo tipo di documento è lasciato fuori.
    [many] { $count } pezzi scritti in HTML o TeX per un solo tipo di documento sono lasciati fuori.
   *[other] { $count } pezzi scritti in HTML o TeX per un solo tipo di documento sono lasciati fuori.
}
core-import-document-pictures-wanting = { $count ->
    [one] { $count } immagine che il file contiene non è nel testo letto, ed è lasciata fuori. Può stare nell'intestazione o nel piè di pagina, o in un disegno.
    [many] { $count } immagini che il file contiene non sono nel testo letto, e sono lasciate fuori. Possono stare nell'intestazione o nel piè di pagina, o in un disegno.
   *[other] { $count } immagini che il file contiene non sono nel testo letto, e sono lasciate fuori. Possono stare nell'intestazione o nel piè di pagina, o in un disegno.
}

## A picture of a document that is left out, and why.

core-import-document-picture-left-out = L'immagine «{ $name }» è lasciata fuori: { $why }.
core-import-document-picture-kind = è di un tipo che non si legge ({ $kind })
core-import-document-picture-not-read = non è un'immagine di un tipo che si legga
core-import-document-picture-unreadable = non si è potuta leggere
core-import-document-picture-network = è in rete, e da lì non si prende nulla
core-import-document-picture-not-taken-out = non si è potuta estrarre dal file
core-import-document-picture-outside = non è nel file, ma altrove su questo computer, e da lì non si prende
core-import-document-picture-outside-folder = è fuori dalla cartella del documento, e un documento portato dentro prende soltanto i file della sua cartella e di quelle sotto
core-import-document-picture-not-found = il file non è stato trovato dove il documento dice che sia
core-import-document-picture-too-large = è più grande di 50 MB
core-import-document-picture-file-unreadable = il file non si è potuto leggere

## What a document takes in from other files (LaTeX's \input, the includes
## of reStructuredText, Org, AsciiDoc and Typst), and what was left out.
## $name is the file as the document names it.

core-import-document-include-outside = Il file «{ $name }», che il documento include, è fuori dalla cartella del documento ed è stato lasciato fuori: un documento portato dentro legge soltanto i file della sua cartella e di quelle sotto.
core-import-document-include-not-found = Il file «{ $name }», che il documento include, non è stato trovato nella cartella del documento ed è stato lasciato fuori.
core-import-document-include-network = «{ $name }», che il documento include, è in rete, e da lì non si prende nulla: è stato lasciato fuori.
core-import-document-include-unreadable = Il file «{ $name }», che il documento include, non si è potuto leggere come testo (UTF-8) ed è stato lasciato fuori.
core-import-document-include-circle = Il file «{ $name }» include sé stesso, attraverso i file che include; è stato letto una volta.
core-import-document-include-too-deep = Il file «{ $name }» è stato lasciato fuori: i file che il documento include ne includono altri per più di { $count } livelli.
core-import-document-include-too-large = Il file «{ $name }» è stato lasciato fuori: con i file che il documento include, supererebbe i 50 MB.
# A Typst module imported as a whole (#import "file.typ" or #import "file.typ" as name).
core-import-document-include-module = Il file Typst «{ $name }» è importato per intero, sotto un nome suo, che qui non si legge; è stato lasciato fuori. Ciò che se ne importa per nome si legge.

## A file of text that is neither UTF-8 nor UTF-16, brought in as references, a document or a table.

# $name is the name of the file.
core-import-read-as-western = «{ $name }» non è scritto né in UTF-8 né in UTF-16, ed è stato letto come europeo occidentale (Windows-1252). Le lettere di altri alfabeti possono essere venute fuori sbagliate: per esserne certo, salva il file come UTF-8 e portalo dentro di nuovo.
