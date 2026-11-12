import { describe, expect, it } from 'vitest';
import { citationWritten, entriesWritten } from './written';

// What Pandoc writes, as the core hands it over: see `style_written`.
const AUTHOR_DATE = `<div id="gk-sample-1">
<p><span class="citation" data-cites="nagy1979">(Nagy 1979)</span></p>
</div>
<div id="gk-sample-2">
<p><span class="citation" data-cites="west1988">(West 1988)</span></p>
</div>
<div id="refs" class="references csl-bib-body hanging-indent" role="list">
<div id="ref-nagy1979" class="csl-entry" role="listitem">
Nagy, Gregory. 1979. <em>The Best of the <span>Achaeans</span></em>. Johns Hopkins University Press.
</div>
<div id="ref-west1988" class="csl-entry" role="listitem">
West, M. L. 1988. <span>‘The Rise of the <span>Greek</span> Epic’</span>. <em>Journal of Hellenic Studies</em> 108: 151–72.
</div>
</div>`;

const NUMBERED = `<div id="gk-sample-1">
<p><span class="citation" data-cites="nagy1979">[1]</span></p>
</div>
<div id="refs" class="references csl-bib-body" data-entry-spacing="0" role="list">
<div id="ref-nagy1979" class="csl-entry" role="listitem">
<div class="csl-left-margin">[1] </div><div class="csl-right-inline">G. Nagy, <em>The best of the <span>Achaeans</span></em>. Baltimore: Johns Hopkins University Press, 1979.</div>
</div>
</div>`;

const NOTE = `<div id="gk-sample-1">
<p><span class="citation" data-cites="nagy1979"><span class="gk-note">Gregory Nagy, <em>The Best of the <span>Achaeans</span></em> (Johns Hopkins University Press, 1979), 45.</span></span></p>
</div>
<div id="refs" class="references csl-bib-body hanging-indent" role="list">
</div>`;

const NAMED_WITH_NOTE = `<div id="gk-sample-1">
<p><span class="citation" data-cites="nagy1979">Gregory Nagy<span class="gk-note"><em>The Best of the <span>Achaeans</span></em> (Johns Hopkins University Press, 1979).</span></span></p>
</div>
<div id="refs" class="references csl-bib-body hanging-indent" role="list"></div>`;

describe('what a style wrote, read for the clipboard', () => {
  it('reads the works as the entries of the bibliography, a line and a paragraph each', () => {
    const written = entriesWritten(AUTHOR_DATE)!;
    expect(written.text).toBe(
      'Nagy, Gregory. 1979. The Best of the Achaeans. Johns Hopkins University Press.\n' +
        'West, M. L. 1988. ‘The Rise of the Greek Epic’. Journal of Hellenic Studies 108: 151–72.',
    );
    expect(written.html).toBe(
      '<p>Nagy, Gregory. 1979. <em>The Best of the Achaeans</em>. Johns Hopkins University Press.</p>' +
        '<p>West, M. L. 1988. ‘The Rise of the Greek Epic’. <em>Journal of Hellenic Studies</em> 108: 151–72.</p>',
    );
  });

  it('keeps the number of an entry beside what it numbers', () => {
    const written = entriesWritten(NUMBERED)!;
    expect(written.text).toBe(
      '[1] G. Nagy, The best of the Achaeans. Baltimore: Johns Hopkins University Press, 1979.',
    );
    expect(written.html.startsWith('<p>[1] G. Nagy, <em>The best of the Achaeans</em>.')).toBe(
      true,
    );
  });

  it('reads the works as they are first cited where the style has no bibliography', () => {
    const written = entriesWritten(NOTE)!;
    expect(written.text).toBe(
      'Gregory Nagy, The Best of the Achaeans (Johns Hopkins University Press, 1979), 45.',
    );
    expect(entriesWritten('<div id="refs"></div>')).toBeNull();
  });

  it('reads a citation in the line, and says in its HTML which citation it is', () => {
    const said = { items: [{ id: 'r1', locator: '45' }], mode: 'normal' as const };
    const written = citationWritten(AUTHOR_DATE, said)!;
    expect(written.text).toBe('(Nagy 1979)');
    const holder = document.createElement('div');
    holder.innerHTML = written.html;
    const span = holder.querySelector('span.citation')!;
    expect(span.textContent).toBe('(Nagy 1979)');
    expect(JSON.parse(span.getAttribute('data-citation')!)).toEqual(said.items);
    expect(span.getAttribute('data-mode')).toBe('normal');
    expect(citationWritten('<div id="refs"></div>', said)).toBeNull();
  });

  it('reads a citation that is a note as the note, and a note beside a name in brackets', () => {
    const said = { items: [{ id: 'r1' }], mode: 'normal' as const };
    const note = citationWritten(NOTE, said)!;
    expect(note.text).toBe(
      'Gregory Nagy, The Best of the Achaeans (Johns Hopkins University Press, 1979), 45.',
    );
    expect(note.html).toContain('<em>The Best of the Achaeans</em>');
    const named = citationWritten(NAMED_WITH_NOTE, { ...said, mode: 'intext' })!;
    expect(named.text).toBe(
      'Gregory Nagy [The Best of the Achaeans (Johns Hopkins University Press, 1979).]',
    );
  });

  it('carries nothing but what type can look like', () => {
    const html = `<div id="refs"><div class="csl-entry">A <span class="smallcaps">Name</span>, <a href="https://example.org" onclick="x()">a link</a><script>alert(1)</script> <sup>2</sup><img src="x" onerror="x()"></div></div>`;
    const written = entriesWritten(html)!;
    expect(written.html).toBe(
      '<p>A <span style="font-variant: small-caps">Name</span>, a link <sup>2</sup></p>',
    );
    expect(written.text).toBe('A Name, a link 2');
  });
});
