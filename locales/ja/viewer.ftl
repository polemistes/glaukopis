# ライブラリのファイルをウィンドウの側に表示したもの：そのページ、そのバー、うまくいかないこと。

viewer-file = ファイル
# 表示中のページと、全体の数：「271ページ中3ページ目」。
viewer-page-of = { $count }ページ中{ $page }ページ目
# 印刷上のページ番号。数えた番号と違うところで、その後に小さく示す。
viewer-printed = （{ $label }）
viewer-go-to-page = ページへ移動
viewer-zoom = ズーム
viewer-fit-width = 幅に合わせる
viewer-zoom-percent = { $percent }%
viewer-not-drawn = このページを描けませんでした：{ $why }
viewer-not-found = ファイルはもうライブラリにありません。
viewer-locked = ファイルはパスワードを求めるため、表示できません。
viewer-not-shown = この種類のファイルはここでは表示できません。別のプログラムで開いてください。
viewer-loading = ファイルを開いています…
# 画像のズームの一つ。全体が見えるように合わせる。どんなに小さくなっても。
viewer-fit-image = 画像全体を表示
# ズームを百分率で書き込む欄。
viewer-zoom-field = ズーム（%）
viewer-zoom-choose = ズームを選ぶ
viewer-files-menu = ライブラリのファイル
viewer-files-search = ファイルを探す
viewer-tree-empty = まだ何もありません

# 簡単な画像の編集（docs/plans/a-simple-image-editor.md）：バーのボタン、その下の行、そこで言うこと。
viewer-edit = 編集
viewer-edit-turn-left = 左に回転
viewer-edit-turn-right = 右に回転
viewer-edit-flip-sideways = 左右反転
viewer-edit-flip-over = 上下反転
viewer-edit-crop = 切り抜き
viewer-edit-brightness = 明るさ
viewer-edit-contrast = コントラスト
viewer-edit-saturation = 彩度
# 画像がある色をどれだけもつか。100がそのまま。
viewer-edit-percent = { $percent }%
# 一つのスライダーを100%に戻す。
viewer-edit-as-it-was = 元の値に戻す
viewer-edit-start-again = 最初からやり直す
viewer-edit-keep = 新しいファイルとして保存
# 切り抜きの大きさと、全体の大きさ：「1600 × 1200のうち800 × 600に切り抜く」。
viewer-edit-cut-to = { $fullWidth } × { $fullHeight }のうち{ $width } × { $height }に切り抜く
viewer-edit-leave-title = 保存せずに終了しますか？
viewer-edit-leave-message = 変更した内容は失われます。
viewer-edit-leave = 保存せずに終了
viewer-edit-kept = { $name }として保存しました
viewer-edit-not-kept = 編集した画像を保存できませんでした
viewer-edit-not-opened = 画像を編集のために開けませんでした
viewer-edit-too-large-title = 大きすぎて編集できません
viewer-edit-too-large-message = 画像が{ $most } MBを超えています。画像の大きさは{ $most } MBまでです。代わりに縮小したコピーを作って編集できます。
viewer-edit-make-smaller = 縮小したコピーを作る

# タブの中のファイル、ファイルのブックマーク（docs/plans/sources-in-tabs-bookmarks-and-the-scrolling-of-pages.md）。
viewer-tabs = タブ
viewer-tab-add = ファイルを追加…
viewer-tab-add-title = タブにファイルを追加
viewer-tab-menu = タブのメニュー
viewer-tab-close = タブを閉じる
viewer-tab-close-others = ほかのタブを閉じる
viewer-tab-again = 新しいタブでもう一度開く
viewer-tab-in-library = ライブラリで表示
viewer-tab-gone = もうライブラリにありません
viewer-tabs-none = ファイルはまだありません
# ファイルの側の欄にあるプロジェクトの名前のツールチップ。
viewer-sources-of = { $name }のタブ
viewer-places = ブックマークと目次
viewer-bookmark-here = この場所をブックマーク
viewer-bookmarks = ブックマーク
viewer-bookmarks-none = ブックマークはまだありません
# ブックマークの既定の名前と、その横に小さく示すページ。
viewer-bookmark-page = { $label }ページ
viewer-bookmark-name = ブックマークの名前
viewer-bookmark-rename = 名前を変更
viewer-bookmark-remove = 削除
viewer-bookmark-not-kept = ブックマークを保存できませんでした
viewer-contents = 目次
viewer-contents-none = このファイルには独自の目次がありません

# タブを開く、文献によるファイル、ライブラリの中で読むファイル（docs/plans/the-tabs-opened-files-by-their-references-and-a-file-read-in-the-library.md）。
viewer-back-to-files = ファイルの一覧に戻る

# 印刷（docs/plans/printing.md、記録 0075）。
# ファイルのバーと、そのページのダイアログにある、印刷するボタン。
viewer-print = 印刷…
# PDFのどのページを印刷するかを、描く前に尋ねるダイアログ。
viewer-print-pages = 印刷するページ
viewer-print-all = { $count ->
    [1] この1ページ
   *[other] 全{ $count }ページ
}
# 「ページ [3] ～ [10]」：ページ番号の二つの欄のまわりの語。
viewer-print-from = ページ
viewer-print-to = ～
# 印刷のためにページを描いているあいだ、システムのダイアログが開く前に言う。
viewer-print-drawing = 印刷のために{ $count }ページを描いています…
viewer-print-stop = 中止
viewer-print-failed = 印刷のためにページを描けませんでした
