# Tables in the text: making them, their tools, and what can be said of them.
# See locales/README.md.

## A table and its size, as its panel and the reading of a file show them.

tables-table = Tabla
tables-size = { $rows ->
        [one] { $rows } fila
        [many] { $rows } de filas
       *[other] { $rows } filas
    }, { $columns ->
        [one] { $columns } columna
        [many] { $columns } de columnas
       *[other] { $columns } columnas
    }
# The size, where only the first rows of what was read are shown.
tables-size-shown = { tables-size }. Se muestran las { $shown } primeras.

## The bar over a table, and the menu on its cells.

tables-row = Fila
tables-row-hint = Una fila arriba o abajo; quitar la fila
tables-row-above = Una fila arriba
tables-row-below = Una fila abajo
tables-row-remove = Quitar la fila
tables-column = Columna
tables-column-hint = Una columna antes o después; quitar la columna
tables-column-before = Una columna antes
tables-column-after = Una columna después
tables-column-remove = Quitar la columna
tables-join = Unir las celdas
tables-join-hint = Unir las celdas seleccionadas
tables-split = Dividir la celda
tables-split-hint = Dividir la celda en las que se unieron
tables-headings = Encabezados
tables-headings-hint = Si la primera fila y la primera columna son encabezados
tables-first-row-headings = La primera fila son encabezados
tables-first-column-headings = La primera columna son encabezados
tables-cell-stands = El contenido de la celda va
tables-left = A la izquierda
tables-left-hint = El contenido de la celda va a la izquierda
tables-middle = En el centro
tables-middle-hint = El contenido de la celda va en el centro
tables-right = A la derecha
tables-right-hint = El contenido de la celda va a la derecha
tables-table-hint = Si está numerada, cuánto mide de ancho; quitarla
tables-numbered = Numerada
tables-the-table = La tabla…
tables-the-table-hint = Cuánto mide de ancho
tables-remove = Quitar la tabla

## The panel of what can be said of a table as a whole.

tables-width = Ancho
tables-width-needed = Lo que necesite
tables-width-half = La mitad
tables-width-three-quarters = Tres cuartos
tables-width-whole = Entero
tables-width-of-text = Del ancho del texto, en el documento.
tables-width-as-needed = Tan ancha como lo necesite su contenido.
tables-numbered-as = Numerada, como «Tabla 1»

## A table asked for by its size.

tables-ask = Una tabla de qué tamaño
tables-ask-heading = Una tabla
tables-ask-grid = Señale el tamaño de la tabla
tables-ask-by = { $rows } por { $columns }
tables-ask-rows = Filas
tables-ask-columns = Columnas
tables-ask-put = Insertarla

## A table from a file.

tables-from-file = Una tabla de un archivo
tables-sheet = Hoja
# A sheet of a file that has no name of its own.
tables-sheet-number = Hoja { $number }
tables-first-rows = Las primeras filas, como quedarán
tables-caption = Lo que se dice de la tabla
tables-caption-placeholder = Su leyenda, que se puede cambiar en el texto
tables-header-row = La primera fila contiene los encabezados
tables-header-column = La primera columna contiene los encabezados
tables-numbers-right = Las columnas con números se alinean a la derecha.
tables-put = Ponerla en el texto
# The title of the window in which a file is chosen among the files of the computer.
tables-choose = Una tabla
# What the files that can be chosen there are called.
tables-files = Tablas
tables-unreadable = { $file } no se pudo leer como tabla
tables-cannot-stand = Aquí no puede ir una tabla
tables-drop-on-text = Suelte una tabla sobre el texto al que pertenece

## Shown by the stylesheet, where the page has no element for the words.

tables-caption-empty = Lo que se dice de la tabla
