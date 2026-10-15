# Filene i biblioteket: et eget lager ved siden av bildene, i egne mapper,
# der hver fil hører til ingen, én eller flere referanser. Visningen står
# der biblioteket står.

files-title = Filene i biblioteket
files-all = Alle filer
files-file = Fil
files-unread = Filene i biblioteket kunne ikke leses
files-count = { $count ->
    [one] { $count } fil
   *[other] { $count } filer
}
files-shown-of = { $shown } av { $count ->
    [one] { $count } fil
   *[other] { $count } filer
}
files-selected-of = { $selected } valgt av { $count }
files-selected = { $count ->
    [one] { $count } fil valgt
   *[other] { $count } filer valgt
}

## Slags filer.

files-kind = Slag
files-kind-pdf = PDF
files-kind-picture = Bilde
files-kind-document = Dokument
files-kind-other = Annen fil

## Ta inn.

files-add = Legg til filer …
files-add-title = Legg til filer i biblioteket
files-add-folder = Legg til en mappe …
files-add-folder-hint = Med mappene i den
files-add-folder-title = Legg til en mappe i biblioteket
files-more = Flere måter å legge til på
files-taking-in = { $count ->
    [one] Tar inn en fil …
   *[other] Tar inn { $count } filer og mapper …
}
files-taking-in-progress = Tar inn { $done } av { $count }: { $name }
files-taken-in = { $count ->
    [one] Én fil tatt inn
   *[other] { $count } filer tatt inn
}
files-same = { $count } fantes fra før
files-folders-made = { $count ->
    [one] én mappe laget
   *[other] { $count } mapper laget
}
files-problems = { $count ->
    [one] én kunne ikke leses
   *[other] { $count } kunne ikke leses
}
files-taken-none = Ingenting ble tatt inn
files-take-in-failed = Filene kunne ikke tas inn

## Tomt, søkt og filtrert.

files-empty = Ingen filer ennå
files-empty-text = Legg til filer eller en mappe, eller slipp dem her. Alle slags filer tas vare på, i bibliotekets eget lager, og en mappe beholder mappene i den.
files-folder-empty = Ingenting i denne mappen
files-folder-empty-text = Slipp filer her, eller dra dem hit fra en annen mappe.
files-search = Søk i filene
files-search-in = Søk i { $name }
files-search-clear = Tøm søket
files-nothing-found = Ingenting funnet
files-nothing-found-text = Ingen fil har de ordene i navnet sitt eller i referansen sin.
files-nothing-passes = Ingen fil her slipper gjennom filtrene.
files-filters = Filtrer
files-filters-on = { $count ->
    [one] Filtrer: ett er på
   *[other] Filtrer: { $count } er på
}
files-filter-kind = Slag
files-filter-all = Alle slag
files-filter-pdf = PDF-er
files-filter-picture = Bilder
files-filter-document = Dokumenter
files-filter-other = Andre filer
files-filter-unassigned = Bare dem uten referanse
files-filter-below = Med mappene under
files-filter-search-all = Søk i alle mapper
files-filter-clear = Fjern filtrene
files-sort = Sorter
files-sort-name = Etter navn
files-sort-reference = Etter referanse
files-sort-added = Etter dato lagt til
files-sort-size = Etter størrelse
files-sort-descending = Synkende

## Listen.

files-no-reference = Ingen referanse
files-missing = mangler
files-open = Åpne
files-reveal = Vis i filbehandleren
files-move = Flytt …
files-move-to = Flytt til
files-move-failed = Filen kunne ikke flyttes
files-at-top = Øverst, i ingen mappe

## Mapper.

