# The notebook: what is collected outside all projects, as notes (record 0101).

## The place in the row, and the page

notebook-title = ノートブック
notebook-notes = ノート
notebook-note = ノート
notebook-search = ノートを検索
notebook-search-clear = 検索をクリア
notebook-new-note = 新しいノート
notebook-add-files = ファイルを追加…
notebook-add-files-title = ノートブックにファイルを追加
notebook-empty = ノートブックは空です
    .text = プロジェクトの外で出会ったものを、何でもここに集めます：言葉、画像、ファイル。それぞれが、出どころを覚えているノートになります。
notebook-unreadable = ノートブックを読み込めませんでした
notebook-nothing-found = ノートが見つかりません
notebook-empty-note = 空のノート
notebook-holds-picture = 画像
notebook-holds-file = ファイル
notebook-holds-passage = 取り込んだ言葉
notebook-resize-list = ノート一覧の幅
notebook-choose = ノートを選ぶか、新しく作ってください
notebook-selected = { $count }件のノートを選択中
notebook-deleted = { $count ->
    [1] ノートを削除しました
   *[other] { $count }件のノートを削除しました
}
notebook-redo = やり直す
notebook-name = 名前
notebook-write = 書くか、見つけたものを貼り付けてください
# What became of a note: "Used in ‹project› · quotation".
notebook-went = その後どうなったか
notebook-used-in = 使用先
notebook-went-text = テキスト
notebook-went-quotation = 引用文
notebook-went-figure = 画像
notebook-went-reference = 文献
notebook-went-file = ファイル
# How a box is shown: as its surface, or as a list.
notebook-shown-as = 表示形式
notebook-surface = キャンバス
notebook-list = リスト
notebook-close-note = ノートを閉じる
notebook-resize-column = ボックスの幅
notebook-resize-note = ノートの幅
notebook-box-empty = このボックスにはノートがありません
# What the plugin for Firefox handed over has arrived.
notebook-arrived = ノートブックに追加しました
notebook-arrived-from = ノートブックに追加しました：{ $title }
notebook-arrived-many = { $count ->
   *[other] ノートブックに{ $count }件追加しました
}

## A note and its text

# The first box of the notebook, named so in the copy of the notebook written as Org until it is given a name.
notebook-org-first-box = 未整理

# A file a note holds, as it stands in the note: opened by two presses.
notebook-file-open-named = { $name }を開く
notebook-file-not-here = このコンピューターにファイルがありません

# Files that could not be taken in as notes, said in one message.
notebook-files-not-taken = 取り込めなかったファイルがあります

# Words selected in a file read in Glaukopis, or a part of a page marked, sent to the notebook as a new note.
notebook-from-file-added = ノートブックに追加しました
notebook-from-file-not-added = ノートブックに追加できませんでした

## Sources

notebook-source-none = 出典なし
# Where a photograph was taken, in degrees.
notebook-source-north = 北緯{ $degrees }°
notebook-source-south = 南緯{ $degrees }°
notebook-source-east = 東経{ $degrees }°
notebook-source-west = 西経{ $degrees }°

notebook-sources = 出典
notebook-source = 出典
notebook-source-sort = 種別
notebook-source-web = ウェブページ
notebook-source-reference = 文献
notebook-source-other = その他
notebook-source-url = アドレス
notebook-source-page-title = タイトル
notebook-source-choose-reference = 文献を選択…
notebook-source-place = 参照位置
notebook-source-words = 出どころ
notebook-source-file-name = 名前
notebook-source-file-changed = 最終変更日
# Of a photograph: when it was taken, and where.
notebook-source-file-taken = 撮影日
notebook-source-file-where = 撮影場所
notebook-source-make-reference = 文献を作る
notebook-source-in-library = ライブラリ内：
notebook-source-passages = ここから取り込んだもの
notebook-source-changed = 取り込んだ後に変更されています。もとの内容：
notebook-source-bring-back = 復元
notebook-source-own-words = 自分の言葉にする

## Boxes and tags

notebook-all-notes = すべてのノート
notebook-boxes = ボックス
# The first box, where everything lands, until it is given a name.
notebook-box-unsorted = 未整理
notebook-box-new = 新しいボックス
notebook-box-name = ボックスの名前
notebook-box-receives = 外部からのノートはここに入る
notebook-box-delete-title = 「{ $name }」を削除しますか？
notebook-box-delete-message = { $count ->
    [1] 中のノートは「{ $first }」に移ります。
   *[other] 中の{ $count }件のノートは「{ $first }」に移ります。
}
notebook-move-to = 移動先
notebook-tags = タグ
notebook-tag-name = タグの名前
notebook-tag-remove = すべてのノートから外す
notebook-tag-remove-title = すべてのノートから「{ $tag }」を外しますか？
notebook-tag-remove-message = { $count ->
   *[other] { $count }件のノートに付いています。
}
notebook-tag-merge-title = 「{ $from }」の名前を「{ $to }」に変更しますか？
notebook-tag-merge-message = 「{ $from }」と「{ $to }」は一つのタグになります。
notebook-tags-off = タグに関係なくすべて表示
# The field under the name of a note, where a tag is added.
notebook-tag-add = タグを追加
notebook-tag-take-away = 「{ $tag }」を外す
notebook-tags-offered = タグ
notebook-join = 結合
notebook-joined = { $count }件のノートを結合しました
notebook-divide = 分割

## The surface

notebook-surface-of-box = ボックスのキャンバス
notebook-surface-not-placed = 未配置
notebook-surface-empty-note = 空のノート
notebook-surface-new-note-here = ここに新しいノート
notebook-surface-show-all = すべて表示
notebook-surface-link-handle = ほかのノートにドラッグしてリンクする

