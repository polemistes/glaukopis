<script lang="ts">
  /** The owl's eyes: the mark of the application. */
  let { size = 24 }: { size?: number } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 1024 1024" aria-hidden="true">
  <rect x="64" y="64" width="896" height="896" rx="208" fill="#31545700" />
  <rect x="64" y="64" width="896" height="896" rx="208" class="ground" />
  <path
    d="M196 372 C 300 300, 430 330, 512 452 C 594 330, 724 300, 828 372"
    fill="none"
    stroke="#e9f0ee"
    stroke-width="40"
    stroke-linecap="round"
  />
  <circle cx="346" cy="560" r="150" fill="#e9f0ee" />
  <circle cx="346" cy="560" r="112" fill="#d9a441" />
  <circle cx="346" cy="560" r="58" fill="#1b2a2c" />
  <circle cx="678" cy="560" r="150" fill="#e9f0ee" />
  <circle cx="678" cy="560" r="112" fill="#d9a441" />
  <circle cx="678" cy="560" r="58" fill="#1b2a2c" />
  <path d="M512 610 L 470 700 Q 512 790 554 700 Z" fill="#d39a36" />
</svg>

<style>
  .ground {
    fill: #325558;
  }
</style>
