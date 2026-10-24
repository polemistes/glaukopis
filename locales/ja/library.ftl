# ライブラリ：文献、文献を書くフォーム、文献を取り込むもの。フォームの
# フィールドと種別は fields.ftl にある。locales/README.md を見よ。

## 文献のフォーム。

library-form-often-used = よく使うもの
library-form-add-field = フィールドを追加
library-form-citation-key = 引用キー
# 引用キーの空のフィールドに：何も書かないときに付けられるもの。
library-form-key-made = 著者と年から作られます
library-form-date-problem = 日付は1979、1979-05、1979-05-12のように、期間は1979/1985のように書いてください。
library-form-remove-field = { $field }を削除

## 文献の人物。フィールドの名を添えて：「著者：姓」。

library-names-kept-whole = 機関名など、分けずに扱う名前
library-names-prefix-suffix = 接頭辞と接尾辞
library-names-move-up = 上へ移動
library-names-move-down = 下へ移動
library-names-more = この名前のその他の操作
library-names-name = 名前
library-names-name-of = { $role }：名前
library-names-family = 姓
library-names-family-of = { $role }：姓
library-names-given = 名
library-names-given-of = { $role }：名
library-names-prefix = 接頭辞：van、de la
library-names-prefix-of = { $role }：接頭辞
library-names-suffix = 接尾辞：Jr.、III
library-names-suffix-of = { $role }：接尾辞
# 人名のフィールドの下のボタン。フィールドのラベルを小文字にしたものではなく、
# それ自身の言葉（名詞を大文字で書く言語ではそれでは誤りになる）。
library-names-add = 名前を追加
library-names-add-of = { $role }：名前を追加

## 文献について、どこに表示されても使う言葉。

library-untitled = 無題
library-no-author = 著者なし
library-no-title = タイトルなし
library-in-library = ライブラリにあり

## 文献が別の文献と同じとみなされる理由：「同じDOI、同じファイル」。

library-reason-doi = 同じDOI
library-reason-isbn = 同じISBN
library-reason-identical = 作品を見分ける点がすべて一致
# タイトル、著者、年がどこまで一致するか：同じ（same）、似ている（like：
# 数文字やサブタイトルだけ違うタイトル、共通の著者、1年違いの年）、または
# なし（none：一方にしかない）。
library-reason-alike = { $title ->
    [same] { $author ->
        [same] { $year ->
            [same] タイトル・著者・年が同じ
            [like] タイトルと著者が同じで、年が1年違う
           *[none] タイトルと著者が同じで、年は一方にしかない
        }
        [like] { $year ->
            [same] タイトルと年が同じで、共通の著者がいる
            [like] タイトルが同じで、共通の著者がいて、年が1年違う
           *[none] タイトルが同じで、共通の著者がいて、年は一方にしかない
        }
       *[none] { $year ->
            [same] タイトルと年が同じで、著者は一方にしかない
            [like] タイトルが同じで、年が1年違い、著者は一方にしかない
           *[none] タイトルが同じで、著者と年は一方にしかない
        }
    }
   *[like] { $author ->
        [same] { $year ->
            [same] 著者と年が同じで、タイトルが似ている
            [like] 著者が同じで、タイトルが似ていて、年が1年違う
           *[none] 著者が同じで、タイトルが似ていて、年は一方にしかない
        }
        [like] { $year ->
            [same] 年が同じで、タイトルが似ていて、共通の著者がいる
            [like] タイトルが似ていて、共通の著者がいて、年が1年違う
           *[none] タイトルが似ていて、共通の著者がいて、年は一方にしかない
        }
       *[none] { $year ->
            [same] 年が同じで、タイトルが似ていて、著者は一方にしかない
            [like] タイトルが似ていて、年が1年違い、著者は一方にしかない
           *[none] タイトルが似ていて、著者と年は一方にしかない
        }
    }
}
library-reason-file = 同じファイル
library-reason-name = 名前が似ている
library-reason-first-page = 1ページ目が一致
library-reason-folder = 似た名前のフォルダーにある
# 理由がいくつかあるとき：最後より前のもの（コンマで区切られる）と、最後のもの。
library-reasons = { $others }、{ $last }

