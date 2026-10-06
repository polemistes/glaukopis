# What the core says to the one who uses the application, in English.
# See locales/README.md.

## Errors, as they are shown after what was being done.

error-parse = { $path }を読み取れませんでした：{ $message }
error-not-found = 見つかりません：{ $what }
error-network = ネットワーク：{ $message }

## The programs the application works with: Pandoc, Typst, Tesseract.

program-missing = { $program }がインストールされていないか、見つかりません
# A program that is there, but older than what Glaukopis needs.
program-too-old = インストールされているのは{ $program } { $version }です。Glaukopisには{ $program } { $least }以降が必要です。
program-failed = { $program }が失敗しました：{ $message }
# What a program that failed without a word is said to have done: the status is "exit status: 1".
program-ended = { $status }で終了しました
program-stopped = { $program }を停止しました。

## What was being done when the system said no, shown before what it said:
## "reading /home/…/library.bib: Permission denied".

io-reading = { $path }の読み込み
io-writing = { $path }の書き込み
io-creating = { $path }の作成
io-creating-directory-in = { $path }内でのフォルダーの作成
io-creating-temporary-in = { $path }内での一時ファイルの作成
io-creating-temporary = 一時フォルダーの作成
io-opening = { $path }を開く処理
io-removing = { $path }の削除
io-copying = { $path }のコピー
io-flushing = { $path }の書き出し
io-replacing = { $path }の置き換え
io-backing-up = { $path }のバックアップ
io-storing = { $path }の保存
io-no-directory = { $path }にはフォルダーがありません

## The network. Shown after "network: ".

network-timeout = { $host }から時間内に応答がありませんでした
network-host-not-found = { $host }が見つかりません。ネットワークに接続していますか？
network-unreachable = { $host }に接続できませんでした
network-unreachable-because = { $host }に接続できませんでした：{ $error }
network-nothing-there = { $host }のそのアドレスには何もありません
network-wait = { $host }から、しばらく待ってから再度問い合わせるよう求められました
network-status = { $host }がエラーを返しました（{ $status }）
# A way of asking, GET or POST, that the application does not use.
network-method = { $method }はここでは使わない要求方式です

## When the application is opened a second time.

core-in-use-title = Glaukopisはすでに開いています
core-in-use = Glaukopisはすでに開いていて、{ $path }で作業しています。互いの書いたものを上書きしないよう、そこで作業できるのは一度に一つだけです。開いている方で続けてください。
