# Le parole di Glaukopis in italiano

Le scelte fatte per la traduzione italiana, da tenere uguali in ogni file.
Il senso di ciascuna parola è in `locales/GLOSSARY.md`.

## Come ci si rivolge a chi scrive

- **Il tu**, come fa oggi il software in italiano (Apple, Microsoft, GNOME):
  «Seleziona del testo e premi Ctrl+Alt+C». Dove si può, la frase è
  impersonale («Il progetto non si è potuto aprire»), e si dà del tu solo
  dove serve. Mai il lei, mai il voi.
- **I comandi** (pulsanti, voci di menu, voci della tavolozza) sono
  all'imperativo di seconda persona, come in tutto il software italiano:
  «Salva», «Annulla», «Chiudi», «Elimina», «Porta dentro…». L'infinito
  («Salvare») in italiano non si usa sui pulsanti.
- **I suggerimenti** (`.hint`) e i messaggi sono frasi piane, senza punto
  finale quando sono una sola frase, come in inglese.
- **Virgolette**: «…» per le citazioni e per i nomi messi fra virgolette
  («{ $name }»); “…” solo dentro una frase già fra caporali.
- **Tasti**: Ctrl, Maiusc, Alt, Invio, Canc, Esc, Tab, Spazio, Fine, Home
  (la tastiera italiana scrive così; Cmd su Mac).
- **Plurali**: `[one]`, `[many]` e `*[other]`. Il controllo chiede anche
  `[many]`, la forma italiana dei milioni (1 000 000 → «un milione di»);
  siccome il programma scrive il numero in cifre, il testo di `[many]` è
  lo stesso di `[other]`.
- **Puntini**: il carattere `…`, non tre punti.
- **I tempi della linea del tempo**: il programma (`src/lib/timeline/time.ts`)
  legge per ora solo le forme inglesi e norvegesi (`431 BC`, `May 1453`,
  `5th century BC`, `5 years`), non `a.C.`, `maggio`, `V secolo`, `anni`. I
  suggerimenti e i segnaposto di `timeline.ftl` mostrano perciò le forme
  inglesi; `when-bc`, che serve solo a scrivere le etichette dell'asse, è
  «a.C.». Quando il programma leggerà l'italiano, si cambino
  `timeline-dates-hint`, `when-hint-dates`, `when-time-placeholder` e
  `when-margin-placeholder`.

## Il lavoro

