# 画像庫：アプリケーションのすべての画像と、その一つ。

pictures-title = 画像
pictures-all = すべての画像
pictures-picture = 画像
pictures-search-placeholder = 画像を検索
pictures-clear-search = 検索をクリア
pictures-count = { $count }枚の画像
# 検索で見つかった画像の数と、全体の数。
pictures-shown = { $count }枚中{ $shown }枚の画像
pictures-add = 画像を追加…
pictures-empty = 画像庫は空です
pictures-empty-text = ここに追加した画像は、すべてのプロジェクトで使えます。テキストに入れた画像もここに保管されます。画像を追加するか、このウィンドウにドロップしてください。
pictures-nothing-found = 見つかりませんでした
pictures-nothing-found-text = これらの語をすべて含む画像はありません。
# 名前のない画像の呼び名。
pictures-unnamed = 画像
pictures-with-notes = メモあり

## 画像を収める、外す

# ファイルを選ぶダイアログの題と、そこに示すファイルの呼び名。
pictures-add-title = 画像を追加
pictures-files = 画像
pictures-taken-in = { $count ->
    [1] 「{ $name }」は画像庫に入りました
   *[other] { $count }枚の画像が画像庫に入りました
}
pictures-remove-title = 「{ $name }」を画像庫から外しますか？
pictures-remove-unused = この画像を使っているプロジェクトはありません。ここでの画像の説明と、画像についての自分のメモも、いっしょに削除されます。
pictures-remove-used = { $count }件のプロジェクトがこの画像を使っています。その図は画像のないままになります。ここでの画像の説明と、画像についての自分のメモも、いっしょに削除されます。
pictures-no-backend = バックエンドがありません。

## 一つの画像

pictures-name = 名前
pictures-name-placeholder = 画像の呼び名
pictures-caption = キャプション
pictures-caption-placeholder = 画像の説明
pictures-caption-hint = この画像で作る図は、この語句で始まります。図の説明は、ここを変えずに図の側で変更できます。
pictures-italic = 斜体
pictures-small-caps = スモールキャピタル
# 画像が何を示すかを、見ることのできない人のために言葉で。
pictures-alt = 内容
pictures-alt-placeholder = 見ることのできない人のための、言葉での説明
pictures-absent = この画像はこのコンピューターにありません。プロジェクトで使われていて、画像を入れた人から届いたときに表示されます。
pictures-notes = メモ
pictures-note-project = このプロジェクトで
pictures-note-project-placeholder = この仕事について考えたこと
pictures-note-project-hint = ここに書いたことは、プロジェクトをもつ全員と共有されます。
pictures-note-for-all = すべてのプロジェクト用に保存
pictures-note-write-for-all = すべてのプロジェクト用に書く
pictures-note-all = すべてのプロジェクトで
pictures-note-all-placeholder = どこで使うときにも当てはまる、考えたこと
pictures-note-all-hint = このコンピューターの画像庫に、画像とともに保存されます。
pictures-note-placeholder = 考えたこと。自分用で、どの文書にも入りません。
pictures-note-label = この画像についての自分のメモ
pictures-file = ファイル
pictures-kind = 種類
pictures-kind-svg = SVG（描画）
pictures-dimensions-label = 幅と高さ
pictures-dimensions = { $width } × { $height }ポイント
pictures-size = サイズ
# 画像を画像庫に収めた日時。
pictures-added = 追加日
pictures-used-in = 使用先
pictures-this-project = このプロジェクト
# 名前のないマップ。
pictures-untitled = 無題
pictures-unused = この画像を使っているプロジェクトはありません。
pictures-remove = 画像庫から外す

## ライブラリのファイルにして、文献に付けた画像。

pictures-attach = 文献に添付…
pictures-attach-title = 「{ $name }」を文献に添付
pictures-attached = 画像は{ $name }のファイルに入りました
pictures-attach-failed = 画像を添付できませんでした
