# Prosjektene: listen over dem, og det som gjøres med dem.

home-title = Prosjekter
home-join = Bli med i et delt prosjekt
home-from-document = Et prosjekt av et dokument …
home-new = Nytt prosjekt

## Sidens to former: de sist brukte prosjektene som kort, alle som en liste

home-shown = Hva som vises
home-recent = Sist brukt
home-all = Alle prosjekter
home-show-all = Vis alle { $count } prosjektene
home-page-menu = Mer
home-search = Finn et prosjekt
home-search-none = Ingen prosjekter har det navnet.
home-list-none = Det er ingen prosjekter.

## Mapper med prosjekter

home-new-folder = Ny mappe
home-folder-new-inside = Ny mappe inni …
home-folder-rename-title = Gi mappen nytt navn
home-folder-name-placeholder = Det mappen rommer
home-folder-name-missing = Gi mappen et navn.
home-folder-projects = { $count ->
    [one] { $count } prosjekt
   *[other] { $count } prosjekter
}
home-menu-move = Flytt til mappe
home-menu-out = Ut av mappene
home-folder-delete-title = Slette mappen «{ $name }»?
home-folder-delete-message = Mappene og prosjektene i den beholdes: de flyttes opp dit mappen var.
home-folder-delete-confirm = Slett mappen
home-folder-failed = Det kunne ikke gjøres med mappen
home-moved-to = «{ $name }» ble flyttet til { $folder }
home-moved-out = «{ $name }» ligger ikke i noen mappe nå
home-move-failed = Prosjektet kunne ikke flyttes

## Et kart over prosjektene

home-map-menu = Et kart over prosjektene …
home-map-title = Et kart over prosjektene
home-map-about = Et nytt prosjekt med ett kart: mappene som elementer, og under hver mappe prosjektene i den.
home-map-name-default = Prosjekter
home-map-what = Hva kartet rommer
home-map-names = Bare navnene
home-map-names-hint = Ett element for hvert prosjekt, med beskrivelsen som tekst.
home-map-everything = Med alt de rommer
home-map-everything-hint = Under hvert prosjekt kartene dets, og under hvert kart alle elementene, med navn og tekster.
home-map-note = Siteringene beholder referansene sine. En kryssreferanse til en figur eller en del peker på ingenting i det nye prosjektet, og kommentarene blir igjen.
home-map-reading = Leser «{ $name }» …
home-map-working = Lager kartet …
home-map-make = Lag kartet
home-map-failed = Kartet over prosjektene kunne ikke lages

## Når det ikke er noen ennå

home-welcome = Velkommen til Glaukopis
home-welcome-text = Et prosjekt rommer arbeidet med én bok eller artikkel: kartene over ideene dine, tekstene du skriver inn i dem, og referansene de bygger på.
home-begin = Begynn på et prosjekt

## Et prosjekt i listen

home-more-maps = og { $count } til
home-maps = { $count ->
    [one] { $count } kart
   *[other] { $count } kart
}
home-elements = { $count ->
    [one] { $count } element
   *[other] { $count } elementer
}
home-words = { $count ->
    [one] { $count } ord
   *[other] { $count } ord
}
home-references = { $count ->
    [one] { $count } referanse
   *[other] { $count } referanser
}
home-not-begun = Ikke påbegynt
home-shared = Delt
home-changed = Endret { $ago }
home-more-for = Flere valg for { $name }
home-deleted-projects = { $count ->
    [one] { $count } slettet prosjekt
   *[other] { $count } slettede prosjekter
}

## Menyen til et prosjekt

home-menu-rename = Gi nytt navn …
home-menu-duplicate = Dupliser …
home-menu-history = Tidligere versjoner …

## Å gi et prosjekt navn

home-rename-title = Gi prosjektet nytt navn
home-duplicate-title = Dupliser prosjektet
home-name = Navn
home-name-placeholder = Arbeidstittelen på boken eller artikkelen
home-name-missing = Gi prosjektet et navn.
home-create = Opprett
home-duplicate = Dupliser
home-copy-name = { $name }, kopi
home-failed = Det gikk ikke.

## Å slette et prosjekt

home-delete-title = Slette «{ $name }»?
home-delete-message = Prosjektet flyttes til papirkurven i Glaukopis, og kan hentes tilbake derfra. Referansene dine blir ikke rørt.
home-delete-owner = Prosjektet flyttes til papirkurven i Glaukopis, og kan hentes tilbake derfra. Det blir liggende på serveren og hos dem du deler det med; vil du ta det av serveren, åpner du det og slutter å dele det først.
home-delete-member = Prosjektet flyttes til papirkurven i Glaukopis, og kan hentes tilbake derfra. De andre beholder sitt.
home-delete-confirm = Slett prosjektet
home-deleted = «{ $name }» ble flyttet til papirkurven
home-delete-failed = Prosjektet kunne ikke slettes

## Papirkurven

home-trash-title = Slettede prosjekter
home-trash-none = Det er ingen.
home-deleted-ago = Slettet { $ago }
home-restore = Hent tilbake
home-restored = «{ $name }» er tilbake blant prosjektene
home-restore-failed = Prosjektet kunne ikke hentes tilbake
home-purge = Fjern for godt
home-purge-title = Fjerne «{ $name }» for godt?
home-purge-message = Det prosjektet rommer, kan ikke hentes tilbake etter dette. Referansene dine blir ikke rørt.
home-purge-failed = Prosjektet kunne ikke fjernes

## Tidligere versjoner av et prosjekt

home-history-title = Tidligere versjoner
home-history-about = Av «{ $name }». En versjon åpnes som et eget prosjekt; dette forblir som det er.
home-history-none = Ingen er tatt vare på ennå. En versjon tas vare på nå og da mens du arbeider: tett for det som er nytt, glissere for det som er eldre.
home-history-open = Åpne en kopi
home-history-copy-name = { $name }, per { $day }
home-history-unread = De tidligere versjonene kunne ikke leses
home-history-open-failed = Den versjonen kunne ikke åpnes
