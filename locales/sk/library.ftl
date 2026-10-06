# The library: the references, the form they are written in, and what
# brings them in, in English. The fields and types of the form are in
# fields.ftl. See locales/README.md.

## The form of a reference.

library-form-often-used = Často používané
library-form-add-field = Pridať pole
library-form-citation-key = Citačný kľúč
# In the empty field of the citation key: what it is given if nothing is written.
library-form-key-made = vytvorí sa z autora a roku
library-form-date-problem = Dátum píšte ako 1979, 1979-05 alebo 1979-05-12; rozsah ako 1979/1985.
library-form-remove-field = Odobrať { $field }

## The people of a reference, with the name of their field: “Author: family name”.

library-names-kept-whole = Inštitúcia alebo iný názov vcelku
library-names-prefix-suffix = Predpona a prípona
    .hint = „van“, „de la“ · „Jr.“, „III“
library-names-move-up = Posunúť vyššie
library-names-move-down = Posunúť nižšie
library-names-more = Viac pre toto meno
library-names-name = Názov
library-names-name-of = { $role }: názov
library-names-family = Priezvisko
library-names-family-of = { $role }: priezvisko
library-names-given = Krstné mená
library-names-given-of = { $role }: krstné mená
library-names-prefix = Predpona: van, de la
library-names-prefix-of = { $role }: predpona
library-names-suffix = Prípona: Jr., III
library-names-suffix-of = { $role }: prípona

## Words for references, wherever they are shown.

library-untitled = Bez názvu
library-no-author = Bez autora
library-no-title = Bez názvu
library-in-library = Vo vašej knižnici

## Why a reference is taken for another: “the same DOI and the same file”.

library-reason-doi = to isté DOI
library-reason-isbn = to isté ISBN
library-reason-identical = zhoda vo všetkom, čo odlišuje jedno dielo od druhého
# How far the title, the author and the year agree: the same, like (titles
# that differ in a few letters or a subtitle, an author in common, years a
# year apart), or none (one of them says nothing of it).
library-reason-alike = { $title ->
    [same] { $author ->
        [same] { $year ->
            [same] ten istý názov, autor a rok
            [like] ten istý názov a autor, rok sa líši o jeden
           *[none] ten istý názov a autor, rok len pri jednom z nich
        }
        [like] { $year ->
            [same] ten istý názov a rok a spoločný autor
            [like] ten istý názov, spoločný autor, rok sa líši o jeden
           *[none] ten istý názov, spoločný autor, rok len pri jednom z nich
        }
       *[none] { $year ->
            [same] ten istý názov a rok, autor len pri jednom z nich
            [like] ten istý názov, rok sa líši o jeden, autor len pri jednom z nich
           *[none] ten istý názov, autor a rok len pri jednom z nich
        }
    }
   *[like] { $author ->
        [same] { $year ->
            [same] ten istý autor a rok a podobný názov
            [like] ten istý autor, podobný názov, rok sa líši o jeden
           *[none] ten istý autor, podobný názov, rok len pri jednom z nich
        }
        [like] { $year ->
            [same] ten istý rok, podobný názov, spoločný autor
            [like] podobný názov, spoločný autor, rok sa líši o jeden
           *[none] podobný názov, spoločný autor, rok len pri jednom z nich
        }
       *[none] { $year ->
            [same] ten istý rok, podobný názov, autor len pri jednom z nich
            [like] podobný názov, rok sa líši o jeden, autor len pri jednom z nich
           *[none] podobný názov, autor a rok len pri jednom z nich
        }
    }
}
library-reason-file = ten istý súbor
# Several reasons: those before the last, set apart by commas, and the last.
library-reasons = { $others } a { $last }

## The size of a file.

library-size-bytes = { $size } B
library-size-kilobytes = { $size } kB
library-size-megabytes = { $size } MB

## What may be in the library already, while a reference is written.

library-duplicate-certain = Toto už vo vašej knižnici je.
library-duplicate-probable = Toto už vo vašej knižnici možno je.
library-duplicate-use = Použiť tento

## Duplicates in the library.

library-duplicates-title = Duplikáty
library-duplicates-count = { $count ->
    [one] { $count } záznam sa zdá byť v knižnici viackrát
    [few] { $count } záznamy sa zdajú byť v knižnici viackrát
   *[other] { $count } záznamov sa zdá byť v knižnici viackrát
}
library-duplicates-none = Žiadne duplikáty
    .text = Žiadny záznam sa nezdá byť v knižnici viackrát.
