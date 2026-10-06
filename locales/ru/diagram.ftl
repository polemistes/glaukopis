# A map as a diagram: the elements on a canvas, their branches and associations.

diagram-map = Карта
diagram-idea = Название
diagram-new-loose = Новый свободный элемент здесь
diagram-new-loose-hint = Мысль, у которой пока нет места
diagram-show-all = Показать всю карту
diagram-tidy = Прибрать всю карту
diagram-tidy-hint = Каждый элемент возвращается на своё автоматическое место
# The keys are shown as keys, where the variables stand.
diagram-hint-empty = { $tab } добавляет элемент под выделенным · { $enter } — рядом с ним · двойной щелчок — писать
diagram-hint-linking = Щёлкните элемент, с которым связать, или перейдите к нему стрелками и нажмите { $enter } · { $esc } — выйти
diagram-show-under = Показать, что под ним
diagram-hide-under = Скрыть, что под ним
diagram-link-handle = Перетащите к другому элементу, чтобы связать их

## The view

diagram-view = Масштаб
diagram-zoom-out = Уменьшить
diagram-zoom-in = Увеличить
diagram-actual-size = Настоящий размер
# How large the map is shown, in hundredths of its size.
diagram-zoom = { $percent }%

## Copying and pasting elements.

diagram-copied = { $count ->
    [one] Скопирован { $count } элемент со всем, что под ним
    [few] Скопированы { $count } элемента со всем, что под ними
    [many] Скопировано { $count } элементов со всем, что под ними
   *[other] Скопированы { $count } элемента со всем, что под ними
}
diagram-nothing-copied = Пока ничего не скопировано
diagram-pasted-elsewhere = Скопированное — из другого проекта, и сюда его вставить нельзя
