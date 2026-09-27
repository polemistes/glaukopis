//! Answers of the services, for the tests. They are what the services sent on
//! 2026-09-27, without the fields that the lookup does not read (subjects,
//! holdings, reference lists). Nothing that is kept has been altered.

#![allow(dead_code)]

/// doi.org, CSL-JSON, 10.1086/599247.
pub const DOI_ARTICLE: &str = r####"{
 "publisher": "University of Chicago Press",
 "issue": "2",
 "published-print": {
  "date-parts": [
   [
    2009,
    9
   ]
  ]
 },
 "DOI": "10.1086/599247",
 "type": "journal-article",
 "page": "405-450",
 "source": "Crossref",
 "title": "Origins of Homophily in an Evolving Social Network",
 "volume": "115",
 "author": [
  {
   "given": "Gueorgi",
   "family": "Kossinets",
   "sequence": "first",
   "affiliation": [],
   "role": [
    {
     "vocabulary": "crossref",
     "role": "author"
    }
   ]
  },
  {
   "given": "Duncan J.",
   "family": "Watts",
   "sequence": "additional",
   "affiliation": [],
   "role": [
    {
     "vocabulary": "crossref",
     "role": "author"
    }
   ]
  }
 ],
 "container-title": "American Journal of Sociology",
 "original-title": [],
 "language": "en",
 "score": 1,
 "subtitle": [],
 "short-title": [],
 "issued": {
  "date-parts": [
   [
    2009,
    9
   ]
  ]
 },
 "URL": "http://dx.doi.org/10.1086/599247",
 "ISSN": [
  "0002-9602",
  "1537-5390"
 ],
 "subject": [],
 "container-title-short": "American Journal of Sociology",
 "published": {
  "date-parts": [
   [
    2009,
    9
   ]
  ]
 }
}"####;

/// doi.org, CSL-JSON, 10.1086/366680.
pub const DOI_REVIEW: &str = r####"{
 "publisher": "University of Chicago Press",
 "issue": "1",
 "published-print": {
  "date-parts": [
   [
    1982,
    1
   ]
  ]
 },
 "DOI": "10.1086/366680",
 "type": "journal-article",
 "page": "65-70",
 "source": "Crossref",
 "title": "<i>The Best of the Achaens: Concepts of the Hero in Archaic Greek Poetry</i>. Gregory Nagy",
 "volume": "77",
 "author": [
  {
   "given": "Frederick M.",
   "family": "Combellack",
   "sequence": "first",
   "affiliation": [],
   "role": [
    {
     "role": "author",
     "vocabulary": "crossref"
    }
   ]
  }
 ],
 "container-title": "Classical Philology",
 "original-title": [],
 "language": "en",
 "score": 1,
 "subtitle": [],
 "short-title": [],
 "issued": {
  "date-parts": [
   [
    1982,
    1
   ]
  ]
 },
 "URL": "http://dx.doi.org/10.1086/366680",
 "ISSN": [
  "0009-837X",
  "1546-072X"
 ],
 "subject": [],
 "container-title-short": "Classical Philology",
 "published": {
  "date-parts": [
   [
    1982,
    1
   ]
  ]
 }
}"####;

/// doi.org, CSL-JSON, 10.1515/9783110272017.27.
pub const DOI_CHAPTER: &str = r####"{
 "publisher": "DE GRUYTER",
 "published-print": {
  "date-parts": [
   [
    2012,
    4,
    12
   ]
  ]
 },
 "DOI": "10.1515/9783110272017.27",
 "type": "book-chapter",
 "page": "27-72",
 "source": "Crossref",
 "title": "Signs of Hero Cult in Homeric Poetry",
 "author": [
  {
   "given": "Gregory",
   "family": "Nagy",
   "sequence": "first",
   "affiliation": [],
   "role": [
    {
     "role": "author",
     "vocabulary": "crossref"
    }
   ]
  }
 ],
 "container-title": "Homeric Contexts",
 "original-title": [],
 "score": 1,
 "subtitle": [],
 "short-title": [],
 "issued": {
  "date-parts": [
   [
    2012,
    4,
    12
   ]
  ]
 },
 "URL": "http://dx.doi.org/10.1515/9783110272017.27",
 "subject": [],
 "published": {
  "date-parts": [
   [
    2012,
    4,
    12
   ]
  ]
 }
}"####;

/// doi.org, CSL-JSON, 10.1515/9783110272017.
pub const DOI_EDITED_BOOK: &str = r####"{
 "publisher": "DE GRUYTER",
 "isbn-type": [
  {
   "value": "9783110271959",
   "type": "print"
  }
 ],
 "published-print": {
  "date-parts": [
   [
    2012,
    4,
    12
   ]
  ]
 },
 "DOI": "10.1515/9783110272017",
 "type": "edited-book",
 "source": "Crossref",
 "title": "Homeric Contexts",
 "published-online": {
  "date-parts": [
   [
    2012,
    4,
    12
   ]
  ]
 },
 "container-title": [],
 "original-title": [],
 "score": 1,
 "subtitle": [
  "Neoanalysis and the Interpretation of Oral Poetry"
 ],
 "editor": [
  {
   "given": "Franco",
   "family": "Montanari",
   "sequence": "first",
   "affiliation": [],
   "role": [
    {
     "role": "editor",
     "vocabulary": "crossref"
    }
   ]
  },
  {
   "given": "Antonios",
   "family": "Rengakos",
   "sequence": "additional",
   "affiliation": [],
   "role": [
    {
     "role": "editor",
     "vocabulary": "crossref"
    }
   ]
  },
  {
   "given": "Christos C.",
   "family": "Tsagalis",
   "sequence": "additional",
   "affiliation": [],
   "role": [
    {
     "role": "editor",
     "vocabulary": "crossref"
    }
   ]
  }
 ],
 "short-title": [],
 "issued": {
  "date-parts": [
   [
    2012,
    4,
    12
   ]
  ]
 },
 "ISBN": [
  "9783110271959"
 ],
 "URL": "http://dx.doi.org/10.1515/9783110272017",
 "subject": [],
 "published": {
  "date-parts": [
   [
    2012,
    4,
    12
   ]
  ]
 }
}"####;

/// doi.org, CSL-JSON, 10.1017/CBO9780511803161.003.
pub const DOI_PEARL: &str = r####"{
 "edition-number": "2",
 "publisher": "Cambridge University Press",
 "isbn-type": [
  {
   "value": "9780511803161",
   "type": "electronic"
  },
  {
   "value": "9780521895606",
   "type": "print"
  },
  {
   "value": "9780521749190",
   "type": "print"
  }
 ],
 "published-print": {
  "date-parts": [
   [
    2009,
    9,
    14
   ]
  ]
 },
 "DOI": "10.1017/cbo9780511803161.003",
 "type": "other",
 "page": "1-40",
 "source": "Crossref",
 "title": "Introduction to Probabilities, Graphs, and Causal Models",
 "container-title": "Causality",
 "original-title": [],
 "score": 1,
 "subtitle": [],
 "short-title": [],
 "issued": {
  "date-parts": [
   [
    2009,
    9,
    14
   ]
  ]
 },
 "ISBN": [
  "9780511803161",
  "9780521895606",
  "9780521749190"
 ],
 "URL": "http://dx.doi.org/10.1017/CBO9780511803161.003",
 "subject": [],
 "published": {
  "date-parts": [
   [
    2009,
    9,
    14
   ]
  ]
 }
}"####;

/// doi.org, CSL-JSON, 10.1007/978-3-319-10590-1_53.
pub const DOI_SERIES: &str = r####"{
 "publisher-location": "Cham",
 "publisher": "Springer International Publishing",
 "isbn-type": [
  {
   "value": "9783319105895",
   "type": "print"
  },
  {
   "value": "9783319105901",
   "type": "electronic"
  }
 ],
 "published-print": {
  "date-parts": [
   [
    2014
   ]
  ]
 },
 "DOI": "10.1007/978-3-319-10590-1_53",
 "type": "book-chapter",
 "page": "818-833",
 "source": "Crossref",
 "title": "Visualizing and Understanding Convolutional Networks",
 "author": [
  {
   "given": "Matthew D.",
   "family": "Zeiler",
   "sequence": "first",
   "affiliation": [],
   "role": [
    {
     "vocabulary": "crossref",
     "role": "author"
    }
   ]
  },
  {
   "given": "Rob",
   "family": "Fergus",
   "sequence": "additional",
   "affiliation": [],
   "role": [
    {
     "vocabulary": "crossref",
     "role": "author"
    }
   ]
  }
 ],
 "container-title": "Lecture Notes in Computer Science",
 "original-title": [],
 "language": "en",
 "score": 1,
 "subtitle": [],
 "short-title": [],
 "issued": {
  "date-parts": [
   [
    2014
   ]
  ]
 },
 "ISBN": [
  "9783319105895",
  "9783319105901"
 ],
 "URL": "http://dx.doi.org/10.1007/978-3-319-10590-1_53",
 "ISSN": [
  "0302-9743",
  "1611-3349"
 ],
 "subject": [],
 "published": {
  "date-parts": [
   [
    2014
   ]
  ]
 }
}"####;

/// doi.org, CSL-JSON from DataCite, 10.5281/zenodo.3233986.
pub const DOI_ZENODO: &str = r####"{
 "type": "software",
 "id": "https://doi.org/10.5281/zenodo.3233986",
 "author": [
  {
   "family": "Community",
   "given": "The Turing Way"
  },
  {
   "family": "Arnold",
   "given": "Becky"
  },
  {
   "family": "Bowler",
   "given": "Louise"
  },
  {
   "family": "Gibson",
   "given": "Sarah"
  },
  {
   "family": "Herterich",
   "given": "Patricia"
  },
  {
   "family": "Higman",
   "given": "Rosie"
  },
  {
   "family": "Krystalli",
   "given": "Anna"
  },
  {
   "family": "Morley",
   "given": "Alexander"
  },
  {
   "family": "O'Reilly",
   "given": "Martin"
  },
  {
   "family": "Whitaker",
   "given": "Kirstie"
  }
 ],
 "issued": {
  "date-parts": [
   [
    2019,
    3,
    25
   ]
  ]
 },
 "abstract": "Reproducible research is necessary to ensure that scientific work can be trusted. Funders and publishers are beginning to require that publications include access to the underlying data and the analysis code. The goal is to ensure that all results can be independently verified and built upon in future work. This is sometimes easier said than done. Sharing these research outputs means understanding data management, library sciences, software development, and continuous integration techniques: skills that are not widely taught or expected of academic researchers and data scientists.<em> </em><em>The Turing Way</em> is a handbook to support students, their supervisors, funders and journal editors in ensuring that reproducible data science is \"too easy not to do\". It will include training material on version control, analysis testing, and open and transparent communication with future users, and build on Turing Institute case studies and workshops. This project is openly developed and any and all questions, comments and recommendations are welcome at our github repository: https://github.com/alan-turing-institute/the-turing-way. <strong>Release log</strong> <strong>v0.0.4:</strong> Continuous integration chapter merged to master. <strong>v0.0.3:</strong> Reproducible environments chapter merged to master. <strong>v0.0.2:</strong> Version control chapter merged to master. <strong>v0.0.1: </strong>Reproducibility chapter merged to master.",
 "DOI": "10.5281/ZENODO.3233986",
 "publisher": "Zenodo",
 "title": "The Turing Way: A Handbook for Reproducible Data Science",
 "URL": "https://zenodo.org/record/3233986",
 "version": "v0.0.4"
}"####;

/// doi.org, CSL-JSON from DataCite, 10.48550/arXiv.1706.03762.
pub const DOI_ARXIV: &str = r####"{
 "type": "article",
 "id": "https://doi.org/10.48550/arxiv.1706.03762",
 "categories": [
  "Computation and Language (cs.CL)",
  "Machine Learning (cs.LG)",
  "FOS: Computer and information sciences",
  "FOS: Computer and information sciences"
 ],
 "author": [
  {
   "family": "Vaswani",
   "given": "Ashish"
  },
  {
   "family": "Shazeer",
   "given": "Noam"
  },
  {
   "family": "Parmar",
   "given": "Niki"
  },
  {
   "family": "Uszkoreit",
   "given": "Jakob"
  },
  {
   "family": "Jones",
   "given": "Llion"
  },
  {
   "family": "Gomez",
   "given": "Aidan N."
  },
  {
   "family": "Kaiser",
   "given": "Lukasz"
  },
  {
   "family": "Polosukhin",
   "given": "Illia"
  }
 ],
 "issued": {
  "date-parts": [
   [
    2017
   ]
  ]
 },
 "abstract": "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks in an encoder-decoder configuration. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train. Our model achieves 28.4 BLEU on the WMT 2014 English-to-German translation task, improving over the existing best results, including ensembles by over 2 BLEU. On the WMT 2014 English-to-French translation task, our model establishes a new single-model state-of-the-art BLEU score of 41.8 after training for 3.5 days on eight GPUs, a small fraction of the training costs of the best models from the literature. We show that the Transformer generalizes well to other tasks by applying it successfully to English constituency parsing both with large and limited training data.",
 "DOI": "10.48550/ARXIV.1706.03762",
 "publisher": "arXiv",
 "title": "Attention Is All You Need",
 "URL": "https://arxiv.org/abs/1706.03762",
 "version": "7"
}"####;

/// doi.org, UNIXREF, 10.1515/9783110272017.27.
pub const UNIXREF_CHAPTER: &str = r####"<?xml version="1.0" encoding="UTF-8"?>
<doi_records>
  <doi_record owner="10.1515" timestamp="2022-02-14 22:13:30">
    <crossref>
      <book book_type="edited_book">
        <book_metadata>
          <contributors>
            <person_name sequence="first" contributor_role="editor">
              <given_name>Franco</given_name>
              <surname>Montanari</surname>
            </person_name>
            <person_name sequence="additional" contributor_role="editor">
              <given_name>Antonios</given_name>
              <surname>Rengakos</surname>
            </person_name>
            <person_name sequence="additional" contributor_role="editor">
              <given_name>Christos C.</given_name>
              <surname>Tsagalis</surname>
            </person_name>
          </contributors>
          <titles>
            <title>Homeric Contexts</title>
            <subtitle>Neoanalysis and the Interpretation of Oral Poetry</subtitle>
          </titles>
          <publication_date media_type="print">
            <month>04</month>
            <day>12</day>
            <year>2012</year>
          </publication_date>
          <publication_date media_type="online">
            <month>04</month>
            <day>12</day>
            <year>2012</year>
          </publication_date>
          <isbn media_type="print">978-3-11-027195-9</isbn>
          <publisher>
            <publisher_name>DE GRUYTER</publisher_name>
          </publisher>
          <publisher_item>
            <identifier id_type="doi">10.1515/9783110272017</identifier>
          </publisher_item>
          <doi_data>
            <doi>10.1515/9783110272017</doi>
            <resource>https://www.degruyter.com/document/doi/10.1515/9783110272017/html</resource>
          </doi_data>
        </book_metadata>
        <content_item component_type="chapter">
          <contributors>
            <person_name sequence="first" contributor_role="author">
              <given_name>Gregory</given_name>
              <surname>Nagy</surname>
            </person_name>
          </contributors>
          <titles>
            <title>Signs of Hero Cult in Homeric Poetry</title>
          </titles>
          <publication_date>
            <year>2012</year>
            <month>4</month>
            <day>12</day>
          </publication_date>
          <pages>
            <first_page>27</first_page>
            <last_page>72</last_page>
          </pages>
          <publisher_item>
            <identifier id_type="doi">10.1515/9783110272017.27</identifier>
          </publisher_item>
          <doi_data>
            <doi>10.1515/9783110272017.27</doi>
            <resource>https://www.degruyter.com/document/doi/10.1515/9783110272017.27/html</resource>
          </doi_data>
        </content_item>
      </book>
    </crossref>
  </doi_record>
</doi_records>"####;

/// doi.org, UNIXREF, 10.1017/CBO9780511803161.003.
pub const UNIXREF_PEARL: &str = r####"<?xml version="1.0" encoding="UTF-8"?>
<doi_records>
  <doi_record owner="10.1017" timestamp="2026-08-05 04:30:35">
    <crossref>
      <book book_type="monograph">
        <book_metadata>
          <contributors>
            <person_name sequence="first" contributor_role="author">
              <given_name>Judea</given_name>
              <surname>Pearl</surname>
            </person_name>
          </contributors>
          <titles>
            <title>Causality</title>
            <subtitle>Models, Reasoning, and Inference</subtitle>
          </titles>
          <edition_number>2</edition_number>
          <publication_date media_type="online">
            <month>03</month>
            <day>05</day>
            <year>2013</year>
          </publication_date>
          <publication_date media_type="print">
            <month>09</month>
            <day>14</day>
            <year>2009</year>
          </publication_date>
          <isbn media_type="electronic">9780511803161</isbn>
          <isbn media_type="print">9780521895606</isbn>
          <isbn media_type="print">9780521749190</isbn>
          <publisher>
            <publisher_name>Cambridge University Press</publisher_name>
          </publisher>
          <doi_data>
            <doi>10.1017/CBO9780511803161</doi>
            <resource>https://www.cambridge.org/core/product/identifier/9780511803161/type/book</resource>
          </doi_data>
        </book_metadata>
        <content_item component_type="other" publication_type="full_text">
          <titles>
            <title>Introduction to Probabilities, Graphs, and Causal Models</title>
          </titles>
          <component_number>1</component_number>
          <publication_date>
            <month>9</month>
            <day>14</day>
            <year>2009</year>
          </publication_date>
          <pages>
            <first_page>1</first_page>
            <last_page>40</last_page>
          </pages>
          <doi_data>
            <doi>10.1017/CBO9780511803161.003</doi>
            <resource>https://www.cambridge.org/core/product/identifier/9780511803161%23c1/type/book_part</resource>
          </doi_data>
        </content_item>
      </book>
    </crossref>
  </doi_record>
</doi_records>"####;

