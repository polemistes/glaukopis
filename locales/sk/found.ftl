# Citations that were found in a text written elsewhere, and the panel at
# the side in which they are gone through (ADR 0015), in English. See
# locales/README.md.

## The panel.

found-title = Nájdené citácie
# On the tab of the panel, beside the other tabs: short.
found-tab = Nájdené citácie
found-between = Medzi mapou a nájdenými citáciami
found-taken = Čo sa považuje za citácie
found-taken-always = Čo vytvoril program, a značky
found-taken-years = Zátvorky s rokom
found-taken-named = Poznámky, ktoré menujú dielo z knižnice
found-taken-notes = Každá poznámka
found-asking = Pýta sa knižnice…
found-make-certain = { $count ->
    [one] Urobiť citáciu z tej jednej istej
    [few] Urobiť citácie z { $count } istých
   *[other] Urobiť citácie z { $count } istých
}
found-made = { $count ->
    [one] Vytvorila sa jedna citácia
    [few] Vytvorili sa { $count } citácie
   *[other] Vytvorilo sa { $count } citácií
}
found-made-undo = Ctrl+Z ich vráti späť, ako jeden krok.
found-library-failed = Knižnice sa nepodarilo opýtať.
found-nothing = Nie je čo prechádzať
found-nothing-looked = V tejto mape neostala žiadna nájdená citácia a nič v nej na citáciu nevyzerá.
found-nothing-looked-more = V tejto mape neostala žiadna nájdená citácia a nič v nej na citáciu nevyzerá. Za citácie možno považovať aj viac, hore.
found-nothing-not-looked = V tejto mape neostala žiadna nájdená citácia. Text, ktorý na citáciu len vyzerá, sa hľadá, keď hore poviete, čo sa má za citáciu považovať: zátvorky s rokom alebo poznámky.
found-list-label = Čo treba prejsť
found-untitled = Bez názvu
found-in-a-note = V poznámke
# The element of the map a citation stands in.
found-in = V „{ $element }“
found-in-note-of = V poznámke k „{ $element }“
# Set small and high after the words a note stands after.
found-note-mark = poznámka
found-position = { $index } z { $count }
found-previous = Predchádzajúca
found-next = Ďalšia
found-list-show = Zobraziť zoznam
found-list-hide = Skryť zoznam
found-later = Neskôr
found-leave = Nechať ako text
found-make = Urobiť z nej citáciu

## How sure the library is of what it proposes.

found-sure-certain = Knižnica ju má určite
found-sure-likely = Knižnica má, čo je pravdepodobne ona
found-sure-possible = Knižnica má, čo by mohla byť ona
found-sure-none = Jedno z jej diel ešte nemá záznam

## By what a citation was found.

found-by-zotero = Vytvorené Zoterom
found-by-mendeley = Vytvorené Mendeley alebo programom, ktorý píše ako ono
found-by-key = Značka, ktorá menuje záznam
found-by-form = Za citáciu považované podľa toho, ako vyzerá

## The citation that is to be made.

found-the-citation = Citácia
found-no-works = Nemenuje žiadne dielo. Pridajte nejaké alebo ju nechajte ako text, ktorým je.
found-add-work = Pridať dielo
found-author-in-text = Autor v texte: Nagy (1979)
found-pick-work = Citované dielo: autor, názov, rok
found-pick-add = Pridať dielo do citácie
found-too-little = Súbor hovorí o tomto diele príliš málo na to, aby sa z neho dal urobiť záznam
found-reference-failed = Záznam sa nepodarilo vytvoriť

## A citation that stands in a note.

found-in-note = Stojí v poznámke
found-note-becomes = Poznámka sa stane citáciou
# What the note says besides its works, which becomes the words before them, after them, or both.
found-note-around = Čo poznámka hovorí okrem svojich diel, ide pred ne a za ne{ $has ->
        [before] : „{ $before }“ pred
        [after] : „{ $after }“ za
       *[both] : „{ $before }“ pred, „{ $after }“ za
    }. Citačný štýl to vysádza do riadku alebo do poznámky.
found-note-style = Citačný štýl to vysádza do riadku alebo do poznámky.
found-citation-in-note = Citácia stojí v poznámke
    .hint = Poznámka ostane poznámkou s tým, čo ešte hovorí.
found-for-all = Tak pre všetky nasledujúce
found-note-not = Nestojí v poznámke.
# What else the note holds, by the name of what it is in the text.
found-note-holds = Poznámka obsahuje { $what ->
        [math] vzorec
        [crossref] odkaz
        [citation] citáciu
        [hard_break] druhý riadok
       *[other] niečo, čo nie je text
    }, čo slová pred dielom a za ním obsahovať nemôžu.
found-note-another = Poznámka obsahuje ďalšiu nájdenú citáciu, ktorá by sa v slovách za touto stratila.

## Why what was asked could not be done.

found-trouble-gone = Už nie je v texte.
found-trouble-changed = Text sa tu od návrhu zmenil a bol prezretý znova.
found-trouble-cannot = Tu sa z nej citácia urobiť nedá.

## One work of a citation, as the text says it is.

# Those who made it: “Nagy and Lord”, “Nagy et al.”
found-people-two = { $first } a { $second }
found-people-more = { $first } a kol.
found-work-a-work = Dielo
found-work-looking = { $work } sa hľadá vo vašej knižnici…
found-work-no-tag = { $work } je značka, ktorú nemá žiadny záznam vašej knižnice.
found-work-not-found = { $work } sa vo vašej knižnici nenašlo.
found-work-chosen = Vybrané vami
# The writer chose this reference for another citation of the same work, and this one followed.
found-work-followed = Ako ste vybrali pre to isté dielo
found-work-certain = Isté
found-work-likely = Pravdepodobné
found-work-possible = Možné
# What the text says the work is.
found-work-for = pre „{ $work }“
found-work-others = Iné záznamy, ktorými môže byť
found-work-or = Alebo
found-work-may-be = Môže to byť
found-work-another = Iný…
found-work-find = Nájsť…
found-work-add = Pridať do knižnice
