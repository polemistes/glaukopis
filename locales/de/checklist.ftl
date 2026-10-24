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

## Fewer words, stage 4: what the type and the layout ask of the front page and of quotations.

checklist-anonymous = Der Dokumenttyp verlangt ein anonymes Dokument; die erste Seite nennt die Mitwirkenden. Schalten Sie in „Aussehen“ unter „Erste Seite“ den Schalter „Erste Seite anonymisieren“ ein.
# A quotation within a paragraph of text, between quotation marks, as long as the layout sets quotations off from. The lines are estimated from the layout.
checklist-long-quotation = { $by ->
    [lines] „{ $element }“ hat im Text ein Zitat von { $words } Wörtern, etwa { $lines ->
        [one] { $lines } Zeile
       *[other] { $lines } Zeilen
    }; das Layout setzt Zitate von { $limit } Zeilen an vom Text ab.
   *[words] „{ $element }“ hat im Text ein Zitat von { $words } Wörtern, etwa { $lines ->
        [one] { $lines } Zeile
       *[other] { $lines } Zeilen
    }; das Layout setzt Zitate von { $limit } Wörtern an vom Text ab.
}
