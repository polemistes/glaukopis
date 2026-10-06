# A map as text: the elements one after another, each a heading and its text.

text-title = Título
text-name = Nombre del elemento
text-first-section = Escriba aquí, o pulse Ctrl+Intro para empezar la primera sección.
text-not-printed = no se imprime
text-grip = Mover o cambiar este elemento
# The map an element stands for, which is shown in bold where the variable stands.
text-include = En el documento, aquí va el mapa { $map }.
text-include-open = Abrirlo
text-loose = Elementos sueltos
text-loose-hint = Ideas que aún no tienen sitio. No forman parte del documento.
text-split = Dividir aquí
text-split-hint = Lo que sigue al cursor pasa a ser un elemento nuevo
text-join = Unir al elemento de arriba

## Folding away what is under an element, and its text

text-open = Desplegarlo
text-fold = Plegarlo
text-open-shift = Desplegarlo · con Mayús, también todo lo plegado debajo
text-fold-hint = Plegar su texto y lo que hay debajo
text-fold-shift = Plegar su texto y lo que hay debajo · con Mayús, desplegar todo lo plegado debajo
text-open-all = Desplegar todo
text-open-all-under = Desplegar todo lo plegado debajo
text-fold-all-under = Plegar todo lo de debajo
text-fold-all-under-hint = De lo que está justo debajo se muestran los nombres, y nada más profundo
# What is folded away, in its place: whether the element's own text is (text is
# "yes" or "no"), how many elements under it, and how many words in all, which
# may be none.
text-folded = { $text ->
    [yes] { $parts ->
        [0] Su texto plegado
        [one] Su texto y { $parts } elemento plegados
        [many] Su texto y { $parts } de elementos plegados
       *[other] Su texto y { $parts } elementos plegados
    }
   *[no] { $parts ->
        [one] { $parts } elemento plegado
        [many] { $parts } de elementos plegados
       *[other] { $parts } elementos plegados
    }
}{ $words ->
    [0] {""}
    [one] , { $words } palabra
    [many] , { $words } de palabras
   *[other] , { $words } palabras
}

## Associations, in the margin

text-associations = Asociaciones
text-outline = Esquema
text-outline-between = Entre el esquema y el texto
text-outline-fold = Plegar lo que hay debajo
text-outline-open = Desplegar lo que hay debajo
text-go-to = Ir a «{ $name }»
text-add-label = Añadir una etiqueta…
text-change-label = Cambiar la etiqueta…
text-remove-association = Quitar la asociación
text-hint-linking = Haga clic en el nombre del elemento con el que asociar · { $esc } para dejarlo

## Under the text

text-notes = { $count ->
    [one] { $count } nota
    [many] { $count } de notas
   *[other] { $count } notas
}
# The keys are shown as keys, where the variables stand.
text-keys = { $alt }+{ $enter } elemento nuevo · { $alt }+{ $shift }+{ $enter } uno debajo · { $at } citar
