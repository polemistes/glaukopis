# A project: its view, the tabs of its maps, what is done to elements, and
# the panels at the side with the references and the pictures.

project-list-unreadable = Proiectele nu s-au putut citi

## The view of a project

project-open-failed = Proiectul nu s-a putut deschide
# Shown under the words above when nothing more is known of why.
project-open-failed-detail = Proiectul nu s-a putut deschide.
project-back = Înapoi la proiecte
project-fetching = Se ia proiectul
project-fetching-offline = Serverul nu poate fi atins. Proiectul se ia când se va putea.
project-fetching-on-the-way = Este pe drum de la server.
project-all-projects = Toate proiectele
project-name = Numele proiectului
project-rename = Redenumește proiectul
project-not-saved = Nesalvat
project-redo = Refă acțiunea
project-view = Vederea hărții
project-view-this = Vederea acestei hărți
project-diagram = Diagramă
project-text = Text
project-one-at-a-time = Una pe rând
project-side-by-side = Două alăturate
project-close-side = Închide această parte
project-references = Referințe
project-pictures = Imagini
project-side = Referințe, imagini, istoric și modificări
project-side-tabs = Ce arată panoul lateral
project-side-map = Hartă
project-preview = Previzualizare și export
project-share = Partajează
project-shared = Partajat
project-shared-offline = Partajat · serverul nu poate fi atins
project-shared-too-large = Partajat · serverul nu primește ultimele modificări
project-between-maps = Între cele două hărți
project-between-preview = Între hartă și previzualizare
project-between-pictures = Între hartă și imagini
project-between-references = Între hartă și referințe

## When the sharing ends from the other side

project-unshared = Proiectul nu mai este partajat
project-unshared-this = Acest proiect nu mai este partajat
project-left-out = Nu mai sunteți printre colaboratori
project-unshared-unfetched = Nu fusese luat, așa că nu este nimic din el pe acest calculator.
project-unshared-kept = Cel care l-a partajat l-a luat de pe server. Păstrați proiectul așa cum este acum și puteți lucra mai departe la el pe cont propriu.
project-left-out-kept = Păstrați proiectul așa cum este acum și puteți lucra mai departe la el pe cont propriu. Ce scriu ceilalți de acum încolo nu ajunge la dumneavoastră.
project-understood = Am înțeles

## Files dropped on the project

project-drop-picture = Trageți o imagine pe elementul căruia îi aparține
project-cited-in = { $count ->
    [one] Referința este citată în „{ $name }”
    [few] { $count } referințe sunt citate în „{ $name }”
   *[other] { $count } de referințe sunt citate în „{ $name }”
}
# As above, where the element has no name.
project-cited-in-element = { $count ->
    [one] Referința este citată în „element”
    [few] { $count } referințe sunt citate în „element”
   *[other] { $count } de referințe sunt citate în „element”
}

## The tabs of the maps

# The name of a map, or of an element, that has none.
project-untitled = Fără titlu
# The name of a copy of a map.
project-map-copy = { $name }, copie
project-maps = Hărți
project-map-name = Numele hărții
project-new-map = Hartă nouă
project-map-from-document = O hartă dintr-un document…
project-drop-on-map = Trageți pe o hartă ca să mutați acolo · țineți Ctrl ca să copiați
project-duplicate = Dublează
project-duplicate-hint = O copie la care să lucrați; aceasta rămâne cum este
project-open-beside = Deschide alături
project-open-beside-hint = Două hărți alăturate, ca să mutați elemente între ele
project-this-map-actions = Această hartă, și hărțile
project-maps-hint = Hărțile proiectului: alegeți una ca să o deschideți
project-map-beside = alături de aceasta
project-side-by-side-short = Alăturate
project-preview-short = Previzualizare
project-found = Citări găsite…
# The count is of those found in the map.
project-found-hint = { $count ->
    [one] Una de parcurs, din care să se facă o citare
    [few] { $count } de parcurs, din care să se facă citări
   *[other] { $count } de parcurs, din care să se facă citări
}
project-found-none = Și text care seamănă a citări
project-delete-map = Șterge harta
project-delete-map-title = Ștergeți harta „{ $name }”?
project-delete-map-message = { $count ->
    [one] { $count } element și textul din el vor dispărea. Se poate anula cât timp proiectul este deschis.
    [few] { $count } elemente și textul din ele vor dispărea. Se poate anula cât timp proiectul este deschis.
   *[other] { $count } de elemente și textul din ele vor dispărea. Se poate anula cât timp proiectul este deschis.
}
project-copied-to = Copiat în „{ $name }”
project-moved-to = Mutat în „{ $name }”

