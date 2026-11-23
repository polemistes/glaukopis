# The synchronization between the writer's devices, computers and phones, in
# English: its section in the settings, and what is told when a project was
# written in on two devices apart. See locales/README.md.

sync-title = 同期
sync-about = プロジェクト、ライブラリ、ノートブック、設定は、デバイス間で同期されます。
# Under the heading on a device that takes the notes only, a phone.
sync-about-notes = ノートブックだけが同期されます。

## Before it is on.

sync-server = サーバー
sync-computer-name = このデバイスの名前
# The choice between the two ways of beginning, as a screen reader names it.
sync-how = このデバイスの始め方
sync-how-start = ここから始める
sync-how-join = コードで参加
sync-password = サーバーのパスワード
sync-code = コード
sync-start = 同期を開始
sync-starting = 開始しています…
sync-join = 参加
sync-joining = 参加しています…
sync-unreachable = サーバーに接続できませんでした。

## While it is on.

sync-working = 同期しています…
# $when is how long ago, as "just now", "3 minutes ago" or "12 March".
sync-last = 最終同期：{ $when }
sync-never = まだ同期していません
sync-offline = サーバーに接続できません。ここで書いたものは保たれ、接続でき次第送られます。
sync-refused = このデバイスでの同期は停止しました
# The line over the notes of a phone whose app is older than the form of something that is synchronized: the synchronization has stopped on it until the app is updated. The words are the owner's, and the core says the same in the settings (core-sync-update-needed).
sync-outdated = 同期するには更新が必要です。
sync-now = 今すぐ同期
sync-computers = デバイス
sync-this-computer = { $name }（このデバイス）
# $when is how long ago, as "just now", "3 minutes ago" or "12 March".
sync-seen = 最終接続：{ $when }
sync-computers-unread = サーバーにデバイスの一覧を問い合わせられませんでした。
sync-add = デバイスを追加…
# $join is the name of the choice the other device makes, shown in italics; $until is a time of day.
sync-code-hint = もう一方のデバイスの設定の「同期」で{ $join }を選び、このコードを入力します。コードは1回だけ使え、{ $until }まで有効です。
sync-code-failed = コードを作れませんでした。
sync-rename-title = デバイスの名前を変更
sync-remove-title = 「{ $name }」を外しますか？
sync-remove-message = 以後は同期されません。そのデバイスにあるものは、そこに残ります。
# $why is what went wrong, a sentence of its own.
sync-remove-failed = 「{ $name }」を外せませんでした。{ $why }
sync-stop = このデバイスでの同期をやめる
sync-stop-title = このデバイスでの同期をやめますか？
sync-stop-message = このデバイスにあるものは、そのままここに残ります。ほかのデバイスで書いたものはここに届かなくなり、ここで書いたものもほかのデバイスに送られなくなります。
sync-stop-message-alone = このデバイスにあるものは、そのままここに残ります。同期しているのはこのデバイスだけなので、サーバーには何も残りません。
# Where the device that stops is the last, and takes the notes only, a phone: what the server keeps of the rest goes too.
sync-stop-message-alone-notes = このデバイスにあるものは、そのままここに残ります。同期しているのはこのデバイスだけなので、サーバーには何も残りません。プロジェクトとライブラリのファイルはこのデバイスにないため、サーバーにあるそれらは削除されます。
sync-stop-confirm = 同期をやめる
sync-stop-failed = 同期をやめられませんでした

## Written apart.

sync-apart = 「{ $name }」は、2台のデバイスが互いにつながっていないあいだに、それぞれで書き込まれました。
sync-apart-show = 変更を表示
sync-apart-no-history = このプロジェクトの履歴は保存されていないため、変更を表示できません。以前の状態のプロジェクトは、以前のバージョンの中にあります。
sync-apart-earlier = 以前のバージョン
# The moment the review of such a project goes from, as the review names it: Since “the devices met”.
sync-apart-moment = デバイスがつながった時点
