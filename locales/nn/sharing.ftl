# Sharing a project through a server, and joining one that is shared.

## Before the project is shared

sharing-share-title = Del dette prosjektet
sharing-lead = Andre kan då arbeide med prosjektet saman med deg, samtidig, gjennom ein tenar. Det blir liggjande på datamaskina di òg, og kan arbeidast med utan tenaren.
sharing-server = Tenar
sharing-unreachable = Tenaren kunne ikkje nåast.
sharing-unencrypted = Det som blir sendt til denne tenaren, blir ikkje kryptert undervegs. Bruk den på eit nettverk du stolar på.
sharing-password = Passordet til tenaren
sharing-password-hint = Blir kravd av dei som deler prosjekt gjennom den. Dei du inviterer, treng ikkje noko.
sharing-your-name = Namnet ditt
sharing-your-name-hint = Blir vist for dei du deler prosjektet med.
sharing-your-name-placeholder = Slik dei andre kjenner deg
sharing-share = Del
sharing-sharing = Deler …
sharing-share-failed = Prosjektet kunne ikkje delast.

## While it is shared

sharing-shared-title = Delt prosjekt
# Under the title: the server the project is shared through.
sharing-through = Gjennom { $server }
sharing-connected = Tilkopla. Det som blir skrive, kjem til dei andre med ein gong.
sharing-connecting = Koplar til …
sharing-offline = Tenaren kan ikkje nåast. Det du skriv, blir teke vare på her og sendt med når det lèt seg gjere.
sharing-too-large = Tenaren tek ikkje imot dei siste endringane: med dei ville prosjektet bli større enn den tek vare på. Dei blir tekne vare på her. Den som driv tenaren, kan la prosjekt bli større.
sharing-your-name-seen = Slik dei andre ser deg.

## Invitations

sharing-invite = Inviter
sharing-code-label = Invitasjonskode
sharing-copy = Kopier invitasjonen
sharing-copied-button = Kopiert
# "join" is the name of the button that joins a shared project, in italics;
# "expires" says for whom and how long the code is good: sharing-for-one and those below it.
sharing-invite-hint = Send den til den du inviterer, som vel { $join } og skriv inn tenaren og koden. Den gjeld { $expires }.
sharing-make-code = Lag ein invitasjonskode
sharing-make-another = Lag ein kode til
sharing-options = Val
sharing-fewer-options = Færre val
sharing-for = For
sharing-one-person = Éin person
sharing-several-people = Fleire personar
sharing-good-for = Gjeld i
sharing-a-day = Éin dag
sharing-a-week = Éi veke
sharing-a-month = Éin månad
sharing-until-withdrawn = Til den blir trekt tilbake
sharing-withdraw = Trekk tilbake
# What is said of a code that was made before, in a list with a dot between:
# "made yesterday · for one person · 6 days left · used once". $when: as `ago` writes it.
sharing-made = laga { $when }
sharing-codes-once = Ein kode blir vist éin gong, når den blir laga: tenaren tek ikkje vare på meir av den enn den treng for å kjenne den att. For å sende ein igjen, lag ein ny.
sharing-for-several = for fleire
sharing-for-one = for éin person
sharing-for-more = for { $count } til
sharing-hours-left = { $count } t att
sharing-days-left = { $count ->
    [one] { $count } dag att
   *[other] { $count } dagar att
}
sharing-used = { $count ->
    [one] brukt éin gong
   *[other] brukt { $count } gonger
}
# The invitation that is copied, to be sent to the one invited: three lines,
# of which this is the first. "join" is the name of the button that joins a shared project.
sharing-invitation = Bli med i «{ $project }» i Glaukopis: vel «{ $join }», og skriv inn
sharing-invitation-server = Tenar: { $server }
sharing-invitation-code = Kode: { $code }
sharing-copied = Invitasjonen vart kopiert
sharing-copied-detail = Lim den inn i ei melding til den du inviterer.
sharing-invite-failed = Invitasjonen kunne ikkje lagast
sharing-copy-failed = Invitasjonen kunne ikkje kopierast
sharing-withdraw-failed = Invitasjonen kunne ikkje trekkjast tilbake

## Who has the project

sharing-who = Kven som har prosjektet
sharing-list-unreachable = Lista er på tenaren, som ikkje kan nåast.
# The owner, when it is not you; only the first letter is shown, in a circle.
sharing-owner = Eigar
sharing-the-owner = Den som deler det
sharing-you = { $name } (deg)
sharing-here = Her no
sharing-not-here = Ikkje her no
# "ago" is how long ago it was: "3 hours ago", "yesterday".
sharing-last-here = Sist her { $ago }
sharing-remove-member = Fjern { $name }
sharing-none-joined = Ingen har blitt med enno.
sharing-remove-title = Fjerne { $name }?
sharing-remove-message = { $name } held på prosjektet slik det er no, og får ikkje lenger det som blir skrive etter dette.
sharing-remove-failed = { $name } kunne ikkje fjernast
# What the others see you called, when you have not given a name.
sharing-name-owner = Eigaren
sharing-name-member = Ein medarbeidar
# The others who have the project open, shown by their initials.
sharing-present = Her no: { $names }
sharing-is-here = { $name } er her

## Ending the sharing

sharing-stop = Slutt å dele
sharing-stop-title = Slutte å dele dette prosjektet?
sharing-stop-message = Prosjektet blir teke av tenaren. Du og alle du har delt det med, held på det slik det er no, kvar for seg.
sharing-stopped = Prosjektet er ikkje lenger delt
sharing-leave = Forlat
sharing-leave-project = Forlat prosjektet
sharing-leave-title = Forlate dette prosjektet?
sharing-leave-message = Du held på prosjektet slik det er no. Du får ikkje lenger det dei andre skriv, og dei får ikkje det du skriv.
sharing-left = Du har forlate prosjektet
sharing-untold-title = Tenaren kunne ikkje få beskjed
# "error" is what went wrong, as it was told.
sharing-untold-message = { $error } Du kan likevel avslutte delinga på denne datamaskina; prosjektet blir då liggjande på tenaren til den kan få beskjed.
sharing-end-here = Avslutt her
sharing-keep = Hald fram med å dele
sharing-end-failed = Delinga kunne ikkje avsluttast

## Joining a shared project

sharing-join-title = Bli med i eit delt prosjekt
sharing-join-about = Med tenaren og koden du har fått
sharing-code = Kode
sharing-your-name-join-hint = Blir vist for dei andre i prosjektet.
sharing-join = Bli med
sharing-joining = Blir med …
sharing-failed = Det gjekk ikkje.
