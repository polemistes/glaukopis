# 検索：マップのテキストの中、要素の編集欄の中、そしてすべてを通して。
# locales/README.md と docs/adr/0017 を見よ。

## テキストの上のバー

search-find = 検索
search-replace-with = 置換後の文字列
search-replace = 置換
search-replace-all = すべて置換
search-previous = 前へ
search-next = 次へ
search-close = 検索を閉じる
search-show-replace = 置換も行う
search-hide-replace = 検索のみ
# 見つかったもののうち、どれを表示しているか：「3/17」。
search-count = { $current }/{ $count }
search-found = { $count }件
search-nothing = 見つかりません
search-invalid = 正規表現ではありません
search-replaced = { $count ->
    [0] 置換したものはありません
   *[other] { $count }件を置換しました
}

## オプション

search-case = 大文字と小文字を区別
search-whole-words = 単語単位
search-accents = アクセント記号の有無を区別しない
search-accents-sign = é=e
# オプションのヒント：正規表現では、\n と \p がテキストの二つの区切りを表す。
search-regex = 正規表現：\nは段落内改行、\pは段落の区切り
search-selection = 選択したテキストのみ
search-selection-none = その中だけを検索するには、先にテキストを選択してください
search-labels = 引用、数式、相互参照も
search-labels-outside = テキストの外にあるものも

## すべてを通した検索

search-everything = 検索
search-everything-title = すべてを検索
search-everything-field = プロジェクトを検索
search-last-project = 最後に開いたプロジェクト
search-all-projects = すべてのプロジェクト
search-reading = { $name }を読み込んでいます…
search-no-projects = 検索するプロジェクトがありません。
search-more = ほか{ $count }件
search-in-project = このプロジェクトに{ $count }件
search-everything-found = { $projects }件のプロジェクトで{ $count }件見つかりました
search-where-details = 文書の詳細
# 名前のある関連付けと、その両端の要素：「第1部 ↔ 第2部」。
search-where-association = 関連付け：{ $ends }
search-where-note = { $work }についてのメモ
# メモの中で見つかったものの前に表示する。
search-in-note = メモ
search-untitled = 無題
search-could-not-read = { $name }を読み込めませんでした。
search-read-in-part = { $name }は一部しか読み込めませんでした。読み込めなかった変更{ $count }件を除いて検索します。
