# The files of the library: a store of their own beside the pictures, in
# folders of their own, each file belonging to no reference, to one or to
# several. The view stands in the library's place.

files-title = Bibliotekets filer
files-all = Alla filer
files-file = Fil
files-unread = Bibliotekets filer kunde inte läsas
files-count = { $count ->
    [one] { $count } fil
   *[other] { $count } filer
}
files-shown-of = { $shown } av { $count ->
    [one] { $count } fil
   *[other] { $count } filer
}
files-selected-of = { $selected } av { $count } markerade
files-selected = { $count ->
    [one] { $count } fil markerad
   *[other] { $count } filer markerade
}

## The kinds of files.

files-kind = Slag
files-kind-pdf = PDF
files-kind-picture = Bild
files-kind-document = Dokument
files-kind-other = Annan fil

## Taking in.

files-add = Lägg till filer…
files-add-title = Lägg till filer i biblioteket
files-add-folder = Lägg till en mapp…
files-add-folder-title = Lägg till en mapp i biblioteket
files-more = Fler sätt att lägga till
files-taking-in = { $count ->
    [one] Tar in en fil…
   *[other] Tar in { $count } filer och mappar…
}
files-taking-in-progress = Tar in { $done } av { $count }: { $name }
files-taken-in = { $count ->
    [one] En fil togs in
   *[other] { $count } filer togs in
}
files-same = { $count } fanns redan
files-folders-made = { $count ->
    [one] en mapp gjordes
   *[other] { $count } mappar gjordes
}
files-problems = { $count ->
    [one] en kunde inte läsas
   *[other] { $count } kunde inte läsas
}
files-taken-none = Inget togs in
files-take-in-failed = Filerna kunde inte tas in

## Empty, searched and filtered.

files-empty = Inga filer än
files-empty-text = Lägg till filer eller en mapp, eller släpp dem här. Alla slags filer sparas, i bibliotekets eget förråd, och en mapp behåller mapparna i den.
files-folder-empty = Inget i den här mappen
files-folder-empty-text = Släpp filer här, eller dra hit dem från en annan mapp.
files-search = Sök bland filerna
files-search-in = Sök i { $name }
files-search-clear = Rensa sökningen
files-nothing-found = Inget hittat
files-nothing-found-text = Ingen fil har de orden i sitt namn eller i sin referens.
files-nothing-passes = Ingen fil här passerar filtren.
files-filters = Filter
files-filters-on = { $count ->
    [one] Filter: ett är på
   *[other] Filter: { $count } är på
}
files-filter-kind = Slag
files-filter-all = Alla slag
files-filter-pdf = PDF-filer
files-filter-picture = Bilder
files-filter-document = Dokument
files-filter-other = Andra filer
files-filter-unassigned = Bara de utan referens
files-filter-below = Med mapparna under den
files-filter-search-all = Sök i alla mappar
files-filter-clear = Rensa filtren
files-sort = Sortera
files-sort-name = Efter namn
files-sort-reference = Efter referens
files-sort-added = Efter datum tillagt
files-sort-size = Efter storlek
files-sort-descending = Fallande

## The list.

files-no-reference = Ingen referens
files-missing = saknas
files-open = Öppna
files-reveal = Visa i filhanteraren
files-move = Flytta…
files-move-to = Flytta till
files-move-failed = Filen kunde inte flyttas
files-at-top = Överst, i ingen mapp

## Folders.

files-folders = Mappar
files-folders-hint = Mappar håller ordning på filerna: en plats för varje fil. En mapp som läggs till behåller mapparna i den.
files-folder = Mapp
files-folder-new = Ny mapp
files-folder-new-in = Ny mapp i { $name }
files-folder-new-inside = Ny mapp inuti
files-folder-name = Mappens namn
files-folder-name-failed = Mappen kunde inte namnges
files-folder-move-to = Flytta till
files-folder-to-top = Till översta nivån
files-folder-move-failed = Mappen kunde inte flyttas
files-folder-expand = Öppna
files-folder-collapse = Stäng
files-folder-delete = Radera mappen
files-folder-delete-title = Radera mappen ”{ $name }”?
files-folder-delete-empty = Mappen är tom.
files-folder-delete-subfolders = { $count ->
    [one] Mappen innehåller en undermapp. Vad ska hända med den?
   *[other] Mappen innehåller { $count } undermappar. Vad ska hända med dem?
}
files-folder-move-up = Flytta upp en nivå
files-folder-delete-all-under = Radera alla mappar under den här
files-folder-delete-files = { $count ->
    [one] Mappen innehåller en fil. Vad ska hända med den?
   *[other] Mappen innehåller { $count } filer. Vad ska hända med dem?
}
files-folder-delete-files-under = { $count ->
    [one] Mappen och mapparna under den innehåller en fil. Vad ska hända med den?
   *[other] Mappen och mapparna under den innehåller { $count } filer. Vad ska hända med dem?
}
# Said after the question above, where files to be deleted belong to references.
files-folder-delete-files-assigned = { $count ->
    [one] En av dem hör till en referens, som skulle förlora den.
   *[other] { $count } av dem hör till referenser, som skulle förlora dem.
}
files-folder-files-to-parent = Lägg i mappen ovanför
files-folder-files-delete = Radera
files-folder-delete-failed = Mappen kunde inte raderas

