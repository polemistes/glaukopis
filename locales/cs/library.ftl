# The library: the references, the form they are written in, and what
# brings them in, in English. The fields and types of the form are in
# fields.ftl. See locales/README.md.

## The form of a reference.

library-form-often-used = Často užívaná
library-form-add-field = Přidat pole
library-form-citation-key = Citační klíč
# In the empty field of the citation key: what it is given if nothing is written.
library-form-key-made = vytvoří se z autora a roku
library-form-date-problem = Datum pište jako 1979, 1979-05 nebo 1979-05-12; rozmezí jako 1979/1985.
library-form-remove-field = Odebrat pole { $field }

## The people of a reference, with the name of their field: “Author: family name”.

library-names-kept-whole = Instituce nebo jiné jméno vcelku
library-names-prefix-suffix = Předpona a přípona
    .hint = „van“, „de la“ · „Jr.“, „III“
library-names-move-up = Posunout výš
library-names-move-down = Posunout níž
library-names-more = Více k tomuto jménu
library-names-name = Jméno
library-names-name-of = { $role }: jméno
library-names-family = Příjmení
library-names-family-of = { $role }: příjmení
library-names-given = Křestní jména
library-names-given-of = { $role }: křestní jména
library-names-prefix = Předpona: van, de la
library-names-prefix-of = { $role }: předpona
library-names-suffix = Přípona: Jr., III
library-names-suffix-of = { $role }: přípona

## Words for references, wherever they are shown.

library-untitled = Bez názvu
library-no-author = Bez autora
library-no-title = Bez názvu
library-in-library = Ve vaší knihovně

## Why a reference is taken for another: “the same DOI and the same file”.

library-reason-doi = stejné DOI
library-reason-isbn = stejné ISBN
library-reason-identical = shoda ve všem, co odlišuje jedno dílo od druhého
# How far the title, the author and the year agree: the same, like (titles
# that differ in a few letters or a subtitle, an author in common, years a
# year apart), or none (one of them says nothing of it).
library-reason-alike = { $title ->
    [same] { $author ->
        [same] { $year ->
            [same] stejný název, autor i rok
            [like] stejný název a autor, rok o jeden jiný
           *[none] stejný název a autor, rok jen u jednoho
        }
        [like] { $year ->
            [same] stejný název a rok a společný autor
            [like] stejný název, společný autor, rok o jeden jiný
           *[none] stejný název, společný autor, rok jen u jednoho
        }
       *[none] { $year ->
            [same] stejný název a rok, autor jen u jednoho
            [like] stejný název, rok o jeden jiný, autor jen u jednoho
           *[none] stejný název, autor a rok jen u jednoho
        }
    }
   *[like] { $author ->
        [same] { $year ->
            [same] stejný autor a rok a podobný název
            [like] stejný autor, podobný název, rok o jeden jiný
           *[none] stejný autor, podobný název, rok jen u jednoho
        }
        [like] { $year ->
            [same] stejný rok, podobný název, společný autor
            [like] podobný název, společný autor, rok o jeden jiný
           *[none] podobný název, společný autor, rok jen u jednoho
        }
       *[none] { $year ->
            [same] stejný rok, podobný název, autor jen u jednoho
            [like] podobný název, rok o jeden jiný, autor jen u jednoho
           *[none] podobný název, autor a rok jen u jednoho
        }
    }
}
library-reason-file = stejný soubor
# Several reasons: those before the last, set apart by commas, and the last.
library-reasons = { $others } a { $last }

## The size of a file.

library-size-bytes = { $size } B
library-size-kilobytes = { $size } kB
library-size-megabytes = { $size } MB

## What may be in the library already, while a reference is written.

library-duplicate-certain = Toto už ve vaší knihovně je.
library-duplicate-probable = Toto už ve vaší knihovně možná je.
library-duplicate-use = Použít tento

## Duplicates in the library.

