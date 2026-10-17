# 0049 — The compositor of WebKitGTK on Linux: the previous one, until the new one shows no stale frames

Date: 2026-10-17. Status: accepted by the owner on 2026-10-17.

## Context

Menus of Glaukopis flickered when they opened: a menu seemed to open, close and open again a few times before it stood still, and other changes of the display flickered a little too. The owner saw it on Hyprland on Wayland, with AMD graphics and WebKitGTK 2.54.1.

The page does nothing of the kind. A menu is rendered once, moved into the top layer as a popover, placed and focused, all within one flush of Svelte, between which the browser cannot paint. Run off-screen with observers on the menu's nodes, its popover state, its animation and the focus, and with its opacity and place sampled every frame, the application added the menu once, showed it once, faded it in once over 120 ms, kept it at one place, and removed it only when Escape was pressed.

WebKitGTK 2.54, released in September 2026, composites the page with Skia where the releases before used TextureMapper, and composites by damage by default. Another application made with Tauri reported the same on Hyprland the week before: the Skia compositor showed stale frames during fades, hovers and the transitions of dialogs, and the previous compositor showed none. The switch between the two, the environment variable `WEBKIT_USE_SKIA_FOR_COMPOSITION`, is still read by the 2.54.1 that is installed. Started with it set to `0`, Glaukopis opened its menus cleanly on the owner's desktop: no flicker.

## Decision

On Linux the application asks for the previous compositor itself: first of all in `run` (`src-tauri/src/lib.rs`), before the log, GTK or WebKit start, it sets `WEBKIT_USE_SKIA_FOR_COMPOSITION` to `0` where the variable is not set. The web process, which composites, inherits it. One who has set the variable, to `1` to try the new compositor or to `0`, is not overruled. The log says which it is.

The fade of the menus is kept; it is not the cause. Windows and macOS do not run WebKitGTK and are not touched.

## Consequences

- The packages and installers of Linux carry the fix; nothing is to be set by hand.
- The page is composited as it was by every WebKitGTK before 2.54. Whatever the new compositor gains, in speed or in less drawing, is forgone until then.
- When a WebKitGTK that shows no stale frames with Skia is what the distributions ship, this can be undone. To see, start the application with the variable set to `1` and open menus.
- The off-screen harness is not affected: it runs without compositing.
