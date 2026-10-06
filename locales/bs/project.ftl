# A project: its view, the tabs of its maps, what is done to elements, and
# the panels at the side with the references and the pictures.

project-list-unreadable = Projekte nije bilo moguće pročitati

## The view of a project

project-open-failed = Projekat nije bilo moguće otvoriti
# Shown under the words above when nothing more is known of why.
project-open-failed-detail = Projekat nije bilo moguće otvoriti.
project-back = Nazad na projekte
project-fetching = Dohvaćanje projekta
project-fetching-offline = Server nije dostupan. Projekat će se dohvatiti kad bude moguće.
project-fetching-on-the-way = Na putu je sa servera.
project-all-projects = Svi projekti
project-name = Naziv projekta
project-rename = Preimenuj projekat
project-not-saved = Nije sačuvano
project-redo = Ponovi
project-view = Prikaz mape
project-view-this = Prikaz ove mape
project-diagram = Dijagram
project-text = Tekst
project-one-at-a-time = Jedna po jedna
project-side-by-side = Dvije uporedo
project-close-side = Zatvori ovu stranu
project-references = Reference
project-pictures = Slike
project-side = Reference, slike, historija i izmjene
project-side-tabs = Šta bočni panel prikazuje
project-side-map = Mapa
project-preview = Pregled i izvoz
project-share = Dijeli
project-shared = Dijeljen
project-shared-offline = Dijeljen · server nije dostupan
project-shared-too-large = Dijeljen · server ne prima posljednje izmjene
project-between-maps = Između dviju mapa
project-between-preview = Između mape i pregleda
project-between-pictures = Između mape i slika
project-between-references = Između mape i referenci

## When the sharing ends from the other side

project-unshared = Projekat se više ne dijeli
project-unshared-this = Ovaj se projekat više ne dijeli
project-left-out = Više niste među saradnicima
project-unshared-unfetched = Nije bio dohvaćen, pa ga na ovom računaru nema.
project-unshared-kept = Onaj ko ga je dijelio skinuo ga je sa servera. Zadržavate projekat kakav je sada i možete nastaviti raditi na njemu sami.
project-left-out-kept = Zadržavate projekat kakav je sada i možete nastaviti raditi na njemu sami. Ono što drugi poslije ovoga napišu ne stiže do vas.
project-understood = Razumijem

## Files dropped on the project

