# Bibliographic APIs for citation import

Research notes for Glaukopis. Every status below was observed by calling the
service with `curl` from the development machine on **2026-09-27, between
13:31 and 13:50 UTC**. Nothing in the "observed" parts is written from memory.
Where a statement comes from documentation rather than from a response, it says
so, and where documentation could not be read from a script, that is recorded
as well.

## Method

- Client: `curl 8.22.0`, one request at a time, a pause of 1-3 s between
  requests, no loops, no bulk download. Between 2 and 15 requests per service.
- User-Agent sent to the bibliographic services:
  `Glaukopis/0.1 (research tool; mailto:post@robertemilberge.no)`.
  In the commands below this is abbreviated as `$UA`.
- Documentation pages and the Wikimedia Citoid endpoint were fetched with
  `Glaukopis/0.1 (research tool)` (no e-mail address), abbreviated `$UAD`.
- Samples are real responses, trimmed. `[...]` marks removed material.

### Test items

| Kind | Identifier | Work |
|---|---|---|
| Journal article (Crossref) | `10.1086/599247` | Kossinets & Watts, "Origins of Homophily in an Evolving Social Network", *American Journal of Sociology* 115(2), 2009 |
| Humanities review article (Crossref) | `10.1086/366680` | Combellack, review of Nagy, *Classical Philology* 77(1), 1982 |
| Book chapter (Crossref) | `10.1515/9783110272017.27` | Nagy, "Signs of Hero Cult in Homeric Poetry", in *Homeric Contexts*, De Gruyter 2012 |
| Edited book (Crossref) | `10.1515/9783110272017` | Montanari, Rengakos, Tsagalis (eds.), *Homeric Contexts* |
| Book chapter without authors (Crossref) | `10.1017/CBO9780511803161.003` | Pearl, *Causality*, ch. 1, CUP 2009 |
| DataCite DOI | `10.5281/zenodo.3233986` | *The Turing Way* (Zenodo, software) |
| DataCite DOI (preprint) | `10.48550/arXiv.1706.03762` | Vaswani et al., "Attention Is All You Need" |
| English monograph | ISBN `9780674033818` (pbk 1991), `0674033809` (hbk 1989) | W. V. Harris, *Ancient Literacy*, Harvard UP |
| German monograph | ISBN `9783406568442` | J. Assmann, *Das kulturelle Gedächtnis*, C. H. Beck |
| Norwegian monograph | ISBN `9788202413736` | T. Rem, *Knut Hamsun: reisen til Hitler*, Cappelen Damm 2014 |
| French monograph | ISBN `2707302759` / `9782707302755` | P. Bourdieu, *La distinction*, Minuit 1979 |
| arXiv id | `1706.03762` | as above |
| PMID | `19008416` | Varambally et al., *Science* 322, 2008 |

### Summary of observed status

| # | Service | Status today | Key | Notes |
|---|---|---|---|---|
| 1 | doi.org content negotiation | works | no | CSL-JSON good; BibTeX output is lossy |
| 2 | Crossref REST API | works | no | polite pool confirmed in response headers |
| 3 | DataCite REST API | works | no | |
| 4 | OpenAlex | works, metered | optional (free) | keyless budget USD 0.10/day per client |
| 5 | Open Library | works, low quality | no | `/api/books?...&format=json` returned 404; `/api/books.json` works |
| 6a | Library of Congress SRU | unreliable | no | plain HTTP only; needs `startRecord=1`; intermittent diagnostics |
| 6b | loc.gov JSON API | **blocked** | - | HTTP 403, Cloudflare challenge |
| 7 | K10plus SRU | works | no | best book metadata of all sources tested |
| 8 | DNB SRU | works | no (no token needed) | |
| 9a | National Library of Norway API | works | no | MODS good; RIS export faulty |
| 9b | Alma SRU, Norwegian network (Sikt) | works | no | `sru.bibsys.no` no longer resolves |
| 10 | BnF SRU | works | no | UNIMARC, not MARC 21; ISBN-13 lookup missed an older record |
| 11 | arXiv API | works | no | 1 request / 3 s |
| 12 | PubMed E-utilities | works | optional | 3 requests/s without key |
| 13 | Google Books | **blocked without key** | required in practice | HTTP 429, quota limit 0 |
| 14 | WorldCat | **no free access** | subscription | HTTP 401 |
| 15 | Zotero translation-server | self-host only | - | Wikimedia Citoid is a public instance, tested, works |

## Shared mapping tables

Several services return the same format. The tables here are referred to from
the individual sections, which then list only what is specific to the service.

### Table A: CSL-JSON to BibLaTeX (doi.org, Crossref)

Crossref's REST API returns the same field names as its CSL-JSON, with the
difference that `title`, `subtitle`, `container-title` and `ISSN` are arrays in
the REST API and `title` and `container-title` are plain strings in CSL-JSON.

| CSL-JSON / Crossref `type` | BibLaTeX entry type |
|---|---|
| `article-journal` / `journal-article` | `@article` |
| `book`, `monograph` | `@book` |
| `edited-book` | `@collection` (or `@book` with `editor`) |
| `chapter` / `book-chapter` | `@incollection` when the container has editors, otherwise `@inbook` |
| `paper-conference` / `proceedings-article` | `@inproceedings` |
| `thesis` / `dissertation` | `@thesis` |
| `report` | `@report` |
| `dataset` | `@dataset` |
| `software` | `@software` |
| `article` (DataCite, preprints) | `@online` (with `eprint` when arXiv) |
| `reference-entry` | `@inreference` |
| `other`, anything unknown | `@misc`, and flag the record for the user |

| Field | BibLaTeX field | Remark |
|---|---|---|
| `author[].family`, `.given` | `author` as `Family, Given` joined by ` and ` | |
| `author[].name` / `.literal` | `author` wrapped in braces `{...}` | corporate names |
| `editor[]`, `translator[]` | `editor`, `translator` | |
| `title` | `title` | strip markup first, see notes |
| `subtitle[0]` | `subtitle` | often empty although the title has one |
| `container-title` | `journaltitle` for articles, `booktitle` for chapters | |
| `container-title-short` | `shortjournal` | |
| `publisher` | `publisher` | |
| `publisher-location` | `location` | rarely present |
| `issued.date-parts[0]` | `date` as `YYYY`, `YYYY-MM` or `YYYY-MM-DD` | |
| `volume`, `issue` | `volume`, `number` | |
| `page` | `pages`, hyphen replaced by `--` | |
| `edition-number` | `edition` | |
| `ISBN[]` | `isbn` | choose print over electronic via `isbn-type` |
| `ISSN[]` | `issn` | choose print over electronic via `issn-type` |
| `DOI` | `doi` | lower-case it; DataCite returns upper case |
| `URL` | `url` | omit when it is only the DOI resolver URL |
| `language` | `langid` | ISO 639-1 code; map to a babel/polyglossia name |
| `abstract` | `abstract` | contains JATS or HTML markup |
| `version` | `version` | |

### Table B: MARC 21 to BibLaTeX (LoC, K10plus, DNB, Alma)

| MARC 21 | BibLaTeX | Remark |
|---|---|---|
| Leader/06-07 | entry type | `am` = `@book`; `aa` = component part, `@article` or `@incollection` depending on 773; `as` = serial |
| 502 present | `@thesis`, `type`, `institution` | |
| 100 $a | `author` | already `Family, Given`; strip trailing punctuation; $d (dates) and $q are not part of the name |
| 700 $a with $4 / $e | `author`, `editor`, `translator`, ... | $4 `aut`, `edt`, `trl`, `ctb`; `rev` = reviewer |
| 110 / 710 $a $b | `author` / `editor` in braces | corporate body |
| 245 $a | `title` | ind2 = number of non-filing characters |
| 245 $b | `subtitle` | may contain a parallel title after ` = ` |
| 245 $n, $p | `part`, `maintitle`/`title` | multi-volume works |
| 245 $c | not imported | statement of responsibility; useful as a cross-check only |
| 250 $a | `edition` | free text ("7. Auflage"); extract the integer when possible |
| 264 ind2=1 $a / 260 $a | `location` | |
| 264 ind2=1 $b / 260 $b | `publisher` | |
| 264 ind2=1 $c / 260 $c | `date` | strip `[`, `]`, `©`, `c`, trailing full stop |
| 008/07-10 | `date` | fallback, and a check on 260/264 $c |
| 008/35-37, 041 $a | `langid` | ISO 639-2/B code |
| 020 $a | `isbn` | 020 $z is a cancelled or invalid ISBN, do not import |
| 022 $a | `issn` | |
| 024 ind1=7 $a with $2 `doi` | `doi` | |
| 300 $a | `pagetotal` | free text ("xv, 383 p.") |
| 490 $a, $v | `series`, `number` | 830 $a, $v is the authorised form and is preferred when present |
| 773 $t, $g, $d | `journaltitle` / `booktitle`, volume and pages, imprint | component parts |
| 856 $u | `url` | only when ind2 = 0 or 1; ind2 = 2 is a related resource |

### Table C: MODS 3 to BibLaTeX (LoC, K10plus, National Library of Norway)

| MODS | BibLaTeX | Remark |
|---|---|---|
| `titleInfo/title` (without `@type`) | `title` | `titleInfo/nonSort` must be prefixed |
| `titleInfo/subTitle` | `subtitle` | |
| `name[@type='personal']/namePart` (without `@type`) | `author` etc. | one string `Family, Given`; `namePart[@type='date']` is dropped |
| `name/role/roleTerm` | role | `aut`, `edt`, `trl`; absent role on the primary name means author |
| `originInfo/place/placeTerm[@type='text']` | `location` | ignore `@type='code'` |
| `originInfo/agent/namePart` or `originInfo/publisher` | `publisher` | the MODS 3.8 conversions observed use `agent` |
| `originInfo/dateIssued` (without `@encoding='marc'`) | `date` | |
| `originInfo/edition` | `edition` | |
| `language/languageTerm[@type='code']` | `langid` | |
| `identifier[@type='isbn']`, `[@type='doi']` | `isbn`, `doi` | |
| `relatedItem[@type='series']/titleInfo/title` | `series` | number is in `partNumber` or appended to the title |
| `relatedItem[@type='host']` | `journaltitle` / `booktitle`, `volume`, `pages` | |
| `genre`, `originInfo/issuance` | entry type | `monographic` = `@book` |
| `physicalDescription/extent` | `pagetotal` | |

## 1. doi.org content negotiation

**Status: works.** Six DOIs resolved for both formats; a non-existent DOI
returned 404.

### Requests

```sh
curl -sS -L -A "$UA" -H 'Accept: application/vnd.citationstyles.csl+json' https://doi.org/10.1086/599247
curl -sS -L -A "$UA" -H 'Accept: application/x-bibtex'                    https://doi.org/10.1086/599247
# the same two requests for:
#   10.5281/zenodo.3233986   10.1017/CBO9780511803161.003
#   10.1515/9783110272017.27 10.1515/9783110272017   10.1086/366680
curl -sS -L -A "$UA" -H 'Accept: application/vnd.citationstyles.csl+json' https://doi.org/10.48550/arXiv.1706.03762
curl -sS -L -A "$UA" -H 'Accept: application/vnd.crossref.unixref+xml'    https://doi.org/10.1515/9783110272017.27
curl -sS -L -A "$UA" -H 'Accept: application/vnd.citationstyles.csl+json' https://doi.org/10.9999/does-not-exist-glaukopis
```

