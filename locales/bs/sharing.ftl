# Sharing a project through a server, and joining one that is shared.

## Before the project is shared

sharing-share-title = Dijeli ovaj projekat
sharing-lead = Drugi onda mogu raditi na projektu s vama, istovremeno, preko servera. Ostaje i na vašem računaru, i na njemu se može raditi bez servera.
sharing-server = Server
sharing-unreachable = Server nije dostupan.
sharing-unencrypted = Ono što se šalje ovom serveru nije šifrirano na putu. Koristite ga na mreži kojoj vjerujete.
sharing-password = Lozinka servera
sharing-password-hint = Traži se od onih koji preko njega dijele projekte. Onima koje pozovete ne treba.
sharing-your-name = Vaše ime
sharing-your-name-hint = Prikazuje se onima s kojima dijelite projekat.
sharing-your-name-placeholder = Kako vas drugi znaju
sharing-share = Dijeli
sharing-sharing = Dijeljenje…
sharing-share-failed = Projekat nije bilo moguće dijeliti.

## While it is shared

sharing-shared-title = Dijeljeni projekat
# Under the title: the server the project is shared through.
sharing-through = Preko { $server }
sharing-connected = Povezano. Napisano je odmah kod drugih.
sharing-connecting = Povezivanje…
sharing-offline = Server nije dostupan. Ono što napišete čuva se ovdje i prenosi se kad bude moguće.
sharing-too-large = Server ne prima posljednje izmjene: s njima bi projekat bio veći nego što server čuva. Čuvaju se ovdje. Ko vodi server može dopustiti veće projekte.
sharing-your-name-seen = Kako vas drugi vide.

## Invitations

sharing-invite = Pozovi
sharing-code-label = Pozivni kod
sharing-copy = Kopiraj pozivnicu
sharing-copied-button = Kopirano
# "join" is the name of the button that joins a shared project, in italics;
# "expires" says for whom and how long the code is good: sharing-for-one and those below it.
sharing-invite-hint = Pošaljite ga onome koga pozivate, ko odabere { $join } i unese server i kod. Vrijedi { $expires }.
sharing-make-code = Napravi pozivni kod
sharing-make-another = Napravi još jedan kod
sharing-options = Opcije
sharing-fewer-options = Manje opcija
sharing-for = Za
sharing-one-person = Jednu osobu
sharing-several-people = Više osoba
sharing-good-for = Vrijedi
sharing-a-day = Dan
sharing-a-week = Sedmicu
sharing-a-month = Mjesec
sharing-until-withdrawn = Do povlačenja
sharing-withdraw = Povuci
# What is said of a code that was made before, in a list with a dot between:
# "made yesterday · for one person · 6 days left · used once". $when: as `ago` writes it.
sharing-made = napravljen { $when }
sharing-codes-once = Kod se prikazuje jednom, kad se napravi: server o njemu ne čuva više nego što mu treba da ga prepozna. Da ponovo pošaljete, napravite novi.
sharing-for-several = za više osoba
sharing-for-one = za jednu osobu
sharing-for-more = za još { $count }
sharing-hours-left = još { $count } h
sharing-days-left = { $count ->
    [one] još { $count } dan
    [few] još { $count } dana
   *[other] još { $count } dana
}
sharing-used = { $count ->
    [one] upotrijebljen jednom
    [few] upotrijebljen { $count } puta
   *[other] upotrijebljen { $count } puta
}
# The invitation that is copied, to be sent to the one invited: three lines,
# of which this is the first. "join" is the name of the button that joins a shared project.
sharing-invitation = Pridružite se projektu „{ $project }“ u Glaukopisu: odaberite „{ $join }“ i unesite
sharing-invitation-server = Server: { $server }
sharing-invitation-code = Kod: { $code }
sharing-copied = Pozivnica je kopirana
sharing-copied-detail = Zalijepite je u poruku onome koga pozivate.
sharing-invite-failed = Pozivnicu nije bilo moguće napraviti
sharing-copy-failed = Pozivnicu nije bilo moguće kopirati
sharing-withdraw-failed = Pozivnicu nije bilo moguće povući

## Who has the project

sharing-who = Ko ima projekat
sharing-list-unreachable = Spisak je na serveru, koji nije dostupan.
# The owner, when it is not you; only the first letter is shown, in a circle.
sharing-owner = Vlasnik
sharing-the-owner = Onaj ko ga dijeli
sharing-you = { $name } (vi)
sharing-here = Sada ovdje
sharing-not-here = Sada nije ovdje
# "ago" is how long ago it was: "3 hours ago", "yesterday".
sharing-last-here = Posljednji put ovdje { $ago }
sharing-remove-member = Ukloni { $name }
sharing-none-joined = Još se niko nije pridružio.
sharing-remove-title = Ukloniti { $name }?
sharing-remove-message = { $name } zadržava projekat kakav je sada i više ne dobija ono što se poslije ovoga napiše.
sharing-remove-failed = { $name } nije bilo moguće ukloniti
# What the others see you called, when you have not given a name.
sharing-name-owner = Vlasnik
sharing-name-member = Saradnik
# The others who have the project open, shown by their initials.
sharing-present = Sada ovdje: { $names }
sharing-is-here = { $name } je ovdje

## Ending the sharing

sharing-stop = Prestani dijeliti
sharing-stop-title = Prestati dijeliti ovaj projekat?
sharing-stop-message = Projekat se skida sa servera. Vi i svi s kojima ste ga dijelili zadržavate ga kakav je sada, svako za sebe.
sharing-stopped = Projekat se više ne dijeli
sharing-leave = Napusti
sharing-leave-project = Napusti projekat
sharing-leave-title = Napustiti ovaj projekat?
sharing-leave-message = Zadržavate projekat kakav je sada. Više ne dobijate ono što drugi pišu, ni oni ono što vi pišete.
sharing-left = Napustili ste projekat
sharing-untold-title = Server nije bilo moguće obavijestiti
# "error" is what went wrong, as it was told.
sharing-untold-message = { $error } Dijeljenje svejedno možete okončati na ovom računaru; projekat onda ostaje na serveru dok ga ne bude moguće obavijestiti.
sharing-end-here = Okončaj ovdje
sharing-keep = Nastavi dijeliti
sharing-end-failed = Dijeljenje nije bilo moguće okončati

## Joining a shared project

sharing-join-title = Pridruži se dijeljenom projektu
sharing-join-about = Sa serverom i kodom koji su vam poslani
sharing-code = Kod
sharing-your-name-join-hint = Prikazuje se drugima u projektu.
sharing-join = Pridruži se
sharing-joining = Pridruživanje…
sharing-failed = To nije uspjelo.
