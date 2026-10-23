# A project: its view, the bar over the map, what is done to elements, and
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
project-unshared-not-removed = Projektet var ikke hentet og kunne ikke fjernes fra projektlisten
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

## The bar over the map: where one is, and what is done with the element in view

# The name of an element that has none.
project-untitled = Uden titel
project-where = Hvor du er
# The small button before the name of the element in view: its parent's name.
project-up = Op
project-up-hint = Op til »{ $name }« · Alt+Skift+Pil op
# The small round button by the element in view, in the diagram and the text: up to the element over it.
project-leave-map = Op til »{ $name }«
project-siblings-hint = Elementerne ved siden af dette: vælg et for at vise det
project-trees-hint = Elementerne under projektet: vælg et for at vise det
project-shown-beside = ved siden af dette
# The owl before the name of the project itself, in the first pane: up to all the projects.
# The sign of a project, read aloud, where it is shared.
project-badge-shared = { $name }, delt af dig
project-badge-joined = { $name }, som du deltager i
# Two projects side by side.
project-beside-failed = Projektet kunne ikke åbnes ved siden af dette
project-beside-no-comments = Kommentarerne er dem fra det projekt, du åbnede: åbn det andet for sig for at kommentere
# A template of the writer's own was saved anew, and the copy of it the project carries could not be made afresh.
project-template-not-renewed = Projektets kopi af skabelonen kunne ikke bringes ajour i det
# Said over the other pane while elements of one project are dragged over it.
project-copy-to-project = Kopiér til »{ $name }«
project-move-to-project = Flyt til »{ $name }«
project-element-name = Elementets navn
project-this-element-actions = Dette element
project-new-element-under = Nyt element under det
project-document-into = Et dokument ind i det…
project-drop-on-map = Slip på et kort for at flytte dertil · hold Ctrl nede for at kopiere
project-open-beside = Åbn ved siden af
project-open-beside-hint = To kort side om side, så elementer kan flyttes mellem dem
project-side-by-side-short = Side om side
project-preview-short = Forhåndsvisning
project-found = Løse kildehenvisninger…
# The count is of those found in the element in view, and under it.
project-found-hint = { $count } at gennemgå og gøre til kildehenvisninger
project-found-none = Og tekst, der ligner kildehenvisninger
project-copied-to = Kopieret til »{ $name }«
project-moved-to = Flyttet til »{ $name }«
project-other-projects = Andre projekter
project-send-failed = Der kunne ikke skrives i »{ $project }«. Intet blev ændret her.
project-send-no-element = Elementet er ikke længere i det projekt.

## What is done to elements, in the diagram and in the text

project-add-under = Tilføj et element under det
project-add = Tilføj et element
project-add-after = Tilføj et element efter det
project-write-text = Skriv dets tekst
project-associate = Knyt til…
project-associate-hint = Klik derefter på det andet element
project-heading = Udskriv navnet som overskrift
project-heading-hint = Fra: navnet er en mærkat til dig; kun teksten udskrives
project-leave-out = Udelad af dokumentet
project-leave-out-hint = Med alt under det
# An element that stands for another element: in the document, that element is in its place.
project-stands-for = Står for »{ $name }«
project-stand-for = Stå for et andet element
project-stand-for-heading = I dokumentet træder dette element i dets sted
project-stand-for-none = Intet
# Copying or moving elements to the project itself, to one of its trees, or to another project.
project-copy-to = Kopiér til
project-cut = Klip
project-cut-not-removed = Det udklippede blev sat ind, men kunne ikke fjernes fra det projekt, det kom fra
project-copy = Kopiér
# Pasting what was copied under the element the menu is of.
project-paste-under = Sæt ind under det
project-move-to = Flyt til
# Opening a dialog with the tree of the project, to choose where the elements go: first in Copy to and Move to.
project-choose-where = Vælg hvor…
# Opening the same dialog, to choose the element this one stands for.
project-choose-element = Vælg et element…
# The title of the dialog that chooses where elements are copied to: the name of the one copied, or how many.
project-pick-copy-title = { $count ->
    [one] Kopiér »{ $name }« til
   *[other] Kopiér { $count } elementer til
}
project-pick-move-title = { $count ->
    [one] Flyt »{ $name }« til
   *[other] Flyt { $count } elementer til
}
project-pick-stand-title = Hvad »{ $name }« står for
# The buttons of the dialog, saying what will be done with the element chosen.
project-pick-copy = Kopiér hertil
project-pick-move = Flyt hertil
project-pick-stand = Stå for dette
project-pick-find = Find et element ved navn
project-pick-none = Intet element har det navn
# Why an element cannot be chosen, when it is hovered.
project-pick-itself = Et element kan ikke flyttes ind i sig selv eller i det, der er under det
project-pick-self = Et element kan ikke stå for sig selv
project-pick-loop = Dokumentet ville indeholde sig selv
project-tidy-branch = Ryd op i denne gren
project-place-automatically = Placer automatisk
project-delete-keeping = Slet, men behold det, der er under det
project-itself-stays = Selve projektet bliver
project-itself-stays-detail = Slet projektet fra forsiden.
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
project-stands-for-map = Står for »{ $name }«
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

## A copy and its original.
copy-title = Kopien og dens original
copy-from = Kopieret fra »{ $name }«
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
copy-copied-from = Kopieret fra »{ $name }«
copy-copied-from-changed = Kopieret fra »{ $name }«, som er ændret siden

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
