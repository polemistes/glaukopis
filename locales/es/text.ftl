# A map as text: the elements one after another, each a heading and its text.

text-title = Título
text-name = Nombre del elemento
text-grip = Mover o cambiar este elemento
text-split = Dividir aquí
text-join = Unir al elemento de arriba

## Associations, in the margin

text-associations = Asociaciones
text-outline = Esquema
text-outline-between = Entre el esquema y el texto
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