## ファイルのサイズ。

library-size-bytes = { $size } B
library-size-kilobytes = { $size } kB
library-size-megabytes = { $size } MB

## 文献を書いているあいだに、すでにライブラリにあるかもしれないもの。

library-duplicate-certain = これはすでにライブラリにあります。
library-duplicate-probable = これはすでにライブラリにあるかもしれません。
library-duplicate-use = これを使う

## ライブラリの中の重複。

library-duplicates-title = 重複
library-duplicates-count = { $count ->
   *[other] { $count }件の文献がライブラリに重複しているようです
}
library-duplicates-none = 重複はありません
    .text = ライブラリに重複している文献はないようです。
library-duplicates-no-more = 重複はもうありません
    .text = 統合した文献を引用していたところは、残した文献を引用するようになりました。
library-duplicates-how = 文献を一つにまとめると、残す文献は、欠けている情報をほかの文献から受け取り、食い違うところでは自分の内容を保ちます。ファイルとコレクションは一つにまとめられ、それらを引用していたところは残した文献を引用するようになります。
library-duplicates-same = 同じ
library-duplicates-probably-same = おそらく同じ
library-duplicates-keep-which = 残す文献
library-duplicates-kept = 残す
library-duplicates-different = 別の文献です
library-duplicates-merge = 一つにまとめる
library-duplicates-merging = 一つにまとめています…
library-duplicates-failed = ライブラリの重複を検索できませんでした
library-duplicates-merge-failed = 一つにまとめることができませんでした

## 文献のインポート：ファイルにあるものを、ライブラリにあるものと比べる。

library-import = インポート
library-import-title = 文献をインポート
# 何を、どこからインポートするか：ファイル、Zotero。
library-import-subtitle = { $count ->
   *[other] { $source }の文献{ $count }件
}
library-import-review = { $count ->
   *[other] { $count }件の文献はすでにライブラリにあるかもしれません
}
library-import-new = { $count ->
   *[other] 新しい文献{ $count }件
}
library-import-complete = { $count ->
   *[other] ライブラリにある{ $count }件の文献に情報が加わります
}
library-import-known = { $count ->
   *[other] すでにライブラリにある文献{ $count }件
}
library-import-repeated = { $count ->
   *[other] インポートの中で重複している文献{ $count }件
}
# ライブラリの文献に加わるフィールド：「加わるもの：出版社、出版地」。
library-import-would-gain = 加わるもの：{ $fields }
library-import-gains-file = ファイル
library-import-gains-zotero = Zoteroでのキー
library-import-what-to-do = どうするか
library-import-merge = 同じ作品：手元の文献を補う
library-import-skip = 同じ作品：手元の文献はそのままにする
library-import-add = 別の作品：追加する
# 同じ場合にあるすべての候補への一つの答え：「同じである16件すべて：…」。
library-import-all-certain = 同じである{ $count }件すべて：
library-import-all-probable = おそらく同じである{ $count }件すべて：
library-import-all-merge = 手元の文献を補う
library-import-all-skip = 手元の文献はそのままにする
library-import-all-add = それでもすべて追加する
library-import-more = …ほか{ $count }件。
library-import-unread = { $count ->
   *[other] ファイルの{ $count }か所を読み取れませんでした
}
library-import-importing = インポートしています…
# 追加するもの、補うもの、除外するものの数：「追加3件、補完1件、除外2件」。
library-import-counts = 追加{ $add }件{ $merge ->
        [0] {""}
       *[other] 、補完{ $merge }件
    }{ $skip ->
        [0] {""}
       *[other] 、除外{ $skip }件
    }
library-import-failed = インポートに失敗しました。

## ライブラリ：文献の一覧と、文献についてできること。

