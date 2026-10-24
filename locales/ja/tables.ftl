# テキストの中の表：作り方、その道具、それについて決めること。
# locales/README.md を参照。

## 表とその大きさ。表のパネルと、ファイルの読み込みに出る。

tables-table = 表
tables-size = { $rows }行、{ $columns }列
# 読み込んだものの最初の数行だけを表示するときの大きさ。
tables-size-shown = { tables-size }。最初の{ $shown }行を表示しています。

## 表の上のバーと、そのセルのメニュー。

tables-row = 行
tables-row-hint = 上または下に行を追加、行を削除
tables-row-above = 上に行を追加
tables-row-below = 下に行を追加
tables-row-remove = 行を削除
tables-column = 列
tables-column-hint = 前または後に列を追加、列を削除
tables-column-before = 前に列を追加
tables-column-after = 後に列を追加
tables-column-remove = 列を削除
tables-join = セルを結合
tables-join-hint = 選択したセルを結合
tables-split = セルを分割
tables-split-hint = セルを、結合する前のセルに分割
tables-headings = 見出し
tables-headings-hint = 最初の行と最初の列を見出しにするか
tables-first-row-headings = 最初の行を見出しにする
tables-first-column-headings = 最初の列を見出しにする
tables-cell-stands = セルの内容の配置
tables-left = 左
tables-left-hint = セルの内容を左に
tables-middle = 中央
tables-middle-hint = セルの内容を中央に
tables-right = 右
tables-right-hint = セルの内容を右に
tables-table-hint = 番号を振るか、幅をどうするか。表の削除
tables-numbered = 番号を振る
tables-the-table = 表…
tables-remove = 表を削除

## 表全体について決めるパネル。

tables-width = 幅
tables-width-needed = 必要に応じて
tables-width-half = 半分
tables-width-three-quarters = 4分の3
tables-width-whole = 全幅
tables-width-of-text = 文書のテキストの幅に対して。
tables-width-as-needed = 内容に必要なだけの幅。
tables-numbered-as = 「表1」のように番号を振る

## 大きさを指定して作る表。

tables-ask = 表の大きさ
tables-ask-heading = 表
tables-ask-grid = マス目で表の大きさを指定
tables-ask-by = { $rows }行×{ $columns }列
tables-ask-rows = 行
tables-ask-columns = 列
tables-ask-put = 挿入

## ファイルからの表。

tables-from-file = ファイルからの表
tables-sheet = シート
# 名前のないファイルのシート。
tables-sheet-number = シート{ $number }
tables-first-rows = 最初の数行（このようになります）
tables-caption = 表の説明
tables-caption-placeholder = キャプション。テキストの中で変更できます
tables-header-row = 最初の行は見出し
tables-header-column = 最初の列は見出し
tables-numbers-right = 数値の列は右寄せにします。
tables-put = テキストに挿入
# コンピューターのファイルの中からファイルを選ぶ窓の題。
tables-choose = 表
# そこで選べるファイルの呼び名。
tables-files = 表
tables-unreadable = { $file }を表として読み込めませんでした
tables-paste-rows = テキストには{ $rows }行あります。テキストの中の表は最大{ $most }行です。スプレッドシートではありません。何も貼り付けませんでした。
tables-paste-columns = テキストには{ $columns }列あります。テキストの中の表は最大{ $most }列です。スプレッドシートではありません。何も貼り付けませんでした。
tables-cannot-stand = ここには表を置けません
tables-drop-on-text = 表は、それが属するテキストの上にドロップしてください

## ページにその語のための要素がないとき、スタイルシートが出す。

tables-caption-empty = 表の説明
