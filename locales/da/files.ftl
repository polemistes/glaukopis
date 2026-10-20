# The files of the library: a store of their own beside the pictures, in
# folders of their own, each file belonging to no reference, to one or to
# several. The view stands in the library's place.

files-title = Bibliotekets filer
files-all = Alle filer
files-file = Fil
files-unread = Bibliotekets filer kunne ikke læses
files-count = { $count ->
    [one] { $count } fil
   *[other] { $count } filer
}
files-shown-of = { $shown } af { $count ->
    [one] { $count } fil
   *[other] { $count } filer
}
files-selected-of = { $selected } valgt af { $count }
files-selected = { $count ->
    [one] { $count } fil valgt
   *[other] { $count } filer valgt
}

## The kinds of files.

files-kind = Type
files-kind-pdf = PDF
files-kind-picture = Billede
files-kind-document = Dokument
files-kind-other = Anden fil

## Taking in.

files-add = Tilføj filer…
files-add-title = Tilføj filer til biblioteket
files-add-folder = Tilføj en mappe…
files-add-folder-hint = Med mapperne i den
files-add-folder-title = Tilføj en mappe til biblioteket
files-more = Flere måder at tilføje på
files-taking-in = { $count ->
    [one] Tager en fil ind…
   *[other] Tager { $count } filer og mapper ind…
}
files-taking-in-progress = Tager { $done } af { $count } ind: { $name }
files-taken-in = { $count ->
    [one] Én fil taget ind
   *[other] { $count } filer taget ind
}
files-same = { $count } fandtes allerede
files-folders-made = { $count ->
    [one] én mappe oprettet
   *[other] { $count } mapper oprettet
}
files-problems = { $count ->
    [one] én kunne ikke læses
   *[other] { $count } kunne ikke læses
}
files-taken-none = Intet blev taget ind
files-take-in-failed = Filerne kunne ikke tages ind

## Empty, searched and filtered.

files-empty = Ingen filer endnu
files-empty-text = Tilføj filer eller en mappe, eller slip dem her. Filer af enhver art gemmes i bibliotekets eget lager, og en mappe beholder mapperne i den.
files-folder-empty = Intet i denne mappe
files-folder-empty-text = Slip filer her, eller træk dem hertil fra en anden mappe.
files-search = Søg i filerne
files-search-in = Søg i { $name }
files-search-clear = Ryd søgningen
files-nothing-found = Intet fundet
files-nothing-found-text = Ingen fil har de ord i sit navn eller i sin reference.
files-nothing-passes = Ingen fil her slipper igennem filtrene.
files-filters = Filter
files-filters-on = { $count ->
    [one] Filter: ét er slået til
   *[other] Filter: { $count } er slået til
}
files-filter-kind = Type
files-filter-all = Alle typer
files-filter-pdf = PDF'er
files-filter-picture = Billeder
files-filter-document = Dokumenter
files-filter-other = Andre filer
files-filter-unassigned = Kun dem uden reference
files-filter-below = Med mapperne under den
files-filter-search-all = Søg i alle mapper
files-filter-clear = Ryd filtrene
files-sort = Sortér
files-sort-name = Efter navn
files-sort-reference = Efter reference
files-sort-added = Efter tilføjelsesdato
files-sort-size = Efter størrelse
files-sort-descending = Faldende

## The list.

files-no-reference = Ingen reference
files-missing = mangler
files-open = Åbn
files-reveal = Vis i filhåndteringen
files-move = Flyt…
files-move-to = Flyt til
files-move-failed = Filen kunne ikke flyttes
files-at-top = Øverst, uden for mapperne

## Folders.

