# Citations that were found in a text written elsewhere, and the panel at
# the side in which they are gone through (ADR 0015), in English. See
# locales/README.md.

## The panel.

found-title = Najdene navedbe
# On the tab of the panel, beside the other tabs: short.
found-tab = Najdene navedbe
found-between = Med miselnim vzorcem in najdenimi navedbami
found-taken = Kaj se šteje za navedbe
found-taken-always = Kar je naredil program, in oznake
found-taken-years = Oklepaji z letnico
found-taken-named = Opombe, ki imenujejo delo iz knjižnice
found-taken-notes = Vsaka opomba
found-asking = Spraševanje knjižnice…
found-make-certain = { $count ->
    [one] Naredi navedbo iz tiste, ki je gotova
    [two] Naredi navedbi iz { $count } gotovih
    [few] Naredi navedbe iz { $count } gotovih
   *[other] Naredi navedbe iz { $count } gotovih
}
found-made = { $count ->
    [one] Narejena je bila { $count } navedba
    [two] Narejeni sta bili { $count } navedbi
    [few] Narejene so bile { $count } navedbe
   *[other] Narejenih je bilo { $count } navedb
}
found-made-undo = Ctrl+Z jih vzame nazaj, kot en korak.
found-library-failed = Knjižnice ni bilo mogoče vprašati.
found-nothing = Ni česa pregledati
found-nothing-looked = V tem miselnem vzorcu ni več nobene najdene navedbe in nič v njem ni videti kot navedba.
found-nothing-looked-more = V tem miselnem vzorcu ni več nobene najdene navedbe in nič v njem ni videti kot navedba. Zgoraj se lahko za navedbe šteje več.
found-nothing-not-looked = V tem miselnem vzorcu ni več nobene najdene navedbe. Besedilo, ki je le videti kot navedba, se išče, ko zgoraj poveste, kaj naj se šteje zanjo: oklepaji z letnico ali opombe.
found-list-label = Kar je za pregled
found-untitled = Brez naslova
found-in-a-note = V opombi
# The element of the map a citation stands in.
found-in = V »{ $element }«
found-in-note-of = V opombi elementa »{ $element }«
# Set small and high after the words a note stands after.
found-note-mark = opomba
found-position = { $index } od { $count }
found-previous = Prejšnja
found-next = Naslednja
found-list-show = Pokaži seznam
found-list-hide = Skrij seznam
found-later = Pozneje
found-leave = Pusti kot besedilo
found-make = Naredi navedbo

## How sure the library is of what it proposes.

found-sure-certain = Knjižnica to delo zagotovo ima
found-sure-likely = Knjižnica ima, kar je verjetno to delo
found-sure-possible = Knjižnica ima, kar bi utegnilo biti to delo
found-sure-none = Eno od njenih del še nima vira

## By what a citation was found.

found-by-zotero = Naredil Zotero
found-by-mendeley = Naredil Mendeley ali program, ki piše kakor on
found-by-key = Oznaka, ki imenuje vir
found-by-form = Za navedbo vzeta po videzu

## The citation that is to be made.

found-the-citation = Navedba
found-no-works = Ne imenuje nobenega dela. Dodajte ga ali pa jo pustite kot besedilo, kar je.
found-add-work = Dodaj delo
found-author-in-text = Avtor v besedilu: Nagy (1979)
found-pick-work = Navedeno delo: avtor, naslov, leto
found-pick-add = Dodaj delo v navedbo
found-too-little = Datoteka pove o tem delu premalo, da bi iz tega nastal vir
found-reference-failed = Vira ni bilo mogoče narediti

## A citation that stands in a note.

found-in-note = Stoji v opombi
found-note-becomes = Opomba postane navedba
# What the note says besides its works, which becomes the words before them, after them, or both.
found-note-around = Kar opomba pove poleg del, gre pred dela in za njimi{ $has ->
        [before] : »{ $before }« pred
        [after] : »{ $after }« za
       *[both] : »{ $before }« pred, »{ $after }« za
    }. Slog navajanja jo postavi v vrstico ali v opombo.
found-note-style = Slog navajanja jo postavi v vrstico ali v opombo.
found-citation-in-note = Navedba stoji v opombi
    .hint = Opomba ostane opomba, z vsem drugim, kar pove.
found-for-all = Tako za vse nadaljnje
found-note-not = Ne stoji v opombi.
# What else the note holds, by the name of what it is in the text.
found-note-holds = Opomba vsebuje { $what ->
        [math] formulo
        [crossref] sklic
        [citation] navedbo
        [hard_break] drugo vrstico
       *[other] nekaj, kar ni besedilo
    }, česar besede pred delom in za njim ne morejo vsebovati.
found-note-another = Opomba vsebuje še eno najdeno navedbo, ki bi se v besedah za to izgubila.

## Why what was asked could not be done.

found-trouble-gone = Ni je več v besedilu.
found-trouble-changed = Besedilo se je tu spremenilo, odkar je bila predlagana, in je bilo znova pregledano.
found-trouble-cannot = Iz nje tu ni mogoče narediti navedbe.

## One work of a citation, as the text says it is.

# Those who made it: “Nagy and Lord”, “Nagy et al.”
found-people-two = { $first } in { $second }
found-people-more = { $first } idr.
found-work-a-work = Delo
found-work-looking = { $work } se išče v vaši knjižnici…
found-work-no-tag = { $work } je oznaka, ki je nima noben vir v vaši knjižnici.
found-work-not-found = { $work } v vaši knjižnici ni bilo najdeno.
found-work-chosen = Izbrali ste vi
# The writer chose this reference for another citation of the same work, and this one followed.
found-work-followed = Kakor ste izbrali za isto delo
found-work-certain = Gotovo
found-work-likely = Verjetno
found-work-possible = Mogoče
# What the text says the work is.
found-work-for = za »{ $work }«
found-work-others = Drugi viri, ki bi to lahko bili
found-work-or = Ali
found-work-may-be = Lahko je
found-work-another = Drug…
found-work-find = Poišči ga…
found-work-add = Dodaj ga v knjižnico
