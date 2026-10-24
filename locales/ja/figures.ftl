# テキストの中の図、数式、別行立ての数式と、それらへの相互参照。
# locales/README.md を参照。

## 図と、それについて決めるパネル。

figures-figure = 図
figures-width = 幅
figures-width-third = 3分の1
figures-width-half = 半分
figures-width-three-quarters = 4分の3
figures-width-whole = 全幅
figures-width-of-row = 行の中で割り当てられた幅に対して。
figures-width-of-text = 文書のテキストの幅に対して。
figures-shows = 内容
figures-shows-placeholder = 見ることのできない人のための説明
figures-numbered = 「図1」のように番号を振る
figures-keep-caption = キャプションを画像とともに保存
figures-keep-caption-hint = この画像で作る図は、ここに書いた内容で始まります
figures-take-caption = 画像に保存されたキャプションを使う
figures-take-caption-hint = 画像とともに保存された内容が、今の内容に代わってここに入ります
figures-another-picture = 別の画像…
figures-remove = 図を外す
figures-caption-kept = 画像とともに保存済み
figures-caption-kept-detail = この画像で作る図は、この語句で始まります。
# コンピューターのファイルの中から画像を選ぶ窓の題。
figures-choose-picture = 画像
# そこで選べるファイルの呼び名。
figures-picture-files = 画像

## テキストから読む画像庫。

figures-pictures-unread = 画像を読み込めませんでした
figures-picture-not-taken = 画像を追加できませんでした
figures-picture-not-kept = 画像の説明を保存できませんでした
figures-picture-not-removed = 画像を外せませんでした

## 図、表、別行立ての数式の配置。

figures-stands = 配置
figures-stands-in-row = 他と横に並べる
figures-stands-alone = 単独に戻す
# 配置の選択肢について言う。kind は図、表、数式のいずれか。
figures-stands-where = { $kind ->
        [figure] 図
        [table] 表
       *[equation] 数式
    }の配置
figures-side-format = レイアウトどおり
figures-side-left = 左
figures-side-middle = 中央
figures-side-right = 右
# 文書のレイアウトが、ある種類のものの配置について言うこと。flow は、
# 数式と中央に置くものでは none。
figures-usual = レイアウトでは{ $kind ->
        [figure] 図
        [table] 表
       *[equation] 数式
    }を{ $side ->
        [left] 左
        [right] 右
       *[center] 中央
    }に置きます{ $flow ->
        [around] （周りにテキストを回り込ませる）
        [apart] （テキストから離す）
       *[none] {""}
    }。
figures-text = テキスト
figures-flows-where = { $kind ->
        [figure] 図
        [table] 表
       *[equation] 数式
    }の周りにテキストを回り込ませるか
figures-flow-format = レイアウトどおり
figures-flow-around = 回り込ませる
figures-flow-apart = 離して置く
figures-flow-at-side = 左右に置いたものの周りにはテキストが回り込みます。
figures-beside = 前のものと横に並べる

## 行内の数式と、独立した行の別行立ての数式。

figures-formula = 数式
figures-equation = 別行立ての数式
figures-equation-numbered = 番号を振る
figures-formula-field = TeXの記法による数式
figures-formula-empty = 書いたものが、組まれる姿でここに表示されます。
figures-formula-hint = TeXのように書きます。Enterで確定、Escで元のまま。
figures-equation-hint = TeXのように書きます。Enterで確定、Shift+Enterで改行、Escで元のまま。
figures-formula-unread = 数式を読み取れませんでした。
# Pandoc がないときなど、数式を作れなかったとき。reason はプログラムが言ったこと。
figures-formula-failed = 数式を表示できません：{ $reason }
# まだ何も書かれていない数式の所に、テキストの中で出る。
figures-formula-blank = 数式
figures-equation-blank = 別行立ての数式

## 押して数式に入れられるもの。

figures-sign-raised = 上付き
figures-sign-lowered = 下付き
figures-sign-fraction = 分数
figures-sign-root = 根号
figures-sign-sum = 総和
figures-sign-integral = 積分
figures-sign-brackets = 伸縮する括弧
figures-sign-alpha = アルファ
figures-sign-beta = ベータ
figures-sign-gamma = ガンマ
figures-sign-lambda = ラムダ
figures-sign-pi = パイ
figures-sign-sigma = シグマ
figures-sign-less-or-equal = 小なりイコール
figures-sign-greater-or-equal = 大なりイコール
figures-sign-not-equal = 等しくない
figures-sign-nearly-equal = ほぼ等しい
figures-sign-times = 掛ける
figures-sign-plus-or-minus = プラスマイナス
figures-sign-arrow = 矢印
figures-sign-infinity = 無限大
figures-sign-words = 数式内の語句

## 図、表、別行立ての数式、部分への相互参照。

figures-points-by = 表示
figures-form-full = 語と番号
figures-form-number = 番号のみ
figures-form-equation = 数式の横にある番号
figures-form-its-number = 番号
figures-form-its-name = 名前
figures-go-to = 参照先へ移動
figures-pointed-gone = この参照先はもう文書にありません
figures-point-elsewhere = 別のものを参照…

## 相互参照の参照先を選ぶ。

figures-targets = 参照先を選ぶ
figures-targets-placeholder = 図、表、数式、部分を参照
figures-targets-search = 参照先を検索
figures-targets-results = 参照できるもの
figures-targets-figures = 図
figures-targets-tables = 表
figures-targets-equations = 数式
figures-targets-parts = 文書の部分
figures-targets-figure-unsaid = 説明のない図
figures-targets-table-unsaid = 説明のない表
figures-targets-no-match = 文書にこの語に当てはまるものはありません。
figures-targets-none = 参照できるものがまだありません。図も表も、番号付きの数式も、名前のある部分もありません。
figures-targets-hint = 相互参照は参照先に従います：その番号にも、レイアウトでの呼び名にも。

## ページにその語のための要素がないとき、スタイルシートが出す。

figures-picture-absent = 画像がこのコンピューターにありません
# このコンピューターにあるが読めなかった画像。reason は読み込みが言ったこと。
figures-picture-unread = 画像を読み込めませんでした：{ $reason }
figures-caption-placeholder = 画像の説明