| inglese | italiano | note |
| --- | --- | --- |
| project | progetto | un albero di elementi, il cui elemento in cima porta il nome del progetto |
| tree | albero | l'albero degli elementi di un progetto |
| map | mappa | |
| open as a map | aprire come mappa | qualunque elemento: «Apri come mappa» |
| go up, up to | risalire, risali a | all'elemento sopra: «Risali a «{ $name }»» |
| the element over this one | l'elemento sopra questo | |
| the owl map | la mappa della civetta, la mappa dei progetti | tutti i progetti intorno alla civetta, le cartelle come etichette; sull'interfaccia si dice per lo più «la mappa dei progetti» |
| the owl | la civetta | la civetta di Atena, il segno di Glaukopis; non «gufo» |
| element | elemento | |
| the centre | il centro | |
| the diagram | il diagramma | la vista a scatole e linee |
| the text | il testo | la vista a testo corrente |
| passage | passo | «il passo selezionato», come si dice di un testo |
| kind | tipo | di elemento, di paragrafo, di parole: un significato, mai un aspetto |
| look | aspetto | come un tipo è reso nel documento; gli aspetti stanno nell'impaginazione |
| layout | impaginazione | come appare la pagina di un documento: margini, font, titoli, note, gli aspetti dei tipi. «Manoscritto» è un'impaginazione; «le tue impaginazioni». Il codice e i file la chiamano *format* |
| format | formato | solo i formati di file: Word, PDF, LaTeX… («formato di file»). Mai più nel senso di impaginazione, anche dove l'inglese del core dice ancora *format* per un'impaginazione (`core-export.ftl`). «Formato» come nome del gruppo dei segni (`editor-format`) resta: è la formattazione delle lettere |
| pattern document | documento campione | il documento da cui Word e OpenDocument prendono gli stili; non «documento modello», che ora si confonderebbe con il modello |
| template | modello | ciò di cui un documento di un genere consiste: parti, tipi a portata di mano, impaginazione e stile, requisiti, file. «Articolo di rivista» è un modello; si eredita giù per l'albero |
| document settings | impostazioni del documento | la finestra del documento di un elemento |
| details | dettagli | titolo, autori, data, parole chiave, identificativi |
| part | parte | un tipo di elemento che ha un posto nel documento: abstract, dedica, appendice, copertina |
| front matter | parti iniziali | ciò che sta prima del testo |
| back matter | parti finali | ciò che sta dopo il testo |
| the cover | la copertina | |
| foreword, preface, afterword | prefazione, premessa, postfazione | parti (`parts.ftl`) |
| standfirst, blurb | sommario, quarta di copertina | parti (`parts.ftl`) |
| half title, title page | occhietto, frontespizio | parti fatte dall'applicazione (`template.ftl`) |
| requirement, requires | requisito, chiede | ciò che un modello chiede: parole, parole chiave, anonimato |
| checklist | lista di controllo | ciò che il modello chiede, contro ciò che l'albero contiene |
| in hand, puts in hand | a portata di mano | i tipi che un modello offre per primi |
| the Look panel | il pannello Aspetto | accanto all'anteprima; il suo titolo è «Aspetto». «Apri Aspetto» |
| Type (a part of the look) | Caratteri | la parte dell'aspetto e dell'impaginazione con font e dimensione; «Font» resta il nome del campo |
| changes (of a document over its layout) | modifiche | «Manoscritto · 2 modifiche» |
| style | stile | solo lo stile delle citazioni e della bibliografia; «stile di citazione» per *reference style*, come in `settings.ftl` e `style.ftl` |
| document | documento | |
| the manuscript | il manoscritto | come lo chiamano gli editori |
| the preview | l'anteprima | |
| export | esportare, esportazione | |
| bring in | portare dentro | un documento si porta dentro e diventa una mappa; i riferimenti da Zotero si *importano* |
| bring back | riportare, riportare indietro | dal cestino, dalla cronologia |
| project file | file di progetto | un progetto salvato come un solo file |

## Riferimenti e citazioni

| inglese | italiano | note |
| --- | --- | --- |
| the library | la biblioteca | non «libreria», che è il negozio |
| reference | riferimento | un'opera della biblioteca |
| work | opera | |
| collection | raccolta | |
| attachment | allegato | |
| the files of the library | i file della biblioteca | una vista a sé, accanto ai riferimenti; «file» è invariabile |
| the library's store | il deposito della biblioteca | dove stanno i file, come il deposito delle immagini |
| assign, unassigned | assegnare, non assegnato | un file a un riferimento |
| take in (files) | aggiungere, aggiunta | «Aggiunta di 3 file…», «Un file aggiunto» |
| going-through, go through | rassegna, passare in rassegna | dei file, delle citazioni sciolte |
| note | nota | la nota scritta su un riferimento |
| citation | citazione | |
| locator | luogo | «il luogo citato»: pagina, capitolo, verso |
| lookup, look up | ricerca in rete, cercare in rete | DOI, ISBN o parole del titolo |
| loose citations | citazioni sciolte | in un testo venuto da altrove, riconosciute ma non ancora legate a un riferimento della biblioteca; fino al 2026-10-12 «citazioni trovate» |
| made into citations | farne citazioni | quando una citazione sciolta è legata al suo riferimento |
| match | abbinare, abbinamento | una citazione sciolta a un riferimento |

## Parole e segni

| inglese | italiano | note |
| --- | --- | --- |
| foreign words | parole straniere | |
| title of a work | titolo di un'opera | |
| term | termine | |
| mention | menzione | la parola in quanto parola |
| highlight | evidenziazione, evidenziato | solo sullo schermo |
| marks | segni | corsivo, grassetto, maiuscoletto, sottolineato, apice, pedice, barrato, codice |
| italics, bold | corsivo, grassetto | |
| small capitals | maiuscoletto | |
| underline | sottolineato | |
| superscript, subscript | apice, pedice | |
| struck through | barrato | |
| code | codice | |
| font | font | invariabile, come nel software italiano; «carattere» solo per le lettere |

