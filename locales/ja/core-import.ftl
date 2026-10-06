# What the core says of references brought in from elsewhere, in English.
# See locales/README.md.

## Where the references came from, as the list of them says: "3 references in pasted text".

core-import-pasted = 貼り付けたテキスト
core-import-files = { $count }個のファイル

## Files of BibTeX and BibLaTeX.

core-import-file-not-found = ファイル「{ $name }」が見つかりませんでした。
core-import-empty-entry = { $line }行目：項目「{ $key }」は空なので除きました。
# Where in a file a reference that has no key was found.
core-import-origin-line = { $line }行目
core-import-origin-key-line = { $key }、{ $line }行目

## What went wrong as the references were taken in, each after the reference
## it concerns: Nagy 1979 “The Best of the Achaeans”.

core-import-title = 「{ $title }」
core-import-merge-gone = { $reference }：統合先の項目がもうありません

## PDF files.

core-import-not-a-pdf = { $name }はPDFではありません。
# The service is a name: Crossref, DataCite.
core-import-details-from = 書誌情報は{ $service }から得ました。
core-import-number-unknown = ファイルに番号が見つかりましたが、データベースには何の情報もありません。書誌情報はファイル自体から得たものなので、確認してください。
core-import-databases-failed = データベースに問い合わせできませんでした（{ $error }）。書誌情報はファイル自体から得たものなので、確認してください。

## Zotero.

core-import-zotero-my-library = マイライブラリ
core-import-zotero-group = グループ{ $id }
core-import-zotero-the-library = Zoteroのライブラリ{ $id }
core-import-zotero-own-library = Zoteroのユーザー自身のライブラリ
core-import-zotero-the-collection = Zoteroのコレクション{ $key }
core-import-zotero-unknown-base = ファイル「{ $name }」が見つかりませんでした。ZoteroはZotero自身が決めたフォルダーからこのファイルにリンクしていますが、そのフォルダーはここではわかりません。
core-import-zotero-empty-item = Zoteroのアイテム{ $key }は空なので除きました。
core-import-zotero-alone = { $count ->
   *[other] Zoteroで、どの文献にも属さないファイルやメモが{ $count }件あったため、除きました。
}
# The role is Zotero's own name for it: "recipient", "reviewed author".
core-import-zotero-not-a-field = Zoteroは{ $name }を{ $role }としていますが、BibLaTeXにはそれに当たるフィールドがありません。この名前は除きました。
core-import-zotero-left-out = Zoteroのフィールド「{ $field }」にはBibLaTeXで対応するものがないため、除きました：{ $value }

## Zotero's database.

core-import-zotero-no-database = { $path }内のZoteroデータベース（{ $file }）
core-import-zotero-copying = { $path }を一時フォルダーにコピー
core-import-zotero-empty = ファイルが空です
core-import-zotero-disturbed = 読み込みの最中に、Zoteroがデータベースに書き込んでいました。足りないものがあれば、Zoteroを閉じてもう一度インポートしてください。
core-import-zotero-backup-read = Zoteroのデータベースを読み込めませんでした（{ $error }）。代わりにバックアップ{ $backup }を読み込みました。バックアップの作成後にZoteroで変更した内容は含まれていません。
core-import-zotero-not-a-database = { $path }はZoteroのデータベースではありません。
core-import-zotero-unreadable = このZoteroデータベースは、ここでは読み込めない形式です：{ $what }。古いバージョンのZoteroで書かれたものなら、最新のZoteroで一度開くと更新されます。
core-import-zotero-unreadable-version = このZoteroデータベースは、ここでは読み込めない形式です（Zoteroデータベースのバージョン{ $version }）：{ $what }。古いバージョンのZoteroで書かれたものなら、最新のZoteroで一度開くと更新されます。
core-import-zotero-no-table = テーブル「{ $table }」がありません
core-import-zotero-no-column = テーブル「{ $table }」に列「{ $column }」がありません
# What is lacking where a table is not there: one of the six below.
core-import-zotero-no-optional = Zoteroデータベースに、ここで知られている形式のテーブル「{ $table }」がありません。そのため、{ $consequence }。
core-import-zotero-no-bin = Zoteroのごみ箱にあるアイテムを他と区別できません
core-import-zotero-no-collections = コレクションは読み込んでいません
core-import-zotero-no-attachments = 添付ファイルは読み込んでいません
core-import-zotero-no-notes = メモは読み込んでいません
core-import-zotero-no-keywords = キーワードは読み込んでいません
core-import-zotero-no-group-names = グループライブラリの名前はわかりません

