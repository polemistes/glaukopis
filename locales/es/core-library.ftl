# What the core says of the library of references, in English.
# See locales/README.md.

## The authors of a reference, as the lists show them.

core-library-two-names = { $first } y { $second }
core-library-three-names = { $first }, { $second } y { $third }
core-library-et-al = { $first } et al.
# The names of the editors, where a work has editors and no authors.
core-library-edited = { $count ->
    [one] { $names } (ed.)
    [many] { $names } (eds.)
   *[other] { $names } (eds.)
}

## Reading the library, and a reference as it is typed.

# A fault in the file of the library, and the line it is on.
core-library-line = línea { $line }: { $message }
core-library-line-sentence = Línea { $line }: { $message }.
core-library-key-changed = la clave «{ $from }» se cambió a «{ $to }»
core-library-no-entry = Aquí no hay ninguna entrada. Una entrada empieza con @ y su tipo, como en @book{"{"}clave, …{"}"}.
core-library-many-entries = Aquí hay { $count } entradas; se espera una.

## Changing a reference.

core-library-bad-key = «{ $key }» no se puede usar como clave de cita.
core-library-key-letters = Una clave de cita solo puede tener letras, dígitos y - _ : . Pruebe con «{ $key }».
core-library-key-taken = La clave de cita «{ $key }» ya está en uso.
core-library-no-type = La referencia no tiene tipo de publicación.
core-library-not-a-type = «{ $kind }» no es un tipo de publicación.
core-library-merge-itself = Una entrada no se puede fusionar consigo misma.

## What was not found, shown after "not found: ".

core-library-the-reference = la referencia
core-library-the-stored-file = el archivo almacenado { $path }
core-library-the-file = el archivo { $path }
core-library-the-collection = la colección
core-library-the-collection-to-put-in = la colección en la que ponerla
core-library-the-collection-to-move-to = la colección a la que moverla

## Collections.

core-library-collection-needs-name = Una colección necesita un nombre.
core-library-collection-exists = Aquí ya hay una colección llamada «{ $name }».
core-library-collection-in-itself = Una colección no se puede poner dentro de sí misma.

## The files of references.

core-library-not-in-library = «{ $path }» no es una ruta dentro de la biblioteca
core-library-not-a-file = { $path } no es un archivo
