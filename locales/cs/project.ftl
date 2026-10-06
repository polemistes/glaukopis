# A project: its view, the tabs of its maps, what is done to elements, and
# the panels at the side with the references and the pictures.

project-list-unreadable = Projekty nelze přečíst

## The view of a project

project-open-failed = Projekt nelze otevřít
# Shown under the words above when nothing more is known of why.
project-open-failed-detail = Projekt nelze otevřít.
project-back = Zpět k projektům
project-fetching = Stahuje se projekt
project-fetching-offline = Server je nedostupný. Projekt se stáhne, až to půjde.
project-fetching-on-the-way = Je na cestě ze serveru.
project-all-projects = Všechny projekty
project-name = Název projektu
project-rename = Přejmenovat projekt
project-not-saved = Neuloženo
project-redo = Znovu
project-view = Zobrazení mapy
project-view-this = Zobrazení této mapy
project-diagram = Diagram
project-text = Text
project-one-at-a-time = Po jedné
project-side-by-side = Dvě vedle sebe
project-close-side = Zavřít tuto stranu
project-references = Záznamy
project-pictures = Obrázky
project-side = Záznamy, obrázky, historie a změny
project-side-tabs = Co postranní panel ukazuje
project-side-map = Mapa
project-preview = Náhled a export
project-share = Sdílet
project-shared = Sdílený
project-shared-offline = Sdílený · server je nedostupný
project-shared-too-large = Sdílený · server nepřijímá poslední změny
project-between-maps = Mezi oběma mapami
project-between-preview = Mezi mapou a náhledem
project-between-pictures = Mezi mapou a obrázky
project-between-references = Mezi mapou a záznamy

## When the sharing ends from the other side

project-unshared = Projekt už není sdílen
project-unshared-this = Tento projekt už není sdílen
project-left-out = Už nejste mezi spolupracovníky
project-unshared-unfetched = Nebyl stažen, takže z něj v tomto počítači nic není.
project-unshared-kept = Ten, kdo ho sdílel, ho ze serveru odebral. Projekt si ponecháte, jak je teď, a můžete na něm dál pracovat sami.
project-left-out-kept = Projekt si ponecháte, jak je teď, a můžete na něm dál pracovat sami. Co ostatní napíší potom, se k vám nedostane.
project-understood = Rozumím

## Files dropped on the project

project-drop-picture = Přetáhněte obrázek na prvek, k němuž patří
project-cited-in = { $count ->
    [one] Záznam je citován v „{ $name }“
    [few] { $count } záznamy jsou citovány v „{ $name }“
   *[other] { $count } záznamů je citováno v „{ $name }“
}
# As above, where the element has no name.
project-cited-in-element = { $count ->
    [one] Záznam je citován v „prvku“
    [few] { $count } záznamy jsou citovány v „prvku“
   *[other] { $count } záznamů je citováno v „prvku“
}

## The tabs of the maps

# The name of a map, or of an element, that has none.
project-untitled = Bez názvu
# The name of a copy of a map.
project-map-copy = { $name }, kopie
project-maps = Mapy
project-map-name = Název mapy
project-new-map = Nová mapa
project-map-from-document = Mapa z dokumentu…
project-drop-on-map = Pusťte na mapu, kam se má přesunout · s Ctrl se kopíruje
project-duplicate = Duplikovat
project-duplicate-hint = Kopie k práci; tato zůstane, jak je
project-open-beside = Otevřít vedle
project-open-beside-hint = Dvě mapy vedle sebe, pro přesouvání prvků mezi nimi
project-this-map-actions = Tato mapa a mapy
project-maps-hint = Mapy projektu: zvolte jednu a otevře se
project-map-beside = vedle této
project-side-by-side-short = Vedle sebe
project-preview-short = Náhled
project-found = Nalezené citace…
# The count is of those found in the map.
project-found-hint = { $count } k projití a převedení na citace
project-found-none = A text, který vypadá jako citace
project-delete-map = Smazat mapu
project-delete-map-title = Smazat mapu „{ $name }“?
project-delete-map-message = { $count ->
    [one] { $count } prvek a text v něm zmizí. Dokud je projekt otevřený, lze to vzít zpět.
    [few] { $count } prvky a text v nich zmizí. Dokud je projekt otevřený, lze to vzít zpět.
   *[other] { $count } prvků a text v nich zmizí. Dokud je projekt otevřený, lze to vzít zpět.
}
project-copied-to = Zkopírováno do „{ $name }“
project-moved-to = Přesunuto do „{ $name }“