files-folders = Mapper
files-folders-hint = Mapper holder orden på filene: ett sted for hver fil. En mappe som legges til, beholder mappene i den.
files-folder = Mappe
files-folder-new = Ny mappe
files-folder-new-in = Ny mappe i { $name }
files-folder-new-inside = Ny mappe inni
files-folder-name = Navnet på mappen
files-folder-name-failed = Mappen kunne ikke få navn
files-folder-move-to = Flytt til
files-folder-to-top = Til øverst
files-folder-move-failed = Mappen kunne ikke flyttes
files-folder-expand = Åpne
files-folder-collapse = Lukk
files-folder-delete = Slett mappen
files-folder-delete-title = Slette mappen «{ $name }»?
files-folder-delete-message = { $count ->
    [0] Mappene i den flyttes opp dit den var.
    [one] Filen og mappene i den flyttes opp dit den var. Ingen fil slettes.
   *[other] De { $count } filene og mappene i den flyttes opp dit den var. Ingen fil slettes.
}
files-folder-delete-failed = Mappen kunne ikke slettes

## Ruten til en fil.

files-name = Navn
files-references = Referanser
files-unassigned = Uten referanse: filen hører ikke til noen referanse.
files-assign = Gi til en referanse …
files-assign-title = Gi «{ $name }» til en referanse
files-assign-failed = Filen kunne ikke gis til referansen
files-unassign = Ta fra «{ $name }»
files-unassign-failed = Filen kunne ikke tas fra referansen
files-about = Om filen
files-size = Størrelse
files-pages = Sider
files-pdf-pages = { $count ->
    [one] { $count } side · { $text }
   *[other] { $count } sider · { $text }
}
files-pdf-has-text = har tekst
files-pdf-no-text = ingen tekst
files-pdf-some-text = { $count ->
    [one] én side uten tekst
   *[other] { $count } sider uten tekst
}
files-added = Lagt til
files-origin = Kom fra
files-searchable = Gjør søkbar …
files-read-into = Les inn som elementer …
files-read-text = Les teksten …
files-to-pictures = Ta inn blant bildene
files-to-pictures-done = «{ $name }» er nå blant bildene
files-to-pictures-show = Vis
files-to-pictures-failed = Bildet kunne ikke tas inn blant bildene
files-bring-in = Hent inn som elementer …
files-rename-failed = Filen kunne ikke få nytt navn

## Fjerne.

files-remove = Fjern
files-remove-title = Fjerne «{ $name }» fra biblioteket?
files-remove-message = Filen slettes fra bibliotekets lager.
files-remove-message-assigned = { $count ->
    [one] Filen hører til { $names }, som mister den. Den slettes fra bibliotekets lager.
   *[other] Filen hører til { $count } referanser, { $names }, som mister den. Den slettes fra bibliotekets lager.
}
files-remove-many-title = Fjerne { $count } filer fra biblioteket?
files-remove-many-message = Filene slettes fra bibliotekets lager.
files-remove-many-assigned = { $count ->
    [one] Én av dem hører til en referanse, som mister den. De slettes fra bibliotekets lager.
   *[other] { $count } av dem hører til referanser, som mister dem. De slettes fra bibliotekets lager.
}
files-remove-failed = Filen kunne ikke fjernes
files-remove-with-files = Slett med filene

## Velge en referanse.

files-choose-reference = Velg en referanse
files-choose-search = Søk etter forfatter, tittel eller år
files-choose-references = Referanser
files-choose-none = Ingen referanse har de ordene.
files-choose-empty = Biblioteket har ingen referanser ennå.
files-choose-more = … og { $count } til: søk for å finne dem
files-choose-new = Ny referanse …
files-choose = Velg

## Ingenting valgt.

files-none-selected = Ingen fil valgt
files-none-selected-text = Velg en fil for å se hva som er kjent om den, og hva som kan gjøres med den.
files-tally = { $name }: { $count ->
    [one] én fil
   *[other] { $count } filer
}, { $unassigned } uten referanse

## Gjennomgangen: filer gitt til referansene sine.

