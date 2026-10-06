# What the core says of sharing projects through a server, in English.
# See locales/README.md.

## The address of a server, as it was typed.

core-sharing-enter-address = Escriba la dirección del servidor.
core-sharing-no-spaces = La dirección de un servidor no lleva espacios.
# The scheme is what was typed before "://".
core-sharing-scheme = A un servidor se llega por http o https, no por «{ $scheme }».
core-sharing-not-an-address = Eso no parece la dirección de un servidor.
core-sharing-no-server = No hay ningún servidor de Glaukopis en { $host }. Compruebe la dirección con quien se la dio.
core-sharing-no-answer-behind = { $host } existe, pero el servidor que hay detrás no responde
core-sharing-newer = El servidor es más nuevo que esta versión de Glaukopis, que hay que actualizar para usarlo.

## What the server refuses, by its kind.

core-sharing-no-room = El proyecto ya no está en el servidor.
core-sharing-not-admitted = El servidor ya no admite esta copia del proyecto.
core-sharing-not-owner = Solo quien comparte el proyecto puede hacer esto.
core-sharing-bad-code = El código no es válido. Puede estar mal escrito, haberse usado ya, haberse retirado o haber caducado.
core-sharing-exists = El proyecto ya está en el servidor.
core-sharing-full = El servidor ya tiene todos los proyectos que admite.
core-sharing-password-asked = Este servidor pide una contraseña a quienes comparten proyectos a través de él.
core-sharing-password-wrong = La contraseña no es la que pide el servidor.
core-sharing-too-many = Se han hecho demasiados intentos desde aquí. Inténtelo de nuevo dentro de diez minutos.
core-sharing-no-file = El servidor no tiene la imagen.
core-sharing-server-error = { $host } respondió con un error.

## What the server says in its own words, which are English, where the
## application knows them.

core-sharing-no-name = El proyecto no tiene nombre.
core-sharing-bad-id = El identificador del proyecto no es uno que el servidor pueda usar.
core-sharing-many-invitations = Ya hay cincuenta invitaciones abiertas; retire algunas.
core-sharing-no-collaborator = No hay tal colaborador.
core-sharing-not-whole = El archivo no llegó entero.
# The most is in the server's words: "25 MB".
core-sharing-file-too-large = El archivo es más grande de lo que admite este servidor: un archivo puede ocupar { $most } como máximo.
core-sharing-project-full = No hay sitio para el archivo: en este servidor, los archivos de un proyecto pueden ocupar juntos { $most } como máximo.

## The pictures of the figures, which are sent and fetched one by one.

core-sharing-picture-too-large = { $host } no admite una imagen tan grande como esta.
core-sharing-picture-larger = Una imagen es más grande de lo que admite { $host } ({ $most } MB como máximo), y no llega a los demás.
core-sharing-picture-not-sent = No se pudo enviar una imagen: { $error }.
core-sharing-picture-not-fetched = No se pudo obtener una imagen: { $error }.

## Publishing and joining.

core-sharing-shared-already = El proyecto ya está compartido.
core-sharing-own-code = El código es de «{ $name }», que se comparte desde este equipo: ya lo tiene.
