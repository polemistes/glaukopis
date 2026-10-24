# タイムライン：要素の時期と、時間の軸に沿って見たマップ。

timeline-title = タイムライン
timeline-view = タイムライン
timeline-settings = タイムライン
timeline-axis = 軸
timeline-axis-dates = 日付
timeline-axis-units = 独自の単位
timeline-dates-hint = 年。必要ならBCを付けます：431 BC、c. 480 BCE、1453-05、1453-05-29、5th century BC。日本語の書き方（紀元前431年など）はまだ読み取れません。
timeline-unit = 単位の呼び名
timeline-unit-placeholder = 年、日、周期…
timeline-units-hint = 時期は単位の数で書きます：12 年、3 日、または単に12。負の数も使えます。
timeline-lanes = レーン
timeline-lanes-given = 選ぶまでは、表示中の要素の子要素がそれぞれレーンになります。レーンには、その枝の中で時期が記されたものが入ります。レーンの要素自体に時期が記されていれば、それがレーンの期間です。
timeline-lanes-chosen = 選んだレーン。テキストの順に並びます。
timeline-lanes-reset = 表示中の要素の子要素ごとに戻す
timeline-one-lane = 一つのレーン
timeline-each-child = { $count ->
    [1] 子要素をレーンに
   *[other] 子要素{ $count }個をそれぞれレーンに
}
timeline-no-branches = 表示中の要素の下にはまだ何もありません。
timeline-lanes-by-kind = 種類ごとのレーン
timeline-lanes-by-kind-hint = ある種類の要素を、それぞれ一つのレーンに：人物ごと、場所ごとに。
timeline-each-of-kind = それぞれをレーンに
timeline-chronology = 年表をマップに追加
timeline-chronology-hint = 時期が記されたものすべてを時間の順に並べた表をもつ要素。書き込んだり印刷したりできます
timeline-chronology-title = 年表
timeline-chronology-when = 時期
timeline-chronology-what = 事柄
timeline-chronology-made = マップに年表を追加しました
timeline-elsewhere = マップのほかの場所
timeline-elsewhere-chosen = レーンは選ばれています。どのレーンにも入らないものはここに入ります。押すとレーンを選び直せます。
timeline-ordered = 順序のみ、日付なし
timeline-unplaced = 要素{ $count }個を配置できませんでした：
timeline-contradiction = 記された位置に置くことができません
# 配置されたものをドラッグすること、そして配置されていないものを配置すること。
timeline-moving = ドラッグで移動
timeline-moving-hint = 要素を軸に沿って、または期間の端をドラッグすると、時期が変わります。オフにすると、誤って動くことはありません
timeline-without = 時期のない要素
timeline-waiting-hint = まだ時期が記されていません。押して時期を記すか、レーンに沿ってドラッグして配置します
timeline-unknown = 配置されていないもの、または読み取れない時期を参照しています

## 要素の時期を記す
when-clear = 時期を消す
when-kind = 時点か期間か
when-point = 時点
when-span = 期間
when-when = いつ
when-start = 開始
when-end = 終了
when-at = 時期を書く
when-after = ある要素の後
when-before = ある要素の前
when-between = 二つの要素のあいだ
when-during = ある要素の期間中
when-time = 時期
when-time-placeholder = 431 BC、1453-05、c. 480…
when-unit-placeholder = 12 年、3 日、12…
when-unread = これは時期として読み取れません。
when-after-what = どの要素の後
when-before-what = どの要素の前
when-during-what = どの要素の期間中
when-choose = 要素を選択…
when-approx = おおよそ
# 書いた時期の前後の幅。そこから両側へ薄れていくように描かれる。
when-margin = 前後の幅
when-margin-placeholder = 5 years、3 months、10 days…
when-margin-unit-placeholder = 5…
when-margin-unread = これは時間の長さとして読み取れません。
when-hint-dates = 年、日付、月、世紀、年代を読み取ります。必要ならBCかBCEを付け、書き方は英語のとおりです（May 1453、5th century BC、the 1920s、c. 480）。1年は、その年全体を表します。
when-hint-units = 時期はタイムラインの単位の数です。単位はレーンの下で設定します。「12 年」と「12」は同じです。
when-bc = BC
# $month：1から12；$year：書いたとおり。
when-month-of = { $year }、{ $month }月
# 要素の脇で、配置をどう言うか：「以後 口論、以前 使節」。語は名前の前に置かれる。
when-said-after-name = { $name }以後
when-said-before-name = { $name }以前
when-said-during-name = { $name }の期間中
when-said-to = ～
when-said-approx = 約

## 言葉を減らす、第2段階（エージェント「chrome」）：メニューの言葉。

when-stamp = 時期を記す…
# 要素の時期を記すダイアログの題。
when-stamp-title = 時期
timeline-empty-stamp = 時期が記されたものはまだありません。要素のメニューで「時期を記す…」を選んでください。
