// Before the tests of the interface: the words of Norwegian, which the
// application loads when the language is first spoken (src/lib/i18n), are
// loaded, so that a test may turn to it at once.
import { load } from '$lib/i18n';

await load('nb');
