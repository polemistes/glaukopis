# Sharing a project through a server, and joining one that is shared.

## Before the project is shared

sharing-share-title = Поделиться этим проектом
sharing-lead = Тогда другие смогут работать над проектом вместе с вами, одновременно, через сервер. Он остаётся и на вашем компьютере, и над ним можно работать без сервера.
sharing-server = Сервер
sharing-unreachable = Сервер недоступен.
sharing-unencrypted = То, что отправляется на этот сервер, не шифруется по пути. Пользуйтесь им в сети, которой доверяете.
sharing-password = Пароль сервера
sharing-password-hint = Спрашивается у тех, кто делится через него проектами. Тем, кого вы приглашаете, он не нужен.
sharing-your-name = Ваше имя
sharing-your-name-hint = Показывается тем, с кем вы делитесь проектом.
sharing-your-name-placeholder = Как вас знают остальные
sharing-share = Поделиться
sharing-sharing = Отправка…
sharing-share-failed = Не удалось поделиться проектом.

## While it is shared

sharing-shared-title = Совместный проект
# Under the title: the server the project is shared through.
sharing-through = Через { $server }
sharing-connected = Подключено. Написанное сразу же у остальных.
sharing-connecting = Подключение…
sharing-offline = Сервер недоступен. То, что вы пишете, хранится здесь и будет передано, когда это станет возможно.
sharing-too-large = Сервер не принимает последние изменения: с ними проект стал бы больше, чем он хранит. Они хранятся здесь. Тот, кто держит сервер, может разрешить проекты побольше.
sharing-your-name-seen = Как вас видят остальные.

## Invitations

sharing-invite = Пригласить
sharing-code-label = Код приглашения
sharing-copy = Копировать приглашение
sharing-copied-button = Скопировано
# "join" is the name of the button that joins a shared project, in italics;
# "expires" says for whom and how long the code is good: sharing-for-one and those below it.
sharing-invite-hint = Отправьте его тому, кого приглашаете: тот выбирает { $join } и вводит сервер и код. Он { $expires }.
sharing-make-code = Создать код приглашения
sharing-make-another = Создать ещё код
sharing-options = Параметры
sharing-fewer-options = Меньше параметров
sharing-for = Для
sharing-one-person = Одного человека
sharing-several-people = Нескольких людей
sharing-good-for = Действует
sharing-a-day = День
sharing-a-week = Неделю
sharing-a-month = Месяц
sharing-until-withdrawn = Пока не отозван
sharing-withdraw = Отозвать
# What is said of a code that was made before, in a list with a dot between:
# "made yesterday · for one person · 6 days left · used once". $when: as `ago` writes it.
sharing-made = создан { $when }
sharing-codes-once = Код показывается один раз, когда создан: сервер хранит о нём лишь то, что нужно, чтобы узнать его снова. Чтобы отправить ещё раз, создайте новый.
sharing-for-several = для нескольких
sharing-for-one = для одного человека
sharing-for-more = ещё для { $count }
sharing-hours-left = осталось { $count } ч
sharing-days-left = { $count ->
    [one] остался { $count } день
    [few] осталось { $count } дня
    [many] осталось { $count } дней
   *[other] осталось { $count } дня
}
sharing-used = { $count ->
    [one] использован { $count } раз
    [few] использован { $count } раза
    [many] использован { $count } раз
   *[other] использован { $count } раза
}
# The invitation that is copied, to be sent to the one invited: three lines,
# of which this is the first. "join" is the name of the button that joins a shared project.
sharing-invitation = Присоединяйтесь к «{ $project }» в Glaukopis: выберите «{ $join }» и введите
sharing-invitation-server = Сервер: { $server }
sharing-invitation-code = Код: { $code }
sharing-copied = Приглашение скопировано
sharing-copied-detail = Вставьте его в сообщение тому, кого приглашаете.
sharing-invite-failed = Не удалось создать приглашение
sharing-copy-failed = Не удалось скопировать приглашение
sharing-withdraw-failed = Не удалось отозвать приглашение

## Who has the project

sharing-who = У кого есть проект
sharing-list-unreachable = Список на сервере, а он недоступен.
# The owner, when it is not you; only the first letter is shown, in a circle.
sharing-owner = Владелец
sharing-the-owner = Тот, кто им делится
sharing-you = { $name } (вы)
sharing-here = Сейчас здесь
sharing-not-here = Сейчас не здесь
# "ago" is how long ago it was: "3 hours ago", "yesterday".
sharing-last-here = В последний раз здесь { $ago }
sharing-remove-member = Убрать { $name }
sharing-none-joined = Пока никто не присоединился.
sharing-remove-title = Убрать { $name }?
sharing-remove-message = { $name } сохраняет проект таким, какой он сейчас, и больше не получает того, что пишется после этого.
sharing-remove-failed = Не удалось убрать { $name }
# What the others see you called, when you have not given a name.
sharing-name-owner = Владелец
sharing-name-member = Участник
# The others who have the project open, shown by their initials.
sharing-present = Сейчас здесь: { $names }
sharing-is-here = { $name } здесь

## Ending the sharing

sharing-stop = Перестать делиться
sharing-stop-title = Перестать делиться этим проектом?
sharing-stop-message = Проект убирается с сервера. Вы и все, с кем вы им поделились, сохраняете его таким, какой он сейчас, каждый у себя.
sharing-stopped = Проект больше не совместный
sharing-leave = Покинуть
sharing-leave-project = Покинуть проект
sharing-leave-title = Покинуть этот проект?
sharing-leave-message = Проект остаётся у вас таким, какой он сейчас. Вы больше не получаете того, что пишут остальные, а они — того, что пишете вы.
sharing-left = Вы покинули проект
sharing-untold-title = Не удалось сообщить серверу
# "error" is what went wrong, as it was told.
sharing-untold-message = { $error } Вы всё равно можете прекратить совместную работу на этом компьютере; проект тогда остаётся на сервере, пока ему не удастся сообщить.
sharing-end-here = Прекратить здесь
sharing-keep = Продолжать делиться
sharing-end-failed = Не удалось прекратить совместную работу

## Joining a shared project

sharing-join-title = Присоединиться к совместному проекту
sharing-join-about = С сервером и кодом, которые вам прислали
sharing-code = Код
sharing-your-name-join-hint = Показывается остальным в проекте.
sharing-join = Присоединиться
sharing-joining = Присоединение…
sharing-failed = Не получилось.