| Request | HTTP | Redirected to |
|---|---|---|
| Crossref DOIs, both formats | 302 then 200 | `https://api.crossref.org/v1/works/{doi}/transform` |
| DataCite DOIs, both formats | 302 then 200 | `https://data.crosscite.org/{doi}` |
| UNIXREF XML, chapter | 302 then 200 | Crossref, as above |
| Non-existent DOI | 404 | none |

Response time was 0.5-1.0 s, with two outliers of 5.6-5.7 s.

### Terms of use

- <https://citation.doi.org/docs.html> (the former `citation.crosscite.org`
  address redirects there) and
  <https://www.crossref.org/documentation/retrieve-metadata/content-negotiation/>.
- No key, no registration. The request is served by the registration agency, so
  that agency's limits apply.
- Crossref: the response carried `x-rate-limit-limit: 10`,
  `x-rate-limit-interval: 1s`, `x-api-pool: polite-single`. The e-mail address
  in the User-Agent was therefore recognised.
- DataCite: documentation states 1000 requests per 5 minutes per IP address for
  content negotiation (<https://support.datacite.org/docs/rate-limit>).
- Supported by Crossref, DataCite and mEDRA according to the documentation.
  Only Crossref and DataCite were tested.

### Response format and samples

CSL-JSON, journal article (`10.1086/599247`), trimmed:

```json
{
  "type": "journal-article",
  "title": "Origins of Homophily in an Evolving Social Network",
  "subtitle": [],
  "author": [
    {"given": "Gueorgi", "family": "Kossinets", "sequence": "first"},
    {"given": "Duncan J.", "family": "Watts", "sequence": "additional"}
  ],
  "container-title": "American Journal of Sociology",
  "container-title-short": "American Journal of Sociology",
  "publisher": "University of Chicago Press",
  "issued": {"date-parts": [[2009, 9]]},
  "volume": "115", "issue": "2", "page": "405-450",
  "ISSN": ["0002-9602", "1537-5390"],
  "language": "en",
  "DOI": "10.1086/599247",
  "URL": "http://dx.doi.org/10.1086/599247"
}
```

CSL-JSON, book chapter (`10.1515/9783110272017.27`), trimmed:

```json
{
  "type": "book-chapter",
  "title": "Signs of Hero Cult in Homeric Poetry",
  "subtitle": [],
  "author": [{"given": "Gregory", "family": "Nagy", "sequence": "first"}],
  "container-title": "Homeric Contexts",
  "publisher": "DE GRUYTER",
  "issued": {"date-parts": [[2012, 4, 12]]},
  "page": "27-72",
  "DOI": "10.1515/9783110272017.27"
}
```

CSL-JSON, edited book (`10.1515/9783110272017`), trimmed:

```json
{
  "type": "edited-book",
  "title": "Homeric Contexts",
  "subtitle": ["Neoanalysis and the Interpretation of Oral Poetry"],
  "editor": [
    {"given": "Franco", "family": "Montanari"},
    {"given": "Antonios", "family": "Rengakos"},
    {"given": "Christos C.", "family": "Tsagalis"}
  ],
  "publisher": "DE GRUYTER",
  "issued": {"date-parts": [[2012, 4, 12]]},
  "ISBN": ["9783110271959"],
  "isbn-type": [{"value": "9783110271959", "type": "print"}]
}
```

CSL-JSON from DataCite (`10.5281/zenodo.3233986`), trimmed:

```json
{
  "type": "software",
  "author": [
    {"family": "Community", "given": "The Turing Way"},
    {"family": "Arnold", "given": "Becky"}
  ],
  "issued": {"date-parts": [[2019, 3, 25]]},
  "title": "The Turing Way: A Handbook for Reproducible Data Science",
  "publisher": "Zenodo",
  "DOI": "10.5281/ZENODO.3233986",
  "URL": "https://zenodo.org/record/3233986",
  "version": "v0.0.4"
}
```

BibTeX as returned, unedited:

```bibtex
 @article{Kossinets_2009, title={Origins of Homophily in an Evolving Social Network}, volume={115}, ISSN={1537-5390}, url={http://dx.doi.org/10.1086/599247}, DOI={10.1086/599247}, number={2}, journal={American Journal of Sociology}, publisher={University of Chicago Press}, author={Kossinets, Gueorgi and Watts, Duncan J.}, year={2009}, month=Sept, pages={405–450} }

 @book{2012, title={Homeric Contexts: Neoanalysis and the Interpretation of Oral Poetry}, ISBN={9783110271959}, url={http://dx.doi.org/10.1515/9783110272017}, DOI={10.1515/9783110272017}, publisher={DE GRUYTER}, year={2012}, month=Apr }

 @misc{2009, graphs, and causal models_2009, ISBN={9780521749190}, url={http://dx.doi.org/10.1017/CBO9780511803161.003}, DOI={10.1017/cbo9780511803161.003}, journal={Causality}, publisher={Cambridge University Press}, year={2009}, month=Sept, pages={1–40} }
```

UNIXREF XML for the chapter, trimmed. It carries the book-level metadata that
the CSL-JSON lacks:

```xml
<book book_type="edited_book">
  <book_metadata>
    <contributors>
      <person_name sequence="first" contributor_role="editor">
        <given_name>Franco</given_name><surname>Montanari</surname>
      </person_name>
      [... Rengakos, Tsagalis ...]
    </contributors>
    <titles>
      <title>Homeric Contexts</title>
      <subtitle>Neoanalysis and the Interpretation of Oral Poetry</subtitle>
    </titles>
    <publication_date media_type="print"><month>04</month><day>12</day><year>2012</year></publication_date>
    <isbn media_type="print">978-3-11-027195-9</isbn>
    <publisher><publisher_name>DE GRUYTER</publisher_name></publisher>
    <doi_data><doi>10.1515/9783110272017</doi></doi_data>
  </book_metadata>
  <content_item component_type="chapter">
    <contributors>
      <person_name sequence="first" contributor_role="author">
        <given_name>Gregory</given_name><surname>Nagy</surname>
      </person_name>
    </contributors>
    <titles><title>Signs of Hero Cult in Homeric Poetry</title></titles>
    <pages><first_page>27</first_page><last_page>72</last_page></pages>
    <doi_data><doi>10.1515/9783110272017.27</doi></doi_data>
  </content_item>
</book>
```

### Field mapping

Table A. For chapters, additionally from UNIXREF:

| UNIXREF | BibLaTeX |
|---|---|
| `book_metadata/contributors/person_name[@contributor_role='editor']` | `editor` |
| `book_metadata/titles/title`, `subtitle` | `booktitle`, `booksubtitle` |
| `book_metadata/isbn` | `isbn` |
| `book_metadata/series_metadata/titles/title`, `volume` | `series`, `number` (not present in the sample; taken from the element names in the schema, unverified) |
| `content_item/pages/first_page`, `last_page` | `pages` |

### Data quality observed

- **The BibTeX output should not be used.** It produced an invalid citation key
  containing spaces and commas (`2009, graphs, and causal models_2009`), a bare
  number as key (`2012`), dropped all three editors of the edited book, put the
  book title of a chapter in `journal`, used the unquoted non-standard month
  `Sept`, and used an en dash in `pages`. Generate BibLaTeX from CSL-JSON
  instead.
- Chapter CSL-JSON has no book editors, no ISBN and no book subtitle. UNIXREF
  has all three.
- A chapter of Pearl's *Causality* came back as `type: "other"` with no
  `author` at all.
- `subtitle` is empty for the article even where a subtitle exists in the
  title string; conversely the edited book has the subtitle only in
  `subtitle`. Both cases must be handled.
- Markup inside titles:
  `"<i>The Best of the Achaens: Concepts of the Hero in Archaic Greek Poetry</i>. Gregory Nagy"`.
  The same title also has a typing error deposited by the publisher
  ("Achaens").
- Publisher in capitals: `DE GRUYTER`.
- `publisher-location` and `language` are absent from the De Gruyter records.
- DataCite returns the DOI in upper case (`10.5281/ZENODO.3233986`) and split
  a collective author into family `Community`, given `The Turing Way`.
- DataCite gives type `article` for the arXiv preprint, with year only.
- `URL` uses the obsolete `http://dx.doi.org/` prefix.

## 2. Crossref REST API

**Status: works.**

### Requests

```sh
curl -sS -A "$UA" 'https://api.crossref.org/works/10.1086/599247?mailto=post@robertemilberge.no'
curl -sS -A "$UA" 'https://api.crossref.org/works/10.1515/9783110272017.27?mailto=post@robertemilberge.no'
curl -sS -A "$UA" 'https://api.crossref.org/works?query.bibliographic=Nagy+Best+of+the+Achaeans+hero+archaic+Greek+poetry&rows=5&select=DOI,type,title,subtitle,author,editor,container-title,publisher,issued,page,volume,issue,ISBN,ISSN,score&mailto=post@robertemilberge.no'
curl -sS -A "$UA" 'https://api.crossref.org/works?query.bibliographic=Homeric+formula+oral+poetry&filter=type:book-chapter&rows=5&select=DOI,type,title,subtitle,author,editor,container-title,publisher,publisher-location,issued,page,ISBN,score&mailto=post@robertemilberge.no'
```

| Request | HTTP |
|---|---|
| `/works/{doi}` (two DOIs) | 200 |
| Both searches with `language` in `select` | **400** `select-not-available`: "Select 'language' specified but there is no such select for this route" |
| Both searches without `language` in `select` | 200 |

`language` is returned in full records but cannot be named in `select`.

Response headers:

```
# /works/{doi}
x-rate-limit-limit: 10
x-rate-limit-interval: 1s
x-concurrency-limit: 3
x-api-pool: polite-single

# /works?query...
x-rate-limit-limit: 3
x-rate-limit-interval: 1s
x-concurrency-limit: 3
x-api-pool: polite-array
```

### Terms of use

- <https://www.crossref.org/documentation/retrieve-metadata/rest-api/access-and-authentication/>
- No sign-up. "almost none of the metadata is subject to copyright, and you may
  use it for any purpose"; abstracts may be under copyright.
- Documented pools: Public 5 requests/s, concurrency 1; Polite 10 requests/s,
  concurrency 3; Plus (paid) 150 requests/s. The polite pool is entered by
  giving an e-mail address in the `mailto` parameter or in the User-Agent.
- Observed difference from the documentation: list queries in the polite pool
  were limited to 3 requests/s, not 10. Read the limits from the headers
  rather than hard-coding them.
- 429 when the limit is exceeded, 403 when blocked manually.
- Asked of clients: cache responses, send `mailto` and an identifying
  User-Agent, wait for a request to finish before sending the next.

### Response format and sample

JSON. The record is in `message`; searches return `message.items[]` and
`message.total-results`.

```json
{
  "DOI": "10.1086/599247",
  "type": "journal-article",
  "title": ["Origins of Homophily in an Evolving Social Network"],
  "subtitle": [],
  "author": [
    {"given": "Gueorgi", "family": "Kossinets", "sequence": "first", "affiliation": []},
    {"given": "Duncan J.", "family": "Watts", "sequence": "additional", "affiliation": []}
  ],
  "container-title": ["American Journal of Sociology"],
  "short-container-title": ["American Journal of Sociology"],
  "publisher": "University of Chicago Press",
  "issued": {"date-parts": [[2009, 9]]},
  "volume": "115", "issue": "2", "page": "405-450",
  "ISSN": ["0002-9602", "1537-5390"],
  "issn-type": [
    {"value": "0002-9602", "type": "print"},
    {"value": "1537-5390", "type": "electronic"}
  ],
  "language": "en",
  "URL": "https://doi.org/10.1086/599247"
}
```

Search results for the Nagy query (575 723 hits, first five, trimmed):

```json
{"DOI":"10.2307/1087661","type":"journal-article","title":["The Best of the Achaeans: Concepts of the Hero in Archaic Greek Poetry"],"author":[{"given":"Wayne B.","family":"Ingalls"},{"given":"Gregory","family":"Nagy"}],"container-title":["Phoenix"],"publisher":"JSTOR","issued":[[1981]],"page":"276","volume":"35","issue":"3","score":68.90104}
{"DOI":"10.2307/294156","type":"journal-article","title":["The Best of the Achaeans. Concepts of the Hero in Archaic Greek Poetry"],"author":[{"given":"Friedrich","family":"Solmsen"},{"given":"Gregory","family":"Nagy"}],"container-title":["The American Journal of Philology"],"publisher":"JSTOR","issued":[[1981]],"page":"81","volume":"102","issue":"1","score":62.16278}
{"DOI":"10.1017/s0009840x00238638","type":"journal-article","title":["The Best of the Achaeans - Gregory Nagy: The Best of the Achaeans. Concepts of the Hero in Archaic Greek Poetry. Pp. xvi + 392. Baltimore and London: Johns Hopkins University Press, 1980. £9 ($18.75)."],"author":[{"given":"J. B.","family":"Hainsworth"}],"container-title":["The Classical Review"],"issued":[[1982,4]],"page":"3-4","volume":"32","issue":"1"}
{"DOI":"10.1163/156852585x00177","type":"journal-article","title":["G. NAGY, The Best of Achaeans. [...]"],"author":[{"given":"W.J.","family":"Verdenius"}],"container-title":["Mnemosyne"],"publisher":"Walter de Gruyter GmbH","issued":[[1985]],"page":"180-181","volume":"38","issue":"1-2"}
{"DOI":"10.1086/366680","type":"journal-article","title":["<i>The Best of the Achaens: Concepts of the Hero in Archaic Greek Poetry</i>. Gregory Nagy"],"author":[{"given":"Frederick M.","family":"Combellack"}],"container-title":["Classical Philology"],"issued":[[1982,1]],"page":"65-70","volume":"77","issue":"1"}
```

### Field mapping

Table A, reading index 0 of the arrays `title`, `subtitle`,
`container-title`, `short-container-title`.

### Data quality observed

- The monograph itself (Johns Hopkins UP, 1979) has no DOI and does not appear.
  All five hits are reviews of it. **Crossref is not a book catalogue**; a
  free-text search for a book returns its reviews.
- JSTOR-deposited reviews list the reviewed author as a co-author of the
  review (`Ingalls` and `Nagy`; `Solmsen` and `Nagy`) and give only the first
  page (`"page": "276"`).
- Reviews are typed `journal-article`. There is no review type.
- The chapter search returned front matter and indices as chapters
  (`"Frontmatter"`, `"Indices"`, no author).
- The full chapter record has no `editor`, `ISBN`, `publisher-location` or
  `language`. See UNIXREF in section 1.
- `publisher` is not reliably the publisher of the work. It appears to be the
  name of the Crossref member that holds the DOI prefix: `JSTOR` for articles
  in *Phoenix* and *The American Journal of Philology*, and
  `Walter de Gruyter GmbH` for a 1985 article in *Mnemosyne* under the prefix
  `10.1163`. The same house also appears as `DE GRUYTER`. For `@article` the
  field is optional in BibLaTeX and is best left out.
- Titles in capitals (`G. NAGY, ...`) and with `<i>` markup.
- Initials without space: `W.J.`.

## 3. DataCite REST API

**Status: works.**

### Requests

```sh
curl -sS -A "$UA" 'https://api.datacite.org/dois/10.5281/zenodo.3233986'
curl -sS -A "$UA" 'https://api.datacite.org/dois?query=titles.title:%22digital+humanities%22+AND+types.resourceTypeGeneral:Book&page%5Bsize%5D=3'
```

Both HTTP 200, 0.4-0.7 s. No rate-limit headers in the responses.

### Terms of use

- <https://support.datacite.org/docs/api>, <https://support.datacite.org/docs/rate-limit>
- Public API without authentication for retrieval.
- Documented limits per IP address and 5 minutes: 3000 authenticated, 1000
  identified (e-mail address in the User-Agent or a `mailto=` parameter), 500
  unidentified. 429 when exceeded.
- The licence of the metadata was not stated on the pages read today. It is
  not asserted here.

### Response format and sample

JSON:API. The record is in `data.attributes`.

```json
{
  "doi": "10.5281/zenodo.3233986",
  "titles": [{"title": "The Turing Way: A Handbook for Reproducible Data Science"}],
  "creators": [
    {"name": "Community, The Turing Way", "nameType": "Personal",
     "givenName": "The Turing Way", "familyName": "Community"},
    {"name": "Arnold, Becky", "nameType": "Personal",
     "givenName": "Becky", "familyName": "Arnold",
     "nameIdentifiers": [{"nameIdentifier": "https://orcid.org/0000-0003-0355-0617",
                          "nameIdentifierScheme": "ORCID"}]}
  ],
  "publisher": "Zenodo",
  "publicationYear": 2019,
  "dates": [{"date": "2019-03-25", "dateType": "Issued"}],
  "types": {"ris": "COMP", "bibtex": "misc", "citeproc": "article",
            "schemaOrg": "SoftwareSourceCode", "resourceTypeGeneral": "Software"},
  "language": null,
  "version": "v0.0.4",
  "url": "https://zenodo.org/record/3233986"
}
```

### Field mapping

| DataCite | BibLaTeX | Remark |
|---|---|---|
| `types.resourceTypeGeneral` | entry type | `Book` = `@book`, `BookChapter` = `@incollection`, `JournalArticle` = `@article`, `Dissertation` = `@thesis`, `Dataset` = `@dataset`, `Software` = `@software`, `Preprint` = `@online`, `Report` = `@report`, otherwise `@misc`. Do not use `types.bibtex`, which was `misc` for every record seen, books included |
| `creators[].familyName`, `.givenName` | `author` | fall back to `name` when both are null |
| `creators[]` with `nameType: "Organizational"` | `author` in braces | |
| `contributors[]` with `contributorType: "Editor"` | `editor` | |
| `titles[]` without `titleType` | `title` | |
| `titles[]` with `titleType: "Subtitle"` | `subtitle` | |
| `publisher` | `publisher` | |
| `dates[]` with `dateType: "Issued"`, else `publicationYear` | `date` | |
| `container.title`, `.volume`, `.issue`, `.firstPage`, `.lastPage` | `journaltitle`/`booktitle`, `volume`, `number`, `pages` | the sample's `container` had only `type` and `identifier`; the sub-field names are from the schema, unverified |
| `language` | `langid` | |
| `version` | `version` | |
| `doi`, `url` | `doi`, `url` | |
| `relatedIdentifiers[]` with `relatedIdentifierType: "ISBN"` | `isbn` | not present in the samples, unverified |

### Data quality observed

- Depends entirely on the depositing repository. There is no editorial control.
- A De Gruyter edited collection had as its only creator
  `"name": "(:unkn) unknown"`, with all name parts null.
- Zenodo records with titles entirely in capitals and the author name entirely
  in lower case (`el-rakhawi, mohamed kamal arafa`), and the same work
  registered twice under consecutive DOIs.
- Subtitle joined to the title with ` : ` rather than given as a separate
  title entry.
- `types.citeproc` is `article` for books and for software.
- `nameType` is `Personal` for the collective author "The Turing Way
  Community".

## 4. OpenAlex

**Status: works without a key, but metered.** An API key is not required
today. It is free and raises the daily budget tenfold.

### Requests

```sh
curl -sS -A "$UA" 'https://api.openalex.org/works/https://doi.org/10.1086/599247'
curl -sS -A "$UA" 'https://api.openalex.org/works/https://doi.org/10.1515/9783110272017.27'
curl -sS -A "$UA" 'https://api.openalex.org/works?search=best+of+the+achaeans+nagy&per-page=3'
```

All HTTP 200, 0.3-1.0 s. Response headers:

```
# single work
x-ratelimit-limit: 1000
x-ratelimit-limit-usd: 0.1
x-ratelimit-credits-used: 1
x-ratelimit-cost-usd: 0.0001
x-ratelimit-remaining: 999
x-ratelimit-reset: 37579

# search
x-ratelimit-credits-used: 10
x-ratelimit-cost-usd: 0.001
x-ratelimit-remaining: 989
```

### Terms of use

- <https://help.openalex.org/api/authentication/>,
  <https://help.openalex.org/access/pricing/>,
  <https://help.openalex.org/access/example-costs/>
  (the former `docs.openalex.org` address redirects to `help.openalex.org`).
- Data licence: CC0, stated on the pricing page.
- Without a key: USD 0.10 of usage per day. With a free key (account
  required): USD 1 per day. Beyond that, prepaid usage or annual plans from
  USD 5000.
- Documented cost: single entity free, list and filter USD 0.10 per 1000
  calls, search USD 1 per 1000 calls. Maximum 100 requests/s.
- Observed difference from the documentation: the single-work lookup was
  charged 1 credit (USD 0.0001), not zero. At that rate the keyless budget is
  about 1000 lookups or 100 searches per day.
- The key is sent as `api_key=` or as a bearer token. A key built into a GPL
  application would be public, so the key has to be supplied by each user.
- The documentation does not say whether the keyless budget is counted per IP
  address. The headers suggest a per-client counter.

### Response format and sample

JSON.

```json
{
  "id": "https://openalex.org/W2157085604",
  "doi": "https://doi.org/10.1086/599247",
  "title": "Origins of Homophily in an Evolving Social Network",
  "publication_year": 2009,
  "publication_date": "2009-09-01",
  "language": "en",
  "type": "article",
  "biblio": {"volume": "115", "issue": "2", "first_page": "405", "last_page": "450"},
  "authorships": [
    {"author_position": "first",
     "author": {"display_name": "Gueorgi Kossinets", "orcid": null},
     "raw_author_name": "Gueorgi Kossinets"},
    {"author_position": "last",
     "author": {"display_name": "Duncan J. Watts",
                "orcid": "https://orcid.org/0000-0001-5005-4961"},
     "raw_author_name": "Duncan J. Watts"}
  ],
  "primary_location": {"source": {
    "display_name": "American Journal of Sociology",
    "issn_l": "0002-9602", "issn": ["0002-9602", "1537-5390"],
    "host_organization_name": "University of Chicago Press",
    "type": "journal"}}
}
```

The chapter:

```json
{
  "doi": "https://doi.org/10.1515/9783110272017.27",
  "title": "Signs of Hero Cult in Homeric Poetry",
  "publication_year": 2012, "publication_date": "2012-04-12",
  "language": "en", "type": "book-chapter",
  "biblio": {"volume": null, "issue": null, "first_page": "27", "last_page": "72"},
  "authorships": [{"author": {"display_name": "Gregory Nagy"}, "raw_author_name": "Gregory Nagy"}],
  "primary_location": {"source": null}
}
```

### Field mapping

| OpenAlex | BibLaTeX | Remark |
|---|---|---|
| `type` | entry type | `article` = `@article`, `book` = `@book`, `book-chapter` = `@incollection`, `dissertation` = `@thesis`, `preprint` = `@online`, `dataset` = `@dataset`, `book-review` and `review` = `@article` |
| `authorships[].raw_author_name` | `author` | a single string; must be split into given and family name by the application |
| `title` | `title` | no separate subtitle |
| `primary_location.source.display_name` | `journaltitle` | null for the chapter |
| `primary_location.source.host_organization_name` | `publisher` | |
| `primary_location.source.issn_l` | `issn` | |
| `publication_date` | `date` | |
| `biblio.volume`, `.issue` | `volume`, `number` | |
| `biblio.first_page`, `.last_page` | `pages` | |
| `language` | `langid` | |
| `doi` | `doi` | strip `https://doi.org/` |

### Data quality observed

- **Names are single strings.** No given and family parts. Splitting
  "Duncan J. Watts" is easy; splitting "Ludwig van Beethoven" or a Spanish
  double surname is guesswork.
- **The chapter has no container**: `source` is null, so no book title, no
  editors, no ISBN, no publisher.
- `publication_date` is `2009-09-01` where Crossref has only `2009-09`. The
  day is invented. Use `publication_year` and compare with Crossref.
- A page range of one page is given as `first_page: "276"`,
  `last_page: "276"`.
- Title with markup removed and the space with it: `"HelenEpigrammatopoios"`
  for "Helen *Epigrammatopoios*".
- `language` is `en` for the chapter although Crossref has no language for it.
  The value is inferred by OpenAlex.
- The search endpoint does full-text search
  (`"oql": "works where full text has (...)"`), so results are less precise
  than Crossref's `query.bibliographic`. The third hit was neither the book
  nor a review of it, but an article in *Classical Antiquity* (674 hits in
  all).
- It does distinguish `book-review`, which Crossref does not.

## 5. Open Library

**Status: works, but the data quality is too low for scholarly citation and
the usage policy discourages use as a backend.**

### Requests

```sh
curl -sS -L -A "$UA" 'https://openlibrary.org/isbn/9780674033818.json'
curl -sS -L -A "$UA" 'https://openlibrary.org/isbn/9783406568442.json'
curl -sS    -A "$UA" 'https://openlibrary.org/api/books?bibkeys=ISBN:9780674033818&format=json&jscmd=data'
curl -sS    -A "$UA" 'https://openlibrary.org/api/books?bibkeys=ISBN:9783406568442&format=json&jscmd=data'
curl -sS    -A "$UA" 'https://openlibrary.org/api/books.json?bibkeys=ISBN:9780674033818&jscmd=data'
curl -sS    -A "$UA" 'https://openlibrary.org/api/books.json?bibkeys=ISBN:9783406568442&jscmd=data'
curl -sS    -A "$UA" 'https://openlibrary.org/search.json?q=ancient+literacy+harris&limit=3&fields=key,title,subtitle,author_name,first_publish_year,publisher,publish_place,isbn,language,edition_count,editions,editions.title,editions.subtitle,editions.publisher,editions.publish_date,editions.isbn,editions.language'
```

| Request | HTTP |
|---|---|
| `/isbn/{isbn}.json` | 302 to `/books/OL...M.json`, then 200 |
| `/api/books?bibkeys=...&format=json&jscmd=data` | **404**, empty body, three attempts, both ISBNs |
| `/api/books.json?bibkeys=...&jscmd=data` | 200 |
| `/search.json` | 200 |

Response time 0.6-1.3 s, two requests took 5.7 s.

### Terms of use

- <https://openlibrary.org/developers/api>
- "Due to limited resources, they are not intended to serve as a data backend
  for third-party services." Priority is given to open-source projects,
  library and education tools, and "real-time, low-volume, high-value use".
- 1 request/s unidentified, 3 requests/s with a User-Agent that names the
  application and a contact address.
- Do not harvest, do not make "hundreds of single-book requests", cache
  responses. Monthly data dumps exist for bulk use.
- `/api/books` is documented as a "legacy endpoint and may be phased out"
  (<https://openlibrary.org/dev/docs/api/books>). This agrees with the 404.
- A licensing heading exists on the page, but no licence text was found in
  what was retrieved. It is not asserted here.

### Response format and sample

`/isbn/9780674033818.json`, trimmed:

```json
{
  "title": "Ancient Literacy (British Museum)",
  "authors": [{"key": "/authors/OL1003456A"}],
  "publishers": ["Harvard University Press"],
  "publish_date": "October 1, 1991",
  "edition_name": "New Ed edition",
  "physical_format": "Paperback",
  "number_of_pages": 406,
  "languages": [{"key": "/languages/eng"}],
  "isbn_13": ["9780674033818"], "isbn_10": ["0674033817"],
  "works": [{"key": "/works/OL4776985W"}]
}
```

`/isbn/9783406568442.json`, trimmed:

```json
{
  "title": "Das kulturelle Gedachtnis",
  "subtitle": "Schrift, Erinnerung und politische Identitat in fruhen Hochkulturen",
  "authors": [{"key": "/authors/OL69352A"}],
  "publishers": ["Beck C. H."],
  "publish_date": "Jun 04, 2008",
  "isbn_13": ["9783406568442"],
  "lc_classifications": ["CB311.A78 2005"]
}
```

`/api/books.json`, trimmed (author names are resolved here):

```json
{"ISBN:9780674033818": {
  "title": "Ancient Literacy (British Museum)",
  "authors": [{"url": "http://openlibrary.org/authors/OL1003456A/William_V._Harris",
               "name": "William V. Harris"}],
  "publishers": [{"name": "Harvard University Press"}],
  "publish_date": "October 1, 1991",
  "number_of_pages": 406,
  "identifiers": {"isbn_10": ["0674033817"], "isbn_13": ["9780674033818"]}
}}
```

`/search.json`, three hits, trimmed:

```json
{"author_name":["William V. Harris"],"first_publish_year":1989,"isbn":["0674033809","9780674033801"],"publish_place":["Cambridge, Mass"],"publisher":["Harvard University Press"],"title":"Ancient literacy"}
{"author_name":["William V. HARRIS"],"first_publish_year":2009,"isbn":["9780674038370","0674038371"],"publisher":["Harvard University Press"],"title":"Ancient Literacy"}
{"author_name":["William V. Harris"],"first_publish_year":1991,"isbn":["0674033817","9780674033818"],"publisher":["Harvard University Press"],"title":"Ancient Literacy (British Museum)"}
```

### Field mapping

| Open Library | BibLaTeX | Remark |
|---|---|---|
| record type | `@book` | there is no type information; everything is an edition of a book |
| `authors[].name` (`/api/books.json`) or `author_name[]` (search) | `author` | single string, given name first; `/isbn/` gives only a key that needs a second request |
| `title`, `subtitle` | `title`, `subtitle` | |
| `publishers[]` | `publisher` | |
| `publish_places[]` / `publish_place[]` | `location` | absent from both ISBN records |
| `publish_date` | `date` | free text, take the year only |
| `edition_name` | `edition` | free text |
| `series[]` | `series` | not present in the samples, unverified |
| `isbn_13[]`, `isbn_10[]` | `isbn` | |
| `languages[].key` | `langid` | `/languages/eng` |
| `number_of_pages` | `pagetotal` | |

### Data quality observed

- Wrong title: `Ancient Literacy (British Museum)`. The book has nothing to do
  with the British Museum. The record comes from a bookseller feed
  (`source_records: amazon:..., bwb:...`).
- **Diacritics removed**: `Gedachtnis`, `Identitat`, `fruhen`.
- Publisher inverted: `Beck C. H.`
- Dates are bookseller dates in two formats (`October 1, 1991`,
  `Jun 04, 2008`). The German record gives 2008 for an edition that DNB dates
  2007.
- No place of publication in either ISBN record, no series (Beck'sche Reihe
  1307), no edition statement for the German book.
- Author in capitals in one work record: `William V. HARRIS`.
- The same book is three separate works in the search, one per edition.
- Editors and translators are not distinguished from authors.

## 6. Library of Congress

### 6a. SRU (`lx2.loc.gov:210`)

**Status: unreliable.** It answers a script, without key, but only over plain
HTTP, and identical queries returned different results.

#### Requests

```sh
curl -sS -A "$UA" 'http://lx2.loc.gov:210/lcdb?version=1.1&operation=searchRetrieve&query=bath.isbn%3D9780674033818&maximumRecords=1&recordSchema=mods'
curl -sS -A "$UA" 'https://lx2.loc.gov/lcdb?version=1.1&operation=searchRetrieve&query=bath.isbn%3D9780674033818&maximumRecords=1&recordSchema=marcxml'
curl -sS -A "$UA" 'http://lx2.loc.gov:210/lcdb?version=1.1&operation=searchRetrieve&query=bath.isbn%3D0674033809&maximumRecords=1&recordSchema=mods'
curl -sS -A "$UA" 'http://lx2.loc.gov:210/lcdb?version=1.1&operation=searchRetrieve&query=bath.isbn%3D0674033809&maximumRecords=1&recordSchema=marcxml'
curl -sS -A "$UA" 'http://lx2.loc.gov:210/lcdb?version=1.1&operation=searchRetrieve&query=bath.isbn%3D0674033809&startRecord=1&maximumRecords=1&recordSchema=marcxml'
curl -sS -A "$UA" 'http://lx2.loc.gov:210/lcdb?version=1.1&operation=searchRetrieve&query=bath.isbn%3D0674033809&startRecord=1&maximumRecords=1&recordSchema=mods'
curl -sS -A "$UA" 'http://lx2.loc.gov:210/lcdb?version=1.1&operation=explain'
curl -sS -A "$UA" 'http://lx2.loc.gov:210/lcdb?version=1.1&operation=searchRetrieve&query=dc.title%3D%22ancient%20literacy%22%20and%20dc.creator%3Dharris&startRecord=1&maximumRecords=3&recordSchema=marcxml'
curl -sS -m 20 -A "$UA" 'http://z3950.loc.gov:7090/voyager?version=1.1&operation=searchRetrieve&query=bath.isbn%3D0674033809&maximumRecords=1&recordSchema=mods'
```

| Request | Result |
|---|---|
| Paperback ISBN `9780674033818` | 200, `numberOfRecords` 0. LoC holds only the 1989 hardback |
| HTTPS on port 443 | **404**, empty body |
| Hardback ISBN, MODS, no `startRecord` | 200, `numberOfRecords` 1, **no record**, diagnostic `info:srw/diagnostic/1/48` "Query feature unsupported", details "Access Denied (Bib-1 3 Unsupported search)" |
| Hardback ISBN, MARCXML, no `startRecord` | 200, `numberOfRecords` 1, **no record**, diagnostic `info:srw/diagnostic/1/61` "First record position out of range" |
| Same two with `startRecord=1` | 200, record returned |
| `explain` | 200, but only host, port and database; no index list |
| Title and author search with `startRecord=1` | 200, 1 record |
| Legacy host `z3950.loc.gov:7090` | connection timed out after 20 s |

Every failure arrived with HTTP 200. The application must parse
`zs:diagnostics` and must not trust the status code.

#### Terms of use

The documentation at `www.loc.gov` could not be read from a script:
`https://www.loc.gov/apis/`,
`https://www.loc.gov/standards/sru/resources/lcServers.html` and
`https://www.loc.gov/z3950/lcserver.html` all returned **HTTP 403**. No terms
are therefore quoted here. Nothing in the SRU responses indicates a key or a
rate limit. The terms must be read in a browser before this source is built in.

#### Response format and sample

SRU 1.1 XML, records as MARCXML or MODS 3.8. MARCXML for ISBN `0674033809`,
shown as tag, indicators, subfields:

```
LDR 01233pam a2200373 a 4500
008 890412s1989    mau      b    001 0 eng
010    $a    89007588
020    $a 0674033809 $q alk. paper
020    $a 9780674033801 $q (alk. paper)
050 00 $a PA53 $b .H37 1989
100 1  $a Harris, William V. $q (William Vernon)
245 10 $a Ancient literacy / $c William V. Harris.
260    $a Cambridge, Mass. : $b Harvard University Press, $c 1989.
300    $a xv, 383 p. ; $c 25 cm.
504    $a Bibliography: p. 339-369.
650  0 $a Literacy $z Greece.
```

The same record as MODS, trimmed:

```xml
<mods xmlns="http://www.loc.gov/mods/v3" version="3.8">
  <titleInfo><title>Ancient literacy</title></titleInfo>
  <name type="personal" usage="primary">
    <namePart>Harris, William V. (William Vernon)</namePart>
  </name>
  <typeOfResource>text</typeOfResource>
  <originInfo>
    <place><placeTerm type="code" authority="marccountry">mau</placeTerm></place>
    <issuance>monographic</issuance>
    <place><placeTerm type="text">Cambridge, Mass</placeTerm></place>
    <agent><namePart>Harvard University Press</namePart></agent>
    <dateIssued>1989</dateIssued>
  </originInfo>
  <language><languageTerm authority="iso639-2b" type="code">eng</languageTerm></language>
  <physicalDescription><extent>xv, 383 p. ; 25 cm.</extent></physicalDescription>
  <identifier type="isbn">0674033809</identifier>
  <identifier type="isbn">9780674033801</identifier>
  <identifier type="lccn">89007588</identifier>
</mods>
```

#### Field mapping

Tables B and C.

#### Data quality observed

- Cataloguing is authoritative and consistent.
- MARC fields carry ISBD punctuation that must be removed: `Ancient literacy /`,
  `Cambridge, Mass. :`, `Harvard University Press,`, `1989.`
- The MODS conversion has removed that punctuation, but it has merged the
  fuller form of the name into the name: `Harris, William V. (William Vernon)`.
  In MARC it is separate in `100 $q`. **Prefer MARCXML.**
- Coverage follows the LoC's own holdings: the paperback ISBN is not found.
- Older record using 260, not 264, and AACR2 abbreviations (`p.`, `Mass.`).

### 6b. loc.gov JSON API

**Status: blocked.**

```sh
curl -sS -A "$UA" 'https://www.loc.gov/books/?q=ancient+literacy+harris&fo=json&c=3&at=results,pagination'
```

HTTP **403**, `cf-mitigated: challenge`, `server: cloudflare`, body an HTML
page titled "Just a moment...". This is a browser challenge that a desktop
application cannot pass and should not try to circumvent. No JSON was
obtained, so no sample and no mapping are given.

## 7. K10plus union catalogue SRU

**Status: works.** Fast (0.5-0.8 s), HTTPS, no key, CC0. The best book
metadata of the sources tested, including for the English title.

### Requests

```sh
curl -sS -A "$UA" 'https://sru.k10plus.de/opac-de-627?version=1.1&operation=searchRetrieve&query=pica.isb%3D9783406568442&maximumRecords=2&recordSchema=marcxml'
curl -sS -A "$UA" 'https://sru.k10plus.de/opac-de-627?version=1.1&operation=searchRetrieve&query=pica.isb%3D9783406568442&maximumRecords=5&recordSchema=marcxml'
curl -sS -A "$UA" 'https://sru.k10plus.de/opac-de-627?version=1.1&operation=searchRetrieve&query=pica.isb%3D9780674033818&maximumRecords=1&recordSchema=mods'
curl -sS -A "$UA" 'https://sru.k10plus.de/opac-de-627?version=1.1&operation=searchRetrieve&query=pica.all%3D%22kulturelle+Ged%C3%A4chtnis+Assmann%22&maximumRecords=3&recordSchema=marcxml'
```

All HTTP 200. Hits: 5 for the German ISBN, 4 for the English ISBN, 118 for the
free-text query. No rate-limit headers.

### Terms of use

- <https://wiki.k10plus.de/display/K10PLUS/SRU>,
  <https://wiki.k10plus.de/display/K10PLUS/Open+Data>
- Licence: CC0. "Die Katalogdaten werden der Öffentlichkeit unter Maßgabe der
  Creative Commons Lizenz CC0 veröffentlicht. Sie sind somit gemeinfrei".
  The statement on the Open Data page is worded for the data offered for
  download; the SRU page itself names no licence.
- No key for `opac-de-627`. Some other databases on the same server are
  restricted by IP address or credentials.
- No rate limit is published. Operated by VZG (GBV) and BSZ.
- Schemas: `marcxml`, `marcxml-legacy`, `mods`, `picaxml` and others.
- Indexes used: `pica.isb` (ISBN), `pica.tit` (title), `pica.all` (all words).

### Response format and sample

SRU 1.1 XML. MARCXML, record 4 of 5 for ISBN `9783406568442`:

```
020    $a 3406568440 $q  : kart. : EUR 12.95 $9 3-406-56844-0
020    $a 9783406568442 $q  : kart. : EUR 12.95 $9 978-3-406-56844-2
041    $a ger
100 1  $a Assmann, Jan $d 1938-2024 $e VerfasserIn $0 (DE-588)11805077X [...] $4 aut
245 14 $a Das kulturelle Gedächtnis $b Schrift, Erinnerung und politische Identität in frühen Hochkulturen $c Jan Assmann
250    $a 7. Auflage
264  1 $a München $b Verlag H.C.Beck $c 2013
490 0  $a Beck'sche Reihe $v 1307
776 08 $i Erscheint auch als $n Online-Ausgabe [...] $z 9783406703409 $z 3406703402
```

Record 1 of 5, the e-book, found through its 776 link to the print ISBN:

```
020    $a 9783406703409 $9 978-3-406-70340-9
245 14 $a Das kulturelle Gedächtnis $b Schrift, Erinnerung [...] $c Jan Assmann
250    $a 7. Auflage
264  1 $a München $b C.H.Beck $c [2017]
264  4 $c ©2017
300    $a 1 Online-Ressource (344 Seiten) $b Illustrationen
490 0  $a Beck'sche Reihe $v 1307
776 1  $z 9783406568442
```

Translation with translator, from the free-text search:

```
245 10 $a Bunkateki kioku $b kodai chichūkai shobunka ni okeru shoji, sōki, seijiteki aidentiti = Das kulturelle Gedächtnis : Schrift, Erinnerung und politische Identität in frühen Hochkulturen $c Yan Asuman cho ; Yasukawa Haruki yaku
264  1 $a Tōkyōto $b Fukumura Shuppan $c 2024nen 7gatsu 5ka
700 1  $a Yasukawa, Haruki $d 1973- $e ÜbersetzerIn [...] $4 trl
```

### Field mapping

Tables B and C. Specific to K10plus:

| K10plus | Handling |
|---|---|
| 020 $9 | hyphenated form of the ISBN; use it for display, $a for matching |
| 020 $q | binding and price, discard |
| 100/700 $e `VerfasserIn`, `ÜbersetzerIn`, `HerausgeberIn` | ignore; use the code in $4 |
| 264 ind2=4 | copyright date; use only when there is no 264 ind2=1 $c |
| 776 $z | ISBN of the other format; the reason an e-book record is returned for a print ISBN |

### Data quality observed

- Subtitles, edition, series and number, place, role codes and authority
  identifiers (GND) are present throughout. No ISBD punctuation in the fields.
- Text is in Unicode NFC.
- **Several records per ISBN.** Five for one ISBN: three e-book records that
  only refer to the print ISBN in 776, and two print records (6th edition
  2007 and 7th edition 2013) that share the same ISBN. The application must
  rank records whose 020 $a equals the query above those that match only
  through 776, and must let the user choose the edition.
- Typing errors in individual records: `$c Jsan Assmann`,
  `$b Verlag H.C.Beck`.
- Publisher name varies between records of the same house: `Beck`, `C.H.Beck`,
  `C.H. Beck`, `Verlag C.H. Beck`, `Verlag H.C.Beck`.
- Records taken over from e-book vendors are poorer: series as
  `Beck'sche Reihe $v v.1307`, edition as `7. Auflage 2013`, a title in title
  case (`Vom 8. Bis Zum 13. Jahrhundert Durch das Los und Andere Methoden`),
  publisher `Ludwig Reichert Dr.`, series `... Series $v v.23.0`.
- For the English book the first record was the 2009 e-book, place `Cambridge`
  without state, and the table of contents contained mis-encoded characters
  (`100 B.C.â€?250 A.D.`).
- Free-text search ranking is weak: the second hit of 118 for
  "kulturelle Gedächtnis Assmann" was an unrelated book on Coptic patriarchs.
  Use `pica.tit` and `pica.per` for fielded search rather than `pica.all`.
  (`pica.per` was not tested.)
- Dates in non-Western records are transliterated free text:
  `2024nen 7gatsu 5ka`. Fall back to 008/07-10.

## 8. Deutsche Nationalbibliothek SRU

**Status: works, no access token needed.**

### Requests

```sh
curl -sS -A "$UA" 'https://services.dnb.de/sru/dnb?version=1.1&operation=searchRetrieve&query=num%3D9783406568442&maximumRecords=2&recordSchema=MARC21-xml'
curl -sS -A "$UA" 'https://services.dnb.de/sru/dnb?version=1.1&operation=searchRetrieve&query=tit%3D%22kulturelle%20Ged%C3%A4chtnis%22%20and%20per%3DAssmann&maximumRecords=3&recordSchema=MARC21-xml'
```

Both HTTP 200, 0.5-0.7 s. 2 and 30 hits. No `accessToken` parameter was sent.

### Terms of use

- <https://www.dnb.de/EN/Professionell/Metadatendienste/Datenbezug/SRU/sru_node.html>
- "The SRU interface can be accessed free of charge and without registration."
- Licence: CC0 for the bibliographic data and the GND authority data. The
  statement was read on the K10plus Open Data page, which quotes the DNB;
  the DNB's own terms page (<https://www.dnb.de/businessmodel.html>) was not
  read.
- At most 100 records per response, at most 99 000 results per query.
- Without `recordSchema` the response is RDF/XML. Ask for `MARC21-xml`.
- Indexes used: `num` (ISBN and other numbers), `tit`, `per` (person).

### Response format and sample

SRU 1.1 XML with MARC 21 XML records.

```
LDR 00000nam a2200000 c 4500
008 130204s2013    gw ||||| |||| 00||||ger
020    $a 9783406568442 $c kart. : EUR 12.95 $9 978-3-406-56844-2
041    $a ger
100 1  $0 (DE-588)11805077X $0 https://d-nb.info/gnd/11805077X [...] $a Assmann, Jan $d 1938-2024 $e Verfasser $4 aut $2 gnd
245 10 $a [U+0098]Das[U+009C] kulturelle Gedächtnis $b Schrift, Erinnerung und politische Identität in frühen Hochkulturen $c Jan Assmann
250    $a 7. Aufl.
264  1 $a München $b Beck $c 2013
300    $a 344 S. $c 19 cm
490 1  $a Beck'sche Reihe $v 1307
830  0 $a Beck'sche Reihe $v 1307 $w (DE-101)010513507 [...]
```

### Field mapping

Table B. Specific to DNB:

| DNB | Handling |
|---|---|
| 245 $a with U+0098 ... U+009C | non-sorting part is marked with these control characters (sent as `&#152;` and `&#156;`), and ind2 is 0. Remove both characters, keep the article |
| 020 $c | binding and price, discard |
| 020 $z | second record had `$z 9783406568466`, a cancelled ISBN. Do not import |
| 830 $a, $v | authorised series; preferred over 490 |
| all text | Unicode NFD (`a` followed by U+0308). Normalise to NFC |

### Data quality observed

- Authoritative for German-language publications (legal deposit), consistent,
  with GND links.
- **Decomposed Unicode and C1 control characters in titles.** Both are
  invisible in most displays and break string comparison and LaTeX
  compilation if left in.
- Coverage is limited to works published in Germany, in German, or about
  Germany. The English test ISBN was not queried here.
- Two records for one ISBN, 6th and 7th edition, as in K10plus.
- Publisher in short form (`Beck`), following the older German rules; the
  2025 record has `C.H. Beck`.
- The third free-text hit was an article (`LDR ...naa...`) with no ISBN, so
  component parts are included in results and must be typed from the leader.

## 9. Norwegian sources

### 9a. National Library of Norway (`api.nb.no`)

**Status: works.** Fast (0.3 s), HTTPS, no key.

#### Requests

```sh
curl -sS -A "$UA" 'https://api.nb.no/catalog/v1/items?q=Hamsun+Reisen+til+Hitler+Rem&mediatype=b%C3%B8ker&size=3'
curl -sS -A "$UA" 'https://api.nb.no/catalog/v1/items?q=isbn:9788202413736&size=3'
curl -sS -A "$UA" 'https://api.nb.no/catalog/v1/metadata/42ef89cb50684bc302a35833f9746c26/mods'
curl -sS -A "$UA" 'https://api.nb.no/catalog/v1/reference/42ef89cb50684bc302a35833f9746c26/ris'
```

All HTTP 200. The ISBN query returned exactly one item.

#### Terms of use

- API description: <https://api.nb.no/> (Swagger UI), specification at
  `https://api.nb.no/catalog/v1/items/api-docs`.
- **No terms of use, licence or rate limit are stated in the API
  description.** Two guessed addresses for a terms page on `www.nb.no`
  returned 404. Contact given in the specification: `nasa@nb.no`.
- The licence of the metadata must be confirmed with the library before
  release. It is not asserted here.
- The search covers OCR full text by default. Use `searchType` to restrict to
  metadata, or a fielded query (`isbn:`, `title:`, `namecreators:`).

#### Response format and sample

HAL+JSON for search, with links to MODS, RIS, EndNote and Dublin Core for
each item.

```json
{
  "id": "42ef89cb50684bc302a35833f9746c26",
  "metadata": {
    "title": "Knut Hamsun : reisen til Hitler",
    "creators": ["Rem, Tore"],
    "originInfo": {"publisher": "Cappelen Damm", "issued": "2014"},
    "geographic": {"city": "Oslo"},
    "languages": [{"code": "nob"}],
    "identifiers": {"isbn13": ["9788202413736"],
                    "oaiId": "oai:nb.bibsys.no:991427413704702202",
                    "urn": "URN:NBN:no-nb_digibok_2019080807142"},
    "mediaTypes": ["bøker"],
    "pageCount": 409
  },
  "_links": {"mods": {"href": "https://api.nb.no:443/catalog/v1/metadata/42ef89cb50684bc302a35833f9746c26/mods"},
             "ris":  {"href": "https://api.nb.no:443/catalog/v1/reference/42ef89cb50684bc302a35833f9746c26/ris"}}
}
```

MODS, trimmed:

```xml
<mods xmlns="http://www.loc.gov/mods/v3" version="3.8">
  <titleInfo><title>Knut Hamsun</title><subTitle>reisen til Hitler</subTitle></titleInfo>
  <name type="personal" usage="primary">
    <namePart>Rem, Tore</namePart>
    <namePart type="date">1967-</namePart>
    <role><roleTerm authority="marcrelator" type="code">aut</roleTerm></role>
  </name>
  <genre authority="marcgt">biography</genre>
  <originInfo>
    <issuance>monographic</issuance>
    <place><placeTerm type="text">Oslo</placeTerm></place>
    <agent><namePart>Cappelen Damm</namePart><role><roleTerm>publisher</roleTerm></role></agent>
    <dateIssued>2014</dateIssued>
  </originInfo>
  <language><languageTerm authority="iso639-2b" type="code">nob</languageTerm></language>
  <physicalDescription><extent>395 s. ill.</extent></physicalDescription>
</mods>
```

RIS as returned, trimmed:

```
TY - BOOK
T1 - Knut Hamsun
A2 - Rem, Tore
Y1 - 2014///
PB - Cappelen Damm
CY - Oslo
SN - 9788202413736
LA - Norsk (Bokmål)
```

#### Field mapping

Table C for MODS. For the JSON, which is enough for a result list:

| NB JSON | BibLaTeX | Remark |
|---|---|---|
| `metadata.title` | `title` and `subtitle` | one string, split at ` : ` |
| `metadata.creators[]` | `author` | `Family, Given`; no role |
| `metadata.originInfo.publisher` | `publisher` | |
| `metadata.geographic.city` | `location` | |
| `metadata.originInfo.issued` | `date` | |
| `metadata.languages[].code` | `langid` | `nob`, `nno`, `dan` |
| `metadata.identifiers.isbn13[]` | `isbn` | |
| `metadata.identifiers.urn` | `url` as `https://urn.nb.no/{urn}` | digitised copy |
| `metadata.mediaTypes[]` | entry type | `bøker` = `@book`, `tidsskrift` and `aviser` need the MODS |

#### Data quality observed

- The MODS is good: title and subtitle separated, role code, place, language.
- **The RIS export is faulty**: the author is given as `A2` (secondary
  author, that is, editor), and the subtitle is missing from `T1`. Do not use
  the RIS or EndNote links. Use MODS.
- `pageCount` in the JSON is 409 where the catalogue record has `395 s.`
  It is presumably the number of scanned images. Do not use it.
- `place` occurs three times in the MODS `originInfo`; only
  `placeTerm[@type='text']` is a place name.
- A free-text query matched 13 300 items because OCR text is searched. The
  first hit was the Danish translation.
- Coverage is what Norway's legal deposit covers, which is the purpose of the
  source.

### 9b. Alma SRU for the Norwegian library network (Sikt, formerly BIBSYS)

**Status: works.** This is the current endpoint.

#### Requests

```sh
curl -sS -A "$UA" 'https://bibsys.alma.exlibrisgroup.com/view/sru/47BIBSYS_NETWORK?version=1.2&operation=searchRetrieve&recordSchema=marcxml&maximumRecords=2&query=alma.isbn%3D9788202413736'
curl -sS -A "$UA" 'https://bibsys.alma.exlibrisgroup.com/view/sru/47BIBSYS_NETWORK?version=1.2&operation=searchRetrieve&recordSchema=marcxml&maximumRecords=3&query=alma.all_for_ui%3D%22Hamsun%20reisen%20til%20Hitler%22'
curl -sS -A "$UA" 'https://sru.bibsys.no/search/biblio?version=1.2&operation=searchRetrieve&recordSchema=marcxchange&maximumRecords=1&query=bs.isbn%3D9788202413736'
```

| Request | Result |
|---|---|
| `alma.isbn` | 200, 1 record, 0.5 s |
| `alma.all_for_ui` | 200, 14 records, 1.1 s |
| `sru.bibsys.no` (old endpoint) | **DNS failure**, "Could not resolve host" |

#### Terms of use

- Dataset entry:
  <https://data.norge.no/en/datasets/a2bff8ba-70aa-4eed-aedf-19eeab55e42a/bibsys-bibliotekbase-bibliografiske-data-sru>.
  Publisher Sikt. Licence: Norwegian Licence for Open Government Data
  (NLOD), which requires that the source be named. The endpoint listed there
  is the one tested.
- "Tjenesten kan benyttes av alle, men ved utstrakt bruk og mange kall ber vi
  om at dere tar kontakt med oss". No numeric limit.
- Protocol documentation:
  <https://developers.exlibrisgroup.com/alma/integrations/sru/>. SRU 1.2,
  `maximumRecords` 0-50, schemas include `marcxml` and `unimarcxml`.
- The host belongs to Ex Libris (Clarivate). The address may change if the
  consortium changes system.

#### Response format and sample

SRU 1.2 XML with MARC 21 XML.

```
LDR 05699cam a2200829 c 4500
008 150605s2014    no a|||e| ||||00||0bnob|^
020    $a 978-82-02-41373-6 $q ib. $c Nkr 449.00
100 1  $a Rem, Tore $d 1967- $4 aut $0 (NO-TrBIB)90772705
245 10 $a Knut Hamsun : $b reisen til Hitler $c Tore Rem
260    $a [Oslo] $b Cappelen Damm $c 2014
300    $a 395 s. $b ill.
856 42 $3 Forlagets beskrivelse (kort) $u https://www.cappelendamm.no/_knut-hamsun-tore-rem-9788202413736
856 41 $3 Fulltekst $u https://urn.nb.no/URN:NBN:no-nb_digibok_2019080807142 $y Nettbiblioteket
```

#### Field mapping

Table B. Specific to this source:

| Alma (Norway) | Handling |
|---|---|
| 020 $a | **hyphenated** (`978-82-02-41373-6`). Remove hyphens before comparing |
| 245 $a | ends in ` :` before $b. Remove trailing ` :`, ` /`, ` =` |
| 260 $a | `[Oslo]`. Remove square brackets |
| 856 ind2=2 | cover images and publisher blurbs. Do not import as `url` |
| 100/700 $4 `rev` | reviewer; the record is a review |

#### Data quality observed

- Good cataloguing, with authority identifiers. Partial ISBD punctuation.
- Text is in Unicode NFC.
- At least nine 856 fields in one record, of which one is a full-text link.
- The free-text search returned articles and reviews first (`LDR ...caa...`),
  not the monograph, among 14 hits. Use `alma.title` and `alma.creator` for
  fielded search. (These two index names are from the Ex Libris
  documentation and were not tested.)
- Record uses 260, not 264.
- This catalogue covers the academic libraries and therefore also foreign
  scholarly books, which the National Library's own API covers less well.

## 10. Bibliothèque nationale de France SRU

**Status: works.** HTTPS, no key, 0.3-1.0 s (one request 5.4 s).

### Requests

```sh
curl -sS -A "$UA" 'https://catalogue.bnf.fr/api/SRU?version=1.2&operation=searchRetrieve&query=bib.isbn%20adj%20%229782707302755%22&recordSchema=unimarcxchange&maximumRecords=2'
curl -sS -A "$UA" 'https://catalogue.bnf.fr/api/SRU?version=1.2&operation=searchRetrieve&query=bib.isbn%20adj%20%229782707302755%22&recordSchema=dublincore&maximumRecords=1'
curl -sS -A "$UA" 'https://catalogue.bnf.fr/api/SRU?version=1.2&operation=searchRetrieve&query=bib.isbn%20adj%20%222707302759%22&recordSchema=unimarcxchange&maximumRecords=2'
curl -sS -A "$UA" 'https://catalogue.bnf.fr/api/SRU?version=1.2&operation=searchRetrieve&query=bib.author%20all%20%22Bourdieu%22%20and%20bib.title%20all%20%22distinction%20critique%20sociale%20jugement%22&recordSchema=unimarcxchange&maximumRecords=3'
```

| Request | Result |
|---|---|
| ISBN-13 `9782707302755`, either schema | 200, **0 records** |
| ISBN-10 `2707302759` | 200, 1 record |
| Author and title | 200, 2 records |

### Terms of use

- <https://api.bnf.fr/fr/api-sru-catalogue-general>,
  <https://www.bnf.fr/fr/conditions-de-reutilisations-des-donnees-de-la-bnf>
- "accessible à tous sans authentification".
- Licence: Licence Ouverte / Open Licence of the French State (Etalab).
  Reuse is free, including commercially, on condition that the source and the
  date of retrieval are stated.
- No rate limit is published. The documentation examples use
  `maximumRecords=100`.
- Schemas: `unimarcxchange`, `intermarcxchange`, `dublincore`. **No MARC 21.**

### Response format and sample

SRU 1.2 XML; records in MarcXchange (ISO 25577) carrying UNIMARC. The record
identifier is an ARK in the `id` attribute.

```
record id="ark:/12148/cb34628792q" format="UNIMARC" type="Bibliographic"
010    $a 2-7073-0275-9 $b Br. $d 46,70 F
100    $a 19791115d1979    m  y0frey50      ba
101 0  $a fre
102    $a FR
200 1  $a La distinction $b Texte imprimé $e critique sociale du jugement $f Pierre Bourdieu
210    $a Paris $c Éditions de Minuit $d 1979 $e 61-Alençon $g impr. Corbière et Jugain
215    $a 670 p. $c ill., couv. ill. $d 22 cm
225 |  $a Le Sens commun $v 58
410  0 $0 34234519 $t Le Sens commun $x 0768-049X $v 58
700  | $3 11893402 $o ISNI0000000121385892 $a Bourdieu $b Pierre $f 1930-2002 $4 070
```

### Field mapping

| UNIMARC | BibLaTeX | Remark |
|---|---|---|
| Leader/06-07 | entry type | `am` = `@book`, `aa` = component part, `as` = serial |
| 700 $a, $b | `author` as `$a, $b` | family and given name are **separate subfields** |
| 701, 702 $a, $b with $4 | `author`, `editor`, `translator` | $4 is a numeric UNIMARC code: `070` author, `340` and `651` editor, `730` translator, `080` author of preface |
| 710, 711, 712 $a | corporate `author` / `editor` | |
| 200 $a | `title` | |
| 200 $e | `subtitle` | |
| 200 $b | not imported | general material designation (`Texte imprimé`) |
| 200 $f, $g | not imported | statement of responsibility |
| 200 $h, $i | `part`, part title | |
| 205 $a | `edition` | |
| 210 or 214 $a | `location` | 214 replaces 210 in newer records; not seen today |
| 210 or 214 $c | `publisher` | |
| 210 or 214 $d | `date` | |
| 210 $e, $g | not imported | place and name of the printer |
| 100 $a, positions 9-12 | `date` | fallback |
| 101 $a | `langid` | |
| 010 $a | `isbn` | hyphenated |
| 011 $a | `issn` | |
| 225 $a, $v or 410 $t, $v | `series`, `number` | 410 is the authorised form |
| 215 $a | `pagetotal` | |
| 461 $t, 463 $t | `maintitle`, `booktitle` / `journaltitle` | not seen today, unverified |
| record `id` | `url` as `https://catalogue.bnf.fr/{ark}` | |

### Data quality observed

- Authoritative for French publications. Given and family name in separate
  subfields, ISNI included, subtitle separate, series with number and ISSN.
- **ISBN-13 lookup misses older records.** Records from before 2007 are
  indexed under the ISBN-10 only. The application must try both forms.
- A record without any ISBN (1992 reprint) was returned by the title search
  only.
- Publisher abbreviated in one record and not the other:
  `Ed. de Minuit`, `Éditions de Minuit`.
- Series title with varying capitals: `Le Sens commun`, `Le sens commun`.
- Indicators contain `|` as a fill character.
- A separate UNIMARC parser is required. This is the cost of the source.

## 11. arXiv API

**Status: works.**

### Requests

```sh
curl -sS -L -A "$UA" 'https://export.arxiv.org/api/query?id_list=1706.03762'
curl -sS    -A "$UA" 'https://export.arxiv.org/api/query?search_query=ti:%22digital+humanities%22&start=0&max_results=2'
```

Both HTTP 200, 0.3-0.5 s, `content-type: application/atom+xml`.

### Terms of use

- <https://info.arxiv.org/help/api/tou.html>,
  <https://info.arxiv.org/help/api/index.html>
- Metadata is CC0 1.0.
- "no more than one request every three seconds, and limit requests to a
  single connection at a time". The limit applies to all machines under the
  client's control taken together.
- Requested acknowledgement in the product: "Thank you to arXiv for use of
  its open access interoperability."
- Do not use arXiv's name or logo in a way that implies endorsement.
- No key.

### Response format and sample

Atom 1.0 XML with `arxiv:` and `opensearch:` extensions.

```xml
<entry>
  <id>http://arxiv.org/abs/1706.03762v7</id>
  <title>Attention Is All You Need</title>
  <updated>2023-08-02T00:41:18Z</updated>
  <published>2017-06-12T17:57:34Z</published>
  <link href="https://arxiv.org/abs/1706.03762v7" rel="alternate" type="text/html"/>
  <arxiv:comment>15 pages, 5 figures</arxiv:comment>
  <arxiv:primary_category term="cs.CL"/>
  <category term="cs.CL" scheme="http://arxiv.org/schemas/atom"/>
  <author><name>Ashish Vaswani</name></author>
  <author><name>Noam Shazeer</name></author>
  [...]
</entry>
```

From the search, an entry with a published version:

```xml
<title>Data Lakes for Digital Humanities</title>
<published>2020-12-04T08:18:48Z</published>
<arxiv:journal_ref>2nd International Digital Tools &amp; Uses Congress (DTUC 2020), Oct 2020, Hammamet, Tunisia. pp.38-41</arxiv:journal_ref>
<arxiv:doi>10.1145/3423603.3424004</arxiv:doi>
```

### Field mapping

| arXiv Atom | BibLaTeX | Remark |
|---|---|---|
| entry | `@online` | when `arxiv:doi` is present, offer to fetch the published version through section 1 instead |
| `author/name` | `author` | single string, given name first |
| `title` | `title` | collapse line breaks and runs of spaces; may contain TeX |
| `published` | `date` | date of version 1 |
| `updated` | not imported | date of the latest version |
| `id` | `eprint` = `1706.03762`, `eprinttype` = `arxiv` | strip the prefix and the version suffix |
| `arxiv:primary_category/@term` | `eprintclass` | |
| `id` with version | `version` | optional |
| `link[@rel='alternate']/@href` | `url` | |
| `arxiv:doi` | `doi` | DOI of the published version |
| `arxiv:journal_ref` | `note` or `howpublished` | free text, cannot be parsed reliably |
| `summary` | `abstract` | |

### Data quality observed

- Author names are single strings entered by the submitter.
- `journal_ref` is free text.
- The title of the query feed is also a `<title>` element. Read titles only
  inside `<entry>`.
- A request for an identifier that does not exist was not tested.
- The DataCite record for the same preprint (`10.48550/arXiv.1706.03762`,
  section 1) has given and family names separated but only the year. For
  names DataCite is better; for the date arXiv is better.

## 12. PubMed E-utilities

**Status: works.**

### Requests

```sh
curl -sS -A "$UA" 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=19008416&retmode=json&tool=glaukopis&email=post@robertemilberge.no'
curl -sS -A "$UA" 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=19008416&retmode=xml&tool=glaukopis&email=post@robertemilberge.no'
```

Both HTTP 200, 0.6-0.8 s. Response headers: `x-ratelimit-limit: 3`,
`x-ratelimit-remaining: 2`.

### Terms of use

- Policy page: <https://www.ncbi.nlm.nih.gov/books/NBK25497/>. **It could not
  be read from a script**: the response was a "Checking your browser -
  reCAPTCHA" page. The API itself is not affected.
- Observed in the headers: 3 requests per second without a key.
- From a web search, not from the policy page itself: up to 10 requests per
  second with an API key from an NCBI account; `tool` and `email` parameters
  identify the software, and the e-mail address should be the developer's,
  not the end user's. These two statements are unverified and must be read
  in a browser before release.

### Response format and sample

`esummary` returns JSON, `efetch` returns XML (PubMed DTD, 1 January 2025).

`esummary`, trimmed:

```json
{
  "uid": "19008416",
  "pubdate": "2008 Dec 12", "epubdate": "2008 Nov 13",
  "source": "Science",
  "fulljournalname": "Science (New York, N.Y.)",
  "authors": [{"name": "Varambally S", "authtype": "Author"},
              {"name": "Cao Q", "authtype": "Author"}],
  "title": "Genomic loss of microRNA-101 leads to overexpression of histone methyltransferase EZH2 in cancer.",
  "volume": "322", "issue": "5908", "pages": "1695-9",
  "lang": ["eng"], "issn": "0036-8075", "essn": "1095-9203",
  "pubtype": ["Journal Article", "Research Support, N.I.H., Extramural"],
  "articleids": [{"idtype": "pubmed", "value": "19008416"},
                 {"idtype": "doi", "value": "10.1126/science.1165395"},
                 {"idtype": "pmc", "value": "PMC2684823"}]
}
```

`efetch`, trimmed:

```xml
<Article PubModel="Print-Electronic">
  <Journal>
    <ISSN IssnType="Electronic">1095-9203</ISSN>
    <JournalIssue CitedMedium="Internet">
      <Volume>322</Volume><Issue>5908</Issue>
      <PubDate><Year>2008</Year><Month>Dec</Month><Day>12</Day></PubDate>
    </JournalIssue>
    <Title>Science (New York, N.Y.)</Title>
    <ISOAbbreviation>Science</ISOAbbreviation>
  </Journal>
  <ArticleTitle>Genomic loss of microRNA-101 leads to overexpression of histone methyltransferase EZH2 in cancer.</ArticleTitle>
  <Pagination><StartPage>1695</StartPage><EndPage>1699</EndPage><MedlinePgn>1695-9</MedlinePgn></Pagination>
  <ELocationID EIdType="doi" ValidYN="Y">10.1126/science.1165395</ELocationID>
  <AuthorList CompleteYN="Y">
    <Author ValidYN="Y">
      <LastName>Varambally</LastName><ForeName>Sooryanarayana</ForeName><Initials>S</Initials>
    </Author>
    [...]
  </AuthorList>
</Article>
```

### Field mapping

Use `efetch`. `esummary` has only surname and initials.

| PubMed XML (`efetch`) | BibLaTeX | Remark |
|---|---|---|
| `PubmedArticle` | `@article` | `PubmedBookArticle` = `@book` / `@incollection`, not tested |
| `Author/LastName`, `ForeName` | `author` | |
| `Author/CollectiveName` | `author` in braces | not in the sample, unverified |
| `ArticleTitle` | `title` | remove the final full stop; square brackets mark a translated title |
| `Journal/Title` | `journaltitle` | remove the qualifier in parentheses |
| `Journal/ISOAbbreviation` | `shortjournal` | |
| `JournalIssue/Volume`, `Issue` | `volume`, `number` | |
| `JournalIssue/PubDate` | `date` | month is an English abbreviation; `MedlineDate` is free text |
| `Pagination/StartPage`, `EndPage` | `pages` | prefer these to `MedlinePgn` |
| `ISSN` | `issn` | |
| `ELocationID[@EIdType='doi']` | `doi` | |
| `PMID` | `eprint`, with `eprinttype` = `pubmed` | |
| `Language` | `langid` | |
| `Abstract/AbstractText` | `abstract` | |

### Data quality observed

- Titles end in a full stop.
- Journal title carries a cataloguing qualifier: `Science (New York, N.Y.)`.
- `MedlinePgn` and `esummary.pages` abbreviate the range: `1695-9`.
  `StartPage` and `EndPage` are complete.
- `esummary` authors are `Varambally S`: surname and initials in one string.
- Coverage is biomedicine. Of little use for the humanities except history
  of medicine and psychology. When a DOI is present, the Crossref record is
  an alternative.

## 13. Google Books API

**Status: blocked without a key.**

### Requests

```sh
curl -sS -A "$UA" 'https://www.googleapis.com/books/v1/volumes?q=isbn:9780674033818'
curl -sS -A "$UA" 'https://www.googleapis.com/books/v1/volumes?q=isbn:9783406568442'
```

Both **HTTP 429**:

```json
{"error": {"code": 429,
  "message": "Quota exceeded for quota metric 'Queries' and limit 'Queries per day' of service 'books.googleapis.com' for consumer 'project_number:624717413613'.",
  "status": "RESOURCE_EXHAUSTED",
  "details": [{"reason": "RATE_LIMIT_EXCEEDED",
    "metadata": {"quota_limit_value": "0", "quota_unit": "1/d/{project}",
                 "quota_limit": "defaultPerDayPerProject"}}]}}
```

The daily quota for requests without a key is reported as **0**. This is a
setting, not a temporary condition.

### Terms of use

- <https://developers.google.com/books/terms>,
  <https://developers.google.com/books/docs/v1/using>
- "Every request your application sends to the Books API needs to identify
  your application to Google", by API key or OAuth 2.0 token. A key requires
  a Google account and a Google Cloud project.
- "You may not charge users any fee for the use of your application" without
  a separate agreement.
- Branding guidelines and an obligation to remove content on request apply.
- A key built into a GPL application is public and shares one quota between
  all users. The quota that a key receives was not found in the pages read.

### Response format, mapping, data quality

No successful response was obtained. None of the three is described here, in
keeping with the rule not to describe an API from memory. Testing with a key
was outside what could be done without a Google account.

## 14. WorldCat

**Status: no free access.** As expected.

### Requests

```sh
curl -sS -A "$UA" 'https://americas.discovery.api.oclc.org/worldcat/search/v2/bibs?q=bn:9780674033818'
curl -sS -A "$UA" 'http://classify.oclc.org/classify2/Classify?isbn=9780674033818&summary=true'
```

| Request | Result |
|---|---|
| WorldCat Search API v2 | **401**, body "API Key or Authorization header is required" |
| Classify (formerly free) | **301** to `https://www.oclc.org/en/jfkdsj`; the service no longer exists |

### Terms of use

- <https://www.oclc.org/developer/api/oclc-apis/worldcat-search-api.en.html>
- "Libraries that maintain a OCLC Cataloging and Metadata subscription (full
  cataloging) and a FirstSearch/WorldCat Discovery subscription. Both are
  required."
- Version 1.0 of the Search API ended on 31 December 2024.
- Keys are issued to subscribing institutions, not to individuals or to
  applications.

Not usable for Glaukopis. Records in K10plus and Alma contain OCLC numbers
(`http://www.worldcat.org/oclc/1028487024` in the Alma sample), which may be
stored as an identifier without calling OCLC.

## 15. Zotero translation-server and public instances

**Status: translation-server has no public endpoint; it must be self-hosted.
Wikimedia's Citoid is a public service built on it, and it answered.**

### translation-server

- <https://github.com/zotero/translation-server>
- The README describes three ways of running it: Docker on port 1969, from
  source, and on AWS Lambda. It names no hosted instance. All examples use
  `http://127.0.0.1:1969`.
- Endpoints according to the README: `/web` (URL), `/search` (DOI, ISBN,
  PMID, arXiv id), `/export` (conversion, BibLaTeX among the formats).
- It was not run. It is a Node.js service, which is at odds with a lean
  Tauri application, and it would have to be bundled or run separately.
- Its licence was not checked today.

### Wikimedia Citoid (tested)

```sh
curl -sS -A "$UAD" 'https://en.wikipedia.org/api/rest_v1/data/citation/zotero/9780674033818'
curl -sS -A "$UAD" 'https://en.wikipedia.org/api/rest_v1/data/citation/zotero/10.1515%2F9783110272017.27'
```

Both HTTP 200, 0.5-1.8 s. Zotero JSON:

```json
[{"itemType": "book",
  "creators": [{"firstName": "William V.", "lastName": "Harris", "creatorType": "author"}],
  "title": "Ancient Literacy",
  "place": "Cambridge", "publisher": "Harvard University Press", "date": "2009",
  "numPages": "406", "ISBN": "9780674033818",
  "libraryCatalog": "K10plus ISBN"}]

[{"itemType": "bookSection",
  "creators": [{"firstName": "Franco", "lastName": "Montanari", "creatorType": "editor"},
               {"firstName": "Antonios", "lastName": "Rengakos", "creatorType": "editor"},
               {"firstName": "Christos C.", "lastName": "Tsagalis", "creatorType": "editor"},
               {"firstName": "Gregory", "lastName": "Nagy", "creatorType": "author"}],
  "title": "Signs of Hero Cult in Homeric Poetry",
  "bookTitle": "Homeric Contexts",
  "publisher": "DE GRUYTER", "date": "2012-04-12", "pages": "27–72",
  "ISBN": "9783110271959", "DOI": "10.1515/9783110272017.27",
  "libraryCatalog": "CrossRef"}]
```

| Zotero JSON | BibLaTeX |
|---|---|
| `itemType` | `book` = `@book`, `bookSection` = `@incollection`, `journalArticle` = `@article`, `thesis` = `@thesis` |
| `creators[]` by `creatorType` | `author`, `editor`, `translator` |
| `title`, `bookTitle`, `publicationTitle` | `title`, `booktitle`, `journaltitle` |
| `place`, `publisher`, `date` | `location`, `publisher`, `date` |
| `volume`, `issue`, `pages` | `volume`, `number`, `pages` |
| `series`, `seriesNumber`, `edition` | `series`, `number`, `edition` (not in the samples, unverified) |
| `ISBN`, `ISSN`, `DOI`, `url` | `isbn`, `issn`, `doi`, `url` |

Observations:

- `libraryCatalog` shows where Citoid got the record: **K10plus for the ISBN
  and Crossref for the DOI.** Citoid adds no data of its own. It confirms the
  choice of those two sources.
- For the ISBN it returned the 2009 e-book record (the first K10plus hit),
  not the 1991 paperback that was asked for.
- For the chapter it returned the editors and the ISBN, which are absent from
  Crossref's JSON and present in its UNIXREF XML (section 1).
- **The terms for Citoid were not read today.** It is run by the Wikimedia
  Foundation for Wikipedia's editors. It should not be a dependency of
  Glaukopis unless the terms are read and found to allow it.

## Recommendation

### (i) DOI lookup

1. **doi.org content negotiation with CSL-JSON** as the single entry point.
   It covers Crossref, DataCite and mEDRA without the application having to
   know the agency, needs no key, and the Crossref part is served from the
   polite pool when the User-Agent has a contact address.
2. **For `book-chapter` (and any type with a container that is a book), a
   second request for `application/vnd.crossref.unixref+xml`** to obtain the
   editors, the subtitle and the ISBN of the book. Without this, chapters
   come out as `@inbook` without editors.
3. Never the `application/x-bibtex` output. It was wrong in four ways in six
   records.
4. Fallback when doi.org is down: `api.crossref.org/works/{doi}` and
   `api.datacite.org/dois/{doi}` directly.

Post-processing that the observations make necessary: strip HTML and JATS
markup from titles, split title and subtitle, lower-case the DOI, flag
records of type `other` or without authors for the user, and offer to
normalise publishers written in capitals.

### (ii) ISBN lookup

1. **K10plus SRU, MARCXML.** Best coverage of scholarly books in all
   languages tested, CC0, fast, HTTPS, no key.
2. **Alma SRU (Sikt)** second, and first when the ISBN begins `97882`.
   Norwegian academic holdings, NLOD (name the source).
3. **DNB SRU** for `9783` when K10plus has nothing or the user wants the
   national bibliography's record.
4. **BnF SRU** for `9782` and `97910`. Requires a UNIMARC parser, so it may
   be built in a later phase.
5. **Library of Congress SRU** as the last fallback, with `startRecord=1`
   always, diagnostics parsed, one retry, and a short timeout. It is plain
   HTTP, which the application's network policy must allow explicitly.

One MARC 21 parser serves 1, 2, 3 and 5. Required in every case: try both
ISBN-10 and ISBN-13, compare ISBNs with hyphens removed, rank records whose
020 $a equals the query above those that match through 776, show all
editions and let the user choose, normalise to NFC, remove U+0098 and U+009C,
and remove ISBD punctuation.

### (iii) Free-text search for articles

1. **Crossref `/works?query.bibliographic=`** with `select=` and `rows` of at
   most 20. Names are structured and the ranking was good. Limit observed:
   3 requests/s.
2. **OpenAlex** as an optional second source, with a key that the user
   enters in the settings. It distinguishes reviews from articles, which
   Crossref does not. Without a key the budget is about 100 searches a day.
   Once the user selects an OpenAlex hit with a DOI, fetch the record through
   (i), because OpenAlex has unstructured names and no container for
   chapters.
3. **arXiv** and **PubMed** as lookups by identifier, not as general search.
   arXiv requires the acknowledgement line and 3 s between requests.

### (iv) Free-text search for books

1. **K10plus SRU** with fielded queries (`pica.tit`, `pica.per`), not
   `pica.all`.
2. **Alma SRU (Sikt)** for Norwegian and Nordic titles, with fielded queries.
3. **National Library of Norway API** for Norwegian publications outside the
   academic libraries, with `searchType` set to metadata, and MODS for the
   record. To be built in once the licence has been confirmed.
4. **DNB** and **BnF** as sources the user can switch on.

Crossref must not be offered as a book search. It returns reviews of the
book.

### Leave out

| Service | Reason |
|---|---|
| loc.gov JSON API | Blocked by a browser challenge (403) |
| Google Books | Does not work without a key (429, quota 0); a key cannot be kept secret in a GPL application; the terms restrict charging and impose branding |
| WorldCat | Subscription only (401) |
| Open Library | Wrong title, diacritics removed, no place, inverted publisher; the policy says it is not meant as a backend; the documented `/api/books` address returned 404 |
| DataCite search | DOI lookup through (i) is enough; the search returns unvetted repository deposits |
| translation-server | Needs Node.js beside the application; its results for ISBN and DOI come from K10plus and Crossref, which are called directly |
| Citoid | Terms not read; intended for Wikipedia; same sources as above |
| NB RIS and EndNote export | Author exported as secondary author, subtitle dropped |

### Open points before release

These could not be settled by calling the services and need a person with a
browser, or a letter:

1. Read the Library of Congress terms (the pages returned 403 to a script).
2. Read the NCBI usage policy (the page returned a reCAPTCHA check).
3. Ask the National Library of Norway (`nasa@nb.no`) for the licence of the
   catalogue metadata and for any rate limit.
4. Confirm the DNB terms on the DNB's own page.
5. Decide which contact address the released application sends in its
   User-Agent. Crossref, DataCite, Open Library and NCBI all ask for the
   developer's address, not the end user's. The address used for these tests
   was authorised for the tests only.
6. NLOD (Sikt), Licence Ouverte (BnF) and arXiv require that the source be
   named. The application needs a place where the source of each imported
   record is shown, and an acknowledgements page.
