# Sharing a project through a server, and joining one that is shared.

## Before the project is shared

sharing-share-title = Compartir este proyecto
sharing-lead = Otros podrán entonces trabajar en el proyecto con usted, al mismo tiempo, a través de un servidor. Se queda también en su equipo, y se puede trabajar en él sin el servidor.
sharing-server = Servidor
sharing-unreachable = No se pudo conectar con el servidor.
sharing-unencrypted = Lo que se envía a este servidor no va cifrado por el camino. Úselo en una red de confianza.
sharing-password = Contraseña del servidor
sharing-password-hint = Se pide a quienes comparten proyectos a través de él. Los invitados no la necesitan.
sharing-your-name = Su nombre
sharing-your-name-hint = Se muestra a aquellos con quienes comparte el proyecto.
sharing-your-name-placeholder = Como le conocen los demás
sharing-share = Compartir
sharing-sharing = Compartiendo…
sharing-share-failed = No se pudo compartir el proyecto.

## While it is shared

sharing-shared-title = Proyecto compartido
# Under the title: the server the project is shared through.
sharing-through = A través de { $server }
sharing-connected = Conectado. Lo que se escribe llega a los demás al instante.
sharing-connecting = Conectando…
sharing-offline = No se puede conectar con el servidor. Lo que escriba se guarda aquí, y se envía cuando se pueda.
sharing-too-large = El servidor no admite los últimos cambios: con ellos el proyecto sería más grande de lo que guarda. Se guardan aquí. Quien administra el servidor puede permitir proyectos más grandes.
sharing-your-name-seen = Como le ven los demás.

## Invitations

sharing-invite = Invitar
sharing-code-label = Código de invitación
sharing-copy = Copiar la invitación
sharing-copied-button = Copiado
# "join" is the name of the button that joins a shared project, in italics;
# "expires" says for whom and how long the code is good: sharing-for-one and those below it.
sharing-invite-hint = Envíeselo a quien invite, que elige { $join } y escribe el servidor y el código. Es { $expires }.
sharing-make-code = Hacer un código de invitación
sharing-make-another = Hacer otro código
sharing-options = Opciones
sharing-fewer-options = Menos opciones
sharing-for = Para
sharing-one-person = Una persona
sharing-several-people = Varias personas
sharing-good-for = Válido durante
sharing-a-day = Un día
sharing-a-week = Una semana
sharing-a-month = Un mes
sharing-until-withdrawn = Hasta que se retire
sharing-withdraw = Retirar
# What is said of a code that was made before, in a list with a dot between:
# "made yesterday · for one person · 6 days left · used once". $when: as `ago` writes it.
sharing-made = hecho { $when }
sharing-codes-once = Un código se muestra una sola vez, cuando se hace: el servidor no guarda de él más de lo que necesita para reconocerlo. Para enviar uno de nuevo, haga otro.
sharing-for-several = para varias personas
sharing-for-one = para una persona
sharing-for-more = para { $count } más
sharing-hours-left = quedan { $count } h
sharing-days-left = { $count ->
    [one] queda { $count } día
    [many] quedan { $count } de días
   *[other] quedan { $count } días
}
sharing-used = { $count ->
    [one] usado una vez
    [many] usado { $count } de veces
   *[other] usado { $count } veces
}
# The invitation that is copied, to be sent to the one invited: three lines,
# of which this is the first. "join" is the name of the button that joins a shared project.
sharing-invitation = Únase a «{ $project }» en Glaukopis: elija «{ $join }» y escriba
sharing-invitation-server = Servidor: { $server }
sharing-invitation-code = Código: { $code }
sharing-copied = La invitación se copió
sharing-copied-detail = Péguela en un mensaje a quien invite.
sharing-invite-failed = No se pudo hacer la invitación
sharing-copy-failed = No se pudo copiar la invitación
sharing-withdraw-failed = No se pudo retirar la invitación

## Who has the project

sharing-who = Quién tiene el proyecto
sharing-list-unreachable = La lista está en el servidor, con el que no se puede conectar.
# The owner, when it is not you; only the first letter is shown, in a circle.
sharing-owner = Propietario
sharing-the-owner = Quien lo comparte
sharing-you = { $name } (usted)
sharing-here = Aquí ahora
sharing-not-here = Ahora no está
# "ago" is how long ago it was: "3 hours ago", "yesterday".
sharing-last-here = Última vez aquí { $ago }
sharing-remove-member = Quitar a { $name }
sharing-none-joined = Aún no se ha unido nadie.
sharing-remove-title = ¿Quitar a { $name }?
sharing-remove-message = { $name } conserva el proyecto como está ahora, y ya no recibe lo que se escriba después.
sharing-remove-failed = No se pudo quitar a { $name }
# What the others see you called, when you have not given a name.
sharing-name-owner = El propietario
sharing-name-member = Un colaborador
# The others who have the project open, shown by their initials.
sharing-present = Aquí ahora: { $names }
sharing-is-here = { $name } está aquí

## Ending the sharing

sharing-stop = Dejar de compartir
sharing-stop-title = ¿Dejar de compartir este proyecto?
sharing-stop-message = El proyecto se quita del servidor. Usted y todos aquellos con quienes lo ha compartido lo conservan como está ahora, cada uno por su cuenta.
sharing-stopped = El proyecto ya no está compartido
sharing-leave = Salir
sharing-leave-project = Salir del proyecto
sharing-leave-title = ¿Salir de este proyecto?
sharing-leave-message = Conserva el proyecto como está ahora. Ya no recibirá lo que escriban los demás, ni ellos lo que escriba usted.
sharing-left = Ha salido del proyecto
sharing-untold-title = No se pudo avisar al servidor
# "error" is what went wrong, as it was told.
sharing-untold-message = { $error } Puede terminar de todos modos el uso compartido en este equipo; el proyecto se queda entonces en el servidor hasta que se le pueda avisar.
sharing-end-here = Terminarlo aquí
sharing-keep = Seguir compartiendo
sharing-end-failed = No se pudo terminar el uso compartido

## Joining a shared project

sharing-join-title = Unirse a un proyecto compartido
sharing-join-about = Con el servidor y el código que le enviaron
sharing-code = Código
sharing-your-name-join-hint = Se muestra a los demás en el proyecto.
sharing-join = Unirse
sharing-joining = Uniéndose…
sharing-failed = Eso no funcionó.
