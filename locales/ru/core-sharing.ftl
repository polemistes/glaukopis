# What the core says of sharing projects through a server, in English.
# See locales/README.md.

## The address of a server, as it was typed.

core-sharing-enter-address = Введите адрес сервера.
core-sharing-no-spaces = В адресе сервера не бывает пробелов.
# The scheme is what was typed before "://".
core-sharing-scheme = К серверу обращаются по http или https, а не по «{ $scheme }».
core-sharing-not-an-address = Это не похоже на адрес сервера.
core-sharing-no-server = По адресу { $host } нет сервера Glaukopis. Сверьте адрес с тем, кто вам его дал.
core-sharing-no-answer-behind = { $host } есть, но сервер за ним не отвечает
core-sharing-newer = Сервер новее этой версии Glaukopis; чтобы работать с ним, её нужно обновить.

## What the server refuses, by its kind.

core-sharing-no-room = Проекта больше нет на сервере.
core-sharing-not-admitted = Сервер больше не принимает эту копию проекта.
core-sharing-not-owner = Это может сделать только тот, кто открыл проект другим.
core-sharing-bad-code = Код недействителен. Возможно, в нём опечатка, он уже использован, отозван или его срок истёк.
core-sharing-exists = Проект уже есть на сервере.
core-sharing-full = На сервере столько проектов, сколько он может вместить.
core-sharing-password-asked = Этот сервер просит пароль у тех, кто открывает через него проекты.
core-sharing-password-wrong = Пароль не тот, которого просит сервер.
core-sharing-too-many = Отсюда было слишком много попыток. Попробуйте снова через десять минут.
core-sharing-no-file = На сервере нет этого изображения.
core-sharing-server-error = { $host } ответил ошибкой.

## What the server says in its own words, which are English, where the
## application knows them.

core-sharing-no-name = У проекта нет названия.
core-sharing-bad-id = Идентификатор проекта не из тех, какие может использовать сервер.
core-sharing-many-invitations = Открытых приглашений уже пятьдесят; отзовите часть.
core-sharing-no-collaborator = Такого участника нет.
core-sharing-not-whole = Файл пришёл не целиком.
# The most is in the server's words: "25 MB".
core-sharing-file-too-large = Файл больше, чем принимает этот сервер: один файл может быть не больше { $most }.
core-sharing-project-full = Для файла нет места: файлы одного проекта на этом сервере могут занимать вместе не больше { $most }.

## The pictures of the figures, which are sent and fetched one by one.

core-sharing-picture-too-large = { $host } не принимает таких больших изображений.
core-sharing-picture-larger = Изображение больше, чем принимает { $host } (не больше { $most } МБ), и до остальных не доходит.
core-sharing-picture-not-sent = Не удалось отправить изображение: { $error }.
core-sharing-picture-not-fetched = Не удалось получить изображение: { $error }.

## Publishing and joining.

core-sharing-shared-already = Проект уже открыт другим.
core-sharing-own-code = Код — для проекта «{ $name }», который открыт с этого компьютера: он у вас уже есть.