project-drop-picture = Ispustite sliku na element kojem pripada
project-cited-in = { $count ->
    [one] Referenca je citirana u „{ $name }“
    [few] { $count } reference su citirane u „{ $name }“
   *[other] { $count } referenci je citirano u „{ $name }“
}
# As above, where the element has no name.
project-cited-in-element = { $count ->
    [one] Referenca je citirana u „elementu“
    [few] { $count } reference su citirane u „elementu“
   *[other] { $count } referenci je citirano u „elementu“
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
project-drop-on-map = Ispustite na mapu da premjestite onamo · držite Ctrl da kopirate
project-duplicate = Dupliciraj
project-duplicate-hint = Kopija za rad; ova ostaje kakva jeste
project-open-beside = Otvori pored
project-open-beside-hint = Dvije mape uporedo, da se elementi premještaju među njima
project-this-map-actions = Ova mapa, i mape
project-maps-hint = Mape projekta: odaberite jednu da je otvorite
project-map-beside = pored ove
project-side-by-side-short = Uporedo
project-preview-short = Pregled
project-found = Pronađeni citati…
# The count is of those found in the map.
project-found-hint = Još { $count } za pregled i pretvaranje u citate
project-found-none = I tekst koji liči na citate
project-delete-map = Izbriši mapu
project-delete-map-title = Izbrisati mapu „{ $name }“?
project-delete-map-message = { $count ->
    [one] { $count } element i tekst u njemu nestat će. Ovo se može poništiti dok je projekat otvoren.
    [few] { $count } elementa i tekst u njima nestat će. Ovo se može poništiti dok je projekat otvoren.
   *[other] { $count } elemenata i tekst u njima nestat će. Ovo se može poništiti dok je projekat otvoren.
}
project-copied-to = Kopirano u „{ $name }“
project-moved-to = Premješteno u „{ $name }“

## What is done to elements, in the diagram and in the text

project-add-under = Dodaj element pod njega
project-add = Dodaj element
project-add-after = Dodaj element iza njega
project-write-text = Piši njegov tekst
project-double-click = Dvoklik
project-associate = Poveži s…
project-associate-hint = Zatim kliknite drugi element
project-heading = Štampaj naziv kao naslov
project-heading-hint = Isključeno: naziv je oznaka za vas; štampa se samo tekst
project-leave-out = Izostavi iz dokumenta
project-leave-out-hint = Sa svim pod njim
# An element that stands for another map: in the document, that map is in its place.
project-stands-for = Stoji za „{ $name }“
project-stand-for = Neka stoji za drugu mapu
project-stand-for-heading = U dokumentu ova mapa zauzima njegovo mjesto
project-stand-for-none = Nijedna
project-copy-to-map = Kopiraj u mapu
project-copy = Kopiraj
# Pasting what was copied under the element the menu is of.
project-paste-under = Zalijepi pod njega
project-move-to-map = Premjesti u mapu
project-map-from-branch = Nova mapa od ove grane
project-map-from-branch-hint = Kopija za rad; ova ostaje
project-detach = Odvoji od roditelja
project-detach-hint = Slobodan element, da se smjesti kasnije
project-tidy-branch = Uredi ovu granu
project-place-automatically = Smjesti automatski
project-delete-keeping = Izbriši, zadržavajući ono pod njim
project-centre-stays = Središte mape ostaje
project-centre-stays-detail = Samu mapu izbrišite s njene kartice.
# One element was deleted, with the elements that were under it.
project-deleted = { $under ->
    [0] „{ $name }“ je izbrisan
    [one] „{ $name }“ je izbrisan, s { $under } elementom pod njim
    [few] „{ $name }“ je izbrisan, s { $under } elementa pod njim
   *[other] „{ $name }“ je izbrisan, s { $under } elemenata pod njim
}
project-deleted-many = { $count ->
    [one] { $count } element izbrisan
    [few] { $count } elementa izbrisana
   *[other] { $count } elemenata izbrisano
}

project-delete-busy-title = Neko ovdje piše
# $names: those who are at what would be deleted, as a list.
project-delete-busy-message = { $names } { $count ->
    [one] radi
    [few] rade
   *[other] rade
} u onome što bi se izbrisalo. Ono što se ondje sada piše bilo bi izgubljeno s tim i ne bi se moglo vratiti.
project-delete-busy-confirm = Svejedno izbriši

## An element, open for writing, and as it is shown when the pointer rests on it

project-element = Element
project-name-placeholder = Naziv
project-write-here = Pišite ovdje. Otkucajte @ da citirate.
project-words = { $count ->
    [one] { $count } riječ
    [few] { $count } riječi
   *[other] { $count } riječi
}
project-read-on = Dvoklik za dalje čitanje
project-stands-for-map = Stoji za mapu „{ $name }“
project-name-not-printed = Naziv se ne štampa
project-left-out-of-document = Izostavljen iz dokumenta

## The panels at the side: the references and the pictures

project-this-map = Ova mapa
project-project = Projekat
project-library = Biblioteka
project-nothing-found = Ništa nije pronađeno
project-edit-reference = Uredi referencu…
project-new-reference = Nova referenca
project-import-file = Uvezi datoteku
project-which-references = Koje reference
project-search-references = Pretraži reference
project-library-empty = Vaša je biblioteka prazna
project-library-empty-hint = Dodajte referencu, ili uvezite one koje imate.
project-no-references = Još nema referenci
project-no-references-hint = Ono što citirate dok pišete nabraja se ovdje. Da citirate, odaberite Citiraj iznad teksta ili otkucajte @.
project-cited-in-heading = Citirana u
project-not-cited = Nije citirana u ovom projektu.
project-references-drag = Prevucite referencu u tekst da je ondje citirate, ili na element da je citirate na kraju njegovog teksta.
# The count is of the references the project cites that the library lacks.
project-references-foreign = { $count ->
    [one] { $count } u ovom projektu nije u vašoj biblioteci.
    [few] { $count } u ovom projektu nisu u vašoj biblioteci.
   *[other] { $count } u ovom projektu nije u vašoj biblioteci.
}
# The store of pictures.
project-store = Spremište
project-open-picture = Otvori…
project-put-into-text = Stavi je u tekst
project-add-pictures = Dodaj slike iz datoteka
project-which-pictures = Koje slike
project-search-pictures = Pretraži slike
project-a-picture = Slika
project-with-notes = S bilješkama
project-not-on-computer = Nije na ovom računaru
project-nothing-said = O njoj još ništa nije rečeno
project-store-empty = Spremište je prazno
project-store-empty-hint = Dodajte slike iz datoteka, ili ih ispustite na tekst.
project-no-pictures = Još nema slika
project-no-pictures-map = Slike ilustracija ove mape nabrajaju se ovdje. One iz spremišta su pod Spremište.
project-no-pictures-project = Slike ilustracija projekta nabrajaju se ovdje. One iz spremišta su pod Spremište.
project-pictures-drag = Prevucite sliku u tekst da ondje od nje napravite ilustraciju, ili na element da je stavite na kraj njegovog teksta.
# The count is of the pictures that are used and are not in the store of this computer.
project-pictures-absent-map = { $count ->
    [one] { $count } u ovoj mapi nije na ovom računaru.
    [few] { $count } u ovoj mapi nisu na ovom računaru.
   *[other] { $count } u ovoj mapi nije na ovom računaru.
}
project-pictures-absent-project = { $count ->
    [one] { $count } u ovom projektu nije na ovom računaru.
    [few] { $count } u ovom projektu nisu na ovom računaru.
   *[other] { $count } u ovom projektu nije na ovom računaru.
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
copy-title = Kopija i njen original
copy-from = Kopirano iz „{ $name }“ u mapi „{ $map }“
copy-original-changed = Original se promijenio otkako je kopiran, ili otkako je to posljednji put viđeno.
copy-original-same = Original je kakav je bio kad je kopiran.
copy-original-unknown = Nije poznato je li se original promijenio otkako je kopiran: kopija je napravljena prije nego što se to čuvalo.
copy-original-gone = Originala više nema.
copy-how-shown = Dolje je precrtano ono što ima samo original, a označeno ono što ima samo ova kopija.
copy-alike = Nazivi i tekstovi su im jednaki. Mogu se razlikovati u onome što nisu riječi: citatima, slikama, oznakama.
copy-only-original = Samo u originalu
copy-only-copy = Samo u ovoj kopiji
copy-go = Idi na original
copy-seen = Zadrži ovu kopiju kakva jeste
copy-take = Preuzmi naziv i tekst originala
copy-changed-mark = Original se promijenio otkako je ovo kopirano
copy-compare = Uporedi s originalom…
copy-copied-from = Kopirano iz „{ $name }“ u „{ $map }“
copy-copied-from-changed = Kopirano iz „{ $name }“ u „{ $map }“, koji se otada promijenio

## How far the writing of an element has come, as its writer says.
status = Stanje
status-idea = Ideja
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
    [one] { $count } ideja
    [few] { $count } ideje
   *[other] { $count } ideja
}
status-count-draft = { $count ->
    [one] { $count } nacrt
    [few] { $count } nacrta
   *[other] { $count } nacrta
}
status-count-done = { $count } gotovo
# The words of the drafts and of what is done, in a map.
status-words-written = { $count ->
    [one] { $count } riječ napisana
    [few] { $count } riječi napisane
   *[other] { $count } riječi napisano
}
status-progress = Dokle je mapa stigla
