# A project: its view, the tabs of its maps, what is done to elements, and
# the panels at the side with the references and the pictures.

project-list-unreadable = Projekty sa nepodarilo prečítať

## The view of a project

project-open-failed = Projekt sa nepodarilo otvoriť
# Shown under the words above when nothing more is known of why.
project-open-failed-detail = Projekt sa nepodarilo otvoriť.
project-back = Späť na projekty
project-fetching = Sťahuje sa projekt
project-fetching-offline = Server je nedostupný. Projekt sa stiahne, keď to bude možné.
project-fetching-on-the-way = Je na ceste zo servera.
project-all-projects = Všetky projekty
project-name = Názov projektu
project-rename = Premenovať projekt
project-not-saved = Neuložené
project-redo = Znova
project-view = Zobrazenie mapy
project-view-this = Zobrazenie tejto mapy
project-diagram = Diagram
project-text = Text
project-one-at-a-time = Po jednej
project-side-by-side = Dve vedľa seba
project-close-side = Zavrieť túto stranu
project-references = Záznamy
project-pictures = Obrázky
project-side = Záznamy, obrázky, história a zmeny
project-side-tabs = Čo bočný panel zobrazuje
project-side-map = Mapa
project-preview = Náhľad a export
project-share = Zdieľať
project-shared = Zdieľaný
project-shared-offline = Zdieľaný · server je nedostupný
project-shared-too-large = Zdieľaný · server neprijíma najnovšie zmeny
project-between-maps = Medzi dvoma mapami
project-between-preview = Medzi mapou a náhľadom
project-between-pictures = Medzi mapou a obrázkami
project-between-references = Medzi mapou a záznamami

## When the sharing ends from the other side

project-unshared = Projekt už nie je zdieľaný
project-unshared-this = Tento projekt už nie je zdieľaný
project-left-out = Už nie ste medzi spolupracovníkmi
project-unshared-unfetched = Nebol stiahnutý, takže z neho v tomto počítači nič nie je.
project-unshared-kept = Ten, kto ho zdieľal, ho zo servera stiahol. Projekt si ponecháte, aký je teraz, a môžete na ňom pracovať ďalej sami.
project-left-out-kept = Projekt si ponecháte, aký je teraz, a môžete na ňom pracovať ďalej sami. Čo ostatní napíšu odteraz, k vám nepríde.
project-understood = Rozumiem

## Files dropped on the project

project-drop-picture = Pustite obrázok na prvok, ku ktorému patrí
project-cited-in = { $count ->
    [one] Záznam je citovaný v „{ $name }“
    [few] { $count } záznamy sú citované v „{ $name }“
   *[other] { $count } záznamov je citovaných v „{ $name }“
}
# As above, where the element has no name.
project-cited-in-element = { $count ->
    [one] Záznam je citovaný v „prvku“
    [few] { $count } záznamy sú citované v „prvku“
   *[other] { $count } záznamov je citovaných v „prvku“
}

## The tabs of the maps

# The name of a map, or of an element, that has none.
project-untitled = Bez názvu
# The name of a copy of a map.
project-map-copy = { $name }, kópia
project-maps = Mapy
project-map-name = Názov mapy
project-new-map = Nová mapa
project-map-from-document = Mapa z dokumentu…
project-drop-on-map = Pustite na mapu, aby sa tam presunulo · s Ctrl sa skopíruje
project-duplicate = Duplikovať
project-duplicate-hint = Kópia na prácu; táto ostane, ako je
project-open-beside = Otvoriť vedľa
project-open-beside-hint = Dve mapy vedľa seba, na presúvanie prvkov medzi nimi
project-this-map-actions = Táto mapa a mapy
project-maps-hint = Mapy projektu: vyberte jednu a otvorí sa
project-map-beside = vedľa tejto
project-side-by-side-short = Vedľa seba
project-preview-short = Náhľad
project-found = Nájdené citácie…
# The count is of those found in the map.
project-found-hint = { $count ->
    [one] Treba prejsť { $count } a urobiť z nej citáciu
    [few] Treba prejsť { $count } a urobiť z nich citácie
   *[other] Treba prejsť { $count } a urobiť z nich citácie
}
project-found-none = A text, ktorý vyzerá ako citácie
project-delete-map = Odstrániť mapu
project-delete-map-title = Odstrániť mapu „{ $name }“?
project-delete-map-message = { $count ->
    [one] { $count } prvok a text v ňom zmizne. Kým je projekt otvorený, dá sa to vrátiť.
    [few] { $count } prvky a text v nich zmiznú. Kým je projekt otvorený, dá sa to vrátiť.
   *[other] { $count } prvkov a text v nich zmizne. Kým je projekt otvorený, dá sa to vrátiť.
}
project-copied-to = Skopírované do „{ $name }“
project-moved-to = Presunuté do „{ $name }“

