# よそで書かれたテキストに見つかった引用と、それを一件ずつ確認する横の
# パネル（ADR 0015）。locales/README.md を見よ。

## パネル。

found-title = 未照合の引用
# パネルのタブ。ほかのタブと並ぶので短く。
found-tab = 未照合の引用
found-between = マップと未照合の引用の境
found-taken-years = 年を含む括弧
found-taken-named = ライブラリの作品を挙げている注
found-taken-notes = すべての注
found-asking = ライブラリに問い合わせています…
found-make-certain = { $count ->
   *[other] 確実な{ $count }件を引用にする
}
found-made = { $count ->
   *[other] { $count }件を引用にしました
}
found-made-undo = Ctrl+Zで、まとめて一度に元に戻せます。
found-library-failed = ライブラリに問い合わせられませんでした。
found-nothing = 確認するものはありません
found-nothing-looked = 表示中のテキストには、未照合の引用は残っていません。引用のように見えるだけのテキストもありません。
found-nothing-looked-more = 表示中のテキストには、未照合の引用は残っていません。引用のように見えるだけのテキストもありません。引用とみなすものは、上で増やせます。
found-nothing-not-looked = 表示中のテキストには、プログラムが作った未照合の引用も、タグも残っていません。引用のように見えるだけのテキストは、何を引用とみなすかを上で指定すると探されます：年を含む括弧、または注。
found-list-label = 確認するもの
found-untitled = 無題
found-in-a-note = 注の中
# 引用があるマップの要素。
found-in = 「{ $element }」の中
found-in-note-of = 「{ $element }」の注の中
# 注が付く語の後に、小さく上付きで置く。
found-note-mark = 注
found-position = { $count }件中{ $index }件目
found-previous = 前へ
found-next = 次へ
found-list-show = 一覧を表示
found-list-hide = 一覧を隠す
found-later = あとで
found-leave = テキストのままにする
found-make = 引用にする

## ライブラリが提案するものの確かさ。

found-sure-certain = ライブラリに確実にあります
found-sure-likely = ライブラリに、これらしい文献があります
found-sure-possible = ライブラリに、これかもしれない文献があります
found-sure-none = まだ文献のない作品が含まれています

## 引用が何によって見つかったか。

found-by-zotero = Zoteroが作成
found-by-mendeley = Mendeley、または同じ書き方をするプログラムが作成
found-by-key = 文献を名指すタグ
found-by-form = 見た目から引用とみなしたもの

## これから作る引用。

found-the-citation = 引用
found-no-works = 作品が一つも挙げられていません。作品を追加するか、テキストのままにしてください。
found-add-work = 作品を追加
found-author-in-text = 著者を本文中に：Nagy (1979)
found-pick-work = 引用する作品：著者、タイトル、年
found-pick-add = 引用に作品を追加
found-too-little = ファイルにある情報が少なすぎて、この作品の文献を作れません
found-reference-failed = 文献を作れませんでした

## 注の中にある引用。

found-in-note = 注の中にあります
found-note-becomes = 注が引用になる
# 注が作品のほかに言っていること。作品の前の言葉、後の言葉、またはその両方になる。
found-note-around = 注のほかの言葉は、作品の前と後に置かれます{ $has ->
        [before] ：前に「{ $before }」
        [after] ：後に「{ $after }」
       *[both] ：前に「{ $before }」、後に「{ $after }」
    }。行内に組むか注にするかは、引用スタイルが決めます。
found-note-style = 行内に組むか注にするかは、引用スタイルが決めます。
found-citation-in-note = 引用が注の中に残る
    .hint = 注は注のままで、ほかの言葉もそのまま残ります。
found-for-all = 以降もすべて同じにする
found-note-not = 注の中にはありません。
# 注がほかに含むもの。テキストでの名前で。
found-note-holds = 注には{ $what ->
        [math] 数式
        [crossref] 相互参照
        [citation] 引用
        [hard_break] 段落内改行
       *[other] テキストでないもの
    }が含まれていて、作品の前後の言葉には入れられません。
found-note-another = 注にはほかの未照合の引用もあり、この引用の後の言葉に入れると失われてしまいます。

## 求められたことができなかった理由。

found-trouble-gone = もうテキストにありません。
found-trouble-changed = 提案したあとでここのテキストが変わったため、もう一度調べました。
found-trouble-cannot = ここでは引用にできません。

## テキストが言うとおりの、引用の作品の一つ。

# 作品を作った人：「Nagy、Lord」「Nagyほか」
found-people-two = { $first }、{ $second }
found-people-more = { $first }ほか
found-work-a-work = 作品
found-work-looking = { $work }をライブラリで探しています…
found-work-no-tag = { $work }は、ライブラリのどの文献にもないタグです。
found-work-not-found = { $work }はライブラリに見つかりませんでした。
found-work-chosen = 自分で選んだもの
# 書き手が同じ作品の別の引用にこの文献を選び、この引用もそれに従った。
found-work-followed = 同じ作品で選んだとおり
found-work-certain = 確実
found-work-likely = 有力
found-work-possible = 可能性あり
# テキストが言う作品。
found-work-for = 本文の表記：「{ $work }」
found-work-others = これかもしれないほかの文献
found-work-or = または
found-work-may-be = 候補
found-work-another = 別の文献…
found-work-find = 探す…
found-work-add = ライブラリに追加

## 言葉を減らす、第2段階（エージェント「chrome」）

# テキストのうち何を引用とみなすかを決めるスイッチの上に。
found-plain-text = テキストで書かれた引用
