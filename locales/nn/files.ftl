# The files of the library: a store of their own beside the pictures, in
# folders of their own, each file belonging to no reference, to one or to
# several. The view stands in the library's place.

files-title = Filene i biblioteket
files-all = Alle filer
files-file = Fil
files-unread = Filene i biblioteket kunne ikkje lesast
files-count = { $count ->
    [one] { $count } fil
   *[other] { $count } filer
}
files-shown-of = { $shown } av { $count ->
    [one] { $count } fil
   *[other] { $count } filer
}
files-selected-of = { $selected } av { $count } valt
files-selected = { $count ->
    [one] { $count } fil vald
   *[other] { $count } filer valde
}

## The kinds of files.

files-kind = Type
files-kind-pdf = PDF
files-kind-picture = Bilete
files-kind-document = Dokument
files-kind-other = Anna fil

## Taking in.

files-add = Legg til filer …
files-add-title = Legg til filer i biblioteket
files-add-folder = Legg til ei mappe …
files-add-folder-title = Legg til ei mappe i biblioteket
files-more = Fleire måtar å leggje til på
files-taking-in = { $count ->
    [one] Tek inn ei fil …
   *[other] Tek inn { $count } filer og mapper …
}
files-taking-in-progress = Tek inn { $done } av { $count }: { $name }
files-taken-in = { $count ->
    [one] Éi fil teken inn
   *[other] { $count } filer tekne inn
}
files-same = { $count } fanst frå før
files-folders-made = { $count ->
    [one] éi mappe laga
   *[other] { $count } mapper laga
}
files-problems = { $count ->
    [one] éi kunne ikkje lesast
   *[other] { $count } kunne ikkje lesast
}
files-taken-none = Ingenting vart teke inn
files-take-in-failed = Filene kunne ikkje takast inn

## Empty, searched and filtered.

files-empty = Ingen filer enno
files-empty-text = Legg til filer eller ei mappe, eller slepp dei her. Alle slags filer blir tekne vare på, i biblioteket sitt eige lager, og ei mappe held på mappene som ligg i den.
files-folder-empty = Ingenting i denne mappa
files-folder-empty-text = Slepp filer her, eller dra dei hit frå ei anna mappe.
files-search = Søk i filene
files-search-in = Søk i { $name }
files-search-clear = Tøm søket
files-nothing-found = Ingenting funne
files-nothing-found-text = Inga fil har dei orda i namnet sitt eller i referansen sin.
files-nothing-passes = Inga fil her slepp gjennom filtera.
files-filters = Filtrer
files-filters-on = { $count ->
    [one] Filter: eitt er på
   *[other] Filter: { $count } er på
}
files-filter-kind = Type
files-filter-all = Alle typar
files-filter-pdf = PDF-ar
files-filter-picture = Bilete
files-filter-document = Dokument
files-filter-other = Andre filer
files-filter-unassigned = Berre dei utan referanse
files-filter-search-all = Søk i alle mappene
files-filter-clear = Fjern filtera
files-sort = Sorter
files-sort-name = Etter namn
files-sort-reference = Etter referanse
files-sort-added = Etter dato lagd til
files-sort-size = Etter storleik
files-sort-descending = Fallande

## The list.

files-no-reference = Ingen referanse
files-missing = manglar
files-reveal = Vis i filhandsamaren
files-move = Flytt …
files-move-to = Flytt til
files-move-failed = Fila kunne ikkje flyttast
files-at-top = Øvst, i inga mappe

## Folders.

files-folders = Mapper
files-folders-hint = Mapper held orden på filene: éin stad for kvar fil. Ei mappe som blir lagd til, held på mappene som ligg i den.
files-folder = Mappe
files-folder-new = Ny mappe
files-folder-new-in = Ny mappe i { $name }
files-folder-new-inside = Ny mappe inni
files-folder-name = Namnet på mappa
files-folder-name-failed = Mappa kunne ikkje få namn
files-folder-move-to = Flytt til
files-folder-to-top = Til øvste nivå
files-folder-move-failed = Mappa kunne ikkje flyttast
files-folder-expand = Opne
files-folder-collapse = Lukk
files-folder-delete = Slett mappa
files-folder-delete-title = Slette mappa «{ $name }»?
files-folder-delete-empty = Mappa er tom.
files-folder-delete-subfolders = { $count ->
    [one] Mappa inneheld éi undermappe. Kva skal skje med den?
   *[other] Mappa inneheld { $count } undermapper. Kva skal skje med dei?
}
files-folder-move-up = Flytt opp eitt nivå
files-folder-delete-all-under = Slett alle mappene under denne
files-folder-delete-files = { $count ->
    [one] Mappa inneheld éi fil. Kva skal skje med den?
   *[other] Mappa inneheld { $count } filer. Kva skal skje med dei?
}
files-folder-delete-files-under = { $count ->
    [one] Mappa og mappene under den inneheld éi fil. Kva skal skje med den?
   *[other] Mappa og mappene under den inneheld { $count } filer. Kva skal skje med dei?
}
# Said after the question above, where files to be deleted belong to references.
files-folder-delete-files-assigned = { $count ->
    [one] Éi av dei høyrer til ein referanse, som ville miste den.
   *[other] { $count } av dei høyrer til referansar, som ville miste dei.
}
files-folder-files-to-parent = Legg i mappa over
files-folder-files-delete = Slett
files-folder-delete-failed = Mappa kunne ikkje slettast

