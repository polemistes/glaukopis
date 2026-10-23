# The projects: the list of them, and what is done with them.

home-title = Projekter
home-join = Deltag i et delt projekt
home-from-document = Et projekt af et dokument…
home-new = Nyt projekt

## The three forms of the page: the last used projects as cards, all of them as a list, all of them as a map around the owl

home-shown = Hvad der vises
home-recent = Senest brugt
home-all = Alle projekter
home-owl = Kort
# Under the cards, when there are more projects than they show.
# The button that opens the menu of the page.
home-page-menu = Mere
home-search = Find et projekt
home-search-none = Intet projekt har det navn.
home-list-none = Der er ingen projekter.

## Folders of projects

home-new-folder = Ny mappe
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

## The pane of projects, at the left of a project

home-pane = Projektlisten
home-pane-toggle = Projektlisten
home-pane-close = Luk projektlisten
home-pane-between = Mellem projektlisten og projektet
# On the chevron before an element of the open project, in the pane: what is under it is shown, or hidden.
# Why the project that is open cannot be renamed or deleted from its menu.
home-open-now = Det er åbent nu
# On the menu of a project, or of an element of one, in the pane: shows it in a second pane, beside the project that is open.
home-open-beside = Åbn ved siden af
# Under a project that is not open, in the pane, when what it holds could not be read.
home-tree-unreadable = Det kunne ikke læses
# Under a project that is not open, in the pane, when it holds no elements yet.
home-tree-empty = Intet i det endnu

## The owl map: the projects drawn around the owl, the folders as plain labels

# The button that shows all of the map at once.
home-owl-fit = Vis det hele
# On a folder of the map: its projects are hidden, or shown.
# The map itself, as a list read aloud.
home-owl-label = Kortet over projekterne
# The corner of a card that opens the project, and of a folder that shows it at the centre of the map.
# The corner of the folder at the centre: up to what holds it.
home-owl-leave = Op til »{ $name }«
# The menus of the map and of a folder on it: a new one made here, its name written in place.
home-owl-new-project = Nyt projekt her
home-owl-new-folder = Ny mappe her
# What a new folder or project is called until its name is written.
home-owl-name = Navn
# Beside the pointer, while several folders and projects are dragged.
home-owl-dragged = { $count ->
    [one] { $count } ting
   *[other] { $count } ting
}
# On a card: the map of the project, shown under it on the map of the projects, or hidden.
home-owl-map-reading = Læser dets kort…
# On an element of a project's map: the project opened there.
# The menu of the map: what was put by hand is placed by itself again.
home-owl-tidy = Lad alt placeres af sig selv
home-owl-tidied = Alt på kortet placeres igen af sig selv
# What a change of the map says, with a way back.
home-owl-placed = »{ $name }« blev sat der
home-owl-placed-many = { $count ->
    [one] { $count } ting blev sat der
   *[other] { $count } ting blev sat der
}
home-owl-elements-moved = { $count ->
    [one] Et element i »{ $project }« blev flyttet
   *[other] { $count } elementer i »{ $project }« blev flyttet
}
home-owl-elements-carried = { $count ->
    [one] Et element blev flyttet til »{ $to }«
   *[other] { $count } elementer blev flyttet til »{ $to }«
}
# The bar over the map, at a folder: what holds it.
home-owl-in = I »{ $name }«

## A map of the projects

home-map-menu = Et kort over projekterne…
home-map-title = Et kort over projekterne
home-map-about = Et nyt projekt: mapperne som elementer, og under hver mappe projekterne i den.
home-map-name-default = Projekter
home-map-what = Hvad kortet rummer
home-map-names = Kun navnene
home-map-names-hint = Et element for hvert projekt, med dets beskrivelse som tekst.
home-map-everything = Med alt, hvad de rummer
home-map-everything-hint = Under hvert projekt alle dets elementer, med deres navne og tekster.
home-map-note = Kildehenvisningerne beholder deres referencer. En krydshenvisning til en figur eller en del peger på intet i det nye projekt, og kommentarer bliver tilbage.
home-map-reading = Læser »{ $name }«…
home-map-working = Laver kortet…
home-map-make = Lav kortet
home-map-failed = Kortet over projekterne kunne ikke laves

## When there are none yet

home-welcome = Velkommen til Glaukopis
home-welcome-text = Et idéorienteret skriveprogram
home-begin = Begynd et projekt

## A project in the list

# Under the names of the first four maps.
}
}
}
}
# "ago" is how long ago it was: "3 hours ago", "yesterday", "12 March".
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
home-menu-save-file = Gem som en fil…
home-menu-save-org = Gem som Org…

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

