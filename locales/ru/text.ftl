# A map as text: the elements one after another, each a heading and its text.

text-title = Заглавие
text-name = Название элемента
text-first-section = Пишите здесь или нажмите Ctrl+Enter, чтобы начать первый раздел.
text-not-printed = не печатается
text-grip = Переместить или изменить этот элемент
# The map an element stands for, which is shown in bold where the variable stands.
text-include = В документе здесь стоит карта { $map }.
text-include-open = Открыть её
text-loose = Свободные элементы
text-loose-hint = Мысли, у которых пока нет места. Они не входят в документ.
text-split = Разделить здесь
text-split-hint = То, что после курсора, становится новым элементом
text-join = Присоединить к элементу выше

## Folding away what is under an element, and its text

text-open = Развернуть
text-fold = Свернуть
text-open-shift = Развернуть · с Shift — и всё свёрнутое под ним
text-fold-hint = Свернуть его текст и то, что под ним
text-fold-shift = Свернуть его текст и то, что под ним · с Shift — развернуть всё свёрнутое под ним
text-open-all = Развернуть всё
text-open-all-under = Развернуть всё свёрнутое под ним
text-fold-all-under = Свернуть всё под ним
text-fold-all-under-hint = Из того, что прямо под ним, показаны названия, и ничего глубже
# What is folded away, in its place: whether the element's own text is (text is
# "yes" or "no"), how many elements under it, and how many words in all, which
# may be none.
text-folded = { $text ->
    [yes] { $parts ->
        [0] Его текст свёрнут
        [one] Свёрнуты его текст и { $parts } элемент
        [few] Свёрнуты его текст и { $parts } элемента
        [many] Свёрнуты его текст и { $parts } элементов
       *[other] Свёрнуты его текст и { $parts } элемента
    }
   *[no] { $parts ->
        [one] Свёрнут { $parts } элемент
        [few] Свёрнуты { $parts } элемента
        [many] Свёрнуто { $parts } элементов
       *[other] Свёрнуты { $parts } элемента
    }
}{ $words ->
    [0] {""}
    [one] , { $words } слово
    [few] , { $words } слова
    [many] , { $words } слов
   *[other] , { $words } слова
}

## Associations, in the margin

text-associations = Связи
text-outline = Структура
text-outline-between = Между структурой и текстом
text-outline-fold = Свернуть то, что под ним
text-outline-open = Развернуть то, что под ним
text-go-to = Перейти к «{ $name }»
text-add-label = Добавить подпись…
text-change-label = Изменить подпись…
text-remove-association = Убрать связь
text-hint-linking = Щёлкните название элемента, с которым связать · { $esc } — выйти

## Under the text

text-notes = { $count ->
    [one] { $count } сноска
    [few] { $count } сноски
    [many] { $count } сносок
   *[other] { $count } сноски
}
# The keys are shown as keys, where the variables stand.
text-keys = { $alt }+{ $enter } новый элемент · { $alt }+{ $shift }+{ $enter } под ним · { $at } сослаться
