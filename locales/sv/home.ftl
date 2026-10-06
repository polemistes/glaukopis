# The projects: the list of them, and what is done with them.

home-title = Projekt
home-join = Gå med i ett delat projekt
home-from-document = Ett projekt av ett dokument…
home-new = Nytt projekt

## The two forms of the page: the last used projects as cards, all of them as a list

home-shown = Vad som visas
home-recent = Senast använda
home-all = Alla projekt
# Under the cards, when there are more projects than they show.
home-show-all = Visa alla { $count } projekt
# The button that opens the menu of the page.
home-page-menu = Mer
home-search = Hitta ett projekt
home-search-none = Inget projekt heter så.
home-list-none = Det finns inga projekt.

## Folders of projects

home-new-folder = Ny mapp
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

## A map of the projects

home-map-menu = En karta över projekten…
home-map-title = En karta över projekten
home-map-about = Ett nytt projekt, med en karta: mapparna som element, och under varje mapp projekten i den.
home-map-name-default = Projekt
home-map-what = Vad kartan rymmer
home-map-names = Bara namnen
home-map-names-hint = Ett element för varje projekt, med dess beskrivning som text.
home-map-everything = Med allt som finns i dem
home-map-everything-hint = Under varje projekt dess kartor, och under varje karta alla dess element, med namn och texter.
home-map-note = Källhänvisningarna behåller sina referenser. En korshänvisning till en figur eller en del pekar på inget i det nya projektet, och kommentarerna följer inte med.
home-map-reading = Läser ”{ $name }”…
home-map-working = Gör kartan…
home-map-make = Gör kartan
home-map-failed = Kartan över projekten kunde inte göras

## When there are none yet

home-welcome = Välkommen till Glaukopis
home-welcome-text = Ett projekt rymmer arbetet med en bok eller artikel: kartorna över dina idéer, texterna du skriver in i dem, och referenserna de vilar på.
home-begin = Börja ett projekt

## A project in the list

# Under the names of the first four maps.
home-more-maps = och { $count } till
home-maps = { $count ->
    [one] { $count } karta
   *[other] { $count } kartor
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
