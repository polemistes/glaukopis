# A project: its view, the tabs of its maps, what is done to elements, and
# the panels at the side with the references and the pictures.

project-list-unreadable = Projekte nije bilo moguće pročitati

## The view of a project

project-open-failed = Projekt nije bilo moguće otvoriti
# Shown under the words above when nothing more is known of why.
project-open-failed-detail = Projekt nije bilo moguće otvoriti.
project-back = Natrag na projekte
project-fetching = Dohvaćanje projekta
project-fetching-offline = Poslužitelj nije dostupan. Projekt će se dohvatiti kad bude moguće.
project-fetching-on-the-way = Na putu je s poslužitelja.
project-all-projects = Svi projekti
project-name = Naziv projekta
project-rename = Preimenuj projekt
project-not-saved = Nije spremljeno
project-redo = Ponovi
project-view = Prikaz mape
project-view-this = Prikaz ove mape
project-diagram = Dijagram
project-text = Tekst
project-one-at-a-time = Jedna po jedna
project-side-by-side = Dvije usporedo
project-close-side = Zatvori ovu stranu
project-references = Reference
project-pictures = Slike
project-side = Reference, slike, povijest i izmjene
project-side-tabs = Što bočna ploča prikazuje
project-side-map = Mapa
project-preview = Pretpregled i izvoz
project-share = Dijeli
project-shared = Dijeljen
project-shared-offline = Dijeljen · poslužitelj nije dostupan
project-shared-too-large = Dijeljen · poslužitelj ne prima najnovije izmjene
project-between-maps = Između dviju mapa
project-between-preview = Između mape i pretpregleda
project-between-pictures = Između mape i slika
project-between-references = Između mape i referenci

## When the sharing ends from the other side

project-unshared = Projekt više nije dijeljen
project-unshared-this = Ovaj projekt više nije dijeljen
project-left-out = Više niste među suradnicima
project-unshared-unfetched = Nije bio dohvaćen, pa ga na ovom računalu nema.
project-unshared-kept = Onaj tko ga je dijelio maknuo ga je s poslužitelja. Projekt vam ostaje kakav je sada i možete nastaviti raditi na njemu sami.
project-left-out-kept = Projekt vam ostaje kakav je sada i možete nastaviti raditi na njemu sami. Što drugi napišu nakon ovoga, do vas ne stiže.
project-understood = Razumijem

## Files dropped on the project

project-drop-picture = Ispustite sliku na element kojemu pripada
project-cited-in = { $count ->
    [1] Referenca je citirana u „{ $name }”
    [one] { $count } referenca citirana je u „{ $name }”
    [few] { $count } reference citirane su u „{ $name }”
   *[other] { $count } referenci citirano je u „{ $name }”
}
# As above, where the element has no name.
project-cited-in-element = { $count ->
    [1] Referenca je citirana u „elementu”
    [one] { $count } referenca citirana je u „elementu”
    [few] { $count } reference citirane su u „elementu”
   *[other] { $count } referenci citirano je u „elementu”
}

## The tabs of the maps

# The name of a map, or of an element, that has none.
project-untitled = Bez naslova
# The name of a copy of a map.
project-map-copy = { $name }, kopija
project-maps = Mape
project-map-name = Naziv mape
project-new-map = Nova mapa
project-map-from-document = Mapa iz dokumenta…
project-drop-on-map = Ispustite na mapu da se premjesti onamo · držite Ctrl za kopiranje
project-duplicate = Udvostruči
project-duplicate-hint = Kopija za rad; ova ostaje kakva jest
project-open-beside = Otvori pokraj
project-open-beside-hint = Dvije mape usporedo, za premještanje elemenata između njih
project-this-map-actions = Ova mapa, i mape
project-maps-hint = Mape projekta: odaberite jednu da je otvorite
project-map-beside = pokraj ove
project-side-by-side-short = Usporedo
project-preview-short = Pretpregled
project-found = Pronađeni citati…
# The count is of those found in the map.
project-found-hint = { $count } za proći i pretvoriti u citate
project-found-none = I tekst koji nalikuje citatima
project-delete-map = Izbriši mapu
project-delete-map-title = Izbrisati mapu „{ $name }”?
project-delete-map-message = { $count ->
    [one] Nestat će { $count } element i tekst u njemu. To se može poništiti dok je projekt otvoren.
    [few] Nestat će { $count } elementa i tekst u njima. To se može poništiti dok je projekt otvoren.
   *[other] Nestat će { $count } elemenata i tekst u njima. To se može poništiti dok je projekt otvoren.
}
project-copied-to = Kopirano u „{ $name }”
project-moved-to = Premješteno u „{ $name }”