files-folders = Mapper
files-folders-hint = Mapper holder orden på filerne: ét sted til hver fil. En mappe, der tilføjes, beholder mapperne i den.
files-folder = Mappe
files-folder-new = Ny mappe
files-folder-new-in = Ny mappe i { $name }
files-folder-new-inside = Ny mappe i denne
files-folder-name = Mappens navn
files-folder-name-failed = Mappen kunne ikke navngives
files-folder-move-to = Flyt til
files-folder-to-top = Øverst
files-folder-move-failed = Mappen kunne ikke flyttes
files-folder-expand = Åbn
files-folder-collapse = Luk
files-folder-delete = Slet mappen
files-folder-delete-title = Slet mappen »{ $name }«?
files-folder-delete-empty = Mappen er tom.
files-folder-delete-subfolders = { $count ->
    [one] Mappen indeholder én undermappe. Hvad skal der ske med den?
   *[other] Mappen indeholder { $count } undermapper. Hvad skal der ske med dem?
}
files-folder-move-up = Flyt et niveau op
files-folder-delete-all-under = Slet alle mapper under denne
files-folder-delete-files = { $count ->
    [one] Mappen indeholder én fil. Hvad skal der ske med den?
   *[other] Mappen indeholder { $count } filer. Hvad skal der ske med dem?
}
files-folder-delete-files-under = { $count ->
    [one] Mappen og mapperne under den indeholder én fil. Hvad skal der ske med den?
   *[other] Mappen og mapperne under den indeholder { $count } filer. Hvad skal der ske med dem?
}
# Said after the question above, where files to be deleted belong to references.
files-folder-delete-files-assigned = { $count ->
    [one] Én af dem hører til en reference, som ville miste den.
   *[other] { $count } af dem hører til referencer, som ville miste dem.
}
files-folder-files-to-parent = Læg i den overordnede mappe
files-folder-files-delete = Slet
files-folder-delete-failed = Mappen kunne ikke slettes

## The pane of a file.

files-name = Navn
files-references = Referencer
files-unassigned = Uden reference: filen hører ikke til nogen reference.
files-assign = Knyt til en reference…
files-assign-title = Knyt »{ $name }« til en reference
files-assign-failed = Filen kunne ikke knyttes til referencen
files-unassign = Fjern fra »{ $name }«
files-unassign-failed = Filen kunne ikke fjernes fra referencen
files-about = Om filen
files-size = Størrelse
files-pages = Sider
# $text is one of the three below.
files-pdf-pages = { $count ->
    [one] { $count } side · { $text }
   *[other] { $count } sider · { $text }
}
files-pdf-has-text = har tekst
files-pdf-no-text = ingen tekst
# Shown as the pages of a PDF that could not be looked at; the reason is what the reading said.
files-pdf-unread = kunne ikke læses: { $reason }
files-pdf-some-text = { $count ->
    [one] én side uden tekst
   *[other] { $count } sider uden tekst
}
files-added = Tilføjet
files-origin = Kom fra
files-searchable = Gør søgbar…
files-read-into = Importer teksten som et kort…
files-read-text = Læs teksten…
files-to-pictures = Tag ind blandt billederne
files-to-pictures-done = »{ $name }« er nu blandt billederne
files-to-pictures-show = Vis
files-to-pictures-failed = Billedet kunne ikke tages ind blandt billederne
files-bring-in = Hent ind som elementer…
files-rename-failed = Filen kunne ikke omdøbes

## Removing.

files-remove = Fjern
files-remove-title = Fjern »{ $name }« fra biblioteket?
files-remove-message = Filen slettes fra bibliotekets lager.
files-remove-message-assigned = { $count ->
    [one] Filen hører til { $names }, som mister den. Den slettes fra bibliotekets lager.
   *[other] Filen hører til { $count } referencer, { $names }, som mister den. Den slettes fra bibliotekets lager.
}
files-remove-many-title = Fjern { $count } filer fra biblioteket?
files-remove-many-message = Filerne slettes fra bibliotekets lager.
files-remove-many-assigned = { $count ->
    [one] Én af dem hører til en reference, som mister den. De slettes fra bibliotekets lager.
   *[other] { $count } af dem hører til referencer, som mister dem. De slettes fra bibliotekets lager.
}
files-remove-failed = Filen kunne ikke fjernes
# Said in the question where removing the files leaves folders empty; folders empty before are not counted.
files-remove-folders-left = { $count ->
    [one] Det efterlader én mappe tom.
   *[other] Det efterlader { $count } mapper tomme.
}
files-remove-with-folders = Fjern, med de tomme mapper
files-remove-keep-folders = Fjern, behold mapperne
files-removing = Fjerner { $count } filer…
files-removed = { $count ->
    [0] Ingen fil fjernet
    [one] Én fil fjernet
   *[other] { $count } filer fjernet
}
files-removed-folders = { $count ->
    [one] én tom mappe med dem
   *[other] { $count } tomme mapper med dem
}
# When references are deleted: their files go too, unless another reference has them.
files-remove-with-files = Slet med filerne

