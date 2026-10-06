# A project: its view, the tabs of its maps, what is done to elements, and
# the panels at the side with the references and the pictures.

project-list-unreadable = Projektov ni bilo mogoče prebrati

## The view of a project

project-open-failed = Projekta ni bilo mogoče odpreti
# Shown under the words above when nothing more is known of why.
project-open-failed-detail = Projekta ni bilo mogoče odpreti.
project-back = Nazaj na projekte
project-fetching = Prenašanje projekta
project-fetching-offline = Strežnik ni dosegljiv. Projekt se prenese, ko bo mogoče.
project-fetching-on-the-way = Na poti je s strežnika.
project-all-projects = Vsi projekti
project-name = Ime projekta
project-rename = Preimenuj projekt
project-not-saved = Ni shranjeno
project-redo = Uveljavi
project-view = Pogled na miselni vzorec
project-view-this = Pogled na ta miselni vzorec
project-diagram = Diagram
project-text = Besedilo
project-one-at-a-time = Eden naenkrat
project-side-by-side = Dva vzporedno
project-close-side = Zapri to stran
project-references = Viri
project-pictures = Slike
project-side = Viri, slike, zgodovina in spremembe
project-side-tabs = Kaj kaže stranska plošča
project-side-map = Miselni vzorec
project-preview = Predogled in izvoz
project-share = Deli
project-shared = Deljen
project-shared-offline = Deljen · strežnik ni dosegljiv
project-shared-too-large = Deljen · strežnik ne sprejme zadnjih sprememb
project-between-maps = Med obema miselnima vzorcema
project-between-preview = Med miselnim vzorcem in predogledom
project-between-pictures = Med miselnim vzorcem in slikami
project-between-references = Med miselnim vzorcem in viri

## When the sharing ends from the other side

project-unshared = Projekt ni več deljen
project-unshared-this = Ta projekt ni več deljen
project-left-out = Niste več med sodelavci
project-unshared-unfetched = Ni bil prenesen, zato na tem računalniku ni nič od njega.
project-unshared-kept = Tisti, ki ga je delil, ga je vzel s strežnika. Projekt obdržite, kakršen je zdaj, in lahko sami delate naprej.
project-left-out-kept = Projekt obdržite, kakršen je zdaj, in lahko sami delate naprej. Kar drugi napišejo po tem, ne pride do vas.
project-understood = Razumem

## Files dropped on the project

project-drop-picture = Spustite sliko na element, kamor spada
project-cited-in = { $count ->
    [one] Vir je naveden v »{ $name }«
    [two] { $count } vira sta navedena v »{ $name }«
    [few] { $count } viri so navedeni v »{ $name }«
   *[other] { $count } virov je navedenih v »{ $name }«
}
# As above, where the element has no name.
project-cited-in-element = { $count ->
    [one] Vir je naveden v »elementu«
    [two] { $count } vira sta navedena v »elementu«
    [few] { $count } viri so navedeni v »elementu«
   *[other] { $count } virov je navedenih v »elementu«
}

## The tabs of the maps

# The name of a map, or of an element, that has none.
project-untitled = Brez naslova
# The name of a copy of a map.
project-map-copy = { $name }, kopija
project-maps = Miselni vzorci
project-map-name = Ime miselnega vzorca
project-new-map = Nov miselni vzorec
project-map-from-document = Miselni vzorec iz dokumenta…
project-drop-on-map = Spustite na miselni vzorec, da premaknete tja · držite Ctrl za kopiranje
project-duplicate = Podvoji
project-duplicate-hint = Kopija za delo; ta ostane, kakršen je
project-open-beside = Odpri ob strani
project-open-beside-hint = Dva miselna vzorca vzporedno, da premikate elemente med njima
project-this-map-actions = Ta miselni vzorec in miselni vzorci
project-maps-hint = Miselni vzorci projekta: izberite enega, da ga odprete
project-map-beside = ob tem
project-side-by-side-short = Vzporedno
project-preview-short = Predogled
project-found = Najdene navedbe…
# The count is of those found in the map.
project-found-hint = { $count ->
    [one] { $count } za pregled, da iz nje nastane navedba
    [two] { $count } za pregled, da iz njiju nastaneta navedbi
    [few] { $count } za pregled, da iz njih nastanejo navedbe
   *[other] { $count } za pregled, da iz njih nastanejo navedbe
}
project-found-none = In besedilo, ki je videti kot navedbe
project-delete-map = Izbriši miselni vzorec
project-delete-map-title = Izbrisati miselni vzorec »{ $name }«?
project-delete-map-message = { $count ->
    [one] { $count } element in besedilo v njem bosta izginila. To je mogoče razveljaviti, dokler je projekt odprt.
    [two] { $count } elementa in besedilo v njiju bodo izginili. To je mogoče razveljaviti, dokler je projekt odprt.
    [few] { $count } elementi in besedilo v njih bodo izginili. To je mogoče razveljaviti, dokler je projekt odprt.
   *[other] { $count } elementov in besedilo v njih bo izginilo. To je mogoče razveljaviti, dokler je projekt odprt.
}
project-copied-to = Kopirano v »{ $name }«
project-moved-to = Premaknjeno v »{ $name }«