## What is done to elements, in the diagram and in the text

project-add-under = Adaugă un element sub el
project-add = Adaugă un element
project-add-after = Adaugă un element după el
project-write-text = Scrie-i textul
project-double-click = Dublu clic
project-associate = Asociază cu…
project-associate-hint = Apoi faceți clic pe celălalt element
project-heading = Tipărește numele ca titlu
project-heading-hint = Oprit: numele este o etichetă pentru dumneavoastră; se tipărește numai textul
project-leave-out = Lasă afară din document
project-leave-out-hint = Cu tot ce este sub el
# An element that stands for another map: in the document, that map is in its place.
project-stands-for = Ține locul hărții „{ $name }”
project-stand-for = Ține locul altei hărți
project-stand-for-heading = În document, această hartă îi ia locul
project-stand-for-none = Niciuna
project-copy-to-map = Copiază în harta
project-copy = Copiază
# Pasting what was copied under the element the menu is of.
project-paste-under = Lipește sub el
project-move-to-map = Mută în harta
project-map-from-branch = Hartă nouă din această ramură
project-map-from-branch-hint = O copie la care să lucrați; aceasta rămâne
project-detach = Desprinde de părintele lui
project-detach-hint = Un element liber, de așezat mai târziu
project-tidy-branch = Ordonează această ramură
project-place-automatically = Așază automat
project-delete-keeping = Șterge, păstrând ce este sub el
project-centre-stays = Centrul unei hărți rămâne
project-centre-stays-detail = Ștergeți harta însăși din fila ei.
# One element was deleted, with the elements that were under it.
project-deleted = { $under ->
    [0] „{ $name }” a fost șters
    [one] „{ $name }” a fost șters, cu { $under } element de sub el
    [few] „{ $name }” a fost șters, cu { $under } elemente de sub el
   *[other] „{ $name }” a fost șters, cu { $under } de elemente de sub el
}
project-deleted-many = { $count ->
    [one] { $count } element șters
    [few] { $count } elemente șterse
   *[other] { $count } de elemente șterse
}

project-delete-busy-title = Cineva scrie aici
# $names: those who are at what would be deleted, as a list.
project-delete-busy-message = { $names } { $count ->
    [one] este
    [few] sunt
   *[other] sunt
} la lucru în ce s-ar șterge. Ce se scrie acolo acum s-ar pierde odată cu el și nu s-ar mai putea readuce.
project-delete-busy-confirm = Șterge oricum

## An element, open for writing, and as it is shown when the pointer rests on it

project-element = Element
project-name-placeholder = Nume
project-write-here = Scrieți aici. Tastați @ ca să citați.
project-words = { $count ->
    [one] { $count } cuvânt
    [few] { $count } cuvinte
   *[other] { $count } de cuvinte
}
project-read-on = Dublu clic ca să citiți mai departe
project-stands-for-map = Ține locul hărții „{ $name }”
project-name-not-printed = Numele nu se tipărește
project-left-out-of-document = Lăsat afară din document

## The panels at the side: the references and the pictures