library-duplicates-no-more = Už žiadne duplikáty
    .text = Citácie zlúčených záznamov teraz citujú tie, ktoré ostali.
library-duplicates-how = Keď sa záznamy zlúčia do jedného, ten, ktorý si ponecháte, dostane od ostatných, čo mu chýba, a kde sa líšia, ponechá si svoje. Ich súbory a zbierky sa spoja a čo ich cituje, cituje ten ponechaný.
library-duplicates-same = Tie isté
library-duplicates-probably-same = Pravdepodobne tie isté
library-duplicates-keep-which = Ktorý ponechať
library-duplicates-kept = Ponechaný
library-duplicates-different = Sú rôzne
library-duplicates-merge = Zlúčiť do jedného
library-duplicates-merging = Zlučujú sa…
library-duplicates-failed = V knižnici sa nepodarilo hľadať duplikáty
library-duplicates-merge-failed = Nepodarilo sa ich zlúčiť

## Importing references: what a file holds, against what the library has.

library-import = Importovať
library-import-title = Importovať záznamy
# What is imported, and from where: a file, Zotero.
library-import-subtitle = { $count ->
    [one] { $count } záznam ({ $source })
    [few] { $count } záznamy ({ $source })
   *[other] { $count } záznamov ({ $source })
}
library-import-review = { $count ->
    [one] { $count } záznam už možno vo vašej knižnici je
    [few] { $count } záznamy už možno vo vašej knižnici sú
   *[other] { $count } záznamov už možno vo vašej knižnici je
}
library-import-new = { $count ->
    [one] { $count } nový záznam
    [few] { $count } nové záznamy
   *[other] { $count } nových záznamov
}
library-import-complete = { $count ->
    [one] { $count } záznam, ktorý už vo vašej knižnici je, získa údaje
    [few] { $count } záznamy, ktoré už vo vašej knižnici sú, získajú údaje
   *[other] { $count } záznamov, ktoré už vo vašej knižnici sú, získa údaje
}
library-import-known = { $count ->
    [one] { $count } záznam už vo vašej knižnici je
    [few] { $count } záznamy už vo vašej knižnici sú
   *[other] { $count } záznamov už vo vašej knižnici je
}
library-import-repeated = { $count ->
    [one] { $count } záznam sa v importe opakuje
    [few] { $count } záznamy sa v importe opakujú
   *[other] { $count } záznamov sa v importe opakuje
}
# The fields a reference of the library would be given: “Would gain: Publisher, Place”.
library-import-would-gain = Získal by: { $fields }
library-import-gains-file = Súbor
library-import-gains-zotero = Jeho kľúč v Zotere
library-import-what-to-do = Čo urobiť
library-import-merge = To isté dielo: doplniť ten, ktorý mám
library-import-skip = To isté dielo: nechať môj, ako je
library-import-add = Iné dielo: pridať ho
# One answer for every candidate in the same case: “For all 16 that are the same: …”.
library-import-all-certain = { $count ->
    [one] Pre ten { $count }, ktorý je ten istý:
    [few] Pre všetky { $count }, ktoré sú tie isté:
   *[other] Pre všetkých { $count }, ktoré sú tie isté:
}
library-import-all-probable = { $count ->
    [one] Pre ten { $count }, ktorý je pravdepodobne ten istý:
    [few] Pre všetky { $count }, ktoré sú pravdepodobne tie isté:
   *[other] Pre všetkých { $count }, ktoré sú pravdepodobne tie isté:
}
library-import-all-merge = Doplniť tie, ktoré mám
library-import-all-skip = Nechať moje, ako sú
library-import-all-add = Napriek tomu ich všetky pridať
library-import-more = { $count ->
    [one] …a ešte { $count } ďalší.
    [few] …a ešte { $count } ďalšie.
   *[other] …a ešte { $count } ďalších.
}
library-import-unread = { $count ->
    [one] { $count } časť súboru sa nedala prečítať
    [few] { $count } časti súboru sa nedali prečítať
   *[other] { $count } častí súboru sa nedalo prečítať
}
library-import-importing = Importuje sa…
# How many are to be added, completed and left out: “3 to add, 1 to complete, 2 left out”.
library-import-counts = { $add } na pridanie{ $merge ->
        [0] {""}
       *[other] , { $merge } na doplnenie
    }{ $skip ->
        [0] {""}
        [one] , { $skip } vynechaný
        [few] , { $skip } vynechané
       *[other] , { $skip } vynechaných
    }
