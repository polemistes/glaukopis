# The checklist of a document (ADR 0038): what the template requires and
# the tree says, as remarks in the window of the document.

checklist-words = { $count ->
    [one] { $count } parola; il tipo di documento ne consente { $limit }.
    [many] { $count } parole; il tipo di documento ne consente { $limit }.
   *[other] { $count } parole; il tipo di documento ne consente { $limit }.
}
checklist-abstract-words = { $count ->
    [one] L'abstract ha { $count } parola; il tipo di documento ne consente { $limit }.
    [many] L'abstract ha { $count } parole; il tipo di documento ne consente { $limit }.
   *[other] L'abstract ha { $count } parole; il tipo di documento ne consente { $limit }.
}
checklist-keywords = { $count ->
    [one] { $count } parola chiave; il tipo di documento ne consente { $limit }.
    [many] { $count } parole chiave; il tipo di documento ne consente { $limit }.
   *[other] { $count } parole chiave; il tipo di documento ne consente { $limit }.
}
checklist-doubled = { $count ->
    [one] Un altro elemento del tipo «{ $kind }» sta accanto al primo; si stampa solo il primo.
    [many] Altri { $count } elementi del tipo «{ $kind }» stanno accanto al primo; si stampa solo il primo.
   *[other] Altri { $count } elementi del tipo «{ $kind }» stanno accanto al primo; si stampa solo il primo.
}
checklist-unplaced = { $count ->
    [one] Il tipo di documento non fa copertina: un elemento di un tipo da copertina non è stampato.
    [many] Il tipo di documento non fa copertina: { $count } elementi di un tipo da copertina non sono stampati.
   *[other] Il tipo di documento non fa copertina: { $count } elementi di un tipo da copertina non sono stampati.
}

## Fewer words, stage 4: what the type and the layout ask of the front page and of quotations.

checklist-anonymous = Il tipo di documento chiede un documento anonimo; la prima pagina nomina i contributori. Attiva «Rendi anonima la prima pagina» sotto Prima pagina in Aspetto.
# A quotation within a paragraph of text, between quotation marks, as long as the layout sets quotations off from. The lines are estimated from the layout.
checklist-long-quotation = { $by ->
    [lines] «{ $element }» ha nel testo una citazione di { $words } parole, circa { $lines ->
        [one] { $lines } riga
        [many] { $lines } righe
       *[other] { $lines } righe
    }; Aspetto stacca dal testo le citazioni da { $limit } righe in su.
   *[words] «{ $element }» ha nel testo una citazione di { $words } parole, circa { $lines ->
        [one] { $lines } riga
        [many] { $lines } righe
       *[other] { $lines } righe
    }; Aspetto stacca dal testo le citazioni da { $limit } parole in su.
}

## The order of the tree: what is said of the parts, and never mended.

# Works are cited in the text, and no element of the kind Bibliography stands under the document.
checklist-no-bibliography = Nel testo sono citate delle opere, e il documento non ha una bibliografia. Aggiungine una sotto Parti in Aspetto.
# The parts the document has, in the order its type has them: "Title page · Abstract · The text · Bibliography".
checklist-order = Il tipo di documento ha queste parti in quest'ordine: { $parts }.
