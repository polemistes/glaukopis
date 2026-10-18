# The checklist of a document (ADR 0038): what the template requires and
# the tree says, as remarks in the window of the document.

checklist-words = { $count ->
    [one] { $count } slovo; šablona dovoluje nejvýše { $limit }.
    [few] { $count } slova; šablona dovoluje nejvýše { $limit }.
   *[other] { $count } slov; šablona dovoluje nejvýše { $limit }.
}
checklist-abstract-words = { $count ->
    [one] Abstrakt má { $count } slovo; šablona dovoluje nejvýše { $limit }.
    [few] Abstrakt má { $count } slova; šablona dovoluje nejvýše { $limit }.
   *[other] Abstrakt má { $count } slov; šablona dovoluje nejvýše { $limit }.
}
checklist-keywords = { $count ->
    [one] { $count } klíčové slovo; šablona dovoluje nejvýše { $limit }.
    [few] { $count } klíčová slova; šablona dovoluje nejvýše { $limit }.
   *[other] { $count } klíčových slov; šablona dovoluje nejvýše { $limit }.
}
checklist-doubled = { $count ->
    [one] Vedle prvního stojí ještě jeden prvek druhu „{ $kind }“; tiskne se jen první.
    [few] Vedle prvního stojí ještě { $count } další prvky druhu „{ $kind }“; tiskne se jen první.
   *[other] Vedle prvního stojí ještě { $count } dalších prvků druhu „{ $kind }“; tiskne se jen první.
}
checklist-unplaced = { $count ->
    [one] Šablona nevytváří obálku: jeden prvek, jehož druh patří na obálku, se netiskne.
    [few] Šablona nevytváří obálku: { $count } prvky, jejichž druh patří na obálku, se netisknou.
   *[other] Šablona nevytváří obálku: { $count } prvků, jejichž druh patří na obálku, se netiskne.
}