library-import-failed = Import zlyhal.

## The library: the list of references, and what can be done with them.

library-references = Záznamy
library-unread = Knižnicu sa nepodarilo prečítať
library-all-references = Všetky záznamy
library-count = { $count ->
    [one] { $count } záznam
    [few] { $count } záznamy
   *[other] { $count } záznamov
}
library-selected = { $count ->
    [one] { $count } vybraný záznam
    [few] { $count } vybrané záznamy
   *[other] { $count } vybraných záznamov
}
library-selected-of = { $count ->
    [one] Vybrané { $selected } z { $count } záznamu
    [few] Vybrané { $selected } z { $count } záznamov
   *[other] Vybrané { $selected } z { $count } záznamov
}
library-new-reference = Nový záznam
library-search = Hľadať v knižnici
library-search-in = Hľadať v „{ $name }“
library-search-clear = Vymazať hľadanie
library-sort = Zoradiť
library-sort-author = Autor
library-sort-year = Rok
library-sort-title = Názov
library-sort-added = Dátum pridania
library-sort-modified = Dátum zmeny
library-sort-descending = Zostupne

## The filters, beside the search: what kind of publication, who published it, and when.

library-filters = Filter
library-filters-on = { $count ->
    [one] Filter: { $count } zapnutý
    [few] Filter: { $count } zapnuté
   *[other] Filter: { $count } zapnutých
}
library-filter-kind = Druh
library-filter-publisher = Vydavateľ
library-filter-publisher-hint = Časť názvu
library-filter-any-publisher = Ktorýkoľvek vydavateľ
library-filter-year = Rok
library-filter-from = Od
library-filter-to = Do
library-filter-clear = Vymazať filtre
library-filter-nothing-here = Tu nie je čo filtrovať.
# When the filters let nothing through.
library-nothing-passes = Filtrami neprejde žiadny zobrazený záznam.
library-import-export = Import a export
library-import-file = Importovať súbor…
    .hint = BibLaTeX alebo BibTeX
library-paste = Prilepiť záznamy…
library-add-pdfs = Pridať súbory PDF…
    .hint = Každý sa dohľadá a uchová
library-import-zotero = Importovať zo Zotera…
library-find-duplicates = Nájsť duplikáty…
library-map-library = Mapa knižnice…
library-map-collection = Mapa zbierky „{ $name }“…
library-export-library = Exportovať knižnicu…
library-export-collection = Exportovať „{ $name }“…
library-export-one = Exportovať…
library-export-many = { $count ->
    [one] Exportovať { $count } záznam…
    [few] Exportovať { $count } záznamy…
   *[other] Exportovať { $count } záznamov…
}
library-export-title = Exportovať záznamy
# What a file of exported references is called, before it is given a name.
library-export-file-references = záznamy
library-export-file-library = knižnica
library-exported = { $count ->
    [one] { $count } záznam exportovaný
    [few] { $count } záznamy exportované
   *[other] { $count } záznamov exportovaných
}
library-export-failed = Export zlyhal
library-empty = Vaša knižnica je prázdna
    .text = Záznamy, ktoré sem pridáte, sú dostupné vo všetkých vašich projektoch. Začnite jedným alebo načítajte tie, ktoré už máte.
library-collection-empty = V tejto zbierke zatiaľ nič nie je
    .text = Potiahnite sem záznamy z knižnice alebo pridajte nový.
library-nothing-found = Nič sa nenašlo
    .text = Žiadny záznam neobsahuje všetky tieto slová.
