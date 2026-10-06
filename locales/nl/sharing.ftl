# Sharing a project through a server, and joining one that is shared.

## Before the project is shared

sharing-share-title = Dit project delen
sharing-lead = Anderen kunnen dan samen met jou aan het project werken, tegelijk, via een server. Het blijft ook op je computer staan, en er kan zonder de server aan worden gewerkt.
sharing-server = Server
sharing-unreachable = De server kon niet worden bereikt.
sharing-unencrypted = Wat naar deze server wordt gestuurd, is onderweg niet versleuteld. Gebruik hem op een netwerk dat je vertrouwt.
sharing-password = Wachtwoord van de server
sharing-password-hint = Gevraagd aan wie er projecten via deelt. Wie je uitnodigt, heeft er geen nodig.
sharing-your-name = Je naam
sharing-your-name-hint = Getoond aan degenen met wie je het project deelt.
sharing-your-name-placeholder = Zoals de anderen je kennen
sharing-share = Delen
sharing-sharing = Delen…
sharing-share-failed = Het project kon niet worden gedeeld.

## While it is shared

sharing-shared-title = Gedeeld project
# Under the title: the server the project is shared through.
sharing-through = Via { $server }
sharing-connected = Verbonden. Wat wordt geschreven, is meteen bij de anderen.
sharing-connecting = Verbinden…
sharing-offline = De server kan niet worden bereikt. Wat je schrijft, wordt hier bewaard en meegenomen zodra het kan.
sharing-too-large = De server neemt de laatste wijzigingen niet aan: daarmee zou het project groter zijn dan hij bewaart. Ze worden hier bewaard. Wie de server beheert, kan projecten groter laten zijn.
sharing-your-name-seen = Zoals de anderen je zien.

## Invitations

sharing-invite = Uitnodigen
sharing-code-label = Uitnodigingscode
sharing-copy = Uitnodiging kopiëren
sharing-copied-button = Gekopieerd
# "join" is the name of the button that joins a shared project, in italics;
# "expires" says for whom and how long the code is good: sharing-for-one and those below it.
sharing-invite-hint = Stuur hem naar degene die je uitnodigt, die { $join } kiest en de server en de code invult. Hij geldt { $expires }.
sharing-make-code = Een uitnodigingscode maken
sharing-make-another = Nog een code maken
sharing-options = Opties
sharing-fewer-options = Minder opties
sharing-for = Voor
sharing-one-person = Eén persoon
sharing-several-people = Meerdere personen
sharing-good-for = Geldig
sharing-a-day = Een dag
sharing-a-week = Een week
sharing-a-month = Een maand
sharing-until-withdrawn = Tot hij wordt ingetrokken
sharing-withdraw = Intrekken
# What is said of a code that was made before, in a list with a dot between:
# "made yesterday · for one person · 6 days left · used once". $when: as `ago` writes it.
sharing-made = gemaakt { $when }
sharing-codes-once = Een code wordt eenmaal getoond, wanneer hij wordt gemaakt: de server bewaart er niet meer van dan nodig is om hem te herkennen. Maak een nieuwe om er weer een te sturen.
sharing-for-several = voor meerdere personen
sharing-for-one = voor één persoon
sharing-for-more = voor nog { $count }
sharing-hours-left = nog { $count } u
sharing-days-left = { $count ->
    [one] nog { $count } dag
   *[other] nog { $count } dagen
}
sharing-used = { $count ->
    [one] eenmaal gebruikt
   *[other] { $count } keer gebruikt
}
# The invitation that is copied, to be sent to the one invited: three lines,
# of which this is the first. "join" is the name of the button that joins a shared project.
sharing-invitation = Neem deel aan ‘{ $project }’ in Glaukopis: kies ‘{ $join }’ en vul in
sharing-invitation-server = Server: { $server }
sharing-invitation-code = Code: { $code }
sharing-copied = De uitnodiging is gekopieerd
sharing-copied-detail = Plak haar in een bericht aan degene die je uitnodigt.
sharing-invite-failed = De uitnodiging kon niet worden gemaakt
sharing-copy-failed = De uitnodiging kon niet worden gekopieerd
sharing-withdraw-failed = De uitnodiging kon niet worden ingetrokken

## Who has the project

sharing-who = Wie het project heeft
sharing-list-unreachable = De lijst staat bij de server, die niet kan worden bereikt.
# The owner, when it is not you; only the first letter is shown, in a circle.
sharing-owner = Eigenaar
sharing-the-owner = Degene die het deelt
sharing-you = { $name } (jij)
sharing-here = Nu hier
sharing-not-here = Nu niet hier
# "ago" is how long ago it was: "3 hours ago", "yesterday".
sharing-last-here = Laatst hier { $ago }
sharing-remove-member = { $name } verwijderen
sharing-none-joined = Nog niemand heeft deelgenomen.
sharing-remove-title = { $name } verwijderen?
sharing-remove-message = { $name } houdt het project zoals het nu is, en krijgt niet meer wat hierna wordt geschreven.
sharing-remove-failed = { $name } kon niet worden verwijderd
# What the others see you called, when you have not given a name.
sharing-name-owner = De eigenaar
sharing-name-member = Een medewerker
# The others who have the project open, shown by their initials.
sharing-present = Nu hier: { $names }
sharing-is-here = { $name } is hier

## Ending the sharing

sharing-stop = Stoppen met delen
sharing-stop-title = Stoppen met dit project te delen?
sharing-stop-message = Het project wordt van de server gehaald. Jij en iedereen met wie je het hebt gedeeld, houden het zoals het nu is, ieder voor zich.
sharing-stopped = Het project wordt niet meer gedeeld
sharing-leave = Verlaten
sharing-leave-project = Het project verlaten
sharing-leave-title = Dit project verlaten?
sharing-leave-message = Je houdt het project zoals het nu is. Je krijgt niet meer wat de anderen schrijven, en zij niet wat jij schrijft.
sharing-left = Je hebt het project verlaten
sharing-untold-title = De server kon niet worden ingelicht
# "error" is what went wrong, as it was told.
sharing-untold-message = { $error } Je kunt het delen op deze computer toch beëindigen; het project blijft dan op de server staan tot die kan worden ingelicht.
sharing-end-here = Hier beëindigen
sharing-keep = Blijven delen
sharing-end-failed = Het delen kon niet worden beëindigd

## Joining a shared project

sharing-join-title = Deelnemen aan een gedeeld project
sharing-join-about = Met de server en de code die je zijn gestuurd
sharing-code = Code
sharing-your-name-join-hint = Getoond aan de anderen in het project.
sharing-join = Deelnemen
sharing-joining = Deelnemen…
sharing-failed = Dat is niet gelukt.
