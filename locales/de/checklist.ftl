# The checklist of a document (ADR 0038): what the template requires and
# the tree says, as remarks in the window of the document.

checklist-words = { $count ->
    [one] { $count } Wort; die Vorlage erlaubt { $limit }.
   *[other] { $count } Wörter; die Vorlage erlaubt { $limit }.
}
checklist-abstract-words = { $count ->
    [one] Die Zusammenfassung hat { $count } Wort; die Vorlage erlaubt { $limit }.
   *[other] Die Zusammenfassung hat { $count } Wörter; die Vorlage erlaubt { $limit }.
}
checklist-keywords = { $count ->
    [one] { $count } Schlüsselwort; die Vorlage erlaubt { $limit }.
   *[other] { $count } Schlüsselwörter; die Vorlage erlaubt { $limit }.
}
checklist-doubled = { $count ->
    [one] Ein weiteres Element der Art „{ $kind }“ steht neben dem ersten; nur das erste wird gedruckt.
   *[other] { $count } weitere Elemente der Art „{ $kind }“ stehen neben dem ersten; nur das erste wird gedruckt.
}
checklist-unplaced = { $count ->
    [one] Die Vorlage erzeugt keinen Umschlag: ein Element, dessen Art auf den Umschlag gehört, wird nicht gedruckt.
   *[other] Die Vorlage erzeugt keinen Umschlag: { $count } Elemente, deren Art auf den Umschlag gehört, werden nicht gedruckt.
}