## What is done to elements, in the diagram and in the text

project-add-under = Přidat prvek pod něj
project-add = Přidat prvek
project-add-after = Přidat prvek za něj
project-write-text = Psát jeho text
project-double-click = Dvojklik
project-associate = Spojit s…
project-associate-hint = Pak klepněte na druhý prvek
project-heading = Tisknout název jako nadpis
project-heading-hint = Vypnuto: název je štítek pro vás; tiskne se jen text
project-leave-out = Vynechat z dokumentu
project-leave-out-hint = Se vším, co je pod ním
# An element that stands for another map: in the document, that map is in its place.
project-stands-for = Zastupuje „{ $name }“
project-stand-for = Zastupovat jinou mapu
project-stand-for-heading = V dokumentu na jeho místo vstoupí tato mapa
project-stand-for-none = Žádná
project-copy-to-map = Kopírovat do mapy
project-copy = Kopírovat
# Pasting what was copied under the element the menu is of.
project-paste-under = Vložit pod něj
project-move-to-map = Přesunout do mapy
project-map-from-branch = Nová mapa z této větve
project-map-from-branch-hint = Kopie k práci; tato zůstane
project-detach = Odpojit od nadřazeného
project-detach-hint = Volný prvek, k umístění později
project-tidy-branch = Uspořádat tuto větev
project-place-automatically = Umístit automaticky
project-delete-keeping = Smazat a ponechat, co je pod ním
project-centre-stays = Střed mapy zůstává
project-centre-stays-detail = Mapu samu smažete z její karty.
# One element was deleted, with the elements that were under it.
project-deleted = { $under ->
    [0] „{ $name }“ byl smazán
    [one] „{ $name }“ byl smazán s { $under } prvkem pod ním
    [few] „{ $name }“ byl smazán se { $under } prvky pod ním
   *[other] „{ $name }“ byl smazán s { $under } prvky pod ním
}
project-deleted-many = { $count ->
    [one] { $count } prvek smazán
    [few] { $count } prvky smazány
   *[other] { $count } prvků smazáno
}

project-delete-busy-title = Někdo tu píše
# $names: those who are at what would be deleted, as a list.
project-delete-busy-message = { $names } { $count ->
    [one] právě pracuje
    [few] právě pracují
   *[other] právě pracují
} v tom, co by bylo smazáno. Co se tam teď píše, by se s tím ztratilo a nešlo by to vrátit.
project-delete-busy-confirm = Přesto smazat

## An element, open for writing, and as it is shown when the pointer rests on it

project-element = Prvek
project-name-placeholder = Název
project-write-here = Pište sem. Citovat lze napsáním @.
project-words = { $count ->
    [one] { $count } slovo
    [few] { $count } slova
   *[other] { $count } slov
}
project-read-on = Dvojklikem čtěte dál
project-stands-for-map = Zastupuje mapu „{ $name }“
project-name-not-printed = Název se netiskne
project-left-out-of-document = Vynecháno z dokumentu

## The panels at the side: the references and the pictures

