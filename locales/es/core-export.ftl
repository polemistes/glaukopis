# What the core says of making documents and previews, of reference styles
# and of document formats, in English. See locales/README.md.

## Making a document.

core-export-picture-missing = La imagen «{ $name }» no está en este equipo, y queda fuera del documento.
core-export-astray = { $count ->
    [one] Una remisión del texto apunta a algo que no está en el documento. Se compone como [?].
    [many] { $count } de remisiones del texto apuntan a lo que no está en el documento. Se componen como [?].
   *[other] { $count } remisiones del texto apuntan a lo que no está en el documento. Se componen como [?].
}
core-export-latex-font = { $font } no está instalada. El documento se compone en Latin Modern, la fuente propia de LaTeX.
# Texts of a preview that the interface did not send again, and that were not kept: it sends them all.
core-export-lacking = { $count ->
    [one] Un texto del documento no se envió, y no se conserva.
    [many] { $count } de textos del documento no se enviaron, y no se conservan.
   *[other] { $count } textos del documento no se enviaron, y no se conservan.
}
# Shown after "not found: ".
core-export-preview-document = el documento de la vista previa
core-export-reading-pdf = al leer el PDF generado
core-export-reading-made = al leer el documento generado

## The pattern document, from which Word and OpenDocument take their styles.

core-export-pattern-unreadable = no se pudo leer el documento modelo: { $error }
core-export-pattern-lacks = el documento modelo no tiene { $name }
core-export-pattern-reading = al leer el documento modelo
core-export-pattern-writing = al escribir el documento modelo

## Formulas, as they are shown where they are written.

core-export-formula-incomplete = La fórmula termina antes de estar completa.
# The command is as it was written: \frac.
core-export-formula-unknown = No se conoce { $command }.
core-export-formula-unexpected = No se esperaba { $what } donde está.
core-export-formula-unreadable = No se pudo leer la fórmula.
core-export-formula-too-long = La fórmula es demasiado larga.

## Reference styles.

core-export-style-bad-id = «{ $id }» no puede ser el identificador de un estilo
core-export-not-a-style = Esto no es un estilo: { $error }.
core-export-not-a-style-begin = Esto no es un estilo: no empieza por <style>.
core-export-dependent-style = Este estilo solo nombra a otro estilo, del que toma su forma. Obtenga ese otro por su nombre.
core-export-style-unreadable = El estilo no se pudo volver a leer.
core-export-style-needs-name = Un estilo necesita un nombre.
core-export-style-own-only = Solo se pueden eliminar los estilos propios.
# Shown after "not found: ".
core-export-the-reference-style = el estilo de citas «{ $id }»
core-export-any-reference-style = ningún estilo de citas
core-export-the-style = el estilo «{ $id }»

## Document formats.

core-export-format-bad-id = «{ $id }» no puede ser el identificador de un formato
core-export-format-needs-name = Un formato necesita un nombre.
core-export-format-own-only = Solo se pueden eliminar los formatos propios.
core-export-not-a-length = «{ $length }» no es una medida
# Shown after "not found: ".
core-export-the-format = el formato «{ $id }»