files-go-through-head = Gå gjennom filene, for å gi dem til referansene sine …
files-go-through-chosen = { $count ->
    [one] Gå gjennom den …
   *[other] Gå gjennom disse { $count } …
}
files-go-through-nothing = Hver fil her hører til en referanse
files-folder-go-through = Gå gjennom filene uten referanse …
# The bar at the head of the files, while files of the folder in view belong to no reference.
files-unassigned-here = { $count ->
    [one] Én fil her hører ikke til noen referanse.
   *[other] { $count } filer her hører ikke til noen referanse.
}
files-unassigned-go = Gå gjennom dem …
files-unassigned-hide = Skjul dette
files-going-title = Gi filene til referansene sine
files-going-subtitle = { $count ->
    [one] Én fil
   *[other] { $count } filer
}
files-going-finding = { $count ->
    [one] Finner ut hva filen er …
   *[other] Finner ut hva de { $count } filene er …
}
files-going-progress = { $done } av { $count }: { $name }
files-going-finding-hint = Hver fil leses etter en identifikator og en tittel, navnet leses, og første side sammenlignes med biblioteket. Det som blir funnet ut, huskes så lenge programmet er åpent.
files-going-stop = Stopp
files-going-failed = Det lot seg ikke finne ut hva filene er
files-going-all-certain = { $count ->
    [one] Den ene som er funnet sikkert:
   *[other] Alle { $count } som er funnet sikkert:
}
files-going-all-probable = { $count ->
    [one] Den ene som er funnet som sannsynlig:
   *[other] Alle { $count } som er funnet som sannsynlige:
}
files-going-what = Hva { $name } blir
files-going-this = Denne
files-going-other = En annen …
files-going-new = Ny referanse …
files-going-later = Senere
files-going-certain = sikker
files-going-probable = sannsynlig
files-going-which = Hvilket verk
files-going-lookup = En ny referanse · fra { $origin }
files-going-nothing = Ingenting funnet
files-going-chosen = Valgt
files-going-made-here = Laget her
files-going-none = Ingen av filene kunne gås gjennom.
files-going-counts = { $assign } å gi bort, { $later } senere
files-going-done = Ferdig
files-going-applying = Gir filene til referansene sine …
files-going-source = Filene i biblioteket
files-going-assigned = { $count ->
    [0] Ingen fil gitt til en referanse
    [one] Én fil gitt til en referanse
   *[other] { $count } filer gitt til referanser
}
files-going-made = { $count ->
    [one] én ny referanse
   *[other] { $count } nye referanser
}
files-going-later-count = { $count } til senere

## Eksportere.

files-export-folder-title = Velg mappen det skal eksporteres til
files-export-title = { $count ->
    [one] Eksporter én fil
   *[other] Eksporter { $count } filer
}
files-export-all-what = Hver fil skrives til mappen du velger etterpå, under navnet på referansen sin, Forfatter År - Tittel, eller sitt eget der den ikke har noen; mappene i biblioteket blir mapper i den.
files-export-folder-what = Filene i mappen skrives til mappen du velger etterpå, under navnene på referansene sine, eller sine egne der de ikke har noen; mappene under den blir mapper i den.
files-export-files-what = { $count ->
    [one] Filen skrives til mappen du velger etterpå, under navnet på referansen sin, eller sitt eget der den ikke har noen.
   *[other] Filene skrives til mappen du velger etterpå, under navnene på referansene sine, eller sine egne der de ikke har noen.
}
files-export-bib = Med en references.bib
files-export-bib-hint = Verkene filene hører til, der hvert nevner filene sine der de skrives, slik at Zotero eller JabRef leser mappen hel.
files-export-go = Velg mappen …
files-exporting = { $count ->
    [one] Eksporterer en fil …
   *[other] Eksporterer { $count } filer …
}
files-exporting-progress = Eksporterer { $done } av { $count }: { $name }
files-exported = { $count ->
    [0] Ingen fil eksportert
    [one] Én fil eksportert
   *[other] { $count } filer eksportert
}
files-exported-folders = { $count ->
    [one] én mappe
   *[other] { $count } mapper
}
files-exported-bib = med en references.bib
files-exported-stopped = stoppet med { $count } igjen
files-exported-show = Vis
files-export-failed = Filene kunne ikke eksporteres
files-reveal-failed = Mappen kunne ikke vises
files-export = Eksporter …
files-export-chosen = Eksporter disse { $count } …
files-export-all = Eksporter alle filene …