## PDF files, as they are read for a reference.

core-import-pdf-empty = ファイル「{ $name }」は空です。
core-import-pdf-not-a-pdf = ファイル「{ $name }」はPDFではありません。
core-import-pdf-unreadable = ファイルを読み込めませんでした。壊れているか、パスワードで保護されているか、大きすぎます。
core-import-pdf-scan = このファイルにはテキスト層がありません。スキャンした画像です。
core-import-pdf-from-file = 書誌情報は目録からではなくファイル自体から得たものなので、確認してください。
core-import-pdf-from-metadata = ファイルにDOIもISBNも見つかりませんでした。書誌情報はファイル自体のメタデータから得たものなので、確認してください。
core-import-pdf-unknown = ファイルにDOIもISBNも見つからず、メタデータからも何のファイルかわかりません。書誌情報を記入してください。

## Tables, from files of text and of sheets.

core-import-table-too-large = ファイルの大きさは{ $size } MBです。表を読み込めるのは{ $most } MBまでのファイルです。
core-import-table-kinds = 表は、CSVなど値をコンマ・セミコロン・タブで区切ったテキストと、LibreOffice（.ods）およびExcel（.xlsx、.xls）のシートから読み込めます。
core-import-table-empty = ファイルには何もありません。
# The rows are a number, or where the counting was given up, the message below.
core-import-table-rows = この表は{ $rows }行あります。テキスト中の表は{ $most }行までです。表計算シートではありません。
core-import-table-columns = この表は{ $columns }列あります。テキスト中の表は{ $most }列までです。表計算シートではありません。
core-import-table-more-than = { $count }超

## Documents brought in, to become maps.

core-import-document-stopped = 読み込みを中止しました。
core-import-pdfs-stopped = ファイルの判別を中止しました。何も追加していません。
core-import-document-kind = 「{ $file }」は文書として取り込める種類のファイルではありません。取り込めるのはWord（DOCX）、OpenDocument（ODT）、Markdown、HTML、LaTeX、RTF、EPUB、Org、reStructuredText、Typst、プレーンテキストです。
core-import-document-too-large = 「{ $file }」は50 MBを超えていて、文書として取り込める大きさを超えています。
# The kind is the kind of file: Word (DOCX), plain text.
core-import-document-unreadable = 「{ $file }」を{ $kind }として読み込めませんでした。壊れているか、名前とは別の種類のファイルかもしれません。読み込みを担うPandocの報告：{ $message }
core-import-document-pandoc-unreadable = Pandocが「{ $file }」から作ったものを読み込めませんでした：{ $error }
# The title of a map made of a document that has none, nor a name of its file.
core-import-document-untitled = 無題
core-import-document-plain-text = プレーンテキスト
core-import-document-notebook = Jupyterノートブック

## What the one who brings a document in should know of it.