## What is done to elements, in the diagram and in the text

project-add-under = Dodaj element pod njim
project-add = Dodaj element
project-add-after = Dodaj element za njim
project-write-text = Piši njegovo besedilo
project-double-click = Dvoklik
project-associate = Poveži z…
project-associate-hint = Nato kliknite drugi element
project-heading = Natisni ime kot naslov
project-heading-hint = Izključeno: ime je oznaka za vas; natisne se le besedilo
project-leave-out = Izpusti iz dokumenta
project-leave-out-hint = Z vsem, kar je pod njim
# An element that stands for another map: in the document, that map is in its place.
project-stands-for = Stoji za »{ $name }«
project-stand-for = Stoj za drug miselni vzorec
project-stand-for-heading = V dokumentu ta miselni vzorec stopi na njegovo mesto
project-stand-for-none = Noben
project-copy-to-map = Kopiraj v miselni vzorec
project-copy = Kopiraj
# Pasting what was copied under the element the menu is of.
project-paste-under = Prilepi pod njim
project-move-to-map = Premakni v miselni vzorec
project-map-from-branch = Nov miselni vzorec iz te veje
project-map-from-branch-hint = Kopija za delo; ta ostane
project-detach = Odpni od nadrejenega
project-detach-hint = Prost element, ki ga umestite pozneje
project-tidy-branch = Uredi to vejo
project-place-automatically = Umesti samodejno
project-delete-keeping = Izbriši, obdrži pa, kar je pod njim
project-centre-stays = Središče miselnega vzorca ostane
project-centre-stays-detail = Miselni vzorec sam izbrišite z njegovega zavihka.
# One element was deleted, with the elements that were under it.
project-deleted = { $under ->
    [0] »{ $name }« je izbrisan
    [one] »{ $name }« je izbrisan, z { $under } elementom pod njim
    [two] »{ $name }« je izbrisan, z { $under } elementoma pod njim
    [few] »{ $name }« je izbrisan, s { $under } elementi pod njim
   *[other] »{ $name }« je izbrisan, s { $under } elementi pod njim
}
project-deleted-many = { $count ->
    [one] { $count } element izbrisan
    [two] { $count } elementa izbrisana
    [few] { $count } elementi izbrisani
   *[other] { $count } elementov izbrisanih
}

project-delete-busy-title = Nekdo piše tukaj
# $names: those who are at what would be deleted, as a list.
project-delete-busy-message = { $names } { $count ->
    [one] dela
    [two] delata
    [few] delajo
   *[other] delajo
} v tem, kar bi bilo izbrisano. Kar se tam zdaj piše, bi bilo izgubljeno z njim in tega ne bi bilo mogoče vrniti.
project-delete-busy-confirm = Vseeno izbriši

## An element, open for writing, and as it is shown when the pointer rests on it

project-element = Element
project-name-placeholder = Ime
project-write-here = Pišite tukaj. Vtipkajte @, da navedete.
project-words = { $count ->
    [one] { $count } beseda
    [two] { $count } besedi
    [few] { $count } besede
   *[other] { $count } besed
}
project-read-on = Dvokliknite za branje naprej
project-stands-for-map = Stoji za miselni vzorec »{ $name }«
project-name-not-printed = Ime se ne natisne
project-left-out-of-document = Izpuščen iz dokumenta

## The panels at the side: the references and the pictures

