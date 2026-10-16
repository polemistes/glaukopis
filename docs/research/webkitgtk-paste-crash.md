# Report for bugs.webkit.org: crash on paste when the clipboard has no targets

To be filed at https://bugs.webkit.org/enter_bug.cgi, product **WebKit**, component **WebKitGTK**. Everything below the line is the report. Found 2026-10-16; see record 0048.

---

**Title:** [GTK3] UI process crashes in Clipboard::formats() when gtk_clipboard_request_targets() fails (atoms == NULL, n_atoms == -1)

**Version:** WebKitGTK 2.54.1 (webkit2gtk-4.1, GTK 3.24.52), Arch Linux x86_64. The code is unchanged in main as of 2026-10-16.

**Summary**

Pasting into editable content when the clipboard has no owner, or when its owner does not provide TARGETS, crashes the UI process with a null pointer dereference. Ctrl+V and middle-click (primary selection) paste both trigger it. In an application embedding WebKitGTK, this takes down the whole application.

**Steps to reproduce** (X11; Xvfb gives an empty clipboard)

1. `Xvfb :5 &`
2. Save as `page.html`: `<!doctype html><div contenteditable id=e style="min-height:5em">paste here</div><script>e.focus()</script>`
3. `DISPLAY=:5 GDK_BACKEND=x11 /usr/lib/webkit2gtk-4.1/MiniBrowser file://$PWD/page.html &`
4. Click into the editable area and press Ctrl+V, e.g. `DISPLAY=:5 xdotool mousemove --window <id> 60 120 click 1 key ctrl+v`

**Actual result:** MiniBrowser exits with SIGSEGV:

    MiniBrowser[41316]: segfault at 0 ip 00007faeb35cc385 sp 00007ffc71981700 error 4 in libwebkit2gtk-4.1.so.0.24.4[17cb385,7faeb3228000+46ac000]

**Expected result:** nothing is pasted, and the browser keeps running.

The same crash, at the same instruction, happens with a clipboard owner that answers the TARGETS request with property None. It was first seen in a Tauri application on a Wayland session, so it is not limited to X11.

**Analysis**

The faulting instruction (file offset 0x17cb385, vaddr 0x17cc385 in this build) resolves to `Source/WebKit/UIProcess/gtk/ClipboardGtk3.cpp:85`, inside the callback that `Clipboard::formats()` passes to `gtk_clipboard_request_targets()`. It is the load of `atoms[0]` just before the call to `gdk_atom_name()`:

    for (auto* atom : unsafeMakeSpan<GdkAtom>(atoms, atomsCount)) {
        GUniquePtr<char> atomName(gdk_atom_name(atom));

When the targets cannot be retrieved, GTK 3 calls this callback with `atoms == NULL` and `atomsCount == -1`. `request_targets_received_func()` passes on what `gtk_selection_data_get_targets()` returned, and on failure that function sets `*targets = NULL` and `*n_atoms = -1`. The span is then built from a null pointer with a size of `(size_t)-1`, and the first iteration reads address 0.

The same file already handles this case for contents: `Clipboard::readBuffer()` clamps a negative length with `std::max(0, contentsLength)`. Only the targets callback is missing the check.

**Suggested fix**

    --- a/Source/WebKit/UIProcess/gtk/ClipboardGtk3.cpp
    +++ b/Source/WebKit/UIProcess/gtk/ClipboardGtk3.cpp
    @@ void Clipboard::formats(CompletionHandler<void(Vector<String>&&)>&& completionHandler)
             std::unique_ptr<FormatsAsyncData> data(static_cast<FormatsAsyncData*>(userData));

             Vector<String> result;
    +        // GTK passes atoms == nullptr and atomsCount == -1 when the targets could not be
    +        // retrieved: the clipboard has no owner, or the owner did not answer.
    +        if (!atoms || atomsCount <= 0) {
    +            data->completionHandler(WTF::move(result));
    +            return;
    +        }
             for (auto* atom : unsafeMakeSpan<GdkAtom>(atoms, atomsCount)) {

**Workaround for embedders:** stop the trusted `paste` event in a capture-phase listener before WebKit reads the clipboard, and read the clipboard through GTK yourself. `gtk_selection_data_get_targets()` returns FALSE in this case.
