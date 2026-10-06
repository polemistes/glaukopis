# The projects: the list of them, and what is done with them.

home-title = Prosjekt
home-join = Bli med i eit delt prosjekt
home-from-document = Eit prosjekt av eit dokument …
home-new = Nytt prosjekt

## The two forms of the page: the last used projects as cards, all of them as a list

home-shown = Kva som blir vist
home-recent = Sist brukte
home-all = Alle prosjekt
# Under the cards, when there are more projects than they show.
home-show-all = Vis alle { $count } prosjekta
# The button that opens the menu of the page.
home-page-menu = Meir
home-search = Finn eit prosjekt
home-search-none = Ingen prosjekt har det namnet.
home-list-none = Det er ingen prosjekt.

## Folders of projects

home-new-folder = Ny mappe
home-folder-new-inside = Ny mappe inni …
home-folder-rename-title = Gi mappa nytt namn
home-folder-name-placeholder = Det mappa rommar
home-folder-name-missing = Gi mappa eit namn.
home-folder-projects = { $count ->
    [one] { $count } prosjekt
   *[other] { $count } prosjekt
}
home-menu-move = Flytt til mappe
home-menu-out = Ut av mappene
home-folder-delete-title = Slette mappa «{ $name }»?
home-folder-delete-message = Mappene og prosjekta i den blir tekne vare på: dei flyttar opp dit mappa var.
home-folder-delete-confirm = Slett mappa
home-folder-failed = Det kunne ikkje gjerast med mappa
home-moved-to = «{ $name }» vart flytta til { $folder }
home-moved-out = «{ $name }» ligg ikkje i noka mappe no
home-move-failed = Prosjektet kunne ikkje flyttast

## A map of the projects

home-map-menu = Eit kart over prosjekta …
home-map-title = Eit kart over prosjekta
home-map-about = Eit nytt prosjekt med eitt kart: mappene som element, og under kvar mappe prosjekta i den.
home-map-name-default = Prosjekt
home-map-what = Kva kartet rommar
home-map-names = Berre namna
home-map-names-hint = Eitt element for kvart prosjekt, med beskrivinga som tekst.
home-map-everything = Med alt dei rommar
home-map-everything-hint = Under kvart prosjekt karta i det, og under kvart kart alle elementa, med namn og tekstar.
home-map-note = Kjeldetilvisingane held på referansane sine. Ein kryssreferanse til ein figur eller ein del peikar på ingenting i det nye prosjektet, og kommentarane blir att.
home-map-reading = Les «{ $name }» …
home-map-working = Lagar kartet …
home-map-make = Lag kartet
home-map-failed = Kartet over prosjekta kunne ikkje lagast

## When there are none yet

home-welcome = Velkomen til Glaukopis
home-welcome-text = Eit prosjekt rommar arbeidet med éi bok eller ein artikkel: karta over ideane dine, tekstane du skriv inn i dei, og referansane dei byggjer på.
home-begin = Byrj på eit prosjekt

## A project in the list

# Under the names of the first four maps.
home-more-maps = og { $count } til
home-maps = { $count ->
    [one] { $count } kart
   *[other] { $count } kart
}
home-elements = { $count ->
    [one] { $count } element
   *[other] { $count } element
}
home-words = { $count ->
    [one] { $count } ord
   *[other] { $count } ord
}
home-references = { $count ->
    [one] { $count } referanse
   *[other] { $count } referansar
}
home-not-begun = Ikkje byrja på
home-shared = Delt
# "ago" is how long ago it was: "3 hours ago", "yesterday", "12 March".
home-changed = Endra { $ago }
# The button that opens the menu of a project.
home-more-for = Fleire val for { $name }
home-deleted-projects = { $count ->
    [one] { $count } sletta prosjekt
   *[other] { $count } sletta prosjekt
}

## The menu of a project

home-menu-rename = Gi nytt namn …
home-menu-duplicate = Dupliser …
home-menu-history = Tidlegare versjonar …

## Naming a project

home-rename-title = Gi prosjektet nytt namn
home-duplicate-title = Dupliser prosjektet
home-name = Namn
home-name-placeholder = Arbeidstittelen på boka eller artikkelen
home-name-missing = Gi prosjektet eit namn.
home-create = Opprett
home-duplicate = Dupliser
# The name a copy of a project is given, until it is given another.
home-copy-name = { $name }, kopi
home-failed = Det gjekk ikkje.

## Deleting a project

home-delete-title = Slette «{ $name }»?
home-delete-message = Prosjektet blir flytta til papirkorga i Glaukopis, og kan hentast tilbake derifrå. Referansane dine blir ikkje rørte.
home-delete-owner = Prosjektet blir flytta til papirkorga i Glaukopis, og kan hentast tilbake derifrå. Det blir liggjande på tenaren og hos dei du deler det med; vil du ta det av tenaren, opnar du det og sluttar å dele det først.
home-delete-member = Prosjektet blir flytta til papirkorga i Glaukopis, og kan hentast tilbake derifrå. Dei andre held på sitt.
home-delete-confirm = Slett prosjektet
home-deleted = «{ $name }» vart flytta til papirkorga
home-delete-failed = Prosjektet kunne ikkje slettast

## The trash

home-trash-title = Sletta prosjekt
home-trash-none = Det er ingen.
home-deleted-ago = Sletta { $ago }
home-restore = Hent tilbake
home-restored = «{ $name }» er tilbake blant prosjekta
home-restore-failed = Prosjektet kunne ikkje hentast tilbake
home-purge = Fjern for godt
home-purge-title = Fjerne «{ $name }» for godt?
home-purge-message = Det prosjektet rommar, kan ikkje hentast tilbake etter dette. Referansane dine blir ikkje rørte.
home-purge-failed = Prosjektet kunne ikkje fjernast

## Earlier versions of a project

home-history-title = Tidlegare versjonar
home-history-about = Av «{ $name }». Ein versjon blir opna som eit eige prosjekt; dette blir verande som det er.
home-history-none = Ingen er tekne vare på enno. Ein versjon blir teken vare på no og då medan du arbeider: tett for det som er nytt, glisnare for det som er eldre.
home-history-open = Opne ein kopi
# The name of the project an earlier version is opened as; "day" is the day it was kept.
home-history-copy-name = { $name }, per { $day }
home-history-unread = Dei tidlegare versjonane kunne ikkje lesast
home-history-open-failed = Den versjonen kunne ikkje opnast