## What is done to elements, in the diagram and in the text

project-add-under = Dodaj element ispod njega
project-add = Dodaj element
project-add-after = Dodaj element iza njega
project-write-text = Piši njegov tekst
project-double-click = Dvoklik
project-associate = Poveži s…
project-associate-hint = Zatim kliknite drugi element
project-heading = Tiskaj naziv kao naslov
project-heading-hint = Isključeno: naziv je oznaka za vas; tiska se samo tekst
project-leave-out = Izostavi iz dokumenta
project-leave-out-hint = Sa svime ispod njega
# An element that stands for another map: in the document, that map is in its place.
project-stands-for = Stoji za „{ $name }”
project-stand-for = Stoji za drugu mapu
project-stand-for-heading = U dokumentu ova mapa zauzima njegovo mjesto
project-stand-for-none = Nijedna
project-copy-to-map = Kopiraj u mapu
project-copy = Kopiraj
# Pasting what was copied under the element the menu is of.
project-paste-under = Zalijepi ispod njega
project-move-to-map = Premjesti u mapu
project-map-from-branch = Nova mapa od ove grane
project-map-from-branch-hint = Kopija za rad; ova ostaje
project-detach = Odvoji od roditelja
project-detach-hint = Slobodan element, da se smjesti poslije
project-tidy-branch = Uredi ovu granu
project-place-automatically = Smjesti automatski
project-delete-keeping = Izbriši, a zadrži što je ispod njega
project-centre-stays = Središte mape ostaje
project-centre-stays-detail = Samu mapu izbrišite s njezine kartice.
# One element was deleted, with the elements that were under it.
project-deleted = { $under ->
    [0] „{ $name }” je izbrisan
    [one] „{ $name }” je izbrisan, s { $under } elementom ispod njega
    [few] „{ $name }” je izbrisan, s { $under } elementa ispod njega
   *[other] „{ $name }” je izbrisan, s { $under } elemenata ispod njega
}
project-deleted-many = { $count ->
    [one] { $count } element izbrisan
    [few] { $count } elementa izbrisana
   *[other] { $count } elemenata izbrisano
}

project-delete-busy-title = Netko ovdje piše
# $names: those who are at what would be deleted, as a list.
project-delete-busy-message = { $names } { $count ->
    [one] radi
    [few] rade
   *[other] rade
} u onome što bi se izbrisalo. Što se ondje sad piše izgubilo bi se s time i ne bi se moglo vratiti.
project-delete-busy-confirm = Svejedno izbriši

## An element, open for writing, and as it is shown when the pointer rests on it

project-element = Element
project-name-placeholder = Naziv
project-write-here = Pišite ovdje. Utipkajte @ za citat.
project-words = { $count ->
    [one] { $count } riječ
    [few] { $count } riječi
   *[other] { $count } riječi
}
project-read-on = Dvoklik za čitanje dalje
project-stands-for-map = Stoji za mapu „{ $name }”
project-name-not-printed = Naziv se ne tiska
project-left-out-of-document = Izostavljeno iz dokumenta

## The panels at the side: the references and the pictures