project-this-map = Tato mapa
project-project = Projekt
project-library = Knihovna
project-nothing-found = Nic nenalezeno
project-edit-reference = Upravit záznam…
project-new-reference = Nový záznam
project-import-file = Importovat soubor
project-which-references = Které záznamy
project-search-references = Hledat záznamy
project-library-empty = Vaše knihovna je prázdná
project-library-empty-hint = Přidejte záznam, nebo importujte ty, které máte.
project-no-references = Zatím žádné záznamy
project-no-references-hint = Co při psaní citujete, je uvedeno zde. Chcete-li citovat, zvolte Citovat nad textem, nebo napište @.
project-cited-in-heading = Citován v
project-not-cited = V tomto projektu není citován.
project-references-drag = Přetáhněte záznam do textu, abyste ho tam citovali, nebo na prvek, abyste ho citovali na konci jeho textu.
# The count is of the references the project cites that the library lacks.
project-references-foreign = { $count ->
    [one] { $count } v tomto projektu není ve vaší knihovně.
    [few] { $count } v tomto projektu nejsou ve vaší knihovně.
   *[other] { $count } v tomto projektu není ve vaší knihovně.
}
# The store of pictures.
project-store = Úložiště
project-open-picture = Otevřít…
project-put-into-text = Vložit do textu
project-add-pictures = Přidat obrázky ze souborů
project-which-pictures = Které obrázky
project-search-pictures = Hledat obrázky
project-a-picture = Obrázek
project-with-notes = S poznámkami
project-not-on-computer = Není v tomto počítači
project-nothing-said = Zatím se o něm nic neříká
project-store-empty = Úložiště je prázdné
project-store-empty-hint = Přidejte obrázky ze souborů, nebo je přetáhněte na text.
project-no-pictures = Zatím žádné obrázky
project-no-pictures-map = Zde jsou uvedeny obrázky vyobrazení této mapy. Ty z úložiště jsou pod Úložiště.
project-no-pictures-project = Zde jsou uvedeny obrázky vyobrazení projektu. Ty z úložiště jsou pod Úložiště.
project-pictures-drag = Přetáhněte obrázek do textu, aby se z něj tam stalo vyobrazení, nebo na prvek, aby se vložil na konec jeho textu.
# The count is of the pictures that are used and are not in the store of this computer.
project-pictures-absent-map = { $count ->
    [one] { $count } v této mapě není v tomto počítači.
    [few] { $count } v této mapě nejsou v tomto počítači.
   *[other] { $count } v této mapě není v tomto počítači.
}
project-pictures-absent-project = { $count ->
    [one] { $count } v tomto projektu není v tomto počítači.
    [few] { $count } v tomto projektu nejsou v tomto počítači.
   *[other] { $count } v tomto projektu není v tomto počítači.
}

## Shared by the diagram and the text

# A count of elements that stands alone, as a label of what is dragged.
project-elements = { $count ->
    [one] { $count } prvek
    [few] { $count } prvky
   *[other] { $count } prvků
}
# One of the others who work on a shared project is at an element.
project-other-here = { $name } je zde
project-link-placeholder = Jak spolu souvisejí
project-link-label = Popisek spojení

## A copy and its original, in another map.
copy-title = Kopie a její originál
copy-from = Zkopírováno z „{ $name }“ v mapě „{ $map }“
copy-original-changed = Originál se od zkopírování, nebo od posledního nahlédnutí, změnil.
copy-original-same = Originál je, jaký byl při zkopírování.
copy-original-unknown = Zda se originál od zkopírování změnil, není známo: kopie vznikla dřív, než se to začalo uchovávat.
copy-original-gone = Originál už není.
copy-how-shown = Níže je přeškrtnuto, co má jen originál, a označeno, co má jen tato kopie.
copy-alike = Jejich názvy a texty jsou shodné. Mohou se lišit v tom, co nejsou slova: v citacích, obrázcích, vyznačení.
copy-only-original = Jen v originálu
copy-only-copy = Jen v této kopii
copy-go = Přejít k originálu
copy-seen = Ponechat tuto kopii, jak je
copy-take = Převzít název a text originálu
copy-changed-mark = Originál se od zkopírování změnil
copy-compare = Porovnat s originálem…
copy-copied-from = Zkopírováno z „{ $name }“ v „{ $map }“
copy-copied-from-changed = Zkopírováno z „{ $name }“ v „{ $map }“, který se od té doby změnil

## How far the writing of an element has come, as its writer says.
status = Stav
status-idea = Nápad
status-draft = Koncept
status-done = Hotovo
status-none = Bez stavu
# Of an element, where its status is shown: "Draft · 340 words".
status-of = { $status } · { $count ->
    [one] { $count } slovo
    [few] { $count } slova
   *[other] { $count } slov
}
status-count-idea = { $count ->
    [one] { $count } nápad
    [few] { $count } nápady
   *[other] { $count } nápadů
}
status-count-draft = { $count ->
    [one] { $count } koncept
    [few] { $count } koncepty
   *[other] { $count } konceptů
}
status-count-done = { $count } hotovo
# The words of the drafts and of what is done, in a map.
status-words-written = { $count ->
    [one] { $count } slovo napsáno
    [few] { $count } slova napsána
   *[other] { $count } slov napsáno
}
status-progress = Jak daleko mapa došla