## The pane of a file.

files-name = Namn
files-references = Referenser
files-unassigned = Utan referens: filen hör inte till någon referens.
files-assign = Koppla till en referens…
files-assign-title = Koppla ”{ $name }” till en referens
files-assign-failed = Filen kunde inte kopplas till referensen
files-unassign = Koppla loss från ”{ $name }”
files-unassign-failed = Filen kunde inte kopplas loss från referensen
files-about = Om filen
files-size = Storlek
files-pages = Sidor
# $text is one of the three below.
files-pdf-pages = { $count ->
    [one] { $count } sida · { $text }
   *[other] { $count } sidor · { $text }
}
files-pdf-has-text = har text
files-pdf-no-text = ingen text
# Shown as the pages of a PDF that could not be looked at; the reason is what the reading said.
files-pdf-unread = kunde inte läsas: { $reason }
files-pdf-some-text = { $count ->
    [one] en sida utan text
   *[other] { $count } sidor utan text
}
files-added = Tillagd
files-origin = Kom från
files-searchable = Gör sökbar…
files-read-into = Importera texten som en karta…
files-read-text = Läs texten…
files-to-pictures = Ta in bland bilderna
files-to-pictures-done = ”{ $name }” finns nu bland bilderna
files-to-pictures-show = Visa
files-to-pictures-failed = Bilden kunde inte tas in bland bilderna
files-bring-in = Hämta in som element…
files-rename-failed = Filen kunde inte få nytt namn

## Removing.

files-remove = Ta bort
files-remove-title = Ta bort ”{ $name }” från biblioteket?
files-remove-message = Filen raderas ur bibliotekets förråd.
files-remove-message-assigned = { $count ->
    [one] Filen hör till { $names }, som förlorar den. Den raderas ur bibliotekets förråd.
   *[other] Filen hör till { $count } referenser, { $names }, som förlorar den. Den raderas ur bibliotekets förråd.
}
files-remove-many-title = Ta bort { $count } filer från biblioteket?
files-remove-many-message = Filerna raderas ur bibliotekets förråd.
files-remove-many-assigned = { $count ->
    [one] En av dem hör till en referens, som förlorar den. De raderas ur bibliotekets förråd.
   *[other] { $count } av dem hör till referenser, som förlorar dem. De raderas ur bibliotekets förråd.
}
files-remove-failed = Filen kunde inte tas bort
# Said in the question where removing the files leaves folders empty; folders empty before are not counted.
files-remove-folders-left = { $count ->
    [one] En mapp blir tom av det.
   *[other] { $count } mappar blir tomma av det.
}
files-remove-with-folders = Ta bort, med de tomma mapparna
files-remove-keep-folders = Ta bort, behåll mapparna
files-removing = Tar bort { $count } filer…
files-removed = { $count ->
    [0] Ingen fil borttagen
    [one] En fil borttagen
   *[other] { $count } filer borttagna
}
files-removed-folders = { $count ->
    [one] en tom mapp med dem
   *[other] { $count } tomma mappar med dem
}
# When references are deleted: their files go too, unless another reference has them.
files-remove-with-files = Radera med filerna

## Choosing a reference.

files-choose-reference = Välj en referens
files-choose-search = Sök efter författare, titel eller år
files-choose-references = Referenser
files-choose-none = Ingen referens har de orden.
files-choose-empty = Biblioteket har inga referenser än.
files-choose-more = …och { $count } till: sök för att hitta dem
files-choose-files = Bibliotekets filer
files-choose-files-search = Sök efter namn, eller efter verket en fil hör till
files-choose-files-none = Ingen fil stämmer med det.
files-choose-add = { $count ->
    [0] Lägg till filer
    [one] Lägg till en fil
   *[other] Lägg till { $count } filer
}
files-added-to = { $count ->
    [one] En fil tillagd i ”{ $title }”
   *[other] { $count } filer tillagda i ”{ $title }”
}
files-choose-new = Ny referens…
files-choose = Välj

## Nothing selected.

files-none-selected = Ingen fil markerad
files-none-selected-text = Markera en fil för att se vad som är känt om den och vad som kan göras med den.
# $name is the folder in view, or “All files”.
files-tally = { $name }: { $count ->
    [one] en fil
   *[other] { $count } filer
}, { $unassigned } utan referens

## The going-through: files given to their references.