## The pane of a file.

files-name = Namn
files-references = Referansar
files-unassigned = Utan referanse: fila høyrer ikkje til nokon referanse.
files-assign = Gi til ein referanse …
files-assign-title = Gi «{ $name }» til ein referanse
files-assign-failed = Det gjekk ikkje å gi fila til referansen
files-unassign = Ta frå «{ $name }»
files-unassign-failed = Fila kunne ikkje takast frå referansen
files-about = Om fila
files-size = Storleik
files-pages = Sider
# $text is one of the three below.
files-pdf-pages = { $count ->
    [one] { $count } side · { $text }
   *[other] { $count } sider · { $text }
}
files-pdf-has-text = har tekst
files-pdf-no-text = ingen tekst
# Shown as the pages of a PDF that could not be looked at; the reason is what the reading said.
files-pdf-unread = kunne ikkje lesast: { $reason }
files-pdf-some-text = { $count ->
    [one] éi side utan tekst
   *[other] { $count } sider utan tekst
}
files-added = Lagd til
files-origin = Kom frå
files-searchable = Gjer søkbar …
files-read-into = Importer teksten som eit kart …
files-read-text = Les teksten …
files-bring-in = Hent inn som element …
files-rename-failed = Fila kunne ikkje få nytt namn

## Removing.

files-remove = Fjern
files-remove-title = Fjerne «{ $name }» frå biblioteket?
files-remove-message = Fila blir sletta frå lageret til biblioteket.
files-remove-message-assigned = { $count ->
    [one] Fila høyrer til { $names }, som mistar den. Den blir sletta frå lageret til biblioteket.
   *[other] Fila høyrer til { $count } referansar, { $names }, som mistar den. Den blir sletta frå lageret til biblioteket.
}
files-remove-many-title = Fjerne { $count } filer frå biblioteket?
files-remove-many-message = Filene blir sletta frå lageret til biblioteket.
files-remove-many-assigned = { $count ->
    [one] Éi av dei høyrer til ein referanse, som mistar den. Dei blir sletta frå lageret til biblioteket.
   *[other] { $count } av dei høyrer til referansar, som mistar dei. Dei blir sletta frå lageret til biblioteket.
}
files-remove-failed = Fila kunne ikkje fjernast
# Said in the question where removing the files leaves folders empty; folders empty before are not counted.
files-remove-folders-left = { $count ->
    [one] Éi mappe blir tom av det.
   *[other] { $count } mapper blir tomme av det.
}
files-remove-with-folders = Fjern, med dei tomme mappene
files-remove-keep-folders = Fjern, men la mappene stå
files-removing = Fjernar { $count } filer …
files-removed = { $count ->
    [0] Inga fil fjerna
    [one] Éi fil fjerna
   *[other] { $count } filer fjerna
}
files-removed-folders = { $count ->
    [one] éi tom mappe med dei
   *[other] { $count } tomme mapper med dei
}
# When references are deleted: their files go too, unless another reference has them.
files-remove-with-files = Slett med filene

## Choosing a reference.

files-choose-reference = Vel ein referanse
files-choose-search = Søk etter forfattar, tittel eller år
files-choose-references = Referansar
files-choose-none = Ingen referanse har dei orda.
files-choose-empty = Biblioteket har ingen referansar enno.
files-choose-more = … og { $count } til: søk for å finne dei
files-choose-files = Filene i biblioteket
files-choose-files-search = Søk etter namn, eller etter verket ei fil høyrer til
files-choose-files-none = Inga fil svarer til det.
files-choose-add = { $count ->
    [0] Legg til filer
    [one] Legg til éi fil
   *[other] Legg til { $count } filer
}
files-added-to = { $count ->
    [one] Éi fil lagd til «{ $title }»
   *[other] { $count } filer lagde til «{ $title }»
}
files-choose-new = Ny referanse …
files-choose = Vel

## Nothing selected.