library-duplicates-title = Duplicity
library-duplicates-count = { $count ->
    [one] { $count } záznam je v knihovně zřejmě vícekrát
    [few] { $count } záznamy jsou v knihovně zřejmě vícekrát
   *[other] { $count } záznamů je v knihovně zřejmě vícekrát
}
library-duplicates-none = Žádné duplicity
    .text = Žádný záznam zřejmě není v knihovně vícekrát.
library-duplicates-no-more = Žádné další duplicity
    .text = Citace sloučených záznamů teď citují ty, které byly ponechány.
library-duplicates-how = Když se záznamy slučují v jeden, ten, který ponecháte, dostane od ostatních, co mu chybí, a kde se liší, ponechá si své. Jejich soubory a sbírky se spojí a co je cituje, cituje ponechaný.
library-duplicates-same = Stejné
library-duplicates-probably-same = Pravděpodobně stejné
library-duplicates-keep-which = Který ponechat
library-duplicates-kept = Ponechán
library-duplicates-different = Jsou různé
library-duplicates-merge = Sloučit v jeden
library-duplicates-merging = Slučují se…
library-duplicates-failed = V knihovně nelze hledat duplicity
library-duplicates-merge-failed = Nelze je sloučit

## Importing references: what a file holds, against what the library has.

library-import = Importovat
library-import-title = Importovat záznamy
# What is imported, and from where: a file, Zotero.
library-import-subtitle = { $count ->
    [one] { $count } záznam { $source }
    [few] { $count } záznamy { $source }
   *[other] { $count } záznamů { $source }
}
library-import-review = { $count ->
    [one] { $count } záznam už ve vaší knihovně možná je
    [few] { $count } záznamy už ve vaší knihovně možná jsou
   *[other] { $count } záznamů už ve vaší knihovně možná je
}
library-import-new = { $count ->
    [one] { $count } nový záznam
    [few] { $count } nové záznamy
   *[other] { $count } nových záznamů
}
library-import-complete = { $count ->
    [one] { $count } záznam, který už ve vaší knihovně je, získá údaje
    [few] { $count } záznamy, které už ve vaší knihovně jsou, získají údaje
   *[other] { $count } záznamů, které už ve vaší knihovně jsou, získá údaje
}
library-import-known = { $count ->
    [one] { $count } záznam už ve vaší knihovně je
    [few] { $count } záznamy už ve vaší knihovně jsou
   *[other] { $count } záznamů už ve vaší knihovně je
}
library-import-repeated = { $count ->
    [one] { $count } záznam se v importu opakuje
    [few] { $count } záznamy se v importu opakují
   *[other] { $count } záznamů se v importu opakuje
}
# The fields a reference of the library would be given: “Would gain: Publisher, Place”.
library-import-would-gain = Získal by: { $fields }
library-import-gains-file = Soubor
library-import-gains-zotero = Svůj klíč v Zoteru
library-import-what-to-do = Co udělat
library-import-merge = Stejné dílo: doplnit ten, který mám
library-import-skip = Stejné dílo: ponechat můj, jak je
library-import-add = Jiné dílo: přidat je
# One answer for every candidate in the same case: “For all 16 that are the same: …”.
library-import-all-certain = { $count ->
    [one] Pro { $count }, který je stejný:
    [few] Pro všechny { $count }, které jsou stejné:
   *[other] Pro všech { $count }, které jsou stejné:
}
library-import-all-probable = { $count ->
    [one] Pro { $count }, který je pravděpodobně stejný:
    [few] Pro všechny { $count }, které jsou pravděpodobně stejné:
   *[other] Pro všech { $count }, které jsou pravděpodobně stejné:
}
library-import-all-merge = Doplnit ty, které mám
library-import-all-skip = Ponechat mé, jak jsou
library-import-all-add = Přesto je všechny přidat
library-import-more = { $count ->
    [one] …a { $count } další.
    [few] …a { $count } další.
   *[other] …a { $count } dalších.
}
library-import-unread = { $count ->
    [one] { $count } část souboru nelze přečíst
    [few] { $count } části souboru nelze přečíst
   *[other] { $count } částí souboru nelze přečíst
}
library-import-importing = Importuje se…
# How many are to be added, completed and left out: “3 to add, 1 to complete, 2 left out”.
library-import-counts = { $add } k přidání{ $merge ->
        [0] {""}
       *[other] , { $merge } k doplnění
    }{ $skip ->
        [0] {""}
       *[other] , { $skip } vynecháno
    }
