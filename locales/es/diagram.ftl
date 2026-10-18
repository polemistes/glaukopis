# A map as a diagram: the elements on a canvas, their branches and associations.

diagram-map = Mapa
diagram-idea = Nombre
diagram-new-here = Nuevo elemento aquí
diagram-new-here-hint = Una idea que aún no tiene sitio, bajo el elemento a la vista
diagram-open-as-map = Abrir como mapa
diagram-open-as-map-hint = El elemento en el centro, con lo que tiene debajo
diagram-show-all = Mostrar todo el mapa
diagram-tidy = Ordenar todo el mapa
diagram-tidy-hint = Cada elemento vuelve a su sitio automático
# The keys are shown as keys, where the variables stand.
diagram-hint-empty = { $tab } añade un elemento bajo el seleccionado · { $enter } añade uno a su lado · doble clic para escribir
diagram-hint-linking = Haga clic en el elemento con el que asociar, o vaya a él con las flechas y pulse { $enter } · { $esc } para dejarlo
diagram-show-under = Mostrar lo que hay debajo
diagram-hide-under = Ocultar lo que hay debajo
diagram-link-handle = Arrastre hasta otro elemento para asociarlos

## The view

diagram-view = Vista
diagram-zoom-out = Alejar
diagram-zoom-in = Acercar
diagram-actual-size = Tamaño real
# How large the map is shown, in hundredths of its size.
diagram-zoom = { $percent } %

## Copying and pasting elements.

diagram-copied = { $count ->
    [one] Un elemento copiado, con todo lo que tiene debajo
    [many] { $count } de elementos copiados, con todo lo que tienen debajo
   *[other] { $count } elementos copiados, con todo lo que tienen debajo
}
diagram-cut = { $count ->
    [one] Un elemento cortado: se mueve adonde lo pegue
    [many] { $count } de elementos cortados: se mueven adonde los pegue
   *[other] { $count } elementos cortados: se mueven adonde los pegue
}
diagram-paste-here = Pegar aquí
diagram-nothing-copied = Aún no se ha copiado nada
diagram-pasted-elsewhere = Lo copiado es de otro proyecto, y no se puede pegar aquí