library-open-file = Otvoriť súbor
library-file-open-failed = Súbor sa nepodarilo otvoriť
library-add-to-collection = Pridať do zbierky
library-remove-from = Odobrať zo zbierky „{ $name }“
library-copy-key = Kopírovať citačný kľúč
library-copied-key = Skopírované „{ $key }“
library-copy-biblatex = Kopírovať ako BibLaTeX
library-copied = Skopírované
library-delete-one-title = Odstrániť „{ $name }“?
library-delete-many-title = { $count ->
    [one] Odstrániť { $count } záznam?
    [few] Odstrániť { $count } záznamy?
   *[other] Odstrániť { $count } záznamov?
}
# $projects is the number of projects that cite what is deleted, which keep copies of their own.
library-delete-one = Záznam sa tým odstráni z vašej knižnice, z každej zbierky{ $files ->
        [0] {""}
        [one] , spolu s { $files } priloženým súborom
        [few] , spolu s { $files } priloženými súbormi
       *[other] , spolu s { $files } priloženými súbormi
    }.{ $projects ->
        [0] {""}
        [one] {" "}Cituje sa v jednom projekte, ktorý si uchová jeho kópiu.
        [few] {" "}Cituje sa v { $projects } projektoch, ktoré si uchovajú jeho kópiu.
       *[other] {" "}Cituje sa v { $projects } projektoch, ktoré si uchovajú jeho kópiu.
    }
library-delete-many = Tým sa odstránia z vašej knižnice, z každej zbierky{ $files ->
        [0] {""}
        [one] , spolu s { $files } priloženým súborom
        [few] , spolu s { $files } priloženými súbormi
       *[other] , spolu s { $files } priloženými súbormi
    }.{ $projects ->
        [0] {""}
        [one] {" "}Projekt, ktorý niektoré z nich cituje, si ich kópiu uchová.
        [few] {" "}{ $projects } projekty, ktoré niektoré z nich citujú, si ich kópiu uchovajú.
       *[other] {" "}{ $projects } projektov, ktoré niektoré z nich citujú, si ich kópiu uchová.
    }
library-delete-failed = Záznamy sa nepodarilo odstrániť
library-not-done = To sa nepodarilo

## Collections.

library-collections = Zbierky
# The projects that cite a work, in its pane.
library-cited-in = Citované v
library-not-cited = Necitované v žiadnom projekte.
library-cited-reading = Čítajú sa projekty…
library-collections-hint = Zbierky zhromažďujú záznamy k téme alebo k jednej práci. Záznam môže byť v ľubovoľnom počte z nich.
library-collection-new = Nová zbierka
library-collection-new-inside = Nová zbierka vnútri
library-collection-new-under = Nová zbierka v „{ $name }“
library-collection-move-to = Presunúť do
library-collection-name = Názov zbierky
library-collection-name-failed = Zbierku sa nepodarilo pomenovať
library-collection-expand = Rozbaliť
library-collection-collapse = Zbaliť
library-collection-to-top = Presunúť na najvyššiu úroveň
library-collection-move-failed = Zbierku sa nepodarilo presunúť
library-collection-added = { $count ->
    [one] { $count } záznam pridaný do „{ $name }“
    [few] { $count } záznamy pridané do „{ $name }“
   *[other] { $count } záznamov pridaných do „{ $name }“
}
library-collection-already = Už je v „{ $name }“
library-collection-delete = Odstrániť zbierku
library-collection-delete-title = Odstrániť zbierku „{ $name }“?
# The number is that of the collections inside the one that is deleted.
library-collection-delete-message = { $inside ->
    [0] Záznamy ostanú vo vašej knižnici.
   *[other] Odstránia sa aj zbierky v nej. Záznamy ostanú vo vašej knižnici.
}
library-collection-delete-failed = Zbierku sa nepodarilo odstrániť
library-collection-count = { $count ->
    [one] { $count } zbierka
    [few] { $count } zbierky
   *[other] { $count } zbierok
}

## A map of the library, or of a collection: a new project.

library-map-title-library = Mapa knižnice
library-map-title-collection = Mapa zbierky
# The name a project made of the whole library is given.
library-map-library-name = Knižnica
library-map-name = Názov
library-map-name-hint = Názov projektu, jeho mapy a prvku v strede mapy.
library-map-what-library = Zbierky sa stanú prvkami, vnorenými tak, ako sú, a každý záznam prvkom pod svojou zbierkou, ktorého textom je jeho citácia. Záznamy, ktoré nie sú v žiadnej zbierke, stoja v strede.
library-map-what-collection = Zbierky v nej sa stanú prvkami, vnorenými tak, ako sú, a každý záznam prvkom pod svojou zbierkou, ktorého textom je jeho citácia.
library-map-nothing = Nie sú žiadne záznamy, ktoré by sa dali dať na mapu.
library-map-make = Vytvoriť projekt
library-map-making = Vytvára sa projekt…
library-map-failed = Projekt sa nepodarilo vytvoriť.