library-import-failed = Import se nezdařil.

## The library: the list of references, and what can be done with them.

library-references = Záznamy
library-unread = Knihovnu nelze přečíst
library-all-references = Všechny záznamy
library-count = { $count ->
    [one] { $count } záznam
    [few] { $count } záznamy
   *[other] { $count } záznamů
}
library-selected = { $count ->
    [one] { $count } vybraný záznam
    [few] { $count } vybrané záznamy
   *[other] { $count } vybraných záznamů
}
library-selected-of = { $count ->
    [one] { $selected } z { $count } záznamu vybráno
    [few] { $selected } z { $count } záznamů vybráno
   *[other] { $selected } z { $count } záznamů vybráno
}
library-new-reference = Nový záznam
library-search = Hledat v knihovně
library-search-in = Hledat v { $name }
library-search-clear = Vymazat hledání
library-sort = Řadit
library-sort-author = Autor
library-sort-year = Rok
library-sort-title = Název
library-sort-added = Datum přidání
library-sort-modified = Datum změny
library-sort-descending = Sestupně

## The filters, beside the search: what kind of publication, who published it, and when.

library-filters = Filtr
library-filters-on = { $count ->
    [one] Filtr: { $count } zapnutý
    [few] Filtr: { $count } zapnuté
   *[other] Filtr: { $count } zapnutých
}
library-filter-kind = Druh
library-filter-publisher = Nakladatel
library-filter-publisher-hint = Část názvu
library-filter-any-publisher = Kterýkoli nakladatel
library-filter-year = Rok
library-filter-from = Od
library-filter-to = Do
library-filter-clear = Zrušit filtry
library-filter-nothing-here = Zde není co filtrovat.
# When the filters let nothing through.
library-nothing-passes = Žádný zobrazený záznam filtry neprojde.
library-import-export = Import a export
library-import-file = Importovat soubor…
    .hint = BibLaTeX nebo BibTeX
library-paste = Vložit záznamy…
library-add-pdfs = Přidat soubory PDF…
    .hint = Každý se dohledá a uloží
library-import-zotero = Importovat ze Zotera…
library-find-duplicates = Najít duplicity…
library-map-library = Mapa knihovny…
library-map-collection = Mapa sbírky „{ $name }“…
library-export-library = Exportovat knihovnu…
library-export-collection = Exportovat „{ $name }“…
library-export-one = Exportovat…
library-export-many = { $count ->
    [one] Exportovat { $count } záznam…
    [few] Exportovat { $count } záznamy…
   *[other] Exportovat { $count } záznamů…
}
library-export-title = Exportovat záznamy
# What a file of exported references is called, before it is given a name.
library-export-file-references = zaznamy
library-export-file-library = knihovna
library-exported = { $count ->
    [one] { $count } záznam exportován
    [few] { $count } záznamy exportovány
   *[other] { $count } záznamů exportováno
}
library-export-failed = Export se nezdařil
library-empty = Vaše knihovna je prázdná
    .text = Záznamy, které sem přidáte, jsou k dispozici ve všech vašich projektech. Začněte jedním, nebo načtěte ty, které už máte.
library-collection-empty = V této sbírce zatím nic není
    .text = Přetáhněte sem záznamy z knihovny, nebo přidejte nový.
library-nothing-found = Nic nenalezeno
    .text = Žádný záznam neobsahuje všechna tato slova.