project-this-map = Ta miselni vzorec
project-project = Projekt
project-library = Knjižnica
project-nothing-found = Nič ni najdeno
project-edit-reference = Uredi vir…
project-new-reference = Nov vir
project-import-file = Uvozi datoteko
project-which-references = Kateri viri
project-search-references = Išči vire
project-library-empty = Vaša knjižnica je prazna
project-library-empty-hint = Dodajte vir ali uvozite tiste, ki jih imate.
project-no-references = Še ni virov
project-no-references-hint = Kar navajate med pisanjem, je navedeno tu. Da navedete, izberite Navedi nad besedilom ali vtipkajte @.
project-cited-in-heading = Naveden v
project-not-cited = V tem projektu ni naveden.
project-references-drag = Povlecite vir v besedilo, da ga navedete tam, ali na element, da ga navedete na koncu njegovega besedila.
# The count is of the references the project cites that the library lacks.
project-references-foreign = { $count ->
    [one] { $count } v tem projektu ni v vaši knjižnici.
    [two] { $count } v tem projektu nista v vaši knjižnici.
    [few] { $count } v tem projektu niso v vaši knjižnici.
   *[other] { $count } v tem projektu ni v vaši knjižnici.
}
# The store of pictures.
project-store = Shramba
project-open-picture = Odpri…
project-put-into-text = Vstavi v besedilo
project-add-pictures = Dodaj slike iz datotek
project-which-pictures = Katere slike
project-search-pictures = Išči slike
project-a-picture = Slika
project-with-notes = Z zapiski
project-not-on-computer = Ni na tem računalniku
project-nothing-said = O njej še ni nič povedano
project-store-empty = Shramba je prazna
project-store-empty-hint = Dodajte slike iz datotek ali jih spustite na besedilo.
project-no-pictures = Še ni slik
project-no-pictures-map = Slike ilustracij tega miselnega vzorca so navedene tu. Tiste iz shrambe so pod Shramba.
project-no-pictures-project = Slike ilustracij projekta so navedene tu. Tiste iz shrambe so pod Shramba.
project-pictures-drag = Povlecite sliko v besedilo, da tam nastane ilustracija, ali na element, da jo postavite na konec njegovega besedila.
# The count is of the pictures that are used and are not in the store of this computer.
project-pictures-absent-map = { $count ->
    [one] { $count } v tem miselnem vzorcu ni na tem računalniku.
    [two] { $count } v tem miselnem vzorcu nista na tem računalniku.
    [few] { $count } v tem miselnem vzorcu niso na tem računalniku.
   *[other] { $count } v tem miselnem vzorcu ni na tem računalniku.
}
project-pictures-absent-project = { $count ->
    [one] { $count } v tem projektu ni na tem računalniku.
    [two] { $count } v tem projektu nista na tem računalniku.
    [few] { $count } v tem projektu niso na tem računalniku.
   *[other] { $count } v tem projektu ni na tem računalniku.
}

## Shared by the diagram and the text

# A count of elements that stands alone, as a label of what is dragged.
project-elements = { $count ->
    [one] { $count } element
    [two] { $count } elementa
    [few] { $count } elementi
   *[other] { $count } elementov
}
# One of the others who work on a shared project is at an element.
project-other-here = { $name } je tukaj
project-link-placeholder = Kako sta povezana
project-link-label = Oznaka povezave

## A copy and its original, in another map.
copy-title = Kopija in njen izvirnik
copy-from = Kopirano iz »{ $name }« v miselnem vzorcu »{ $map }«
copy-original-changed = Izvirnik se je spremenil, odkar je bil kopiran ali odkar je bilo to nazadnje videno.
copy-original-same = Izvirnik je, kakršen je bil ob kopiranju.
copy-original-unknown = Ali se je izvirnik spremenil, odkar je bil kopiran, ni znano: kopija je bila narejena, preden se je to hranilo.
copy-original-gone = Izvirnika ni več.
copy-how-shown = Spodaj je prečrtano, kar ima le izvirnik, in označeno, kar ima le ta kopija.
copy-alike = Njuni imeni in besedili sta enaki. Razlikujeta se lahko v tem, kar ni beseda: navedbe, slike, oznake.
copy-only-original = Le v izvirniku
copy-only-copy = Le v tej kopiji
copy-go = Pojdi na izvirnik
copy-seen = Obdrži to kopijo, kakršna je
copy-take = Vzemi ime in besedilo izvirnika
copy-changed-mark = Izvirnik se je spremenil, odkar je bilo to kopirano
copy-compare = Primerjaj z izvirnikom…
copy-copied-from = Kopirano iz »{ $name }« v »{ $map }«
copy-copied-from-changed = Kopirano iz »{ $name }« v »{ $map }«, ki se je od takrat spremenil

## How far the writing of an element has come, as its writer says.
status = Stanje
status-idea = Zamisel
status-draft = Osnutek
status-done = Končano
status-none = Brez stanja
# Of an element, where its status is shown: "Draft · 340 words".
status-of = { $status } · { $count ->
    [one] { $count } beseda
    [two] { $count } besedi
    [few] { $count } besede
   *[other] { $count } besed
}
status-count-idea = { $count ->
    [one] { $count } zamisel
    [two] { $count } zamisli
    [few] { $count } zamisli
   *[other] { $count } zamisli
}
status-count-draft = { $count ->
    [one] { $count } osnutek
    [two] { $count } osnutka
    [few] { $count } osnutki
   *[other] { $count } osnutkov
}
status-count-done = { $count } končanih
# The words of the drafts and of what is done, in a map.
status-words-written = { $count ->
    [one] { $count } beseda napisana
    [two] { $count } besedi napisani
    [few] { $count } besede napisane
   *[other] { $count } besed napisanih
}
status-progress = Kako daleč je miselni vzorec
