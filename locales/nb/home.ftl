# Prosjektene: listen over dem, og det som gjøres med dem.

home-title = Prosjekter
home-join = Bli med i et delt prosjekt
home-from-document = Et prosjekt av et dokument …
home-new = Nytt prosjekt

## Sidens tre former: de sist brukte prosjektene som kort, alle som en liste, alle som et kart rundt uglen

home-shown = Hva som vises
home-recent = Sist brukt
home-all = Alle prosjekter
home-owl = Kart
home-show-all = Vis alle { $count } prosjektene
home-page-menu = Mer
home-search = Finn et prosjekt
home-search-none = Ingen prosjekter har det navnet.
home-list-none = Det er ingen prosjekter.

## Mapper med prosjekter

home-new-folder = Ny mappe
home-folder-new-project = Nytt prosjekt inni …
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

## Prosjektlisten til venstre i et prosjekt

home-pane = Prosjektlisten
home-pane-toggle = Prosjektlisten
home-pane-close = Lukk prosjektlisten
home-pane-between = Mellom prosjektlisten og prosjektet
home-tree-unfold = Vis det som står under
home-tree-fold = Skjul det som står under
home-open-now = Det er åpent nå
home-open-beside = Åpne ved siden av
home-tree-unreadable = Det kunne ikke leses
home-tree-empty = Ingenting i det ennå

## Uglekartet: prosjektene tegnet rundt uglen, mappene som enkle merkelapper

home-owl-fit = Vis alt
home-owl-fold = Skjul prosjektene i den
home-owl-unfold = Vis prosjektene i den
# Selve kartet, som en liste lest høyt.
home-owl-label = Kartet over prosjektene
# Hjørnet på et kort som åpner prosjektet, og på en mappe som viser den midt i kartet.
home-owl-open = Åpne prosjektet
home-owl-enter = Åpne mappen som kart
# Hjørnet på mappen i midten: opp til det som rommer den.
home-owl-leave = Opp til «{ $name }»
# Menyene i kartet og på en mappe i det: noe nytt laget her, med navnet skrevet på stedet.
home-owl-new-project = Nytt prosjekt her
home-owl-new-folder = Ny mappe her
# Det en ny mappe eller et nytt prosjekt heter til navnet er skrevet.
home-owl-name = Navn
# Ved pekeren, mens flere mapper og prosjekter dras.
home-owl-dragged = { $count ->
    [one] { $count } ting
   *[other] { $count } ting
}
# På et kort: kartet til prosjektet, vist under det på kartet over prosjektene, eller skjult.
home-owl-map-show = Vis kartet her
home-owl-map-hide = Skjul kartet
home-owl-map-reading = Leser kartet …
# På et element i kartet til et prosjekt: prosjektet åpnet der.
home-owl-jump = Åpne prosjektet her
home-owl-fold-element = Skjul det som er under
home-owl-unfold-element = Vis det som er under
# Menyen i kartet: det som ble plassert for hånd, plasseres av seg selv igjen.
home-owl-tidy = Plasser alt av seg selv
home-owl-tidied = Alt på kartet plasseres av seg selv igjen
# Det en endring i kartet sier, med en vei tilbake.
home-owl-placed = «{ $name }» ble satt der
home-owl-placed-many = { $count ->
    [one] { $count } ting ble satt der
   *[other] { $count } ting ble satt der
}
home-owl-elements-moved = { $count ->
    [one] Et element i «{ $project }» ble flyttet
   *[other] { $count } elementer i «{ $project }» ble flyttet
}
home-owl-elements-carried = { $count ->
    [one] Et element ble flyttet til «{ $to }»
   *[other] { $count } elementer ble flyttet til «{ $to }»
}
# Linjen over kartet, ved en mappe: det som rommer den.
home-owl-in = I «{ $name }»

## Et kart over prosjektene

home-map-menu = Et kart over prosjektene …
home-map-title = Et kart over prosjektene
home-map-about = Et nytt prosjekt: mappene som elementer, og under hver mappe prosjektene i den.
home-map-name-default = Prosjekter
home-map-what = Hva kartet rommer
home-map-names = Bare navnene
home-map-names-hint = Ett element for hvert prosjekt, med beskrivelsen som tekst.
home-map-everything = Med alt de rommer
home-map-everything-hint = Under hvert prosjekt alle elementene i det, med navn og tekster.
home-map-note = Siteringene beholder referansene sine. En kryssreferanse til en figur eller en del peker på ingenting i det nye prosjektet, og kommentarene blir igjen.
home-map-reading = Leser «{ $name }» …
home-map-working = Lager kartet …
home-map-make = Lag kartet
home-map-failed = Kartet over prosjektene kunne ikke lages

## Når det ikke er noen ennå