library-open-file = Otevřít soubor
library-file-open-failed = Soubor nelze otevřít
library-add-to-collection = Přidat do sbírky
library-remove-from = Odebrat ze sbírky „{ $name }“
library-copy-key = Kopírovat citační klíč
library-copied-key = Zkopírováno „{ $key }“
library-copy-biblatex = Kopírovat jako BibLaTeX
library-copied = Zkopírováno
library-delete-one-title = Smazat „{ $name }“?
library-delete-many-title = { $count ->
    [one] Smazat { $count } záznam?
    [few] Smazat { $count } záznamy?
   *[other] Smazat { $count } záznamů?
}
# $projects is the number of projects that cite what is deleted, which keep copies of their own.
library-delete-one = Tím se záznam odstraní z vaší knihovny, ze všech sbírek{ $files ->
        [0] {""}
        [one] , spolu s { $files } přiloženým souborem
        [few] , spolu se { $files } přiloženými soubory
       *[other] , spolu s { $files } přiloženými soubory
    }.{ $projects ->
        [0] {""}
        [one] {" "}Je citován v jednom projektu, který si ponechá jeho kopii.
        [few] {" "}Je citován ve { $projects } projektech, které si ponechají jeho kopii.
       *[other] {" "}Je citován v { $projects } projektech, které si ponechají jeho kopii.
    }
library-delete-many = Tím se odstraní z vaší knihovny, ze všech sbírek{ $files ->
        [0] {""}
        [one] , spolu s { $files } přiloženým souborem
        [few] , spolu se { $files } přiloženými soubory
       *[other] , spolu s { $files } přiloženými soubory
    }.{ $projects ->
        [0] {""}
        [one] {" "}Projekt, který některé z nich cituje, si jejich kopii ponechá.
        [few] {" "}{ $projects } projekty, které některé z nich citují, si jejich kopii ponechají.
       *[other] {" "}{ $projects } projektů, které některé z nich citují, si jejich kopii ponechá.
    }
library-delete-failed = Záznamy nelze smazat
library-not-done = To se nepodařilo

## Collections.

library-collections = Sbírky
# The projects that cite a work, in its pane.
library-cited-in = Citován v
library-not-cited = Není citován v žádném projektu.
library-cited-reading = Čtou se projekty…
library-collections-hint = Sbírky shromažďují záznamy k tématu nebo k práci. Záznam může být v libovolném počtu sbírek.
library-collection-new = Nová sbírka
library-collection-new-inside = Nová sbírka uvnitř
library-collection-new-under = Nová sbírka ve sbírce „{ $name }“
library-collection-move-to = Přesunout do
library-collection-name = Název sbírky
library-collection-name-failed = Sbírku nelze pojmenovat
library-collection-expand = Rozbalit
library-collection-collapse = Sbalit
library-collection-to-top = Přesunout na nejvyšší úroveň
library-collection-move-failed = Sbírku nelze přesunout
library-collection-added = { $count ->
    [one] { $count } záznam přidán do „{ $name }“
    [few] { $count } záznamy přidány do „{ $name }“
   *[other] { $count } záznamů přidáno do „{ $name }“
}
library-collection-already = Už je v „{ $name }“
library-collection-delete = Smazat sbírku
library-collection-delete-title = Smazat sbírku „{ $name }“?
# The number is that of the collections inside the one that is deleted.
library-collection-delete-message = { $inside ->
    [0] Záznamy zůstanou ve vaší knihovně.
   *[other] Sbírky uvnitř ní se smažou také. Záznamy zůstanou ve vaší knihovně.
}
library-collection-delete-failed = Sbírku nelze smazat
library-collection-count = { $count ->
    [one] { $count } sbírka
    [few] { $count } sbírky
   *[other] { $count } sbírek
}

## A map of the library, or of a collection: a new project.

library-map-title-library = Mapa knihovny
library-map-title-collection = Mapa sbírky
# The name a project made of the whole library is given.
library-map-library-name = Knihovna
library-map-name = Název
library-map-name-hint = Název projektu, jeho mapy a prvku ve středu mapy.
library-map-what-library = Sbírky se stanou prvky, vnořenými, jak jsou, a každý záznam prvkem pod svou sbírkou, jehož textem je jeho citace. Záznamy, které nejsou v žádné sbírce, stojí u středu.
library-map-what-collection = Sbírky uvnitř ní se stanou prvky, vnořenými, jak jsou, a každý záznam prvkem pod svou sbírkou, jehož textem je jeho citace.
library-map-nothing = Nejsou žádné záznamy, které by šly dát na mapu.
library-map-make = Vytvořit projekt
library-map-making = Vytváří se projekt…
library-map-failed = Projekt nelze vytvořit.

