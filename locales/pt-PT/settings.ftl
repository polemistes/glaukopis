# The settings.

settings-title = Definições
settings-error-system = Não foi possível ler algo sobre a aplicação
settings-error-read = Não foi possível ler as definições
settings-error-save = Não foi possível guardar as definições

## Appearance

settings-appearance = Aparência
settings-theme = Cores
settings-theme-system = Como o sistema
settings-theme-light = Claro
settings-theme-dark = Escuro
# A theme of pastel colours, warm and soft.
settings-theme-mellow = Suave
settings-theme-own = Próprias
settings-own = Cores próprias
settings-own-hint = Quatro cores, de que as restantes decorrem: o papel, a tinta, o destaque que marca o que está escolhido e premido, e a segunda voz que marca associações e comentários. Se o esquema é claro ou escuro decorre do papel.
settings-own-paper = Papel
settings-own-ink = Tinta
settings-own-accent = Destaque
settings-own-gold = Segunda voz
settings-own-begin = Começar de
# The contrast of the ink and of the accent on the paper, as WCAG counts it; 4.5 and 3 are what reads well.
settings-own-weak = Difícil de ler: a tinta está a { $ink } para 1 sobre o papel e o destaque a { $accent } para 1; 4,5 e 3 ou mais leem-se bem.
settings-text-size = Tamanho do seu texto
settings-text-size-hint = Nos mapas e na vista de texto. O que se exporta segue o formato do documento.
settings-interface-size = Tamanho da interface
settings-interface-size-hint = Tudo na janela, a escrita também. Só para o texto, o tamanho abaixo.
# A line of text in the size chosen, which shows the face of the letters; a
# line of Homer's Greek follows it.
settings-sample = Canta, ó deusa, a cólera de Aquiles, o Pelida

## New documents

settings-new-documents = Novos documentos
settings-new-documents-hint = Com que um mapa começa. A cada mapa pode dar-se outro, na pré-visualização.
settings-reference-style = Estilo de citação
settings-document-format = Formato do documento

## You

settings-you = Quem escreve
settings-name = Nome
settings-name-hint = Mostrado àqueles com quem partilha projetos. Não se usa para mais nada.
settings-contact = Endereço para os serviços bibliográficos
settings-contact-hint = Serviços como o Crossref respondem mais prontamente a quem diz como pode ser contactado. Se escrever um endereço, é-lhes enviado a cada consulta, e a mais ninguém. Deixe vazio para não enviar nenhum.
settings-contact-problem = Isso não parece um endereço.

## Programs: Pandoc and Typst

settings-programs = Programas
settings-programs-about = O Glaukopis faz os documentos com o Pandoc, que se encontra por si onde estiver instalado da maneira habitual. As páginas da pré-visualização e de um PDF são compostas pelo Typst, que faz parte do Glaukopis.
settings-pandoc-need = Preciso para a pré-visualização e para toda a exportação.
settings-looking = A procurar…
# "need" is what the program is needed for: settings-pandoc-need.
settings-program-missing = Não encontrado. { $need } Instale-o com o gestor de pacotes do sistema, ou diga abaixo onde está.
settings-program-old = Mais antigo do que o Glaukopis precisa: { $least } ou mais recente.
# The field for the path to a program, and the title of the dialog that chooses it.
settings-program-where = Onde está o { $program }
settings-program-found-by-itself = Encontrado por si
settings-no-latex = Não se encontrou nenhum LaTeX. Não é preciso: o código LaTeX exporta-se sem ele, e o PDF faz-se com o Typst.
settings-look-again = Procurar de novo
settings-error-programs = Não foi possível procurar os programas

## About

settings-about = Sobre
settings-licence = Software livre sob a GNU General Public License, versão 3 ou posterior. Vem sem garantia.
settings-owl = A coruja foi desenhada por Robert Emil Berge, a partir de uma fotografia de um tetradracma ateniense do Classical Numismatic Group, Inc. (http://www.cngcoins.com). O desenho está sob a licença Creative Commons Atribuição-CompartilhaIgual 3.0 Não Adaptada.
settings-data = Onde tudo se guarda
# "file" is the name of the file of the library, shown as code.
settings-data-hint = As referências estão em { $file }, que qualquer ferramenta BibLaTeX lê. Para guardar uma cópia do trabalho, copie esta pasta.
settings-lookup = Onde se consultam as referências
settings-lookup-about = DOI em doi.org, Crossref e DataCite; livros nos catálogos K10plus, das bibliotecas académicas norueguesas, da Deutsche Nationalbibliothek e da Library of Congress; pré-publicações no arXiv; literatura médica no PubMed. Só o que se escreve na consulta lhes é enviado.

## Language

settings-language = Língua
settings-language-interface = A interface
settings-language-interface-hint = As palavras da aplicação. Os textos estão na língua dos seus mapas.
settings-language-system = Como o sistema ({ $language })
settings-language-texts = Língua dos novos textos
settings-language-texts-hint = Em que se escreve um novo mapa, o que decide as palavras que o seu documento imprime e o dicionário por que se verifica a ortografia. A cada mapa pode dar-se outra em Línguas… no seu menu, e a um projeto uma língua própria para os seus novos mapas.
