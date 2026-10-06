# A project: its view, the tabs of its maps, what is done to elements, and
# the panels at the side with the references and the pictures.

project-list-unreadable = Projekterne kunne ikke læses

## The view of a project

project-open-failed = Projektet kunne ikke åbnes
# Shown under the words above when nothing more is known of why.
project-open-failed-detail = Projektet kunne ikke åbnes.
project-back = Tilbage til projekterne
project-fetching = Henter projektet
project-fetching-offline = Serveren kan ikke nås. Projektet hentes, når det kan lade sig gøre.
project-fetching-on-the-way = Det er på vej fra serveren.
project-all-projects = Alle projekter
project-name = Projektets navn
project-rename = Omdøb projektet
project-not-saved = Ikke gemt
project-redo = Gentag
project-view = Visning af kortet
project-view-this = Visning af dette kort
project-diagram = Diagram
project-text = Tekst
project-one-at-a-time = Ét ad gangen
project-side-by-side = To side om side
project-close-side = Luk denne side
project-references = Referencer
project-pictures = Billeder
project-side = Referencer, billeder, historik og ændringer
project-side-tabs = Hvad sidepanelet viser
project-side-map = Kort
project-preview = Forhåndsvisning og eksport
project-share = Del
project-shared = Delt
project-shared-offline = Delt · serveren kan ikke nås
project-shared-too-large = Delt · serveren tager ikke imod de seneste ændringer
project-between-maps = Mellem de to kort
project-between-preview = Mellem kortet og forhåndsvisningen
project-between-pictures = Mellem kortet og billederne
project-between-references = Mellem kortet og referencerne

## When the sharing ends from the other side

project-unshared = Projektet deles ikke længere
project-unshared-this = Dette projekt deles ikke længere
project-left-out = Du er ikke længere blandt deltagerne
project-unshared-unfetched = Det var ikke hentet, så der er intet af det på denne computer.
project-unshared-kept = Den, der delte det, har taget det af serveren. Du beholder projektet, som det er nu, og kan arbejde videre på det på egen hånd.
project-left-out-kept = Du beholder projektet, som det er nu, og kan arbejde videre på det på egen hånd. Det, de andre skriver efter dette, når ikke frem til dig.
project-understood = Forstået

## Files dropped on the project

project-drop-picture = Slip et billede på det element, det hører til
project-cited-in = { $count ->
    [one] Referencen er citeret i »{ $name }«
   *[other] { $count } referencer er citeret i »{ $name }«
}
# As above, where the element has no name.
project-cited-in-element = { $count ->
    [one] Referencen er citeret i elementet
   *[other] { $count } referencer er citeret i elementet
}

## The tabs of the maps

# The name of a map, or of an element, that has none.
project-untitled = Uden titel
# The name of a copy of a map.
project-map-copy = { $name }, kopi
project-maps = Kort
project-map-name = Kortets navn
project-new-map = Nyt kort
project-map-from-document = Et kort af et dokument…
project-drop-on-map = Slip på et kort for at flytte dertil · hold Ctrl nede for at kopiere
project-duplicate = Dupliker
project-duplicate-hint = En kopi at arbejde på; dette bliver, som det er
project-open-beside = Åbn ved siden af
project-open-beside-hint = To kort side om side, så elementer kan flyttes mellem dem
project-this-map-actions = Dette kort, og kortene
project-maps-hint = Projektets kort: vælg et for at åbne det
project-map-beside = ved siden af dette
project-side-by-side-short = Side om side
project-preview-short = Forhåndsvisning
project-found = Fundne kildehenvisninger…
# The count is of those found in the map.
project-found-hint = { $count } at gennemgå og gøre til kildehenvisninger
project-found-none = Og tekst, der ligner kildehenvisninger
project-delete-map = Slet kortet
project-delete-map-title = Slet kortet »{ $name }«?
project-delete-map-message = { $count ->
    [one] { $count } element og teksten i det forsvinder. Det kan fortrydes, så længe projektet er åbent.
   *[other] { $count } elementer og teksten i dem forsvinder. Det kan fortrydes, så længe projektet er åbent.
}
project-copied-to = Kopieret til »{ $name }«
project-moved-to = Flyttet til »{ $name }«

## What is done to elements, in the diagram and in the text

project-add-under = Tilføj et element under det
project-add = Tilføj et element
project-add-after = Tilføj et element efter det
project-write-text = Skriv dets tekst
project-double-click = Dobbeltklik
project-associate = Knyt til…
project-associate-hint = Klik derefter på det andet element
project-heading = Udskriv navnet som overskrift
project-heading-hint = Fra: navnet er en mærkat til dig; kun teksten udskrives
project-leave-out = Udelad af dokumentet
project-leave-out-hint = Med alt under det
# An element that stands for another map: in the document, that map is in its place.
project-stands-for = Står for »{ $name }«
project-stand-for = Stå for et andet kort
project-stand-for-heading = I dokumentet træder dette kort i dets sted
project-stand-for-none = Intet
project-copy-to-map = Kopiér til kort
project-copy = Kopiér
# Pasting what was copied under the element the menu is of.
project-paste-under = Sæt ind under det
project-move-to-map = Flyt til kort
project-map-from-branch = Nyt kort af denne gren
project-map-from-branch-hint = En kopi at arbejde på; denne bliver
project-detach = Løsn fra elementet over det
project-detach-hint = Et løst element, som kan placeres senere
project-tidy-branch = Ryd op i denne gren
project-place-automatically = Placer automatisk
project-delete-keeping = Slet, men behold det, der er under det
project-centre-stays = Midten af et kort bliver
project-centre-stays-detail = Slet selve kortet fra dets fane.
# One element was deleted, with the elements that were under it.
project-deleted = { $under ->
    [0] »{ $name }« blev slettet
    [one] »{ $name }« blev slettet, med { $under } element under det
   *[other] »{ $name }« blev slettet, med { $under } elementer under det
}
project-deleted-many = { $count ->
    [one] { $count } element slettet
   *[other] { $count } elementer slettet
}

