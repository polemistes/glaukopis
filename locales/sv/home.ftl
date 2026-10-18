# The projects: the list of them, and what is done with them.

home-title = Projekt
home-join = Gå med i ett delat projekt
home-from-document = Ett projekt av ett dokument…
home-new = Nytt projekt

## The three forms of the page: the last used projects as cards, all of them as a list, all of them as a map around the owl

home-shown = Vad som visas
home-recent = Senast använda
home-all = Alla projekt
home-owl = Karta
# Under the cards, when there are more projects than they show.
home-show-all = Visa alla { $count } projekt
# The button that opens the menu of the page.
home-page-menu = Mer
home-search = Hitta ett projekt
home-search-none = Inget projekt heter så.
home-list-none = Det finns inga projekt.

## Folders of projects

home-new-folder = Ny mapp
home-folder-new-project = Nytt projekt inuti…
home-folder-new-inside = Ny mapp inuti…
home-folder-rename-title = Byt namn på mappen
home-folder-name-placeholder = Vad mappen rymmer
home-folder-name-missing = Ge mappen ett namn.
home-folder-projects = { $count ->
    [one] { $count } projekt
   *[other] { $count } projekt
}
home-menu-move = Flytta till mapp
home-menu-out = Ut ur mapparna
home-folder-delete-title = Radera mappen ”{ $name }”?
home-folder-delete-message = Mapparna och projekten i den behålls: de flyttas upp dit mappen var.
home-folder-delete-confirm = Radera mappen
home-folder-failed = Det kunde inte göras med mappen
home-moved-to = ”{ $name }” flyttades till { $folder }
home-moved-out = ”{ $name }” ligger inte i någon mapp nu
home-move-failed = Projektet kunde inte flyttas

## The pane of projects, at the left of a project

home-pane = Projektlistan
home-pane-toggle = Projektlistan
home-pane-close = Stäng projektlistan
home-pane-between = Mellan projektlistan och projektet
# On the chevron before an element of the open project, in the pane: what is under it is shown, or hidden.
home-tree-unfold = Visa det som står under
home-tree-fold = Dölj det som står under
# Why the project that is open cannot be renamed or deleted from its menu.
home-open-now = Det är öppet nu
# On the menu of a project, or of an element of one, in the pane: shows it in a second pane, beside the project that is open.
home-open-beside = Öppna bredvid
# Under a project that is not open, in the pane, when what it holds could not be read.
home-tree-unreadable = Det kunde inte läsas
# Under a project that is not open, in the pane, when it holds no elements yet.
home-tree-empty = Inget i det än

## The owl map: the projects drawn around the owl, the folders as plain labels

# The button that shows all of the map at once.
home-owl-fit = Visa hela kartan
# On a folder of the map: its projects are hidden, or shown.
home-owl-fold = Dölj projekten i den
home-owl-unfold = Visa projekten i den
# The map itself, as a list read aloud.
home-owl-label = Kartan över projekten
# The corner of a card that opens the project, and of a folder that shows it at the centre of the map.
home-owl-open = Öppna projektet
home-owl-enter = Öppna mappen som karta
# The corner of the folder at the centre: up to what holds it.
home-owl-leave = Upp till ”{ $name }”
# The menus of the map and of a folder on it: a new one made here, its name written in place.
home-owl-new-project = Nytt projekt här
home-owl-new-folder = Ny mapp här
# What a new folder or project is called until its name is written.
home-owl-name = Namn
# Beside the pointer, while several folders and projects are dragged.
home-owl-dragged = { $count ->
    [one] { $count } sak
   *[other] { $count } saker
}
# On a card: the map of the project, shown under it on the map of the projects, or hidden.
home-owl-map-show = Visa dess karta här
home-owl-map-hide = Dölj dess karta
home-owl-map-reading = Läser dess karta…
# On an element of a project's map: the project opened there.
home-owl-jump = Öppna projektet här
home-owl-fold-element = Dölj det som står under
home-owl-unfold-element = Visa det som står under
# The menu of the map: what was put by hand is placed by itself again.
home-owl-tidy = Låt allt placeras av sig självt
home-owl-tidied = Allt på kartan placeras av sig självt igen
# What a change of the map says, with a way back.
home-owl-placed = ”{ $name }” placerades där
home-owl-placed-many = { $count ->
    [one] { $count } sak placerades där
   *[other] { $count } saker placerades där
}
home-owl-elements-moved = { $count ->
    [one] Ett element i ”{ $project }” flyttades
   *[other] { $count } element i ”{ $project }” flyttades
}
home-owl-elements-carried = { $count ->
    [one] Ett element flyttades till ”{ $to }”
   *[other] { $count } element flyttades till ”{ $to }”
}
# The bar over the map, at a folder: what holds it.
home-owl-in = I ”{ $name }”

