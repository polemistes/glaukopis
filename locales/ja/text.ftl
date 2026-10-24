# テキストとしての要素：その名前がタイトルになり、その下の要素が順に並ぶ。
# 一つひとつが見出しとそのテキスト。

text-title = タイトル
text-name = 要素の名前
text-grip = この要素を移動または変更
# テキストの中でドラッグした要素が入る所。そこに引かれる線が言う。
text-drop-under = 「{ $name }」の下
text-drop-after = 「{ $name }」の後
text-drop-before = 「{ $name }」の前
text-split = ここで分割
text-heading-kept = カーソルの後には、引用や注など名前に入れられないものがあるため、新しい要素の最初の段落になります
text-join = 上の要素とつなげる
text-open-as-map = 中に入る

## 要素の下にあるものと、そのテキストを折りたたむ

# 折りたたまれたものの代わりに出る：要素自体のテキストが折りたたまれているか
# （text は "yes" か "no"）、その下の要素の数、そして全体の語数（0のこともある）。
text-folded = { $text ->
    [yes] { $parts ->
        [0] 折りたたまれたテキスト
       *[other] 折りたたまれたテキストと{ $parts }個の要素
    }
   *[no] 折りたたまれた{ $parts }個の要素
}{ $words ->
    [0] {""}
   *[other] 、{ $words }語
}

## 余白の関連付け

text-associations = 関連付け
text-outline = アウトライン
text-outline-between = アウトラインとテキストの境
text-go-to = 「{ $name }」へ移動
text-add-label = ラベルを追加…
text-change-label = ラベルを変更…
text-remove-association = 関連付けを解除
text-hint-linking = 関連付ける要素の名前をクリックします · { $esc }でやめる

## テキストの下

text-notes = { $count }件の注
# 変数の所には、キーがキーの形で出る。
text-keys = { $alt }+{ $enter }で新しい要素 · { $alt }+{ $shift }+{ $enter }でその下に要素 · { $at }で引用

## 言葉を減らす、第2段階（エージェント「chrome」）

# テキストの中のクローン：変数の所に、原本の名前が太字で出る。
text-clone = { $name }のクローン
text-clone-go = 原本へ移動
text-unfold = この要素を展開
text-fold-this = この要素を折りたたむ
text-unfold-all-under = 下位要素をすべて展開
text-fold-all-sub = 下位要素をすべて折りたたむ
text-unfold-all = すべて展開
# テキストの中で要素を折りたたむ印のツールチップ。
text-unfold-shift = 展開 · Shiftを押しながらで、下位要素もすべて
text-fold-this-shift = この要素を折りたたむ · Shiftを押しながらで、下位要素をすべて展開
# アウトラインのボタン。
text-outline-unfold = 下位要素を展開
text-outline-fold-sub = 下位要素を折りたたむ