project-delete-busy-title = Nogen skriver her
# $names: those who are at what would be deleted, as a list.
project-delete-busy-message = { $names } { $count ->
    [one] er
   *[other] er
} i gang i det, der ville blive slettet. Det, der skrives der nu, ville gå tabt med det og kan ikke hentes tilbage.
project-delete-busy-confirm = Slet alligevel

## An element, open for writing, and as it is shown when the pointer rests on it

project-element = Element
project-name-placeholder = Navn
project-write-here = Skriv her. Skriv @ for at henvise.
project-words = { $count ->
    [one] { $count } ord
   *[other] { $count } ord
}
project-read-on = Dobbeltklik for at læse videre
project-stands-for-map = Står for kortet »{ $name }«
project-name-not-printed = Navnet udskrives ikke
project-left-out-of-document = Udeladt af dokumentet

## The panels at the side: the references and the pictures

project-this-map = Dette kort
project-project = Projekt
project-library = Bibliotek
project-nothing-found = Intet fundet
project-edit-reference = Rediger referencen…
project-new-reference = Ny reference
project-import-file = Importer en fil
project-which-references = Hvilke referencer
project-search-references = Søg i referencerne
project-library-empty = Dit bibliotek er tomt
project-library-empty-hint = Tilføj en reference, eller importer dem, du har.
project-no-references = Ingen referencer endnu
project-no-references-hint = Det, du henviser til, mens du skriver, står her. For at henvise skal du vælge Henvis over teksten eller skrive @.
project-cited-in-heading = Citeret i
project-not-cited = Ikke citeret i dette projekt.
project-references-drag = Træk en reference ind i en tekst for at henvise til den dér, eller hen på et element for at henvise til den sidst i dets tekst.
# The count is of the references the project cites that the library lacks.
project-references-foreign = { $count ->
    [one] { $count } i dette projekt er ikke i dit bibliotek.
   *[other] { $count } i dette projekt er ikke i dit bibliotek.
}
# The store of pictures.
project-store = Billedlager
project-open-picture = Åbn…
project-put-into-text = Sæt det ind i teksten
project-add-pictures = Tilføj billeder fra filer
project-which-pictures = Hvilke billeder
project-search-pictures = Søg i billederne
project-a-picture = Et billede
project-with-notes = Med notater
project-not-on-computer = Ikke på denne computer
project-nothing-said = Der er intet sagt om det endnu
project-store-empty = Billedlageret er tomt
project-store-empty-hint = Tilføj billeder fra filer, eller slip dem på en tekst.
project-no-pictures = Ingen billeder endnu
project-no-pictures-map = Billederne i dette korts figurer står her. Billedlagerets står under Billedlager.
project-no-pictures-project = Billederne i projektets figurer står her. Billedlagerets står under Billedlager.
project-pictures-drag = Træk et billede ind i en tekst for at lave en figur af det dér, eller hen på et element for at sætte det sidst i dets tekst.
# The count is of the pictures that are used and are not in the store of this computer.
project-pictures-absent-map = { $count ->
    [one] { $count } i dette kort er ikke på denne computer.
   *[other] { $count } i dette kort er ikke på denne computer.
}
project-pictures-absent-project = { $count ->
    [one] { $count } i dette projekt er ikke på denne computer.
   *[other] { $count } i dette projekt er ikke på denne computer.
}

## Shared by the diagram and the text

# A count of elements that stands alone, as a label of what is dragged.
project-elements = { $count ->
    [one] { $count } element
   *[other] { $count } elementer
}
# One of the others who work on a shared project is at an element.
project-other-here = { $name } er her
project-link-placeholder = Hvordan de hænger sammen
project-link-label = Associationens mærkat

## A copy and its original, in another map.
copy-title = Kopien og dens original
copy-from = Kopieret fra »{ $name }« i kortet »{ $map }«
copy-original-changed = Originalen er ændret, siden den blev kopieret, eller siden det sidst blev set.
copy-original-same = Originalen er, som den var, da den blev kopieret.
copy-original-unknown = Om originalen er ændret, siden den blev kopieret, vides ikke: kopien blev lavet, før det blev gemt.
copy-original-gone = Originalen er der ikke længere.
copy-how-shown = Nedenfor står det, kun originalen har, gennemstreget, og det, kun denne kopi har, markeret.
copy-alike = Deres navne og tekster er ens. De kan være forskellige i det, der ikke er ord: kildehenvisninger, billeder, mærker.
copy-only-original = Kun i originalen
copy-only-copy = Kun i denne kopi
copy-go = Gå til originalen
copy-seen = Behold denne kopi, som den er
copy-take = Tag originalens navn og tekst
copy-changed-mark = Originalen er ændret, siden dette blev kopieret
copy-compare = Sammenlign med originalen…
copy-copied-from = Kopieret fra »{ $name }« i »{ $map }«
copy-copied-from-changed = Kopieret fra »{ $name }« i »{ $map }«, som er ændret siden

## How far the writing of an element has come, as its writer says.
status = Status
status-idea = Idé
status-draft = Udkast
status-done = Færdig
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
    [one] { $count } udkast
   *[other] { $count } udkast
}
status-count-done = { $count ->
    [one] { $count } færdigt
   *[other] { $count } færdige
}
# The words of the drafts and of what is done, in a map.
status-words-written = { $count ->
    [one] { $count } ord skrevet
   *[other] { $count } ord skrevet
}
status-progress = Hvor langt kortet er kommet
