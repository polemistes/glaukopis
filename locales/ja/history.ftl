# プロジェクトの完全な履歴、日本語で。
# locales/README.md を見よ。

history-title = 履歴
history-between = マップと履歴の境
history-settings = 履歴の設定
history-failed = 履歴を読み込めませんでした。
history-reading = 履歴を読み込んでいます…

## 保存していないとき

history-off = このプロジェクトの履歴は保存されていません。
history-on-word = すべての変更を保存
history-off-word = 保存しない
history-off-about = 履歴を保存しているあいだは、すべての変更が、誰がいつ行ったかとともに保存されます。プロジェクトを任意の時点の状態で見ることも、その状態に戻すこともできます。履歴は容量を使い、共有プロジェクトでは、誰が何をいつ書いたかがほかの人にわかります。
history-turn-on = 履歴を保存する

## 時点

# 履歴が名前を知らない人。
history-someone = 誰か
history-began = 履歴の始まり
# 作業の区切りが始まった時刻と終わった時刻。
history-span = { $from }～{ $to }
# まとめられた古い履歴。その中の時点はもうない。
history-merged = まとめて保存
history-added = +{ $count }文字
history-removed = −{ $count }文字

## 当時のマップ

history-back = 現在に戻る
history-as-it-was = { $when }時点
history-marked = 前の時点から変わったところは、変えた人の色で示されます。
history-map-not-there = この要素はその時点ではありませんでした。
history-added-by = { $name }が追加
history-removed-by = { $name }が削除
history-changed-by = { $name }が変更
# 図、表、部分への相互参照。何と書かれていたかがわからないとき。
history-pointer = 相互参照
history-name-moment = この時点に名前を付ける
history-name-placeholder = 呼び名
history-named = この時点を「{ $name }」と名付けました。
history-bring-back-element = この要素を当時の状態に戻す
history-bring-back-map = 表示中のものをすべて当時の状態に戻す
history-brought-back = 当時の状態に戻しました。「元に戻す」で取り消せます。
history-bring-back-failed = 戻せませんでした。
history-open-copy = 独立したプロジェクトとして開く
history-copy-name = { $name }（{ $day }時点）
history-copy-failed = プロジェクトを作れませんでした。

## アーカイブ

history-open-archive = アーカイブを開く…
history-archive-kind = Glaukopisの履歴
history-archive-unread = アーカイブを読み込めませんでした。
history-archive-of = アーカイブ：{ $name }
history-archive-close = 閉じる

## 設定

history-keep = 履歴を保存する
history-room = 履歴の容量は{ $size }です。
history-turn-off-title = 履歴の保存をやめますか？
history-turn-off-message = 保存されていたものは削除されます。プロジェクト自体はそのまま残ります。
history-turn-off-shared = 保存されていたものは、ここでも、プロジェクトを共有している人のコンピューターでも削除されます。プロジェクト自体はそのまま残ります。
history-turn-off = 履歴を削除
history-finely = 古い履歴
history-finely-about = 古い変更はまとめられ、容量が減り、早く読み込めるようになります。その代わり、その中の時点はもう区別できなくなります。名前を付けた時点と、変更の確認が比べる時点は残ります。
# この後に数の欄と、その単位（history-weeks）が続く：「…まで [2] 週間」。
history-hourly = 1時間分ずつ一つにまとめるまで
history-weeks = { $count ->
   *[other] 週間
}
history-daily = 1日分ずつ一つにまとめるまで
history-months = { $count ->
   *[other] か月
}
history-before = それより前
history-before-choose = 履歴の時点を選ぶと、それより前のものをアーカイブしたり削除したりできます。
history-before-about = { $when }より前の履歴は、ファイルにアーカイブしてあとで見ることも、削除することもできます。
history-archive = アーカイブ…
history-delete = 削除
history-archive-title = { $when }より前の履歴をアーカイブしますか？
history-delete-title = { $when }より前の履歴を削除しますか？
history-cut-message = 残る履歴は、その時点のプロジェクトから始まります。
history-cut-kept = 名前を付けた時点や変更の確認に使った時点が{ $count }件、それより前にあります。ここではもう見られなくなります。
history-cut-not-here = この時点より前の履歴は取り除けません。
history-cut-failed = 履歴を取り除けませんでした。
history-archive-until = { $when }まで
history-archived = { $when }より前の履歴をアーカイブしました。
history-deleted = { $when }より前の履歴を削除しました。

## Orgとしてのテキスト：当時のものと今のもの。二つのOrgテキストの差分として

history-show-org = Orgで表示
history-org-about = 表示中の要素とその下のすべてのテキストを、Orgで示します。当時のものと今のものです。取り除かれた行には−、加えられた行には+が付き、変わった行の中では変わった語が示されます。
history-org-same = テキストは今も当時のままです。
