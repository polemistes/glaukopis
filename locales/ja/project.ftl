# プロジェクト：その表示、マップの上のバー、要素に対して行うこと、
# そして文献と画像を表示する側のパネル。

project-list-unreadable = プロジェクトを読み込めませんでした

## プロジェクトの表示

project-open-failed = プロジェクトを開けませんでした
# 理由がそれ以上わからないとき、上の文の下に表示する。
project-open-failed-detail = プロジェクトを開けませんでした。
project-back = プロジェクト一覧に戻る
project-fetching = プロジェクトを取得しています
project-fetching-offline = サーバーに接続できません。接続でき次第、プロジェクトを取得します。
project-fetching-on-the-way = サーバーから取得しています。
project-name = プロジェクトの名前
project-rename = プロジェクトの名前を変更
project-not-saved = 未保存
project-redo = やり直す
project-view-this = このマップの表示
project-diagram = ダイアグラム
project-text = テキスト
project-one-at-a-time = 一つだけ表示
project-side-by-side = 分割表示
# 「分割表示」ボタンのメニュー：もう一方の側に何を表示するか。
project-beside-this = この要素を、ダイアグラムとテキストで
project-beside-element = 別の要素…
project-beside-project = 別のプロジェクト…
project-beside-element-title = 隣に表示：要素を選択
project-beside-show = 隣に表示
project-beside-title = 隣に表示：プロジェクトを選択
project-beside-subtitle = このプロジェクトの隣に表示するプロジェクト、またはそのツリーの要素
project-close-side = この側を閉じる
project-references = 文献
project-pictures = 画像
project-side-tabs = 文書ペインに表示するもの
project-side-map = マップ
project-between-maps = 二つのマップの境
project-between-preview = 側と組版の境
project-between-pictures = 側と画像の境
project-between-references = 側と文書ペインの境

## 相手の側から共有が終わったとき

project-unshared = プロジェクトはもう共有されていません
project-unshared-this = このプロジェクトはもう共有されていません
project-left-out = 共同作業者から外れました
project-unshared-unfetched = まだ取得していなかったので、このコンピューターにはその内容が何もありません。
project-unshared-not-removed = プロジェクトはまだ取得されていなかったため、プロジェクト一覧から外せませんでした
project-unshared-kept = 共有した人がサーバーから削除しました。プロジェクトは今のまま手元に残り、一人で作業を続けられます。
project-left-out-kept = プロジェクトは今のまま手元に残り、一人で作業を続けられます。これ以降にほかの人が書いたものは届きません。
project-understood = 了解

## プロジェクトにドロップしたファイル

project-drop-picture = 画像は、それが属する要素の上にドロップしてください
project-cited-in = { $count ->
    [1] 文献を「{ $name }」で引用しました
   *[other] 文献{ $count }件を「{ $name }」で引用しました
}
# 上と同じ。要素に名前がないとき。
project-cited-in-element = { $count ->
    [1] 文献を「要素」で引用しました
   *[other] 文献{ $count }件を「要素」で引用しました
}

## マップの上のバー：現在の位置と、表示中の要素に対して行うこと

# 名前のない要素の名前。
project-untitled = 無題
project-where = 現在の位置
# 側の上のパスで、表示中の要素の親を示す項目のツールチップ。
project-up-hint = 「{ $name }」へ上がる · Alt+Shift+↑
# ダイアグラムとテキストで、表示中の要素の脇にある小さな丸いボタン：その上の要素へ上がる。
project-leave-map = 「{ $name }」へ上がる
# 最初のペインで、プロジェクト自体の名前の前にあるフクロウ：すべてのプロジェクトへ上がる。
# プロジェクトの印を読み上げるときの言葉。共有されているとき。
project-badge-shared = { $name }、自分が共有
project-badge-joined = { $name }、参加中
# 二つのプロジェクトを並べて。
project-beside-failed = このプロジェクトの隣にプロジェクトを開けませんでした
project-beside-no-comments = コメントは開いたプロジェクトのものです。もう一方のプロジェクトにコメントするには、それを単独で開いてください
# 書き手の独自のテンプレートが保存し直され、プロジェクトが持つそのコピーを新しくできなかったとき。
project-template-not-renewed = プロジェクトが持つテンプレートのコピーを最新にできませんでした
# あるプロジェクトの要素をドラッグしてもう一方のペインの上に来たとき、そのペインの上に表示する。
project-copy-to-project = 「{ $name }」にコピー
project-move-to-project = 「{ $name }」に移動
project-document-into = ここに文書を取り込む…
project-drop-on-map = マップにドロップして移動 · Ctrlキーを押したままでコピー
project-open-beside = 隣に開く
project-open-beside-hint = 二つのマップを並べて、要素をあいだで移動する
project-side-by-side-short = 分割
# 数は、表示中の要素とその下で見つかったもの。
project-found-hint = 確認して引用にするもの{ $count }件
project-copied-to = 「{ $name }」にコピーしました
project-moved-to = 「{ $name }」に移動しました
project-other-projects = ほかのプロジェクト
project-send-failed = 「{ $project }」に書き込めませんでした。こちらでは何も変更していません。
project-send-no-element = その要素はもうそのプロジェクトにありません。

