# The projects: the list of them, and what is done with them.

home-title = Projekter
home-join = Deltag i et delt projekt
home-from-document = Et projekt af et dokument…
home-new = Nyt projekt

## The two forms of the page: the last used projects as cards, all of them as a list

home-shown = Hvad der vises
home-recent = Senest brugt
home-all = Alle projekter
# Under the cards, when there are more projects than they show.
home-show-all = Vis alle { $count } projekter
# The button that opens the menu of the page.
home-page-menu = Mere
home-search = Find et projekt
home-search-none = Intet projekt har det navn.
home-list-none = Der er ingen projekter.

## Folders of projects

home-new-folder = Ny mappe
home-folder-new-inside = Ny mappe heri…
home-folder-rename-title = Omdøb mappen
home-folder-name-placeholder = Hvad mappen rummer
home-folder-name-missing = Giv mappen et navn.
home-folder-projects = { $count ->
    [one] { $count } projekt
   *[other] { $count } projekter
}
home-menu-move = Flyt til mappe
home-menu-out = Ud af mapperne
home-folder-delete-title = Slet mappen »{ $name }«?
home-folder-delete-message = Mapperne og projekterne i den beholdes: de flyttes op, hvor mappen var.
home-folder-delete-confirm = Slet mappen
home-folder-failed = Det kunne ikke gøres med mappen
home-moved-to = »{ $name }« blev flyttet til { $folder }
home-moved-out = »{ $name }« ligger ikke i nogen mappe nu
home-move-failed = Projektet kunne ikke flyttes

## A map of the projects

home-map-menu = Et kort over projekterne…
home-map-title = Et kort over projekterne
home-map-about = Et nyt projekt med ét kort: mapperne som elementer, og under hver mappe projekterne i den.
home-map-name-default = Projekter
home-map-what = Hvad kortet rummer
home-map-names = Kun navnene
home-map-names-hint = Et element for hvert projekt, med dets beskrivelse som tekst.
home-map-everything = Med alt, hvad de rummer
home-map-everything-hint = Under hvert projekt dets kort, og under hvert kort alle dets elementer, med deres navne og tekster.
home-map-note = Kildehenvisningerne beholder deres referencer. En krydshenvisning til en figur eller en del peger på intet i det nye projekt, og kommentarer bliver tilbage.
home-map-reading = Læser »{ $name }«…
home-map-working = Laver kortet…
home-map-make = Lav kortet
home-map-failed = Kortet over projekterne kunne ikke laves

## When there are none yet

home-welcome = Velkommen til Glaukopis
home-welcome-text = Et projekt rummer arbejdet med én bog eller artikel: kortene over dine idéer, de tekster, du skriver ind i dem, og de referencer, de hviler på.
home-begin = Begynd et projekt

## A project in the list

# Under the names of the first four maps.
home-more-maps = og { $count } til
home-maps = { $count ->
    [one] { $count } kort
   *[other] { $count } kort
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
    [one] { $count } reference
   *[other] { $count } referencer
}
home-not-begun = Ikke begyndt
home-shared = Delt
# "ago" is how long ago it was: "3 hours ago", "yesterday", "12 March".
home-changed = Ændret { $ago }
# The button that opens the menu of a project.
home-more-for = Mere for { $name }
home-deleted-projects = { $count ->
    [one] { $count } slettet projekt
   *[other] { $count } slettede projekter
}

## The menu of a project

home-menu-rename = Omdøb…
home-menu-duplicate = Dupliker…
home-menu-history = Tidligere versioner…

## Naming a project

home-rename-title = Omdøb projektet
home-duplicate-title = Dupliker projektet
home-name = Navn
home-name-placeholder = Bogens eller artiklens arbejdstitel
home-name-missing = Giv projektet et navn.
home-create = Opret
home-duplicate = Dupliker
# The name a copy of a project is given, until it is given another.
home-copy-name = { $name }, kopi
home-failed = Det gik ikke.

## Deleting a project

home-delete-title = Slet »{ $name }«?
home-delete-message = Projektet flyttes til papirkurven i Glaukopis, hvorfra det kan hentes tilbage. Dine referencer røres ikke.
home-delete-owner = Projektet flyttes til papirkurven i Glaukopis, hvorfra det kan hentes tilbage. Det bliver på serveren og hos dem, du deler det med; for at tage det af serveren skal du åbne det og først holde op med at dele det.
home-delete-member = Projektet flyttes til papirkurven i Glaukopis, hvorfra det kan hentes tilbage. De andre beholder deres.
home-delete-confirm = Slet projektet
home-deleted = »{ $name }« blev flyttet til papirkurven
home-delete-failed = Projektet kunne ikke slettes

## The trash

home-trash-title = Slettede projekter
home-trash-none = Der er ingen.
home-deleted-ago = Slettet { $ago }
home-restore = Hent tilbage
home-restored = »{ $name }« er tilbage blandt projekterne
home-restore-failed = Projektet kunne ikke hentes tilbage
home-purge = Fjern for altid
home-purge-title = Fjern »{ $name }« for altid?
home-purge-message = Det, projektet rummer, kan ikke hentes tilbage efter dette. Dine referencer røres ikke.
home-purge-failed = Projektet kunne ikke fjernes

## Earlier versions of a project

home-history-title = Tidligere versioner
home-history-about = Af »{ $name }«. En version åbnes som et projekt for sig; dette bliver, som det er.
home-history-none = Ingen er gemt endnu. En version gemmes nu og da, mens du arbejder: tæt for det nye, mere spredt for det gamle.
home-history-open = Åbn en kopi
# The name of the project an earlier version is opened as; "day" is the day it was kept.
home-history-copy-name = { $name }, pr. { $day }
home-history-unread = De tidligere versioner kunne ikke læses
home-history-open-failed = Den version kunne ikke åbnes
