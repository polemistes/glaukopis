# What the core says of making documents and previews, of reference styles
# and of document formats, in English. See locales/README.md.

## Making a document.

core-export-picture-missing = L'immagine «{ $name }» non è su questo computer, e resta fuori dal documento.
# Pictures that are in the store, and could not be put where the document is made: $error is why the first could not.
core-export-files-not-placed = { $count ->
    [one] Il file di un'immagine non si è potuto mettere dove si fa il documento, e l'immagine resta fuori: { $error }
    [many] I file di { $count } immagini non si sono potuti mettere dove si fa il documento, e le immagini restano fuori: { $error }
   *[other] I file di { $count } immagini non si sono potuti mettere dove si fa il documento, e le immagini restano fuori: { $error }
}
core-export-cover-left-out = L'immagine della copertina non si è potuta mettere dove si fa il libro, e il libro è senza copertina: { $error }
core-export-astray = { $count ->
    [one] Un rimando nel testo si riferisce a qualcosa che non è nel documento. È reso come [?].
    [many] { $count } rimandi nel testo si riferiscono a ciò che non è nel documento. Sono resi come [?].
   *[other] { $count } rimandi nel testo si riferiscono a ciò che non è nel documento. Sono resi come [?].
}
core-export-latex-font = { $font } non è installato. Il documento è composto in Latin Modern, il font che LaTeX ha di suo.
# Texts of a preview that the interface did not send again, and that were not kept: it sends them all.
core-export-lacking = { $count ->
    [one] Un testo del documento non è stato mandato, e non è conservato.
    [many] { $count } testi del documento non sono stati mandati, e non sono conservati.
   *[other] { $count } testi del documento non sono stati mandati, e non sono conservati.
}
# Shown after "not found: ".
core-export-preview-document = il documento dell'anteprima
core-export-reading-pdf = lettura del PDF prodotto
core-export-reading-made = lettura del documento prodotto

## The pattern document, from which Word and OpenDocument take their styles.

core-export-pattern-unreadable = il documento campione non si è potuto leggere: { $error }
core-export-pattern-lacks = al documento campione manca { $name }
core-export-pattern-reading = lettura del documento campione
core-export-pattern-writing = scrittura del documento campione

## Formulas, as they are shown where they are written.

core-export-formula-incomplete = La formula finisce prima di essere completa.
# The command is as it was written: \frac.
core-export-formula-unknown = { $command } è sconosciuto.
core-export-formula-unexpected = { $what } non era atteso dove si trova.
core-export-formula-unreadable = La formula non si è potuta leggere.
core-export-formula-too-long = La formula è troppo lunga.

## Reference styles.

core-export-style-bad-id = «{ $id }» non può essere l'identificativo di uno stile
core-export-not-a-style = Questo non è uno stile: { $error }.
core-export-not-a-style-begin = Questo non è uno stile: non comincia con <style>.
core-export-dependent-style = Questo stile nomina soltanto un altro stile, da cui prende la sua forma. Prendi invece quello, con il suo nome.
core-export-style-unreadable = Lo stile non si è potuto rileggere.
core-export-style-needs-name = Uno stile ha bisogno di un nome.
core-export-style-own-only = Si possono eliminare solo gli stili propri.
# Shown after "not found: ".
core-export-the-reference-style = lo stile di citazione «{ $id }»
core-export-any-reference-style = uno stile di citazione qualsiasi
core-export-the-style = lo stile «{ $id }»

## Document formats.

core-export-format-bad-id = «{ $id }» non può essere l'identificativo di un'impaginazione
core-export-format-needs-name = Un'impaginazione ha bisogno di un nome.
core-export-format-own-only = Si possono eliminare solo le impaginazioni proprie.
core-export-not-a-length = «{ $length }» non è una lunghezza
# Shown after "not found: ".
core-export-the-format = l'impaginazione «{ $id }»

## Templates.

core-export-template-bad-id = «{ $id }» non può essere l'identificativo di un modello
core-export-template-needs-name = Un modello ha bisogno di un nome.
core-export-template-own-only = Si possono eliminare solo i modelli propri.
core-export-the-template = il modello «{ $id }»
core-export-output-not-yet = Il file «{ $id }» del modello non si può ancora fare: per ora solo il documento.
core-export-output-unknown = Il modello non ha nessun file «{ $id }».

## Stage 5 of the settings in plain words: LaTeX's hyphenation.

core-export-latex-no-hyphenation = LaTeX non ha le regole di sillabazione per la lingua { $language }: le parole vanno a capo come quelle inglesi finché non è installato il pacchetto della lingua di TeX Live (su Arch, texlive-langeuropean per la maggior parte delle lingue europee).
