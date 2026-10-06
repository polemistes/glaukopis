# Citations that were found in a text written elsewhere, and the panel at
# the side in which they are gone through (ADR 0015), in English. See
# locales/README.md.

## The panel.

found-title = Citări găsite
# On the tab of the panel, beside the other tabs: short.
found-tab = Citări găsite
found-between = Între hartă și citările găsite
found-taken = Ce se ia drept citare
found-taken-always = Ce a făcut un program, și etichetele
found-taken-years = Parantezele cu un an în ele
found-taken-named = Notele care numesc o lucrare din bibliotecă
found-taken-notes = Fiecare notă
found-asking = Se întreabă biblioteca…
found-make-certain = { $count ->
    [one] Fă o citare din cea care este sigură
    [few] Fă citări din cele { $count } care sunt sigure
   *[other] Fă citări din cele { $count } care sunt sigure
}
found-made = { $count ->
    [one] S-a făcut o citare
    [few] S-au făcut { $count } citări
   *[other] S-au făcut { $count } de citări
}
found-made-undo = Ctrl+Z le ia înapoi, ca un singur pas.
found-library-failed = Biblioteca nu a putut fi întrebată.
found-nothing = Nimic de parcurs
found-nothing-looked = Nicio citare găsită nu a mai rămas în această hartă și nimic din ea nu seamănă a citare.
found-nothing-looked-more = Nicio citare găsită nu a mai rămas în această hartă și nimic din ea nu seamănă a citare. Mai sus se poate lua mai mult drept citare.
found-nothing-not-looked = Nicio citare găsită nu a mai rămas în această hartă. Textul care doar seamănă a citare se caută când spuneți mai sus ce să se ia drept citare: parantezele cu un an în ele, sau notele.
found-list-label = Ce este de parcurs
found-untitled = Fără titlu
found-in-a-note = Într-o notă
# The element of the map a citation stands in.
found-in = În „{ $element }”
found-in-note-of = Într-o notă din „{ $element }”
# Set small and high after the words a note stands after.
found-note-mark = notă
found-position = { $index } din { $count }
found-previous = Cea dinainte
found-next = Următoarea
found-list-show = Arată lista
found-list-hide = Ascunde lista
found-later = Mai târziu
found-leave = Las-o ca text
found-make = Fă din ea o citare

## How sure the library is of what it proposes.

found-sure-certain = Biblioteca o are cu siguranță
found-sure-likely = Biblioteca are ce este probabil ea
found-sure-possible = Biblioteca are ce ar putea fi ea
found-sure-none = O lucrare a ei nu are încă referință

## By what a citation was found.

found-by-zotero = Făcută de Zotero
found-by-mendeley = Făcută de Mendeley, sau de un program care scrie ca el
found-by-key = O etichetă care numește o referință
found-by-form = Luată drept citare după cum arată

## The citation that is to be made.

found-the-citation = Citarea
found-no-works = Nu numește nicio lucrare. Adăugați una, sau lăsați-o ca textul care este.
found-add-work = Adaugă o lucrare
found-author-in-text = Autorul în text: Nagy (1979)
found-pick-work = Lucrarea citată: autor, titlu, an
found-pick-add = Adaugă o lucrare la citare
found-too-little = Fișierul spune prea puțin despre această lucrare ca să se facă o referință din ea
found-reference-failed = Referința nu s-a putut face

## A citation that stands in a note.

found-in-note = Stă într-o notă
found-note-becomes = Nota devine o citare
# What the note says besides its works, which becomes the words before them, after them, or both.
found-note-around = Ce mai spune nota merge înaintea și după lucrările ei{ $has ->
        [before] : „{ $before }” înainte
        [after] : „{ $after }” după
       *[both] : „{ $before }” înainte, „{ $after }” după
    }. Stilul referințelor o așază în rând sau într-o notă.
found-note-style = Stilul referințelor o așază în rând sau într-o notă.
found-citation-in-note = Citarea stă în notă
    .hint = Nota rămâne notă, cu tot ce mai spune.
found-for-all = La fel pentru toate cele care urmează
found-note-not = Nu stă într-o notă.
# What else the note holds, by the name of what it is in the text.
found-note-holds = Nota cuprinde { $what ->
        [math] o formulă
        [crossref] o trimitere
        [citation] o citare
        [hard_break] un al doilea rând
       *[other] ceva ce nu este text
    }, ceea ce cuvintele dinainte și de după o lucrare nu pot cuprinde.
found-note-another = Nota cuprinde o altă citare găsită, care s-ar pierde în cuvintele de după aceasta.

## Why what was asked could not be done.

found-trouble-gone = Nu mai este în text.
found-trouble-changed = Textul s-a schimbat aici de când a fost propusă și a fost privit din nou.
found-trouble-cannot = Din ea nu se poate face o citare aici.

## One work of a citation, as the text says it is.

# Those who made it: “Nagy and Lord”, “Nagy et al.”
found-people-two = { $first } și { $second }
found-people-more = { $first } et al.
found-work-a-work = O lucrare
found-work-looking = { $work } se caută în biblioteca dumneavoastră…
found-work-no-tag = { $work } este o etichetă pe care nu o are nicio referință din biblioteca dumneavoastră.
found-work-not-found = { $work } nu a fost găsit în biblioteca dumneavoastră.
found-work-chosen = Aleasă de dumneavoastră
# The writer chose this reference for another citation of the same work, and this one followed.
found-work-followed = Cum ați ales pentru aceeași lucrare
found-work-certain = Sigură
found-work-likely = Probabilă
found-work-possible = Posibilă
# What the text says the work is.
found-work-for = pentru „{ $work }”
found-work-others = Alte referințe care ar putea fi ea
found-work-or = Sau
found-work-may-be = Ar putea fi
found-work-another = Alta…
found-work-find = Găsește-o…
found-work-add = Adaug-o la bibliotecă