library-references = 文献
library-unread = ライブラリを読み取れませんでした
library-all-references = すべての文献
library-count = { $count ->
   *[other] { $count }件の文献
}
library-selected = { $count ->
   *[other] { $count }件の文献を選択中
}
library-selected-of = { $count ->
   *[other] { $count }件中{ $selected }件の文献を選択中
}
library-new-reference = 新しい文献
library-search = ライブラリを検索
library-search-in = { $name }を検索
library-search-clear = 検索をクリア
library-sort = 並べ替え
library-sort-author = 著者
library-sort-year = 年
library-sort-title = タイトル
library-sort-added = 追加日
library-sort-modified = 変更日
library-sort-descending = 降順

## 検索の隣の絞り込み：出版物の種類、出版社、出版年。

library-filters = 絞り込み
library-filters-on = { $count ->
   *[other] 絞り込み（{ $count }）
}
library-filter-kind = 種類
library-filter-publisher = 出版社
library-filter-publisher-hint = 名前の一部
library-filter-any-publisher = すべての出版社
library-filter-year = 年
library-filter-from = 開始
library-filter-to = 終了
library-filter-clear = 絞り込みを解除
library-filter-nothing-here = ここには絞り込むものがありません。
# 絞り込みの条件に合うものが一つもないとき。
library-nothing-passes = 表示中の文献に、絞り込みの条件に合うものはありません。
library-import-export = インポートと書き出し
library-paste = 文献を貼り付け…
library-add-pdfs = PDFファイルを追加…
library-import-zotero = Zoteroからインポート…
library-find-duplicates = 重複を探す…
library-map-library = ライブラリのマップ…
library-map-collection = 「{ $name }」のマップ…
library-export-library = ライブラリを書き出す…
library-export-collection = 「{ $name }」を書き出す…
library-export-one = 書き出す…
library-export-many = { $count ->
   *[other] { $count }件の文献を書き出す…
}
library-export-title = 文献を書き出す
# 書き出した文献のファイルの、名前を付ける前の名前。
library-export-file-references = 文献
library-export-file-library = ライブラリ
library-exported = { $count ->
   *[other] { $count }件の文献を書き出しました
}
library-export-failed = 書き出しに失敗しました
library-empty = ライブラリは空です
    .text = ここに追加した文献は、すべてのプロジェクトで使えます。まず一件追加するか、手元にある文献を取り込んでください。
library-collection-empty = このコレクションにはまだ何もありません
    .text = ライブラリから文献をここへドラッグするか、新しい文献を追加してください。
library-nothing-found = 見つかりませんでした
    .text = これらの語をすべて含む文献はありません。
library-open-file = ファイルを開く
library-file-open-failed = ファイルを開けませんでした
library-add-to-collection = コレクションに追加
library-remove-from = 「{ $name }」から外す
library-copy-key = 引用キーをコピー
library-copied-key = 「{ $key }」をコピーしました
library-copy-biblatex = BibLaTeXとしてコピー
library-copied = コピーしました
library-copy-failed = 何もコピーされませんでした
library-delete-one-title = 「{ $name }」を削除しますか？
library-delete-many-title = { $count ->
   *[other] { $count }件の文献を削除しますか？
}
# $projects は、削除するものを引用しているプロジェクトの数。それらのプロジェクトは自分のコピーを保つ。
library-delete-one-message = この文献をライブラリとすべてのコレクションから削除します。{ $projects ->
        [0] {""}
       *[other] この文献は{ $projects }件のプロジェクトで引用されていて、各プロジェクトにはそのコピーが残ります。
    }
library-delete-many-message = これらをライブラリとすべてのコレクションから削除します。{ $projects ->
        [0] {""}
       *[other] これらの一部を引用している{ $projects }件のプロジェクトには、それらのコピーが残ります。
    }
# 上のメッセージの後に、削除するものにファイルがあるときに表示される。
library-delete-files = { $files ->
       *[other] 削除するものには{ $files }個のファイルが属しています。ファイルもあわせて削除しないかぎり、ライブラリのファイルの中に残ります。
    }ほかの文献にも属するファイルは、いずれにしても残ります。