## Immagini, figure, tabelle e formule

| inglese | italiano | note |
| --- | --- | --- |
| picture | immagine | il file |
| the store | il deposito | dove stanno tutte le immagini; «archivio» resta per gli archivi veri |
| figure | figura | un'immagine nel testo, con didascalia e numero |
| caption | didascalia | |
| pointer | rimando | «vedi figura 2» |
| table | tabella | |
| formula, equation | formula, equazione | |
| placing | collocazione | dove sta una figura sulla pagina |
| width | larghezza | |

## Tempo, commenti, cronologia

| inglese | italiano | note |
| --- | --- | --- |
| timeline | linea del tempo | |
| lane | corsia | della linea del tempo |
| chronology | tavola cronologica | l'elemento con la tabella dei tempi; «cronologia» è presa dalla history |
| when | quando | il tempo che un elemento ha |
| span | periodo | un tempo con un inizio e una fine |
| comment | commento | |
| thread | discussione | |
| settle, settled | chiudere, chiuso | una discussione |
| history | cronologia | gli stati passati di un progetto |
| changes | modifiche | |
| review | revisione | |
| accept, reject | accetta, rifiuta | |
| sharing | condivisione | |
| working together | lavorare insieme | |
| join | entrare in | un progetto condiviso |
| member | membro | |
| owner | proprietario | |
| server | server | |

## Leggere e controllare

| inglese | italiano | note |
| --- | --- | --- |
| spelling | ortografia | |
| dictionary | dizionario | |
| own words | parole proprie | aggiunte al dizionario |
| reading text, OCR | lettura del testo, OCR | con Tesseract |
| made searchable | reso ricercabile | un PDF |
| language package | pacchetto linguistico | dizionari d'ortografia e dati di Tesseract, importati da un server |
| import (a language) | importare | da un server o da una cartella |
| script | alfabeto | greco, latino, cirillico: «l'alfabeto greco è letto insieme con quello latino» |
| styles of text (of a PDF) | stili di testo | come appare il testo che ricorre accanto al corpo; da non confondere con lo stile di citazione |
| search, replace | cerca, sostituisci | |
| found, what is found | i risultati, le occorrenze | |

## L'interfaccia

| inglese | italiano | note |
| --- | --- | --- |
| the rail | la barra | a sinistra: Progetti, Biblioteca, Immagini, Impostazioni |
| the panel at the side | il pannello laterale | |
| pane | riquadro | |
| the palette | la tavolozza dei comandi | |
| the writing tools | gli strumenti di scrittura | |
| fold, fold away | ripiegare | e «aprire» per il contrario; dal 2026-10-24, dove «Apri» starebbe accanto ad «Apri» (aprire un progetto), «dispiegare»: «Ripiega», «Dispiega» |
| settings | impostazioni | |
| data directory | la cartella dei dati | |
| trash | cestino | |
| folder | cartella | |
| key, shortcut | tasto, scorciatoia | |
| sheet of keys | il foglio dei tasti | |
| placeholder | segnaposto | |
| drag, drop | trascinare, lasciare | |
| select, selection | selezionare, selezione | |
| clipboard | appunti | |
| tab | scheda | |
| undo, redo | annulla, ripeti | |
| credits | riconoscimenti | «Riconoscimenti e licenze» |
| thing (folders and projects together) | cosa | «3 cose sono state spostate» |
| the log, a run | il registro, una sessione | ciò che Glaukopis dice di sé a ogni sessione |
| the home page | la pagina dei progetti | |
| the words of Glaukopis (words.ftl) | le parole di Glaukopis | un progetto di parole, per tradurle e correggerle; «file Fluent» |

## Nuovo nella 0.2.3 (2026-10-20)

