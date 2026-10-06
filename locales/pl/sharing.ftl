# Sharing a project through a server, and joining one that is shared.

## Before the project is shared

sharing-share-title = Udostępnij ten projekt
sharing-lead = Inni mogą wtedy pracować nad projektem razem z tobą, w tym samym czasie, przez serwer. Projekt pozostaje też na twoim komputerze i można nad nim pracować bez serwera.
sharing-server = Serwer
sharing-unreachable = Nie można połączyć się z serwerem.
sharing-unencrypted = To, co wysyłane do tego serwera, nie jest po drodze szyfrowane. Używaj go w sieci, której ufasz.
sharing-password = Hasło serwera
sharing-password-hint = Wymagane od tych, którzy przez niego udostępniają projekty. Zaproszeni go nie potrzebują.
sharing-your-name = Twoje imię i nazwisko
sharing-your-name-hint = Pokazywane tym, którym udostępniasz projekt.
sharing-your-name-placeholder = Tak, jak znają cię inni
sharing-share = Udostępnij
sharing-sharing = Udostępnianie…
sharing-share-failed = Nie udało się udostępnić projektu.

## While it is shared

sharing-shared-title = Udostępniony projekt
# Under the title: the server the project is shared through.
sharing-through = Przez { $server }
sharing-connected = Połączono. To, co napisane, jest od razu u innych.
sharing-connecting = Łączenie…
sharing-offline = Nie można połączyć się z serwerem. To, co piszesz, jest zachowywane tutaj i zostanie przesłane, gdy będzie można.
sharing-too-large = Serwer nie przyjmuje ostatnich zmian: z nimi projekt byłby większy, niż serwer przechowuje. Są zachowane tutaj. Kto prowadzi serwer, może pozwolić na większe projekty.
sharing-your-name-seen = Tak widzą cię inni.

## Invitations

sharing-invite = Zaproś
sharing-code-label = Kod zaproszenia
sharing-copy = Kopiuj zaproszenie
sharing-copied-button = Skopiowano
# "join" is the name of the button that joins a shared project, in italics;
# "expires" says for whom and how long the code is good: sharing-for-one and those below it.
sharing-invite-hint = Wyślij go zapraszanej osobie, która wybiera { $join } i wpisuje serwer oraz kod. Jest { $expires }.
sharing-make-code = Zrób kod zaproszenia
sharing-make-another = Zrób kolejny kod
sharing-options = Opcje
sharing-fewer-options = Mniej opcji
sharing-for = Dla
sharing-one-person = Jednej osoby
sharing-several-people = Kilku osób
sharing-good-for = Ważny przez
sharing-a-day = Dzień
sharing-a-week = Tydzień
sharing-a-month = Miesiąc
sharing-until-withdrawn = Do wycofania
sharing-withdraw = Wycofaj
# What is said of a code that was made before, in a list with a dot between:
# "made yesterday · for one person · 6 days left · used once". $when: as `ago` writes it.
sharing-made = zrobiony { $when }
sharing-codes-once = Kod jest pokazywany raz, gdy powstaje: serwer nie przechowuje z niego więcej, niż potrzebuje, by go rozpoznać. By wysłać kod ponownie, zrób nowy.
sharing-for-several = dla kilku osób
sharing-for-one = dla jednej osoby
sharing-for-more = { $count ->
    [one] jeszcze dla { $count } osoby
    [few] jeszcze dla { $count } osób
    [many] jeszcze dla { $count } osób
   *[other] jeszcze dla { $count } osób
}
sharing-hours-left = jeszcze { $count } godz.
sharing-days-left = { $count ->
    [one] jeszcze { $count } dzień
    [few] jeszcze { $count } dni
    [many] jeszcze { $count } dni
   *[other] jeszcze { $count } dni
}
sharing-used = { $count ->
    [one] użyty raz
    [few] użyty { $count } razy
    [many] użyty { $count } razy
   *[other] użyty { $count } razy
}
# The invitation that is copied, to be sent to the one invited: three lines,
# of which this is the first. "join" is the name of the button that joins a shared project.
sharing-invitation = Dołącz do „{ $project }” w Glaukopis: wybierz „{ $join }” i wpisz
sharing-invitation-server = Serwer: { $server }
sharing-invitation-code = Kod: { $code }
sharing-copied = Zaproszenie skopiowano
sharing-copied-detail = Wklej je do wiadomości do zapraszanej osoby.
sharing-invite-failed = Nie udało się zrobić zaproszenia
sharing-copy-failed = Nie udało się skopiować zaproszenia
sharing-withdraw-failed = Nie udało się wycofać zaproszenia

## Who has the project

sharing-who = Kto ma projekt
sharing-list-unreachable = Lista jest na serwerze, z którym nie można się połączyć.
# The owner, when it is not you; only the first letter is shown, in a circle.
sharing-owner = Właściciel
sharing-the-owner = Ten, kto go udostępnia
sharing-you = { $name } (ty)
sharing-here = Teraz tutaj
sharing-not-here = Teraz nie ma
# "ago" is how long ago it was: "3 hours ago", "yesterday".
sharing-last-here = Ostatnio tutaj { $ago }
sharing-remove-member = Usuń { $name }
sharing-none-joined = Nikt jeszcze nie dołączył.
sharing-remove-title = Usunąć { $name }?
sharing-remove-message = { $name } zachowuje projekt w obecnym stanie i nie dostaje już tego, co zostanie napisane potem.
sharing-remove-failed = Nie udało się usunąć: { $name }
# What the others see you called, when you have not given a name.
sharing-name-owner = Właściciel
sharing-name-member = Współpracownik
# The others who have the project open, shown by their initials.
sharing-present = Teraz tutaj: { $names }
sharing-is-here = { $name } jest tutaj

## Ending the sharing

sharing-stop = Przestań udostępniać
sharing-stop-title = Przestać udostępniać ten projekt?
sharing-stop-message = Projekt jest zdejmowany z serwera. Ty i wszyscy, którym go udostępniono, zachowujecie go w obecnym stanie, każdy u siebie.
sharing-stopped = Projekt nie jest już udostępniony
sharing-leave = Opuść
sharing-leave-project = Opuść projekt
sharing-leave-title = Opuścić ten projekt?
sharing-leave-message = Zachowujesz projekt w obecnym stanie. Nie dostajesz już tego, co piszą inni, ani oni tego, co piszesz ty.
sharing-left = Opuszczono projekt
sharing-untold-title = Nie udało się powiadomić serwera
# "error" is what went wrong, as it was told.
sharing-untold-message = { $error } Mimo to można zakończyć udostępnianie na tym komputerze; projekt pozostaje wtedy na serwerze, aż da się go powiadomić.
sharing-end-here = Zakończ tutaj
sharing-keep = Udostępniaj dalej
sharing-end-failed = Nie udało się zakończyć udostępniania

## Joining a shared project

sharing-join-title = Dołącz do udostępnionego projektu
sharing-join-about = Z serwerem i kodem, które ci przysłano
sharing-code = Kod
sharing-your-name-join-hint = Pokazywane innym w projekcie.
sharing-join = Dołącz
sharing-joining = Dołączanie…
sharing-failed = To się nie udało.
