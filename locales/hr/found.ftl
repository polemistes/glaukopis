# Citations that were found in a text written elsewhere, and the panel at
# the side in which they are gone through (ADR 0015), in English. See
# locales/README.md.

## The panel.

found-title = Pronađeni citati
# On the tab of the panel, beside the other tabs: short.
found-tab = Pronađeni citati
found-between = Između mape i pronađenih citata
found-taken = Što se uzima za citate
found-taken-always = Što je načinio program, i oznake
found-taken-years = Zagrade s godinom u njima
found-taken-named = Bilješke koje imenuju djelo iz knjižnice
found-taken-notes = Svaka bilješka
found-asking = Upit knjižnici…
found-make-certain = { $count ->
    [1] Načini citat od onoga koji je siguran
    [one] Načini citate od { $count } sigurnog
    [few] Načini citate od { $count } sigurna
   *[other] Načini citate od { $count } sigurnih
}
found-made = { $count ->
    [1] Načinjen je jedan citat
    [one] Načinjen je { $count } citat
    [few] Načinjena su { $count } citata
   *[other] Načinjeno je { $count } citata
}
found-made-undo = Ctrl+Z ih vraća, kao jedan korak.
found-library-failed = Knjižnici nije bilo moguće postaviti upit.
found-nothing = Nema se što proći
found-nothing-looked = U ovoj mapi nije ostao nijedan pronađeni citat, a ništa u njoj ne nalikuje citatu.
found-nothing-looked-more = U ovoj mapi nije ostao nijedan pronađeni citat, a ništa u njoj ne nalikuje citatu. Više se toga može uzeti za citate, gore.
found-nothing-not-looked = U ovoj mapi nije ostao nijedan pronađeni citat. Tekst koji samo nalikuje citatu traži se kad gore kažete što se za citat uzima: zagrade s godinom u njima, ili bilješke.
found-list-label = Što ima za proći
found-untitled = Bez naslova
found-in-a-note = U bilješci
# The element of the map a citation stands in.
found-in = U „{ $element }”
found-in-note-of = U bilješci uz „{ $element }”
# Set small and high after the words a note stands after.
found-note-mark = bilj.
found-position = { $index } od { $count }
found-previous = Prethodni
found-next = Sljedeći
found-list-show = Prikaži popis
found-list-hide = Sakrij popis
found-later = Poslije
found-leave = Ostavi kao tekst
found-make = Pretvori u citat

## How sure the library is of what it proposes.

found-sure-certain = Knjižnica ga sigurno ima
found-sure-likely = Knjižnica ima ono što je vjerojatno on
found-sure-possible = Knjižnica ima ono što bi mogao biti on
found-sure-none = Jedno njegovo djelo još nema reference

## By what a citation was found.

found-by-zotero = Načinio Zotero
found-by-mendeley = Načinio Mendeley, ili program koji piše kao on
found-by-key = Oznaka koja imenuje referencu
found-by-form = Uzet za citat po izgledu

## The citation that is to be made.

found-the-citation = Citat
found-no-works = Ne imenuje nijedno djelo. Dodajte ga, ili ostavite kao tekst koji jest.
found-add-work = Dodaj djelo
found-author-in-text = Autor u tekstu: Nagy (1979)
found-pick-work = Djelo koje se citira: autor, naslov, godina
found-pick-add = Dodaj djelo u citat
found-too-little = Datoteka o ovom djelu kaže premalo da bi se od toga načinila referenca
found-reference-failed = Referencu nije bilo moguće načiniti

## A citation that stands in a note.

found-in-note = Stoji u bilješci
found-note-becomes = Bilješka postaje citat
# What the note says besides its works, which becomes the words before them, after them, or both.
found-note-around = Što bilješka još kaže ide prije i poslije njezinih djela{ $has ->
        [before] : „{ $before }” prije
        [after] : „{ $after }” poslije
       *[both] : „{ $before }” prije, „{ $after }” poslije
    }. Citatni stil smješta ga u redak ili u bilješku.
found-note-style = Citatni stil smješta ga u redak ili u bilješku.
found-citation-in-note = Citat stoji u bilješci
    .hint = Bilješka ostaje bilješka, s onim što još kaže.
found-for-all = Tako za sve koji slijede
found-note-not = Ne stoji u bilješci.
# What else the note holds, by the name of what it is in the text.
found-note-holds = Bilješka sadrži { $what ->
        [math] formulu
        [crossref] uputnicu
        [citation] citat
        [hard_break] drugi redak
       *[other] nešto što nije tekst
    }, što riječi prije i poslije djela ne mogu sadržavati.
found-note-another = Bilješka sadrži još jedan pronađeni citat, koji bi se izgubio u riječima iza ovoga.

## Why what was asked could not be done.

found-trouble-gone = Više ga nema u tekstu.
found-trouble-changed = Tekst se ovdje promijenio otkako je predložen, pa je ponovno pregledan.
found-trouble-cannot = Od njega se ovdje ne može načiniti citat.

## One work of a citation, as the text says it is.

# Those who made it: “Nagy and Lord”, “Nagy et al.”
found-people-two = { $first } i { $second }
found-people-more = { $first } i dr.
found-work-a-work = Djelo
found-work-looking = { $work } traži se u vašoj knjižnici…
found-work-no-tag = { $work } je oznaka koju nema nijedna referenca iz vaše knjižnice.
found-work-not-found = { $work } nije pronađeno u vašoj knjižnici.
found-work-chosen = Vaš odabir
# The writer chose this reference for another citation of the same work, and this one followed.
found-work-followed = Kako ste odabrali za isto djelo
found-work-certain = Sigurno
found-work-likely = Vjerojatno
found-work-possible = Moguće
# What the text says the work is.
found-work-for = za „{ $work }”
found-work-others = Druge reference koje bi to mogle biti
found-work-or = Ili
found-work-may-be = Moglo bi biti
found-work-another = Druga…
found-work-find = Pronađi je…
found-work-add = Dodaj je u knjižnicu
