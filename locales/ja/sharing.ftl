# サーバーを通じてプロジェクトを共有すること、そして共有されたプロジェクトに参加すること。

## プロジェクトを共有する前

sharing-share-title = このプロジェクトを共有
sharing-lead = 共有すると、ほかの人がサーバーを通じて、同時にこのプロジェクトで一緒に作業できます。プロジェクトはこのコンピューターにも残り、サーバーなしでも作業できます。
sharing-server = サーバー
sharing-unreachable = サーバーに接続できませんでした。
sharing-unencrypted = このサーバーへ送られるものは、途中で暗号化されません。信頼できるネットワークで使ってください。
sharing-password = サーバーのパスワード
sharing-password-hint = このサーバーでプロジェクトを共有する人に求められます。招待される人には必要ありません。
sharing-your-name = 表示名
sharing-your-name-hint = プロジェクトを共有する相手に表示されます。
sharing-your-name-placeholder = ほかの人に知られている名前
sharing-share = 共有
sharing-sharing = 共有しています…
sharing-share-failed = プロジェクトを共有できませんでした。

## 共有しているあいだ

sharing-shared-title = 共有プロジェクト
# 題の下：プロジェクトを共有しているサーバー。
sharing-through = { $server }経由
sharing-connected = 接続済み。書いたものはすぐにほかの人に届きます。
sharing-connecting = 接続中…
sharing-offline = サーバーに接続できません。書いたものはここに保たれ、接続でき次第送られます。
sharing-too-large = サーバーが最新の変更を受け付けません。それを加えると、プロジェクトがサーバーの保てる大きさを超えるためです。変更はここに保たれています。サーバーの管理者は、より大きなプロジェクトを許可できます。
sharing-your-name-seen = ほかの人に表示される名前です。

## 招待

sharing-invite = 招待
sharing-code-label = 招待コード
sharing-copy = 招待をコピー
sharing-copied-button = コピーしました
# 「join」は共有プロジェクトに参加するボタンの名前で、斜体で表示される。
# 「expires」は、コードが誰に、いつまで有効かを言う：sharing-for-one とその下のもの。
sharing-invite-hint = 招待する人に送ってください。その人が{ $join }を選び、サーバーとコードを入力します。このコードは{ $expires }です。
sharing-make-code = 招待コードを作る
sharing-make-another = 別のコードを作る
sharing-options = オプション
sharing-fewer-options = オプションを隠す
sharing-for = 対象
sharing-one-person = 1人
sharing-several-people = 複数人
sharing-good-for = 有効期間
sharing-a-day = 1日
sharing-a-week = 1週間
sharing-a-month = 1か月
sharing-until-withdrawn = 取り消すまで
sharing-withdraw = 取り消す
# 以前に作ったコードについて言うこと。点で区切って並べる：
# 「作成：昨日 · 1人用 · 残り6日 · 1回使用」。$when：ago が書くとおり。
sharing-made = 作成：{ $when }
sharing-codes-once = コードは作ったときに一度だけ表示されます。サーバーは、そのコードを見分けるのに必要なこと以外は保存しません。もう一度送るには、新しいコードを作ってください。
sharing-for-several = 複数人用
sharing-for-one = 1人用
sharing-for-more = あと{ $count }人まで
sharing-hours-left = 残り{ $count }時間
sharing-days-left = 残り{ $count }日
sharing-used = { $count }回使用
# コピーされ、招待する人に送られる招待文：3行のうち、これが1行目。
# 「join」は共有プロジェクトに参加するボタンの名前。
sharing-invitation = Glaukopisで「{ $project }」に参加してください：「{ $join }」を選び、次を入力します
sharing-invitation-server = サーバー：{ $server }
sharing-invitation-code = コード：{ $code }
sharing-copied = 招待をコピーしました
sharing-copied-detail = 招待する人へのメッセージに貼り付けてください。
sharing-invite-failed = 招待を作れませんでした
sharing-copy-failed = 招待をコピーできませんでした
sharing-withdraw-failed = 招待を取り消せませんでした

## プロジェクトを持っている人

sharing-who = プロジェクトを持っている人
sharing-list-unreachable = 一覧はサーバーにありますが、サーバーに接続できません。
# 所有者。自分でないとき。円の中に頭文字だけを表示する。
sharing-owner = 所有者
sharing-the-owner = 共有している人
sharing-you = { $name }（自分）
sharing-here = 今ここにいる
sharing-not-here = 今はいない
# 「ago」はどれだけ前か：「3時間前」「昨日」。
sharing-last-here = 最後にいた：{ $ago }
sharing-remove-member = { $name }を外す
sharing-none-joined = まだ誰も参加していません。
sharing-remove-title = { $name }を外しますか？
sharing-remove-message = { $name }はプロジェクトを今のまま持ち続けますが、これ以降に書かれたものは届かなくなります。
sharing-remove-failed = { $name }を外せませんでした
# 名前を付けていないとき、ほかの人に見える呼び名。
sharing-name-owner = 所有者
sharing-name-member = 共同作業者
# プロジェクトを開いているほかの人。頭文字で表示する。
sharing-present = 今ここに：{ $names }
sharing-is-here = { $name }がここにいます

## 共有を終える

sharing-stop = 共有をやめる
sharing-stop-title = このプロジェクトの共有をやめますか？
sharing-stop-message = プロジェクトはサーバーから削除されます。自分も共有相手も、それぞれ今のままのプロジェクトを持ち続けます。
sharing-stopped = プロジェクトはもう共有されていません
sharing-leave = 退出
sharing-leave-project = プロジェクトから退出
sharing-leave-title = このプロジェクトから退出しますか？
sharing-leave-message = プロジェクトは今のまま手元に残ります。これ以降、ほかの人が書いたものは届かず、自分が書いたものもほかの人に届きません。
sharing-left = プロジェクトから退出しました
sharing-untold-title = サーバーに知らせることができませんでした
# 「error」は何がうまくいかなかったか。伝えられたとおりに。
sharing-untold-message = { $error }それでも、このコンピューターでは共有を終えられます。その場合、サーバーに知らせることができるまで、プロジェクトはサーバーに残ります。
sharing-end-here = ここで終える
sharing-keep = 共有を続ける
sharing-end-failed = 共有を終えられませんでした

## 共有プロジェクトに参加する

sharing-join-title = 共有プロジェクトに参加
sharing-join-about = 送られてきたサーバーとコードで
sharing-code = コード
sharing-your-name-join-hint = プロジェクトのほかの人に表示されます。
sharing-join = 参加
sharing-joining = 参加しています…
sharing-failed = うまくいきませんでした。