## A map of the projects

home-map-menu = En karta över projekten…
home-map-title = En karta över projekten
home-map-about = Ett nytt projekt: mapparna som element, och under varje mapp projekten i den.
home-map-name-default = Projekt
home-map-what = Vad kartan rymmer
home-map-names = Bara namnen
home-map-names-hint = Ett element för varje projekt, med dess beskrivning som text.
home-map-everything = Med allt som finns i dem
home-map-everything-hint = Under varje projekt alla dess element, med namn och texter.
home-map-note = Källhänvisningarna behåller sina referenser. En korshänvisning till en figur eller en del pekar på inget i det nya projektet, och kommentarerna följer inte med.
home-map-reading = Läser ”{ $name }”…
home-map-working = Gör kartan…
home-map-make = Gör kartan
home-map-failed = Kartan över projekten kunde inte göras

## When there are none yet

home-welcome = Välkommen till Glaukopis
home-welcome-text = Ett idéorienterat skrivprogram
home-begin = Börja ett projekt

## A project in the list

# Under the names of the first four maps.
home-more-maps = och { $count } till
home-maps = { $count ->
    [one] { $count } träd
   *[other] { $count } träd
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
    [one] { $count } referens
   *[other] { $count } referenser
}
home-not-begun = Inte påbörjat
home-shared = Delat
# "ago" is how long ago it was: "3 hours ago", "yesterday", "12 March".
home-changed = Ändrat { $ago }
# The button that opens the menu of a project.
home-more-for = Mer för { $name }
home-deleted-projects = { $count ->
    [one] { $count } raderat projekt
   *[other] { $count } raderade projekt
}

## The menu of a project

home-menu-rename = Byt namn…
home-menu-duplicate = Kopiera…
home-menu-history = Tidigare versioner…
home-menu-save-file = Spara som en fil…
home-menu-save-org = Spara som Org…

## Naming a project

home-rename-title = Byt namn på projektet
home-duplicate-title = Kopiera projektet
home-name = Namn
home-name-placeholder = Arbetstiteln på boken eller artikeln
home-name-missing = Ge projektet ett namn.
home-create = Skapa
home-duplicate = Kopiera
# The name a copy of a project is given, until it is given another.
home-copy-name = { $name }, kopia
home-failed = Det gick inte.

## Deleting a project

home-delete-title = Radera ”{ $name }”?
home-delete-message = Projektet flyttas till Glaukopis papperskorg, varifrån det kan återställas. Dina referenser rörs inte.
home-delete-owner = Projektet flyttas till Glaukopis papperskorg, varifrån det kan återställas. Det blir kvar på servern och hos dem du delar det med; för att ta bort det från servern, öppna det och sluta dela det först.
home-delete-member = Projektet flyttas till Glaukopis papperskorg, varifrån det kan återställas. De andra behåller sitt.
home-delete-confirm = Radera projektet
home-deleted = ”{ $name }” flyttades till papperskorgen
home-delete-failed = Projektet kunde inte raderas

## The trash

home-trash-title = Raderade projekt
home-trash-none = Det finns inga.
home-deleted-ago = Raderat { $ago }
home-restore = Återställ
home-restored = ”{ $name }” är tillbaka bland projekten
home-restore-failed = Projektet kunde inte återställas
home-purge = Ta bort för gott
home-purge-title = Ta bort ”{ $name }” för gott?
home-purge-message = Det projektet rymmer kan inte återställas efter detta. Dina referenser rörs inte.
home-purge-failed = Projektet kunde inte tas bort

## Earlier versions of a project

home-history-title = Tidigare versioner
home-history-about = Av ”{ $name }”. En version öppnas som ett eget projekt; det här förblir som det är.
home-history-none = Ingen har sparats än. En version sparas då och då medan du arbetar: tätt för det som är nytt, glesare för det som är gammalt.
home-history-open = Öppna en kopia
# The name of the project an earlier version is opened as; "day" is the day it was kept.
home-history-copy-name = { $name }, per { $day }
home-history-unread = De tidigare versionerna kunde inte läsas
home-history-open-failed = Den versionen kunde inte öppnas