/// doi.org, UNIXREF, 10.1007/978-3-319-10590-1_53.
pub const UNIXREF_SERIES: &str = r####"<?xml version="1.0" encoding="UTF-8"?>
<doi_records>
  <doi_record owner="10.1007" timestamp="2023-07-15 18:55:40">
    <crossref>
      <book book_type="other">
        <book_series_metadata language="en">
          <series_metadata>
            <titles>
              <title>Lecture Notes in Computer Science</title>
            </titles>
            <issn media_type="print">0302-9743</issn>
            <issn media_type="electronic">1611-3349</issn>
          </series_metadata>
          <contributors>
            <person_name contributor_role="editor" sequence="first">
              <given_name>David</given_name>
              <surname>Fleet</surname>
            </person_name>
            <person_name contributor_role="editor" sequence="additional">
              <given_name>Tomas</given_name>
              <surname>Pajdla</surname>
            </person_name>
            <person_name contributor_role="editor" sequence="additional">
              <given_name>Bernt</given_name>
              <surname>Schiele</surname>
            </person_name>
            <person_name contributor_role="editor" sequence="additional">
              <given_name>Tinne</given_name>
              <surname>Tuytelaars</surname>
            </person_name>
          </contributors>
          <titles>
            <title>Computer Vision – ECCV 2014</title>
            <subtitle>13th European Conference, Zurich, Switzerland, September 6-12, 2014, Proceedings, Part I</subtitle>
          </titles>
          <volume>8689</volume>
          <publication_date media_type="print">
            <year>2014</year>
          </publication_date>
          <isbn media_type="print">978-3-319-10589-5</isbn>
          <isbn media_type="electronic">978-3-319-10590-1</isbn>
          <publisher>
            <publisher_name>Springer International Publishing</publisher_name>
            <publisher_place>Cham</publisher_place>
          </publisher>
          <doi_data>
            <doi>10.1007/978-3-319-10590-1</doi>
            <resource>http://link.springer.com/10.1007/978-3-319-10590-1</resource>
          </doi_data>
        </book_series_metadata>
        <content_item component_type="chapter" level_sequence_number="1" publication_type="full_text">
          <contributors>
            <person_name contributor_role="author" sequence="first">
              <given_name>Matthew D.</given_name>
              <surname>Zeiler</surname>
            </person_name>
            <person_name contributor_role="author" sequence="additional">
              <given_name>Rob</given_name>
              <surname>Fergus</surname>
            </person_name>
          </contributors>
          <titles>
            <title>Visualizing and Understanding Convolutional Networks</title>
          </titles>
          <component_number>Chapter 53</component_number>
          <publication_date media_type="print">
            <year>2014</year>
          </publication_date>
          <pages>
            <first_page>818</first_page>
            <last_page>833</last_page>
          </pages>
          <doi_data>
            <doi>10.1007/978-3-319-10590-1_53</doi>
            <resource>http://link.springer.com/10.1007/978-3-319-10590-1_53</resource>
          </doi_data>
        </content_item>
      </book>
    </crossref>
  </doi_record>
</doi_records>"####;

/// Crossref, query.bibliographic=Nagy Best of the Achaeans hero archaic Greek poetry, rows=5.
pub const CROSSREF_SEARCH: &str = r####"{
 "status": "ok",
 "message-type": "work-list",
 "message-version": "1.0.0",
 "message": {
  "facets": {},
  "total-results": 575730,
  "items": [
   {
    "publisher": "JSTOR",
    "issue": "3",
    "short-container-title": [
     "Phoenix"
    ],
    "DOI": "10.2307/1087661",
    "type": "journal-article",
    "page": "276",
    "title": [
     "The Best of the Achaeans: Concepts of the Hero in Archaic Greek Poetry"
    ],
    "volume": "35",
    "author": [
     {
      "given": "Wayne B.",
      "family": "Ingalls",
      "sequence": "first",
      "affiliation": [],
      "role": [
       {
        "role": "author",
        "vocabulary": "crossref"
       }
      ]
     },
     {
      "given": "Gregory",
      "family": "Nagy",
      "sequence": "additional",
      "affiliation": [],
      "role": [
       {
        "role": "author",
        "vocabulary": "crossref"
       }
      ]
     }
    ],
    "container-title": [
     "Phoenix"
    ],
    "issued": {
     "date-parts": [
      [
       1981
      ]
     ]
    },
    "ISSN": [
     "0031-8299"
    ],
    "issn-type": [
     {
      "type": "print",
      "value": "0031-8299"
     }
    ]
   },
   {
    "publisher": "JSTOR",
    "issue": "1",
    "short-container-title": [
     "The American Journal of Philology"
    ],
    "DOI": "10.2307/294156",
    "type": "journal-article",
    "page": "81",
    "title": [
     "The Best of the Achaeans. Concepts of the Hero in Archaic Greek Poetry"
    ],
    "volume": "102",
    "author": [
     {
      "given": "Friedrich",
      "family": "Solmsen",
      "sequence": "first",
      "affiliation": [],
      "role": [
       {
        "role": "author",
        "vocabulary": "crossref"
       }
      ]
     },
     {
      "given": "Gregory",
      "family": "Nagy",
      "sequence": "additional",
      "affiliation": [],
      "role": [
       {
        "role": "author",
        "vocabulary": "crossref"
       }
      ]
     }
    ],
    "container-title": [
     "The American Journal of Philology"
    ],
    "issued": {
     "date-parts": [
      [
       1981
      ]
     ]
    },
    "ISSN": [
     "0002-9475"
    ],
    "issn-type": [
     {
      "type": "print",
      "value": "0002-9475"
     }
    ]
   },
   {
    "publisher": "Cambridge University Press (CUP)",
    "issue": "1",
    "short-container-title": [
     "The Class. Rev."
    ],
    "DOI": "10.1017/s0009840x00238638",
    "type": "journal-article",
    "page": "3-4",
    "title": [
     "The Best of the Achaeans - Gregory Nagy: The Best of the Achaeans. Concepts of the Hero in Archaic Greek Poetry. Pp. xvi + 392. Baltimore and London: Johns Hopkins University Press, 1980. £9 ($18.75)."
    ],
    "volume": "32",
    "author": [
     {
      "given": "J. B.",
      "family": "Hainsworth",
      "sequence": "first",
      "affiliation": [],
      "role": [
       {
        "role": "author",
        "vocabulary": "crossref"
       }
      ]
     }
    ],
    "container-title": [
     "The Classical Review"
    ],
    "issued": {
     "date-parts": [
      [
       1982,
       4
      ]
     ]
    },
    "ISSN": [
     "0009-840X",
     "1464-3561"
    ],
    "issn-type": [
     {
      "type": "print",
      "value": "0009-840X"
     },
     {
      "type": "electronic",
      "value": "1464-3561"
     }
    ]
   },
   {
    "publisher": "Walter de Gruyter GmbH",
    "issue": "1-2",
    "short-container-title": [
     "Mnemosyne"
    ],
    "DOI": "10.1163/156852585x00177",
    "type": "journal-article",
    "page": "180-181",
    "title": [
     "G. NAGY, The Best of Achaeans. Concepts of the Hero in Archaic Greek Poetry. Baltimore-London, Johns Hopkins University Press, 1979. XVI, 392 pp. Pr. $ 18.75-£ 9.00"
    ],
    "volume": "38",
    "author": [
     {
      "given": "W.J.",
      "family": "Verdenius",
      "sequence": "first",
      "affiliation": [],
      "role": [
       {
        "role": "author",
        "vocabulary": "crossref"
       }
      ]
     }
    ],
    "container-title": [
     "Mnemosyne"
    ],
    "issued": {
     "date-parts": [
      [
       1985
      ]
     ]
    },
    "ISSN": [
     "0026-7074",
     "1568-525X"
    ],
    "issn-type": [
     {
      "type": "electronic",
      "value": "0026-7074"
     },
     {
      "type": "electronic",
      "value": "1568-525X"
     }
    ]
   },
   {
    "publisher": "University of Chicago Press",
    "issue": "1",
    "short-container-title": [
     "Classical Philology"
    ],
    "DOI": "10.1086/366680",
    "type": "journal-article",
    "page": "65-70",
    "title": [
     "<i>The Best of the Achaens: Concepts of the Hero in Archaic Greek Poetry</i>. Gregory Nagy"
    ],
    "volume": "77",
    "author": [
     {
      "given": "Frederick M.",
      "family": "Combellack",
      "sequence": "first",
      "affiliation": [],
      "role": [
       {
        "role": "author",
        "vocabulary": "crossref"
       }
      ]
     }
    ],
    "container-title": [
     "Classical Philology"
    ],
    "issued": {
     "date-parts": [
      [
       1982,
       1
      ]
     ]
    },
    "ISSN": [
     "0009-837X",
     "1546-072X"
    ],
    "issn-type": [
     {
      "type": "print",
      "value": "0009-837X"
     },
     {
      "type": "electronic",
      "value": "1546-072X"
     }
    ]
   }
  ],
  "items-per-page": 5,
  "query": {
   "start-index": 0,
   "search-terms": null
  }
 }
}"####;

/// Crossref, query.bibliographic=Homeric formula oral poetry, filter=type:book-chapter, rows=5.
pub const CROSSREF_CHAPTERS: &str = r####"{
 "status": "ok",
 "message-type": "work-list",
 "message-version": "1.0.0",
 "message": {
  "facets": {},
  "total-results": 118691,
  "items": [
   {
    "publisher": "DE GRUYTER",
    "DOI": "10.1515/9783110272017.445",
    "type": "book-chapter",
    "page": "445-468",
    "title": [
     "Epithets with Echoes: A Study on Formula-Narrative Interaction"
    ],
    "author": [
     {
      "given": "Naoko",
      "family": "Yamagata",
      "sequence": "first",
      "affiliation": [],
      "role": [
       {
        "role": "author",
        "vocabulary": "crossref"
       }
      ]
     }
    ],
    "container-title": [
     "Homeric Contexts"
    ],
    "issued": {
     "date-parts": [
      [
       2012,
       4,
       12
      ]
     ]
    }
   },
   {
    "publisher": "DE GRUYTER",
    "DOI": "10.1515/9783110272017.27",
    "type": "book-chapter",
    "page": "27-72",
    "title": [
     "Signs of Hero Cult in Homeric Poetry"
    ],
    "author": [
     {
      "given": "Gregory",
      "family": "Nagy",
      "sequence": "first",
      "affiliation": [],
      "role": [
       {
        "role": "author",
        "vocabulary": "crossref"
       }
      ]
     }
    ],
    "container-title": [
     "Homeric Contexts"
    ],
    "issued": {
     "date-parts": [
      [
       2012,
       4,
       12
      ]
     ]
    }
   },
   {
    "publisher": "DE GRUYTER",
    "DOI": "10.1515/9783110272017.1",
    "type": "book-chapter",
    "page": "1-10",
    "title": [
     "Introduction. The Homeric Question Today"
    ],
    "author": [
     {
      "given": "Franco",
      "family": "Montanari",
      "sequence": "first",
      "affiliation": [],
      "role": [
       {
        "role": "author",
        "vocabulary": "crossref"
       }
      ]
     }
    ],
    "container-title": [
     "Homeric Contexts"
    ],
    "issued": {
     "date-parts": [
      [
       2012,
       4,
       12
      ]
     ]
    }
   },
   {
    "publisher": "DE GRUYTER",
    "DOI": "10.1515/9783110272017.631",
    "type": "book-chapter",
    "page": "631-698",
    "title": [
     "Indices"
    ],
    "container-title": [
     "Homeric Contexts"
    ],
    "issued": {
     "date-parts": [
      [
       2012,
       4,
       12
      ]
     ]
    }
   },
   {
    "publisher": "DE GRUYTER",
    "DOI": "10.1515/9783110272017.fm",
    "type": "book-chapter",
    "page": "i-iv",
    "title": [
     "Frontmatter"
    ],
    "container-title": [
     "Homeric Contexts"
    ],
    "issued": {
     "date-parts": [
      [
       2012,
       4,
       12
      ]
     ]
    }
   }
  ],
  "items-per-page": 5,
  "query": {
   "start-index": 0,
   "search-terms": null
  }
 }
}"####;

/// K10plus, pica.isb=9783406568442 or pica.isb=3406568440.
pub const K10_ASSMANN: &str = r####"<?xml version="1.0" encoding="UTF-8"?>
<zs:searchRetrieveResponse xmlns:zs="http://www.loc.gov/zing/srw/"><zs:version>1.1</zs:version><zs:numberOfRecords>5</zs:numberOfRecords><zs:records><zs:record><zs:recordSchema>marcxml</zs:recordSchema><zs:recordPacking>xml</zs:recordPacking><zs:recordData><record xmlns="http://www.loc.gov/MARC21/slim">
  <leader>     cam a22      c 4500</leader>
  <controlfield tag="001">1833159233</controlfield>
  <controlfield tag="003">DE-627</controlfield>
  <controlfield tag="005">20250812164603.0</controlfield>
  <controlfield tag="007">cr uuu---uuuuu</controlfield>
  <controlfield tag="008">230203s2017    gw |||||o     00| ||ger c</controlfield>
  <datafield tag="020" ind1=" " ind2=" ">
    <subfield code="a">9783406703409</subfield>
    <subfield code="9">978-3-406-70340-9</subfield>
  </datafield>
  <datafield tag="041" ind1=" " ind2=" ">
    <subfield code="a">ger</subfield>
  </datafield>
  <datafield tag="100" ind1="1" ind2=" ">
    <subfield code="a">Assmann, Jan</subfield>
    <subfield code="d">1938-2024</subfield>
    <subfield code="e">VerfasserIn</subfield>
    <subfield code="4">aut</subfield>
  </datafield>
  <datafield tag="245" ind1="1" ind2="4">
    <subfield code="a">Das kulturelle Gedächtnis</subfield>
    <subfield code="b">Schrift, Erinnerung und politische Identität in frühen Hochkulturen</subfield>
    <subfield code="c">Jan Assmann</subfield>
  </datafield>
  <datafield tag="250" ind1=" " ind2=" ">
    <subfield code="a">7. Auflage</subfield>
  </datafield>
  <datafield tag="264" ind1=" " ind2="1">
    <subfield code="a">München</subfield>
    <subfield code="b">C.H.Beck</subfield>
    <subfield code="c">[2017]</subfield>
  </datafield>
  <datafield tag="264" ind1=" " ind2="4">
    <subfield code="c">©2017</subfield>
  </datafield>
  <datafield tag="300" ind1=" " ind2=" ">
    <subfield code="a">1 Online-Ressource (344 Seiten)</subfield>
    <subfield code="b">Illustrationen</subfield>
  </datafield>
  <datafield tag="338" ind1=" " ind2=" ">
    <subfield code="a">Online-Ressource</subfield>
    <subfield code="b">cr</subfield>
    <subfield code="2">rdacarrier</subfield>
  </datafield>
  <datafield tag="490" ind1="0" ind2=" ">
    <subfield code="a">Beck'sche Reihe</subfield>
    <subfield code="v">1307</subfield>
  </datafield>
  <datafield tag="500" ind1=" " ind2=" ">
    <subfield code="a">Description based on publisher supplied metadata and other sources</subfield>
  </datafield>
  <datafield tag="776" ind1="1" ind2=" ">
    <subfield code="z">9783406568442</subfield>
  </datafield>
  <datafield tag="776" ind1="0" ind2="8">
    <subfield code="i">Erscheint auch als</subfield>
    <subfield code="n">Druck-Ausgabe</subfield>
    <subfield code="z">9783406568442</subfield>
  </datafield>
  <datafield tag="856" ind1="4" ind2="0">
    <subfield code="u">https://ebookcentral.proquest.com/lib/kxp/detail.action?docID=6988842</subfield>
    <subfield code="m">X:EBC</subfield>
    <subfield code="x">Aggregator</subfield>
    <subfield code="z">lizenzpflichtig</subfield>
    <subfield code="7">1</subfield>
  </datafield>
</record></zs:recordData><zs:recordPosition>1</zs:recordPosition></zs:record><zs:record><zs:recordSchema>marcxml</zs:recordSchema><zs:recordPacking>xml</zs:recordPacking><zs:recordData><record xmlns="http://www.loc.gov/MARC21/slim">
  <leader>     cam a22      c 4500</leader>
  <controlfield tag="001">1695607414</controlfield>
  <controlfield tag="003">DE-627</controlfield>
  <controlfield tag="005">20260715161313.0</controlfield>
  <controlfield tag="007">cr uuu---uuuuu</controlfield>
  <controlfield tag="008">200422r20172013gw |||||o     00| ||ger c</controlfield>
  <datafield tag="020" ind1=" " ind2=" ">
    <subfield code="a">9783406703409</subfield>
    <subfield code="9">978-3-406-70340-9</subfield>
  </datafield>
  <datafield tag="020" ind1=" " ind2=" ">
    <subfield code="a">3406703402</subfield>
    <subfield code="9">3-406-70340-2</subfield>
  </datafield>
  <datafield tag="024" ind1="3" ind2=" ">
    <subfield code="a">9783406703409</subfield>
  </datafield>
  <datafield tag="024" ind1="7" ind2=" ">
    <subfield code="a">10.17104/9783406703409</subfield>
    <subfield code="2">doi</subfield>
  </datafield>
  <datafield tag="041" ind1=" " ind2=" ">
    <subfield code="a">ger</subfield>
  </datafield>
  <datafield tag="100" ind1="1" ind2=" ">
    <subfield code="a">Assmann, Jan</subfield>
    <subfield code="d">1938-2024</subfield>
    <subfield code="e">VerfasserIn</subfield>
    <subfield code="4">aut</subfield>
  </datafield>
  <datafield tag="245" ind1="1" ind2="4">
    <subfield code="a">Das kulturelle Gedächtnis</subfield>
    <subfield code="b">Schrift, Erinnerung und politische Identität in frühen Hochkulturen</subfield>
    <subfield code="c">Jan Assmann</subfield>
  </datafield>
  <datafield tag="250" ind1=" " ind2=" ">
    <subfield code="a">7. Auflage</subfield>
  </datafield>
  <datafield tag="264" ind1=" " ind2="1">
    <subfield code="a">München</subfield>
    <subfield code="b">C.H.Beck</subfield>
    <subfield code="c">2017</subfield>
  </datafield>
  <datafield tag="300" ind1=" " ind2=" ">
    <subfield code="a">1 Online-Ressource (344 Seiten)</subfield>
    <subfield code="b">Illustrationen</subfield>
  </datafield>
  <datafield tag="338" ind1=" " ind2=" ">
    <subfield code="a">Online-Ressource</subfield>
    <subfield code="b">cr</subfield>
    <subfield code="2">rdacarrier</subfield>
  </datafield>
  <datafield tag="490" ind1="0" ind2=" ">
    <subfield code="a">Beck'sche Reihe</subfield>
    <subfield code="v">1307</subfield>
  </datafield>
  <datafield tag="500" ind1=" " ind2=" ">
    <subfield code="a">Lizenzpflichtig</subfield>
  </datafield>
  <datafield tag="534" ind1=" " ind2=" ">
    <subfield code="c">2013</subfield>
  </datafield>
  <datafield tag="776" ind1="1" ind2=" ">
    <subfield code="z">9783406568442</subfield>
  </datafield>
  <datafield tag="776" ind1="0" ind2="8">
    <subfield code="i">Erscheint auch als</subfield>
    <subfield code="n">Druck-Ausgabe</subfield>
    <subfield code="a">Assmann, Jan, 1938 - 2024</subfield>
    <subfield code="t">Das kulturelle Gedächtnis</subfield>
    <subfield code="b">7. Auflage</subfield>
    <subfield code="d">München : Verlag H.C.Beck, 2013</subfield>
    <subfield code="h">344 Seiten</subfield>
    <subfield code="w">(DE-627)160169881X</subfield>
    <subfield code="w">(DE-576)378749609</subfield>
    <subfield code="z">3406568440</subfield>
    <subfield code="z">9783406568442</subfield>
  </datafield>
  <datafield tag="856" ind1="4" ind2="0">
    <subfield code="u">https://doi.org/10.17104/9783406703409</subfield>
    <subfield code="m">X:INLIBRA</subfield>
    <subfield code="x">Resolving-System</subfield>
    <subfield code="z">lizenzpflichtig</subfield>
    <subfield code="7">1</subfield>
  </datafield>
  <datafield tag="856" ind1="4" ind2="0">
    <subfield code="u">https://www.inlibra.com/10.17104/9783406703409</subfield>
    <subfield code="m">X:INLIBRA</subfield>
    <subfield code="x">Verlag</subfield>
    <subfield code="z">lizenzpflichtig</subfield>
    <subfield code="7">1</subfield>
  </datafield>