## What is done to elements, in the diagram and in the text

project-add-under = Pridať prvok pod neho
project-add = Pridať prvok
project-add-after = Pridať prvok za neho
project-write-text = Písať jeho text
project-double-click = Dvojklik
project-associate = Spojiť s…
project-associate-hint = Potom kliknite na druhý prvok
project-heading = Tlačiť názov ako nadpis
project-heading-hint = Vypnuté: názov je štítok pre vás; tlačí sa len text
project-leave-out = Vynechať z dokumentu
project-leave-out-hint = So všetkým pod ním
# An element that stands for another map: in the document, that map is in its place.
project-stands-for = Zastupuje „{ $name }“
project-stand-for = Zastupovať inú mapu
project-stand-for-heading = V dokumente stojí na jeho mieste táto mapa
project-stand-for-none = Žiadna
project-copy-to-map = Kopírovať do mapy
project-copy = Kopírovať
# Pasting what was copied under the element the menu is of.
project-paste-under = Prilepiť pod neho
project-move-to-map = Presunúť do mapy
project-map-from-branch = Nová mapa z tejto vetvy
project-map-from-branch-hint = Kópia na prácu; táto ostane
project-detach = Odpojiť od rodiča
project-detach-hint = Voľný prvok, ktorý sa umiestni neskôr
project-tidy-branch = Upratať túto vetvu
project-place-automatically = Umiestniť automaticky
project-delete-keeping = Odstrániť a ponechať, čo je pod ním
project-centre-stays = Stred mapy ostáva
project-centre-stays-detail = Samotnú mapu odstráňte z jej karty.
# One element was deleted, with the elements that were under it.
project-deleted = { $under ->
    [0] „{ $name }“ bol odstránený
    [one] „{ $name }“ bol odstránený s { $under } prvkom pod ním
    [few] „{ $name }“ bol odstránený s { $under } prvkami pod ním
   *[other] „{ $name }“ bol odstránený s { $under } prvkami pod ním
}
project-deleted-many = { $count ->
    [one] { $count } prvok odstránený
    [few] { $count } prvky odstránené
   *[other] { $count } prvkov odstránených
}

project-delete-busy-title = Niekto tu píše
# $names: those who are at what would be deleted, as a list.
project-delete-busy-message = { $names } { $count ->
    [one] pracuje
    [few] pracujú
   *[other] pracujú
} v tom, čo by sa odstránilo. Čo sa tam teraz píše, by sa s tým stratilo a nedalo by sa vrátiť.
project-delete-busy-confirm = Napriek tomu odstrániť

## An element, open for writing, and as it is shown when the pointer rests on it

project-element = Prvok
project-name-placeholder = Názov
project-write-here = Píšte sem. Napíšte @, ak chcete citovať.
project-words = { $count ->
    [one] { $count } slovo
    [few] { $count } slová
   *[other] { $count } slov
}
project-read-on = Dvojklikom čítate ďalej
project-stands-for-map = Zastupuje mapu „{ $name }“
project-name-not-printed = Názov sa netlačí
project-left-out-of-document = Vynechaný z dokumentu

## The panels at the side: the references and the pictures