files-none-selected = Inga fil vald
files-none-selected-text = Vel ei fil for å sjå kva som er kjent om den, og kva som kan gjerast med den.
# $name is the folder in view, or “All files”.
files-tally = { $name }: { $count ->
    [one] éi fil
   *[other] { $count } filer
}, { $unassigned } utan referanse

## The going-through: files given to their references.

files-go-through-head = Gå gjennom filene, for å gi dei til referansane sine …
files-go-through-chosen = { $count ->
    [one] Gå gjennom den …
   *[other] Gå gjennom desse { $count } …
}
files-go-through-nothing = Kvar fil her høyrer til ein referanse
files-folder-go-through = Gå gjennom filene utan referanse …
# The bar at the head of the files, while files of the folder in view belong to no reference.
files-unassigned-here = { $count ->
    [one] Éi fil her høyrer ikkje til nokon referanse.
   *[other] { $count } filer her høyrer ikkje til nokon referanse.
}
files-unassigned-go = Gå gjennom dei …
files-unassigned-hide = Gøym dette
files-going-title = Gi filene til referansane sine
files-going-subtitle = { $count ->
    [one] Éi fil
   *[other] { $count } filer
}
files-going-finding = { $count ->
    [one] Finn ut kva fila er …
   *[other] Finn ut kva dei { $count } filene er …
}
files-going-progress = { $done } av { $count }: { $name }
files-going-finding-hint = Kvar fil blir lesen etter ein identifikator og ein tittel, namnet blir lese, og den første sida blir samanlikna med biblioteket. Det som blir funne ut, blir hugsa så lenge programmet er ope.
files-going-stop = Stopp
files-going-failed = Det lét seg ikkje finne ut kva filene er
files-going-all-certain = { $count ->
    [one] Den eine som sikkert er funnen:
   *[other] Alle { $count } som sikkert er funne:
}
files-going-all-probable = { $count ->
    [one] Den eine som truleg er funnen:
   *[other] Alle { $count } som truleg er funne:
}
files-going-all-new = { $count ->
    [one] Den eine som er ny, frå tenestene:
   *[other] Alle { $count } som er nye, frå tenestene:
}
files-going-all-nothing = { $count ->
    [one] Den eine der ingenting vart funne:
   *[other] Dei { $count } der ingenting vart funne:
}
files-going-this-new = Ny referanse
files-going-show-all = Vis alle { $count }
files-going-what = Kva { $name } blir
files-going-this = Denne
files-going-other = Ein annan …
files-going-new = Ny referanse …
files-going-later = Seinare
files-going-certain = sikker
files-going-probable = sannsynleg
files-going-which = Kva verk
# $origin is where the description comes from: a service, or the file.
files-going-lookup = Ein ny referanse · frå { $origin }
files-going-nothing = Ingenting funne
files-going-chosen = Vald
files-going-made-here = Laga her
files-going-none = Det gjekk ikkje å gå gjennom nokon av filene.
# The files the going-through did not reach, as when it was stopped: they keep no reference, and the bar offers them again.
files-going-not-reached = { $count ->
    [one] Éi fil vart ikkje sett på. Den blir ståande som den er, til ein annan gong.
   *[other] { $count } filer vart ikkje sette på. Dei blir ståande som dei er, til ein annan gong.
}
files-going-counts = { $assign } å gi til referansar, { $later } til seinare
files-going-done = { $count ->
    [0] Ingenting å gi
    [one] Gi éi fil til referansen sin
   *[other] Gi { $count } filer til referansane sine
}
files-going-applying = Gir filene til referansane sine …
files-going-source = Filene i biblioteket
files-going-assigned = { $count ->
    [0] Inga fil gitt til ein referanse
    [one] Éi fil gitt til ein referanse
   *[other] { $count } filer gitt til referansar
}
files-going-made = { $count ->
    [one] éin ny referanse
   *[other] { $count } nye referansar
}
files-going-later-count = { $count } til seinare
files-going-undo = Angre
files-going-undone = { $count ->
    [0] Inga fil teken tilbake
    [one] Éi fil teken tilbake
   *[other] { $count } filer tekne tilbake
}
files-going-undone-made = { $count ->
    [one] éin ny referanse fjerna
   *[other] { $count } nye referansar fjerna
}
# In the menu of the head of the files, while the last going-through can be undone.
files-undo-last = { $count ->
    [one] Angre: éi fil gitt til referansen sin
   *[other] Angre: { $count } filer gitt til referansane sine
}

## Exporting.