</record></zs:recordData><zs:recordPosition>2</zs:recordPosition></zs:record><zs:record><zs:recordSchema>marcxml</zs:recordSchema><zs:recordPacking>xml</zs:recordPacking><zs:recordData><record xmlns="http://www.loc.gov/MARC21/slim">
  <leader>     cam a22      c 4500</leader>
  <controlfield tag="001">892716932</controlfield>
  <controlfield tag="003">DE-627</controlfield>
  <controlfield tag="005">20210903140229.0</controlfield>
  <controlfield tag="007">cr uuu---uuuuu</controlfield>
  <controlfield tag="008">170704s2017    gw |||||o     00| ||ger c</controlfield>
  <datafield tag="020" ind1=" " ind2=" ">
    <subfield code="a">9783406703409</subfield>
    <subfield code="q"> : electronic bk.</subfield>
    <subfield code="9">978-3-406-70340-9</subfield>
  </datafield>
  <datafield tag="041" ind1=" " ind2=" ">
    <subfield code="a">ger</subfield>
  </datafield>
  <datafield tag="100" ind1="1" ind2=" ">
    <subfield code="a">Assmann, Jan</subfield>
    <subfield code="d">1938-2024</subfield>
    <subfield code="e">VerfasserIn</subfield>
    <subfield code="4">aut</subfield>
  </datafield>
  <datafield tag="245" ind1="1" ind2="4">
    <subfield code="a">Das kulturelle Gedächtnis</subfield>
    <subfield code="b">Schrift, Erinnerung und politische Identität in frühen Hochkulturen</subfield>
    <subfield code="c">Jsan Assmann</subfield>
  </datafield>
  <datafield tag="250" ind1=" " ind2=" ">
    <subfield code="a">7. Auflage 2013</subfield>
  </datafield>
  <datafield tag="264" ind1=" " ind2="1">
    <subfield code="a">München</subfield>
    <subfield code="b">Verlag C.H. Beck</subfield>
    <subfield code="c">2017</subfield>
  </datafield>
  <datafield tag="300" ind1=" " ind2=" ">
    <subfield code="a">1 Online-Ressource (337 Seiten)</subfield>
    <subfield code="b">Illustrationen</subfield>
  </datafield>
  <datafield tag="338" ind1=" " ind2=" ">
    <subfield code="a">Online-Ressource</subfield>
    <subfield code="b">cr</subfield>
    <subfield code="2">rdacarrier</subfield>
  </datafield>
  <datafield tag="490" ind1="0" ind2=" ">
    <subfield code="a">Beck'sche Reihe</subfield>
    <subfield code="v">v.1307</subfield>
  </datafield>
  <datafield tag="776" ind1="1" ind2=" ">
    <subfield code="z">9783406568442</subfield>
  </datafield>
  <datafield tag="856" ind1="4" ind2="0">
    <subfield code="u">https://ebookcentral.proquest.com/lib/kxp/detail.action?docID=4890182</subfield>
    <subfield code="x">Aggregator</subfield>
    <subfield code="3">Volltext</subfield>
    <subfield code="7">1</subfield>
  </datafield>
</record></zs:recordData><zs:recordPosition>3</zs:recordPosition></zs:record><zs:record><zs:recordSchema>marcxml</zs:recordSchema><zs:recordPacking>xml</zs:recordPacking><zs:recordData><record xmlns="http://www.loc.gov/MARC21/slim">
  <leader>     cam a22      c 4500</leader>
  <controlfield tag="001">160169881X</controlfield>
  <controlfield tag="003">DE-627</controlfield>
  <controlfield tag="005">20260619012118.0</controlfield>
  <controlfield tag="007">tu</controlfield>
  <controlfield tag="008">130410s2013    gw |||||      00| ||ger c</controlfield>
  <datafield tag="020" ind1=" " ind2=" ">
    <subfield code="a">3406568440</subfield>
    <subfield code="q"> : kart. : EUR 12.95</subfield>
    <subfield code="9">3-406-56844-0</subfield>
  </datafield>
  <datafield tag="020" ind1=" " ind2=" ">
    <subfield code="a">9783406568442</subfield>
    <subfield code="q"> : kart. : EUR 12.95</subfield>
    <subfield code="9">978-3-406-56844-2</subfield>
  </datafield>
  <datafield tag="041" ind1=" " ind2=" ">
    <subfield code="a">ger</subfield>
  </datafield>
  <datafield tag="100" ind1="1" ind2=" ">
    <subfield code="a">Assmann, Jan</subfield>
    <subfield code="d">1938-2024</subfield>
    <subfield code="e">VerfasserIn</subfield>
    <subfield code="4">aut</subfield>
  </datafield>
  <datafield tag="245" ind1="1" ind2="4">
    <subfield code="a">Das kulturelle Gedächtnis</subfield>
    <subfield code="b">Schrift, Erinnerung und politische Identität in frühen Hochkulturen</subfield>
    <subfield code="c">Jan Assmann</subfield>
  </datafield>
  <datafield tag="250" ind1=" " ind2=" ">
    <subfield code="a">7. Auflage</subfield>
  </datafield>
  <datafield tag="264" ind1=" " ind2="1">
    <subfield code="a">München</subfield>
    <subfield code="b">Verlag H.C.Beck</subfield>
    <subfield code="c">2013</subfield>
  </datafield>
  <datafield tag="300" ind1=" " ind2=" ">
    <subfield code="a">344 Seiten</subfield>
    <subfield code="b">Illustrationen</subfield>
    <subfield code="c">19 cm</subfield>
  </datafield>
  <datafield tag="338" ind1=" " ind2=" ">
    <subfield code="a">Band</subfield>
    <subfield code="b">nc</subfield>
    <subfield code="2">rdacarrier</subfield>
  </datafield>
  <datafield tag="490" ind1="0" ind2=" ">
    <subfield code="a">Beck'sche Reihe</subfield>
    <subfield code="v">1307</subfield>
  </datafield>
  <datafield tag="500" ind1=" " ind2=" ">
    <subfield code="a">Literaturverzeichnis: Seite 305-326</subfield>
  </datafield>
  <datafield tag="776" ind1="0" ind2="8">
    <subfield code="i">Erscheint auch als</subfield>
    <subfield code="n">Online-Ausgabe</subfield>
    <subfield code="a">Assmann, Jan, 1938 - 2024</subfield>
    <subfield code="t">Das kulturelle Gedächtnis</subfield>
    <subfield code="b">7. Auflage</subfield>
    <subfield code="d">München : C.H.Beck, 2017</subfield>
    <subfield code="h">1 Online-Ressource (344 Seiten)</subfield>
    <subfield code="w">(DE-627)1695607414</subfield>
    <subfield code="z">9783406703409</subfield>
    <subfield code="z">3406703402</subfield>
  </datafield>
  <datafield tag="785" ind1="0" ind2="0">
    <subfield code="i">Gefolgt von</subfield>
    <subfield code="a">Assmann, Jan, 1938 - 2024</subfield>
    <subfield code="t">Das kulturelle Gedächtnis</subfield>
    <subfield code="b">8. Auflage in C.H. Paperback</subfield>
    <subfield code="d">München : C.H. Beck, 2018</subfield>
    <subfield code="h">344 Seiten</subfield>
    <subfield code="w">(DE-627)1025417887</subfield>
    <subfield code="w">(DE-576)511187025</subfield>
    <subfield code="z">9783406729874</subfield>
    <subfield code="z">3406729878</subfield>
  </datafield>
  <datafield tag="856" ind1="4" ind2="2">
    <subfield code="u">http://d-nb.info/1030500924/04</subfield>
    <subfield code="m">B:DE-101</subfield>
    <subfield code="q">application/pdf</subfield>
    <subfield code="v">2013-05-01</subfield>
    <subfield code="x">Verlag</subfield>
    <subfield code="3">Inhaltsverzeichnis</subfield>
    <subfield code="7">1</subfield>
  </datafield>
</record></zs:recordData><zs:recordPosition>4</zs:recordPosition></zs:record><zs:record><zs:recordSchema>marcxml</zs:recordSchema><zs:recordPacking>xml</zs:recordPacking><zs:recordData><record xmlns="http://www.loc.gov/MARC21/slim">
  <leader>     cam a22      c 4500</leader>
  <controlfield tag="001">55668558X</controlfield>
  <controlfield tag="003">DE-627</controlfield>
  <controlfield tag="005">20260613010121.0</controlfield>
  <controlfield tag="007">tu</controlfield>
  <controlfield tag="008">080116s2007    gw |||||      00| ||ger c</controlfield>
  <datafield tag="020" ind1=" " ind2=" ">
    <subfield code="a">9783406568466</subfield>
    <subfield code="9">978-3-406-56846-6</subfield>
  </datafield>
  <datafield tag="020" ind1=" " ind2=" ">
    <subfield code="a">9783406568442</subfield>
    <subfield code="q"> : EUR 12.95</subfield>
    <subfield code="9">978-3-406-56844-2</subfield>
  </datafield>
  <datafield tag="024" ind1="3" ind2=" ">
    <subfield code="a">9783406568442</subfield>
  </datafield>
  <datafield tag="041" ind1=" " ind2=" ">
    <subfield code="a">ger</subfield>
  </datafield>
  <datafield tag="100" ind1="1" ind2=" ">
    <subfield code="a">Assmann, Jan</subfield>
    <subfield code="d">1938-2024</subfield>
    <subfield code="4">aut</subfield>
  </datafield>
  <datafield tag="245" ind1="1" ind2="4">
    <subfield code="a">Das kulturelle Gedächtnis</subfield>
    <subfield code="b">Schrift, Erinnerung und politische Identität in frühen Hochkulturen</subfield>
    <subfield code="c">Jan Assmann</subfield>
  </datafield>
  <datafield tag="250" ind1=" " ind2=" ">
    <subfield code="a">6. Aufl.</subfield>
  </datafield>
  <datafield tag="264" ind1=" " ind2="1">
    <subfield code="a">München</subfield>
    <subfield code="b">Beck</subfield>
    <subfield code="c">2007</subfield>
  </datafield>
  <datafield tag="300" ind1=" " ind2=" ">
    <subfield code="a">344 S.</subfield>
    <subfield code="b">graph. Darst.</subfield>
    <subfield code="c">19 cm</subfield>
  </datafield>
  <datafield tag="338" ind1=" " ind2=" ">
    <subfield code="a">Band</subfield>
    <subfield code="b">nc</subfield>
    <subfield code="2">rdacarrier</subfield>
  </datafield>
  <datafield tag="490" ind1="0" ind2=" ">
    <subfield code="a">Beck'sche Reihe</subfield>
    <subfield code="v">1307</subfield>
  </datafield>
  <datafield tag="500" ind1=" " ind2=" ">
    <subfield code="a">Literaturverz. S. [305] - 326</subfield>
  </datafield>
  <datafield tag="856" ind1="4" ind2="2">
    <subfield code="u">http://www.gbv.de/dms/bs/toc/55668558x.pdf</subfield>
    <subfield code="m">V:DE-601</subfield>
    <subfield code="m">B:DE-84</subfield>
    <subfield code="q">pdf/application</subfield>
    <subfield code="x">Verlag</subfield>
    <subfield code="y">Inhaltsverzeichnis</subfield>
    <subfield code="3">Inhaltsverzeichnis</subfield>
    <subfield code="7">1</subfield>
  </datafield>
</record></zs:recordData><zs:recordPosition>5</zs:recordPosition></zs:record></zs:records><zs:echoedSearchRetrieveRequest><zs:version>1.1</zs:version><zs:query>pica.isb=9783406568442 or pica.isb=3406568440</zs:query><zs:maximumRecords>10</zs:maximumRecords><zs:recordPacking>xml</zs:recordPacking><zs:recordSchema>marcxml</zs:recordSchema></zs:echoedSearchRetrieveRequest></zs:searchRetrieveResponse>"####;

/// K10plus, pica.isb=9780674033818 or pica.isb=0674033817.
pub const K10_HARRIS: &str = r####"<?xml version="1.0" encoding="UTF-8"?>
<zs:searchRetrieveResponse xmlns:zs="http://www.loc.gov/zing/srw/"><zs:version>1.1</zs:version><zs:numberOfRecords>4</zs:numberOfRecords><zs:records><zs:record><zs:recordSchema>marcxml</zs:recordSchema><zs:recordPacking>xml</zs:recordPacking><zs:recordData><record xmlns="http://www.loc.gov/MARC21/slim">
  <leader>     cam a22     2c 4500</leader>
  <controlfield tag="001">836903307</controlfield>
  <controlfield tag="003">DE-627</controlfield>
  <controlfield tag="005">20260321200400.0</controlfield>
  <controlfield tag="007">cr uuu---uuuuu</controlfield>
  <controlfield tag="008">151012s2009    xx |||||o     00| ||eng c</controlfield>
  <datafield tag="020" ind1=" " ind2=" ">
    <subfield code="a">9780674033818</subfield>
    <subfield code="9">978-0-674-03381-8</subfield>
  </datafield>
  <datafield tag="041" ind1=" " ind2=" ">
    <subfield code="a">eng</subfield>
  </datafield>
  <datafield tag="100" ind1="1" ind2=" ">
    <subfield code="8">1\p</subfield>
    <subfield code="a">Harris, William V.</subfield>
    <subfield code="d">1938-</subfield>
    <subfield code="4">aut</subfield>
  </datafield>
  <datafield tag="245" ind1="1" ind2="0">
    <subfield code="a">Ancient Literacy</subfield>
  </datafield>
  <datafield tag="264" ind1=" " ind2="1">
    <subfield code="a">Cambridge</subfield>
    <subfield code="b">Harvard University Press</subfield>
    <subfield code="c">2009</subfield>
  </datafield>
  <datafield tag="300" ind1=" " ind2=" ">
    <subfield code="a">Online-Ressource (406 p)</subfield>
  </datafield>
  <datafield tag="338" ind1=" " ind2=" ">
    <subfield code="a">Online-Ressource</subfield>
    <subfield code="b">cr</subfield>
    <subfield code="2">rdacarrier</subfield>
  </datafield>
  <datafield tag="500" ind1=" " ind2=" ">
    <subfield code="a">Description based upon print version of record</subfield>
  </datafield>
  <datafield tag="776" ind1="1" ind2=" ">
    <subfield code="z">9780674038370</subfield>
    <subfield code="c"> : 37.5 (1U)</subfield>
  </datafield>
  <datafield tag="776" ind1="1" ind2=" ">
    <subfield code="z">9780674033818</subfield>
  </datafield>
  <datafield tag="776" ind1="0" ind2="8">
    <subfield code="i">Erscheint auch als</subfield>
    <subfield code="n">Druck-Ausgabe</subfield>
    <subfield code="a">Ancient Literacy</subfield>
  </datafield>
  <datafield tag="856" ind1="4" ind2="0">
    <subfield code="u">http://gbv.eblib.com/patron/FullRecord.aspx?p=3300295</subfield>
    <subfield code="x">Verlag</subfield>
    <subfield code="3">Volltext</subfield>
    <subfield code="7">1</subfield>
  </datafield>
  <datafield tag="856" ind1="4" ind2="0">
    <subfield code="u">https://ebookcentral.proquest.com/lib/kxp/detail.action?docID=3300295</subfield>
    <subfield code="m">X:EBC</subfield>
    <subfield code="x">Aggregator</subfield>
    <subfield code="z">lizenzpflichtig</subfield>
    <subfield code="3">Volltext</subfield>
    <subfield code="7">1</subfield>
  </datafield>