## Finding, and starting texts

# The filters of the list, in a window at a button beside the field that finds.
notebook-filters = 絞り込み
notebook-filters-on = { $count ->
   *[other] 絞り込み（{ $count }）
}
notebook-filter-holds = 含むもの
notebook-filter-picture = 画像
notebook-filter-file = ファイル
notebook-filter-passage = 取り込んだ言葉
notebook-filter-link = ほかのノートへのリンク
notebook-filter-collected = 集めた日
notebook-filter-from = 開始
notebook-filter-to = 終了
notebook-filter-came = 出典
notebook-filter-web = ウェブページ
notebook-filter-reference = 文献
notebook-filter-file-source = ファイル
notebook-filter-other = その他
notebook-filter-no-source = 出典なし
notebook-filter-unseen = 未読
notebook-filter-use = 使用
notebook-filter-use-all = すべて
notebook-filter-used = プロジェクトで使用済み
notebook-filter-unused = 未使用
notebook-filter-clear = 絞り込みを解除
notebook-nothing-passes = 表示中のノートに、絞り込みの条件に合うものはありません。
# A note taken in that has not been looked at: the dot before its name.
notebook-unseen = 未読
# Words read in the images of notes, kept for finding.
notebook-read-text = テキストを読み取る
notebook-read-again = もう一度読み取る
notebook-text-read = 読み取ったテキスト
notebook-reading = { $count ->
    [1] { $name }を読み取っています…
   *[other] { $name }を読み取っています（{ $count }件中{ $done }件）…
}
notebook-reading-stop = 中止
notebook-read-done = { $count ->
    [1] 画像のテキストを読み取りました
   *[other] { $count }枚の画像のテキストを読み取りました
}
notebook-read-failed = { $name }のテキストを読み取れませんでした
# Starting texts: a new note that begins with lines given.
notebook-new-note-from = 開始テキストから新しいノート
notebook-starts = 開始テキスト…
notebook-starts-title = 開始テキスト
notebook-start-new = 新規
notebook-start-unnamed = 名前なし
notebook-start-name = 名前
notebook-start-lines = 行
notebook-start-kind = 行の種類
notebook-start-up = 上へ移動
notebook-start-down = 下へ移動
notebook-start-none = 開始テキストはまだありません。
notebook-start-delete-title = 「{ $name }」を削除しますか？
notebook-start-delete-message = これから作ったノートは、そのまま残ります。

## Notes from other programs

notebook-import = ノートをインポート…
notebook-import-title = ノートをインポート
notebook-import-folder = フォルダー…
notebook-import-file = ファイル…
notebook-import-programs = Obsidian、Joplin、Notion、Bear、Google Keep、OneNoteのフォルダー、またはMarkdownやテキストのフォルダー。Evernote（.enex）やOneNote（.one）のファイル、またはMarkdownファイル1つ。
notebook-import-choose-folder = ノートのフォルダーを選択
notebook-import-choose-file = ノートのファイルを選択
notebook-import-filter = ノート
notebook-import-kind = { $kind ->
    [obsidian] Obsidianのノート
    [joplin] Joplinのノート
    [notion] Notionのノート
    [bear] Bearのノート
    [evernote] Evernoteのノート
    [keep] Google Keepのノート
    [onenote] OneNoteのノート
   *[markdown] Markdownとテキストのファイル
}
notebook-import-count = { $count ->
   *[other] { $count }件のノート
}
notebook-import-files = { $count ->
    [0] 画像・ファイルなし
   *[other] 画像・ファイル{ $count }件
}
notebook-import-none = ここにはノートが見つかりませんでした。
notebook-import-to-know = 知っておくこと
notebook-import-unread = これはノートとして読み込めませんでした。
notebook-import-do = インポート
notebook-import-reading = { $count }件中{ $done }件を読み込み中：{ $name }
notebook-import-stop = 中止
notebook-import-done = { $count ->
   *[other] { $count }件のノートを「{ $box }」にインポートしました
}
notebook-import-nothing = インポートするものが見つかりませんでした
notebook-import-problems = { $count ->
   *[other] { $count }件を読み込めませんでした：{ $first }
}

## The list in the document pane, and what goes into a text

notebook-between = 側とノートの境
notebook-pane-find = ノートを探す
notebook-pane-open = ノートブックを開く
notebook-pane-unread = ノートブックを読み込めませんでした
notebook-pane-empty = ノートブックは空です
notebook-pane-nothing-found = この言葉を含むノートはありません
notebook-pane-drag = ノート、またはその一部をテキストにドラッグしてください。
notebook-pane-show-all = すべて表示
notebook-pane-show-less = 表示を減らす
notebook-pane-used = このプロジェクトで使用
notebook-pane-put-into-text = テキストに入れる
notebook-pane-open-note = ノートブックで開く
notebook-pane-a-picture = 画像
# A source made a reference of the library, as what was taken from it went into a text.
notebook-pane-reference-made = ライブラリに追加しました：{ $title }
notebook-pane-reference-not-made = { $source }をライブラリに追加できませんでした
notebook-pane-picture-not-moved = { $name }をライブラリのファイルに入れられませんでした
notebook-pane-file-not-into-text = ファイルはテキストに入れられません
notebook-pane-not-into-text = ノートをテキストに入れられませんでした

## The window of a note of its own (record 0109)

notebook-note-window-placeholder = ノートを書く
notebook-note-window-send = ノートブックへ
notebook-note-window-add-file = ファイルを追加…
notebook-note-window-not-sent = ノートをノートブックに書き込めませんでした
