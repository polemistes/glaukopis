# What the core says of sharing projects through a server, in English.
# See locales/README.md.

## The address of a server, as it was typed.

core-sharing-enter-address = 请输入服务器地址。
core-sharing-no-spaces = 服务器地址中不能有空格。
# The scheme is what was typed before "://".
core-sharing-scheme = 服务器通过 http 或 https 访问，而不是“{ $scheme }”。
core-sharing-not-an-address = 这看起来不像服务器地址。
core-sharing-no-server = { $host } 上没有 Glaukopis 服务器。请向提供地址的人核实。
core-sharing-no-answer-behind = { $host } 可以访问，但其后的服务器没有响应
core-sharing-newer = 服务器比此版本的 Glaukopis 新，需要先更新 Glaukopis 才能使用它。

## What the server refuses, by its kind.

core-sharing-no-room = 此项目已不在服务器上。
core-sharing-not-admitted = 服务器不再接受此项目的这份副本。
core-sharing-not-owner = 只有共享此项目的人才能这样做。
core-sharing-bad-code = 邀请码无效。它可能输错了、已被使用、已被撤回，或者已经过期。
core-sharing-exists = 此项目已在服务器上。
core-sharing-full = 服务器上的项目已达到其设定的上限。
core-sharing-password-asked = 此服务器要求通过它共享项目的人输入密码。
core-sharing-password-wrong = 密码不对。
core-sharing-too-many = 从这里尝试的次数太多。请十分钟后再试。
core-sharing-no-file = 服务器上没有这张图片。
core-sharing-server-error = { $host } 返回了错误。

## What the server says in its own words, which are English, where the
## application knows them.

core-sharing-no-name = 此项目没有名称。
core-sharing-bad-id = 服务器无法使用此项目的 ID。
core-sharing-many-invitations = 已有五十个未处理的邀请；请撤回一些。
core-sharing-no-collaborator = 没有这位协作者。
core-sharing-not-whole = 文件没有完整收到。
# The most is in the server's words: "25 MB".
core-sharing-file-too-large = 文件超过了此服务器的接受范围：单个文件最大为 { $most }。
core-sharing-project-full = 没有空间存放此文件：在此服务器上，一个项目的所有文件合计最大为 { $most }。

## The pictures of the figures, which are sent and fetched one by one.

core-sharing-picture-too-large = { $host } 不接受这么大的图片。
core-sharing-picture-larger = 有一张图片超过了 { $host } 的接受范围（最大 { $most } MB），其他人收不到它。
core-sharing-picture-not-sent = 有一张图片无法发送：{ $error }。
core-sharing-picture-not-fetched = 有一张图片无法获取：{ $error }。

## Publishing and joining.

core-sharing-shared-already = 此项目已经共享。
core-sharing-own-code = 这个邀请码对应的是从这台计算机共享的“{ $name }”：你已经有它了。