</record></zs:recordData><zs:recordPosition>1</zs:recordPosition></zs:record><zs:record><zs:recordSchema>marcxml</zs:recordSchema><zs:recordPacking>xml</zs:recordPacking><zs:recordData><record xmlns="http://www.loc.gov/MARC21/slim">
  <leader>     cam a22     2c 4500</leader>
  <controlfield tag="001">802995055</controlfield>
  <controlfield tag="003">DE-627</controlfield>
  <controlfield tag="005">20251224193519.0</controlfield>
  <controlfield tag="007">cr uuu---uuuuu</controlfield>
  <controlfield tag="008">141209s1991    xxu|||||o     00| ||eng c</controlfield>
  <datafield tag="020" ind1=" " ind2=" ">
    <subfield code="a">9780674033818</subfield>
    <subfield code="9">978-0-674-03381-8</subfield>
  </datafield>
  <datafield tag="020" ind1=" " ind2=" ">
    <subfield code="a">0674033817</subfield>
    <subfield code="q">Trade Paper</subfield>
    <subfield code="9">0-674-03381-7</subfield>
  </datafield>
  <datafield tag="020" ind1=" " ind2=" ">
    <subfield code="a">9780674038370</subfield>
    <subfield code="q"> : electronic bk.</subfield>
    <subfield code="9">978-0-674-03837-0</subfield>
  </datafield>
  <datafield tag="020" ind1=" " ind2=" ">
    <subfield code="a">0674038371</subfield>
    <subfield code="q">electronic bk.</subfield>
    <subfield code="9">0-674-03837-1</subfield>
  </datafield>
  <datafield tag="024" ind1="3" ind2=" ">
    <subfield code="a">9780674033818</subfield>
  </datafield>
  <datafield tag="041" ind1=" " ind2=" ">
    <subfield code="a">eng</subfield>
  </datafield>
  <datafield tag="245" ind1="0" ind2="0">
    <subfield code="a">Ancient literacy</subfield>
    <subfield code="c">William V. Harris</subfield>
  </datafield>
  <datafield tag="250" ind1=" " ind2=" ">
    <subfield code="a">1st Harvard University Press pbk. ed.</subfield>
  </datafield>
  <datafield tag="264" ind1=" " ind2="1">
    <subfield code="a">Cambridge, Mass</subfield>
    <subfield code="b">Harvard University Press</subfield>
    <subfield code="c">1991</subfield>
  </datafield>
  <datafield tag="300" ind1=" " ind2=" ">
    <subfield code="a">Online Ressource</subfield>
  </datafield>
  <datafield tag="338" ind1=" " ind2=" ">
    <subfield code="a">Online-Ressource</subfield>
    <subfield code="b">cr</subfield>
    <subfield code="2">rdacarrier</subfield>
  </datafield>
  <datafield tag="500" ind1=" " ind2=" ">
    <subfield code="a">Title from PDF title page (viewed Sept. 12, 2009). - Includes bibliographical references (p. 339-369) and index</subfield>
  </datafield>
  <datafield tag="500" ind1=" " ind2=" ">
    <subfield code="a">Title from PDF title page (viewed Sept. 12, 2009)</subfield>
  </datafield>
  <datafield tag="533" ind1=" " ind2=" ">
    <subfield code="a">Online-Ausg.</subfield>
  </datafield>
  <datafield tag="700" ind1="1" ind2=" ">
    <subfield code="a">Harris, William V.</subfield>
    <subfield code="d">1938-</subfield>
    <subfield code="4">oth</subfield>
  </datafield>
  <datafield tag="776" ind1="1" ind2=" ">
    <subfield code="z">9780674033818</subfield>
  </datafield>
  <datafield tag="776" ind1="1" ind2=" ">
    <subfield code="z">0674033817</subfield>
    <subfield code="c">Trade Paper</subfield>
  </datafield>
  <datafield tag="776" ind1="1" ind2=" ">
    <subfield code="z">9780674033818</subfield>
  </datafield>
  <datafield tag="776" ind1="0" ind2="8">
    <subfield code="i">Erscheint auch als</subfield>
    <subfield code="n">Druck-Ausgabe</subfield>
    <subfield code="a">Harris, William V</subfield>
    <subfield code="t">Ancient Literacy</subfield>
    <subfield code="d">Cambridge : Harvard University Press, ©2009</subfield>
    <subfield code="z">9780674033818</subfield>
  </datafield>
  <datafield tag="856" ind1="4" ind2="0">
    <subfield code="u">https://search.ebscohost.com/login.aspx?direct=true&amp;scope=site&amp;db=nlebk&amp;db=nlabk&amp;AN=282569</subfield>
    <subfield code="m">X:EBSCO</subfield>
    <subfield code="x">Aggregator</subfield>
    <subfield code="z">lizenzpflichtig</subfield>
    <subfield code="7">1</subfield>
  </datafield>
</record></zs:recordData><zs:recordPosition>2</zs:recordPosition></zs:record><zs:record><zs:recordSchema>marcxml</zs:recordSchema><zs:recordPacking>xml</zs:recordPacking><zs:recordData><record xmlns="http://www.loc.gov/MARC21/slim">
  <leader>     cam a22      c 4500</leader>
  <controlfield tag="001">211619655</controlfield>
  <controlfield tag="003">DE-627</controlfield>
  <controlfield tag="005">20251222205054.0</controlfield>
  <controlfield tag="007">tu</controlfield>
  <controlfield tag="008">960610s1991    xxu|||||      00| ||eng c</controlfield>
  <datafield tag="020" ind1=" " ind2=" ">
    <subfield code="a">9780674033818</subfield>
    <subfield code="q"> : (paper)</subfield>
    <subfield code="9">978-0-674-03381-8</subfield>
  </datafield>
  <datafield tag="020" ind1=" " ind2=" ">
    <subfield code="a">0674033817</subfield>
    <subfield code="q">(paper)</subfield>
    <subfield code="9">0-674-03381-7</subfield>
  </datafield>
  <datafield tag="020" ind1=" " ind2=" ">
    <subfield code="a">0674033809</subfield>
    <subfield code="9">0-674-03380-9</subfield>
  </datafield>
  <datafield tag="041" ind1=" " ind2=" ">
    <subfield code="a">eng</subfield>
  </datafield>
  <datafield tag="100" ind1="1" ind2=" ">
    <subfield code="a">Harris, William V.</subfield>
    <subfield code="d">1938-</subfield>
    <subfield code="4">aut</subfield>
  </datafield>
  <datafield tag="245" ind1="1" ind2="0">
    <subfield code="a">Ancient literacy</subfield>
    <subfield code="c">William V. Harris</subfield>
  </datafield>
  <datafield tag="250" ind1=" " ind2=" ">
    <subfield code="a">1. Harvard Univ. Press paperback ed.</subfield>
  </datafield>
  <datafield tag="264" ind1=" " ind2="1">
    <subfield code="a">Cambridge, Mass. [u.a.]</subfield>
    <subfield code="b">Harvard Univ. Press</subfield>
    <subfield code="c">1991</subfield>
  </datafield>
  <datafield tag="300" ind1=" " ind2=" ">
    <subfield code="a">XV, 383 S.</subfield>
    <subfield code="b">Ill.</subfield>
  </datafield>
  <datafield tag="338" ind1=" " ind2=" ">
    <subfield code="a">Band</subfield>
    <subfield code="b">nc</subfield>
    <subfield code="2">rdacarrier</subfield>
  </datafield>
  <datafield tag="500" ind1=" " ind2=" ">
    <subfield code="a">Literaturverz. S. 339 - 369</subfield>
  </datafield>
  <datafield tag="500" ind1=" " ind2=" ">
    <subfield code="a">Hier auch später erschienene, unveränderte Nachdrucke</subfield>
  </datafield>
</record></zs:recordData><zs:recordPosition>3</zs:recordPosition></zs:record><zs:record><zs:recordSchema>marcxml</zs:recordSchema><zs:recordPacking>xml</zs:recordPacking><zs:recordData><record xmlns="http://www.loc.gov/MARC21/slim">
  <leader>     cam a22     2c 4500</leader>
  <controlfield tag="001">1047490048</controlfield>
  <controlfield tag="003">DE-627</controlfield>
  <controlfield tag="005">20241202153052.0</controlfield>
  <controlfield tag="007">cr uuu---uuuuu</controlfield>
  <controlfield tag="008">190129s1989    xxu|||||o     00| ||eng c</controlfield>
  <datafield tag="020" ind1=" " ind2=" ">
    <subfield code="a">0674033817</subfield>
    <subfield code="9">0-674-03381-7</subfield>
  </datafield>
  <datafield tag="020" ind1=" " ind2=" ">
    <subfield code="a">0674033809</subfield>
    <subfield code="9">0-674-03380-9</subfield>
  </datafield>
  <datafield tag="041" ind1=" " ind2=" ">
    <subfield code="a">eng</subfield>
  </datafield>
  <datafield tag="100" ind1="1" ind2=" ">
    <subfield code="8">1\p</subfield>
    <subfield code="a">Harris, William V.</subfield>
    <subfield code="d">1938-</subfield>
    <subfield code="4">aut</subfield>
  </datafield>
  <datafield tag="245" ind1="1" ind2="0">
    <subfield code="a">Ancient literacy</subfield>
    <subfield code="c">William V. Harris</subfield>
  </datafield>
  <datafield tag="264" ind1=" " ind2="1">
    <subfield code="a">Cambridge, Mass</subfield>
    <subfield code="b">Harvard University Press</subfield>
    <subfield code="c">1989</subfield>
  </datafield>
  <datafield tag="300" ind1=" " ind2=" ">
    <subfield code="a">1 Online-Ressource (xv, 383 p)</subfield>
    <subfield code="c">25 cm</subfield>
  </datafield>
  <datafield tag="338" ind1=" " ind2=" ">
    <subfield code="a">Online-Ressource</subfield>
    <subfield code="b">cr</subfield>
    <subfield code="2">rdacarrier</subfield>
  </datafield>
  <datafield tag="500" ind1=" " ind2=" ">
    <subfield code="a">Includes bibliographical references (p. 339-369) and index</subfield>
  </datafield>
  <datafield tag="533" ind1=" " ind2=" ">
    <subfield code="a">Reproduktion</subfield>
    <subfield code="b">Ann Arbor, Mich</subfield>
    <subfield code="c">University of Michigan, Michigan Publishing</subfield>
    <subfield code="d">2002</subfield>
    <subfield code="e">Includes both TIFF files and keyword searchable text</subfield>
    <subfield code="f">[ACLS Humanities E-Book]</subfield>
    <subfield code="f">[ACLS Fellows’ Publications]</subfield>
    <subfield code="n">Electronic text and image data; Mode of access: Intranet</subfield>
    <subfield code="7">|2002||||||||||</subfield>
  </datafield>
  <datafield tag="710" ind1="2" ind2=" ">
    <subfield code="a">American Council of Learned Societies</subfield>
    <subfield code="4">oth</subfield>
  </datafield>
  <datafield tag="856" ind1="4" ind2="0">
    <subfield code="u">http://hdl.handle.net/2027/heb.01448</subfield>
    <subfield code="x">Verlag; ACLS</subfield>
    <subfield code="3">Volltext</subfield>
    <subfield code="7">1</subfield>
  </datafield>
  <datafield tag="856" ind1="4" ind2="0">
    <subfield code="u">https://hdl.handle.net/2027/heb01448</subfield>
    <subfield code="m">X:ACLS</subfield>
    <subfield code="x">Resolving-System</subfield>
    <subfield code="z">lizenzpflichtig</subfield>
    <subfield code="7">1</subfield>
  </datafield>
</record></zs:recordData><zs:recordPosition>4</zs:recordPosition></zs:record></zs:records><zs:echoedSearchRetrieveRequest><zs:version>1.1</zs:version><zs:query>pica.isb=9780674033818 or pica.isb=0674033817</zs:query><zs:maximumRecords>10</zs:maximumRecords><zs:recordPacking>xml</zs:recordPacking><zs:recordSchema>marcxml</zs:recordSchema></zs:echoedSearchRetrieveRequest></zs:searchRetrieveResponse>"####;

/// K10plus, the words Nagy, Best, Achaeans in title or person, printed books only.
pub const K10_NAGY: &str = r####"<?xml version="1.0" encoding="UTF-8"?>
<zs:searchRetrieveResponse xmlns:zs="http://www.loc.gov/zing/srw/"><zs:version>1.1</zs:version><zs:numberOfRecords>5</zs:numberOfRecords><zs:records><zs:record><zs:recordSchema>marcxml</zs:recordSchema><zs:recordPacking>xml</zs:recordPacking><zs:recordData><record xmlns="http://www.loc.gov/MARC21/slim">
  <leader>     cam a22      c 4500</leader>
  <controlfield tag="001">244455465</controlfield>
  <controlfield tag="003">DE-627</controlfield>
  <controlfield tag="005">20251222210722.0</controlfield>
  <controlfield tag="007">tu</controlfield>
  <controlfield tag="008">980530s1999    xxu|||||      00| ||eng c</controlfield>
  <datafield tag="010" ind1=" " ind2=" ">
    <subfield code="a">   98022262 </subfield>
  </datafield>
  <datafield tag="020" ind1=" " ind2=" ">
    <subfield code="a">0801860156</subfield>
    <subfield code="q">(acid-free paper)</subfield>
    <subfield code="9">0-8018-6015-6</subfield>
  </datafield>
  <datafield tag="024" ind1="8" ind2=" ">
    <subfield code="a">198-22262</subfield>
    <subfield code="q">Identnummer</subfield>
  </datafield>
  <datafield tag="041" ind1=" " ind2=" ">
    <subfield code="a">eng</subfield>
  </datafield>
  <datafield tag="100" ind1="1" ind2=" ">
    <subfield code="a">Nagy, Gregory</subfield>
    <subfield code="d">1942-</subfield>
    <subfield code="4">aut</subfield>
  </datafield>
  <datafield tag="245" ind1="1" ind2="4">
    <subfield code="a">The best of the Achaeans</subfield>
    <subfield code="b">concepts of the hero in Archaic Greek poetry</subfield>
    <subfield code="c">Gregory Nagy</subfield>
  </datafield>
  <datafield tag="250" ind1=" " ind2=" ">
    <subfield code="a">Rev. ed.</subfield>
  </datafield>
  <datafield tag="264" ind1=" " ind2="1">
    <subfield code="a">Baltimore [u.a.]</subfield>
    <subfield code="b">Johns Hopkins University Press</subfield>
    <subfield code="c">1999</subfield>
  </datafield>
  <datafield tag="300" ind1=" " ind2=" ">
    <subfield code="a">XVIII, 400 S.</subfield>
    <subfield code="c">23 cm</subfield>
  </datafield>
  <datafield tag="338" ind1=" " ind2=" ">
    <subfield code="a">Band</subfield>
    <subfield code="b">nc</subfield>
    <subfield code="2">rdacarrier</subfield>
  </datafield>
  <datafield tag="490" ind1="0" ind2=" ">
    <subfield code="a">A Johns Hopkins University paperback</subfield>
    <subfield code="a">Ancient studies</subfield>
  </datafield>
  <datafield tag="500" ind1=" " ind2=" ">
    <subfield code="a">Literaturverzeichnis S. [355] - 380 und Indizes</subfield>
  </datafield>
  <datafield tag="856" ind1="4" ind2="2">
    <subfield code="u">http://www.loc.gov/catdir/bios/jhu051/98022262.html</subfield>
    <subfield code="v">2016-05-12</subfield>
    <subfield code="x">Verlag</subfield>
    <subfield code="3">Autorenbiografie</subfield>
    <subfield code="7">1</subfield>
  </datafield>
  <datafield tag="856" ind1="4" ind2="2">
    <subfield code="u">http://www.loc.gov/catdir/description/jhu052/98022262.html</subfield>
    <subfield code="v">2016-05-12</subfield>
    <subfield code="x">Verlag</subfield>
    <subfield code="3">Verlagsangaben</subfield>
    <subfield code="7">1</subfield>
  </datafield>
</record></zs:recordData><zs:recordPosition>1</zs:recordPosition></zs:record><zs:record><zs:recordSchema>marcxml</zs:recordSchema><zs:recordPacking>xml</zs:recordPacking><zs:recordData><record xmlns="http://www.loc.gov/MARC21/slim">
  <leader>     cam a22     2c 4500</leader>
  <controlfield tag="001">1626914990</controlfield>
  <controlfield tag="003">DE-627</controlfield>
  <controlfield tag="005">20251225203410.0</controlfield>
  <controlfield tag="007">tu</controlfield>
  <controlfield tag="008">941010s1991    xx |||||      00| ||eng c</controlfield>
  <datafield tag="010" ind1=" " ind2=" ">
    <subfield code="a">   79009907 </subfield>
  </datafield>
  <datafield tag="020" ind1=" " ind2=" ">
    <subfield code="a">0801822009</subfield>
    <subfield code="9">0-8018-2200-9</subfield>
  </datafield>
  <datafield tag="020" ind1=" " ind2=" ">
    <subfield code="a">0801823889</subfield>
    <subfield code="9">0-8018-2388-9</subfield>
  </datafield>
  <datafield tag="041" ind1=" " ind2=" ">
    <subfield code="a">eng</subfield>
  </datafield>
  <datafield tag="100" ind1="1" ind2=" ">
    <subfield code="a">Nagy, Gregory</subfield>
    <subfield code="d">1942-</subfield>
    <subfield code="4">aut</subfield>
  </datafield>
  <datafield tag="245" ind1="1" ind2="4">
    <subfield code="a">The best of the Achaeans</subfield>
    <subfield code="b">concepts of the Hero in Archaic Greek poetry</subfield>
    <subfield code="c">Gregory Nagy</subfield>
  </datafield>
  <datafield tag="250" ind1=" " ind2=" ">
    <subfield code="a">3. pr.</subfield>
  </datafield>
  <datafield tag="264" ind1=" " ind2="1">
    <subfield code="a">Baltimore, Md. [u.a.]</subfield>
    <subfield code="b">Johns Hopkins Univ. Pr.</subfield>
    <subfield code="c">1991</subfield>
  </datafield>
  <datafield tag="300" ind1=" " ind2=" ">
    <subfield code="a">XVI, 392 S.</subfield>
  </datafield>
  <datafield tag="338" ind1=" " ind2=" ">
    <subfield code="a">Band</subfield>
    <subfield code="b">nc</subfield>
    <subfield code="2">rdacarrier</subfield>
  </datafield>
</record></zs:recordData><zs:recordPosition>2</zs:recordPosition></zs:record><zs:record><zs:recordSchema>marcxml</zs:recordSchema><zs:recordPacking>xml</zs:recordPacking><zs:recordData><record xmlns="http://www.loc.gov/MARC21/slim">
  <leader>     cam a22     2c 4500</leader>
  <controlfield tag="001">1448130557</controlfield>
  <controlfield tag="003">DE-627</controlfield>
  <controlfield tag="005">20220109140535.0</controlfield>
  <controlfield tag="007">tu</controlfield>
  <controlfield tag="008">130130s1981    xx |||||      00| ||eng c</controlfield>
  <datafield tag="041" ind1=" " ind2=" ">
    <subfield code="a">eng</subfield>
  </datafield>
  <datafield tag="100" ind1="1" ind2=" ">
    <subfield code="a">Nagy, Gregory</subfield>
    <subfield code="d">1942-</subfield>
    <subfield code="4">aut</subfield>
  </datafield>
  <datafield tag="245" ind1="1" ind2="4">
    <subfield code="a">The best of the Achaeans</subfield>
    <subfield code="b">concepts of the Hero in Archaic Greek poetry</subfield>
    <subfield code="c">Gregory Nagy</subfield>
  </datafield>
  <datafield tag="250" ind1=" " ind2=" ">
    <subfield code="a">Paperback ed.</subfield>
  </datafield>
  <datafield tag="264" ind1=" " ind2="1">
    <subfield code="a">Baltimore, Md. [u.a.]</subfield>
    <subfield code="b">Johns Hopkins Univ. Pr.</subfield>
    <subfield code="c">1981</subfield>
  </datafield>
  <datafield tag="300" ind1=" " ind2=" ">
    <subfield code="a">XVI, 392 S.</subfield>
  </datafield>
  <datafield tag="338" ind1=" " ind2=" ">
    <subfield code="a">Band</subfield>
    <subfield code="b">nc</subfield>
    <subfield code="2">rdacarrier</subfield>
  </datafield>
