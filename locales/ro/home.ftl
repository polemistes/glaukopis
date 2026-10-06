# The projects: the list of them, and what is done with them.

home-title = Proiecte
home-join = Alătură-te unui proiect partajat
home-from-document = Un proiect dintr-un document…
home-new = Proiect nou

## The two forms of the page: the last used projects as cards, all of them as a list

home-shown = Ce se arată
home-recent = Folosite de curând
home-all = Toate proiectele
# Under the cards, when there are more projects than they show.
home-show-all = { $count ->
    [one] Arată toate proiectele: unul
    [few] Arată toate cele { $count } proiecte
   *[other] Arată toate cele { $count } de proiecte
}
# The button that opens the menu of the page.
home-page-menu = Mai mult
home-search = Găsește un proiect
home-search-none = Niciun proiect nu are acest nume.
home-list-none = Nu există proiecte.

## Folders of projects

home-new-folder = Dosar nou
home-folder-new-inside = Dosar nou înăuntru…
home-folder-rename-title = Redenumește dosarul
home-folder-name-placeholder = Ce cuprinde dosarul
home-folder-name-missing = Dați dosarului un nume.
home-folder-projects = { $count ->
    [one] { $count } proiect
    [few] { $count } proiecte
   *[other] { $count } de proiecte
}
home-menu-move = Mută în dosar
home-menu-out = Afară din dosare
home-folder-delete-title = Ștergeți dosarul „{ $name }”?
home-folder-delete-message = Dosarele și proiectele din el se păstrează: urcă acolo unde era dosarul.
home-folder-delete-confirm = Șterge dosarul
home-folder-failed = Asta nu s-a putut face cu dosarul
home-moved-to = „{ $name }” a fost mutat în { $folder }
home-moved-out = „{ $name }” nu mai este în niciun dosar
home-move-failed = Proiectul nu s-a putut muta

## A map of the projects

home-map-menu = O hartă a proiectelor…
home-map-title = O hartă a proiectelor
home-map-about = Un proiect nou, cu o singură hartă: dosarele ca elemente, iar sub fiecare dosar proiectele din el.
home-map-name-default = Proiecte
home-map-what = Ce cuprinde harta
home-map-names = Numai numele
home-map-names-hint = Un element pentru fiecare proiect, cu descrierea lui ca text.
home-map-everything = Cu tot ce este în ele
home-map-everything-hint = Sub fiecare proiect hărțile lui, iar sub fiecare hartă toate elementele ei, cu numele și textele lor.
home-map-note = Citările își păstrează referințele. O trimitere la o figură sau la o parte nu arată spre nimic în proiectul nou, iar comentariile rămân în urmă.
home-map-reading = Se citește „{ $name }”…
home-map-working = Se face harta…
home-map-make = Fă harta
home-map-failed = Harta proiectelor nu s-a putut face

## When there are none yet

home-welcome = Bun venit la Glaukopis
home-welcome-text = Un proiect cuprinde lucrul la o carte sau la un articol: hărțile ideilor dumneavoastră, textele pe care le scrieți în ele și referințele pe care se sprijină.
home-begin = Începeți un proiect

## A project in the list

# Under the names of the first four maps.
home-more-maps = { $count ->
    [one] și încă una
    [few] și încă { $count }
   *[other] și încă { $count }
}
home-maps = { $count ->
    [one] { $count } hartă
    [few] { $count } hărți
   *[other] { $count } de hărți
}
home-elements = { $count ->
    [one] { $count } element
    [few] { $count } elemente
   *[other] { $count } de elemente
}
home-words = { $count ->
    [one] { $count } cuvânt
    [few] { $count } cuvinte
   *[other] { $count } de cuvinte
}
home-references = { $count ->
    [one] { $count } referință
    [few] { $count } referințe
   *[other] { $count } de referințe
}
home-not-begun = Neînceput
home-shared = Partajat
# "ago" is how long ago it was: "3 hours ago", "yesterday", "12 March".
home-changed = Modificat { $ago }
# The button that opens the menu of a project.
home-more-for = Mai mult pentru { $name }
home-deleted-projects = { $count ->
    [one] { $count } proiect șters
    [few] { $count } proiecte șterse
   *[other] { $count } de proiecte șterse
}

## The menu of a project

home-menu-rename = Redenumește…
home-menu-duplicate = Dublează…
home-menu-history = Versiuni anterioare…

## Naming a project

home-rename-title = Redenumește proiectul
home-duplicate-title = Dublează proiectul
home-name = Nume
home-name-placeholder = Titlul de lucru al cărții sau al articolului
home-name-missing = Dați proiectului un nume.
home-create = Creează
home-duplicate = Dublează
# The name a copy of a project is given, until it is given another.
home-copy-name = { $name }, copie
home-failed = Nu a mers.

## Deleting a project

home-delete-title = Ștergeți „{ $name }”?
home-delete-message = Proiectul se mută în coșul lui Glaukopis, de unde poate fi readus. Referințele dumneavoastră nu sunt atinse.
home-delete-owner = Proiectul se mută în coșul lui Glaukopis, de unde poate fi readus. Rămâne pe server și la cei cu care îl partajați; ca să-l luați de pe server, deschideți-l și opriți mai întâi partajarea.
home-delete-member = Proiectul se mută în coșul lui Glaukopis, de unde poate fi readus. Ceilalți îl păstrează pe al lor.
home-delete-confirm = Șterge proiectul
home-deleted = „{ $name }” a fost mutat în coș
home-delete-failed = Proiectul nu s-a putut șterge

## The trash

home-trash-title = Proiecte șterse
home-trash-none = Nu este niciunul.
home-deleted-ago = Șters { $ago }
home-restore = Readu
home-restored = „{ $name }” este din nou printre proiecte
home-restore-failed = Proiectul nu s-a putut readuce
home-purge = Scoate pentru totdeauna
home-purge-title = Scoateți „{ $name }” pentru totdeauna?
home-purge-message = Ce cuprinde proiectul nu mai poate fi readus după aceasta. Referințele dumneavoastră nu sunt atinse.
home-purge-failed = Proiectul nu s-a putut scoate

## Earlier versions of a project

home-history-title = Versiuni anterioare
home-history-about = Ale lui „{ $name }”. O versiune se deschide ca proiect de sine stătător; acesta rămâne cum este.
home-history-none = Nu s-a păstrat încă niciuna. O versiune se păstrează din când în când în timp ce lucrați: des pentru ce este recent, mai rar pentru ce este vechi.
home-history-open = Deschide o copie
# The name of the project an earlier version is opened as; "day" is the day it was kept.
home-history-copy-name = { $name }, la { $day }
home-history-unread = Versiunile anterioare nu s-au putut citi
home-history-open-failed = Acea versiune nu s-a putut deschide