| inglese | italiano | note |
| --- | --- | --- |
| what you are writing | che cosa stai scrivendo | il pulsante sopra l'anteprima e il titolo della scelta: «Che cosa stai scrivendo?»; ciò che il documento è, cioè il suo modello |
| the chooser (of what you are writing) | la scelta di che cosa scrivi | la finestra dei modelli; «selettore» no, è parola da informatici |
| About this document | Informazioni sul documento | la finestra delle impostazioni del documento di un elemento (dettagli, lingua, lista di controllo); fino al 2026-10-20 «Impostazioni del documento» |
| chip | cartellino | la piccola etichetta al bordo della pagina dell'anteprima che dice che cos'è una riga; non «etichetta», che è già delle citazioni e delle associazioni |
| name the lines | dare un nome alle righe | l'interruttore dei cartellini |
| running head | testatina | come già in `format.ftl` e `ocr.ftl` |
| header, footer (as places) | intestazione, piè di pagina | a sinistra, al centro, a destra; sulla prima pagina e sulle altre |
| the summary (of a reading) | il riepilogo | la finestra di una lettura come si apre: «Torna al riepilogo» |
| the pages (of a reading), the workbench | le pagine | «Guarda le pagine e provale…»; la striscia in alto e i tre riquadri |
| the strip | la striscia | delle pagine in piccolo |
| try a page, a page tried | provare una pagina, pagina provata | letta una volta con le impostazioni che valgono per essa: «Prova la pagina 40» |
| trial, Tried with | prova, Provata con | le prove di una pagina, tenute ed elencate |
| confidence | affidabilità | quanto Tesseract era sicuro: «Affidabilità bassa (73%)», «Affidabilità buona (85%)», «Affidabilità alta (93%)»; il numero con `%` attaccato, come negli altri file |
| unsure words | parole incerte | «89 parole incerte su 251» |
| read poorly | letta male | una pagina sotto l'80% |
| stretch | tratto | pagine lette con impostazioni proprie, mostrate come fasce sopra la striscia; «un tratto di pagine» |
| band | fascia | sopra la striscia |
| Gothic type | caratteri gotici | la stampa dei libri tedeschi e scandinavi di un tempo; *Fraktur* resta il nome del carattere |
| the Fraktur model | il modello Fraktur | il modello di Tesseract per i caratteri gotici; «modello» qui solo insieme con *Fraktur*, mai da solo, per non confonderlo con il modello di un documento |
| What the pages take | Che cosa prendono le pagine | il testo del PDF, una lettura di Tesseract, o la qualità del testo decide pagina per pagina |
| What is made of it | Che cosa se ne fa | scelto dopo la lettura |

## Nuovo dopo la 0.2.4 (2026-10-24)