library-delete-keep-files = 削除してファイルは残す
library-delete-failed = 文献を削除できませんでした
library-not-done = 実行できませんでした

## コレクション。

library-collections = コレクション
# 作品のペインに表示される、その作品を引用しているプロジェクト。
library-cited-in = 引用しているプロジェクト
library-not-cited = どのプロジェクトでも引用されていません。
library-cited-reading = プロジェクトを読み取っています…
library-collections-hint = コレクションは、主題や仕事ごとに文献を集めます。一つの文献をいくつのコレクションに入れてもかまいません。
library-collection-new = 新しいコレクション
library-collection-new-inside = 中に新しいコレクション
library-collection-new-under = 「{ $name }」の中に新しいコレクション
library-collection-move-to = 移動先
library-collection-name = コレクションの名前
library-collection-name-failed = コレクションに名前を付けられませんでした
library-collection-expand = 展開する
library-collection-collapse = 折りたたむ
library-collection-to-top = 最上位へ移動
library-collection-move-failed = コレクションを移動できませんでした
library-collection-added = { $count ->
   *[other] 「{ $name }」に{ $count }件の文献を追加しました
}
library-collection-already = すでに「{ $name }」にあります
library-collection-delete = コレクションを削除
library-collection-delete-title = コレクション「{ $name }」を削除しますか？
# この数は、削除するコレクションの中にあるコレクションの数。
library-collection-delete-message = { $inside ->
    [0] 文献はライブラリに残ります。
   *[other] 中にあるコレクションも削除されます。文献はライブラリに残ります。
}
library-collection-delete-failed = コレクションを削除できませんでした
library-collection-count = { $count ->
   *[other] { $count }個のコレクション
}

## ライブラリまたはコレクションのマップ：プロジェクトの最上位の要素のツリー。プロジェクトは新しく作るか、選ぶ。

library-map-title-library = ライブラリのマップ
library-map-title-collection = コレクションのマップ
# ライブラリ全体から作ったプロジェクトに付く名前。
library-map-library-name = ライブラリ
library-map-name = 名前
library-map-name-hint = マップの最上位の要素の名前です。そのために新しいプロジェクトを作るときは、その名前にもなります。
library-map-into = 入れる先のプロジェクト
library-map-new-project = 新しいプロジェクト（同じ名前で）
library-map-what-library = コレクションは入れ子のまま要素になり、各文献はそのコレクションの下の要素になります。要素のテキストはその文献の引用です。どのコレクションにも入っていない文献は最上位に置かれます。
library-map-what-collection = その中のコレクションは入れ子のまま要素になり、各文献はそのコレクションの下の要素になります。要素のテキストはその文献の引用です。
library-map-nothing = マップに載せる文献がありません。
library-map-make = マップを作る
library-map-making = マップを作っています…
library-map-failed = マップを作れませんでした。

## アプリケーションのどこからでも文献を取り込む。

library-files = { $count ->
   *[other] { $count }個のファイル
}
library-open-failed = 文献を開けませんでした
library-known = { $count ->
   *[other] すでにライブラリにあります
}
library-nothing-to-import = インポートするものがありません
library-none-found = 文献は見つかりませんでした。
library-import-kinds = 文献は.bibファイルから読み取り、PDFファイルからは作成します。
library-filter-bib = BibLaTeXとBibTeX
library-filter-all = すべてのファイル
library-files-read-failed = { $count ->
   *[other] ファイルを読み取れませんでした
}
library-text-read-failed = テキストを読み取れませんでした
library-add-pdfs-title = PDFファイルを追加
library-pdfs-working = { $count ->
   *[other] { $count }個のファイルが何かを調べています…
}
# PDFファイルを一つずつ調べているあいだ。
library-pdfs-progress = { $done }/{ $count }：{ $name }
library-stop = 中止
# インポートの結果の一覧：「3件の文献を追加、1件を補完、2個のファイルを保存」。
library-imported-added = { $count ->
   *[other] { $count }件の文献を追加
}
library-imported-completed = { $count }件を補完
library-imported-skipped = { $count }件はすでにライブラリにあり
library-imported-files = { $count ->
   *[other] { $count }個のファイルを保存
}
library-imported-nothing = 何も変更されませんでした
library-paste-title = 文献を貼り付け
library-paste-subtitle = BibLaTeXまたはBibTeX。項目はいくつでもかまいません
library-paste-continue = 続ける
library-source-label = BibLaTeXのソース

