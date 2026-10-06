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
| project | progetto | |
| map | mappa | |
| element | elemento | |
| the centre | il centro | |
| the diagram | il diagramma | la vista a scatole e linee |
| the text | il testo | la vista a testo corrente |
| passage | passo | «il passo selezionato», come si dice di un testo |
| kind | tipo | di elemento, di paragrafo, di parole: un significato, mai un aspetto |
| look | aspetto | come un tipo è reso nel documento |
| format | formato | del documento intero; «formato di file» per DOCX, PDF… |
| style | stile | solo lo stile delle citazioni e della bibliografia |
| document | documento | |
| the manuscript | il manoscritto | come lo chiamano gli editori |
| the preview | l'anteprima | |
| export | esportare, esportazione | |
| bring in | portare dentro | un documento si porta dentro e diventa una mappa; i riferimenti da Zotero si *importano* |
| bring back | riportare, riportare indietro | dal cestino, dalla cronologia |

## Riferimenti e citazioni

| inglese | italiano | note |
| --- | --- | --- |
| the library | la biblioteca | non «libreria», che è il negozio |
| reference | riferimento | un'opera della biblioteca |
| work | opera | |
| collection | raccolta | |
| attachment | allegato | |
| note | nota | la nota scritta su un riferimento |
| citation | citazione | |
| locator | luogo | «il luogo citato»: pagina, capitolo, verso |
| lookup, look up | ricerca in rete, cercare in rete | DOI, ISBN o parole del titolo |
| found citations | citazioni trovate | riconosciute in un testo portato dentro |
| match | abbinare, abbinamento | una citazione trovata a un riferimento |

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
| fold, fold away | ripiegare | e «aprire» per il contrario |
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

## Nomi che non si traducono

Glaukopis; Pandoc, Typst, Tesseract, Hunspell, LaTeX, LuaLaTeX, BibLaTeX,
Zotero, CSL, Markdown; i formati di file (DOCX, ODT, PDF, EPUB, RTF, HTML,
SVG, PNG); i nomi dei font; gli stili (APA, Chicago, MLA); DOI, ISBN, ISSN,
arXiv, URL.