## Bringing references in, from anywhere in the application.

library-files = { $count ->
    [one] { $count } súbor
    [few] { $count } súbory
   *[other] { $count } súborov
}
library-open-failed = Záznam sa nepodarilo otvoriť
library-known = { $count ->
    [one] Už je vo vašej knižnici
    [few] Už sú vo vašej knižnici
   *[other] Už sú vo vašej knižnici
}
library-nothing-to-import = Nie je čo importovať
library-none-found = Nenašli sa žiadne záznamy.
library-import-kinds = Záznamy sa čítajú zo súborov .bib a vytvárajú zo súborov PDF.
library-filter-bib = BibLaTeX a BibTeX
library-filter-all = Všetky súbory
library-files-read-failed = { $count ->
    [one] Súbor sa nepodarilo prečítať
    [few] Súbory sa nepodarilo prečítať
   *[other] Súbory sa nepodarilo prečítať
}
library-text-read-failed = Text sa nepodarilo prečítať
library-add-pdfs-title = Pridať súbory PDF
library-pdfs-working = { $count ->
    [one] Zisťuje sa, čo je ten súbor…
    [few] Zisťuje sa, čo sú tie { $count } súbory…
   *[other] Zisťuje sa, čo je tých { $count } súborov…
}
# While PDF files are found out about, one after another.
library-pdfs-progress = { $done } z { $count }: { $name }
library-stop = Zastaviť
# What came of an import, as a list: “3 references added, 1 completed, 2 files stored”.
library-imported-added = { $count ->
    [one] { $count } záznam pridaný
    [few] { $count } záznamy pridané
   *[other] { $count } záznamov pridaných
}
library-imported-completed = { $count ->
    [one] { $count } doplnený
    [few] { $count } doplnené
   *[other] { $count } doplnených
}
library-imported-skipped = { $count } už v knižnici
library-imported-files = { $count ->
    [one] { $count } súbor uložený
    [few] { $count } súbory uložené
   *[other] { $count } súborov uložených
}
library-imported-nothing = Nič sa nezmenilo
library-paste-title = Prilepiť záznamy
library-paste-subtitle = BibLaTeX alebo BibTeX, koľko záznamov chcete
library-paste-continue = Pokračovať
library-source-label = Zdroj BibLaTeX

## Importing from Zotero.

library-zotero-title = Importovať zo Zotera
# The file is the database of Zotero, zotero.sqlite, shown as code.
library-zotero-not-found = V tomto počítači sa nenašlo žiadne Zotero na miestach, kde zvyčajne uchováva svoje dáta. Ak ich uchováva inde, ukážte kde: priečinok, ktorý obsahuje { $file }.
library-zotero-lead = Čo sa importuje, sa skopíruje do vašej knižnice aj so súbormi. Zotero sa len číta a nič sa v ňom nemení; medzitým môže bežať.
library-zotero-choose = Dátový priečinok Zotera
library-zotero-none-there = Tam žiadne Zotero nie je.
library-zotero-unread = Zotero sa nepodarilo prečítať.
library-zotero-library = Knižnica
# A library of Zotero, with the number of its references.
library-zotero-library-option = { $name } ({ $count })
library-zotero-my-library = Moja knižnica
library-zotero-what = Čo importovať
library-zotero-everything = Všetko
library-zotero-with-files = S priloženými súbormi
library-zotero-with-notes = S poznámkami, ako anotáciami
library-zotero-elsewhere = Iné miesto…
library-zotero-show-where = Ukázať kde…
library-zotero-reading = Číta sa…
library-zotero-read = { $count ->
    [0] Načítať
    [one] Načítať { $count } záznam
    [few] Načítať { $count } záznamy
   *[other] Načítať { $count } záznamov
}

## Writing a reference.

library-dialog-edit = Upraviť záznam
library-dialog-add = Pridať záznam
library-dialog-back = Späť na formulár
library-dialog-open-failed = Záznam sa nepodarilo otvoriť.
library-dialog-save-failed = Záznam sa nepodarilo uložiť.
# The entry as BibLaTeX, as against the form.
library-source = Zdroj
library-source-unread = Zdroj sa nepodarilo prečítať.