files-go-through-head = Gå igenom filerna och koppla dem till sina referenser…
files-go-through-chosen = { $count ->
    [one] Gå igenom den…
   *[other] Gå igenom de här { $count }…
}
files-go-through-nothing = Varje fil här hör till en referens
files-folder-go-through = Gå igenom filerna utan referens…
# The bar at the head of the files, while files of the folder in view belong to no reference.
files-unassigned-here = { $count ->
    [one] En fil här hör inte till någon referens.
   *[other] { $count } filer här hör inte till någon referens.
}
files-unassigned-go = Gå igenom dem…
files-unassigned-hide = Dölj det här
files-going-title = Koppla filerna till sina referenser
files-going-subtitle = { $count ->
    [one] En fil
   *[other] { $count } filer
}
files-going-finding = { $count ->
    [one] Tar reda på vad filen är…
   *[other] Tar reda på vad de { $count } filerna är…
}
files-going-progress = { $done } av { $count }: { $name }
files-going-finding-hint = I varje fil letas en identifierare och en titel fram, filens namn läses, och dess första sida jämförs med biblioteket. Det som kommer fram behålls så länge programmet är öppet.
files-going-stop = Stoppa
files-going-failed = Det gick inte att ta reda på vad filerna är
files-going-all-certain = { $count ->
    [one] Den enda med en säker träff:
   *[other] Alla { $count } med en säker träff:
}
files-going-all-probable = { $count ->
    [one] Den enda med en trolig träff:
   *[other] Alla { $count } med en trolig träff:
}
files-going-all-new = { $count ->
    [one] Den enda som är ny, från tjänsterna:
   *[other] Alla { $count } som är nya, från tjänsterna:
}
files-going-all-nothing = { $count ->
    [one] Den enda där inget hittades:
   *[other] De { $count } där inget hittades:
}
files-going-this-new = Ny referens
files-going-show-all = Visa alla { $count }
files-going-what = Vad { $name } blir
files-going-this = Den här
files-going-other = En annan…
files-going-new = Ny referens…
files-going-later = Senare
files-going-certain = säkert
files-going-probable = troligen
files-going-which = Vilket verk
# $origin is where the description comes from: a service, or the file.
files-going-lookup = En ny referens · från { $origin }
files-going-nothing = Inget hittat
files-going-chosen = Vald
files-going-made-here = Gjord här
files-going-none = Ingen av filerna kunde gås igenom.
# The files the going-through did not reach, as when it was stopped: they keep no reference, and the bar offers them again.
files-going-not-reached = { $count ->
    [one] En fil gicks inte igenom. Den förblir som den är, till en annan gång.
   *[other] { $count } filer gicks inte igenom. De förblir som de är, till en annan gång.
}
files-going-counts = { $assign } att koppla, { $later } senare
files-going-done = { $count ->
    [0] Inget att koppla
    [one] Koppla en fil till sin referens
   *[other] Koppla { $count } filer till sina referenser
}
files-going-applying = Kopplar filerna till sina referenser…
files-going-source = Bibliotekets filer
files-going-assigned = { $count ->
    [0] Ingen fil kopplad
    [one] En fil kopplad
   *[other] { $count } filer kopplade
}
files-going-made = { $count ->
    [one] en ny referens
   *[other] { $count } nya referenser
}
files-going-later-count = { $count } kvar till senare
files-going-undo = Ångra
files-going-undone = { $count ->
    [0] Ingen fil tagen tillbaka
    [one] En fil tagen tillbaka
   *[other] { $count } filer tagna tillbaka
}
files-going-undone-made = { $count ->
    [one] en ny referens borttagen
   *[other] { $count } nya referenser borttagna
}
# In the menu of the head of the files, while the last going-through can be undone.
files-undo-last = { $count ->
    [one] Ångra: en fil kopplad till sin referens
   *[other] Ångra: { $count } filer kopplade till sina referenser
}

## Exporting.

files-export-folder-title = Välj mappen att exportera till
files-export-title = { $count ->
    [one] Exportera en fil
   *[other] Exportera { $count } filer
}
files-export-all-what = Varje fil skrivs till mappen du väljer härnäst, under namnet på sin referens, Författare År - Titel, eller under sitt eget där den inte har någon; bibliotekets mappar blir mappar i den.
files-export-folder-what = Mappens filer skrivs till den du väljer härnäst, under namnen på sina referenser, eller under sina egna där de inte har någon; mapparna under den blir mappar i den.
files-export-files-what = { $count ->
    [one] Filen skrivs till mappen du väljer härnäst, under namnet på sin referens, eller under sitt eget där den inte har någon.
   *[other] Filerna skrivs till mappen du väljer härnäst, under namnen på sina referenser, eller under sina egna där de inte har någon.
}
files-export-bib = Med en references.bib
files-export-bib-hint = Verken som filerna hör till, vart och ett med sina filer angivna där de skrivs, så att Zotero eller JabRef kan läsa in hela mappen.
files-export-go = Välj mappen…
files-exporting = { $count ->
    [one] Exporterar en fil…
   *[other] Exporterar { $count } filer…
}
files-exporting-progress = Exporterar { $done } av { $count }: { $name }
files-exported = { $count ->
    [0] Ingen fil exporterad
    [one] En fil exporterad
   *[other] { $count } filer exporterade
}
files-exported-folders = { $count ->
    [one] en mapp
   *[other] { $count } mappar
}
files-exported-bib = med en references.bib
files-exported-stopped = avbröts med { $count } kvar
files-exported-show = Visa
files-export-failed = Filerna kunde inte exporteras
files-reveal-failed = Mappen kunde inte visas
files-export = Exportera…
files-export-chosen = Exportera de här { $count }…
files-export-all = Exportera alla filer…