| inglese | italiano | note |
| --- | --- | --- |
| the list (at the left) | l'elenco, l'elenco dei progetti | l'unico albero di tutti i progetti e le cartelle; come già `home-pane` |
| the start screen | la schermata iniziale | quando nessun progetto è aperto |
| side (of the window) | lato | ciascun lato tiene un progetto suo: «Chiudi questo lato», «Scambia i lati»; non «metà», non «pannello» |
| the path | il percorso | in cima a ciascun lato: dove sei nell'albero; «Altro del percorso» |
| Split view, Split | Vista divisa, Dividi | il pulsante che mostra due lati; fino al 2026-10-24 «Due affiancate» |
| the typesetting pane, Typesetting | il riquadro della composizione, Composizione | le pagine come Typst le compone, con la colonna Aspetto accanto; «composizione» come la composizione tipografica. Non «impaginazione», che è il layout, né «impaginato», che le starebbe troppo vicino |
| the document pane, Document | il riquadro del documento, Documento | riferimenti, immagini, commenti… del lato in uso |
| zoom, Fit the width | zoom, Adatta alla larghezza | «Zoom» resta il nome del pulsante; «Pagine più grandi», «Pagine più piccole» |
| marks of whitespace | segni degli spazi e dei paragrafi | ¶ ↵ e il cerchietto dello spazio unificatore; «segni» da soli restano corsivo, grassetto… (il menu `editor-marks`) |
| hard space | spazio unificatore | il termine tipografico italiano, come in Word e Writer |
| Document properties | Proprietà del documento | la finestra di ciò che il documento dice di sé; fino al 2026-10-24 «Informazioni sul documento» |
| document type | tipo di documento | ciò che il documento è, il suo modello: «Tipo di documento…», «Tipo di documento predefinito», «Parti del tipo di documento». Come in norvegese, «tipo» vale qui accanto a «tipo» di paragrafo e di parole |
| paragraph kind, words kind | tipo di paragrafo, tipo di parole | «Tipi di paragrafo», «Tipi di parole» |
| enter (an element) | entrare in | l'elemento diventa quello in vista: «Entra», «Entra accanto»; al posto di «Apri come mappa» |
| open beside | aprire accanto | «Apri accanto» |
| clone | clone, clonare | un elemento che sta altrove con un nome suo e il testo e i figli dell'originale: «Clona un altro elemento…», «Clone di «…»», «Non più un clone» |
| sub-elements | sottoelementi | gli elementi sotto un elemento: «Elimina con i sottoelementi», «Elimina e alza di livello i sottoelementi» |
| child element, sibling element | sottoelemento, elemento allo stesso livello | «Aggiungi un sottoelemento», «Aggiungi un elemento allo stesso livello»; non «figlio», «fratello», da informatici |
| fold, unfold | ripiegare, dispiegare | «Ripiega questo elemento», «Dispiega tutti i sottoelementi» |
| Time stamp | Datazione | quando un elemento è, un punto o un periodo: «Datazione…»; come la datazione di un fatto o di un'opera |
| image | immagine | ciò che l'inglese prima diceva *picture*; in italiano era già «immagine» |
| look chip | cartellino dell'aspetto | il cartellino (vedi sopra) che nomina una riga dell'anteprima e apre Aspetto su di essa |
| inline number | numero nel testo | un numero o un'etichetta in un punto della prosa (Stephanus, Bekker); fino al 2026-10-24 «segno di riferimento». Non «nel rigo», perché l'impaginazione può metterlo a margine |
| contributor | contributore | le persone di un documento, ciascuna con un ruolo; come nei sistemi editoriali delle riviste. Non «collaboratore», che è già di chi condivide un progetto (`sharing.ftl`, `project-left-out`) |
| role: Author, Editor, Translator | ruolo: Autore, Curatore, Traduttore | «curatore» come in «a cura di», non «editore», che è chi pubblica |
| Edited by, Translated by, Edited and translated by | A cura di, Traduzione di, A cura e traduzione di | parole che il documento stampa sul frontespizio (`document.ftl`) |
| Editors and translators | Curatori e traduttori | l'interruttore della prima pagina in Aspetto |
| Line numbering from here | Numerazione delle righe da qui | la finestra e la voce del menu del testo |
| Numbering of this line | Numerazione di questa riga | |
| Count the lines of, Every kind | Conta le righe di, Tutti i tipi | |
| Counted | Contata | della riga |
| Its number is shown: As the others are, Always, Never | Il suo numero è mostrato: Come per le altre, Sempre, Mai | |
| annotation | annotazione | ciò che sta nel margine accanto a una riga: un metro, il numero di un'altra edizione; «Annotazione nel margine destro» |
| Indentation step | Passo di rientro | la lunghezza di un passo di Tab |
| Begins where the line before ended | Comincia dove finisce la riga precedente | la seconda metà di un verso diviso fra due personaggi |
| Anonymize the front page | Rendi anonima la prima pagina | |
| A project of all the projects | Un progetto di tutti i progetti | al posto di «Una mappa dei progetti» |

## Nuovo dopo la 0.2.5 (2026-10-31)