project-this-map = Táto mapa
project-project = Projekt
project-library = Knižnica
project-nothing-found = Nič sa nenašlo
project-edit-reference = Upraviť záznam…
project-new-reference = Nový záznam
project-import-file = Importovať súbor
project-which-references = Ktoré záznamy
project-search-references = Hľadať záznamy
project-library-empty = Vaša knižnica je prázdna
project-library-empty-hint = Pridajte záznam alebo importujte tie, ktoré máte.
project-no-references = Zatiaľ žiadne záznamy
project-no-references-hint = Čo pri písaní citujete, je uvedené tu. Ak chcete citovať, zvoľte Citovať nad textom alebo napíšte @.
project-cited-in-heading = Citované v
project-not-cited = Necitované v tomto projekte.
project-references-drag = Potiahnite záznam do textu, aby ste ho tam citovali, alebo na prvok, aby sa citoval na konci jeho textu.
# The count is of the references the project cites that the library lacks.
project-references-foreign = { $count ->
    [one] { $count } v tomto projekte nie je vo vašej knižnici.
    [few] { $count } v tomto projekte nie sú vo vašej knižnici.
   *[other] { $count } v tomto projekte nie je vo vašej knižnici.
}
# The store of pictures.
project-store = Úložisko
project-open-picture = Otvoriť…
project-put-into-text = Vložiť do textu
project-add-pictures = Pridať obrázky zo súborov
project-which-pictures = Ktoré obrázky
project-search-pictures = Hľadať obrázky
project-a-picture = Obrázok
project-with-notes = S poznámkami
project-not-on-computer = Nie je v tomto počítači
project-nothing-said = Zatiaľ sa o ňom nič nehovorí
project-store-empty = Úložisko je prázdne
project-store-empty-hint = Pridajte obrázky zo súborov alebo ich pustite na text.
project-no-pictures = Zatiaľ žiadne obrázky
project-no-pictures-map = Obrázky vyobrazení tejto mapy sú uvedené tu. Tie z úložiska sú pod Úložiskom.
project-no-pictures-project = Obrázky vyobrazení projektu sú uvedené tu. Tie z úložiska sú pod Úložiskom.
project-pictures-drag = Potiahnite obrázok do textu, aby sa z neho tam stalo vyobrazenie, alebo na prvok, aby sa vložil na koniec jeho textu.
# The count is of the pictures that are used and are not in the store of this computer.
project-pictures-absent-map = { $count ->
    [one] { $count } v tejto mape nie je v tomto počítači.
    [few] { $count } v tejto mape nie sú v tomto počítači.
   *[other] { $count } v tejto mape nie je v tomto počítači.
}
project-pictures-absent-project = { $count ->
    [one] { $count } v tomto projekte nie je v tomto počítači.
    [few] { $count } v tomto projekte nie sú v tomto počítači.
   *[other] { $count } v tomto projekte nie je v tomto počítači.
}

## Shared by the diagram and the text

# A count of elements that stands alone, as a label of what is dragged.
project-elements = { $count ->
    [one] { $count } prvok
    [few] { $count } prvky
   *[other] { $count } prvkov
}
# One of the others who work on a shared project is at an element.
project-other-here = { $name } je tu
project-link-placeholder = Ako súvisia
project-link-label = Označenie spojenia

## A copy and its original, in another map.
copy-title = Kópia a jej originál
copy-from = Skopírované z „{ $name }“ v mape „{ $map }“
copy-original-changed = Originál sa od skopírovania, alebo odkedy sa to naposledy videlo, zmenil.
copy-original-same = Originál je taký, aký bol pri skopírovaní.
copy-original-unknown = Či sa originál od skopírovania zmenil, nie je známe: kópia vznikla skôr, než sa to začalo uchovávať.
copy-original-gone = Originál už neexistuje.
copy-how-shown = Nižšie je prečiarknuté to, čo má len originál, a vyznačené to, čo má len táto kópia.
copy-alike = Ich názvy a texty sú rovnaké. Môžu sa líšiť v tom, čo nie sú slová: citácie, obrázky, vyznačenie.
copy-only-original = Len v origináli
copy-only-copy = Len v tejto kópii
copy-go = Prejsť na originál
copy-seen = Ponechať túto kópiu, ako je
copy-take = Prevziať názov a text originálu
copy-changed-mark = Originál sa od skopírovania zmenil
copy-compare = Porovnať s originálom…
copy-copied-from = Skopírované z „{ $name }“ v „{ $map }“
copy-copied-from-changed = Skopírované z „{ $name }“ v „{ $map }“, ktorý sa odvtedy zmenil

## How far the writing of an element has come, as its writer says.
status = Stav
status-idea = Nápad
status-draft = Koncept
status-done = Hotové
status-none = Bez stavu
# Of an element, where its status is shown: "Draft · 340 words".
status-of = { $status } · { $count ->
    [one] { $count } slovo
    [few] { $count } slová
   *[other] { $count } slov
}
status-count-idea = { $count ->
    [one] { $count } nápad
    [few] { $count } nápady
   *[other] { $count } nápadov
}
status-count-draft = { $count ->
    [one] { $count } koncept
    [few] { $count } koncepty
   *[other] { $count } konceptov
}
status-count-done = { $count } hotových
# The words of the drafts and of what is done, in a map.
status-words-written = { $count ->
    [one] { $count } slovo napísané
    [few] { $count } slová napísané
   *[other] { $count } slov napísaných
}
status-progress = Ako ďaleko mapa pokročila