home-welcome = Velkommen til Glaukopis
home-welcome-text = Et idéorientert skriveprogram
home-begin = Begynn på et prosjekt

## Et prosjekt i listen

home-more-maps = og { $count } til
home-maps = { $count ->
    [one] { $count } tre
   *[other] { $count } trær
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
home-menu-save-file = Lagre som fil …
home-menu-save-org = Lagre som Org …

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

## Et prosjekt som én fil

home-file-open = Åpne en prosjektfil …
home-file-open-title = Åpne en prosjektfil
home-file-filter = Glaukopis-prosjekt
home-file-save-title = Lagre prosjektet som en fil
home-file-saved = «{ $name }» ble lagret som en fil
home-file-save-failed = Prosjektet kunne ikke lagres som en fil
home-file-open-failed = Prosjektfilen kunne ikke åpnes
home-file-opened = «{ $name }» ble laget av filen
home-file-opened-added = «{ $name }» ble laget av filen. { $count ->
    [one] Ett verk ble
   *[other] { $count } verk ble
} lagt til i biblioteket ditt.
home-file-problems = { $count ->
    [one] Ett verk kunne ikke tas inn i biblioteket ditt. Det blir sitert slik det var i filen.
   *[other] { $count } verk kunne ikke tas inn i biblioteket ditt. De blir sitert slik de var i filen.
}
home-file-references-title = Verkene prosjektet siterer
home-file-references-about = Før «{ $name }» lages: disse verkene finnes i biblioteket ditt, men ikke slik de er i filen.
home-file-in-file = I filen
home-file-same-id = I biblioteket ditt som samme oppføring, men skrevet annerledes
home-file-merged = I biblioteket ditt, slått sammen med denne
home-file-what-to-do = Hva skal gjøres med det
home-file-keep-library = Behold bibliotekets
home-file-take-file = Ta filens inn i biblioteket
home-file-keep-both = Behold begge
home-file-cite-library = Siter bibliotekets
home-file-add-another = Legg til filens som et annet verk
home-file-same = { $count ->
    [one] Ett verk er i biblioteket ditt slik det er i filen.
   *[other] { $count } verk er i biblioteket ditt slik de er i filen.
}
home-file-added = { $count ->
    [one] Ett verk er ikke i biblioteket ditt, og legges til.
   *[other] { $count } verk er ikke i biblioteket ditt, og legges til.
}
home-file-make = Lag prosjektet

## Et prosjekt som Org: den lesbare kopien i en mappe, og et nytt prosjekt laget av en Org-fil

home-org-open = Åpne en Org-fil …
home-org-open-title = Åpne en Org-fil
home-org-filter = Org-fil
home-org-open-failed = Org-filen kunne ikke åpnes
home-org-save-title = Velg mappen prosjektet skal lagres som Org i
home-org-saved = «{ $name }» ble lagret som Org
home-org-save-failed = Prosjektet kunne ikke lagres som Org

## Endringer på hjemmesiden angret og gjort om
home-redo = Gjør om
# Det som ble angret, slik meldingen om endringen sa det.
home-undone = Angret: { $what }
home-undo-failed = Det kunne ikke angres

## Det en endring på hjemmesiden sier, med en vei tilbake
home-renamed = «{ $old }» heter nå «{ $name }»
home-project-made = «{ $name }» ble laget
home-folder-made = Mappen «{ $name }» ble laget
home-moved-many-to = { $count ->
    [one] { $count } ting ble flyttet til { $folder }
   *[other] { $count } ting ble flyttet til { $folder }
}
home-moved-many-out = { $count ->
    [one] { $count } ting ligger ikke i noen mappe nå
   *[other] { $count } ting ligger ikke i noen mappe nå
}
home-folder-deleted = Mappen «{ $name }» ble slettet; det som lå i den, ble flyttet opp
home-deleted-many = { $count ->
    [one] { $count } ting ble slettet
   *[other] { $count } ting ble slettet
}
home-not-in-trash = Prosjektet ligger ikke lenger i papirkurven.
home-folders-delete-title = { $count ->
    [one] Slette { $count } mappe?
   *[other] Slette { $count } mapper?
}
home-folders-delete-message = Mappene og prosjektene i dem beholdes: de flyttes opp dit mappene var.
home-folders-delete-confirm = Slett mappene
home-delete-many-title = { $count ->
    [one] Slette { $count } prosjekt?
   *[other] Slette { $count } prosjekter?
}
home-delete-many-message = Prosjektene flyttes til papirkurven i Glaukopis, og kan hentes tilbake derfra. Referansene dine blir ikke rørt.
home-delete-many-shared = Prosjektene flyttes til papirkurven i Glaukopis, og kan hentes tilbake derfra. De du deler, blir liggende på serveren og hos de andre.
home-delete-many-confirm = Slett prosjektene
