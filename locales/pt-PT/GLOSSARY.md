# As palavras do Glaukopis em português europeu (pt-PT)

Escolhas feitas para a tradução da interface em português de Portugal.
Correspondem, termo a termo, a `locales/GLOSSARY.md`; leia-o primeiro.
Uma palavra escolhida aqui é usada sempre, em todos os ficheiros.

## A forma de tratamento

- **Impessoal e formal**, como o software em português europeu: nunca
  «você», nunca «tu». O escritor é tratado o menos possível.
- **Comandos no infinitivo**: botões, itens de menu, separadores e
  comandos da paleta (Guardar, Fechar, Mudar o nome, Trazer um
  documento…).
- **Instruções ao escritor no imperativo de terceira pessoa, sem
  pronome**: «Selecione algum texto e prima Ctrl+Alt+C», «Escolha um
  formato». Nunca «Seleciona», nunca «você seleciona».
- **Possessivos evitados**: «a biblioteca», «as palavras próprias», não
  «a sua biblioteca». Onde um possessivo é inevitável, «o seu / a sua».
- **O programa fala na terceira pessoa**: «O Glaukopis não encontrou…»,
  «O ficheiro não se lê».
- **Pronomes átonos** à portuguesa: ênclise na frase afirmativa
  («Envia-o», «guardou-se»), próclise depois de preposição ou negação
  («para o mostrar», «não o encontra»).

## Ortografia e tipografia

- Acordo Ortográfico, na norma de Portugal: projeto, aspeto, seleção,
  coleção, ação, direção, objeto, atual; mas facto, contacto, secção,
  carácter, receção, perspetiva.
- Léxico de Portugal: ficheiro, pasta, ecrã, rato, guardar, eliminar,
  anular, definições, partilhar, transferir (descarregar), carregar
  (enviar), registar, equipa, utilizador, pré-visualização.
- Aspas angulares «…» onde o inglês escreve “…” à volta de um nome; aspas
  curvas “…” só dentro de outras aspas.
- Reticências com o carácter «…». Travessão «—» para apartes; o hífen
  não o substitui.
- Números, datas e horas são escritos pelo programa; `{ $count }` fica
  onde está.

## Teclas

Como o teclado português as escreve: Ctrl, Shift, Alt, AltGr, Enter, Esc,
Tab, Delete, Backspace, Home, End, Page Up, Page Down; a tecla de espaço
é «Espaço»; as setas são «seta para cima / para baixo / para a esquerda
/ para a direita». Em macOS: Cmd, Opção.

## Formas de plural

O português europeu tem, para `{ $count -> … }`, as formas `one`, `many`
e `other`; a verificação exige as três. `many` só vale para milhões
redondos e o programa escreve o número em algarismos, por isso a linha
`[many]` repete o texto de `*[other]`.

```ftl
kinds-elements = { $count ->
    [one] { $count } elemento
    [many] { $count } elementos
   *[other] { $count } elementos
}
```

`[0]` fica onde o inglês o tem, e acrescenta-se onde o português diz
melhor «nenhum» do que «0».

## O trabalho

| inglês | português |
| --- | --- |
| project | projeto |
| map | mapa |
| element | elemento |
| the centre | o centro |
| the diagram | o diagrama |
| the text | o texto (a vista de texto) |
| passage | passagem |
| kind | tipo (tipo de elemento, de parágrafo, de palavras) |
| look | aspeto |
| format | formato |
| style | estilo (só o estilo de citação) |
| document | documento |
| the manuscript | o manuscrito |
| the preview | a pré-visualização |
| export | exportar, a exportação |
| bring in | trazer (um documento é trazido; só as referências do Zotero se importam) |

## Referências e citações

| inglês | português |
| --- | --- |
| the library | a biblioteca |
| reference | referência |
| work | obra |
| collection | coleção |
| attachment | anexo |
| note | nota |
| citation | citação |
| locator | localizador |
| lookup | consulta (consultar na rede, por DOI, ISBN ou procura) |
| found citations | citações encontradas |
| match | corresponder; a correspondência |

## Palavras e marcas

| inglês | português |
| --- | --- |
| foreign words | palavras estrangeiras |
| title of a work | título de obra |
| term | termo |
| mention | menção |
| highlight | realce; realçar |
| marks | marcas (itálico, negrito, versaletes, sublinhado, expoente, índice, rasurado, código) |
| italics | itálico |
| bold | negrito |
| small capitals | versaletes |
| underline | sublinhado |
| superscript | expoente |
| subscript | índice |
| struck through | rasurado |
| code | código |

## Imagens, figuras, tabelas e fórmulas

| inglês | português |
| --- | --- |
| picture | imagem |
| the store | o acervo (a vista chama-se «Imagens») |
| figure | figura |
| caption | legenda |
| pointer | remissão (remeter para uma figura, tabela, elemento, página) |
| table | tabela |
| formula | fórmula |
| placing | colocação (aqui, no topo, ao lado, flutuante) |
| width | largura |

## Tempo, comentários, histórico

| inglês | português |
| --- | --- |
| timeline | cronologia |
| when | quando |
| comment | comentário; comentar |
| thread | fio |
| settled, resolved | resolvido |
| history | histórico |
| changes | alterações |
| review | revisão; rever |
| accept / reject | aceitar / rejeitar |
| sharing | partilha; partilhar |
| working together | trabalhar em conjunto |
| join | juntar-se a (um projeto partilhado) |
| server | servidor |

## Leitura e verificação

| inglês | português |
| --- | --- |
| spelling | ortografia |
| dictionary | dicionário |
| own words | palavras próprias |
| reading text, OCR | ler o texto; OCR |
| made searchable | tornado pesquisável |
| search | procurar; a procura |
| replace | substituir |
| found | encontrado; o que se encontrou |

## A interface

| inglês | português |
| --- | --- |
| the rail | a barra (a barra da esquerda, com as vistas) |
| the panel at the side | o painel lateral |
| pane | o painel (um dos lados de um ecrã dividido) |
| the palette | a paleta (de comandos) |
| the writing tools | as ferramentas de escrita |
| fold / unfold | recolher / desdobrar |
| settings | definições |
| data directory | a pasta de dados |
| view | vista |
| menu | menu |
| tab | separador |
| button | botão |
| field | campo |
| hint | dica |
| file | ficheiro |
| folder | pasta |
| font | fonte |
| page | página |
| margin | margem |
| heading | título (de secção); cabeçalho é o alto da página |
| footnote | nota de rodapé |
| endnote | nota final |
| press (a key) | premir («prima Enter») |
| press (on the screen) | clicar («clique para…») |
| drag | arrastar |
| screen | ecrã |
| download | transferir |
| upload | carregar |

## Palavras dos documentos (`document.ftl`)

As palavras correntes da edição académica em Portugal: Resumo,
Palavras-chave, Índice (o sumário), Índice de figuras, Índice de tabelas,
Figura, Tabela, Notas, Bibliografia, Referências, Apêndice, Capítulo,
Parte, Prefácio, Agradecimentos, Glossário, Índice remissivo.

## Nomes que não se traduzem

Glaukopis; Pandoc, Typst, Tesseract, Hunspell, LaTeX, LuaLaTeX, BibLaTeX,
Zotero, CSL, Markdown; os formatos de ficheiro (DOCX, ODT, PDF, EPUB, RTF,
HTML, SVG, PNG); os nomes das fontes; os estilos de citação (APA, Chicago,
MLA); DOI, ISBN, ISSN, arXiv, URL.
