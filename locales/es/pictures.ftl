# The store of pictures: all the pictures of the application, and one of them.

pictures-title = Imágenes
pictures-all = Todas las imágenes
pictures-picture = Imagen
pictures-search-placeholder = Buscar en las imágenes
pictures-clear-search = Borrar la búsqueda
pictures-count = { $count ->
    [one] { $count } imagen
    [many] { $count } de imágenes
   *[other] { $count } imágenes
}
# How many pictures a search finds, of all there are.
pictures-shown = { $shown } de { $count ->
    [one] { $count } imagen
    [many] { $count } de imágenes
   *[other] { $count } imágenes
}
pictures-add = Añadir imágenes…
pictures-empty = El almacén está vacío
pictures-empty-text = Las imágenes que añada aquí se pueden usar en todos sus proyectos, y una imagen puesta en un texto se guarda aquí. Añada algunas, o suéltelas en esta ventana.
pictures-nothing-found = No se encontró nada
pictures-nothing-found-text = Ninguna imagen contiene todas estas palabras.
# What a picture that has no name is called.
pictures-unnamed = Una imagen
pictures-with-notes = Con notas

## Taking pictures in, and removing them

# The title of the dialog that chooses files, and what it calls the files it offers.
pictures-add-title = Añadir imágenes
pictures-files = Imágenes
pictures-taken-in = { $count ->
    [one] «{ $name }» está en el almacén
    [many] { $count } de imágenes están en el almacén
   *[other] { $count } imágenes están en el almacén
}
pictures-remove-title = ¿Quitar «{ $name }» del almacén?
pictures-remove-unused = Ningún proyecto usa la imagen. Lo que se dice de ella aquí, y sus notas sobre ella, se quitan con ella.
pictures-remove-used = { $count ->
    [one] { $count } proyecto usa la imagen. Sus figuras quedarán sin la imagen. Lo que se dice de ella aquí, y sus notas sobre ella, se quitan con ella.
    [many] { $count } de proyectos usan la imagen. Sus figuras quedarán sin la imagen. Lo que se dice de ella aquí, y sus notas sobre ella, se quitan con ella.
   *[other] { $count } proyectos usan la imagen. Sus figuras quedarán sin la imagen. Lo que se dice de ella aquí, y sus notas sobre ella, se quitan con ella.
}
pictures-no-backend = No hay backend.

## One picture

pictures-name = Nombre
pictures-name-placeholder = Cómo se llama la imagen
pictures-caption = Leyenda
pictures-caption-placeholder = Lo que se dice de la imagen
pictures-caption-hint = Las figuras hechas con la imagen empiezan con estas palabras. Lo que se dice de una figura se puede cambiar allí sin cambiar esto.
pictures-italic = Cursiva
pictures-small-caps = Versalitas
# What the picture shows, in words, for those who do not see it.
pictures-alt = Muestra
pictures-alt-placeholder = En palabras, para quien no puede verla
pictures-absent = La imagen no está en este equipo. Se usa en el proyecto, y se mostrará cuando llegue de quien la puso.
pictures-notes = Notas
pictures-note-project = En este proyecto
pictures-note-project-placeholder = Lo que le parece, para este trabajo
pictures-note-project-hint = Lo que se escribe aquí lo tienen todos los que tienen el proyecto.
pictures-note-for-all = Guardarla para todos los proyectos
pictures-note-write-for-all = Escribir para todos los proyectos
pictures-note-all = En todos los proyectos
pictures-note-all-placeholder = Lo que le parece, dondequiera que la use
pictures-note-all-hint = Se guarda con la imagen en el almacén, en este equipo.
pictures-note-placeholder = Lo que le parece. Para usted: no forma parte de ningún documento.
pictures-note-label = Sus notas sobre esta imagen
pictures-file = El archivo
pictures-kind = Tipo
pictures-kind-svg = SVG, un dibujo
pictures-dimensions-label = Ancho y alto
pictures-dimensions = { $width } × { $height } puntos
pictures-size = Tamaño
# When the picture was taken into the store.
pictures-added = Añadida
pictures-used-in = Usada en
pictures-this-project = Este proyecto
# A map that has no name.
pictures-untitled = Sin título
pictures-unused = Ningún proyecto usa la imagen.
pictures-remove = Quitar del almacén