## Choosing a reference.

files-choose-reference = Vælg en reference
files-choose-search = Søg efter forfatter, titel eller år
files-choose-references = Referencer
files-choose-none = Ingen reference har de ord.
files-choose-empty = Biblioteket har ingen referencer endnu.
files-choose-more = … og { $count } til: søg for at finde dem
files-choose-files = Bibliotekets filer
files-choose-files-search = Søg efter navn eller efter det værk, en fil hører til
files-choose-files-none = Ingen fil svarer til det.
files-choose-add = { $count ->
    [0] Tilføj filer
    [one] Tilføj én fil
   *[other] Tilføj { $count } filer
}
files-added-to = { $count ->
    [one] Én fil føjet til »{ $title }«
   *[other] { $count } filer føjet til »{ $title }«
}
files-choose-new = Ny reference…
files-choose = Vælg

## Nothing selected.

files-none-selected = Ingen fil valgt
files-none-selected-text = Vælg en fil for at se, hvad man ved om den, og hvad der kan gøres med den.
# $name is the folder in view, or “All files”.
files-tally = { $name }: { $count ->
    [one] én fil
   *[other] { $count } filer
}, { $unassigned } uden reference

## The going-through: files given to their references.

files-go-through-head = Gennemgå filerne og knyt dem til deres referencer…
files-go-through-chosen = { $count ->
    [one] Gennemgå den…
   *[other] Gennemgå disse { $count }…
}
files-go-through-nothing = Hver fil her hører til en reference
files-folder-go-through = Gennemgå filerne uden reference…
# The bar at the head of the files, while files of the folder in view belong to no reference.
files-unassigned-here = { $count ->
    [one] Én fil her hører ikke til nogen reference.
   *[other] { $count } filer her hører ikke til nogen reference.
}
files-unassigned-go = Gennemgå dem…
files-unassigned-hide = Skjul dette
files-going-title = Knyt filerne til deres referencer
files-going-subtitle = { $count ->
    [one] Én fil
   *[other] { $count } filer
}
files-going-finding = { $count ->
    [one] Finder ud af, hvad filen er…
   *[other] Finder ud af, hvad de { $count } filer er…
}
files-going-progress = { $done } af { $count }: { $name }
files-going-finding-hint = Hver fil læses for at finde en identifikator og en titel, dens navn læses, og dens første side sammenlignes med biblioteket. Det, der findes ud af, huskes, så længe programmet er åbent.
files-going-stop = Stop
files-going-failed = Det lykkedes ikke at finde ud af, hvad filerne er
files-going-all-certain = { $count ->
    [one] Den ene, der er fundet med sikkerhed:
   *[other] Alle { $count }, der er fundet med sikkerhed:
}
files-going-all-probable = { $count ->
    [one] Den ene, der er fundet som sandsynlig:
   *[other] Alle { $count }, der er fundet som sandsynlige:
}
files-going-all-new = { $count ->
    [one] Den ene nye, fra tjenesterne:
   *[other] Alle { $count } nye, fra tjenesterne:
}
files-going-all-nothing = { $count ->
    [one] Den ene, hvor intet blev fundet:
   *[other] De { $count }, hvor intet blev fundet:
}
files-going-this-new = Ny reference
files-going-show-all = Vis alle { $count }
files-going-what = Hvad { $name } bliver til
files-going-this = Denne
files-going-other = En anden…
files-going-new = Ny reference…
files-going-later = Senere
files-going-certain = sikker
files-going-probable = sandsynlig
files-going-which = Hvilket værk
# $origin is where the description comes from: a service, or the file.
files-going-lookup = En ny reference · fra { $origin }
files-going-nothing = Intet fundet
files-going-chosen = Valgt
files-going-made-here = Lavet her
files-going-none = Ingen af filerne kunne gennemgås.
# The files the going-through did not reach, as when it was stopped: they keep no reference, and the bar offers them again.
files-going-not-reached = { $count ->
    [one] Én fil blev ikke set på. Den bliver, som den er, til en anden gang.
   *[other] { $count } filer blev ikke set på. De bliver, som de er, til en anden gang.
}
files-going-counts = { $assign } at knytte, { $later } til senere
files-going-done = { $count ->
    [0] Intet at knytte
    [one] Knyt én fil til dens reference
   *[other] Knyt { $count } filer til deres referencer
}
files-going-applying = Knytter filerne til deres referencer…
files-going-source = Bibliotekets filer
files-going-assigned = { $count ->
    [0] Ingen fil knyttet til en reference
    [one] Én fil knyttet til en reference
   *[other] { $count } filer knyttet til referencer
}
files-going-made = { $count ->
    [one] én ny reference
   *[other] { $count } nye referencer
}
files-going-later-count = { $count } gemt til senere
files-going-undo = Fortryd
files-going-undone = { $count ->
    [0] Ingen fil taget tilbage
    [one] Én fil taget tilbage
   *[other] { $count } filer taget tilbage
}
files-going-undone-made = { $count ->
    [one] én ny reference fjernet
   *[other] { $count } nye referencer fjernet
}
# In the menu of the head of the files, while the last going-through can be undone.
files-undo-last = { $count ->
    [one] Fortryd: én fil knyttet til en reference
   *[other] Fortryd: { $count } filer knyttet til deres referencer
}

