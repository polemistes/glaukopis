# Sharing a project through a server, and joining one that is shared.

## Before the project is shared

sharing-share-title = Dela det här projektet
sharing-lead = Andra kan då arbeta med projektet tillsammans med dig, samtidigt, genom en server. Det finns kvar på din dator också, och kan arbetas med utan servern.
sharing-server = Server
sharing-unreachable = Servern kunde inte nås.
sharing-unencrypted = Det som skickas till den här servern krypteras inte på vägen. Använd den på ett nätverk du litar på.
sharing-password = Serverns lösenord
sharing-password-hint = Begärs av dem som delar projekt genom den. De du bjuder in behöver inget.
sharing-your-name = Ditt namn
sharing-your-name-hint = Visas för dem du delar projektet med.
sharing-your-name-placeholder = Som de andra känner dig
sharing-share = Dela
sharing-sharing = Delar…
sharing-share-failed = Projektet kunde inte delas.

## While it is shared

sharing-shared-title = Delat projekt
# Under the title: the server the project is shared through.
sharing-through = Genom { $server }
sharing-connected = Ansluten. Det som skrivs finns hos de andra genast.
sharing-connecting = Ansluter…
sharing-offline = Servern kan inte nås. Det du skriver sparas här, och tas med när det går.
sharing-too-large = Servern tar inte emot de senaste ändringarna: med dem skulle projektet bli större än vad den rymmer. De sparas här. Den som driver servern kan låta projekten vara större.
sharing-your-name-seen = Som de andra ser dig.

## Invitations

sharing-invite = Bjud in
sharing-code-label = Inbjudningskod
sharing-copy = Kopiera inbjudan
sharing-copied-button = Kopierad
# "join" is the name of the button that joins a shared project, in italics;
# "expires" says for whom and how long the code is good: sharing-for-one and those below it.
sharing-invite-hint = Skicka den till den du bjuder in, som väljer { $join } och skriver in servern och koden. Den är { $expires }.
sharing-make-code = Gör en inbjudningskod
sharing-make-another = Gör en kod till
sharing-options = Alternativ
sharing-fewer-options = Färre alternativ
sharing-for = För
sharing-one-person = En person
sharing-several-people = Flera personer
sharing-good-for = Gäller
sharing-a-day = En dag
sharing-a-week = En vecka
sharing-a-month = En månad
sharing-until-withdrawn = Tills den återkallas
sharing-withdraw = Återkalla
# What is said of a code that was made before, in a list with a dot between:
# "made yesterday · for one person · 6 days left · used once". $when: as `ago` writes it.
sharing-made = gjord { $when }
sharing-codes-once = En kod visas en gång, när den görs: servern sparar inte mer av den än den behöver för att känna igen den. För att skicka en igen, gör en ny.
sharing-for-several = för flera
sharing-for-one = för en person
sharing-for-more = för { $count } till
sharing-hours-left = { $count } tim kvar
sharing-days-left = { $count ->
    [one] { $count } dag kvar
   *[other] { $count } dagar kvar
}
sharing-used = { $count ->
    [one] använd en gång
   *[other] använd { $count } gånger
}
# The invitation that is copied, to be sent to the one invited: three lines,
# of which this is the first. "join" is the name of the button that joins a shared project.
sharing-invitation = Gå med i ”{ $project }” i Glaukopis: välj ”{ $join }” och skriv in
sharing-invitation-server = Server: { $server }
sharing-invitation-code = Kod: { $code }
sharing-copied = Inbjudan kopierades
sharing-copied-detail = Klistra in den i ett meddelande till den du bjuder in.
sharing-invite-failed = Inbjudan kunde inte göras
sharing-copy-failed = Inbjudan kunde inte kopieras
sharing-withdraw-failed = Inbjudan kunde inte återkallas

## Who has the project

sharing-who = Vem som har projektet
sharing-list-unreachable = Listan finns hos servern, som inte kan nås.
# The owner, when it is not you; only the first letter is shown, in a circle.
sharing-owner = Ägare
sharing-the-owner = Den som delar det
sharing-you = { $name } (du)
sharing-here = Här nu
sharing-not-here = Inte här nu
# "ago" is how long ago it was: "3 hours ago", "yesterday".
sharing-last-here = Senast här { $ago }
sharing-remove-member = Ta bort { $name }
sharing-none-joined = Ingen har gått med än.
sharing-remove-title = Ta bort { $name }?
sharing-remove-message = { $name } behåller projektet som det är nu, och får inte längre det som skrivs efter detta.
sharing-remove-failed = { $name } kunde inte tas bort
# What the others see you called, when you have not given a name.
sharing-name-owner = Ägaren
sharing-name-member = En medarbetare
# The others who have the project open, shown by their initials.
sharing-present = Här nu: { $names }
sharing-is-here = { $name } är här

## Ending the sharing

sharing-stop = Sluta dela
sharing-stop-title = Sluta dela det här projektet?
sharing-stop-message = Projektet tas bort från servern. Du och alla du har delat det med behåller det som det är nu, var och en för sig.
sharing-stopped = Projektet delas inte längre
sharing-leave = Lämna
sharing-leave-project = Lämna projektet
sharing-leave-title = Lämna det här projektet?
sharing-leave-message = Du behåller projektet som det är nu. Du får inte längre det de andra skriver, och de inte det du skriver.
sharing-left = Du har lämnat projektet
sharing-untold-title = Servern kunde inte underrättas
# "error" is what went wrong, as it was told.
sharing-untold-message = { $error } Du kan ändå avsluta delningen på den här datorn; projektet blir då kvar på servern tills den kan underrättas.
sharing-end-here = Avsluta här
sharing-keep = Fortsätt dela
sharing-end-failed = Delningen kunde inte avslutas

## Joining a shared project

sharing-join-title = Gå med i ett delat projekt
sharing-join-about = Med servern och koden du fick
sharing-code = Kod
sharing-your-name-join-hint = Visas för de andra i projektet.
sharing-join = Gå med
sharing-joining = Går med…
sharing-failed = Det gick inte.
