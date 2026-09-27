# 0001 — Tauri 2, a Rust core, a Svelte 5 interface

Date: 2026-09-27. Status: accepted.

## Context

The application is a Linux desktop program first; macOS and Windows are wanted.
It needs rich-text editing with embedded citations and footnotes, a zoomable
canvas, simultaneous editing, and careful data handling for a reference library.
The owner prefers Rust and Svelte and does not want a bundled browser engine.

## Decision

Tauri 2 as the shell, using the system webview. All data work in a Rust crate
(`glaukopis-core`) that does not depend on Tauri. The interface in Svelte 5 with
TypeScript, built by Vite, managed with pnpm. Types shared between the two sides
are written by hand in `src/lib/api/`, one file per area, mirroring the Rust
structs; there is no code generator in the build.

## Consequences

- One code base for three platforms; the webview differs per platform, so
  layout must be checked on WebKit in particular.
- The core can be tested, and used from the command line, without a window.
- Hand-written types can drift from the Rust side. Each command has a test on
  the Rust side that serialises its result, and the TypeScript types are kept
  next to the wrapper that calls it.
