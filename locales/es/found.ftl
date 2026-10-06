# Citations that were found in a text written elsewhere, and the panel at
# the side in which they are gone through (ADR 0015), in English. See
# locales/README.md.

## The panel.

found-title = Citas encontradas
# On the tab of the panel, beside the other tabs: short.
found-tab = Citas encontradas
found-between = Entre el mapa y las citas encontradas
found-taken = Qué se toma por cita
found-taken-always = Lo que hizo un programa, y las etiquetas
found-taken-years = Paréntesis con un año dentro
found-taken-named = Notas que nombran una obra de la biblioteca
found-taken-notes = Todas las notas
found-asking = Preguntando a la biblioteca…
found-make-certain = { $count ->
    [one] Convertir en cita la que es segura
    [many] Convertir en citas las { $count } que son seguras
   *[other] Convertir en citas las { $count } que son seguras
}
found-made = { $count ->
    [one] Se hizo una cita
    [many] Se hicieron { $count } de citas
   *[other] Se hicieron { $count } citas
}
found-made-undo = Ctrl+Z las deshace, en un solo paso.
found-library-failed = No se pudo preguntar a la biblioteca.
found-nothing = Nada que repasar
found-nothing-looked = En este mapa no queda ninguna cita encontrada, y nada en él parece una.
found-nothing-looked-more = En este mapa no queda ninguna cita encontrada, y nada en él parece una. Arriba se puede tomar más por citas.
found-nothing-not-looked = En este mapa no queda ninguna cita encontrada. El texto que solo parece una cita se busca cuando arriba se dice qué se toma por cita: paréntesis con un año dentro, o notas.
found-list-label = Lo que hay que repasar
found-untitled = Sin título
found-in-a-note = En una nota
# The element of the map a citation stands in.
found-in = En «{ $element }»
found-in-note-of = En una nota de «{ $element }»
# Set small and high after the words a note stands after.
found-note-mark = nota
found-position = { $index } de { $count }
found-previous = La anterior
found-next = La siguiente
found-list-show = Mostrar la lista
found-list-hide = Ocultar la lista
found-later = Más tarde
found-leave = Dejarla como texto
found-make = Convertirla en cita

## How sure the library is of what it proposes.

found-sure-certain = La biblioteca la tiene con certeza
found-sure-likely = La biblioteca tiene lo que probablemente es
found-sure-possible = La biblioteca tiene lo que puede ser
found-sure-none = Una de sus obras aún no tiene referencia

## By what a citation was found.

found-by-zotero = Hecha por Zotero
found-by-mendeley = Hecha por Mendeley, o por un programa que escribe como él
found-by-key = Una etiqueta que nombra una referencia
found-by-form = Tomada por cita por su aspecto

## The citation that is to be made.

found-the-citation = La cita
found-no-works = No nombra ninguna obra. Añada una, o déjela como el texto que es.
found-add-work = Añadir una obra
found-author-in-text = Autor en el texto: Nagy (1979)
found-pick-work = La obra que se cita: autor, título, año
found-pick-add = Añadir una obra a la cita
found-too-little = El archivo dice demasiado poco de esta obra para hacer una referencia
found-reference-failed = No se pudo hacer la referencia

## A citation that stands in a note.

found-in-note = Está en una nota
found-note-becomes = La nota se convierte en cita
# What the note says besides its works, which becomes the words before them, after them, or both.
found-note-around = Lo demás que dice la nota va antes y después de sus obras{ $has ->
        [before] : «{ $before }» antes
        [after] : «{ $after }» después
       *[both] : «{ $before }» antes, «{ $after }» después
    }. El estilo de las referencias la pone en la línea o en una nota.
found-note-style = El estilo de las referencias la pone en la línea o en una nota.
found-citation-in-note = La cita queda en la nota
    .hint = La nota sigue siendo una nota, con lo demás que dice.
found-for-all = Así para todas las que sigan
found-note-not = No está en una nota.
# What else the note holds, by the name of what it is in the text.
found-note-holds = La nota contiene { $what ->
        [math] una fórmula
        [crossref] una remisión
        [citation] una cita
        [hard_break] una segunda línea
       *[other] algo que no es texto
    }, que las palabras de antes y después de una obra no pueden contener.
found-note-another = La nota contiene otra cita encontrada, que se perdería en las palabras de después de esta.

## Why what was asked could not be done.

found-trouble-gone = Ya no está en el texto.
found-trouble-changed = El texto ha cambiado aquí desde que se propuso, y se ha vuelto a mirar.
found-trouble-cannot = Aquí no se puede hacer una cita de ella.

## One work of a citation, as the text says it is.

# Those who made it: “Nagy and Lord”, “Nagy et al.”
found-people-two = { $first } y { $second }
found-people-more = { $first } et al.
found-work-a-work = Una obra
found-work-looking = Se busca { $work } en su biblioteca…
found-work-no-tag = { $work } es una etiqueta que no tiene ninguna referencia de su biblioteca.
found-work-not-found = { $work } no se encontró en su biblioteca.
found-work-chosen = Elegida por usted
# The writer chose this reference for another citation of the same work, and this one followed.
found-work-followed = Como eligió para la misma obra
found-work-certain = Segura
found-work-likely = Probable
found-work-possible = Posible
# What the text says the work is.
found-work-for = para «{ $work }»
found-work-others = Otras referencias que puede ser
found-work-or = O
found-work-may-be = Puede ser
found-work-another = Otra…
found-work-find = Buscarla…
found-work-add = Añadirla a la biblioteca
