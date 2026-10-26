# ライブラリのファイル：画像と並ぶ独自の保管場所に、独自のフォルダーに分けて
# 置く。どのファイルも、どの文献にも属さないか、一つまたは複数の文献に属する。
# この表示はライブラリの場所に出る。

files-title = ライブラリのファイル
files-all = すべてのファイル
files-file = ファイル
files-unread = ライブラリのファイルを読み込めませんでした
files-count = { $count }個のファイル
files-shown-of = { $count }個中{ $shown }個のファイル
files-selected-of = { $count }個中{ $selected }個を選択
files-selected = { $count }個のファイルを選択中

## ファイルの種類。

files-kind = 種類
files-kind-pdf = PDF
files-kind-picture = 画像
files-kind-document = 文書
files-kind-other = その他のファイル

## 収める。

files-add = ファイルを追加…
files-add-title = ライブラリにファイルを追加
files-add-folder = フォルダーを追加…
files-add-folder-title = ライブラリにフォルダーを追加
files-more = その他の追加方法
files-taking-in = { $count ->
    [1] ファイルを収めています…
   *[other] { $count }個のファイルとフォルダーを収めています…
}
files-taking-in-progress = { $count }個中{ $done }個を収めています：{ $name }
files-taken-in = { $count }個のファイルを収めました
files-same = { $count }個はすでにありました
files-folders-made = { $count }個のフォルダーを作りました
files-problems = { $count }個は読み込めませんでした
files-taken-none = 何も収めませんでした
files-take-in-failed = ファイルを収められませんでした

## 空のとき、検索、フィルター。

files-empty = ファイルはまだありません
files-empty-text = ファイルやフォルダーを追加するか、ここにドロップしてください。どの種類のファイルもライブラリ独自の保管場所に保管され、フォルダーはその中のフォルダーを保ちます。
files-folder-empty = このフォルダーには何もありません
files-folder-empty-text = ここにファイルをドロップするか、別のフォルダーからドラッグしてください。
files-search = ファイルを検索
files-search-in = { $name }内を検索
files-search-clear = 検索をクリア
files-nothing-found = 見つかりませんでした
files-nothing-found-text = 名前にも、属する文献にも、その語を含むファイルはありません。
files-nothing-passes = ここにはフィルターに合うファイルがありません。
files-filters = フィルター
files-filters-on = フィルター：{ $count }個がオン
files-filter-kind = 種類
files-filter-all = すべての種類
files-filter-pdf = PDF
files-filter-picture = 画像
files-filter-document = 文書
files-filter-other = その他のファイル
files-filter-unassigned = 未割り当てのみ
files-filter-below = 下のフォルダーも含める
files-filter-search-all = すべてのフォルダーで検索
files-filter-clear = フィルターをクリア
files-sort = 並べ替え
files-sort-name = 名前順
files-sort-reference = 文献順
files-sort-added = 追加日順
files-sort-size = サイズ順
files-sort-descending = 降順

## ファイルの一覧。

files-no-reference = 文献なし
files-missing = 見つかりません
files-reveal = ファイルマネージャーで表示
files-move = 移動…
files-move-to = 移動先
files-move-failed = ファイルを移動できませんでした
files-at-top = 最上位（フォルダーなし）

## フォルダー。

files-folders = フォルダー
files-folders-hint = フォルダーはファイルを整理します。どのファイルも置き場所は一つです。追加したフォルダーは、その中のフォルダーを保ちます。
files-folder = フォルダー
files-folder-new = 新しいフォルダー
files-folder-new-in = { $name }に新しいフォルダー
files-folder-new-inside = 中に新しいフォルダー
files-folder-name = フォルダーの名前
files-folder-name-failed = フォルダーに名前を付けられませんでした
files-folder-move-to = 移動先
files-folder-to-top = 最上位へ
files-folder-move-failed = フォルダーを移動できませんでした
files-folder-expand = 開く
files-folder-collapse = 閉じる
files-folder-delete = フォルダーを削除
files-folder-delete-title = フォルダー「{ $name }」を削除しますか？
files-folder-delete-empty = フォルダーは空です。
files-folder-delete-subfolders = { $count ->
    [1] このフォルダーにはサブフォルダーが1個あります。どうしますか？
   *[other] このフォルダーにはサブフォルダーが{ $count }個あります。どうしますか？
}
files-folder-move-up = 一つ上の階層へ移す
files-folder-delete-all-under = この下のフォルダーをすべて削除
files-folder-delete-files = { $count ->
    [1] このフォルダーにはファイルが1個あります。どうしますか？
   *[other] このフォルダーにはファイルが{ $count }個あります。どうしますか？
}
files-folder-delete-files-under = { $count ->
    [1] このフォルダーとその下のフォルダーにはファイルが1個あります。どうしますか？
   *[other] このフォルダーとその下のフォルダーにはファイルが{ $count }個あります。どうしますか？
}
# 上の問いの後に言う。削除するファイルが文献に属しているところ。
files-folder-delete-files-assigned = { $count ->
    [1] そのうち1個は文献に属していて、その文献からはなくなります。
   *[other] そのうち{ $count }個は文献に属していて、それらの文献からはなくなります。
}
files-folder-files-to-parent = 親フォルダーに移す
files-folder-files-delete = 削除
files-folder-delete-failed = フォルダーを削除できませんでした

