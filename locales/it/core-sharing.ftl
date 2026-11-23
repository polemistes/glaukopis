# What the core says of sharing projects through a server, in English.
# See locales/README.md.

## The address of a server, as it was typed.

core-sharing-enter-address = Inserisci l'indirizzo del server.
core-sharing-no-spaces = L'indirizzo di un server non ha spazi.
# The scheme is what was typed before "://".
core-sharing-scheme = Un server si raggiunge con http o https, non con «{ $scheme }».
core-sharing-not-an-address = Questo non sembra l'indirizzo di un server.
core-sharing-no-server = Non c'è un server Glaukopis a { $host }. Controlla l'indirizzo con chi te l'ha dato.
core-sharing-no-answer-behind = { $host } c'è, ma il server dietro di esso non risponde
core-sharing-newer = Il server è più nuovo di questa versione di Glaukopis, che va aggiornata per usarlo.

## What the server refuses, by its kind.

core-sharing-no-room = Il progetto non è più sul server.
core-sharing-not-admitted = Il server non ammette più questa copia del progetto.
core-sharing-not-owner = Solo chi condivide il progetto può farlo.
core-sharing-bad-code = Il codice non è valido. Può essere stato scritto male, già usato, ritirato, oppure è scaduto.
core-sharing-exists = Il progetto è già sul server.
core-sharing-full = Il server contiene già tanti progetti quanti è impostato a contenerne.
core-sharing-password-asked = Questo server chiede una password a chi condivide progetti attraverso di esso.
core-sharing-password-wrong = La password non è quella che il server chiede.
core-sharing-too-many = Da qui sono stati fatti troppi tentativi. Riprova tra dieci minuti.
core-sharing-no-file = Il server non ha l'immagine.
core-sharing-server-error = { $host } ha risposto con un errore.

## What the server says in its own words, which are English, where the
## application knows them.

core-sharing-no-name = Il progetto non ha nome.
core-sharing-bad-id = L'identificativo del progetto non è uno che il server possa usare.
core-sharing-many-invitations = Ci sono già cinquanta inviti aperti; ritirane qualcuno.
core-sharing-no-collaborator = Non c'è un collaboratore così.
core-sharing-not-whole = Il file non è arrivato intero.
core-sharing-bad-file-name = Un file ha per nome lo SHA-256 di ciò che contiene: 64 caratteri, ciascuno da 0 a 9 o da a a f.
core-sharing-not-as-named = Ciò che è stato mandato non è ciò che il suo nome dice: il suo SHA-256 è un altro.
# The most is in the server's words: "25 MB".
core-sharing-file-too-large = Il file è più grande di quanto questo server accetti: un file può pesare al massimo { $most }.
core-sharing-project-full = Non c'è spazio per il file: su questo server i file di un progetto possono pesare insieme al massimo { $most }.

## What the server refuses of the synchronization of a writer's own
## devices, which it keeps together as what it calls a home.

core-sharing-no-home = Il server non tiene più ciò che questi dispositivi sincronizzano.
# The texts of a project, the notebook or the library use something this version does not know.
core-sharing-later = Qualcosa è stato scritto su un altro dispositivo con una versione più recente di Glaukopis. Aggiorna questa versione per sincronizzarlo.
core-sharing-home-not-admitted = Il server non fa più entrare questo dispositivo: può essere stato tolto da quelli sincronizzati.
core-sharing-home-full = Il server sincronizza già i dispositivi di tante persone quante è impostato a sincronizzarne.
core-sharing-many-computers = Sono già sincronizzati sedici dispositivi, che è il massimo; togline prima uno.
core-sharing-many-codes = Ci sono già cinque codici aperti; ritirane uno.
core-sharing-no-computer = Non c'è un dispositivo così fra quelli sincronizzati.
core-sharing-no-computer-name = Il dispositivo non ha nome.
core-sharing-bad-kind = Il tipo di un documento si scrive con da una a sedici lettere minuscole.
core-sharing-bad-document = L'identificativo del documento non è uno che il server possa usare.
core-sharing-many-documents = Il server tiene per questi dispositivi tanti documenti quanti ne può tenere.
core-sharing-not-an-exchange = Il server non ha potuto leggere ciò che è stato mandato.
core-sharing-unreadable-change = Una modifica mandata non si è potuta leggere.
core-sharing-document-too-large = Un progetto, il taccuino o la biblioteca sarebbe più grande di quanto questo server tenga.
# The most is in the server's words: "10 GB".
core-sharing-home-files-full = Non c'è spazio per il file: su questo server i file sincronizzati possono pesare insieme al massimo { $most }.

## The pictures of the figures, which are sent and fetched one by one.

core-sharing-picture-too-large = { $host } non accetta un'immagine grande così.
core-sharing-picture-larger = Un'immagine è più grande di quanto { $host } accetti ({ $most } MB al massimo), e non arriva agli altri.
core-sharing-picture-not-sent = Un'immagine non si è potuta mandare: { $error }.
core-sharing-picture-not-fetched = Un'immagine non si è potuta scaricare: { $error }.
# The server gave a picture whose content is not what its name says: damaged on the way or where the server keeps it.
core-sharing-picture-not-as-listed = Un'immagine data da { $host } non è quella che aveva elencato: si è danneggiata per strada o dove è tenuta.

## Publishing and joining.

core-sharing-shared-already = Il progetto è già condiviso.
core-sharing-own-code = Il codice è per «{ $name }», che è condiviso da questo computer: ce l'hai già.