## ダイアグラムとテキストで要素に対して行うこと

project-write-text = テキストを書く
project-associate = 関連付ける…
project-leave-out = 文書から除外
# 要素を、プロジェクト自体へ、そのツリーの一つへ、または別のプロジェクトへコピーまたは移動する。
project-copy-to = コピー先
project-cut = 切り取り
project-cut-not-removed = 切り取ったものを貼り付けましたが、元のプロジェクトから取り除けませんでした
project-copy = コピー
# コピーしたものを、メニューの要素の下に貼り付ける。
project-paste-under = この下に貼り付け
project-move-to = 移動先
# プロジェクトのツリーを表示するダイアログを開き、要素の行き先を選ぶ：「コピー先」と「移動先」の最初の項目。
project-choose-where = 場所を選択…
# 要素のコピー先を選ぶダイアログの題：コピーするものの名前、またはその数。
project-pick-copy-title = { $count ->
    [1] 「{ $name }」のコピー先
   *[other] 要素{ $count }個のコピー先
}
project-pick-move-title = { $count ->
    [1] 「{ $name }」の移動先
   *[other] 要素{ $count }個の移動先
}
# ダイアログのボタン。選んだ要素に対して何をするかを言う。
project-pick-copy = ここにコピー
project-pick-move = ここに移動
project-pick-find = 名前で要素を探す
project-pick-none = その名前の要素はありません
# ポインターを重ねたとき、その要素を選べない理由。
project-pick-itself = 要素を、それ自身やその下にあるものの中には入れられません
project-pick-loop = 文書が自分自身を含むことになります
project-tidy-branch = この枝を整理
project-place-automatically = 自動で配置
project-itself-stays = プロジェクト自体は残ります
project-itself-stays-detail = プロジェクトはプロジェクト一覧から削除します。
# 一つの要素を、その下にあった要素とともに削除した。
project-deleted = { $under ->
    [0] 「{ $name }」を削除しました
   *[other] 「{ $name }」を、その下の要素{ $under }個とともに削除しました
}
project-deleted-many = 要素{ $count }個を削除しました

project-delete-busy-title = ここで書いている人がいます
# $names：削除されるところにいる人たち。列挙したもの。
project-delete-busy-message = { $count ->
    [1] { $names }が
   *[other] { $names }の{ $count }人が
}、削除されるところで作業しています。今そこで書かれているものは一緒に失われ、元に戻せません。
project-delete-busy-confirm = それでも削除

## 書くために開いた要素と、ポインターを重ねたときの表示

project-element = 要素
project-name-placeholder = 名前
project-write-here = ここに書きます。@と入力すると引用できます。
project-words = { $count }語
project-read-on = ダブルクリックで続きを読む
project-left-out-of-document = 文書から除外

## 側のパネル：文献と画像

project-this-map = このマップ
project-project = プロジェクト
project-library = ライブラリ
project-nothing-found = 見つかりません
project-edit-reference = 文献を編集…
project-new-reference = 新しい文献
project-import-file = ファイルをインポート
project-which-references = 表示する文献
project-search-references = 文献を検索
project-library-empty = ライブラリは空です
project-library-empty-hint = 文献を追加するか、手元の文献をインポートしてください。
project-no-references = まだ文献はありません
project-no-references-hint = 書きながら引用した文献がここに一覧されます。引用するには、テキストの上の「引用する」を選ぶか、@と入力します。
project-cited-in-heading = 引用箇所
project-not-cited = このプロジェクトでは引用されていません。
project-references-drag = 文献をテキストの中にドラッグするとそこで引用し、要素の上にドラッグするとそのテキストの末尾で引用します。
# 数は、プロジェクトが引用している文献のうち、ライブラリにないもの。
project-references-foreign = このプロジェクトの{ $count }件はライブラリにありません。
# 画像庫。
project-store = 画像庫
project-open-picture = 開く…
project-put-into-text = テキストに入れる
project-add-pictures = ファイルから画像を追加
project-which-pictures = 表示する画像
project-search-pictures = 画像を検索
project-a-picture = 画像
project-with-notes = メモあり
project-not-on-computer = このコンピューターにはありません
project-nothing-said = まだ何も書かれていません
project-store-empty = 画像庫は空です
project-store-empty-hint = ファイルから画像を追加するか、テキストにドロップしてください。
project-no-pictures = まだ画像はありません
project-no-pictures-map = このマップの図の画像がここに一覧されます。画像庫の画像は「画像庫」にあります。
project-no-pictures-project = このプロジェクトの図の画像がここに一覧されます。画像庫の画像は「画像庫」にあります。
project-pictures-drag = 画像をテキストの中にドラッグするとそこで図になり、要素の上にドラッグするとそのテキストの末尾に入ります。
# 数は、使われている画像のうち、このコンピューターの画像庫にないもの。
project-pictures-absent-map = このマップの{ $count }枚はこのコンピューターにありません。
project-pictures-absent-project = このプロジェクトの{ $count }枚はこのコンピューターにありません。