## Exporting.

files-export-folder-title = Vælg den mappe, der skal eksporteres til
files-export-title = { $count ->
    [one] Eksporter én fil
   *[other] Eksporter { $count } filer
}
files-export-all-what = Hver fil skrives i den mappe, du vælger herefter, under sin references navn, Forfatter År - Titel, eller under sit eget, hvor den ingen reference har; bibliotekets mapper bliver mapper i den.
files-export-folder-what = Mappens filer skrives i den mappe, du vælger herefter, under deres referencers navne eller under deres egne, hvor de ingen reference har; mapperne under den bliver mapper i den.
files-export-files-what = { $count ->
    [one] Filen skrives i den mappe, du vælger herefter, under sin references navn eller under sit eget, hvor den ingen reference har.
   *[other] Filerne skrives i den mappe, du vælger herefter, under deres referencers navne eller under deres egne, hvor de ingen reference har.
}
files-export-bib = Med en references.bib
files-export-bib-hint = De værker, filerne hører til, hvert med angivelse af, hvor dets filer skrives, så Zotero eller JabRef kan læse hele mappen.
files-export-go = Vælg mappen…
files-exporting = { $count ->
    [one] Eksporterer en fil…
   *[other] Eksporterer { $count } filer…
}
files-exporting-progress = Eksporterer { $done } af { $count }: { $name }
files-exported = { $count ->
    [0] Ingen fil eksporteret
    [one] Én fil eksporteret
   *[other] { $count } filer eksporteret
}
files-exported-folders = { $count ->
    [one] én mappe
   *[other] { $count } mapper
}
files-exported-bib = med en references.bib
files-exported-stopped = stoppet med { $count } tilbage
files-exported-show = Vis
files-export-failed = Filerne kunne ikke eksporteres
files-reveal-failed = Mappen kunne ikke vises
files-export = Eksporter…
files-export-chosen = Eksporter disse { $count }…
files-export-all = Eksporter alle filer…
