# The checklist of a document (ADR 0038): what the template requires and
# the tree says, as remarks in the window of the document.

checklist-words = { $count ->
    [one] { $count } Wort; der Dokumenttyp erlaubt { $limit }.
   *[other] { $count } Wörter; der Dokumenttyp erlaubt { $limit }.
}
checklist-abstract-words = { $count ->
    [one] Die Zusammenfassung hat { $count } Wort; der Dokumenttyp erlaubt { $limit }.
   *[other] Die Zusammenfassung hat { $count } Wörter; der Dokumenttyp erlaubt { $limit }.
}
checklist-keywords = { $count ->
    [one] { $count } Schlüsselwort; der Dokumenttyp erlaubt { $limit }.
   *[other] { $count } Schlüsselwörter; der Dokumenttyp erlaubt { $limit }.
}
checklist-doubled = { $count ->
    [one] Ein weiteres Element der Art „{ $kind }“ steht neben dem ersten; nur das erste wird gedruckt.
   *[other] { $count } weitere Elemente der Art „{ $kind }“ stehen neben dem ersten; nur das erste wird gedruckt.
}
checklist-unplaced = { $count ->
    [one] Der Dokumenttyp erzeugt keinen Umschlag: ein Element, dessen Art auf den Umschlag gehört, wird nicht gedruckt.
   *[other] Der Dokumenttyp erzeugt keinen Umschlag: { $count } Elemente, deren Art auf den Umschlag gehört, werden nicht gedruckt.
}

## Fewer words, stage 4: what the type and the layout ask of the front page and of quotations.

checklist-anonymous = Der Dokumenttyp verlangt ein anonymes Dokument; die erste Seite nennt die Mitwirkenden. Schalten Sie in „Aussehen“ unter „Erste Seite“ den Schalter „Erste Seite anonymisieren“ ein.
# A quotation within a paragraph of text, between quotation marks, as long as the layout sets quotations off from. The lines are estimated from the layout.
checklist-long-quotation = { $by ->
    [lines] „{ $element }“ hat im Text ein Zitat von { $words } Wörtern, etwa { $lines ->
        [one] { $lines } Zeile
       *[other] { $lines } Zeilen
    }; in „Aussehen“ werden Zitate ab { $limit } Zeilen vom Text abgesetzt.
   *[words] „{ $element }“ hat im Text ein Zitat von { $words } Wörtern, etwa { $lines ->
        [one] { $lines } Zeile
       *[other] { $lines } Zeilen
    }; in „Aussehen“ werden Zitate ab { $limit } Wörtern vom Text abgesetzt.
}

## The order of the tree: what is said of the parts, and never mended.

# Works are cited in the text, and no element of the kind Bibliography stands under the document.
checklist-no-bibliography = Es werden Werke zitiert, und das Dokument hat kein Literaturverzeichnis. Fügen Sie in „Aussehen“ unter „Teile“ eines hinzu.
# The parts the document has, in the order its type has them: "Title page · Abstract · The text · Bibliography".
checklist-order = Der Dokumenttyp hat diese Teile in dieser Reihenfolge: { $parts }.