project-this-map = Ova mapa
project-project = Projekt
project-library = Knjižnica
project-nothing-found = Ništa nije pronađeno
project-edit-reference = Uredi referencu…
project-new-reference = Nova referenca
project-import-file = Uvezi datoteku
project-which-references = Koje reference
project-search-references = Pretraži reference
project-library-empty = Vaša je knjižnica prazna
project-library-empty-hint = Dodajte referencu, ili uvezite one koje imate.
project-no-references = Još nema referenci
project-no-references-hint = Što citirate dok pišete, navodi se ovdje. Za citiranje odaberite Citiraj iznad teksta, ili utipkajte @.
project-cited-in-heading = Citirano u
project-not-cited = Nije citirana u ovom projektu.
project-references-drag = Povucite referencu u tekst da je ondje citirate, ili na element da je citirate na kraju njegova teksta.
# The count is of the references the project cites that the library lacks.
project-references-foreign = { $count ->
    [one] { $count } u ovom projektu nije u vašoj knjižnici.
    [few] { $count } u ovom projektu nisu u vašoj knjižnici.
   *[other] { $count } u ovom projektu nije u vašoj knjižnici.
}
# The store of pictures.
project-store = Spremište
project-open-picture = Otvori…
project-put-into-text = Stavi u tekst
project-add-pictures = Dodaj slike iz datoteka
project-which-pictures = Koje slike
project-search-pictures = Pretraži slike
project-a-picture = Slika
project-with-notes = S bilješkama
project-not-on-computer = Nije na ovom računalu
project-nothing-said = O njoj još ništa nije rečeno
project-store-empty = Spremište je prazno
project-store-empty-hint = Dodajte slike iz datoteka, ili ih ispustite na tekst.
project-no-pictures = Još nema slika
project-no-pictures-map = Ovdje se navode slike ilustracija ove mape. Slike iz spremišta su pod Spremište.
project-no-pictures-project = Ovdje se navode slike ilustracija projekta. Slike iz spremišta su pod Spremište.
project-pictures-drag = Povucite sliku u tekst da od nje ondje načinite ilustraciju, ili na element da je stavite na kraj njegova teksta.
# The count is of the pictures that are used and are not in the store of this computer.
project-pictures-absent-map = { $count ->
    [one] { $count } u ovoj mapi nije na ovom računalu.
    [few] { $count } u ovoj mapi nisu na ovom računalu.
   *[other] { $count } u ovoj mapi nije na ovom računalu.
}
project-pictures-absent-project = { $count ->
    [one] { $count } u ovom projektu nije na ovom računalu.
    [few] { $count } u ovom projektu nisu na ovom računalu.
   *[other] { $count } u ovom projektu nije na ovom računalu.
}

## Shared by the diagram and the text

# A count of elements that stands alone, as a label of what is dragged.
project-elements = { $count ->
    [one] { $count } element
    [few] { $count } elementa
   *[other] { $count } elemenata
}
# One of the others who work on a shared project is at an element.
project-other-here = { $name } je ovdje
project-link-placeholder = Kako su povezani
project-link-label = Oznaka veze

## A copy and its original, in another map.
copy-title = Kopija i njezin izvornik
copy-from = Kopirano iz „{ $name }” u mapi „{ $map }”
copy-original-changed = Izvornik se promijenio otkako je kopiran, ili otkako je to zadnji put viđeno.
copy-original-same = Izvornik je kakav je bio kad je kopiran.
copy-original-unknown = Ne zna se je li se izvornik promijenio otkako je kopiran: kopija je načinjena prije nego što se to počelo čuvati.
copy-original-gone = Izvornika više nema.
copy-how-shown = Dolje je precrtano ono što ima samo izvornik, a označeno ono što ima samo ova kopija.
copy-alike = Nazivi i tekstovi su im jednaki. Mogu se razlikovati u onome što nisu riječi: citatima, slikama, oznakama.
copy-only-original = Samo u izvorniku
copy-only-copy = Samo u ovoj kopiji
copy-go = Idi na izvornik
copy-seen = Zadrži ovu kopiju kakva jest
copy-take = Uzmi naziv i tekst izvornika
copy-changed-mark = Izvornik se promijenio otkako je ovo kopirano
copy-compare = Usporedi s izvornikom…
copy-copied-from = Kopirano iz „{ $name }” u „{ $map }”
copy-copied-from-changed = Kopirano iz „{ $name }” u „{ $map }”, koji se otada promijenio

## How far the writing of an element has come, as its writer says.
status = Stanje
status-idea = Zamisao
status-draft = Nacrt
status-done = Gotovo
status-none = Bez stanja
# Of an element, where its status is shown: "Draft · 340 words".
status-of = { $status } · { $count ->
    [one] { $count } riječ
    [few] { $count } riječi
   *[other] { $count } riječi
}
status-count-idea = { $count ->
    [one] { $count } zamisao
    [few] { $count } zamisli
   *[other] { $count } zamisli
}
status-count-draft = { $count ->
    [one] { $count } nacrt
    [few] { $count } nacrta
   *[other] { $count } nacrta
}
status-count-done = gotovo: { $count }
# The words of the drafts and of what is done, in a map.
status-words-written = { $count ->
    [one] { $count } riječ napisana
    [few] { $count } riječi napisane
   *[other] { $count } riječi napisano
}
status-progress = Dokle je mapa stigla
