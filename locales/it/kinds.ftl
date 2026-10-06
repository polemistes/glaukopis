# Kinds of elements: what the writer calls them (character, place, source…), each with a colour.

kinds-kind = Tipo
kinds-title = Tipi di elementi
kinds-subtitle = Che cosa possono essere gli elementi di questo progetto: tanti tipi quanti il lavoro ne richiede, ciascuno con un colore.
kinds-new = Nuovo tipo
kinds-new-ellipsis = Nuovo tipo…
kinds-change = Cambia il tipo
kinds-manage = Tipi di questo progetto…
kinds-none-of-them = Nessuno
kinds-none = Ancora nessun tipo. Un tipo è un nome e un colore: personaggio, luogo, evento, fonte, argomento, ciò che il lavoro richiede.
kinds-name = Nome
kinds-name-placeholder = Personaggio, luogo, evento…
kinds-name-taken = C'è già un tipo con quel nome.
kinds-colour = Colore
kinds-colour-teal = Verde acqua
kinds-colour-amber = Ambra
kinds-colour-violet = Viola
kinds-colour-rose = Rosa
kinds-colour-green = Verde
kinds-colour-blue = Blu
kinds-colour-rust = Ruggine
kinds-colour-olive = Oliva
kinds-colour-slate = Ardesia
kinds-colour-plum = Prugna
kinds-template = Testo con cui cominciare
kinds-template-placeholder = Aspetto
    Desideri
    Paure
kinds-template-hint = Un elemento senza testo a cui si dà questo tipo comincia con queste righe, un paragrafo ciascuna.
kinds-begins = Un elemento di questo tipo scrive in
kinds-begins-hint = Il testo comincia in questo tipo di paragrafo, dove l'elemento non ne ha ancora
kinds-create = Crea
kinds-elements = { $count ->
    [one] { $count } elemento
    [many] { $count } elementi
   *[other] { $count } elementi
}
kinds-delete-title = Eliminare il tipo «{ $name }»?
kinds-delete-message = { $count ->
    [0] Nessun elemento è di questo tipo.
    [one] L'unico elemento di questo tipo resterà senza tipo.
    [many] I { $count } elementi di questo tipo resteranno senza tipo.
   *[other] I { $count } elementi di questo tipo resteranno senza tipo.
}
