# Citations that were found in a text written elsewhere, and the panel at
# the side in which they are gone through (ADR 0015), in English. See
# locales/README.md.

## The panel.

found-title = Nalezené citace
# On the tab of the panel, beside the other tabs: short.
found-tab = Nalezené citace
found-between = Mezi mapou a nalezenými citacemi
found-taken = Co se bere za citace
found-taken-always = Co vytvořil program, a značky
found-taken-years = Závorky s rokem
found-taken-named = Poznámky, které jmenují dílo z knihovny
found-taken-notes = Každá poznámka
found-asking = Dotazuje se knihovna…
found-make-certain = { $count ->
    [one] Udělat citaci z té jisté
    [few] Udělat citace ze { $count } jistých
   *[other] Udělat citace z { $count } jistých
}
found-made = { $count ->
    [one] Byla vytvořena jedna citace
    [few] Byly vytvořeny { $count } citace
   *[other] Bylo vytvořeno { $count } citací
}
found-made-undo = Ctrl+Z je vezme zpět, jako jeden krok.
found-library-failed = Knihovny se nepodařilo zeptat.
found-nothing = Není co procházet
found-nothing-looked = V této mapě nezbývá žádná nalezená citace a nic v ní jako citace nevypadá.
found-nothing-looked-more = V této mapě nezbývá žádná nalezená citace a nic v ní jako citace nevypadá. Výše lze za citace brát víc.
found-nothing-not-looked = V této mapě nezbývá žádná nalezená citace. Text, který jen vypadá jako citace, se hledá, když výše řeknete, co se za ni má brát: závorky s rokem, nebo poznámky.
found-list-label = Co je k projití
found-untitled = Bez názvu
found-in-a-note = V poznámce
# The element of the map a citation stands in.
found-in = V „{ $element }“
found-in-note-of = V poznámce k „{ $element }“
# Set small and high after the words a note stands after.
found-note-mark = pozn.
found-position = { $index } z { $count }
found-previous = Předchozí
found-next = Další
found-list-show = Zobrazit seznam
found-list-hide = Skrýt seznam
found-later = Později
found-leave = Ponechat jako text
found-make = Udělat z toho citaci

## How sure the library is of what it proposes.

found-sure-certain = Knihovna to má jistě
found-sure-likely = Knihovna má, co to pravděpodobně je
found-sure-possible = Knihovna má, co to může být
found-sure-none = Některé z děl ještě nemá záznam

## By what a citation was found.

found-by-zotero = Vytvořeno Zoterem
found-by-mendeley = Vytvořeno Mendeleyem nebo programem, který píše jako on
found-by-key = Značka, která jmenuje záznam
found-by-form = Vzato za citaci podle toho, jak vypadá

## The citation that is to be made.

found-the-citation = Citace
found-no-works = Nejmenuje žádné dílo. Přidejte je, nebo to ponechte jako text, jímž to je.
found-add-work = Přidat dílo
found-author-in-text = Autor v textu: Nagy (1979)
found-pick-work = Citované dílo: autor, název, rok
found-pick-add = Přidat dílo do citace
found-too-little = Soubor říká o tomto díle příliš málo na to, aby z něj šel udělat záznam
found-reference-failed = Záznam nelze vytvořit

## A citation that stands in a note.

found-in-note = Stojí v poznámce
found-note-becomes = Poznámka se stane citací
# What the note says besides its works, which becomes the words before them, after them, or both.
found-note-around = Co poznámka říká navíc, jde před její díla a za ně{ $has ->
        [before] : „{ $before }“ před
        [after] : „{ $after }“ za
       *[both] : „{ $before }“ před, „{ $after }“ za
    }. Citační styl to vysází v řádku, nebo v poznámce.
found-note-style = Citační styl to vysází v řádku, nebo v poznámce.
found-citation-in-note = Citace stojí v poznámce
    .hint = Poznámka zůstane poznámkou s tím, co říká navíc.
found-for-all = Tak pro všechny následující
found-note-not = Nestojí v poznámce.
# What else the note holds, by the name of what it is in the text.
found-note-holds = Poznámka obsahuje { $what ->
        [math] vzorec
        [crossref] křížový odkaz
        [citation] citaci
        [hard_break] druhý řádek
       *[other] něco, co není text
    }, což slova před dílem a za ním nemohou obsahovat.
found-note-another = Poznámka obsahuje další nalezenou citaci, která by se ve slovech za touto ztratila.

## Why what was asked could not be done.

found-trouble-gone = Už není v textu.
found-trouble-changed = Text se zde od návrhu změnil a byl prohlédnut znovu.
found-trouble-cannot = Zde z toho citaci udělat nelze.

## One work of a citation, as the text says it is.

# Those who made it: “Nagy and Lord”, “Nagy et al.”
found-people-two = { $first } a { $second }
found-people-more = { $first } et al.
found-work-a-work = Dílo
found-work-looking = { $work } se hledá ve vaší knihovně…
found-work-no-tag = { $work } je značka, kterou nemá žádný záznam vaší knihovny.
found-work-not-found = { $work } nebylo ve vaší knihovně nalezeno.
found-work-chosen = Zvoleno vámi
# The writer chose this reference for another citation of the same work, and this one followed.
found-work-followed = Jak jste zvolili pro totéž dílo
found-work-certain = Jisté
found-work-likely = Pravděpodobné
found-work-possible = Možné
# What the text says the work is.
found-work-for = pro „{ $work }“
found-work-others = Jiné záznamy, jimiž může být
found-work-or = Nebo
found-work-may-be = Může to být
found-work-another = Jiný…
found-work-find = Najít…
found-work-add = Přidat do knihovny
