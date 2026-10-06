# Sharing a project through a server, and joining one that is shared.

## Before the project is shared

sharing-share-title = Dijeli ovaj projekt
sharing-lead = Drugi tada mogu raditi na projektu s vama, istodobno, preko poslužitelja. Ostaje i na vašem računalu, i na njemu se može raditi bez poslužitelja.
sharing-server = Poslužitelj
sharing-unreachable = Poslužitelj nije dostupan.
sharing-unencrypted = Što se šalje ovom poslužitelju nije šifrirano na putu. Koristite ga na mreži kojoj vjerujete.
sharing-password = Lozinka poslužitelja
sharing-password-hint = Traži se od onih koji preko njega dijele projekte. Onima koje pozovete ne treba.
sharing-your-name = Vaše ime
sharing-your-name-hint = Prikazuje se onima s kojima dijelite projekt.
sharing-your-name-placeholder = Kako vas drugi znaju
sharing-share = Dijeli
sharing-sharing = Dijeljenje…
sharing-share-failed = Projekt nije bilo moguće podijeliti.

## While it is shared

sharing-shared-title = Dijeljeni projekt
# Under the title: the server the project is shared through.
sharing-through = Preko { $server }
sharing-connected = Povezano. Što se napiše, odmah je kod drugih.
sharing-connecting = Povezivanje…
sharing-offline = Poslužitelj nije dostupan. Što pišete čuva se ovdje i prenosi kad bude moguće.
sharing-too-large = Poslužitelj ne prima najnovije izmjene: s njima bi projekt bio veći nego što čuva. Čuvaju se ovdje. Tko vodi poslužitelj, može dopustiti veće projekte.
sharing-your-name-seen = Kako vas drugi vide.

## Invitations

sharing-invite = Pozovi
sharing-code-label = Kod pozivnice
sharing-copy = Kopiraj pozivnicu
sharing-copied-button = Kopirano
# "join" is the name of the button that joins a shared project, in italics;
# "expires" says for whom and how long the code is good: sharing-for-one and those below it.
sharing-invite-hint = Pošaljite ga onome koga pozivate, koji odabire { $join } i upisuje poslužitelj i kod. Vrijedi { $expires }.
sharing-make-code = Načini kod pozivnice
sharing-make-another = Načini drugi kod
sharing-options = Mogućnosti
sharing-fewer-options = Manje mogućnosti
sharing-for = Za
sharing-one-person = Jednu osobu
sharing-several-people = Više osoba
sharing-good-for = Vrijedi
sharing-a-day = Dan
sharing-a-week = Tjedan
sharing-a-month = Mjesec
sharing-until-withdrawn = Dok se ne povuče
sharing-withdraw = Povuci
# What is said of a code that was made before, in a list with a dot between:
# "made yesterday · for one person · 6 days left · used once". $when: as `ago` writes it.
sharing-made = načinjen { $when }
sharing-codes-once = Kod se prikazuje jednom, kad se načini: poslužitelj od njega čuva samo onoliko koliko mu treba da ga ponovno prepozna. Da ga ponovno pošaljete, načinite novi.
sharing-for-several = za više osoba
sharing-for-one = za jednu osobu
sharing-for-more = { $count ->
    [one] za još { $count } osobu
    [few] za još { $count } osobe
   *[other] za još { $count } osoba
}
sharing-hours-left = još { $count } h
sharing-days-left = { $count ->
    [one] još { $count } dan
    [few] još { $count } dana
   *[other] još { $count } dana
}
sharing-used = { $count ->
    [1] iskorišten jednom
    [one] iskorišten { $count } put
    [few] iskorišten { $count } puta
   *[other] iskorišten { $count } puta
}
# The invitation that is copied, to be sent to the one invited: three lines,
# of which this is the first. "join" is the name of the button that joins a shared project.
sharing-invitation = Pridružite se projektu „{ $project }” u Glaukopisu: odaberite „{ $join }” i upišite
sharing-invitation-server = Poslužitelj: { $server }
sharing-invitation-code = Kod: { $code }
sharing-copied = Pozivnica je kopirana
sharing-copied-detail = Zalijepite je u poruku onome koga pozivate.
sharing-invite-failed = Pozivnicu nije bilo moguće načiniti
sharing-copy-failed = Pozivnicu nije bilo moguće kopirati
sharing-withdraw-failed = Pozivnicu nije bilo moguće povući

## Who has the project

sharing-who = Tko ima projekt
sharing-list-unreachable = Popis je na poslužitelju, koji nije dostupan.
# The owner, when it is not you; only the first letter is shown, in a circle.
sharing-owner = Vlasnik
sharing-the-owner = Onaj tko ga dijeli
sharing-you = { $name } (vi)
sharing-here = Sad je ovdje
sharing-not-here = Sad nije ovdje
# "ago" is how long ago it was: "3 hours ago", "yesterday".
sharing-last-here = Zadnji put ovdje { $ago }
sharing-remove-member = Ukloni { $name }
sharing-none-joined = Još se nitko nije pridružio.
sharing-remove-title = Ukloniti { $name }?
sharing-remove-message = { $name } zadržava projekt kakav je sada, a više ne dobiva ono što se napiše nakon ovoga.
sharing-remove-failed = { $name } nije bilo moguće ukloniti
# What the others see you called, when you have not given a name.
sharing-name-owner = Vlasnik
sharing-name-member = Suradnik
# The others who have the project open, shown by their initials.
sharing-present = Sad ovdje: { $names }
sharing-is-here = { $name } je ovdje

## Ending the sharing

sharing-stop = Prestani dijeliti
sharing-stop-title = Prestati dijeliti ovaj projekt?
sharing-stop-message = Projekt se miče s poslužitelja. Vi i svi s kojima ste ga dijelili zadržavate ga kakav je sada, svatko za sebe.
sharing-stopped = Projekt više nije dijeljen
sharing-leave = Napusti
sharing-leave-project = Napusti projekt
sharing-leave-title = Napustiti ovaj projekt?
sharing-leave-message = Projekt vam ostaje kakav je sada. Više ne dobivate što drugi pišu, ni oni što pišete vi.
sharing-left = Napustili ste projekt
sharing-untold-title = Poslužitelju nije bilo moguće javiti
# "error" is what went wrong, as it was told.
sharing-untold-message = { $error } Dijeljenje svejedno možete završiti na ovom računalu; projekt tada ostaje na poslužitelju dok mu se ne bude moglo javiti.
sharing-end-here = Završi ovdje
sharing-keep = Nastavi dijeliti
sharing-end-failed = Dijeljenje nije bilo moguće završiti

## Joining a shared project

sharing-join-title = Pridruži se dijeljenom projektu
sharing-join-about = S poslužiteljem i kodom koji ste dobili
sharing-code = Kod
sharing-your-name-join-hint = Prikazuje se drugima u projektu.
sharing-join = Pridruži se
sharing-joining = Pridruživanje…
sharing-failed = To nije uspjelo.