</record></zs:recordData><zs:recordPosition>3</zs:recordPosition></zs:record><zs:record><zs:recordSchema>marcxml</zs:recordSchema><zs:recordPacking>xml</zs:recordPacking><zs:recordData><record xmlns="http://www.loc.gov/MARC21/slim">
  <leader>     cam a22     2c 4500</leader>
  <controlfield tag="001">066994535</controlfield>
  <controlfield tag="003">DE-627</controlfield>
  <controlfield tag="005">20251219215058.0</controlfield>
  <controlfield tag="007">tu</controlfield>
  <controlfield tag="008">001001s1981    xx |||||      00| ||und c</controlfield>
  <datafield tag="100" ind1="1" ind2=" ">
    <subfield code="8">1\p</subfield>
    <subfield code="a">Nagy, Gregory</subfield>
    <subfield code="d">1942-</subfield>
    <subfield code="4">aut</subfield>
  </datafield>
  <datafield tag="245" ind1="1" ind2="4">
    <subfield code="a">The Best of the Achaeans</subfield>
    <subfield code="b">concepts of the hero in archaic Greek poetry</subfield>
    <subfield code="c">Gregory Nagy</subfield>
  </datafield>
  <datafield tag="250" ind1=" " ind2=" ">
    <subfield code="a">[Paperbacks ed.]</subfield>
  </datafield>
  <datafield tag="264" ind1=" " ind2="1">
    <subfield code="a">Baltimore</subfield>
    <subfield code="a">London</subfield>
    <subfield code="b">Johns Hopkins Univ. Press</subfield>
    <subfield code="c">1981</subfield>
  </datafield>
  <datafield tag="300" ind1=" " ind2=" ">
    <subfield code="a">XVI, 392 S</subfield>
  </datafield>
  <datafield tag="338" ind1=" " ind2=" ">
    <subfield code="a">Band</subfield>
    <subfield code="b">nc</subfield>
    <subfield code="2">rdacarrier</subfield>
  </datafield>
</record></zs:recordData><zs:recordPosition>4</zs:recordPosition></zs:record><zs:record><zs:recordSchema>marcxml</zs:recordSchema><zs:recordPacking>xml</zs:recordPacking><zs:recordData><record xmlns="http://www.loc.gov/MARC21/slim">
  <leader>     cam a22      c 4500</leader>
  <controlfield tag="001">039862534</controlfield>
  <controlfield tag="003">DE-627</controlfield>
  <controlfield tag="005">20260423121338.0</controlfield>
  <controlfield tag="007">tu</controlfield>
  <controlfield tag="008">850101s1979    xxu|||||      00| ||eng c</controlfield>
  <datafield tag="020" ind1=" " ind2=" ">
    <subfield code="a">0801822009</subfield>
    <subfield code="9">0-8018-2200-9</subfield>
  </datafield>
  <datafield tag="041" ind1=" " ind2=" ">
    <subfield code="a">eng</subfield>
    <subfield code="a">gre</subfield>
  </datafield>
  <datafield tag="100" ind1="1" ind2=" ">
    <subfield code="a">Nagy, Gregory</subfield>
    <subfield code="d">1942-</subfield>
    <subfield code="4">aut</subfield>
  </datafield>
  <datafield tag="245" ind1="1" ind2="4">
    <subfield code="a">The best of the Achaeans</subfield>
    <subfield code="b">concepts of the Hero in Archaic Greek poetry</subfield>
    <subfield code="c">Gregory Nagy</subfield>
  </datafield>
  <datafield tag="264" ind1=" " ind2="1">
    <subfield code="a">Baltimore, Md. [u.a.]</subfield>
    <subfield code="b">Johns Hopkins Univ. Pr.</subfield>
    <subfield code="c">1979</subfield>
  </datafield>
  <datafield tag="300" ind1=" " ind2=" ">
    <subfield code="a">XVI, 392 S.</subfield>
  </datafield>
  <datafield tag="338" ind1=" " ind2=" ">
    <subfield code="a">Band</subfield>
    <subfield code="b">nc</subfield>
    <subfield code="2">rdacarrier</subfield>
  </datafield>
  <datafield tag="500" ind1=" " ind2=" ">
    <subfield code="a">Bibliography: p. 355-373</subfield>
  </datafield>
</record></zs:recordData><zs:recordPosition>5</zs:recordPosition></zs:record></zs:records><zs:echoedSearchRetrieveRequest><zs:version>1.1</zs:version><zs:query>(pica.tit="Nagy" or pica.per="Nagy") and (pica.tit="Best" or pica.per="Best") and (pica.tit="Achaeans" or pica.per="Achaeans") and (pica.bbg=Aa* or pica.bbg=Af*)</zs:query><zs:maximumRecords>10</zs:maximumRecords><zs:recordPacking>xml</zs:recordPacking><zs:recordSchema>marcxml</zs:recordSchema></zs:echoedSearchRetrieveRequest></zs:searchRetrieveResponse>"####;

/// K10plus, the words kulturelle, Gedächtnis, Assmann in title or person; records 2, 3, 5 and 7 of 10.
pub const K10_MIXED: &str = r####"<?xml version="1.0" encoding="UTF-8"?>
<zs:searchRetrieveResponse xmlns:zs="http://www.loc.gov/zing/srw/"><zs:version>1.1</zs:version><zs:numberOfRecords>63</zs:numberOfRecords><zs:records><zs:record><zs:recordSchema>marcxml</zs:recordSchema><zs:recordPacking>xml</zs:recordPacking><zs:recordData><record xmlns="http://www.loc.gov/MARC21/slim">
  <leader>     cam a22     2c 4500</leader>
  <controlfield tag="001">1929631456</controlfield>
  <controlfield tag="003">DE-627</controlfield>
  <controlfield tag="005">20250801113534.0</controlfield>
  <controlfield tag="007">tu</controlfield>
  <controlfield tag="008">250702s2024    ja |||||      00| ||jpn c</controlfield>
  <datafield tag="020" ind1=" " ind2=" ">
    <subfield code="a">9784571300424</subfield>
    <subfield code="q"> : Festeinband</subfield>
    <subfield code="9">978-4-571-30042-4</subfield>
  </datafield>
  <datafield tag="020" ind1=" " ind2=" ">
    <subfield code="a">4571300425</subfield>
    <subfield code="9">4-571-30042-5</subfield>
  </datafield>
  <datafield tag="041" ind1=" " ind2=" ">
    <subfield code="a">jpn</subfield>
    <subfield code="h">ger</subfield>
  </datafield>
  <datafield tag="100" ind1="1" ind2=" ">
    <subfield code="a">Assmann, Jan</subfield>
    <subfield code="d">1938-2024</subfield>
    <subfield code="e">VerfasserIn</subfield>
    <subfield code="4">aut</subfield>
  </datafield>
  <datafield tag="240" ind1="1" ind2="4">
    <subfield code="a">Das kulturelle Gedächtnis</subfield>
  </datafield>
  <datafield tag="245" ind1="1" ind2="0">
    <subfield code="a">Bunkateki kioku</subfield>
    <subfield code="b">kodai chichūkai shobunka ni okeru shoji, sōki, seijiteki aidentiti = Das kulturelle Gedächtnis : Schrift, Erinnerung und politische Identität in frühen Hochkulturen</subfield>
    <subfield code="c">Yan Asuman cho ; Yasukawa Haruki yaku</subfield>
  </datafield>
  <datafield tag="246" ind1="3" ind2="1">
    <subfield code="a">Das kulturelle Gedächtnis</subfield>
    <subfield code="b">Schrift, Erinnerung und politische Identität in frühen Hochkulturen</subfield>
  </datafield>
  <datafield tag="250" ind1=" " ind2=" ">
    <subfield code="a">Shohan dai 1satsu hakkō</subfield>
  </datafield>
  <datafield tag="264" ind1=" " ind2="1">
    <subfield code="a">Tōkyōto</subfield>
    <subfield code="b">Fukumura Shuppan</subfield>
    <subfield code="c">2024nen 7gatsu 5ka</subfield>
  </datafield>
  <datafield tag="300" ind1=" " ind2=" ">
    <subfield code="a">405 Seiten</subfield>
    <subfield code="c">22 cm</subfield>
  </datafield>
  <datafield tag="338" ind1=" " ind2=" ">
    <subfield code="a">Band</subfield>
    <subfield code="b">nc</subfield>
    <subfield code="2">rdacarrier</subfield>
  </datafield>
  <datafield tag="546" ind1=" " ind2=" ">
    <subfield code="a">Japanisch (Kanji, Hiragana und Katakana)</subfield>
  </datafield>
  <datafield tag="700" ind1="1" ind2=" ">
    <subfield code="a">Yasukawa, Haruki</subfield>
    <subfield code="d">1973-</subfield>
    <subfield code="e">ÜbersetzerIn</subfield>
    <subfield code="4">trl</subfield>
  </datafield>
  <datafield tag="856" ind1="4" ind2="2">
    <subfield code="u">https://d-nb.info/1348177713/04</subfield>
    <subfield code="m">B:DE-101</subfield>
    <subfield code="q">application/pdf</subfield>
    <subfield code="x">Verlag</subfield>
    <subfield code="3">Inhaltsverzeichnis</subfield>
    <subfield code="7">1</subfield>
  </datafield>
</record></zs:recordData><zs:recordPosition>2</zs:recordPosition></zs:record><zs:record><zs:recordSchema>marcxml</zs:recordSchema><zs:recordPacking>xml</zs:recordPacking><zs:recordData><record xmlns="http://www.loc.gov/MARC21/slim">
  <leader>     caa a22      c 4500</leader>
  <controlfield tag="001">1778916767</controlfield>
  <controlfield tag="003">DE-627</controlfield>
  <controlfield tag="005">20220331143212.0</controlfield>
  <controlfield tag="007">tu</controlfield>
  <controlfield tag="008">211124s2021    xx |||||      00| ||ger c</controlfield>
  <datafield tag="041" ind1=" " ind2=" ">
    <subfield code="a">ger</subfield>
  </datafield>
  <datafield tag="100" ind1="1" ind2=" ">
    <subfield code="a">Assmann, Aleida</subfield>
    <subfield code="d">1947-</subfield>
    <subfield code="e">VerfasserIn</subfield>
    <subfield code="4">aut</subfield>
  </datafield>
  <datafield tag="245" ind1="1" ind2="0">
    <subfield code="a">Nietzsche und das kulturelle Gedächtnis</subfield>
    <subfield code="b">eine kritische Relektüre der "Zweiten Unzeitgemässen Betrachtung"</subfield>
    <subfield code="c">Aleida Assmann</subfield>
  </datafield>
  <datafield tag="264" ind1=" " ind2="1">
    <subfield code="c">2021</subfield>
  </datafield>
  <datafield tag="338" ind1=" " ind2=" ">
    <subfield code="a">Band</subfield>
    <subfield code="b">nc</subfield>
    <subfield code="2">rdacarrier</subfield>
  </datafield>
  <datafield tag="773" ind1="0" ind2="8">
    <subfield code="i">Enthalten in</subfield>
    <subfield code="a">Ohne Zukunft, ohne Erinnerungen, so sitze ich hier': Friedrich Nietzsche zwischen Geschichte und Gedächtnis (Veranstaltung : 2018 : Naumburg (Saale))</subfield>
    <subfield code="t">Nietzsche on memory and history</subfield>
    <subfield code="d">Berlin : De Gruyter, 2021</subfield>
    <subfield code="g">(2021), Seite 79-93</subfield>
    <subfield code="h">XIV, 340 Seiten</subfield>
    <subfield code="w">(DE-627)168889117X</subfield>
    <subfield code="z">9783110671070</subfield>
    <subfield code="7">nnam</subfield>
  </datafield>
  <datafield tag="773" ind1="1" ind2="8">
    <subfield code="g">year:2021</subfield>
    <subfield code="g">pages:79-93</subfield>
  </datafield>
</record></zs:recordData><zs:recordPosition>3</zs:recordPosition></zs:record><zs:record><zs:recordSchema>marcxml</zs:recordSchema><zs:recordPacking>xml</zs:recordPacking><zs:recordData><record xmlns="http://www.loc.gov/MARC21/slim">
  <leader>     caa a22     2c 4500</leader>
  <controlfield tag="001">1873970374</controlfield>
  <controlfield tag="003">DE-627</controlfield>
  <controlfield tag="005">20241205135203.0</controlfield>
  <controlfield tag="007">tu</controlfield>
  <controlfield tag="008">231213s2018    xx |||||      00| ||ger c</controlfield>
  <datafield tag="041" ind1=" " ind2=" ">
    <subfield code="a">ger</subfield>
  </datafield>
  <datafield tag="100" ind1="1" ind2=" ">
    <subfield code="a">Assmann, Aleida</subfield>
    <subfield code="d">1947-</subfield>
    <subfield code="e">InterviewteR</subfield>
    <subfield code="4">ive</subfield>
  </datafield>
  <datafield tag="245" ind1="1" ind2="5">
    <subfield code="a">"Der Wert der Wahrheit ist wichtiger denn je"</subfield>
    <subfield code="b">Aleida und Jan Assmann bekommen den Friedenspreis 2018 : ein Gespräch über das große Thema des Forscherpaares: das kulturelle Gedächtnis der Gesellschaft</subfield>
    <subfield code="c">Interview: Stefan Hauck</subfield>
  </datafield>
  <datafield tag="264" ind1=" " ind2="1">
    <subfield code="c">2018</subfield>
  </datafield>
  <datafield tag="300" ind1=" " ind2=" ">
    <subfield code="b">Illustrationen, 1 Porträt</subfield>
  </datafield>
  <datafield tag="300" ind1=" " ind2=" ">
    <subfield code="a">2</subfield>
  </datafield>
  <datafield tag="338" ind1=" " ind2=" ">
    <subfield code="a">Band</subfield>
    <subfield code="b">nc</subfield>
    <subfield code="2">rdacarrier</subfield>
  </datafield>
  <datafield tag="700" ind1="1" ind2=" ">
    <subfield code="a">Assmann, Jan</subfield>
    <subfield code="d">1938-2024</subfield>
    <subfield code="e">InterviewteR</subfield>
    <subfield code="4">ive</subfield>
  </datafield>
  <datafield tag="700" ind1="1" ind2=" ">
    <subfield code="a">Hauck, Stefan</subfield>
    <subfield code="d">1964-</subfield>
    <subfield code="e">InterviewerIn</subfield>
    <subfield code="4">ivr</subfield>
  </datafield>
  <datafield tag="773" ind1="0" ind2="8">
    <subfield code="i">Enthalten in</subfield>
    <subfield code="t">Börsenblatt</subfield>
    <subfield code="d">Frankfurt am Main : [Börsenverein des Deutschen Buchhandels e.V.], 2003</subfield>
    <subfield code="g">185 (2018), 24, Seite 18-19</subfield>
    <subfield code="w">(DE-627)358954037</subfield>
    <subfield code="w">(DE-600)2097499-1</subfield>
    <subfield code="w">(DE-576)103116524</subfield>
    <subfield code="x">1611-4280</subfield>
    <subfield code="7">nnas</subfield>
  </datafield>
  <datafield tag="773" ind1="1" ind2="8">
    <subfield code="g">volume:185</subfield>
    <subfield code="g">year:2018</subfield>
    <subfield code="g">number:24</subfield>
    <subfield code="g">pages:18-19</subfield>
    <subfield code="g">extent:2</subfield>
  </datafield>
</record></zs:recordData><zs:recordPosition>5</zs:recordPosition></zs:record><zs:record><zs:recordSchema>marcxml</zs:recordSchema><zs:recordPacking>xml</zs:recordPacking><zs:recordData><record xmlns="http://www.loc.gov/MARC21/slim">
  <leader>     naa a22     2c 4500</leader>
  <controlfield tag="001">1729040977</controlfield>
  <controlfield tag="003">DE-627</controlfield>
  <controlfield tag="005">20200908044953.0</controlfield>
  <controlfield tag="007">tu</controlfield>
  <controlfield tag="008">200908s2018    xx |||||      00| ||ger c</controlfield>
  <datafield tag="041" ind1=" " ind2=" ">
    <subfield code="a">ger</subfield>
  </datafield>
  <datafield tag="100" ind1="1" ind2=" ">
    <subfield code="a">Assmann, Jan</subfield>
    <subfield code="d">1938-2024</subfield>
    <subfield code="e">VerfasserIn</subfield>
    <subfield code="4">aut</subfield>
  </datafield>
  <datafield tag="245" ind1="1" ind2="0">
    <subfield code="a">Einführung</subfield>
    <subfield code="b">Was ist das „kulturelle Gedächtnis"?</subfield>
  </datafield>
  <datafield tag="264" ind1=" " ind2="1">
    <subfield code="c">2018</subfield>
  </datafield>
  <datafield tag="338" ind1=" " ind2=" ">
    <subfield code="a">Band</subfield>
    <subfield code="b">nc</subfield>
    <subfield code="2">rdacarrier</subfield>
  </datafield>
  <datafield tag="773" ind1="0" ind2="8">
    <subfield code="i">Enthalten in</subfield>
    <subfield code="a">Assmann, Jan, 1938 - 2024</subfield>
    <subfield code="t">Religion und kulturelles Gedächtnis</subfield>
    <subfield code="b">Originalausgabe, 5. Auflage, unveränderter Nachdruck</subfield>
    <subfield code="d">München : C.H. Beck, 2018</subfield>
    <subfield code="g">(2018), Seite 11-44</subfield>
    <subfield code="h">256 Seiten</subfield>
    <subfield code="w">(DE-627)1025837061</subfield>
    <subfield code="w">(DE-576)511102623</subfield>
    <subfield code="z">9783406730320</subfield>
    <subfield code="z">3406730329</subfield>
    <subfield code="7">nnam</subfield>
  </datafield>
  <datafield tag="773" ind1="1" ind2="8">
    <subfield code="g">year:2018</subfield>
    <subfield code="g">pages:11-44</subfield>
  </datafield>
