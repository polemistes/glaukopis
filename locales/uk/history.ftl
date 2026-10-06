# The full history of a project, in English.
# See locales/README.md.

history-title = Історія
history-between = Між мапами та історією
history-settings = Налаштування історії
history-failed = Не вдалося прочитати історію.
history-reading = Читання історії…

## When it is not kept

history-off = Історія цього проєкту не ведеться.
history-on-word = Кожна зміна зберігається
history-off-word = Не ведеться
history-off-about = Поки історія ведеться, зберігається кожна зміна, з тим, хто й коли її зробив: проєкт можна побачити таким, яким він був будь-якої миті, і повернути. Це займає місце, а в спільному проєкті показує іншим, хто що й коли написав.
history-turn-on = Вести історію

## The moments

# Someone whose name the history does not know.
history-someone = Хтось
history-began = Історія починається
# The time a session began and ended.
history-span = { $from } – { $to }
# Older history that was merged, so that moments within it are gone.
history-merged = збережено менш докладно
history-added = { $count ->
    [one] +{ $count } знак
    [few] +{ $count } знаки
    [many] +{ $count } знаків
   *[other] +{ $count } знака
}
history-removed = { $count ->
    [one] −{ $count } знак
    [few] −{ $count } знаки
    [many] −{ $count } знаків
   *[other] −{ $count } знака
}

## The map as it was

history-back = Назад до теперішнього
history-as-it-was = Як було { $when }
history-marked = Те, що змінилося від попередньої миті, позначено кольором того, хто змінив.
history-map-not-there = Цієї мапи тоді ще не було.
history-added-by = Додано: { $name }
history-removed-by = Вилучено: { $name }
history-changed-by = Змінено: { $name }
# A cross-reference to a figure, a table or a part, where it is not known what it said.
history-pointer = посилання
history-name-moment = Назвати цю мить
history-name-placeholder = Як її назвати
history-named = Мить названо «{ $name }».
history-bring-back-element = Повернути цей елемент таким, як був
history-bring-back-map = Повернути мапу такою, як була
history-brought-back = Повернуто як було. Ctrl+Z скасовує це.
history-bring-back-failed = Не вдалося повернути.
history-open-copy = Відкрити як окремий проєкт
history-copy-name = { $name }, як було { $day }
history-copy-failed = Не вдалося створити проєкт.

## Archives

history-open-archive = Відкрити архів…
history-archive-kind = Історія Glaukopis
history-archive-unread = Не вдалося прочитати архів.
history-archive-of = Архів: { $name }
history-archive-close = Закрити

## Settings

history-keep = Вести історію
history-room = Історія займає { $size }.
history-turn-off-title = Перестати вести історію?
history-turn-off-message = Збережене видаляється. Сам проєкт залишається як є.
history-turn-off-shared = Збережене видаляється, тут і на компʼютерах тих, з ким проєкт спільний. Сам проєкт залишається як є.
history-turn-off = Видалити історію
history-finely = Давніша історія
history-finely-about = Давніші зміни зливаються, щоб займати менше місця й читатися швидше; миті всередині них тоді вже не розрізнити. Названі миті й ті, з якими порівнює перегляд змін, зберігаються.
history-hourly = Зливати кожну годину в одну після
history-weeks = { $count ->
    [one] тижня
    [few] тижнів
    [many] тижнів
   *[other] тижня
}
history-daily = Зливати кожен день в один після
history-months = { $count ->
    [one] місяця
    [few] місяців
    [many] місяців
   *[other] місяця
}
history-before = Що було раніше
history-before-choose = Виберіть мить в історії, щоб заархівувати або видалити те, що було до неї.
history-before-about = Історію до { $when } можна заархівувати у файл, щоб переглянути пізніше, або видалити.
history-archive = Архівувати…
history-delete = Видалити
history-archive-title = Заархівувати історію до { $when }?
history-delete-title = Видалити історію до { $when }?
history-cut-message = Те, що лишається, починається з проєкту, яким він був тоді.
history-cut-kept = { $count ->
    [one] Перед нею є { $count } названа або переглянута мить, яку тут більше не можна буде побачити.
    [few] Перед нею є { $count } названі або переглянуті миті, яких тут більше не можна буде побачити.
    [many] Перед нею є { $count } названих або переглянутих митей, яких тут більше не можна буде побачити.
   *[other] Перед нею є { $count } названої або переглянутої миті, яких тут більше не можна буде побачити.
}
history-cut-not-here = Історію не можна відтяти перед цією миттю.
history-cut-failed = Не вдалося відтяти історію.
history-archive-until = до { $when }
history-archived = Історію до { $when } заархівовано.
history-deleted = Історію до { $when } видалено.
