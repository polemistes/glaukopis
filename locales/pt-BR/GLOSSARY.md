# As palavras do Glaukopis em português do Brasil (pt-BR)

Escolhas feitas para a tradução da interface em português brasileiro.
Correspondem, termo a termo, a `locales/GLOSSARY.md`; leia-o primeiro.
Uma palavra escolhida aqui é usada sempre, em todos os arquivos.

## A forma de tratamento

- **Você**, como o software brasileiro: nunca «tu», nunca «o senhor». O
  pronome quase nunca aparece escrito; está implícito na conjugação.
- **Comandos no infinitivo**: botões, itens de menu, abas e comandos da
  paleta (Salvar, Fechar, Renomear, Trazer um documento…).
- **Instruções ao escritor no imperativo de «você»**: «Selecione um
  trecho e pressione Ctrl+Alt+C», «Escolha um formato». Nunca
  «Seleciona», nunca «você seleciona».
- **Possessivos com moderação**: «a biblioteca», «as palavras próprias»,
  não «a sua biblioteca». Onde um possessivo é preciso, «seu / sua».
- **O programa fala na terceira pessoa**: «O Glaukopis não encontrou…»,
  «O arquivo não pode ser lido».
- **Pronomes átonos** à brasileira: próclise na frase corrente («não o
  encontra», «para mostrá-lo»); evita-se começar frase com pronome átono
  e evita-se a mesóclise; onde o português de Portugal diria
  «guardou-se», diz-se «foi salvo».

## Ortografia e tipografia

- Acordo Ortográfico, na norma do Brasil: projeto, aspecto, seleção,
  coleção, ação, direção, objeto, atual, fato, contato, seção, caractere,
  recepção, perspectiva, ideia, voo, para (verbo).
- Léxico do Brasil: arquivo, pasta, tela, mouse, salvar, excluir,
  desfazer, configurações, compartilhar, baixar, enviar, registrar,
  equipe, usuário, pré-visualização, aba, atalho, senha.
- Aspas curvas “…” à volta de um nome, como no inglês; aspas simples ‘…’
  só dentro de outras aspas.
- Reticências com o caractere «…». Travessão «—» para apartes; o hífen
  não o substitui.
- Números, datas e horas são escritos pelo programa; `{ $count }` fica
  onde está.

## Teclas

Como o teclado brasileiro as escreve: Ctrl, Shift, Alt, AltGr, Enter,
Esc, Tab, Delete, Backspace, Home, End, Page Up, Page Down; a tecla de
espaço é «Espaço»; as setas são «seta para cima / para baixo / para a
esquerda / para a direita». Em macOS: Cmd, Option.

## Formas de plural

O português do Brasil tem, para `{ $count -> … }`, as formas `one`,
`many` e `other`; a verificação exige as três. `one` vale para 0 e 1;
`many` só vale para milhões redondos, e o programa escreve o número em
algarismos, por isso a linha `[many]` repete o texto de `*[other]`.

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
| the text | o texto (a visualização de texto, o modo de texto) |
| passage | trecho |
| kind | tipo (tipo de elemento, de parágrafo, de palavras) |
| look | aparência |
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
| lookup | consulta (consultar na rede, por DOI, ISBN ou busca) |
| found citations | citações encontradas |
| match | corresponder; a correspondência |

## Palavras e marcas

| inglês | português |
| --- | --- |
| foreign words | palavras estrangeiras |
| title of a work | título de obra |
| term | termo |
| mention | menção |
| highlight | destaque; destacar |
| marks | marcas (itálico, negrito, versalete, sublinhado, sobrescrito, subscrito, tachado, código) |
| italics | itálico |
| bold | negrito |
| small capitals | versalete |
| underline | sublinhado |
| superscript | sobrescrito |
| subscript | subscrito |
| struck through | tachado |
| code | código |

## Imagens, figuras, tabelas e fórmulas

| inglês | português |
| --- | --- |
| picture | imagem |
| the store | o acervo (a visualização chama-se «Imagens») |
| figure | figura |
| caption | legenda |
| pointer | remissão (remeter a uma figura, tabela, elemento, página) |
| table | tabela |
| formula | fórmula |
| placing | posição (aqui, no alto, ao lado, flutuante) |
| width | largura |

## Tempo, comentários, histórico

| inglês | português |
| --- | --- |
| timeline | linha do tempo |
| when | quando |
| comment | comentário; comentar |
| thread | discussão |
| settled, resolved | resolvido |
| history | histórico |
| changes | alterações |
| review | revisão; revisar |
| accept / reject | aceitar / rejeitar |
| sharing | compartilhamento; compartilhar |
| working together | trabalhar juntos |
| join | entrar em (um projeto compartilhado) |
| server | servidor |

## Leitura e verificação

| inglês | português |
| --- | --- |
| spelling | ortografia |
| dictionary | dicionário |
| own words | palavras próprias |
| reading text, OCR | ler o texto; OCR |
| made searchable | tornado pesquisável |
| search | buscar; a busca |
| replace | substituir |
| found | encontrado; o que se encontrou |

## A interface

| inglês | português |
| --- | --- |
| the rail | a barra (a barra da esquerda, com as visualizações) |
| the panel at the side | o painel lateral |
| pane | o painel (um dos lados de uma tela dividida) |
| the palette | a paleta (de comandos) |
| the writing tools | as ferramentas de escrita |
| fold / unfold | recolher / expandir |
| settings | configurações |
| data directory | a pasta de dados |
| view | visualização |
| menu | menu |
| tab | aba |
| button | botão |
| field | campo |
| hint | dica |
| file | arquivo |
| folder | pasta |
| font | fonte |
| page | página |
| margin | margem |
| heading | título (de seção); cabeçalho é o alto da página |
| footnote | nota de rodapé |
| endnote | nota de fim |
| press (a key) | pressionar («pressione Enter») |
| press (on the screen) | clicar («clique para…») |
| drag | arrastar |
| screen | tela |
| download | baixar |
| upload | enviar |
| delete | excluir |
| undo / redo | desfazer / refazer |
| save | salvar |

## Palavras dos documentos (`document.ftl`)

As palavras correntes da edição acadêmica no Brasil (ABNT): Resumo,
Palavras-chave, Sumário, Lista de figuras, Lista de tabelas, Figura,
Tabela, Notas, Referências, Bibliografia, Apêndice, Capítulo, Parte,
Prefácio, Agradecimentos, Glossário, Índice remissivo.

## Nomes que não se traduzem

Glaukopis; Pandoc, Typst, Tesseract, Hunspell, LaTeX, LuaLaTeX, BibLaTeX,
Zotero, CSL, Markdown; os formatos de arquivo (DOCX, ODT, PDF, EPUB, RTF,
HTML, SVG, PNG); os nomes das fontes; os estilos de citação (APA, Chicago,
MLA); DOI, ISBN, ISSN, arXiv, URL.