## Zoteroからのインポート。

library-zotero-title = Zoteroからインポート
# このファイルはZoteroのデータベース zotero.sqlite で、コードとして表示される。
library-zotero-not-found = このコンピューターの、Zoteroが通常データを置く場所にZoteroは見つかりませんでした。別の場所に置いている場合は、その場所を指定してください：{ $file }のあるフォルダーです。
library-zotero-lead = インポートするものは、ファイルとともにライブラリにコピーされます。Zoteroは読み取るだけで、何も変更しません。そのあいだZoteroを起動していてもかまいません。
library-zotero-choose = Zoteroのデータフォルダー
library-zotero-none-there = そこにZoteroはありません。
library-zotero-unread = Zoteroを読み取れませんでした。
# Zoteroが通常データを置く場所を調べられなかった。理由はその下に表示される。
library-zotero-find-failed = Zoteroが通常データを置く場所を調べられませんでした。データの場所がわかっていれば、指定してください。
library-zotero-collections-unread = コレクションを読み取れなかったため、すべてをインポートします：{ $reason }
library-zotero-library = ライブラリ
# Zoteroのライブラリと、その文献の数。
library-zotero-library-option = { $name }（{ $count }）
library-zotero-my-library = マイライブラリ
library-zotero-what = インポートするもの
library-zotero-everything = すべて
library-zotero-with-files = 添付ファイルも含める
library-zotero-with-notes = メモも含める（注解として）
library-zotero-elsewhere = 別の場所…
library-zotero-show-where = 場所を指定…
library-zotero-reading = 読み取っています…
library-zotero-read = { $count ->
    [0] 読み取る
   *[other] { $count }件の文献を読み取る
}

## 文献を書く。

library-dialog-edit = 文献を編集
library-dialog-add = 文献を追加
library-dialog-back = フォームに戻る
library-dialog-open-failed = 文献を開けませんでした。
library-dialog-save-failed = 文献を保存できませんでした。
# BibLaTeXでの項目。フォームに対して。
library-source = ソース
library-source-unread = ソースを読み取れませんでした。

## 一覧の横の、一件の文献。

library-pane-label = 文献
library-pane-more = その他
library-pane-saved = 保存済み
library-pane-editing = 編集中…
library-pane-not-saved = 未保存
library-pane-unread = 文献を読み取れませんでした。
library-pane-save-failed = 変更を保存できませんでした。
library-pane-note-placeholder = この作品について考えたこと。自分用で、引用されるものには含まれません。
library-pane-files = ファイル
library-pane-attach = 添付
library-pane-attach-title = ファイルを添付
library-pane-attach-failed = ファイルを添付できませんでした
library-pane-attach-many-title = 「{ $title }」に{ $count }個のファイルを添付しますか？
library-pane-attach-many-message = それぞれがこの文献のファイルになります。多くのファイルをそれぞれ別の文献に割り当てるには、ライブラリのファイルの中で順に確認してください。
library-pane-attach-many = { $count }個のファイルを添付
library-pane-add-files = ライブラリのファイルを追加…
library-pane-add-files-title = 「{ $title }」にライブラリのファイルを追加
library-pane-unassign-all = この文献から{ $count }個すべてを外す
library-pane-unassign-all-title = 「{ $title }」から{ $count }個のファイルをすべて外しますか？
library-pane-unassign-all-message = ファイルはライブラリのファイルの中に残り、そこで探して、ほかの文献に割り当てることができます。削除はそこでしかできません。
library-pane-unassign-all-confirm = { $count }個のファイルを外す
# 添付されているのに、あるべき場所にないファイルについて。
library-pane-missing = 見つかりません
library-pane-reveal = ファイルマネージャーで表示
library-pane-reveal-failed = フォルダーを開けませんでした
library-pane-no-files = ファイルはありません。PDFを添付するか、ここにドロップしてください。
library-pane-detach-failed = ファイルを外せませんでした
library-pane-unassign = この文献から外す
library-pane-unassign-title = 「{ $name }」をこの文献から外しますか？
library-pane-unassign-message = ファイルはライブラリのファイルの中に残り、そこで探して、別の文献に割り当てることができます。削除はそこでしかできません。
library-pane-leave-collection = 「{ $name }」から外す
library-pane-duplicate = 複製
library-pane-edit-source = ソースを編集…
library-pane-source-subtitle = BibLaTeXでの項目です。ほとんどのことはフォームのほうが簡単です。
library-pane-source-failed = ソースを表示できませんでした
library-pane-added = { $date }に追加
library-pane-added-changed = { $added }に追加 · { $changed }に変更

