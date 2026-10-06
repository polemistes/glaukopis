# Sharing a project through a server, and joining one that is shared.

## Before the project is shared

sharing-share-title = Condividi questo progetto
sharing-lead = Altri potranno allora lavorare al progetto con te, nello stesso momento, attraverso un server. Resta anche sul tuo computer, e ci si può lavorare senza il server.
sharing-server = Server
sharing-unreachable = Il server non è raggiungibile.
sharing-unencrypted = Ciò che si manda a questo server non è cifrato lungo la strada. Usalo su una rete di cui ti fidi.
sharing-password = Password del server
sharing-password-hint = Chiesta a chi condivide progetti attraverso di esso. A chi inviti non serve.
sharing-your-name = Il tuo nome
sharing-your-name-hint = Mostrato a quelli con cui condividi il progetto.
sharing-your-name-placeholder = Come ti conoscono gli altri
sharing-share = Condividi
sharing-sharing = Condivisione…
sharing-share-failed = Il progetto non si è potuto condividere.

## While it is shared

sharing-shared-title = Progetto condiviso
# Under the title: the server the project is shared through.
sharing-through = Attraverso { $server }
sharing-connected = Connesso. Ciò che si scrive è subito presso gli altri.
sharing-connecting = Connessione…
sharing-offline = Il server non è raggiungibile. Ciò che scrivi è tenuto qui, e portato agli altri quando si potrà.
sharing-too-large = Il server non accetta le ultime modifiche: con esse il progetto sarebbe più grande di quanto ne tiene. Sono tenute qui. Chi gestisce il server può permettere progetti più grandi.
sharing-your-name-seen = Come ti vedono gli altri.

## Invitations

sharing-invite = Invita
sharing-code-label = Codice d'invito
sharing-copy = Copia l'invito
sharing-copied-button = Copiato
# "join" is the name of the button that joins a shared project, in italics;
# "expires" says for whom and how long the code is good: sharing-for-one and those below it.
sharing-invite-hint = Mandalo a chi inviti, che sceglie { $join } e inserisce il server e il codice. È { $expires }.
sharing-make-code = Fai un codice d'invito
sharing-make-another = Fai un altro codice
sharing-options = Opzioni
sharing-fewer-options = Meno opzioni
sharing-for = Per
sharing-one-person = Una persona
sharing-several-people = Più persone
sharing-good-for = Vale per
sharing-a-day = Un giorno
sharing-a-week = Una settimana
sharing-a-month = Un mese
sharing-until-withdrawn = Finché non è ritirato
sharing-withdraw = Ritira
# What is said of a code that was made before, in a list with a dot between:
# "made yesterday · for one person · 6 days left · used once". $when: as `ago` writes it.
sharing-made = fatto { $when }
sharing-codes-once = Un codice si mostra una volta, quando è fatto: il server non ne tiene più di quanto gli serva per riconoscerlo. Per mandarne uno di nuovo, fanne uno nuovo.
sharing-for-several = per più persone
sharing-for-one = per una persona
sharing-for-more = per altri { $count }
sharing-hours-left = { $count } h rimaste
sharing-days-left = { $count ->
    [one] { $count } giorno rimasto
    [many] { $count } giorni rimasti
   *[other] { $count } giorni rimasti
}
sharing-used = { $count ->
    [one] usato una volta
    [many] usato { $count } volte
   *[other] usato { $count } volte
}
# The invitation that is copied, to be sent to the one invited: three lines,
# of which this is the first. "join" is the name of the button that joins a shared project.
sharing-invitation = Entra in «{ $project }» in Glaukopis: scegli «{ $join }» e inserisci
sharing-invitation-server = Server: { $server }
sharing-invitation-code = Codice: { $code }
sharing-copied = L'invito è stato copiato
sharing-copied-detail = Incollalo in un messaggio a chi inviti.
sharing-invite-failed = L'invito non si è potuto fare
sharing-copy-failed = L'invito non si è potuto copiare
sharing-withdraw-failed = L'invito non si è potuto ritirare

## Who has the project

sharing-who = Chi ha il progetto
sharing-list-unreachable = L'elenco è presso il server, che non è raggiungibile.
# The owner, when it is not you; only the first letter is shown, in a circle.
sharing-owner = Proprietario
sharing-the-owner = Chi lo condivide
sharing-you = { $name } (tu)
sharing-here = Qui ora
sharing-not-here = Non qui ora
# "ago" is how long ago it was: "3 hours ago", "yesterday".
sharing-last-here = Qui l'ultima volta { $ago }
sharing-remove-member = Togli { $name }
sharing-none-joined = Nessuno è ancora entrato.
sharing-remove-title = Togliere { $name }?
sharing-remove-message = { $name } tiene il progetto com'è ora, e non riceve più ciò che si scrive d'ora in poi.
sharing-remove-failed = { $name } non si è potuto togliere
# What the others see you called, when you have not given a name.
sharing-name-owner = Il proprietario
sharing-name-member = Un collaboratore
# The others who have the project open, shown by their initials.
sharing-present = Qui ora: { $names }
sharing-is-here = { $name } è qui

## Ending the sharing

sharing-stop = Smetti di condividere
sharing-stop-title = Smettere di condividere questo progetto?
sharing-stop-message = Il progetto è tolto dal server. Tu e tutti quelli con cui l'hai condiviso lo tenete com'è ora, ciascuno per conto suo.
sharing-stopped = Il progetto non è più condiviso
sharing-leave = Esci
sharing-leave-project = Esci dal progetto
sharing-leave-title = Uscire da questo progetto?
sharing-leave-message = Tieni il progetto com'è ora. Non ricevi più ciò che scrivono gli altri, né loro ciò che scrivi tu.
sharing-left = Hai lasciato il progetto
sharing-untold-title = Non si è potuto avvisare il server
# "error" is what went wrong, as it was told.
sharing-untold-message = { $error } Puoi comunque terminare la condivisione su questo computer; il progetto resta allora sul server finché non lo si potrà avvisare.
sharing-end-here = Terminala qui
sharing-keep = Continua a condividere
sharing-end-failed = La condivisione non si è potuta terminare

## Joining a shared project

sharing-join-title = Entra in un progetto condiviso
sharing-join-about = Con il server e il codice che ti sono stati mandati
sharing-code = Codice
sharing-your-name-join-hint = Mostrato agli altri nel progetto.
sharing-join = Entra
sharing-joining = Ingresso…
sharing-failed = Non ha funzionato.
