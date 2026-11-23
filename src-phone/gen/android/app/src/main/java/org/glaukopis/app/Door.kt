package org.glaukopis.app

import android.content.Context
import android.os.Build
import java.io.File
import java.util.Locale

/**
 * The door of the shell (`src-tauri/src/door.rs`): two functions of Rust
 * that need no window. One puts what another app handed over into the
 * notebook's inbox, one makes a round of the synchronization. They are in
 * the library the app has already; loading it starts nothing of Glaukopis
 * (some 40 ms, found on the emulator). It is first asked for on the thread
 * of a share, of the camera's leavings or of a piece of work, never on the
 * thread of the interface.
 */
object Door {
  init {
    System.loadLibrary("glaukopis_app")
  }

  /** Puts a thing shared into the inbox: gives `{"id", "problems"}`, or `{"problem"}` where nothing was put. */
  @JvmStatic external fun shared(root: String, language: String, said: String, from: String): String

  /** One round of the synchronization: `0` done, `1` to be tried again. */
  @JvmStatic external fun round(root: String, language: String): Int

  /** The data folder: the one the role opens (`own_folder` of `phone.rs`), as the log of a run names it. */
  fun root(context: Context): File = File(context.filesDir, "data")

  /** The first of the languages Android is set to, as a tag (`nb-NO`). */
  fun language(context: Context): String {
    val locale = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      context.resources.configuration.locales.get(0)
    } else {
      @Suppress("DEPRECATION")
      context.resources.configuration.locale
    }
    return (locale ?: Locale.getDefault()).toLanguageTag()
  }
}
