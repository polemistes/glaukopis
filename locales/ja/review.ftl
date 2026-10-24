# あとから変更を確認する（ADR 0022）：テキストの隣の変更のパネル、
# 日本語で。locales/README.md を見よ。

review-title = 変更
# テキストの上の、パネルを開くボタン。
review-open = 変更を確認
review-since-last = 前回の確認から
review-since-beginning = 履歴の始まりから
review-since-session = { $who }が作業を始めた{ $when }から
review-since-named = 「{ $name }」から
# 比べる時点がいつだったか。その時点の名の下に。
review-since-when = { $when }から
review-choose-since = 別の時点から確認
# うまくいかなくなった確認を直す：確認の起点の時点から承諾したものを忘れ、
# それらの変更をもう一度表示する。
review-forget-accepted = 承諾したものを忘れる
review-own = 自分の変更も
review-show-org = Orgで表示
review-unit = 確認の単位
review-by-sentence = 文
review-by-paragraph = 段落
review-left = 残り{ $count }件
review-position = { $count }件中{ $index }件目
review-working = 変更を調べています…
review-failed = 変更を調べられませんでした。
review-nothing = 確認するものはもうありません
review-nothing-text = その時点以降にほかの人が行った変更は、すべて承諾済みです。
review-list = このマップの変更

## 変更の種類。

review-kind-changed = 変更
review-kind-added = 新しいテキスト
review-kind-removed = 削除されたテキスト
review-kind-moved = 移動
review-kind-object = { $what ->
    [figure] 図
    [table] 表
    [equation] 別行立ての数式
    [citation] 引用
    [math] 数式
    [footnote] 注
    [crossref] 相互参照
   *[other] テキストでないもの
}
review-kind-put-in = { $what }の挿入
review-kind-taken-out = { $what }の除去
review-kind-altered = { $what }の変更
review-element-added = 要素の追加
review-element-removed = 要素の削除
review-element-moved = 要素の移動
review-element-heading = 見出しとして印刷するようになった
review-element-no-heading = 見出しとして印刷しなくなった
review-element-excluded = 文書から除外
review-element-included = 文書に戻した
review-element-other = 要素の変更
# 変更がどこにあるか：要素の名前。
review-in = 「{ $element }」内
review-moved-from = 「{ $element }」から
review-untitled = 無題
review-gone-element = もうない要素
review-was = 以前
review-is = 現在
review-nothing-there = なし
review-someone = 誰か
review-now-under = 現在は「{ $element }」の下
review-was-under = 以前は「{ $element }」の下

## 変更に対して行うこと。

review-accept = 承諾
review-reject = 却下
review-later = あとで
review-previous = 前の変更
review-reject-cannot = マップから削除されたものや取り除かれた図は、履歴から復元します。
review-versions = その履歴
review-versions-count = バージョン{ $count }個
review-versions-reading = その履歴を読み込んでいます…
review-versions-none = 両端のあいだには何も起きていません。
review-versions-failed = その履歴を読み込めませんでした。
review-version-by = { $who }、{ $when }
review-accept-up-to = ここまで承諾
review-use-version = このバージョンを使う

## 履歴がないとき。

review-no-history = このプロジェクトの履歴は保存されていません
review-no-history-text = 変更は、誰がいつ何を変えたかを記録しているプロジェクトの履歴から確認します。履歴は、保存を始めた時点から保存されます。
review-turn-on = 履歴を保存する
review-turn-on-elsewhere = プロジェクトの履歴とともにオンになります。
