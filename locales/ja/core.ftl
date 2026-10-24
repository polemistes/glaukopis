# 中核がアプリケーションを使う人に言うこと（日本語）。
# locales/README.md を見よ。

## エラー。していたことの後に示される。

error-parse = { $path }を読み取れませんでした：{ $message }
error-not-found = 見つかりません：{ $what }
error-network = ネットワーク：{ $message }

## アプリケーションが連携するプログラム：Pandoc、Typst、Tesseract。

program-missing = { $program }がインストールされていないか、見つかりません
# プログラムはあるが、Glaukopisに必要なものより古い。
program-too-old = インストールされているのは{ $program } { $version }です。Glaukopisには{ $program } { $least }以降が必要です。
program-failed = { $program }が失敗しました：{ $message }
# 何も言わずに失敗したプログラムが何をしたと言われるか：status は「exit status: 1」。
program-ended = { $status }で終了しました
program-stopped = { $program }を停止しました。

## システムが拒んだときにしていたこと。システムが言ったことの前に示される：
## 「/home/…/library.bibの読み込み: Permission denied」。

io-reading = { $path }の読み込み
io-writing = { $path }の書き込み
io-creating = { $path }の作成
io-creating-directory-in = { $path }内でのフォルダーの作成
io-creating-temporary-in = { $path }内での一時ファイルの作成
io-creating-temporary = 一時フォルダーの作成
io-opening = { $path }を開く処理
io-removing = { $path }の削除
io-copying = { $path }のコピー
io-flushing = { $path }への書き込みの確定
io-replacing = { $path }の置き換え
io-backing-up = { $path }のバックアップ
io-setting-aside = { $path }の退避
io-storing = { $path }の保存
io-no-directory = { $path }には親フォルダーがありません

## アプリケーション自身のファイルで、読み込めなかったもの：名前に時刻を
## 加えて退避し、アプリケーションはそれなしで続ける。ウィンドウの下端に
## 示される。

# $path はファイルがあった場所。$aside は同じフォルダーでの今の名前。$cause はそのどこが悪かったか。
core-set-aside = { $path }を読み込めなかったため、同じフォルダーの{ $aside }に退避しました。Glaukopisはその内容なしで続けます。原因：{ $cause }

## ネットワーク。「ネットワーク：」の後に示される。

network-timeout = { $host }から時間内に応答がありませんでした
network-host-not-found = { $host }が見つかりません。ネットワークに接続していますか？
network-unreachable = { $host }に接続できませんでした
network-unreachable-because = { $host }に接続できませんでした：{ $error }
network-nothing-there = { $host }のそのアドレスには何もありません
network-wait = { $host }から、しばらく待ってから再度問い合わせるよう求められました
network-status = { $host }がエラーを返しました（{ $status }）
# $most はメガバイト数。
network-too-large = { $host }の応答が、Glaukopisが受け取れる量（{ $most } MB）を超えました
network-tls = { $host }と安全な接続を確立できませんでした。その証明書がこのコンピューターで信頼されていないか、プロキシやファイアウォールなど、間にあるものが妨げている可能性があります
network-redirects = { $host }が、問い合わせをアドレスからアドレスへ転送した回数が多すぎます
network-stalled = { $host }からの応答が途中で止まりました
network-not-understood = { $host }の応答を理解できませんでした
# それ以外の問題。それについて言われたことは実行ログにある。
network-failed = { $host }に問い合わせできませんでした。理由は実行ログにあります
# 問い合わせの方式（GET や POST）で、アプリケーションが使わないもの。
network-method = { $method }はここでは使わない要求方式です

## アプリケーションを二度目に開いたとき。

core-in-use-title = Glaukopisはすでに開いています
core-in-use = Glaukopisはすでに開いていて、{ $path }で作業しています。互いの書いたものを上書きしないよう、そこで作業できるのは一度に一つだけです。開いている方で続けてください。

## アプリケーションが起動できないとき：そのデータを作ることも読むこともできない。

core-start-failed-title = Glaukopisを起動できませんでした
# 何が問題だったかはコロンの後に示される：「/home/…/libraryの作成: Permission denied」。
core-start-failed = Glaukopisを起動できませんでした。原因：{ $error }
# core-start-failed の後に言う。実行ログを書き込めた場所。
core-start-failed-log = 起きたことの詳細は、実行ログ（{ $log }）にあります

## Glaukopis自身の内部で問題が起きたとき。

# プログラムが自分について言ったことは、コロンの後に英語で示される。
core-worker-panicked = Glaukopisの内部で問題が起き、行っていた処理は中止されました：{ $message }。詳しくは実行ログにあります。