## ファイルのペイン。

files-name = 名前
files-references = 文献
files-unassigned = 未割り当て：どの文献にも属していません。
files-assign = 文献に割り当てる…
files-assign-title = 「{ $name }」を文献に割り当てる
files-assign-failed = ファイルを割り当てられませんでした
files-unassign = 「{ $name }」から外す
files-unassign-failed = ファイルを文献から外せませんでした
files-about = ファイルについて
files-size = サイズ
files-pages = ページ
# $text は下の三つのうちの一つ。
files-pdf-pages = { $count }ページ · { $text }
files-pdf-has-text = テキストあり
files-pdf-no-text = テキストなし
# 調べられなかったPDFのページとして示す。理由は読み込みが言ったこと。
files-pdf-unread = 読み込めませんでした：{ $reason }
files-pdf-some-text = うち{ $count }ページはテキストなし
files-added = 追加日
files-origin = 元の場所
files-searchable = 検索可能にする…
files-read-into = テキストをマップとしてインポート…
files-read-text = テキストを読み取る…
files-to-pictures = 画像庫に収める
files-to-pictures-done = 「{ $name }」は画像庫に入りました
files-to-pictures-show = 表示
files-to-pictures-failed = 画像を画像庫に収められませんでした
files-bring-in = 要素として取り込む…
files-rename-failed = ファイルの名前を変更できませんでした

## 外す。

files-remove = 外す
files-remove-title = 「{ $name }」をライブラリから外しますか？
files-remove-message = ファイルはライブラリの保管場所から削除されます。
files-remove-message-assigned = { $count ->
    [1] このファイルは{ $names }に属していて、その文献からはなくなります。ライブラリの保管場所から削除されます。
   *[other] このファイルは{ $count }件の文献（{ $names }）に属していて、それらの文献からはなくなります。ライブラリの保管場所から削除されます。
}
files-remove-many-title = { $count }個のファイルをライブラリから外しますか？
files-remove-many-message = ファイルはライブラリの保管場所から削除されます。
files-remove-many-assigned = { $count ->
    [1] そのうち1個は文献に属していて、その文献からはなくなります。ファイルはライブラリの保管場所から削除されます。
   *[other] そのうち{ $count }個は文献に属していて、それらの文献からはなくなります。ファイルはライブラリの保管場所から削除されます。
}
files-remove-failed = ファイルを外せませんでした
# ファイルを外すとフォルダーが空になるところで、問いの中で言う。前から空だったフォルダーは数えない。
files-remove-folders-left = これにより、{ $count }個のフォルダーが空になります。
files-remove-with-folders = 外して、空のフォルダーも削除
files-remove-keep-folders = 外して、フォルダーは残す
files-removing = { $count }個のファイルを外しています…
files-removed = { $count ->
    [0] 外したファイルはありません
   *[other] { $count }個のファイルを外しました
}
files-removed-folders = 空のフォルダー{ $count }個も削除しました
# 文献を削除するとき：そのファイルもなくなる。ほかの文献がもっていなければ。
files-remove-with-files = ファイルごと削除

## 文献を選ぶ。

files-choose-reference = 文献を選ぶ
files-choose-search = 著者、タイトル、年で検索
files-choose-references = 文献
files-choose-none = その語を含む文献はありません。
files-choose-empty = ライブラリにはまだ文献がありません。
files-choose-more = …ほか{ $count }件：検索して見つけてください
files-choose-files = ライブラリのファイル
files-choose-files-search = 名前、またはファイルが属する作品で検索
files-choose-files-none = それに当たるファイルはありません。
files-choose-add = { $count ->
    [0] ファイルを追加
   *[other] { $count }個のファイルを追加
}
files-added-to = 「{ $title }」に{ $count }個のファイルを追加しました
files-choose-new = 新しい文献…
files-choose = 選択

## 何も選んでいないとき。

files-none-selected = ファイルが選択されていません
files-none-selected-text = ファイルを選ぶと、そのファイルについてわかっていることと、できることが表示されます。
# $name は表示中のフォルダー、または「すべてのファイル」。
files-tally = { $name }：{ $count }個のファイル、うち{ $unassigned }個は文献なし

## 順の確認：ファイルを文献に割り当てる。