| inglese | italiano | note |
| --- | --- | --- |
| a file in a view, the viewer | un file in una vista, la vista di un file | un lato della finestra mostra un file della biblioteca, un PDF o un'immagine, al posto di una mappa: «Mostra il file». L'interfaccia non nomina mai il visualizzatore: dice «il file», «la vista»; dove nelle note serve un nome, «la vista del file» |
| the view (of the window, as a place) | la vista | «Alla larghezza della vista», «Tutta l'immagine nella vista»; `files-view = Vista` è invece il menu che sceglie elenco o miniature, come `diagram-view` |
| tab, the tabs of a project | scheda, le schede del progetto | i file aperti accanto a un progetto, ciascuno al suo punto, come le schede di un browser: «Schede», «Le schede di { $name }», «Chiudi la scheda», «Chiudi le altre schede», «Riapri in una nuova scheda»; «Aggiungi alle schede di un progetto…»; «Le schede del progetto» nella Vista divisa |
| bookmark, Mark this place | segnalibro, Segna questo punto | un punto, una pagina, in un file, conservato con il file nella biblioteca: «Segnalibri», «Il nome del segnalibro», «Rinomina», «Togli» |
| contents (of a file) | indice | l'indice che il PDF porta con sé: «Segnalibri e indice», «Il file non ha un indice suo»; non «sommario», che è già una parte (`parts.ftl`) |
| drawn (pages) | disegnate | le pagine di un PDF si disegnano, come già in `core-ocr.ftl`: «Questa pagina non si è potuta disegnare» |
| locked (file) | chiede una password | «Il file chiede una password, e non si può mostrare» |
| zoom: As wide as the view, The whole image in the view | zoom: Alla larghezza della vista, Tutta l'immagine nella vista | «Zoom» resta il nome del pulsante; il numero con `%` attaccato, come negli altri file; «Zoom, in percentuale», «Scegli uno zoom» |
| Go to page | Vai alla pagina | il campo della barra |
| Page 3 of 271 | Pagina 3 di 271 | il numero che la pagina ha a stampa, se è un altro, dopo fra parentesi |
| Edit (an image), the image editor | Modifica, la modifica dell'immagine | il pulsante alla fine della barra di un'immagine; non «editor», che in italiano è il programma |
| Turn left, Turn right | Ruota a sinistra, Ruota a destra | di un quarto di giro |
| Flip sideways, Flip upside down | Specchia, Capovolgi | a specchio da sinistra a destra; sottosopra. Due parole piane e distinte, come nei visualizzatori d'immagini italiani; non «rifletti orizzontalmente/verticalmente», che confonde |
| Crop, Cut to w × h of W × H | Ritaglia, Ritagliata a w × h di W × H | il taglio dell'immagine, al femminile |
| Brightness, Contrast, Saturation | Luminosità, Contrasto, Saturazione | tre cursori da 0 a 200%, 100% com'è |
| As it was, Start again | Com'era, Ricomincia | un cursore riportato a 100%; tutto annullato |
| Keep as a new file, Kept as | Conserva come nuovo file, Conservata come | «conservare» come già di ciò che si dice di un'immagine (`figures-picture-not-kept`); l'immagine modificata è un nuovo file accanto al vecchio |
| Leave without keeping?, Leave | Uscire senza conservare?, Esci | della modifica |
| (edited), (edited 2); (smaller) | (modificata), (modificata 2); (ridotta) | messe nel nome del file prima dell'estensione: «tavola (modificata).jpg», «tavola (ridotta).jpg»; `core-pictures-edited` e `core-pictures-smaller` sono le parole sole, minuscole, senza parentesi, che aggiunge il programma; al femminile perché sono un'immagine, una copia |
| a smaller copy, Make a smaller copy | una copia più piccola, Fai una copia più piccola | di un'immagine troppo grande per essere modificata |
| a version (of a figure's image), Versions | una versione, Versioni | nel menu di una figura: l'originale e le copie ricavate da esso, ciascuna con la sua dimensione in pixel |
| SVG, a drawing | SVG, un disegno | il tipo di una figura che è un disegno; «un disegno non ha pixel da modificare» |
| pixels, Pixels | pixel, Pixel | invariabile; «1600 × 1200 pixel» |
| Files (the view of the library): View, List, Thumbnails | Vista, Elenco, Miniature | «Miniature» come in tutto il software italiano; «Piccole», «Medie», «Grandi» |
| Include subfolders | Includi le sottocartelle | |
| Used in; A figure in {project}; Not used yet | Usato in; Una figura in {project}; Non ancora usato | la colonna di un file senza riferimento: dove è figura. Al maschile, del file |
| What it shows, in words | Che cosa mostra, a parole | le parole date a chi non può vedere l'immagine, come `figures-shows-placeholder` |
| Made from; Copies made from it | Ricavato da; Copie ricavate da questo file | una copia dice da quale file è stata ricavata, modificandolo, riducendolo o per farne una figura; non «fatto da», che in italiano dice chi lo ha fatto |
| No preview for this kind of file | Nessuna anteprima per questo tipo di file | |
| not shown small | non si mostra in piccolo | `core-library-no-small`: un tipo di file che non ha miniatura |
| Read (a file in the library) | Leggi | il file mostrato grande al posto dell'elenco; «Torna ai file» |
| People, Year, Title, Publisher | Persone, Anno, Titolo, Editore | le colonne dei file mostrati dal loro riferimento; «Per anno», «Per titolo», «Per editore» |
| tr. { $names } | trad. { $names } | i traduttori dopo gli autori, in breve: «Lord; trad. Smith», come «trad.» già in `style.ftl` |
| Name by the reference, Name by their references | Rinomina secondo il riferimento, Rinomina secondo i loro riferimenti | i file sul disco prendono il nome dei loro riferimenti, come li chiamerebbe un'esportazione |
| Add to a project's tabs…, Show | Aggiungi alle schede di un progetto…, Mostra | il menu dei progetti chiede quale; «Aggiunto alle schede di { $project }», «Già nelle schede di { $project }» |
| Open in another program | Apri in un altro programma | un tipo di file che qui non si può mostrare |
| The document of the other side | Il documento dell'altro lato | sopra il riquadro del documento mentre il lato in uso mostra un file |
| Images (the folder) | Immagini | la cartella della biblioteca in cui sono andate le immagini del vecchio deposito |
| mind map | mappa mentale | un file di Freeplane, FreeMind o XMind: «Apri una mappa mentale…», «Salva come mappa mentale…»; OPML solo in uscita |
| left out | lasciato fuori | ciò che non ha posto dall'altra parte, come già `core-import.ftl`: «…ed è stata lasciata fuori:» |
| images; pictures in texts | immagini; immagini dentro un testo | i file d'immagine; le immagini messe nel testo di un elemento, di cui si conserva la didascalia |
| clouds, summaries, boundaries | nuvole, riepiloghi, confini | le cose di Freeplane e di XMind, come le dicono le loro interfacce italiane: la nuvola di Freeplane, il riepilogo e il confine di XMind |
| hyperlinks | collegamenti a pagine web o a file | |
| icons, markers | icone, marcatori | le icone di Freeplane, i marcatori di XMind |
| attributes; Kind, Time, Left out | attributi; Kind, Time, Left out | gli attributi di Freeplane; i tre che Glaukopis legge e scrive si chiamano così in ogni lingua |
| labels | etichette | le etichette di XMind; la prima diventa il tipo |
| associations, topic | associazioni, argomento | come già «associare» nel diagramma; il nodo di XMind è l'«argomento», come la sua interfaccia italiana |
| times that could not be read | datazioni che non si sono potute leggere | la datazione di un elemento (vedi *Time stamp*) |
| references to figures or parts | rimandi a figure o a parti | come *pointer* |
| Save the diagram as SVG…, as an image… | Salva il diagramma come SVG…, come immagine… | dal menu dello sfondo del diagramma; «Immagine PNG» il tipo di file; «{ $width } × { $height } pixel» |
| Print…, Print | Stampa…, Stampa | nella testa del riquadro della composizione e nella barra di un file; il tasto Ctrl+P |
| Pages to print; The one page; All n pages; From … to … | Pagine da stampare; L'unica pagina; Tutte le n pagine; Da … a … | la domanda prima di stampare un PDF; due campi fra «Da» e «a» |
| Preparing n pages for printing…; Drawing n pages for printing… | Preparazione di n pagine per la stampa…; Disegno di n pagine per la stampa… | come «Esportazione di n file…» |
| Numbers from the text, Annotations from the text | Distanza dei numeri dal testo, Distanza delle annotazioni dal testo | le due lunghezze sotto *Numera le righe* in Aspetto, in centimetri; «dal testo» da solo in italiano direbbe da dove vengono |
| too large (a file read) | più grande di n MB, il massimo che si legge | `io-too-large` |
| not a zip archive | non è un archivio zip | `io-not-an-archive`; «archivio» per gli archivi veri, come dice la voce *the store* |

## Nomi che non si traducono

Glaukopis; Pandoc, Typst, Tesseract, Hunspell, LaTeX, LuaLaTeX, BibLaTeX,
Zotero, CSL, Markdown, Org; Freeplane, FreeMind, XMind, OPML; i formati di
file (DOCX, ODT, PDF, EPUB, RTF, HTML, SVG, PNG); i nomi dei font; gli stili
(APA, Chicago, MLA); DOI, ISBN, ISSN, arXiv, URL, ORCID; i nomi degli
attributi Kind, Time e Left out di una mappa mentale.