## A project as one file

home-file-open = Öppna en projektfil…
home-file-open-title = Öppna en projektfil
# The kind of file, in the dialog that asks for one.
home-file-filter = Glaukopis-projekt
home-file-save-title = Spara projektet som en fil
home-file-saved = ”{ $name }” sparades som en fil
home-file-save-failed = Projektet kunde inte sparas som en fil
home-file-open-failed = Projektfilen kunde inte öppnas
home-file-opened = ”{ $name }” gjordes av filen
home-file-opened-added = ”{ $name }” gjordes av filen. { $count ->
    [one] Ett verk
   *[other] { $count } verk
} lades till i ditt bibliotek.
home-file-problems = { $count ->
    [one] Ett verk kunde inte hämtas in i ditt bibliotek. Det hänvisas till som det var i filen.
   *[other] { $count } verk kunde inte hämtas in i ditt bibliotek. De hänvisas till som de var i filen.
}
# The dialog that asks what is to be done with the works a project file cites.
home-file-references-title = Verken som projektet hänvisar till
home-file-references-about = Innan ”{ $name }” görs: de här verken finns i ditt bibliotek, men inte som de är i filen.
home-file-in-file = I filen
home-file-same-id = I ditt bibliotek som samma post, men skriven på ett annat sätt
home-file-merged = I ditt bibliotek, sammanslagen med den här
home-file-what-to-do = Vad som ska göras med det
home-file-keep-library = Behåll ditt biblioteks
home-file-take-file = Ta in filens i ditt bibliotek
home-file-keep-both = Behåll båda
home-file-cite-library = Hänvisa till ditt biblioteks
home-file-add-another = Lägg till filens som ett annat verk
home-file-same = { $count ->
    [one] Ett verk finns i ditt bibliotek som det är i filen.
   *[other] { $count } verk finns i ditt bibliotek som de är i filen.
}
home-file-added = { $count ->
    [one] Ett verk finns inte i ditt bibliotek, och läggs till i det.
   *[other] { $count } verk finns inte i ditt bibliotek, och läggs till i det.
}
home-file-make = Gör projektet

## A project as Org: its readable copy in a folder, and a new project made of an Org file

home-org-open = Öppna en Org-fil…
home-org-open-title = Öppna en Org-fil
# The kind of file, in the dialog that asks for one.
home-org-filter = Org-fil
home-org-open-failed = Org-filen kunde inte öppnas
home-org-save-title = Välj mappen där projektet ska sparas som Org
home-org-saved = ”{ $name }” sparades som Org
home-org-save-failed = Projektet kunde inte sparas som Org

## Changes of the home undone and done again
home-redo = Gör om
# What was undone, as the message of the change said it.
home-undone = Ångrat: { $what }
home-undo-failed = Det kunde inte ångras

## What a change of the home says, with a way back
home-renamed = ”{ $old }” heter nu ”{ $name }”
home-project-made = ”{ $name }” skapades
home-folder-made = Mappen ”{ $name }” skapades
home-moved-many-to = { $count ->
    [one] { $count } sak flyttades till { $folder }
   *[other] { $count } saker flyttades till { $folder }
}
home-moved-many-out = { $count ->
    [one] { $count } sak ligger inte i någon mapp nu
   *[other] { $count } saker ligger inte i någon mapp nu
}
home-folder-deleted = Mappen ”{ $name }” raderades; det som låg i den flyttades upp
home-deleted-many = { $count ->
    [one] { $count } sak raderades
   *[other] { $count } saker raderades
}
home-not-in-trash = Projektet ligger inte längre i papperskorgen.
home-folders-delete-title = { $count ->
    [one] Radera { $count } mapp?
   *[other] Radera { $count } mappar?
}
home-folders-delete-message = Mapparna och projekten i dem behålls: de flyttas upp dit mapparna var.
home-folders-delete-confirm = Radera mapparna
home-delete-many-title = { $count ->
    [one] Radera { $count } projekt?
   *[other] Radera { $count } projekt?
}
home-delete-many-message = Projekten flyttas till Glaukopis papperskorg, varifrån de kan återställas. Dina referenser rörs inte.
home-delete-many-shared = Projekten flyttas till Glaukopis papperskorg, varifrån de kan återställas. De du delar blir kvar på servern och hos de andra.
home-delete-many-confirm = Radera projekten