## A reference, beside the list.

library-pane-label = Záznam
library-pane-more = Viac
library-pane-saved = Uložené
library-pane-editing = Upravuje sa…
library-pane-not-saved = Neuložené
library-pane-unread = Záznam sa nepodarilo prečítať.
library-pane-save-failed = Zmeny sa nepodarilo uložiť.
library-pane-note-placeholder = Čo si o tom myslíte. Pre vás: nie je to súčasť toho, čo sa cituje.
library-pane-files = Súbory
library-pane-attach = Priložiť
library-pane-attach-title = Priložiť súbory
library-pane-attach-failed = Súbor sa nepodarilo priložiť
# Of a file that is attached, and not where it should be.
library-pane-missing = chýba
library-pane-reveal = Zobraziť v správcovi súborov
library-pane-reveal-failed = Priečinok sa nepodarilo otvoriť
library-pane-no-files = Žiadne súbory. Priložte PDF alebo ho sem pustite.
library-pane-detach = Odobrať súbor
library-pane-detach-title = Odobrať „{ $name }“?
library-pane-detach-message = Súbor sa z úložiska knižnice odstráni, ak ho nepoužíva iný záznam.
library-pane-detach-failed = Súbor sa nepodarilo odobrať
library-pane-leave-collection = Odobrať zo zbierky { $name }
library-pane-duplicate = Duplikovať
    .hint = Nový záznam začínajúci týmito údajmi
library-pane-edit-source = Upraviť zdroj…
library-pane-source-subtitle = Záznam ako BibLaTeX. Väčšina vecí je ľahšia vo formulári.
library-pane-source-failed = Zdroj sa nepodarilo zobraziť
library-pane-added = Pridané { $date }
library-pane-added-changed = Pridané { $added } · zmenené { $changed }

## Looking up a reference.

library-lookup-placeholder = Dohľadať: DOI, ISBN alebo slová z názvu a autora
library-lookup-label = Dohľadať záznam
library-lookup-failed = Nič sa nedalo dohľadať.
# Where the reference came from: a service such as Crossref.
library-lookup-filled = Vyplnené zo služby { $source }.
library-lookup-others = { $count ->
    [one] { $count } ďalší záznam
    [few] { $count } ďalšie záznamy
   *[other] { $count } ďalších záznamov
}
library-lookup-scope = Čo hľadať
library-lookup-any = Čokoľvek
library-lookup-books = Knihy
library-lookup-articles = Články
library-lookup-none = Nič sa nenašlo. Menej slov môže nájsť viac: priezvisko autora a slovo či dve z názvu.
# What was asked for: a DOI, an ISBN, a number of arXiv or of PubMed.
library-lookup-unknown = O tomto { $kind ->
        [doi] DOI
        [isbn] ISBN
        [arxiv] čísle arXivu
       *[pmid] čísle PubMedu
    } nie je tam, kde sa pýtalo, nič známe. Záznam možno zadať ručne nižšie.

## What the writer writes about a work.

library-notes = Poznámky
library-notes-yours = Vaše poznámky
library-notes-on-work = Vaše poznámky k tomuto dielu
library-notes-read = Čítať svoje poznámky
library-notes-write = Napísať poznámku
library-notes-write-on-work = Napísať poznámku k tomuto dielu
library-notes-not-in-library = Záznam, ktorý nie je vo vašej knižnici
library-notes-this-project = V tomto projekte
library-notes-all-projects = Vo všetkých projektoch
library-notes-project-placeholder = Čo si o tom myslíte, pre túto prácu
library-notes-all-placeholder = Čo si o tom myslíte, kdekoľvek to citujete
library-notes-keep-for-all = Uchovať pre všetky projekty
library-notes-write-for-all = Písať pre všetky projekty
library-notes-carried = Záznam prišiel s projektom a nie je vo vašej knižnici. Čo sa sem napíše, má každý, kto má projekt.
library-notes-kept = Uchované so záznamom vo vašej knižnici. Ide s projektom, ktorý dielo cituje.
library-notes-unread = Vaše poznámky sa nepodarilo prečítať
library-notes-unsaved = Vašu poznámku sa nepodarilo uchovať
