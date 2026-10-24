# 文書のチェックリスト（ADR 0038）：テンプレートが求めることと、ツリーが
# 示すことを、文書の窓に指摘として示す。

checklist-words = { $count ->
   *[other] { $count }語。テンプレートの上限は{ $limit }語です。
}
checklist-abstract-words = { $count ->
   *[other] 要旨は{ $count }語です。テンプレートの上限は{ $limit }語です。
}
checklist-keywords = { $count ->
   *[other] キーワードは{ $count }個です。テンプレートの上限は{ $limit }個です。
}
checklist-doubled = { $count ->
   *[other] 種類「{ $kind }」の要素が、最初のもののほかに{ $count }個あります。印刷されるのは最初のものだけです。
}
checklist-unplaced = { $count ->
   *[other] テンプレートは表紙を作りません。表紙の種類の要素{ $count }個は印刷されません。
}

## 言葉を減らす、第4段階：文書種別とレイアウトが最初のページと引用に求めること。

checklist-anonymous = 文書種別は匿名の文書を求めていますが、最初のページに著者等の名前があります。見た目の「最初のページ」で「最初のページを匿名にする」をオンにしてください。
# 本文の段落の中の、引用符で囲んだ引用。レイアウトが引用を別に組む長さのもの。行数はレイアウトから見積もる。
checklist-long-quotation = { $by ->
    [lines] 「{ $element }」の本文に{ $words }語の引用があり、約{ $lines ->
       *[other] { $lines }行
    }です。このレイアウトでは{ $limit }行からの引用は別に組みます。
   *[words] 「{ $element }」の本文に{ $words }語の引用があり、約{ $lines ->
       *[other] { $lines }行
    }です。このレイアウトでは{ $limit }語からの引用は別に組みます。
}
