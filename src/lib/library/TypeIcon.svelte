<script lang="ts">
  import Book from '@lucide/svelte/icons/book';
  import BookCopy from '@lucide/svelte/icons/book-copy';
  import BookOpenText from '@lucide/svelte/icons/book-open-text';
  import FileText from '@lucide/svelte/icons/file-text';
  import Globe from '@lucide/svelte/icons/globe';
  import GraduationCap from '@lucide/svelte/icons/graduation-cap';
  import Mail from '@lucide/svelte/icons/mail';
  import Newspaper from '@lucide/svelte/icons/newspaper';
  import Presentation from '@lucide/svelte/icons/presentation';
  import ScrollText from '@lucide/svelte/icons/scroll-text';
  import { tooltip } from '$lib/ui/tooltip';
  import { typeLabel } from './schema';

  let { type, size = 15 }: { type: string; size?: number } = $props();

  const Icon = $derived.by(() => {
    switch (type) {
      case 'book':
      case 'mvbook':
      case 'commentary':
      case 'booklet':
      case 'manual':
        return Book;
      case 'collection':
      case 'mvcollection':
      case 'reference':
      case 'proceedings':
      case 'periodical':
        return BookCopy;
      case 'incollection':
      case 'inbook':
      case 'bookinbook':
      case 'suppbook':
      case 'inreference':
        return BookOpenText;
      case 'article':
      case 'review':
        return Newspaper;
      case 'thesis':
        return GraduationCap;
      case 'inproceedings':
        return Presentation;
      case 'online':
        return Globe;
      case 'letter':
        return Mail;
      case 'misc':
      case 'unpublished':
        return ScrollText;
      default:
        return FileText;
    }
  });
</script>

<span class="type-icon" use:tooltip={typeLabel(type)}><Icon {size} strokeWidth={1.6} /></span>

<style>
  .type-icon {
    display: inline-flex;
    color: var(--ink-3);
    flex: none;
  }
</style>