## A project as one file

home-file-open = Åbn en projektfil…
home-file-open-title = Åbn en projektfil
# The kind of file, in the dialog that asks for one.
home-file-filter = Glaukopis-projekt
home-file-save-title = Gem projektet som en fil
home-file-saved = »{ $name }« blev gemt som en fil
home-file-save-failed = Projektet kunne ikke gemmes som en fil
home-file-open-failed = Projektfilen kunne ikke åbnes
home-file-opened = »{ $name }« blev lavet af filen
home-file-opened-added = »{ $name }« blev lavet af filen. { $count ->
    [one] Ét værk blev
   *[other] { $count } værker blev
} føjet til dit bibliotek.
home-file-problems = { $count ->
    [one] Ét værk kunne ikke hentes ind i dit bibliotek. Der henvises til det, som det var i filen.
   *[other] { $count } værker kunne ikke hentes ind i dit bibliotek. Der henvises til dem, som de var i filen.
}
# The dialog that asks what is to be done with the works a project file cites.
home-file-references-title = De værker, projektet henviser til
home-file-references-about = Før »{ $name }« laves: disse værker er i dit bibliotek, men ikke som de er i filen.
home-file-in-file = I filen
home-file-same-id = I dit bibliotek som samme post, skrevet anderledes
home-file-merged = I dit bibliotek, slået sammen med denne
home-file-what-to-do = Hvad der skal gøres med det
home-file-keep-library = Behold dit biblioteks
home-file-take-file = Tag filens ind i dit bibliotek
home-file-keep-both = Behold begge
home-file-cite-library = Henvis til dit biblioteks
home-file-add-another = Tilføj filens som et andet værk
home-file-same = { $count ->
    [one] Ét værk er i dit bibliotek, som det er i filen.
   *[other] { $count } værker er i dit bibliotek, som de er i filen.
}
home-file-added = { $count ->
    [one] Ét værk er ikke i dit bibliotek og føjes til det.
   *[other] { $count } værker er ikke i dit bibliotek og føjes til det.
}
home-file-make = Lav projektet

## A project as Org: its readable copy in a folder, and a new project made of an Org file

home-org-open = Åbn en Org-fil…
home-org-open-title = Åbn en Org-fil
# The kind of file, in the dialog that asks for one.
home-org-filter = Org-fil
home-org-open-failed = Org-filen kunne ikke åbnes
home-org-save-title = Vælg den mappe, projektet skal gemmes som Org i
home-org-saved = »{ $name }« blev gemt som Org
home-org-save-failed = Projektet kunne ikke gemmes som Org

## Changes of the home undone and done again
home-redo = Gentag
# What was undone, as the message of the change said it.
home-undone = Fortrudt: { $what }
home-undo-failed = Det kunne ikke fortrydes

## What a change of the home says, with a way back
home-renamed = »{ $old }« hedder nu »{ $name }«
home-project-made = »{ $name }« blev oprettet
home-folder-made = Mappen »{ $name }« blev oprettet
home-moved-many-to = { $count ->
    [one] { $count } ting blev flyttet til { $folder }
   *[other] { $count } ting blev flyttet til { $folder }
}
home-moved-many-out = { $count ->
    [one] { $count } ting ligger ikke i nogen mappe nu
   *[other] { $count } ting ligger ikke i nogen mappe nu
}
home-folder-deleted = Mappen »{ $name }« blev slettet; det, der var i den, blev flyttet op
home-deleted-many = { $count ->
    [one] { $count } ting blev slettet
   *[other] { $count } ting blev slettet
}
home-not-in-trash = Projektet er ikke længere i papirkurven.
home-folders-delete-title = { $count ->
    [one] Slet { $count } mappe?
   *[other] Slet { $count } mapper?
}
home-folders-delete-message = Mapperne og projekterne i dem beholdes: de flyttes op, hvor mapperne var.
home-folders-delete-confirm = Slet mapperne
home-delete-many-title = { $count ->
    [one] Slet { $count } projekt?
   *[other] Slet { $count } projekter?
}
home-delete-many-message = Projekterne flyttes til papirkurven i Glaukopis, hvorfra de kan hentes tilbage. Dine referencer røres ikke.
home-delete-many-shared = Projekterne flyttes til papirkurven i Glaukopis, hvorfra de kan hentes tilbage. Dem, du deler, bliver på serveren og hos de andre.
home-delete-many-confirm = Slet projekterne