</record></zs:recordData><zs:recordPosition>7</zs:recordPosition></zs:record></zs:records><zs:echoedSearchRetrieveRequest><zs:version>1.1</zs:version><zs:query>(pica.tit="kulturelle" or pica.per="kulturelle") and (pica.tit="Gedächtnis" or pica.per="Gedächtnis") and (pica.tit="Assmann" or pica.per="Assmann")</zs:query><zs:maximumRecords>10</zs:maximumRecords><zs:recordPacking>xml</zs:recordPacking><zs:recordSchema>marcxml</zs:recordSchema></zs:echoedSearchRetrieveRequest></zs:searchRetrieveResponse>"####;

/// Deutsche Nationalbibliothek, num=9783406568442 or num=3406568440.
pub const DNB_ASSMANN: &str = r####"<?xml version="1.0" encoding="UTF-8"?>
<searchRetrieveResponse xmlns="http://www.loc.gov/zing/srw/"><version>1.1</version><numberOfRecords>2</numberOfRecords><records><record><recordSchema>MARC21-xml</recordSchema><recordPacking>xml</recordPacking><recordData><record xmlns="http://www.loc.gov/MARC21/slim" type="Bibliographic">
    <leader>00000nam a2200000 c 4500</leader>
    <controlfield tag="001">1030500924</controlfield>
    <controlfield tag="003">DE-101</controlfield>
    <controlfield tag="005">20171203072448.0</controlfield>
    <controlfield tag="007">tu</controlfield>
    <controlfield tag="008">130204s2013    gw ||||| |||| 00||||ger  </controlfield>
    <datafield tag="020" ind1=" " ind2=" ">
      <subfield code="a">9783406568442</subfield>
      <subfield code="c">kart. : EUR 12.95</subfield>
      <subfield code="9">978-3-406-56844-2</subfield>
    </datafield>
    <datafield tag="041" ind1=" " ind2=" ">
      <subfield code="a">ger</subfield>
    </datafield>
    <datafield tag="100" ind1="1" ind2=" ">
      <subfield code="a">Assmann, Jan</subfield>
      <subfield code="d">1938-2024</subfield>
      <subfield code="e">Verfasser</subfield>
      <subfield code="4">aut</subfield>
      <subfield code="2">gnd</subfield>
    </datafield>
    <datafield tag="245" ind1="1" ind2="0">
      <subfield code="a">&#152;Das&#156; kulturelle Gedächtnis</subfield>
      <subfield code="b">Schrift, Erinnerung und politische Identität in frühen Hochkulturen</subfield>
      <subfield code="c">Jan Assmann</subfield>
    </datafield>
    <datafield tag="250" ind1=" " ind2=" ">
      <subfield code="a">7. Aufl.</subfield>
    </datafield>
    <datafield tag="264" ind1=" " ind2="1">
      <subfield code="a">München</subfield>
      <subfield code="b">Beck</subfield>
      <subfield code="c">2013</subfield>
    </datafield>
    <datafield tag="300" ind1=" " ind2=" ">
      <subfield code="a">344 S.</subfield>
      <subfield code="c">19 cm</subfield>
    </datafield>
    <datafield tag="338" ind1=" " ind2=" ">
      <subfield code="a">Band</subfield>
      <subfield code="b">nc</subfield>
      <subfield code="2">rdacarrier</subfield>
    </datafield>
    <datafield tag="490" ind1="1" ind2=" ">
      <subfield code="a">Beck'sche Reihe</subfield>
      <subfield code="v">1307</subfield>
    </datafield>
    <datafield tag="500" ind1=" " ind2=" ">
      <subfield code="a">Literaturangaben</subfield>
    </datafield>
    <datafield tag="776" ind1="0" ind2="8">
      <subfield code="i">Erscheint auch als</subfield>
      <subfield code="n">Online-Ausgabe</subfield>
      <subfield code="a">Assmann, Jan, 1938-2024</subfield>
      <subfield code="t">&#152;Das&#156; kulturelle Gedächtnis</subfield>
      <subfield code="d">München : C.H.Beck, 2017</subfield>
      <subfield code="h">Online-Ressourcen, 344 Seiten</subfield>
      <subfield code="w">(DE-101)1136615571</subfield>
      <subfield code="b">7. Auflage</subfield>
    </datafield>
    <datafield tag="830" ind1=" " ind2="0">
      <subfield code="a">Beck'sche Reihe</subfield>
      <subfield code="v">1307</subfield>
      <subfield code="w">(DE-101)010513507</subfield>
      <subfield code="w">(DE-600)58161-6</subfield>
      <subfield code="9">41307</subfield>
      <subfield code="7">as</subfield>
    </datafield>
    <datafield tag="856" ind1="4" ind2="2">
      <subfield code="m">X:MVB</subfield>
      <subfield code="q">text/html</subfield>
      <subfield code="u">https://services.dnb.de/plus/idn/1030500924/blurb/</subfield>
      <subfield code="3">Inhaltstext</subfield>
    </datafield>
    <datafield tag="856" ind1="4" ind2="2">
      <subfield code="m">B:DE-101</subfield>
      <subfield code="q">application/pdf</subfield>
      <subfield code="u">https://d-nb.info/1030500924/04</subfield>
      <subfield code="3">Inhaltsverzeichnis</subfield>
    </datafield>
  </record></recordData><recordPosition>1</recordPosition></record><record><recordSchema>MARC21-xml</recordSchema><recordPacking>xml</recordPacking><recordData><record xmlns="http://www.loc.gov/MARC21/slim" type="Bibliographic">
    <leader>00000nam a2200000 c 4500</leader>
    <controlfield tag="001">98706388X</controlfield>
    <controlfield tag="003">DE-101</controlfield>
    <controlfield tag="005">20171202054314.0</controlfield>
    <controlfield tag="007">tu</controlfield>
    <controlfield tag="008">080109s2007    gw ||||| |||| 00||||ger  </controlfield>
    <datafield tag="020" ind1=" " ind2=" ">
      <subfield code="a">9783406568442</subfield>
      <subfield code="c">kart. : EUR 12.95</subfield>
      <subfield code="9">978-3-406-56844-2</subfield>
    </datafield>
    <datafield tag="020" ind1=" " ind2=" ">
      <subfield code="z">9783406568466</subfield>
      <subfield code="c">kart. : EUR 12.95</subfield>
      <subfield code="9">978-3-406-56846-6</subfield>
    </datafield>
    <datafield tag="041" ind1=" " ind2=" ">
      <subfield code="a">ger</subfield>
    </datafield>
    <datafield tag="100" ind1="1" ind2=" ">
      <subfield code="a">Assmann, Jan</subfield>
      <subfield code="d">1938-2024</subfield>
      <subfield code="e">Verfasser</subfield>
      <subfield code="4">aut</subfield>
      <subfield code="2">gnd</subfield>
    </datafield>
    <datafield tag="245" ind1="1" ind2="0">
      <subfield code="a">&#152;Das&#156; kulturelle Gedächtnis</subfield>
      <subfield code="b">Schrift, Erinnerung und politische Identität in frühen Hochkulturen</subfield>
      <subfield code="c">Jan Assmann</subfield>
    </datafield>
    <datafield tag="250" ind1=" " ind2=" ">
      <subfield code="a">6. Aufl.</subfield>
    </datafield>
    <datafield tag="264" ind1=" " ind2="1">
      <subfield code="a">München</subfield>
      <subfield code="b">Beck</subfield>
      <subfield code="c">2007</subfield>
    </datafield>
    <datafield tag="300" ind1=" " ind2=" ">
      <subfield code="a">344 S.</subfield>
      <subfield code="c">19 cm</subfield>
    </datafield>
    <datafield tag="338" ind1=" " ind2=" ">
      <subfield code="a">Band</subfield>
      <subfield code="b">nc</subfield>
      <subfield code="2">rdacarrier</subfield>
    </datafield>
    <datafield tag="490" ind1="1" ind2=" ">
      <subfield code="a">Beck'sche Reihe</subfield>
      <subfield code="v">1307</subfield>
    </datafield>
    <datafield tag="500" ind1=" " ind2=" ">
      <subfield code="a">Literaturverz. S. 305 - 326</subfield>
    </datafield>
    <datafield tag="830" ind1=" " ind2="0">
      <subfield code="a">Beck'sche Reihe</subfield>
      <subfield code="v">1307</subfield>
      <subfield code="w">(DE-101)010513507</subfield>
      <subfield code="w">(DE-600)58161-6</subfield>
      <subfield code="9">41307</subfield>
      <subfield code="7">as</subfield>
    </datafield>
    <datafield tag="856" ind1="4" ind2="2">
      <subfield code="m">V:DE-601</subfield>
      <subfield code="q">application/pdf</subfield>
      <subfield code="u">https://d-nb.info/98706388X/04</subfield>
      <subfield code="3">Inhaltsverzeichnis</subfield>
    </datafield>
  </record></recordData><recordPosition>2</recordPosition></record></records><echoedSearchRetrieveRequest><version>1.1</version><query>num=9783406568442 or num=3406568440</query><xQuery xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:nil="true"/><maximumRecords>10</maximumRecords><recordSchema>MARC21-xml</recordSchema></echoedSearchRetrieveRequest></searchRetrieveResponse>"####;

/// Alma (Sikt), alma.isbn=9788202413736.
pub const ALMA_REM: &str = r####"<?xml version="1.0" encoding="UTF-8" standalone="no"?><searchRetrieveResponse xmlns="http://www.loc.gov/zing/srw/">
  <version>1.2</version>
  <numberOfRecords>1</numberOfRecords>
  <records>
    <record>
      <recordSchema>marcxml</recordSchema>
      <recordPacking>xml</recordPacking>
      <recordData>
        <record xmlns="http://www.loc.gov/MARC21/slim">
          <leader>05699cam a2200829 c 4500</leader>
          <controlfield tag="001">991427413704702201</controlfield>
          <controlfield tag="005">20260903181526.0</controlfield>
          <controlfield tag="007">ta</controlfield>
          <controlfield tag="008">150605s2014    no a|||e| ||||00||0bnob|^</controlfield>
          <datafield ind1=" " ind2=" " tag="010">
            <subfield code="a">2015425036</subfield>
          </datafield>
          <datafield ind1=" " ind2=" " tag="020">
            <subfield code="a">978-82-02-41373-6</subfield>
            <subfield code="q">ib.</subfield>
            <subfield code="c">Nkr 449.00</subfield>
          </datafield>
          <datafield ind1="1" ind2=" " tag="100">
            <subfield code="a">Rem, Tore</subfield>
            <subfield code="d">1967-</subfield>
            <subfield code="4">aut</subfield>
          </datafield>
          <datafield ind1="1" ind2="0" tag="245">
            <subfield code="a">Knut Hamsun :</subfield>
            <subfield code="b">reisen til Hitler</subfield>
            <subfield code="c">Tore Rem</subfield>
          </datafield>
          <datafield ind1=" " ind2=" " tag="260">
            <subfield code="a">[Oslo]</subfield>
            <subfield code="b">Cappelen Damm</subfield>
            <subfield code="c">2014</subfield>
          </datafield>
          <datafield ind1=" " ind2=" " tag="300">
            <subfield code="a">395 s.</subfield>
            <subfield code="b">ill.</subfield>
          </datafield>
          <datafield ind1=" " ind2=" " tag="533">
            <subfield code="a">Elektronisk reproduksjon</subfield>
            <subfield code="b">[Norge]</subfield>
            <subfield code="c">Nasjonalbiblioteket Digital</subfield>
            <subfield code="d">2019-08-08</subfield>
          </datafield>
          <datafield ind1="0" ind2=" " tag="767">
            <subfield code="t">Knut Hamsun och resan till Hitler</subfield>
            <subfield code="w">999920020783302201</subfield>
          </datafield>
          <datafield ind1="0" ind2=" " tag="767">
            <subfield code="t">Knut Hamsun : die Reise zu Hitler</subfield>
            <subfield code="w">999920101286002201</subfield>
          </datafield>
          <datafield ind1="0" ind2=" " tag="767">
            <subfield code="t">Knut Hamsun : rejsen til Hitler</subfield>
            <subfield code="w">991518420354702201</subfield>
          </datafield>
          <datafield ind1="0" ind2=" " tag="767">
            <subfield code="t">Knut Gamsun : vizit k Gitleru</subfield>
            <subfield code="w">999920483787002201</subfield>
            <subfield code="z">978-5-89826-512-0</subfield>
          </datafield>
          <datafield ind1="4" ind2="2" tag="856">
            <subfield code="3">Forlagets beskrivelse (lang)</subfield>
            <subfield code="u">https://contents.bibs.aws.unit.no/content/?isbn=9788202413736</subfield>
          </datafield>
          <datafield ind1="4" ind2="2" tag="856">
            <subfield code="3">Originalt bilde</subfield>
            <subfield code="u">https://contents.bibs.aws.unit.no/files/images/original/6/3/9788202413736.jpg</subfield>
            <subfield code="q">image/jpeg</subfield>
          </datafield>
          <datafield ind1="4" ind2="2" tag="856">
            <subfield code="3">Omslagsbilde</subfield>
            <subfield code="u">https://contents.bibs.aws.unit.no/files/images/large/6/3/9788202413736.jpg</subfield>
            <subfield code="q">image/jpeg</subfield>
          </datafield>
          <datafield ind1="4" ind2="2" tag="856">
            <subfield code="3">Forlagets beskrivelse (kort)</subfield>
            <subfield code="u">https://www.cappelendamm.no/_knut-hamsun-tore-rem-9788202413736</subfield>
            <subfield code="q">text/html</subfield>
            <subfield code="n">Cappelen Damm.</subfield>
          </datafield>
          <datafield ind1="4" ind2="2" tag="856">
            <subfield code="3">Gjenstandsbeskrivelse</subfield>
            <subfield code="u">https://lccn.loc.gov/2015425036</subfield>
            <subfield code="q">text/html</subfield>
            <subfield code="n">Library of Congress, Washington DC</subfield>
          </datafield>
          <datafield ind1="4" ind2="2" tag="856">
            <subfield code="3">Gjenstandsbeskrivelse</subfield>
            <subfield code="u">http://www.worldcat.org/oclc/1028487024</subfield>
            <subfield code="q">text/html</subfield>
            <subfield code="n">OCLC. Dublin, Ohio</subfield>
          </datafield>
          <datafield ind1="4" ind2="2" tag="856">
            <subfield code="3">Forlagets beskrivelse (kort)</subfield>
            <subfield code="u">https://contents.bibs.aws.unit.no/?isbn=9788202413736</subfield>
          </datafield>
          <datafield ind1="4" ind2="2" tag="856">
            <subfield code="3">Omslagsbilde</subfield>
            <subfield code="u">https://contents.bibs.aws.unit.no/files/images/small/6/3/9788202413736.jpg</subfield>
            <subfield code="q">image/jpeg</subfield>
          </datafield>
          <datafield ind1="4" ind2="1" tag="856">
            <subfield code="3">Fulltekst</subfield>
            <subfield code="u">https://urn.nb.no/URN:NBN:no-nb_digibok_2019080807142</subfield>
            <subfield code="y">Nettbiblioteket</subfield>
            <subfield code="z">Digital representasjon</subfield>
          </datafield>
        </record>
      </recordData>
      <recordIdentifier>991427413704702201</recordIdentifier>
      <recordPosition>1</recordPosition>
    </record>
  </records>
  <extraResponseData xmlns:xb="http://www.exlibris.com/repository/search/xmlbeans/">
    <xb:exact>true</xb:exact>
    <xb:responseDate>2026-09-27T22:24:56+0200</xb:responseDate>
  </extraResponseData>
</searchRetrieveResponse>"####;