files-export-folder-title = Vel mappa det skal eksporterast til
files-export-title = { $count ->
    [one] Eksporter éi fil
   *[other] Eksporter { $count } filer
}
files-export-all-what = Kvar fil blir skriven til mappa du vel etterpå, under namnet på referansen sin, Forfattar År - Tittel, eller under sitt eige der den ikkje har nokon; mappene i biblioteket blir mapper i den.
files-export-folder-what = Filene i mappa blir skrivne til mappa du vel etterpå, under namna på referansane sine, eller under sine eigne der dei ikkje har nokon; mappene under den blir mapper i den.
files-export-files-what = { $count ->
    [one] Fila blir skriven til mappa du vel etterpå, under namnet på referansen sin, eller under sitt eige der den ikkje har nokon.
   *[other] Filene blir skrivne til mappa du vel etterpå, under namna på referansane sine, eller under sine eigne der dei ikkje har nokon.
}
files-export-bib = Med ei references.bib
files-export-bib-hint = Verka som filene høyrer til, der kvart nemner filene sine der dei blir skrivne, slik at Zotero eller JabRef les heile mappa.
files-export-go = Vel mappa …
files-exporting = { $count ->
    [one] Eksporterer ei fil …
   *[other] Eksporterer { $count } filer …
}
files-exporting-progress = Eksporterer { $done } av { $count }: { $name }
files-exported = { $count ->
    [0] Inga fil eksportert
    [one] Éi fil eksportert
   *[other] { $count } filer eksporterte
}
files-exported-folders = { $count ->
    [one] éi mappe
   *[other] { $count } mapper
}
files-exported-bib = med ei references.bib
files-exported-stopped = stoppa med { $count } att
files-exported-show = Vis
files-export-failed = Filene kunne ikkje eksporterast
files-reveal-failed = Mappa kunne ikkje visast
files-export = Eksporter …
files-export-chosen = Eksporter desse { $count } …
files-export-all = Eksporter alle filene …

## A file shown in a side of the window (2026-10-26).

files-show = Legg til i fanene til eit prosjekt …
files-open-elsewhere = Opne i eit anna program

# One place for files: images are files of the library (ADR 0070).
files-add-images = Legg til bilete …
# After images were taken in to be figures; $name is the first of them.
files-images-taken-in = { $count ->
    [one] «{ $name }» er i biblioteket
   *[other] { $count } bilete er i biblioteket
}

# One place for files, the view (ADR 0070).
files-view = Vising
files-as-list = Liste
files-as-grid = Miniatyrar
files-size-small = Små
files-size-medium = Middels
files-size-large = Store
files-include-subfolders = Ta med undermappene
files-sort-kind = Etter type
# Where a file is used, where it belongs to no reference: as a figure.
files-column-used = Brukt i
files-used-figure = Ein figur i { $project }
files-used-figures = Ein figur i { $count } prosjekt
files-used-nowhere = Ikkje brukt enno
files-pixels-label = Pikslar
files-pixels = { $width } × { $height }
files-alt = Kva det viser, med ord
files-preview-none = Inga førehandsvising for denne typen fil
# Before the name of the file a copy was made from, to be a figure, by editing or to be smaller; the name is a link.
files-made-from = Laga av
# Said when a file that is a figure in projects is to be removed.
files-remove-used = { $count ->
    [one] Den er ein figur i eit prosjekt, som då vil vise ingenting der den stod.
   *[other] Den er ein figur i { $count } prosjekt, som då vil vise ingenting der den stod.
}

# A simple image editor (docs/plans/a-simple-image-editor.md): the copies made from a file, as links.
files-copies = Kopiar laga av den

# The tabs opened, files by their references, a file read in the library (docs/plans/the-tabs-opened-files-by-their-references-and-a-file-read-in-the-library.md).
files-read = Les
files-column-people = Personar
files-column-year = År
files-column-title = Tittel
files-column-publisher = Forlag
files-sort-year = Etter år
files-sort-title = Etter tittel
files-sort-publisher = Etter forlag
# The translators after the authors or editors: "Lord; tr. Smith".
files-translated = oms. { $names }

# Files by their references, named on request, and a menu of projects for the tabs.
files-tabs-no-project = Ingen prosjekt å leggje til i
files-added-to-tabs = Lagd til i fanene til { $project }
files-already-in-tabs = Allereie i fanene til { $project }
files-show-tabs = Vis
files-name-by-reference = Gi namn etter referansen
files-name-by-references = Gi namn etter referansane
files-named = { $count ->
    [one] Éi fil fekk namn etter referansen sin
   *[other] { $count } filer fekk namn etter referansane sine
}
files-named-kept = { $count ->
    [one] Éi fil utan referanse heldt på namnet sitt
   *[other] { $count } filer utan referanse heldt på namna sine
}
files-named-none = Namna var allereie etter referansane