core-import-document-found = { $count ->
   *[other] { $made ->
        [all] ライブラリの文献にまだ結びついていない引用が{ $count }件見つかりました。すべて文献管理ソフトで作られたものです。書かれたとおりのテキストのまま置かれ、マップを作るときにも後からでも順に確認できます。
        [some] ライブラリの文献にまだ結びついていない引用が{ $count }件見つかりました。そのうち{ $some }件は文献管理ソフトで作られたものです。書かれたとおりのテキストのまま置かれ、マップを作るときにも後からでも順に確認できます。
       *[none] ライブラリの文献にまだ結びついていない引用が{ $count }件見つかりました。書かれたとおりのテキストのまま置かれ、マップを作るときにも後からでも順に確認できます。
    }
}
core-import-document-endnote = { $count ->
   *[other] EndNoteで作られた引用{ $count }件は、表示されているとおりのテキストとして取り込まれ、見つかった引用には含まれません。EndNoteが作品について記録した内容を読み取れなかったためです。
}
core-import-document-bookmarks = { $count ->
   *[other] この文書は引用{ $count }件をブックマークに保存しており、引用先を読み取れませんでした。そのままのテキストになります。Zoteroの文書設定を変えると、別の方法で保存されます。
}
core-import-document-bibliography = この文書には「{ $heading }」の下に引用文献の一覧があります。他の部分と同じくテキストとして取り込まれます。マップは、引用されたものから独自の参考文献を作ります。
core-import-document-bibliography-made = この文書には、文献管理ソフトで作られた引用文献の一覧があります。他の部分と同じくテキストとして取り込まれます。マップは、引用されたものから独自の参考文献を作ります。
core-import-document-tracked = この文書には変更履歴があります。テキストはすべての変更を承諾した状態で取り込まれます。
core-import-document-comments = この文書には余白のコメントがありますが、除きます。
core-import-document-heading-notes = { $count ->
   *[other] 見出しに付いた注{ $count }件は、その下のテキストの冒頭に置かれます。見出しには注を付けられません。
}
# What a caption began with is shown as the document has it: “Figure 1:”.
core-import-document-labels = { $count ->
   *[other] キャプション{ $count }件が「{ $first }」のような語と番号で始まっていました。これは除きます。マップは図と表に自分で番号を振ります。テキストが図や表を番号で挙げている箇所は書かれたとおりのテキストで、マップの番号には従いません。
}
core-import-document-label-example = 図1：
core-import-document-caption-notes = { $count ->
   *[other] 図や表の説明の中にある注{ $count }件は、その場に括弧書きで置かれます。
}
core-import-document-headings = { $count ->
   *[other] 引用文・リスト・表の中にある見出し{ $count }件は、太字の段落として取り込まれます。
}
core-import-document-code = { $count ->
   *[other] コードのブロック{ $count }件は、一行を一段落とする普通の段落として取り込まれます。
}
core-import-document-definitions = { $count ->
   *[other] 用語とその意味の一覧{ $count }件は、用語を太字にした段落として取り込まれます。
}
core-import-document-rules = { $count ->
   *[other] ページを横切る線{ $count }本は除きます。
}
core-import-document-raw = { $count ->
   *[other] 特定の種類の文書だけに向けてHTMLやTeXで書かれた部分{ $count }件は除きます。
}
core-import-document-pictures-wanting = { $count ->
   *[other] ファイルにある画像{ $count }点が読み込んだテキストに含まれていないため、除きます。ページのヘッダーやフッター、または描画の中にあるのかもしれません。
}

## A picture of a document that is left out, and why.

core-import-document-picture-left-out = 画像「{ $name }」は除きます：{ $why }。
core-import-document-picture-kind = 読み込まない種類の画像です（{ $kind }）
core-import-document-picture-not-read = 読み込める種類の画像ではありません
core-import-document-picture-unreadable = 読み込めませんでした
core-import-document-picture-network = ネットワーク上にあり、そこからは何も取得しません
core-import-document-picture-not-taken-out = ファイルから取り出せませんでした
core-import-document-picture-outside = ファイル内ではなくこのコンピューターの別の場所にあり、そこからは取り込みません
core-import-document-picture-not-found = 文書が示す場所にファイルが見つかりませんでした
core-import-document-picture-too-large = 50 MBを超えています
core-import-document-picture-file-unreadable = ファイルを読み込めませんでした