/// Alma (Sikt), alma.all_for_ui all "Hamsun reisen Hitler Rem" and alma.bib_level=m.
pub const ALMA_SEARCH: &str = r####"<?xml version="1.0" encoding="UTF-8" standalone="no"?><searchRetrieveResponse xmlns="http://www.loc.gov/zing/srw/">
  <version>1.2</version>
  <numberOfRecords>7</numberOfRecords>
  <records>
    <record>
      <recordSchema>marcxml</recordSchema>
      <recordPacking>xml</recordPacking>
      <recordData>
        <record xmlns="http://www.loc.gov/MARC21/slim">
          <leader>01161nam a2200325 c 4500</leader>
          <controlfield tag="001">999920483787002201</controlfield>
          <controlfield tag="005">20230601114309.0</controlfield>
          <controlfield tag="007">ta</controlfield>
          <controlfield tag="008">180212s2018    ru aoc e |||||000 0brus|^</controlfield>
          <datafield ind1=" " ind2=" " tag="020">
            <subfield code="a">978-5-89826-512-0</subfield>
            <subfield code="q">ib.</subfield>
          </datafield>
          <datafield ind1="1" ind2=" " tag="041">
            <subfield code="a">rus</subfield>
            <subfield code="h">nob</subfield>
          </datafield>
          <datafield ind1="1" ind2=" " tag="100">
            <subfield code="a">Rem, Tore</subfield>
            <subfield code="d">1967-</subfield>
            <subfield code="4">aut</subfield>
          </datafield>
          <datafield ind1="1" ind2="0" tag="245">
            <subfield code="a">Knut Gamsun :</subfield>
            <subfield code="b">vizit k Gitleru</subfield>
            <subfield code="c">Ture Rem</subfield>
          </datafield>
          <datafield ind1="1" ind2=" " tag="246">
            <subfield code="i">Originaltittel:</subfield>
            <subfield code="a">Knut Hamsun : reisen til Hitler</subfield>
          </datafield>
          <datafield ind1=" " ind2=" " tag="260">
            <subfield code="a">Moskva</subfield>
            <subfield code="b">Progress-Tradicija</subfield>
            <subfield code="c">2018</subfield>
          </datafield>
          <datafield ind1=" " ind2=" " tag="300">
            <subfield code="a">365 s.</subfield>
            <subfield code="b">ill.</subfield>
            <subfield code="c">22 cm</subfield>
          </datafield>
          <datafield ind1=" " ind2=" " tag="500">
            <subfield code="a">Oversettere: Ė. Pankratova, A. Sel'nicin</subfield>
          </datafield>
          <datafield ind1="1" ind2=" " tag="700">
            <subfield code="a">Pankratova, Ėleonora</subfield>
            <subfield code="4">trl</subfield>
          </datafield>
          <datafield ind1="1" ind2=" " tag="700">
            <subfield code="a">Sel'nicin, Aleksej Aleksandrovič</subfield>
            <subfield code="4">trl</subfield>
          </datafield>
          <datafield ind1="0" ind2=" " tag="765">
            <subfield code="t">Knut Hamsun : reisen til Hitler</subfield>
            <subfield code="w">991427413704702201</subfield>
            <subfield code="z">978-82-02-41373-6</subfield>
          </datafield>
        </record>
      </recordData>
      <recordIdentifier>999920483787002201</recordIdentifier>
      <recordPosition>1</recordPosition>
    </record>
    <record>
      <recordSchema>marcxml</recordSchema>
      <recordPacking>xml</recordPacking>
      <recordData>
        <record xmlns="http://www.loc.gov/MARC21/slim">
          <leader>01081nam a2200313 u 4500</leader>
          <controlfield tag="001">999920101286002201</controlfield>
          <controlfield tag="005">20230601100836.0</controlfield>
          <controlfield tag="007">ta</controlfield>
          <controlfield tag="008">160415s2016    gw a   |      001 0dger^^</controlfield>
          <datafield ind1=" " ind2=" " tag="020">
            <subfield code="a">978-3-360-01304-0</subfield>
            <subfield code="q">ib.</subfield>
          </datafield>
          <datafield ind1="1" ind2=" " tag="041">
            <subfield code="a">ger</subfield>
            <subfield code="a">nob</subfield>
          </datafield>
          <datafield ind1="1" ind2=" " tag="100">
            <subfield code="a">Rem, Tore</subfield>
            <subfield code="d">1967-</subfield>
            <subfield code="4">aut</subfield>
          </datafield>
          <datafield ind1="1" ind2="0" tag="245">
            <subfield code="a">Knut Hamsun :</subfield>
            <subfield code="b">die Reise zu Hitler</subfield>
            <subfield code="c">Tore Rem ; aus dem Norwegischen von Daniela Stilzebach</subfield>
          </datafield>
          <datafield ind1="1" ind2="1" tag="246">
            <subfield code="i">Originaltittel:</subfield>
            <subfield code="a">Knut Hamsun :</subfield>
            <subfield code="b">reisen til Hitler</subfield>
          </datafield>
          <datafield ind1=" " ind2=" " tag="260">
            <subfield code="a">Berlin</subfield>
            <subfield code="b">Das Neue Berlin</subfield>
            <subfield code="c">2016</subfield>
          </datafield>
          <datafield ind1=" " ind2=" " tag="300">
            <subfield code="a">399 s.</subfield>
            <subfield code="b">ill.</subfield>
            <subfield code="c">25 cm</subfield>
          </datafield>
          <datafield ind1="1" ind2=" " tag="700">
            <subfield code="a">Stilzebach, Daniela</subfield>
            <subfield code="d">1978-</subfield>
            <subfield code="4">trl</subfield>
          </datafield>
          <datafield ind1="0" ind2=" " tag="765">
            <subfield code="t">Knut Hamsun : reisen til Hitler</subfield>
            <subfield code="w">991427413704702201</subfield>
          </datafield>
        </record>
      </recordData>
      <recordIdentifier>999920101286002201</recordIdentifier>
      <recordPosition>2</recordPosition>
    </record>
    <record>
      <recordSchema>marcxml</recordSchema>
      <recordPacking>xml</recordPacking>
      <recordData>
        <record xmlns="http://www.loc.gov/MARC21/slim">
          <leader>01073nam a2200313 u 4500</leader>
          <controlfield tag="001">999920020783302201</controlfield>
          <controlfield tag="005">20230601095158.0</controlfield>
          <controlfield tag="007">ta</controlfield>
          <controlfield tag="008">151204s2015    sw a   |      000 0bswe^^</controlfield>
          <datafield ind1=" " ind2=" " tag="020">
            <subfield code="a">978-917353-823-7</subfield>
            <subfield code="q">ib.</subfield>
          </datafield>
          <datafield ind1="1" ind2=" " tag="041">
            <subfield code="a">swe</subfield>
            <subfield code="h">nob</subfield>
          </datafield>
          <datafield ind1="1" ind2=" " tag="100">
            <subfield code="a">Rem, Tore</subfield>
            <subfield code="d">1967-</subfield>
            <subfield code="4">aut</subfield>
          </datafield>
          <datafield ind1="1" ind2="0" tag="245">
            <subfield code="a">Knut Hamsun och resan till Hitler</subfield>
            <subfield code="c">Tore Rem ; översättning: Ulrika Junker Miranda</subfield>
          </datafield>
          <datafield ind1="1" ind2=" " tag="246">
            <subfield code="i">Originaltittel:</subfield>
            <subfield code="a">Knut Hamsun :</subfield>
            <subfield code="b">reisen til Hitler</subfield>
          </datafield>
          <datafield ind1=" " ind2=" " tag="260">
            <subfield code="a">[Stockholm]</subfield>
            <subfield code="b">Atlantis</subfield>
            <subfield code="c">2015</subfield>
          </datafield>
          <datafield ind1=" " ind2=" " tag="300">
            <subfield code="a">445 s.</subfield>
            <subfield code="b">ill.</subfield>
            <subfield code="c">24 cm</subfield>
          </datafield>
          <datafield ind1="1" ind2=" " tag="700">
            <subfield code="a">Junker Miranda, Ulrika</subfield>
            <subfield code="d">1953-</subfield>
            <subfield code="4">trl</subfield>
          </datafield>
          <datafield ind1="0" ind2=" " tag="765">
            <subfield code="t">Knut Hamsun : reisen til Hitler</subfield>
            <subfield code="w">991427413704702201</subfield>
          </datafield>
        </record>
      </recordData>
      <recordIdentifier>999920020783302201</recordIdentifier>
      <recordPosition>3</recordPosition>
    </record>
    <record>
      <recordSchema>marcxml</recordSchema>
      <recordPacking>xml</recordPacking>
      <recordData>
        <record xmlns="http://www.loc.gov/MARC21/slim">
          <leader>05699cam a2200829 c 4500</leader>
          <controlfield tag="001">991427413704702201</controlfield>
          <controlfield tag="005">20260903181526.0</controlfield>
          <controlfield tag="007">ta</controlfield>
          <controlfield tag="008">150605s2014    no a|||e| ||||00||0bnob|^</controlfield>
          <datafield ind1=" " ind2=" " tag="010">
            <subfield code="a">2015425036</subfield>
          </datafield>
          <datafield ind1=" " ind2=" " tag="020">
            <subfield code="a">978-82-02-41373-6</subfield>
            <subfield code="q">ib.</subfield>
            <subfield code="c">Nkr 449.00</subfield>
          </datafield>
          <datafield ind1="1" ind2=" " tag="100">
            <subfield code="a">Rem, Tore</subfield>
            <subfield code="d">1967-</subfield>
            <subfield code="4">aut</subfield>
          </datafield>
          <datafield ind1="1" ind2="0" tag="245">
            <subfield code="a">Knut Hamsun :</subfield>
            <subfield code="b">reisen til Hitler</subfield>
            <subfield code="c">Tore Rem</subfield>
          </datafield>
          <datafield ind1=" " ind2=" " tag="260">
            <subfield code="a">[Oslo]</subfield>
            <subfield code="b">Cappelen Damm</subfield>
            <subfield code="c">2014</subfield>
          </datafield>
          <datafield ind1=" " ind2=" " tag="300">
            <subfield code="a">395 s.</subfield>
            <subfield code="b">ill.</subfield>
          </datafield>
          <datafield ind1=" " ind2=" " tag="533">
            <subfield code="a">Elektronisk reproduksjon</subfield>
            <subfield code="b">[Norge]</subfield>
            <subfield code="c">Nasjonalbiblioteket Digital</subfield>
            <subfield code="d">2019-08-08</subfield>
          </datafield>
          <datafield ind1="0" ind2=" " tag="767">
            <subfield code="t">Knut Hamsun och resan till Hitler</subfield>
            <subfield code="w">999920020783302201</subfield>
          </datafield>
          <datafield ind1="0" ind2=" " tag="767">
            <subfield code="t">Knut Hamsun : die Reise zu Hitler</subfield>
            <subfield code="w">999920101286002201</subfield>
          </datafield>
          <datafield ind1="0" ind2=" " tag="767">
            <subfield code="t">Knut Hamsun : rejsen til Hitler</subfield>
            <subfield code="w">991518420354702201</subfield>
          </datafield>
          <datafield ind1="0" ind2=" " tag="767">
            <subfield code="t">Knut Gamsun : vizit k Gitleru</subfield>
            <subfield code="w">999920483787002201</subfield>
            <subfield code="z">978-5-89826-512-0</subfield>
          </datafield>
        </record>
      </recordData>
      <recordIdentifier>991427413704702201</recordIdentifier>
      <recordPosition>4</recordPosition>
    </record>
    <record>
      <recordSchema>marcxml</recordSchema>
      <recordPacking>xml</recordPacking>
      <recordData>
        <record xmlns="http://www.loc.gov/MARC21/slim">
          <leader>02309cam a2200493 c 4500</leader>
          <controlfield tag="001">991511623364702201</controlfield>
          <controlfield tag="005">20260903182036.0</controlfield>
          <controlfield tag="007">ta</controlfield>
          <controlfield tag="008">151023s2015    no |||||||||||000|0bnob|^</controlfield>
          <datafield ind1=" " ind2=" " tag="020">
            <subfield code="a">978-82-02-49271-7</subfield>
            <subfield code="q">h.</subfield>
            <subfield code="c">Nkr 199.00</subfield>
          </datafield>
          <datafield ind1="1" ind2=" " tag="100">
            <subfield code="a">Rem, Tore</subfield>
            <subfield code="d">1967-</subfield>
            <subfield code="4">aut</subfield>
          </datafield>
          <datafield ind1="1" ind2="0" tag="245">
            <subfield code="a">Knut Hamsun :</subfield>
            <subfield code="b">reisen til Hitler</subfield>
            <subfield code="c">Tore Rem</subfield>
          </datafield>
          <datafield ind1=" " ind2=" " tag="260">
            <subfield code="a">[Oslo]</subfield>
            <subfield code="b">Cappelen Damm</subfield>
            <subfield code="c">2015</subfield>
          </datafield>
          <datafield ind1=" " ind2=" " tag="300">
            <subfield code="a">395 s.</subfield>
            <subfield code="b">ill.</subfield>
          </datafield>
          <datafield ind1=" " ind2=" " tag="500">
            <subfield code="a">1. utg. 2014</subfield>
          </datafield>
          <datafield ind1=" " ind2=" " tag="533">
            <subfield code="a">Elektronisk reproduksjon</subfield>
            <subfield code="b">[Norge]</subfield>
            <subfield code="c">Nasjonalbiblioteket Digital</subfield>
            <subfield code="d">2019-07-24</subfield>
          </datafield>
        </record>
      </recordData>
      <recordIdentifier>991511623364702201</recordIdentifier>
      <recordPosition>5</recordPosition>
    </record>
    <record>
      <recordSchema>marcxml</recordSchema>
      <recordPacking>xml</recordPacking>
      <recordData>
        <record xmlns="http://www.loc.gov/MARC21/slim">
          <leader>04457cim a2200793 c 4500</leader>
          <controlfield tag="001">999921211625802201</controlfield>
          <controlfield tag="005">20260926060402.0</controlfield>
          <controlfield tag="007">cr nna||||||||</controlfield>
          <controlfield tag="008">200814s2020    no ||||eo|||||||| | nob|^</controlfield>
          <datafield ind1=" " ind2=" " tag="020">
            <subfield code="a">9788202689193</subfield>
          </datafield>
          <datafield ind1="1" ind2=" " tag="100">
            <subfield code="a">Rem, Tore</subfield>
            <subfield code="d">1967-</subfield>
            <subfield code="4">aut</subfield>
            <subfield code="4">nrt</subfield>
          </datafield>
          <datafield ind1="1" ind2="0" tag="240">
            <subfield code="a">Knut Hamsun</subfield>
          </datafield>
          <datafield ind1="1" ind2="0" tag="245">
            <subfield code="a">Knut Hamsun</subfield>
            <subfield code="b">reisen til Hitler</subfield>
            <subfield code="c">Tore Rem</subfield>
          </datafield>
          <datafield ind1=" " ind2="1" tag="264">
            <subfield code="a">Oslo</subfield>
            <subfield code="b">Cappelen Damm</subfield>
            <subfield code="c">2020</subfield>
          </datafield>
          <datafield ind1=" " ind2=" " tag="300">
            <subfield code="a">1 lydfil (11 t, 51 min)</subfield>
          </datafield>
          <datafield ind1=" " ind2=" " tag="306">
            <subfield code="a">115100</subfield>
          </datafield>
          <datafield ind1=" " ind2=" " tag="338">
            <subfield code="a">online (nettilkoblet) ressurs</subfield>
            <subfield code="2">rdact</subfield>
          </datafield>
          <datafield ind1="0" ind2=" " tag="511">
            <subfield code="a">Lest av forfatteren</subfield>
          </datafield>
          <datafield ind1=" " ind2=" " tag="500">
            <subfield code="a">Nedlastbar e-lydbok. WMA med DRM</subfield>
          </datafield>
          <datafield ind1="1" ind2=" " tag="700">
            <subfield code="a">Rem, Tore</subfield>
            <subfield code="d">1967-</subfield>
            <subfield code="t">Knut Hamsun</subfield>
          </datafield>
          <datafield ind1=" " ind2=" " tag="758">
            <subfield code="i">Verksid:</subfield>
            <subfield code="a">Knut Hamsun</subfield>
            <subfield code="2">bibbi</subfield>
          </datafield>
          <datafield ind1=" " ind2=" " tag="758">
            <subfield code="i">Verksid:</subfield>
            <subfield code="a">Knut Hamsun</subfield>
            <subfield code="2">bokbasen</subfield>
          </datafield>
        </record>
      </recordData>
      <recordIdentifier>999921211625802201</recordIdentifier>
      <recordPosition>6</recordPosition>
    </record>
    <record>
      <recordSchema>marcxml</recordSchema>
      <recordPacking>xml</recordPacking>
      <recordData>
        <record xmlns="http://www.loc.gov/MARC21/slim">
          <leader>01089cam a2200325 c 4500</leader>
          <controlfield tag="001">991518420354702201</controlfield>
          <controlfield tag="005">20230601075659.0</controlfield>
          <controlfield tag="007">ta</controlfield>
          <controlfield tag="008">151030s2015    dk a||||||||||001|0bdan|^</controlfield>
          <datafield ind1=" " ind2=" " tag="020">
            <subfield code="a">978-87-992026-7-6</subfield>
            <subfield code="q">ib.</subfield>
          </datafield>
          <datafield ind1="1" ind2=" " tag="041">
            <subfield code="a">dan</subfield>
            <subfield code="h">nob</subfield>
          </datafield>
          <datafield ind1="1" ind2=" " tag="100">
            <subfield code="a">Rem, Tore</subfield>
            <subfield code="d">1967-</subfield>
            <subfield code="4">aut</subfield>
          </datafield>
          <datafield ind1="1" ind2="0" tag="245">
            <subfield code="a">Knut Hamsun :</subfield>
            <subfield code="b">rejsen til Hitler</subfield>
            <subfield code="c">Tore Rem ; oversat af Arko Højholt</subfield>
          </datafield>
          <datafield ind1="1" ind2=" " tag="246">
            <subfield code="i">Originaltittel:</subfield>
            <subfield code="a">Knut Hamsun :</subfield>
            <subfield code="b">reisen til Hitler</subfield>
          </datafield>
          <datafield ind1=" " ind2=" " tag="260">
            <subfield code="b">Vild Maskine</subfield>
            <subfield code="c">2015</subfield>
            <subfield code="a">[Vordingborg]</subfield>
          </datafield>
          <datafield ind1=" " ind2=" " tag="300">
            <subfield code="a">399 s.</subfield>
            <subfield code="b">ill. (noen kol.)</subfield>
            <subfield code="c">23 cm</subfield>
          </datafield>
          <datafield ind1="1" ind2=" " tag="700">
            <subfield code="a">Højholt, Arko</subfield>
            <subfield code="4">trl</subfield>
          </datafield>
          <datafield ind1="0" ind2=" " tag="765">
            <subfield code="t">Knut Hamsun</subfield>
            <subfield code="w">991427413704702201</subfield>
          </datafield>
        </record>
      </recordData>
      <recordIdentifier>991518420354702201</recordIdentifier>
      <recordPosition>7</recordPosition>
    </record>
  </records>
  <extraResponseData xmlns:xb="http://www.exlibris.com/repository/search/xmlbeans/">
    <xb:exact>true</xb:exact>
    <xb:responseDate>2026-09-27T22:25:00+0200</xb:responseDate>
  </extraResponseData>
</searchRetrieveResponse>"####;

/// Alma (Sikt), a query with brackets, which it does not accept.
pub const ALMA_INVALID: &str = r####"<?xml version="1.0" encoding="UTF-8" standalone="no"?><searchRetrieveResponse xmlns="http://www.loc.gov/zing/srw/" xmlns:diag="http://www.loc.gov/zing/srw/diagnostic/">
  <version>1.2</version>
  <diagnostics>
    <diag:diagnostic>
      <diag:uri>200812</diag:uri>
      <diag:message>Invalid query</diag:message>
    </diag:diagnostic>
  </diagnostics>
</searchRetrieveResponse>"####;

/// Library of Congress, bath.isbn=9780674033801 or bath.isbn=0674033809, with startRecord=1.
pub const LOC_HARRIS: &str = r####"<?xml version="1.0"?>
<zs:searchRetrieveResponse xmlns:zs="http://www.loc.gov/zing/srw/"><zs:version>1.1</zs:version><zs:numberOfRecords>1</zs:numberOfRecords><zs:records><zs:record><zs:recordSchema>marcxml</zs:recordSchema><zs:recordPacking>xml</zs:recordPacking><zs:recordData><record xmlns="http://www.loc.gov/MARC21/slim">
  <leader>01233pam a2200373 a 4500</leader>
  <controlfield tag="001">563048</controlfield>
  <controlfield tag="005">20250607223211.4</controlfield>
  <controlfield tag="008">890412s1989    mau      b    001 0 eng  </controlfield>
  <datafield tag="010" ind1=" " ind2=" ">
    <subfield code="a">   89007588 </subfield>
  </datafield>
  <datafield tag="020" ind1=" " ind2=" ">
    <subfield code="a">0674033809</subfield>
    <subfield code="q">alk. paper</subfield>
  </datafield>
  <datafield tag="020" ind1=" " ind2=" ">
    <subfield code="a">9780674033801</subfield>
    <subfield code="q">(alk. paper)</subfield>
  </datafield>
  <datafield tag="100" ind1="1" ind2=" ">
    <subfield code="a">Harris, William V.</subfield>
    <subfield code="q">(William Vernon)</subfield>
  </datafield>
  <datafield tag="245" ind1="1" ind2="0">
    <subfield code="a">Ancient literacy /</subfield>
    <subfield code="c">William V. Harris.</subfield>
  </datafield>
  <datafield tag="260" ind1=" " ind2=" ">
    <subfield code="a">Cambridge, Mass. :</subfield>
    <subfield code="b">Harvard University Press,</subfield>
    <subfield code="c">1989.</subfield>
  </datafield>
  <datafield tag="300" ind1=" " ind2=" ">
    <subfield code="a">xv, 383 p. ;</subfield>
    <subfield code="c">25 cm.</subfield>
  </datafield>
  <datafield tag="338" ind1=" " ind2=" ">
    <subfield code="a">volume</subfield>
    <subfield code="b">nc</subfield>
    <subfield code="2">rdacarrier</subfield>
  </datafield>
  <datafield tag="500" ind1=" " ind2=" ">
    <subfield code="a">Includes index.</subfield>
  </datafield>
  <datafield tag="504" ind1=" " ind2=" ">
    <subfield code="a">Bibliography: p. 339-369.</subfield>
  </datafield>