## ダイアグラムとテキストに共通

# 単独で示す要素の数。ドラッグしているものを表すラベル。
project-elements = 要素{ $count }個
# 共有プロジェクトで作業するほかの人の一人が、ある要素にいる。
project-other-here = { $name }がここにいます
project-link-placeholder = どう関係しているか
project-link-label = 関連付けのラベル

## コピーとその原本。
copy-title = コピーとその原本
copy-from = 「{ $name }」からコピー
copy-original-changed = コピーしてから、または前回確認してから、原本が変わっています。
copy-original-same = 原本はコピーしたときのままです。
copy-original-unknown = コピーしてから原本が変わったかどうかはわかりません。それを記録するようになる前に作られたコピーです。
copy-original-gone = 原本はもうありません。
copy-how-shown = 下では、原本にだけあるものを取り消し線で、このコピーにだけあるものを印を付けて示します。
copy-alike = 名前とテキストは同じです。語以外のもの（引用、画像、文字飾り）は違うかもしれません。
copy-only-original = 原本にだけある
copy-only-copy = このコピーにだけある
copy-go = 原本へ移動
copy-seen = このコピーをこのままにする
copy-take = 原本の名前とテキストを取り入れる
copy-changed-mark = コピーしてから原本が変わっています
copy-compare = 原本と比較…
copy-copied-from = 「{ $name }」からコピー
copy-copied-from-changed = 「{ $name }」からコピー（その後に変更あり）

## 要素の執筆がどこまで進んだか。書き手が言うとおりに。
status = 状態
status-idea = アイデア
status-draft = 下書き
status-done = 完了
status-none = 状態なし
# 要素の状態を表示するところで：「下書き · 340語」。
status-of = { $status } · { $count }語
status-count-idea = アイデア{ $count }個
status-count-draft = 下書き{ $count }個
status-count-done = 完了{ $count }個
# マップの中の、下書きと完了したものの語数。
status-words-written = 執筆済み{ $count }語
status-progress = マップの進み具合

## 各側の上のパスと、側（一覧、パス、閉じたときのままのウィンドウの第4段階）
# パスの先頭の山形の印。すべてのプロジェクトのメニューを開く。
project-all-projects-menu = すべてのプロジェクト
# 欄に収まらない長いパスの中の「…」の項目。そのメニューに、隠れた項目がある。
project-path-hidden = パスの続き
project-switch-sides = 左右を入れ替える

## 側、ペイン、バーの第3段階（エージェント「bars」）
project-bar-typesetting = 組版
project-bar-document = 文書
project-badge-offline = サーバーに接続できません
project-badge-refused = サーバーが最新の変更を受け付けません

## 言葉を減らす、第2段階（エージェント「chrome」）：クローン。自分のものは名前のほかに何も持たない。

project-clone-other = 別の要素のクローンにする…
# クローンのサブメニュー、そしてダイアグラムでのクローンの印：原本の名前。
project-clone-of = 「{ $name }」のクローン
project-clone-choose = 別の要素を選択…
project-clone-go = 原本へ移動
project-clone-none = クローンをやめる
# プロジェクトのツリーを表示するダイアログ。クローンの原本を選ぶ。
project-pick-clone-title = 「{ $name }」にどの要素をクローンしますか？
project-pick-clone = クローンにする
project-pick-clone-self = 要素を自分自身のクローンにはできません
project-add-child = 子要素を追加
project-add-sibling = 同じ階層に要素を追加
project-delete-promote = 削除して下位要素を一段上げる
project-delete-with = 下位要素ごと削除
