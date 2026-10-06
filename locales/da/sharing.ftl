# Sharing a project through a server, and joining one that is shared.

## Before the project is shared

sharing-share-title = Del dette projekt
sharing-lead = Andre kan så arbejde på projektet sammen med dig, på samme tid, gennem en server. Det bliver også på din computer og kan arbejdes på uden serveren.
sharing-server = Server
sharing-unreachable = Serveren kunne ikke nås.
sharing-unencrypted = Det, der sendes til denne server, krypteres ikke undervejs. Brug den på et netværk, du stoler på.
sharing-password = Serverens adgangskode
sharing-password-hint = Kræves af dem, der deler projekter gennem den. Dem, du inviterer, behøver ingen.
sharing-your-name = Dit navn
sharing-your-name-hint = Vises for dem, du deler projektet med.
sharing-your-name-placeholder = Som de andre kender dig
sharing-share = Del
sharing-sharing = Deler…
sharing-share-failed = Projektet kunne ikke deles.

## While it is shared

sharing-shared-title = Delt projekt
# Under the title: the server the project is shared through.
sharing-through = Gennem { $server }
sharing-connected = Forbundet. Det, der skrives, er straks hos de andre.
sharing-connecting = Forbinder…
sharing-offline = Serveren kan ikke nås. Det, du skriver, gemmes her og sendes med, når det kan lade sig gøre.
sharing-too-large = Serveren tager ikke imod de seneste ændringer: med dem ville projektet blive større, end den gemmer. De gemmes her. Den, der driver serveren, kan tillade større projekter.
sharing-your-name-seen = Som de andre ser dig.

## Invitations

sharing-invite = Inviter
sharing-code-label = Invitationskode
sharing-copy = Kopiér invitationen
sharing-copied-button = Kopieret
# "join" is the name of the button that joins a shared project, in italics;
# "expires" says for whom and how long the code is good: sharing-for-one and those below it.
sharing-invite-hint = Send den til den, du inviterer, som vælger { $join } og indtaster serveren og koden. Den gælder { $expires }.
sharing-make-code = Lav en invitationskode
sharing-make-another = Lav en kode til
sharing-options = Valgmuligheder
sharing-fewer-options = Færre valgmuligheder
sharing-for = Til
sharing-one-person = Én person
sharing-several-people = Flere personer
sharing-good-for = Gælder i
sharing-a-day = Et døgn
sharing-a-week = En uge
sharing-a-month = En måned
sharing-until-withdrawn = Indtil den trækkes tilbage
sharing-withdraw = Træk tilbage
# What is said of a code that was made before, in a list with a dot between:
# "made yesterday · for one person · 6 days left · used once". $when: as `ago` writes it.
sharing-made = lavet { $when }
sharing-codes-once = En kode vises én gang, når den laves: serveren gemmer ikke mere af den, end den behøver for at genkende den. Lav en ny for at sende en igen.
sharing-for-several = til flere
sharing-for-one = til én person
sharing-for-more = til { $count } mere
sharing-hours-left = { $count } t tilbage
sharing-days-left = { $count ->
    [one] { $count } dag tilbage
   *[other] { $count } dage tilbage
}
sharing-used = { $count ->
    [one] brugt én gang
   *[other] brugt { $count } gange
}
# The invitation that is copied, to be sent to the one invited: three lines,
# of which this is the first. "join" is the name of the button that joins a shared project.
sharing-invitation = Deltag i »{ $project }« i Glaukopis: vælg »{ $join }«, og indtast
sharing-invitation-server = Server: { $server }
sharing-invitation-code = Kode: { $code }
sharing-copied = Invitationen blev kopieret
sharing-copied-detail = Sæt den ind i en besked til den, du inviterer.
sharing-invite-failed = Invitationen kunne ikke laves
sharing-copy-failed = Invitationen kunne ikke kopieres
sharing-withdraw-failed = Invitationen kunne ikke trækkes tilbage

## Who has the project

sharing-who = Hvem der har projektet
sharing-list-unreachable = Listen er på serveren, som ikke kan nås.
# The owner, when it is not you; only the first letter is shown, in a circle.
sharing-owner = Ejer
sharing-the-owner = Den, der deler det
sharing-you = { $name } (dig)
sharing-here = Her nu
sharing-not-here = Ikke her nu
# "ago" is how long ago it was: "3 hours ago", "yesterday".
sharing-last-here = Sidst her { $ago }
sharing-remove-member = Fjern { $name }
sharing-none-joined = Ingen er kommet med endnu.
sharing-remove-title = Fjern { $name }?
sharing-remove-message = { $name } beholder projektet, som det er nu, og får ikke længere det, der skrives efter dette.
sharing-remove-failed = { $name } kunne ikke fjernes
# What the others see you called, when you have not given a name.
sharing-name-owner = Ejeren
sharing-name-member = En deltager
# The others who have the project open, shown by their initials.
sharing-present = Her nu: { $names }
sharing-is-here = { $name } er her

## Ending the sharing

sharing-stop = Hold op med at dele
sharing-stop-title = Hold op med at dele dette projekt?
sharing-stop-message = Projektet tages af serveren. Du og alle, du har delt det med, beholder det, som det er nu, hver for sig.
sharing-stopped = Projektet deles ikke længere
sharing-leave = Forlad
sharing-leave-project = Forlad projektet
sharing-leave-title = Forlad dette projekt?
sharing-leave-message = Du beholder projektet, som det er nu. Du får ikke længere det, de andre skriver, og de ikke det, du skriver.
sharing-left = Du har forladt projektet
sharing-untold-title = Serveren kunne ikke få besked
# "error" is what went wrong, as it was told.
sharing-untold-message = { $error } Du kan alligevel afslutte delingen på denne computer; projektet bliver så på serveren, indtil den kan få besked.
sharing-end-here = Afslut her
sharing-keep = Bliv ved med at dele
sharing-end-failed = Delingen kunne ikke afsluttes

## Joining a shared project

sharing-join-title = Deltag i et delt projekt
sharing-join-about = Med den server og den kode, du har fået
sharing-code = Kode
sharing-your-name-join-hint = Vises for de andre i projektet.
sharing-join = Deltag
sharing-joining = Deltager…
sharing-failed = Det gik ikke.
