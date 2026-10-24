# A project: its view, the bar over the map, what is done to elements, and
# the panels at the side with the references and the pictures.

project-list-unreadable = Projekten kunde inte läsas

## The view of a project

project-open-failed = Projektet kunde inte öppnas
# Shown under the words above when nothing more is known of why.
project-open-failed-detail = Projektet kunde inte öppnas.
project-back = Tillbaka till projekten
project-fetching = Hämtar projektet
project-fetching-offline = Servern kan inte nås. Projektet hämtas när det går.
project-fetching-on-the-way = Det är på väg från servern.
project-name = Projektets namn
project-rename = Byt namn på projektet
project-not-saved = Inte sparat
project-redo = Gör om
project-view-this = Den här kartans vy
project-diagram = Diagram
project-text = Text
project-one-at-a-time = En i taget
project-side-by-side = Två sida vid sida
project-close-side = Stäng den här sidan
project-references = Referenser
project-side-map = Karta
project-between-maps = Mellan de två kartorna

## When the sharing ends from the other side

project-unshared = Projektet delas inte längre
project-unshared-this = Det här projektet delas inte längre
project-left-out = Du är inte längre bland medarbetarna
project-unshared-unfetched = Det hade inte hämtats, så inget av det finns på den här datorn.
project-unshared-not-removed = Projektet hade inte hämtats, och kunde inte tas bort från listan över projekt
project-unshared-kept = Den som delade det har tagit bort det från servern. Du behåller projektet som det är nu, och kan arbeta vidare med det på egen hand.
project-left-out-kept = Du behåller projektet som det är nu, och kan arbeta vidare med det på egen hand. Det de andra skriver efter detta når inte dig.
project-understood = Uppfattat

## Files dropped on the project

project-drop-picture = Släpp en bild på det element den hör till
project-cited-in = { $count ->
    [one] Referensen hänvisas till i ”{ $name }”
   *[other] { $count } referenser hänvisas till i ”{ $name }”
}
# As above, where the element has no name.
project-cited-in-element = { $count ->
    [one] Referensen hänvisas till i ”elementet”
   *[other] { $count } referenser hänvisas till i ”elementet”
}

## The bar over the map: where one is, and what is done with the element in view

# The name of an element that has none.
project-untitled = Utan titel
project-where = Var du är
# The tooltip of the crumb of the parent of the element in view, in the path over a side.
project-up-hint = Upp till ”{ $name }” · Alt+Skift+↑
# The small round button by the element in view, in the diagram and the text: up to the element over it.
project-leave-map = Upp till ”{ $name }”
# The owl before the name of the project itself, in the first pane: up to all the projects.
# The sign of a project, read aloud, where it is shared.
project-badge-shared = { $name }, delat av dig
project-badge-joined = { $name }, som du gått med i
# Two projects side by side.
project-beside-failed = Projektet kunde inte öppnas bredvid det här
project-beside-no-comments = Kommentarerna är de i projektet du öppnade: öppna det andra för sig för att kommentera i det
# A template of the writer's own was saved anew, and the copy of it the project carries could not be made afresh.
project-template-not-renewed = Projektets kopia av mallen kunde inte uppdateras
# Said over the other pane while elements of one project are dragged over it.
project-copy-to-project = Kopiera till ”{ $name }”
project-move-to-project = Flytta till ”{ $name }”
project-document-into = Hämta in ett dokument i det…
project-drop-on-map = Släpp på en karta för att flytta dit · håll Ctrl för att kopiera
project-open-beside = Öppna bredvid
project-open-beside-hint = Två kartor sida vid sida, för att flytta element mellan dem
project-side-by-side-short = Sida vid sida
# The count is of those found in the element in view, and under it.
project-found-hint = { $count } att gå igenom och göra till källhänvisningar
project-copied-to = Kopierat till ”{ $name }”
project-moved-to = Flyttat till ”{ $name }”
project-other-projects = Andra projekt
project-send-failed = Det gick inte att skriva i ”{ $project }”. Inget ändrades här.
project-send-no-element = Elementet finns inte längre i det projektet.

