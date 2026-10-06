# Kinds of elements: what the writer calls them (character, place, source…), each with a colour.

kinds-kind = Tipo
kinds-title = Tipos de elementos
kinds-subtitle = Lo que pueden ser los elementos de este proyecto: tantos tipos como necesite el trabajo, cada uno con un color.
kinds-new = Nuevo tipo
kinds-new-ellipsis = Nuevo tipo…
kinds-change = Cambiar el tipo
kinds-manage = Tipos de este proyecto…
kinds-none-of-them = Ninguno
kinds-none = Aún no hay tipos. Un tipo es un nombre y un color: personaje, lugar, acontecimiento, fuente, argumento, lo que el trabajo necesite.
kinds-name = Nombre
kinds-name-placeholder = Personaje, lugar, acontecimiento…
kinds-name-taken = Ya hay un tipo con ese nombre.
kinds-colour = Color
kinds-colour-teal = Verde azulado
kinds-colour-amber = Ámbar
kinds-colour-violet = Violeta
kinds-colour-rose = Rosa
kinds-colour-green = Verde
kinds-colour-blue = Azul
kinds-colour-rust = Óxido
kinds-colour-olive = Oliva
kinds-colour-slate = Pizarra
kinds-colour-plum = Ciruela
kinds-template = Texto con el que empezar
kinds-template-placeholder = Apariencia
    Deseos
    Temores
kinds-template-hint = Un elemento sin texto al que se dé este tipo empieza con estas líneas, un párrafo cada una.
kinds-begins = Un elemento de este tipo escribe en
kinds-begins-hint = El texto empieza en este tipo de párrafo, donde el elemento aún no tiene ninguno
kinds-create = Crear
kinds-elements = { $count ->
    [one] { $count } elemento
    [many] { $count } de elementos
   *[other] { $count } elementos
}
kinds-delete-title = ¿Eliminar el tipo «{ $name }»?
kinds-delete-message = { $count ->
    [0] Ningún elemento es de él.
    [one] El único elemento que es de él quedará sin tipo.
    [many] Los { $count } de elementos que son de él quedarán sin tipo.
   *[other] Los { $count } elementos que son de él quedarán sin tipo.
}
