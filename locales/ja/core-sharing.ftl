# What the core says of sharing projects through a server, in English.
# See locales/README.md.

## The address of a server, as it was typed.

core-sharing-enter-address = サーバーのアドレスを入力してください。
core-sharing-no-spaces = サーバーのアドレスにスペースは含まれません。
# The scheme is what was typed before "://".
core-sharing-scheme = サーバーにはhttpかhttpsで接続します。「{ $scheme }」では接続できません。
core-sharing-not-an-address = サーバーのアドレスではないようです。
core-sharing-no-server = { $host }にGlaukopisのサーバーはありません。アドレスを教えてくれた人に確認してください。
core-sharing-no-answer-behind = { $host }はありますが、その先のサーバーが応答しません
core-sharing-newer = サーバーがこのバージョンのGlaukopisより新しいため、使うにはGlaukopisを更新する必要があります。

## What the server refuses, by its kind.

core-sharing-no-room = このプロジェクトはもうサーバーにありません。
core-sharing-not-admitted = サーバーはこのプロジェクトのコピーをもう受け付けません。
core-sharing-not-owner = これができるのはプロジェクトを共有した人だけです。
core-sharing-bad-code = コードが無効です。打ち間違い、使用済み、取り消し、期限切れのいずれかです。
core-sharing-exists = このプロジェクトはすでにサーバーにあります。
core-sharing-full = サーバーに保存できるプロジェクトの数が上限に達しています。
core-sharing-password-asked = このサーバーでプロジェクトを共有するにはパスワードが必要です。
core-sharing-password-wrong = サーバーが求めるパスワードと違います。
core-sharing-too-many = ここからの試行が多すぎます。10分後にもう一度試してください。
core-sharing-no-file = サーバーにその画像はありません。
core-sharing-server-error = { $host }がエラーを返しました。

## What the server says in its own words, which are English, where the
## application knows them.

core-sharing-no-name = プロジェクトに名前がありません。
core-sharing-bad-id = プロジェクトのIDがサーバーで使えるものではありません。
core-sharing-many-invitations = 未使用の招待がすでに50件あります。いくつか取り消してください。
core-sharing-no-collaborator = そのような共同作業者はいません。
core-sharing-not-whole = ファイルが完全には届きませんでした。
# The most is in the server's words: "25 MB".
core-sharing-file-too-large = ファイルがこのサーバーで受け付ける大きさを超えています。一つのファイルは{ $most }までです。
core-sharing-project-full = ファイルを置く余地がありません。このサーバーでは、一つのプロジェクトのファイルは合わせて{ $most }までです。

## The pictures of the figures, which are sent and fetched one by one.

core-sharing-picture-too-large = { $host }はこれほど大きな画像を受け付けません。
core-sharing-picture-larger = ある画像が{ $host }で受け付ける大きさ（{ $most } MBまで）を超えているため、他の人に届きません。
core-sharing-picture-not-sent = 画像を送れませんでした：{ $error }。
core-sharing-picture-not-fetched = 画像を取得できませんでした：{ $error }。

## Publishing and joining.

core-sharing-shared-already = このプロジェクトはすでに共有されています。
core-sharing-own-code = このコードは、このコンピューターから共有している「{ $name }」のものです。すでに手元にあります。
