# Sharing a project through a server, and joining one that is shared.

## Before the project is shared

sharing-share-title = Partajează acest proiect
sharing-lead = Alții pot lucra atunci la proiect împreună cu dumneavoastră, în același timp, printr-un server. Rămâne și pe calculatorul dumneavoastră și se poate lucra la el fără server.
sharing-server = Server
sharing-unreachable = Serverul nu a putut fi atins.
sharing-unencrypted = Ce se trimite la acest server nu este criptat pe drum. Folosiți-l într-o rețea în care aveți încredere.
sharing-password = Parola serverului
sharing-password-hint = Cerută celor care partajează proiecte prin el. Cei pe care îi invitați nu au nevoie de ea.
sharing-your-name = Numele dumneavoastră
sharing-your-name-hint = Arătat celor cu care partajați proiectul.
sharing-your-name-placeholder = Cum vă știu ceilalți
sharing-share = Partajează
sharing-sharing = Se partajează…
sharing-share-failed = Proiectul nu s-a putut partaja.

## While it is shared

sharing-shared-title = Proiect partajat
# Under the title: the server the project is shared through.
sharing-through = Prin { $server }
sharing-connected = Conectat. Ce se scrie ajunge îndată la ceilalți.
sharing-connecting = Se conectează…
sharing-offline = Serverul nu poate fi atins. Ce scrieți se păstrează aici și se trimite când se va putea.
sharing-too-large = Serverul nu primește ultimele modificări: cu ele proiectul ar fi mai mare decât ține el. Se păstrează aici. Cine administrează serverul poate îngădui proiecte mai mari.
sharing-your-name-seen = Cum vă văd ceilalți.

## Invitations

sharing-invite = Invită
sharing-code-label = Cod de invitație
sharing-copy = Copiază invitația
sharing-copied-button = Copiată
# "join" is the name of the button that joins a shared project, in italics;
# "expires" says for whom and how long the code is good: sharing-for-one and those below it.
sharing-invite-hint = Trimiteți-l celui pe care îl invitați, care alege { $join } și introduce serverul și codul. Este { $expires }.
sharing-make-code = Fă un cod de invitație
sharing-make-another = Fă alt cod
sharing-options = Opțiuni
sharing-fewer-options = Mai puține opțiuni
sharing-for = Pentru
sharing-one-person = O persoană
sharing-several-people = Mai multe persoane
sharing-good-for = Valabil
sharing-a-day = O zi
sharing-a-week = O săptămână
sharing-a-month = O lună
sharing-until-withdrawn = Până este retras
sharing-withdraw = Retrage
# What is said of a code that was made before, in a list with a dot between:
# "made yesterday · for one person · 6 days left · used once". $when: as `ago` writes it.
sharing-made = făcut { $when }
sharing-codes-once = Un cod se arată o singură dată, când este făcut: serverul nu păstrează din el mai mult decât îi trebuie ca să-l recunoască. Ca să trimiteți unul din nou, faceți altul nou.
sharing-for-several = pentru mai mulți
sharing-for-one = pentru o persoană
sharing-for-more = pentru încă { $count }
sharing-hours-left = { $count } h rămase
sharing-days-left = { $count ->
    [one] { $count } zi rămasă
    [few] { $count } zile rămase
   *[other] { $count } de zile rămase
}
sharing-used = { $count ->
    [one] folosit o dată
    [few] folosit de { $count } ori
   *[other] folosit de { $count } de ori
}
# The invitation that is copied, to be sent to the one invited: three lines,
# of which this is the first. "join" is the name of the button that joins a shared project.
sharing-invitation = Alăturați-vă proiectului „{ $project }” în Glaukopis: alegeți „{ $join }” și introduceți
sharing-invitation-server = Server: { $server }
sharing-invitation-code = Cod: { $code }
sharing-copied = Invitația a fost copiată
sharing-copied-detail = Lipiți-o într-un mesaj către cel pe care îl invitați.
sharing-invite-failed = Invitația nu s-a putut face
sharing-copy-failed = Invitația nu s-a putut copia
sharing-withdraw-failed = Invitația nu s-a putut retrage

## Who has the project

sharing-who = Cine are proiectul
sharing-list-unreachable = Lista este la server, care nu poate fi atins.
# The owner, when it is not you; only the first letter is shown, in a circle.
sharing-owner = Proprietar
sharing-the-owner = Cel care îl partajează
sharing-you = { $name } (dumneavoastră)
sharing-here = Aici acum
sharing-not-here = Nu este aici acum
# "ago" is how long ago it was: "3 hours ago", "yesterday".
sharing-last-here = Ultima dată aici { $ago }
sharing-remove-member = Scoate pe { $name }
sharing-none-joined = Nimeni nu s-a alăturat încă.
sharing-remove-title = Scoateți pe { $name }?
sharing-remove-message = { $name } păstrează proiectul așa cum este acum și nu mai primește ce se scrie de acum încolo.
sharing-remove-failed = { $name } nu s-a putut scoate
# What the others see you called, when you have not given a name.
sharing-name-owner = Proprietarul
sharing-name-member = Un colaborator
# The others who have the project open, shown by their initials.
sharing-present = Aici acum: { $names }
sharing-is-here = { $name } este aici

## Ending the sharing

sharing-stop = Oprește partajarea
sharing-stop-title = Opriți partajarea acestui proiect?
sharing-stop-message = Proiectul se ia de pe server. Dumneavoastră și toți cei cu care l-ați partajat îl păstrați așa cum este acum, fiecare pe cont propriu.
sharing-stopped = Proiectul nu mai este partajat
sharing-leave = Părăsește
sharing-leave-project = Părăsește proiectul
sharing-leave-title = Părăsiți acest proiect?
sharing-leave-message = Păstrați proiectul așa cum este acum. Nu mai primiți ce scriu ceilalți, nici ei ce scrieți dumneavoastră.
sharing-left = Ați părăsit proiectul
sharing-untold-title = Serverului nu i s-a putut spune
# "error" is what went wrong, as it was told.
sharing-untold-message = { $error } Puteți încheia partajarea pe acest calculator oricum; proiectul rămâne atunci pe server până când i se va putea spune.
sharing-end-here = Încheie aici
sharing-keep = Continuă partajarea
sharing-end-failed = Partajarea nu s-a putut încheia

## Joining a shared project

sharing-join-title = Alătură-te unui proiect partajat
sharing-join-about = Cu serverul și codul care v-au fost trimise
sharing-code = Cod
sharing-your-name-join-hint = Arătat celorlalți din proiect.
sharing-join = Alătură-te
sharing-joining = Se alătură…
sharing-failed = Nu a mers.