project-this-map = Această hartă
project-project = Proiect
project-library = Bibliotecă
project-nothing-found = Nu s-a găsit nimic
project-edit-reference = Modifică referința…
project-new-reference = Referință nouă
project-import-file = Importă un fișier
project-which-references = Ce referințe
project-search-references = Caută referințe
project-library-empty = Biblioteca dumneavoastră este goală
project-library-empty-hint = Adăugați o referință, sau importați-le pe cele pe care le aveți.
project-no-references = Nicio referință încă
project-no-references-hint = Ce citați în timp ce scrieți se înșiră aici. Ca să citați, alegeți Citează deasupra textului sau tastați @.
project-cited-in-heading = Citată în
project-not-cited = Nu este citată în acest proiect.
project-references-drag = Trageți o referință într-un text ca să o citați acolo, sau pe un element ca să o citați la sfârșitul textului lui.
# The count is of the references the project cites that the library lacks.
project-references-foreign = { $count ->
    [one] Una din acest proiect nu este în biblioteca dumneavoastră.
    [few] { $count } din acest proiect nu sunt în biblioteca dumneavoastră.
   *[other] { $count } din acest proiect nu sunt în biblioteca dumneavoastră.
}
# The store of pictures.
project-store = Depozit
project-open-picture = Deschide…
project-put-into-text = Pune-o în text
project-add-pictures = Adaugă imagini din fișiere
project-which-pictures = Ce imagini
project-search-pictures = Caută imagini
project-a-picture = O imagine
project-with-notes = Cu note
project-not-on-computer = Nu este pe acest calculator
project-nothing-said = Nu se spune nimic despre ea încă
project-store-empty = Depozitul este gol
project-store-empty-hint = Adăugați imagini din fișiere, sau trageți-le pe un text.
project-no-pictures = Nicio imagine încă
project-no-pictures-map = Imaginile figurilor din această hartă se înșiră aici. Cele din depozit sunt sub Depozit.
project-no-pictures-project = Imaginile figurilor din proiect se înșiră aici. Cele din depozit sunt sub Depozit.
project-pictures-drag = Trageți o imagine într-un text ca să faceți din ea o figură acolo, sau pe un element ca să o puneți la sfârșitul textului lui.
# The count is of the pictures that are used and are not in the store of this computer.
project-pictures-absent-map = { $count ->
    [one] Una din această hartă nu este pe acest calculator.
    [few] { $count } din această hartă nu sunt pe acest calculator.
   *[other] { $count } din această hartă nu sunt pe acest calculator.
}
project-pictures-absent-project = { $count ->
    [one] Una din acest proiect nu este pe acest calculator.
    [few] { $count } din acest proiect nu sunt pe acest calculator.
   *[other] { $count } din acest proiect nu sunt pe acest calculator.
}

## Shared by the diagram and the text

# A count of elements that stands alone, as a label of what is dragged.
project-elements = { $count ->
    [one] { $count } element
    [few] { $count } elemente
   *[other] { $count } de elemente
}
# One of the others who work on a shared project is at an element.
project-other-here = { $name } este aici
project-link-placeholder = Cum sunt legate
project-link-label = Eticheta asocierii

## A copy and its original, in another map.
copy-title = Copia și originalul ei
copy-from = Copiat din „{ $name }” din harta „{ $map }”
copy-original-changed = Originalul s-a schimbat de când a fost copiat, sau de când a fost văzut ultima dată.
copy-original-same = Originalul este așa cum era când a fost copiat.
copy-original-unknown = Nu se știe dacă originalul s-a schimbat de când a fost copiat: copia a fost făcută înainte să se păstreze asta.
copy-original-gone = Originalul nu mai există.
copy-how-shown = Mai jos, tăiat, este ce are numai originalul, iar marcat, ce are numai această copie.
copy-alike = Numele și textele lor sunt la fel. Pot să se deosebească în ce nu este cuvânt: citări, imagini, marcaje.
copy-only-original = Numai în original
copy-only-copy = Numai în această copie
copy-go = Mergi la original
copy-seen = Păstrează această copie cum este
copy-take = Ia numele și textul originalului
copy-changed-mark = Originalul s-a schimbat de când a fost copiat acesta
copy-compare = Compară cu originalul…
copy-copied-from = Copiat din „{ $name }” din „{ $map }”
copy-copied-from-changed = Copiat din „{ $name }” din „{ $map }”, care s-a schimbat de atunci

## How far the writing of an element has come, as its writer says.
status = Stare
status-idea = Idee
status-draft = Ciornă
status-done = Gata
status-none = Fără stare
# Of an element, where its status is shown: "Draft · 340 words".
status-of = { $status } · { $count ->
    [one] { $count } cuvânt
    [few] { $count } cuvinte
   *[other] { $count } de cuvinte
}
status-count-idea = { $count ->
    [one] { $count } idee
    [few] { $count } idei
   *[other] { $count } de idei
}
status-count-draft = { $count ->
    [one] { $count } ciornă
    [few] { $count } ciorne
   *[other] { $count } de ciorne
}
status-count-done = { $count ->
    [one] una gata
    [few] { $count } gata
   *[other] { $count } gata
}
# The words of the drafts and of what is done, in a map.
status-words-written = { $count ->
    [one] { $count } cuvânt scris
    [few] { $count } cuvinte scrise
   *[other] { $count } de cuvinte scrise
}
status-progress = Cât de departe a ajuns harta
