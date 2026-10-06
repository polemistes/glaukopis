# What the core says of making documents and previews, of reference styles
# and of document formats, in English. See locales/README.md.

## Making a document.

core-export-picture-missing = A imagem «{ $name }» não está neste computador e fica fora do documento.
core-export-astray = { $count ->
    [one] Uma remissão do texto remete para algo que não está no documento. Fica marcada como [?].
    [many] { $count } remissões do texto remetem para o que não está no documento. Ficam marcadas como [?].
   *[other] { $count } remissões do texto remetem para o que não está no documento. Ficam marcadas como [?].
}
core-export-latex-font = A fonte { $font } não está instalada. O documento é composto em Latin Modern, a fonte que o LaTeX tem de seu.
# Texts of a preview that the interface did not send again, and that were not kept: it sends them all.
core-export-lacking = { $count ->
    [one] { $count } texto do documento não foi enviado, e não está guardado.
    [many] { $count } textos do documento não foram enviados, e não estão guardados.
   *[other] { $count } textos do documento não foram enviados, e não estão guardados.
}
# Shown after "not found: ".
core-export-preview-document = o documento da pré-visualização
core-export-reading-pdf = ao ler o PDF que se fez
core-export-reading-made = ao ler o documento que se fez

## The pattern document, from which Word and OpenDocument take their styles.

core-export-pattern-unreadable = não foi possível ler o documento-modelo: { $error }
core-export-pattern-lacks = o documento-modelo não tem { $name }
core-export-pattern-reading = ao ler o documento-modelo
core-export-pattern-writing = ao escrever o documento-modelo

## Formulas, as they are shown where they are written.

core-export-formula-incomplete = A fórmula acaba antes de estar completa.
# The command is as it was written: \frac.
core-export-formula-unknown = { $command } é desconhecido.
core-export-formula-unexpected = { $what } não era esperado onde está.
core-export-formula-unreadable = Não foi possível ler a fórmula.
core-export-formula-too-long = A fórmula é demasiado longa.

## Reference styles.

core-export-style-bad-id = «{ $id }» não pode ser o identificador de um estilo
core-export-not-a-style = Isto não é um estilo: { $error }.
core-export-not-a-style-begin = Isto não é um estilo: não começa por <style>.
core-export-dependent-style = Este estilo apenas nomeia outro, de que toma a forma. Obtenha antes esse, pelo nome.
core-export-style-unreadable = Não foi possível voltar a ler o estilo.
core-export-style-needs-name = Um estilo precisa de um nome.
core-export-style-own-only = Só os estilos próprios se podem eliminar.
# Shown after "not found: ".
core-export-the-reference-style = o estilo de citação «{ $id }»
core-export-any-reference-style = estilo de citação nenhum
core-export-the-style = o estilo «{ $id }»

## Document formats.

core-export-format-bad-id = «{ $id }» não pode ser o identificador de um formato
core-export-format-needs-name = Um formato precisa de um nome.
core-export-format-own-only = Só os formatos próprios se podem eliminar.
core-export-not-a-length = «{ $length }» não é uma medida
# Shown after "not found: ".
core-export-the-format = o formato «{ $id }»