files-go-through-head = ファイルを順に確認して文献に割り当てる…
files-go-through-chosen = { $count ->
    [1] 順に確認する…
   *[other] この{ $count }個を順に確認する…
}
files-go-through-nothing = ここのファイルはすべて文献に属しています
files-folder-go-through = 未割り当てのファイルを順に確認…
# 表示中のフォルダーのファイルがどの文献にも属していないあいだ、ファイルの上端に出るバー。
files-unassigned-here = ここにはどの文献にも属さないファイルが{ $count }個あります。
files-unassigned-go = 順に確認する…
files-unassigned-hide = 隠す
files-going-title = ファイルを文献に割り当てる
files-going-subtitle = { $count }個のファイル
files-going-finding = { $count ->
    [1] ファイルが何かを調べています…
   *[other] { $count }個のファイルが何かを調べています…
}
files-going-progress = { $count }個中{ $done }個：{ $name }
files-going-finding-hint = 各ファイルから識別子とタイトルを読み、名前を読み、最初のページをライブラリと照らし合わせます。わかったことは、アプリケーションを開いているあいだ保持されます。
files-going-stop = 中止
files-going-failed = ファイルが何かを調べられませんでした
files-going-all-certain = 確実に見つかったもの（{ $count }個）：
files-going-all-probable = 推定で見つかったもの（{ $count }個）：
files-going-all-new = サービスから得た新しいもの（{ $count }個）：
files-going-all-nothing = 何も見つからなかったもの（{ $count }個）：
files-going-this-new = 新しい文献
files-going-show-all = { $count }個すべて表示
files-going-what = { $name }をどうするか
files-going-this = これ
files-going-other = 別の文献…
files-going-new = 新しい文献…
files-going-later = あとで
files-going-certain = 確実
files-going-probable = 推定
files-going-which = どの作品か
# $origin は書誌情報の出どころ：サービスか、ファイル。
files-going-lookup = 新しい文献 · { $origin }から
files-going-nothing = 見つかりませんでした
files-going-chosen = 選択済み
files-going-made-here = ここで作成
files-going-none = どのファイルも順に確認できませんでした。
# 順の確認が届かなかったファイル（中止したときなど）：文献はないままで、バーがまたそれを示す。
files-going-not-reached = { $count ->
    [1] 1個のファイルは確認していません。そのままにして、次の機会に残します。
   *[other] { $count }個のファイルは確認していません。そのままにして、次の機会に残します。
}
files-going-counts = 割り当て{ $assign }個、あとで{ $later }個
files-going-done = { $count ->
    [0] 割り当てるものはありません
   *[other] { $count }個のファイルを文献に割り当てる
}
files-going-applying = ファイルを文献に割り当てています…
files-going-source = ライブラリのファイル
files-going-assigned = { $count ->
    [0] 割り当てたファイルはありません
   *[other] { $count }個のファイルを割り当てました
}
files-going-made = 新しい文献{ $count }件
files-going-later-count = あとで{ $count }個
files-going-undo = 元に戻す
files-going-undone = { $count ->
    [0] 取り消した割り当てはありません
   *[other] { $count }個のファイルの割り当てを取り消しました
}
files-going-undone-made = 新しい文献{ $count }件を削除しました
# ファイルの上端のメニューで、最後の順の確認を元に戻せるあいだ。
files-undo-last = 元に戻す：{ $count }個のファイルの文献への割り当て

## 書き出し。

files-export-folder-title = 書き出し先のフォルダーを選ぶ
files-export-title = { $count }個のファイルを書き出す
files-export-all-what = 次に選ぶフォルダーに、すべてのファイルを、その文献の名前（著者 年 - タイトル）で、文献のないものは自身の名前で書き出します。ライブラリのフォルダーは、その中のフォルダーになります。
files-export-folder-what = このフォルダーのファイルを、次に選ぶフォルダーに、それぞれの文献の名前で、文献のないものは自身の名前で書き出します。この下のフォルダーは、その中のフォルダーになります。
files-export-files-what = { $count ->
    [1] ファイルを、次に選ぶフォルダーに、その文献の名前で、文献がなければ自身の名前で書き出します。
   *[other] ファイルを、次に選ぶフォルダーに、それぞれの文献の名前で、文献のないものは自身の名前で書き出します。
}
files-export-bib = references.bibを付ける
files-export-bib-hint = ファイルが属する作品の一覧です。それぞれが書き出したファイルの場所を示すので、ZoteroやJabRefはフォルダーをまるごと読み込めます。
files-export-go = フォルダーを選ぶ…
files-exporting = { $count ->
    [1] ファイルを書き出しています…
   *[other] { $count }個のファイルを書き出しています…
}
files-exporting-progress = { $count }個中{ $done }個を書き出しています：{ $name }
files-exported = { $count ->
    [0] 書き出したファイルはありません
   *[other] { $count }個のファイルを書き出しました
}
files-exported-folders = フォルダー{ $count }個
files-exported-bib = references.bib付き
files-exported-stopped = 中止（残り{ $count }個）
files-exported-show = 表示
files-export-failed = ファイルを書き出せませんでした
files-reveal-failed = フォルダーを表示できませんでした
files-export = 書き出す…
files-export-chosen = この{ $count }個を書き出す…
files-export-all = すべてのファイルを書き出す…