## What is done to elements, in the diagram and in the text

project-add-under = Lägg till ett element under det
project-add = Lägg till ett element
project-add-after = Lägg till ett element efter det
project-write-text = Skriv dess text
project-associate = Associera med…
project-leave-out = Utelämna ur dokumentet
# An element that stands for another element: in the document, that element is in its place.
project-stands-for = Står för ”{ $name }”
project-stand-for = Stå för ett annat element
project-stand-for-heading = I dokumentet tar det här elementet dess plats
project-stand-for-none = Inget
# Copying or moving elements to the project itself, to one of its trees, or to another project.
project-copy-to = Kopiera till
project-cut = Klipp ut
project-cut-not-removed = Det som klipptes ut klistrades in, men kunde inte tas bort från projektet det kom från
project-copy = Kopiera
# Pasting what was copied under the element the menu is of.
project-paste-under = Klistra in under det
project-move-to = Flytta till
# Opening a dialog with the tree of the project, to choose where the elements go: first in Copy to and Move to.
project-choose-where = Välj var…
# Opening the same dialog, to choose the element this one stands for.
project-choose-element = Välj ett element…
# The title of the dialog that chooses where elements are copied to: the name of the one copied, or how many.
project-pick-copy-title = { $count ->
    [one] Kopiera ”{ $name }” till
   *[other] Kopiera { $count } element till
}
project-pick-move-title = { $count ->
    [one] Flytta ”{ $name }” till
   *[other] Flytta { $count } element till
}
project-pick-stand-title = Vad ”{ $name }” står för
# The buttons of the dialog, saying what will be done with the element chosen.
project-pick-copy = Kopiera hit
project-pick-move = Flytta hit
project-pick-stand = Stå för det här
project-pick-find = Hitta ett element efter namn
project-pick-none = Inget element heter så
# Why an element cannot be chosen, when it is hovered.
project-pick-itself = Ett element kan inte läggas i sig självt, eller i det som står under det
project-pick-self = Ett element kan inte stå för sig självt
project-pick-loop = Dokumentet skulle innehålla sig självt
project-tidy-branch = Snygga till den här grenen
project-place-automatically = Placera automatiskt
project-delete-keeping = Radera, men behåll det som står under
project-itself-stays = Själva projektet blir kvar
project-itself-stays-detail = Radera projektet från startsidan.
# One element was deleted, with the elements that were under it.
project-deleted = { $under ->
    [0] ”{ $name }” raderades
    [one] ”{ $name }” raderades, med { $under } element under sig
   *[other] ”{ $name }” raderades, med { $under } element under sig
}
project-deleted-many = { $count ->
    [one] { $count } element raderat
   *[other] { $count } element raderade
}

project-delete-busy-title = Någon skriver här
# $names: those who are at what would be deleted, as a list.
project-delete-busy-message = { $names } { $count ->
    [one] arbetar
   *[other] arbetar
} i det som skulle raderas. Det som skrivs där nu skulle gå förlorat med det, och kan inte återställas.
project-delete-busy-confirm = Radera ändå

## An element, open for writing, and as it is shown when the pointer rests on it

project-element = Element
project-name-placeholder = Namn
project-write-here = Skriv här. Skriv @ för att hänvisa.
project-words = { $count ->
    [one] { $count } ord
   *[other] { $count } ord
}
project-read-on = Dubbelklicka för att läsa vidare
project-stands-for-map = Står för ”{ $name }”
project-left-out-of-document = Utelämnat ur dokumentet

## The panels at the side: the references and the pictures