</record></zs:recordData><zs:recordPosition>1</zs:recordPosition></zs:record></zs:records><zs:echoedSearchRetrieveRequest><zs:version>1.1</zs:version><zs:query>bath.isbn=9780674033801 or bath.isbn=0674033809</zs:query><zs:startRecord>1</zs:startRecord><zs:maximumRecords>5</zs:maximumRecords><zs:recordPacking>xml</zs:recordPacking><zs:recordSchema>marcxml</zs:recordSchema></zs:echoedSearchRetrieveRequest></zs:searchRetrieveResponse>"####;

/// Library of Congress, bath.isbn=9780674033818 or bath.isbn=0674033817: the paperback, which it does not hold.
pub const LOC_NOTHING: &str = r####"<?xml version="1.0"?>
<zs:searchRetrieveResponse xmlns:zs="http://www.loc.gov/zing/srw/"><zs:version>1.1</zs:version><zs:numberOfRecords>0</zs:numberOfRecords><zs:echoedSearchRetrieveRequest><zs:version>1.1</zs:version><zs:query>bath.isbn=9780674033818 or bath.isbn=0674033817</zs:query><zs:startRecord>1</zs:startRecord><zs:maximumRecords>5</zs:maximumRecords><zs:recordPacking>xml</zs:recordPacking><zs:recordSchema>marcxml</zs:recordSchema></zs:echoedSearchRetrieveRequest></zs:searchRetrieveResponse>"####;

/// Library of Congress, bath.isbn=0674033809 without startRecord, as answered at 13:35 UTC during the
/// research: HTTP 200, one record counted and none given.
pub const LOC_DIAGNOSTIC: &str = r####"<?xml version="1.0"?>
<zs:searchRetrieveResponse xmlns:zs="http://www.loc.gov/zing/srw/"><zs:version>1.1</zs:version><zs:numberOfRecords>1</zs:numberOfRecords><zs:echoedSearchRetrieveRequest><zs:version>1.1</zs:version><zs:query>bath.isbn=0674033809</zs:query><zs:maximumRecords>1</zs:maximumRecords><zs:recordPacking>xml</zs:recordPacking><zs:recordSchema>marcxml</zs:recordSchema></zs:echoedSearchRetrieveRequest><zs:diagnostics xmlns:diag="http://www.loc.gov/zing/srw/diagnostic/"><diag:diagnostic><diag:uri>info:srw/diagnostic/1/61</diag:uri><diag:details></diag:details><diag:message>First record position out of range</diag:message></diag:diagnostic></zs:diagnostics></zs:searchRetrieveResponse>"####;

/// arXiv, id_list=1706.03762.
pub const ARXIV_ONE: &str = r####"<?xml version='1.0' encoding='UTF-8'?>
<feed xmlns:opensearch="http://a9.com/-/spec/opensearch/1.1/" xmlns:arxiv="http://arxiv.org/schemas/atom" xmlns="http://www.w3.org/2005/Atom">
  <id>https://arxiv.org/api/zUwBFJ+vAUSpXAR7QFveSY/bZos</id>
  <title>arXiv Query: search_query=&amp;id_list=1706.03762&amp;start=0&amp;max_results=10</title>
  <updated>2026-09-27T20:12:40Z</updated>
  <link href="https://arxiv.org/api/query?search_query=&amp;start=0&amp;max_results=10&amp;id_list=1706.03762" type="application/atom+xml"/>
  <opensearch:itemsPerPage>10</opensearch:itemsPerPage>
  <opensearch:totalResults>1</opensearch:totalResults>
  <opensearch:startIndex>0</opensearch:startIndex>
  <entry>
    <id>http://arxiv.org/abs/1706.03762v7</id>
    <title>Attention Is All You Need</title>
    <updated>2023-08-02T00:41:18Z</updated>
    <link href="https://arxiv.org/abs/1706.03762v7" rel="alternate" type="text/html"/>
    <link href="https://arxiv.org/pdf/1706.03762v7" rel="related" type="application/pdf" title="pdf"/>
    <summary>The dominant sequence transduction models are based on complex recurrent or convolutional neural networks in an encoder-decoder configuration. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train. Our model achieves 28.4 BLEU on the WMT 2014 English-to-German translation task, improving over the existing best results, including ensembles by over 2 BLEU. On the WMT 2014 English-to-French translation task, our model establishes a new single-model state-of-the-art BLEU score of 41.8 after training for 3.5 days on eight GPUs, a small fraction of the training costs of the best models from the literature. We show that the Transformer generalizes well to other tasks by applying it successfully to English constituency parsing both with large and limited training data.</summary>
    <category term="cs.CL" scheme="http://arxiv.org/schemas/atom"/>
    <category term="cs.LG" scheme="http://arxiv.org/schemas/atom"/>
    <published>2017-06-12T17:57:34Z</published>
    <arxiv:comment>15 pages, 5 figures</arxiv:comment>
    <arxiv:primary_category term="cs.CL"/>
    <author>
      <name>Ashish Vaswani</name>
    </author>
    <author>
      <name>Noam Shazeer</name>
    </author>
    <author>
      <name>Niki Parmar</name>
    </author>
    <author>
      <name>Jakob Uszkoreit</name>
    </author>
    <author>
      <name>Llion Jones</name>
    </author>
    <author>
      <name>Aidan N. Gomez</name>
    </author>
    <author>
      <name>Lukasz Kaiser</name>
    </author>
    <author>
      <name>Illia Polosukhin</name>
    </author>
  </entry>
</feed>"####;

/// arXiv, search_query=ti:"digital humanities", max_results=2.
pub const ARXIV_TWO: &str = r####"<?xml version='1.0' encoding='UTF-8'?>
<feed xmlns:opensearch="http://a9.com/-/spec/opensearch/1.1/" xmlns:arxiv="http://arxiv.org/schemas/atom" xmlns="http://www.w3.org/2005/Atom">
  <id>https://arxiv.org/api/BjRahT9F0TOf63WdyWpOIpt0L/w</id>
  <title>arXiv Query: search_query=ti:"digital humanities"&amp;id_list=&amp;start=0&amp;max_results=2</title>
  <updated>2026-09-27T20:25:16Z</updated>
  <link href="https://arxiv.org/api/query?search_query=ti:%22digital+humanities%22&amp;start=0&amp;max_results=2&amp;id_list=" type="application/atom+xml"/>
  <opensearch:itemsPerPage>2</opensearch:itemsPerPage>
  <opensearch:totalResults>99</opensearch:totalResults>
  <opensearch:startIndex>0</opensearch:startIndex>
  <entry>
    <id>http://arxiv.org/abs/2406.15374v1</id>
    <title>Hybrid Intelligence for Digital Humanities</title>
    <updated>2024-04-15T13:30:47Z</updated>
    <link href="https://arxiv.org/abs/2406.15374v1" rel="alternate" type="text/html"/>
    <link href="https://arxiv.org/pdf/2406.15374v1" rel="related" type="application/pdf" title="pdf"/>
    <summary>In this paper, we explore the synergies between Digital Humanities (DH) as a discipline and Hybrid Intelligence (HI) as a research paradigm. In DH research, the use of digital methods and specifically that of Artificial Intelligence is subject to a set of requirements and constraints. We argue that these are well-supported by the capabilities and goals of HI. Our contribution includes the identification of five such DH requirements: Successful AI systems need to be able to 1) collaborate with the (human) scholar; 2) support data criticism; 3) support tool criticism; 4) be aware of and cater to various perspectives and 5) support distant and close reading. We take the CARE principles of Hybrid Intelligence (collaborative, adaptive, responsible and explainable) as theoretical framework and map these to the DH requirements. In this mapping, we include example research projects. We finally address how insights from DH can be applied to HI and discuss open challenges for the combination of the two disciplines.</summary>
    <category term="cs.CY" scheme="http://arxiv.org/schemas/atom"/>
    <category term="cs.AI" scheme="http://arxiv.org/schemas/atom"/>
    <published>2024-04-15T13:30:47Z</published>
    <arxiv:comment>Preprint for paper accepted for HHAI2024 conference</arxiv:comment>
    <arxiv:primary_category term="cs.CY"/>
    <author>
      <name>Victor de Boer</name>
    </author>
    <author>
      <name>Lise Stork</name>
    </author>
  </entry>
  <entry>
    <id>http://arxiv.org/abs/2012.02454v1</id>
    <title>Data Lakes for Digital Humanities</title>
    <updated>2020-12-04T08:18:48Z</updated>
    <link href="https://arxiv.org/abs/2012.02454v1" rel="alternate" type="text/html"/>
    <link href="https://arxiv.org/pdf/2012.02454v1" rel="related" type="application/pdf" title="pdf"/>
    <summary>Traditional data in Digital Humanities projects bear various formats (structured, semi-structured, textual) and need substantial transformations (encoding and tagging, stemming, lemmatization, etc.) to be managed and analyzed. To fully master this process, we propose the use of data lakes as a solution to data siloing and big data variety problems. We describe data lake projects we currently run in close collaboration with researchers in humanities and social sciences and discuss the lessons learned running these projects.</summary>
    <category term="cs.DB" scheme="http://arxiv.org/schemas/atom"/>
    <published>2020-12-04T08:18:48Z</published>
    <arxiv:comment>Data and Digital Humanities Track</arxiv:comment>
    <arxiv:primary_category term="cs.DB"/>
    <arxiv:journal_ref>2nd International Digital Tools &amp; Uses Congress (DTUC 2020), Oct 2020, Hammamet, Tunisia. pp.38-41</arxiv:journal_ref>
    <author>
      <name>Jérôme Darmont</name>
      <arxiv:affiliation>ERIC</arxiv:affiliation>
    </author>
    <author>
      <name>Cécile Favre</name>
      <arxiv:affiliation>ERIC</arxiv:affiliation>
    </author>
    <author>
      <name>Sabine Loudcher</name>
      <arxiv:affiliation>ERIC</arxiv:affiliation>
    </author>
    <author>
      <name>Camille Noûs</name>
    </author>
    <arxiv:doi>10.1145/3423603.3424004</arxiv:doi>
    <link rel="related" href="https://doi.org/10.1145/3423603.3424004" title="doi"/>
  </entry>
</feed>"####;

/// arXiv, id_list=0704.9999, which does not exist.
pub const ARXIV_NONE: &str = r####"<?xml version='1.0' encoding='UTF-8'?>
<feed xmlns:opensearch="http://a9.com/-/spec/opensearch/1.1/" xmlns:arxiv="http://arxiv.org/schemas/atom" xmlns="http://www.w3.org/2005/Atom">
  <id>https://arxiv.org/api/Gidfg8pZAvN99sc5eXmviIt+6M8</id>
  <title>arXiv Query: search_query=&amp;id_list=0704.9999&amp;start=0&amp;max_results=10</title>
  <updated>2026-09-27T20:25:21Z</updated>
  <link href="https://arxiv.org/api/query?search_query=&amp;start=0&amp;max_results=10&amp;id_list=0704.9999" type="application/atom+xml"/>
  <opensearch:itemsPerPage>10</opensearch:itemsPerPage>
  <opensearch:totalResults>0</opensearch:totalResults>
  <opensearch:startIndex>0</opensearch:startIndex>
</feed>"####;

/// PubMed efetch, 19008416.
pub const PUBMED: &str = r####"<?xml version="1.0" ?>
<!DOCTYPE PubmedArticleSet PUBLIC "-//NLM//DTD PubMedArticle, 1st January 2025//EN" "https://dtd.nlm.nih.gov/ncbi/pubmed/out/pubmed_250101.dtd">
<PubmedArticleSet>
<PubmedArticle><MedlineCitation Status="MEDLINE" Owner="NLM" IndexingMethod="Manual"><PMID Version="1">19008416</PMID><DateCompleted><Year>2009</Year><Month>01</Month><Day>05</Day></DateCompleted><DateRevised><Year>2025</Year><Month>05</Month><Day>29</Day></DateRevised><Article PubModel="Print-Electronic"><Journal><ISSN IssnType="Electronic">1095-9203</ISSN><JournalIssue CitedMedium="Internet"><Volume>322</Volume><Issue>5908</Issue><PubDate><Year>2008</Year><Month>Dec</Month><Day>12</Day></PubDate></JournalIssue><Title>Science (New York, N.Y.)</Title><ISOAbbreviation>Science</ISOAbbreviation></Journal><ArticleTitle>Genomic loss of microRNA-101 leads to overexpression of histone methyltransferase EZH2 in cancer.</ArticleTitle><Pagination><StartPage>1695</StartPage><EndPage>1699</EndPage><MedlinePgn>1695-9</MedlinePgn></Pagination><ELocationID EIdType="doi" ValidYN="Y">10.1126/science.1165395</ELocationID><Abstract><AbstractText>Enhancer of zeste homolog 2 (EZH2) is a mammalian histone methyltransferase that contributes to the epigenetic silencing of target genes and regulates the survival and metastasis of cancer cells. EZH2 is overexpressed in aggressive solid tumors by mechanisms that remain unclear. Here we show that the expression and function of EZH2 in cancer cell lines are inhibited by microRNA-101 (miR-101). Analysis of human prostate tumors revealed that miR-101 expression decreases during cancer progression, paralleling an increase in EZH2 expression. One or both of the two genomic loci encoding miR-101 were somatically lost in 37.5% of clinically localized prostate cancer cells (6 of 16) and 66.7% of metastatic disease cells (22 of 33). We propose that the genomic loss of miR-101 in cancer leads to overexpression of EZH2 and concomitant dysregulation of epigenetic pathways, resulting in cancer progression.</AbstractText></Abstract><AuthorList CompleteYN="Y"><Author ValidYN="Y"><LastName>Varambally</LastName><ForeName>Sooryanarayana</ForeName><Initials>S</Initials></Author><Author ValidYN="Y"><LastName>Cao</LastName><ForeName>Qi</ForeName><Initials>Q</Initials></Author><Author ValidYN="Y"><LastName>Mani</LastName><ForeName>Ram-Shankar</ForeName><Initials>RS</Initials></Author><Author ValidYN="Y"><LastName>Shankar</LastName><ForeName>Sunita</ForeName><Initials>S</Initials></Author><Author ValidYN="Y"><LastName>Wang</LastName><ForeName>Xiaosong</ForeName><Initials>X</Initials></Author><Author ValidYN="Y"><LastName>Ateeq</LastName><ForeName>Bushra</ForeName><Initials>B</Initials></Author><Author ValidYN="Y"><LastName>Laxman</LastName><ForeName>Bharathi</ForeName><Initials>B</Initials></Author><Author ValidYN="Y"><LastName>Cao</LastName><ForeName>Xuhong</ForeName><Initials>X</Initials></Author><Author ValidYN="Y"><LastName>Jing</LastName><ForeName>Xiaojun</ForeName><Initials>X</Initials></Author><Author ValidYN="Y"><LastName>Ramnarayanan</LastName><ForeName>Kalpana</ForeName><Initials>K</Initials></Author><Author ValidYN="Y"><LastName>Brenner</LastName><ForeName>J Chad</ForeName><Initials>JC</Initials></Author><Author ValidYN="Y"><LastName>Yu</LastName><ForeName>Jindan</ForeName><Initials>J</Initials></Author><Author ValidYN="Y"><LastName>Kim</LastName><ForeName>Jung H</ForeName><Initials>JH</Initials></Author><Author ValidYN="Y"><LastName>Han</LastName><ForeName>Bo</ForeName><Initials>B</Initials></Author><Author ValidYN="Y"><LastName>Tan</LastName><ForeName>Patrick</ForeName><Initials>P</Initials></Author><Author ValidYN="Y"><LastName>Kumar-Sinha</LastName><ForeName>Chandan</ForeName><Initials>C</Initials></Author><Author ValidYN="Y"><LastName>Lonigro</LastName><ForeName>Robert J</ForeName><Initials>RJ</Initials></Author><Author ValidYN="Y"><LastName>Palanisamy</LastName><ForeName>Nallasivam</ForeName><Initials>N</Initials></Author><Author ValidYN="Y"><LastName>Maher</LastName><ForeName>Christopher A</ForeName><Initials>CA</Initials></Author><Author ValidYN="Y"><LastName>Chinnaiyan</LastName><ForeName>Arul M</ForeName><Initials>AM</Initials></Author></AuthorList><Language>eng</Language><PublicationTypeList><PublicationType UI="D016428">Journal Article</PublicationType><PublicationType UI="D052061">Research Support, N.I.H., Extramural</PublicationType><PublicationType UI="D013485">Research Support, Non-U.S. Gov't</PublicationType><PublicationType UI="D013486">Research Support, U.S. Gov't, Non-P.H.S.</PublicationType></PublicationTypeList><ArticleDate DateType="Electronic"><Year>2008</Year><Month>11</Month><Day>13</Day></ArticleDate></Article><MedlineJournalInfo><Country>United States</Country><MedlineTA>Science</MedlineTA><NlmUniqueID>0404511</NlmUniqueID><ISSNLinking>0036-8075</ISSNLinking></MedlineJournalInfo><CitationSubset>IM</CitationSubset></MedlineCitation><PubmedData><PublicationStatus>ppublish</PublicationStatus><ArticleIdList><ArticleId IdType="pubmed">19008416</ArticleId><ArticleId IdType="mid">NIHMS104414</ArticleId><ArticleId IdType="pmc">PMC2684823</ArticleId><ArticleId IdType="doi">10.1126/science.1165395</ArticleId><ArticleId IdType="pii">1165395</ArticleId></ArticleIdList></PubmedData></PubmedArticle></PubmedArticleSet>"####;