## 文献の照会。

library-lookup-placeholder = 照会：DOI、ISBN、またはタイトルと著者の語
library-lookup-label = 文献を照会
library-lookup-failed = 何も照会できませんでした。
# 文献がどこから来たか：Crossref などのサービス。
library-lookup-filled = { $source }から入力しました。
library-lookup-filled-empty = そのあいだにほかのフィールドに書き込まれていたため、{ $source }からは、まだ空だったフィールドだけを入力しました。
library-lookup-fill-all = 得られたものをすべて入力
library-lookup-others = { $count ->
   *[other] ほかのレコード{ $count }件
}
library-lookup-scope = 探すもの
library-lookup-any = すべて
library-lookup-books = 書籍
library-lookup-articles = 論文
library-lookup-none = 何も見つかりませんでした。語を減らすと多く見つかることがあります：著者の姓と、タイトルの一、二語。
# 求めたもの：DOI、ISBN、arXivやPubMedの番号。
library-lookup-unknown = 照会先には、この{ $kind ->
        [doi] DOI
        [isbn] ISBN
        [arxiv] arXiv番号
       *[pmid] PubMed番号
    }についての情報がありませんでした。下で文献を手で入力できます。

## 書き手が作品について書くもの。

library-notes = メモ
library-notes-yours = 自分のメモ
library-notes-on-work = この作品についての自分のメモ
library-notes-read = 自分のメモを読む
library-notes-write = メモを書く
library-notes-write-on-work = この作品についてメモを書く
library-notes-not-in-library = ライブラリにない文献
library-notes-this-project = このプロジェクト内
library-notes-all-projects = すべてのプロジェクト
library-notes-project-placeholder = この作品について、このプロジェクトのために考えたこと
library-notes-all-placeholder = この作品について考えたこと。どこで引用しても表示されます
library-notes-keep-for-all = すべてのプロジェクトで使う
library-notes-write-for-all = すべてのプロジェクト向けに書く
library-notes-carried = この文献はプロジェクトとともに来たもので、ライブラリにはありません。ここに書いたことは、このプロジェクトを持つ全員に届きます。
library-notes-kept = ライブラリの文献とともに保存されます。この作品を引用するプロジェクトにも付いていきます。
library-notes-unread = 自分のメモを読み取れませんでした
library-notes-unsaved = メモを保存できませんでした

## ライブラリの上端の切り替え。

library-switch = 文献／ファイルの切り替え
library-switch-references = 文献
library-switch-files = ファイル

## ライブラリの列。ドラッグして広くも狭くもできる。

library-resize-side = ドラッグしてコレクションやフォルダーの欄の幅を変える
library-resize-detail = ドラッグして右のペインの幅を変える

## 言葉を減らす、第2段階（エージェント「chrome」）

# 文献のファイルをインポートする：.bib、BibLaTeXまたはBibTeX。
library-import-bibtex = Bib(La)TeXをインポート…
