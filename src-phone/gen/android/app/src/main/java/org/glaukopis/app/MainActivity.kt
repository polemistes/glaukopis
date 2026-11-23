package org.glaukopis.app

import android.graphics.Color
import android.os.Bundle
import android.view.View
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.activity.enableEdgeToEdge
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
    keepClear()
  }

  /** What the page is given of the Android part: `window.glaukopisAndroid` (`src/lib/phone/android.d.ts`). */
  override fun onWebViewCreate(webView: WebView) {
    webView.addJavascriptInterface(ForThePage(), "glaukopisAndroid")
  }

  /**
   * The two things the page asks of the Android part. The page is the app's
   * own, read from the app's file; each function takes what it says and
   * nothing else, and does its work on the thread of the interface.
   */
  inner class ForThePage {
    /** The ground behind the system's bars, `#rrggbb`, with their signs light on a dark ground and dark on a light one. */
    @JavascriptInterface
    fun ground(colour: String, dark: Boolean) {
      val parsed = try {
        Color.parseColor(colour)
      } catch (e: IllegalArgumentException) {
        return
      }
      runOnUiThread {
        findViewById<View>(android.R.id.content).setBackgroundColor(parsed)
        val bars = WindowCompat.getInsetsController(window, window.decorView)
        bars.isAppearanceLightStatusBars = !dark
        bars.isAppearanceLightNavigationBars = !dark
      }
    }

    /** Puts the app behind the others, as the system's Back does where nobody listens, its process kept. */
    @JavascriptInterface
    fun leave() {
      runOnUiThread { moveTaskToBack(true) }
    }
  }

  /**
   * Android draws an app behind the system's bars, and lays the keyboard
   * over it. The page is kept clear of both: what holds it is made smaller
   * by as much as the bars and the keyboard take, so that the page itself
   * needs to know of neither. Without this a tap on what lies under the
   * bar at the top never reaches the page, and what is written at the foot
   * of a long note is written under the keyboard.
   */
  private fun keepClear() {
    val content = findViewById<View>(android.R.id.content)
    ViewCompat.setOnApplyWindowInsetsListener(content) { view, insets ->
      val bars = insets.getInsets(
        WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
      )
      val keyboard = insets.getInsets(WindowInsetsCompat.Type.ime())
      view.setPadding(bars.left, bars.top, bars.right, maxOf(bars.bottom, keyboard.bottom))
      WindowInsetsCompat.CONSUMED
    }
  }
}
