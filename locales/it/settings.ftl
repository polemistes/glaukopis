# The settings.

settings-title = Impostazioni
settings-error-system = Qualcosa dell'applicazione non si è potuto leggere
settings-error-read = Le impostazioni non si sono potute leggere
settings-error-save = Le impostazioni non si sono potute salvare
settings-error-fonts = I font di questo computer non si sono potuti elencare
settings-error-templates = I modelli non si sono potuti elencare
# A damaged file of settings was renamed and left beside where it was; $path is where it is now.
settings-set-aside = Le impostazioni non si sono potute leggere, e sono messe da parte come { $path }; si usano quelle predefinite
settings-set-aside-person = Le impostazioni non si sono potute leggere, e sono messe da parte come { $path }; si usano quelle predefinite, e questo computer è una persona nuova nella cronologia dei progetti

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
settings-text-size = Dimensione del tuo testo nell'editor
settings-text-size-hint = Rispetto all'interfaccia. Non cambia le dimensioni dei font nell'anteprima e nell'esportazione del documento.
settings-editor-font = Font dell'editor
settings-editor-font-hint = Scegli il font per il tuo testo nell'editor.
settings-editor-font-default = Come l'interfaccia (Literata)
# How the text of a map shows how deep each element stands: on the screen only.
# How the text editor shows how deep each element stands: on the screen only.
settings-text-depth = Struttura del documento
settings-text-depth-hint = Come l'editor mostra la struttura del tuo testo.
settings-text-depth-numbers = Numeri
settings-text-depth-dots = Punti
settings-text-depth-indent = Rientri, con linee
settings-interface-size = Dimensione dell'interfaccia
# A line of text in the size chosen, which shows the face of the letters; a
# line of Homer's Greek follows it.
# A sentence with every letter of the language's alphabet (a pangram), set in
# the size and the font chosen; where no good pangram is known, the alphabet.
settings-sample = Ma la volpe, col suo balzo, ha raggiunto il quieto Fido.
# The three levels of the sample of the document structure, the sample sentence under the third.
settings-sample-heading = Titolo
settings-sample-subheading = Sottotitolo
settings-sample-third = Un terzo livello

## New documents

settings-new-documents = Nuovi documenti
# Whether a new project opens in its diagram or in its text; the choices are the names of the two views.
settings-new-project-view = Vista dei nuovi progetti
settings-new-project-view-hint = La vista in cui si apre un progetto appena creato.
settings-template = Che cosa sono i nuovi documenti
settings-document-format = Come appaiono le loro pagine
settings-reference-style = Come citano

## You

settings-you = I tuoi dati
settings-you-about = Il tuo nome è come ti chiamano la cronologia di un progetto e coloro con cui lo condividi. Un nuovo progetto ha te come autore, con la tua organizzazione, l'e-mail e l'ORCID; questo si cambia nelle impostazioni del documento del progetto. Titolo, indirizzo e telefono sono tenuti per i documenti che li chiederanno; per ora nulla li usa. Glaukopis non manda niente di tutto questo da nessuna parte da sé: ciò che sta nelle impostazioni del documento di un progetto va con il progetto quando lo condividi o lo esporti.
settings-first-name = Nome
settings-last-name = Cognome
settings-organization = Istituzione
settings-position = Titolo/Qualifica
settings-address = Indirizzo
settings-phone = Telefono
settings-email = E-mail
settings-orcid = ORCID
settings-orcid-problem = Un ORCID iD è fatto di quattro gruppi di quattro cifre: 0000-0002-1825-0097.
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
settings-data = Dove è conservato tutto
# "file" is the name of the file of the library, shown as code.
settings-data-hint = I tuoi riferimenti sono in { $file }, che qualunque strumento BibLaTeX può leggere. Per tenere una copia del tuo lavoro, copia questa cartella.

## Language

settings-language = Lingua
settings-language-interface = L'interfaccia
settings-language-system = Come il sistema ({ $language })
settings-language-texts = Lingua dei nuovi testi
# The words of the language chosen for the interface could not be read; it stays in the one it was in.
settings-language-error-load = Le parole di { $language } non si sono potute caricare

## The log of the runs.

settings-logs = Il registro
settings-logs-hint = { $count ->
    [one] Ciò che Glaukopis dice di sé nell'ultima sessione: che cosa ha fatto, che cosa è andato storto, e che cosa è stato della sua finestra. Utile quando qualcosa è andato storto e nessuno ha visto perché.
    [many] Ciò che Glaukopis dice di sé in ogni sessione, delle ultime { $count } sessioni: che cosa ha fatto, che cosa è andato storto, e che cosa è stato della sua finestra. Utile quando qualcosa è andato storto e nessuno ha visto perché.
   *[other] Ciò che Glaukopis dice di sé in ogni sessione, delle ultime { $count } sessioni: che cosa ha fatto, che cosa è andato storto, e che cosa è stato della sua finestra. Utile quando qualcosa è andato storto e nessuno ha visto perché.
}

## What a line of the preview is: whether a chip at the edge of a page names it.

settings-page-chips = Un cartellino dice che cos'è una riga dell'anteprima
settings-page-chips-hint = Premuta, una riga dell'anteprima mostra al bordo della pagina un cartellino che dice che cos'è la riga (testo, una citazione, un titolo…) e apre Aspetto su di essa; premuta di nuovo, il cartellino se ne va.
settings-page-chips-on = Acceso
settings-page-chips-off = Spento
