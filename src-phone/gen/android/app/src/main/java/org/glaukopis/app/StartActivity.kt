package org.glaukopis.app

import android.content.ActivityNotFoundException
import android.content.Intent
import android.graphics.Typeface
import android.net.Uri
import android.os.Bundle
import android.util.TypedValue
import android.view.ViewGroup
import android.webkit.WebSettings
import android.webkit.WebView
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

/**
 * What the launcher starts (`docs/plans/an-app-for-android.md`, stage 1,
 * part C). It looks whether the device has a web view the page can run in
 * before anything of Glaukopis is loaded, and only then starts the page
 * (`MainActivity`). `MainActivity` cannot look itself: its parent starts
 * Rust and the window in its `onCreate`, which cannot be left uncalled, and
 * with no web view the app then stops with Android's own words.
 *
 * Where the web view will not do, it says so in a plain view of its own, in
 * the words of Android's string resources (the page and the core are not
 * running to say them), with a button to the app store where Android names
 * the package to update.
 */
class StartActivity : AppCompatActivity() {

  /** What was found of the web view. */
  private sealed class Found {
    object Fit : Found()
    object None : Found()
    class TooOld(val version: Int, val pkg: String?) : Found()
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
  }

  /** In `onResume`, so that it looks again when one comes back from the app store. */
  override fun onResume() {
    super.onResume()
    when (val found = look()) {
      is Found.Fit -> {
        startActivity(Intent(this, MainActivity::class.java))
        finish()
        @Suppress("DEPRECATION")
        overridePendingTransition(0, 0)
      }
      is Found.None -> say(getString(R.string.web_view_none), packageName())
      is Found.TooOld -> say(getString(R.string.web_view_too_old, found.version, LEAST_WEB_VIEW), found.pkg)
    }
  }

  /** The package Android names as its web view, where it names one. */
  private fun packageName(): String? = WebView.getCurrentWebViewPackage()?.packageName

  /**
   * Whether the web view will do. Its version is read from the package
   * where the package is one whose version is Chromium's, with nothing of
   * the web view loaded; any other is asked for the user agent, within a
   * try, and what cannot be known is not refused.
   */
  private fun look(): Found {
    val pkg = WebView.getCurrentWebViewPackage() ?: return Found.None
    val name = pkg.packageName
    val chromium = name.startsWith("com.google.android.webview") || name == "com.android.webview" ||
      name.startsWith("com.android.chrome") || name.startsWith("com.chrome.")
    if (chromium) {
      val major = pkg.versionName?.substringBefore('.')?.toIntOrNull()
      if (major != null) return if (major < LEAST_WEB_VIEW) Found.TooOld(major, name) else Found.Fit
    }
    val agent = try {
      WebSettings.getDefaultUserAgent(this)
    } catch (e: Throwable) {
      return Found.None
    }
    val major = Regex("Chrome/(\\d+)").find(agent)?.groupValues?.get(1)?.toIntOrNull()
    return if (major != null && major < LEAST_WEB_VIEW) Found.TooOld(major, name) else Found.Fit
  }

  /** Shows why Glaukopis cannot start: a title, the words, and the button to the app store where there is a package to open. */
  private fun say(words: String, pkg: String?) {
    val gap = dp(24)
    val column = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      setPadding(gap, gap, gap, gap)
    }
    column.addView(TextView(this).apply {
      text = getString(R.string.web_view_title)
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 22f)
      setTypeface(typeface, Typeface.BOLD)
    })
    column.addView(TextView(this).apply {
      text = words
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
      setPadding(0, gap, 0, gap)
    })
    if (pkg != null) {
      val button = Button(this).apply { text = getString(R.string.web_view_store) }
      button.setOnClickListener {
        try {
          startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=$pkg")))
        } catch (e: ActivityNotFoundException) {
          column.removeView(button)
        }
      }
      column.addView(button, LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT))
    }
    val scroll = ScrollView(this).apply { addView(column) }
    // Kept clear of the system's bars, as MainActivity keeps the page.
    ViewCompat.setOnApplyWindowInsetsListener(scroll) { view, insets ->
      val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
      view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
      WindowInsetsCompat.CONSUMED
    }
    setContentView(scroll)
  }

  private fun dp(value: Int): Int =
    TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, value.toFloat(), resources.displayMetrics).toInt()

  companion object {
    /**
     * The least version of the web view the page runs in: the newest of
     * what it uses came with 111. It stands in `vite.config.ts` too
     * (`chrome111`), and the two are changed together.
     */
    const val LEAST_WEB_VIEW = 111
  }
}
