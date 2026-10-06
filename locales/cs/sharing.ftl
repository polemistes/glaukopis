# Sharing a project through a server, and joining one that is shared.

## Before the project is shared

sharing-share-title = Sdílet tento projekt
sharing-lead = Ostatní pak mohou na projektu pracovat s vámi, současně, přes server. Zůstane i ve vašem počítači a lze na něm pracovat i bez serveru.
sharing-server = Server
sharing-unreachable = Server je nedostupný.
sharing-unencrypted = Co se tomuto serveru posílá, není cestou šifrováno. Používejte ho v síti, které důvěřujete.
sharing-password = Heslo serveru
sharing-password-hint = Žádá se od těch, kdo přes něj sdílejí projekty. Ti, které pozvete, žádné nepotřebují.
sharing-your-name = Vaše jméno
sharing-your-name-hint = Zobrazuje se těm, s nimiž projekt sdílíte.
sharing-your-name-placeholder = Jak vás ostatní znají
sharing-share = Sdílet
sharing-sharing = Sdílí se…
sharing-share-failed = Projekt nelze sdílet.

## While it is shared

sharing-shared-title = Sdílený projekt
# Under the title: the server the project is shared through.
sharing-through = Přes { $server }
sharing-connected = Připojeno. Co se napíše, mají ostatní hned.
sharing-connecting = Připojuje se…
sharing-offline = Server je nedostupný. Co píšete, se uchovává zde a odešle se, až to půjde.
sharing-too-large = Server nepřijímá poslední změny: s nimi by byl projekt větší, než server uchovává. Jsou uchovány zde. Kdo server spravuje, může povolit větší projekty.
sharing-your-name-seen = Jak vás vidí ostatní.

## Invitations

sharing-invite = Pozvat
sharing-code-label = Kód pozvánky
sharing-copy = Kopírovat pozvánku
sharing-copied-button = Zkopírováno
# "join" is the name of the button that joins a shared project, in italics;
# "expires" says for whom and how long the code is good: sharing-for-one and those below it.
sharing-invite-hint = Pošlete ji tomu, koho zvete; zvolí { $join } a zadá server a kód. Platí { $expires }.
sharing-make-code = Vytvořit kód pozvánky
sharing-make-another = Vytvořit další kód
sharing-options = Volby
sharing-fewer-options = Méně voleb
sharing-for = Pro
sharing-one-person = Jednu osobu
sharing-several-people = Více osob
sharing-good-for = Platí
sharing-a-day = Den
sharing-a-week = Týden
sharing-a-month = Měsíc
sharing-until-withdrawn = Do odvolání
sharing-withdraw = Odvolat
# What is said of a code that was made before, in a list with a dot between:
# "made yesterday · for one person · 6 days left · used once". $when: as `ago` writes it.
sharing-made = vytvořen { $when }
sharing-codes-once = Kód se zobrazí jednou, při vytvoření: server si z něj uchovává jen tolik, aby ho poznal. Chcete-li ho poslat znovu, vytvořte nový.
sharing-for-several = pro více osob
sharing-for-one = pro jednu osobu
sharing-for-more = { $count ->
    [one] pro { $count } další
    [few] pro { $count } další
   *[other] pro { $count } dalších
}
sharing-hours-left = zbývá { $count } h
sharing-days-left = { $count ->
    [one] zbývá { $count } den
    [few] zbývají { $count } dny
   *[other] zbývá { $count } dní
}
sharing-used = { $count ->
    [one] použit jednou
    [few] použit { $count }krát
   *[other] použit { $count }krát
}
# The invitation that is copied, to be sent to the one invited: three lines,
# of which this is the first. "join" is the name of the button that joins a shared project.
sharing-invitation = Připojte se k „{ $project }“ v Glaukopis: zvolte „{ $join }“ a zadejte
sharing-invitation-server = Server: { $server }
sharing-invitation-code = Kód: { $code }
sharing-copied = Pozvánka byla zkopírována
sharing-copied-detail = Vložte ji do zprávy tomu, koho zvete.
sharing-invite-failed = Pozvánku nelze vytvořit
sharing-copy-failed = Pozvánku nelze zkopírovat
sharing-withdraw-failed = Pozvánku nelze odvolat

## Who has the project

sharing-who = Kdo má projekt
sharing-list-unreachable = Seznam je na serveru, který je nedostupný.
# The owner, when it is not you; only the first letter is shown, in a circle.
sharing-owner = Vlastník
sharing-the-owner = Ten, kdo ho sdílí
sharing-you = { $name } (vy)
sharing-here = Teď zde
sharing-not-here = Teď nepřítomen
# "ago" is how long ago it was: "3 hours ago", "yesterday".
sharing-last-here = Naposledy zde { $ago }
sharing-remove-member = Odebrat { $name }
sharing-none-joined = Zatím se nikdo nepřipojil.
sharing-remove-title = Odebrat { $name }?
sharing-remove-message = { $name } si ponechá projekt, jak je teď, a už nebude dostávat, co se napíše potom.
sharing-remove-failed = { $name } nelze odebrat
# What the others see you called, when you have not given a name.
sharing-name-owner = Vlastník
sharing-name-member = Spolupracovník
# The others who have the project open, shown by their initials.
sharing-present = Teď zde: { $names }
sharing-is-here = { $name } je zde

## Ending the sharing

sharing-stop = Ukončit sdílení
sharing-stop-title = Ukončit sdílení tohoto projektu?
sharing-stop-message = Projekt se odebere ze serveru. Vy i všichni, s nimiž jste ho sdíleli, si ho ponecháte, jak je teď, každý sám.
sharing-stopped = Projekt už není sdílen
sharing-leave = Odejít
sharing-leave-project = Odejít z projektu
sharing-leave-title = Odejít z tohoto projektu?
sharing-leave-message = Projekt si ponecháte, jak je teď. Už nebudete dostávat, co píší ostatní, ani oni, co píšete vy.
sharing-left = Odešli jste z projektu
sharing-untold-title = Server nelze uvědomit
# "error" is what went wrong, as it was told.
sharing-untold-message = { $error } Sdílení můžete přesto ukončit v tomto počítači; projekt pak zůstane na serveru, dokud ho nepůjde uvědomit.
sharing-end-here = Ukončit zde
sharing-keep = Dál sdílet
sharing-end-failed = Sdílení nelze ukončit

## Joining a shared project

sharing-join-title = Připojit se ke sdílenému projektu
sharing-join-about = Se serverem a kódem, které jste dostali
sharing-code = Kód
sharing-your-name-join-hint = Zobrazuje se ostatním v projektu.
sharing-join = Připojit se
sharing-joining = Připojuje se…
sharing-failed = To se nepodařilo.
