# Sharing a project through a server, and joining one that is shared.

## Before the project is shared

sharing-share-title = Partilhar este projeto
sharing-lead = Outros podem então trabalhar no projeto consigo, ao mesmo tempo, através de um servidor. Fica também no seu computador, e pode trabalhar-se nele sem o servidor.
sharing-server = Servidor
sharing-unreachable = Não foi possível chegar ao servidor.
sharing-unencrypted = O que se envia a este servidor não vai cifrado pelo caminho. Use-o numa rede de confiança.
sharing-password = Palavra-passe do servidor
sharing-password-hint = Pedida a quem partilha projetos através dele. Os convidados não precisam de nenhuma.
sharing-your-name = O seu nome
sharing-your-name-hint = Mostrado àqueles com quem partilha o projeto.
sharing-your-name-placeholder = Como os outros o conhecem
sharing-share = Partilhar
sharing-sharing = A partilhar…
sharing-share-failed = Não foi possível partilhar o projeto.

## While it is shared

sharing-shared-title = Projeto partilhado
# Under the title: the server the project is shared through.
sharing-through = Através de { $server }
sharing-connected = Ligado. O que se escreve fica logo com os outros.
sharing-connecting = A ligar…
sharing-offline = Não é possível chegar ao servidor. O que escrever fica guardado aqui, e segue quando for possível.
sharing-too-large = O servidor não aceita as últimas alterações: com elas o projeto ficaria maior do que ele guarda. Ficam guardadas aqui. Quem gere o servidor pode deixar os projetos ser maiores.
sharing-your-name-seen = Como os outros o veem.

## Invitations

sharing-invite = Convidar
sharing-code-label = Código de convite
sharing-copy = Copiar o convite
sharing-copied-button = Copiado
# "join" is the name of the button that joins a shared project, in italics;
# "expires" says for whom and how long the code is good: sharing-for-one and those below it.
sharing-invite-hint = Envie-o a quem convida, que escolhe { $join } e escreve o servidor e o código. É { $expires }.
sharing-make-code = Criar um código de convite
sharing-make-another = Criar outro código
sharing-options = Opções
sharing-fewer-options = Menos opções
sharing-for = Para
sharing-one-person = Uma pessoa
sharing-several-people = Várias pessoas
sharing-good-for = Válido por
sharing-a-day = Um dia
sharing-a-week = Uma semana
sharing-a-month = Um mês
sharing-until-withdrawn = Até ser retirado
sharing-withdraw = Retirar
# What is said of a code that was made before, in a list with a dot between:
# "made yesterday · for one person · 6 days left · used once". $when: as `ago` writes it.
sharing-made = criado { $when }
sharing-codes-once = Um código mostra-se uma vez, quando é criado: o servidor não guarda dele mais do que precisa para o reconhecer. Para enviar um de novo, crie outro.
sharing-for-several = para vários
sharing-for-one = para uma pessoa
sharing-for-more = para mais { $count }
sharing-hours-left = faltam { $count } h
sharing-days-left = { $count ->
    [one] falta { $count } dia
    [many] faltam { $count } dias
   *[other] faltam { $count } dias
}
sharing-used = { $count ->
    [one] usado uma vez
    [many] usado { $count } vezes
   *[other] usado { $count } vezes
}
# The invitation that is copied, to be sent to the one invited: three lines,
# of which this is the first. "join" is the name of the button that joins a shared project.
sharing-invitation = Junte-se a «{ $project }» no Glaukopis: escolha «{ $join }» e escreva
sharing-invitation-server = Servidor: { $server }
sharing-invitation-code = Código: { $code }
sharing-copied = O convite foi copiado
sharing-copied-detail = Cole-o numa mensagem para quem convida.
sharing-invite-failed = Não foi possível criar o convite
sharing-copy-failed = Não foi possível copiar o convite
sharing-withdraw-failed = Não foi possível retirar o convite

## Who has the project

sharing-who = Quem tem o projeto
sharing-list-unreachable = A lista está no servidor, a que não é possível chegar.
# The owner, when it is not you; only the first letter is shown, in a circle.
sharing-owner = Dono
sharing-the-owner = Quem o partilha
sharing-you = { $name } (eu)
sharing-here = Presente
sharing-not-here = Ausente
# "ago" is how long ago it was: "3 hours ago", "yesterday".
sharing-last-here = Última vez aqui { $ago }
sharing-remove-member = Remover { $name }
sharing-none-joined = Ainda ninguém se juntou.
sharing-remove-title = Remover { $name }?
sharing-remove-message = { $name } fica com o projeto como está agora, e deixa de receber o que se escrever depois disto.
sharing-remove-failed = Não foi possível remover { $name }
# What the others see you called, when you have not given a name.
sharing-name-owner = O dono
sharing-name-member = Um colaborador
# The others who have the project open, shown by their initials.
sharing-present = Presentes: { $names }
sharing-is-here = { $name } está aqui

## Ending the sharing

sharing-stop = Deixar de partilhar
sharing-stop-title = Deixar de partilhar este projeto?
sharing-stop-message = O projeto é tirado do servidor. Fica consigo e com todos com quem o partilhou, como está agora, cada um por si.
sharing-stopped = O projeto já não está partilhado
sharing-leave = Sair
sharing-leave-project = Sair do projeto
sharing-leave-title = Sair deste projeto?
sharing-leave-message = Fica com o projeto como está agora. Deixa de receber o que os outros escrevem, e eles o que escreve.
sharing-left = Saiu do projeto
sharing-untold-title = Não foi possível avisar o servidor
# "error" is what went wrong, as it was told.
sharing-untold-message = { $error } Pode mesmo assim terminar a partilha neste computador; o projeto fica então no servidor até ser possível avisá-lo.
sharing-end-here = Terminar aqui
sharing-keep = Continuar a partilhar
sharing-end-failed = Não foi possível terminar a partilha

## Joining a shared project

sharing-join-title = Juntar-se a um projeto partilhado
sharing-join-about = Com o servidor e o código que lhe enviaram
sharing-code = Código
sharing-your-name-join-hint = Mostrado aos outros no projeto.
sharing-join = Juntar-se
sharing-joining = A juntar-se…
sharing-failed = Isso não resultou.