## Bringing references in, from anywhere in the application.

library-files = { $count ->
    [one] { $count } soubor
    [few] { $count } soubory
   *[other] { $count } souborů
}
library-open-failed = Záznam nelze otevřít
library-known = { $count ->
    [one] Už je ve vaší knihovně
    [few] Už jsou ve vaší knihovně
   *[other] Už jsou ve vaší knihovně
}
library-nothing-to-import = Není co importovat
library-none-found = Žádné záznamy nebyly nalezeny.
library-import-kinds = Záznamy se čtou ze souborů .bib a vytvářejí ze souborů PDF.
library-filter-bib = BibLaTeX a BibTeX
library-filter-all = Všechny soubory
library-files-read-failed = { $count ->
    [one] Soubor nelze přečíst
    [few] Soubory nelze přečíst
   *[other] Soubory nelze přečíst
}
library-text-read-failed = Text nelze přečíst
library-add-pdfs-title = Přidat soubory PDF
library-pdfs-working = { $count ->
    [one] Zjišťuje se, co soubor je…
    [few] Zjišťuje se, co { $count } soubory jsou…
   *[other] Zjišťuje se, co { $count } souborů je…
}
# While PDF files are found out about, one after another.
library-pdfs-progress = { $done } z { $count }: { $name }
library-stop = Zastavit
# What came of an import, as a list: “3 references added, 1 completed, 2 files stored”.
library-imported-added = { $count ->
    [one] { $count } záznam přidán
    [few] { $count } záznamy přidány
   *[other] { $count } záznamů přidáno
}
library-imported-completed = { $count ->
    [one] { $count } doplněn
    [few] { $count } doplněny
   *[other] { $count } doplněno
}
library-imported-skipped = { $count } už v knihovně
library-imported-files = { $count ->
    [one] { $count } soubor uložen
    [few] { $count } soubory uloženy
   *[other] { $count } souborů uloženo
}
library-imported-nothing = Nic se nezměnilo
library-paste-title = Vložit záznamy
library-paste-subtitle = BibLaTeX nebo BibTeX, libovolný počet záznamů
library-paste-continue = Pokračovat
library-source-label = Zdroj BibLaTeX

## Importing from Zotero.

library-zotero-title = Importovat ze Zotera
# The file is the database of Zotero, zotero.sqlite, shown as code.
library-zotero-not-found = V tomto počítači nebylo nalezeno žádné Zotero na místech, kde obvykle má svá data. Má-li je jinde, ukažte kde: složku, v níž je { $file }.
library-zotero-lead = Co se importuje, zkopíruje se do vaší knihovny i se soubory. Zotero se jen čte a nic se v něm nemění; může mezitím běžet.
library-zotero-choose = Datová složka Zotera
library-zotero-none-there = Tam žádné Zotero není.
library-zotero-unread = Zotero nelze přečíst.
library-zotero-library = Knihovna
# A library of Zotero, with the number of its references.
library-zotero-library-option = { $name } ({ $count })
library-zotero-my-library = Moje knihovna
library-zotero-what = Co importovat
library-zotero-everything = Vše
library-zotero-with-files = S přiloženými soubory
library-zotero-with-notes = S poznámkami, jako anotacemi
library-zotero-elsewhere = Jiné místo…
library-zotero-show-where = Ukázat kde…
library-zotero-reading = Čte se…
library-zotero-read = { $count ->
    [0] Načíst
    [one] Načíst { $count } záznam
    [few] Načíst { $count } záznamy
   *[other] Načíst { $count } záznamů
}

## Writing a reference.

library-dialog-edit = Upravit záznam
library-dialog-add = Přidat záznam
library-dialog-back = Zpět k formuláři
library-dialog-open-failed = Záznam nelze otevřít.
library-dialog-save-failed = Záznam nelze uložit.
# The entry as BibLaTeX, as against the form.
library-source = Zdroj
library-source-unread = Zdroj nelze přečíst.