project-this-map = Den här kartan
project-project = Projekt
project-library = Bibliotek
project-nothing-found = Inget hittat
project-edit-reference = Redigera referensen…
project-new-reference = Ny referens
project-import-file = Importera en fil
project-which-references = Vilka referenser
project-search-references = Sök referenser
project-library-empty = Ditt bibliotek är tomt
project-library-empty-hint = Lägg till en referens, eller importera dem du har.
project-no-references = Inga referenser än
project-no-references-hint = Det du hänvisar till medan du skriver listas här. För att hänvisa, välj Hänvisa över texten, eller skriv @.
project-cited-in-heading = Hänvisad till i
project-not-cited = Inte hänvisad till i det här projektet.
project-references-drag = Dra en referens in i en text för att hänvisa till den där, eller till ett element för att hänvisa till den i slutet av dess text.
# The count is of the references the project cites that the library lacks.
project-references-foreign = { $count ->
    [one] { $count } i det här projektet finns inte i ditt bibliotek.
   *[other] { $count } i det här projektet finns inte i ditt bibliotek.
}
# The store of pictures.
project-store = Förråd
project-open-picture = Öppna…
project-put-into-text = Sätt in den i texten
project-add-pictures = Lägg till bilder från filer
project-which-pictures = Vilka bilder
project-search-pictures = Sök bilder
project-a-picture = En bild
project-with-notes = Med anteckningar
project-not-on-computer = Inte på den här datorn
project-nothing-said = Inget sägs om den än
project-store-empty = Förrådet är tomt
project-store-empty-hint = Lägg till bilder från filer, eller släpp dem på en text.
project-no-pictures = Inga bilder än
project-no-pictures-map = Bilderna i den här kartans figurer listas här. De i förrådet finns under Förråd.
project-no-pictures-project = Bilderna i projektets figurer listas här. De i förrådet finns under Förråd.
project-pictures-drag = Dra en bild in i en text för att göra en figur av den där, eller till ett element för att sätta den i slutet av dess text.
# The count is of the pictures that are used and are not in the store of this computer.
project-pictures-absent-map = { $count ->
    [one] { $count } i den här kartan finns inte på den här datorn.
   *[other] { $count } i den här kartan finns inte på den här datorn.
}
project-pictures-absent-project = { $count ->
    [one] { $count } i det här projektet finns inte på den här datorn.
   *[other] { $count } i det här projektet finns inte på den här datorn.
}

## Shared by the diagram and the text

# A count of elements that stands alone, as a label of what is dragged.
project-elements = { $count ->
    [one] { $count } element
   *[other] { $count } element
}
# One of the others who work on a shared project is at an element.
project-other-here = { $name } är här
project-link-placeholder = Hur de hänger ihop
project-link-label = Associationens etikett

## A copy and its original.
copy-title = Kopian och dess original
copy-from = Kopierat från ”{ $name }”
copy-original-changed = Originalet har ändrats sedan det kopierades, eller sedan det senast sågs.
copy-original-same = Originalet är som det var när det kopierades.
copy-original-unknown = Om originalet har ändrats sedan det kopierades är inte känt: kopian gjordes innan sådant sparades.
copy-original-gone = Originalet finns inte längre.
copy-how-shown = Nedan står genomstruket det som bara originalet har, och märkt det som bara den här kopian har.
copy-alike = Deras namn och texter är lika. De kan skilja sig i det som inte är ord: källhänvisningar, bilder, märkning.
copy-only-original = Bara i originalet
copy-only-copy = Bara i den här kopian
copy-go = Gå till originalet
copy-seen = Behåll den här kopian som den är
copy-take = Ta originalets namn och text
copy-changed-mark = Originalet har ändrats sedan det här kopierades
copy-compare = Jämför med originalet…
copy-copied-from = Kopierat från ”{ $name }”
copy-copied-from-changed = Kopierat från ”{ $name }”, som har ändrats sedan dess

## How far the writing of an element has come, as its writer says.
status = Status
status-idea = Idé
status-draft = Utkast
status-done = Klar
status-none = Ingen status
# Of an element, where its status is shown: "Draft · 340 words".
status-of = { $status } · { $count ->
    [one] { $count } ord
   *[other] { $count } ord
}
status-count-idea = { $count ->
    [one] { $count } idé
   *[other] { $count } idéer
}
status-count-draft = { $count ->
    [one] { $count } utkast
   *[other] { $count } utkast
}
status-count-done = { $count } klara
# The words of the drafts and of what is done, in a map.
status-words-written = { $count ->
    [one] { $count } ord skrivet
   *[other] { $count } ord skrivna
}
status-progress = Hur långt kartan har kommit
