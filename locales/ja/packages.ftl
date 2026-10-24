# インポートするスペルチェックとOCRの言語（ADR 0032）。スペルチェックと
# Tesseractの設定の中。locales/README.md を見よ。

packages-looking = 確認しています…
packages-import-spelling = スペルチェックの辞書をインポート
packages-import-ocr = OCRの言語ファイルをインポート
# $name は言語の名前。
packages-remove = { $name }を削除
packages-import = インポート
packages-importing = インポートしています…
packages-update = 更新
packages-have = インポート済み
# $size はメガバイト数。書式は済んでいる。
packages-size = { $size } MB
packages-none-offered = サーバーはこの種類の言語を提供していません。
# $server はサーバーのアドレス、またはフォルダー。
packages-server = { $server }から
packages-server-label = 言語をインポートするサーバー：アドレスまたはフォルダー
packages-server-change = 変更
# $count は言語の数。$names はその名前をつないだもの。
packages-imported = { $count ->
   *[other] { $names }をインポートしました。
}
packages-list-failed = インポートした言語を一覧にできませんでした
packages-look-failed = { $server }が提供するものを取得できませんでした
packages-import-failed = { $name }をインポートできませんでした
packages-remove-failed = { $name }を削除できませんでした