## A reference, beside the list.

library-pane-label = Záznam
library-pane-more = Další
library-pane-saved = Uloženo
library-pane-editing = Upravuje se…
library-pane-not-saved = Neuloženo
library-pane-unread = Záznam nelze přečíst.
library-pane-save-failed = Změny nelze uložit.
library-pane-note-placeholder = Co si o tom myslíte. Pro vás: není to součást toho, co se cituje.
library-pane-files = Soubory
library-pane-attach = Přiložit
library-pane-attach-title = Přiložit soubory
library-pane-attach-failed = Soubor nelze přiložit
# Of a file that is attached, and not where it should be.
library-pane-missing = chybí
library-pane-reveal = Zobrazit ve správci souborů
library-pane-reveal-failed = Složku nelze otevřít
library-pane-no-files = Žádné soubory. Přiložte PDF, nebo je sem přetáhněte.
library-pane-detach = Odebrat soubor
library-pane-detach-title = Odebrat „{ $name }“?
library-pane-detach-message = Soubor se smaže z úložiště knihovny, pokud ho nepoužívá jiný záznam.
library-pane-detach-failed = Soubor nelze odebrat
library-pane-leave-collection = Odebrat ze sbírky { $name }
library-pane-duplicate = Duplikovat
    .hint = Nový záznam začínající těmito údaji
library-pane-edit-source = Upravit zdroj…
library-pane-source-subtitle = Záznam jako BibLaTeX. Většina věcí jde snáz ve formuláři.
library-pane-source-failed = Zdroj nelze zobrazit
library-pane-added = Přidáno { $date }
library-pane-added-changed = Přidáno { $added } · změněno { $changed }

## Looking up a reference.

library-lookup-placeholder = Dohledat: DOI, ISBN, nebo slova z názvu a autor
library-lookup-label = Dohledat záznam
library-lookup-failed = Nic se nepodařilo dohledat.
# Where the reference came from: a service such as Crossref.
library-lookup-filled = Vyplněno ze služby { $source }.
library-lookup-others = { $count ->
    [one] { $count } další záznam
    [few] { $count } další záznamy
   *[other] { $count } dalších záznamů
}
library-lookup-scope = Co hledat
library-lookup-any = Cokoli
library-lookup-books = Knihy
library-lookup-articles = Články
library-lookup-none = Nic nebylo nalezeno. Méně slov může najít víc: příjmení autora a slovo či dvě z názvu.
# What was asked for: a DOI, an ISBN, a number of arXiv or of PubMed.
library-lookup-unknown = O tomto { $kind ->
        [doi] DOI
        [isbn] ISBN
        [arxiv] čísle arXivu
       *[pmid] čísle PubMedu
    } není tam, kde se hledalo, nic známo. Záznam lze zadat ručně níže.

## What the writer writes about a work.

library-notes = Poznámky
library-notes-yours = Vaše poznámky
library-notes-on-work = Vaše poznámky k tomuto dílu
library-notes-read = Číst vaše poznámky
library-notes-write = Napsat poznámku
library-notes-write-on-work = Napsat poznámku k tomuto dílu
library-notes-not-in-library = Záznam, který není ve vaší knihovně
library-notes-this-project = V tomto projektu
library-notes-all-projects = Ve všech projektech
library-notes-project-placeholder = Co si o tom myslíte, pro tuto práci
library-notes-all-placeholder = Co si o tom myslíte, ať to citujete kdekoli
library-notes-keep-for-all = Ponechat pro všechny projekty
library-notes-write-for-all = Psát pro všechny projekty
library-notes-carried = Záznam přišel s projektem a není ve vaší knihovně. Co je zde napsáno, mají všichni, kdo mají projekt.
library-notes-kept = Uchováno se záznamem ve vaší knihovně. Jde s projektem, který dílo cituje.
library-notes-unread = Vaše poznámky nelze přečíst
library-notes-unsaved = Vaši poznámku nelze uchovat
