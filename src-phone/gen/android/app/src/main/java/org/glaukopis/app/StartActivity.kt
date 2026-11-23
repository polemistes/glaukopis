package org.glaukopis.app

import android.content.ActivityNotFoundException
import android.content.ContentResolver
import android.content.Intent
import android.graphics.Typeface
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.TypedValue
import android.view.Gravity
import android.view.ViewGroup
import android.webkit.WebSettings
import android.webkit.WebView
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
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
 *
 * It is also what another app starts (stage 3): Share, the menu over
 * selected words, and *New note* on the icon held down. What was handed
 * over is read here, and put into the notebook's inbox through the door
 * before anything else is started, since the leave to read another app's
 * file is sure only while this activity lives; the page is told the name
 * of the thing and nothing else. Started from the menu over selected
 * words, it runs in that app's task, over its page: so it ends in the step
 * in which it starts the page, and at once where nothing was put.
 */
class StartActivity : AppCompatActivity() {

  /** What was found of the web view. */
  private sealed class Found {
    object Fit : Found()
    object None : Found()
    class TooOld(val version: Int, val pkg: String?) : Found()
  }

  /** A share being put into the inbox: the page waits for it. */
  private var sharing = false

  /** Whether this activity is in front. */
  private var resumed = false

  /** What the page is started with: the name of a thing in the inbox, or that a new note is asked for. */
  private var arrived: String? = null
  private var newNote = false

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
    // Read once: not where Android makes the activity again from what it kept, or a share would be taken twice.
    val again = savedInstanceState != null || intent.flags and Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY != 0
    if (!again) startedFor(intent)
  }

  /** What another app started this for: a share taken in, or a new note asked for. */
  private fun startedFor(intent: Intent) {
    when (intent.action) {
      Intent.ACTION_PROCESS_TEXT -> {
        // Nothing is given back to the app the words were selected in.
        val words = intent.getCharSequenceExtra(Intent.EXTRA_PROCESS_TEXT)?.toString() ?: ""
        share(words, "", emptyList())
      }
      Intent.ACTION_SEND -> {
        val words = intent.getCharSequenceExtra(Intent.EXTRA_TEXT)?.toString() ?: ""
        val subject = intent.getStringExtra(Intent.EXTRA_SUBJECT) ?: intent.getStringExtra(Intent.EXTRA_TITLE) ?: ""
        @Suppress("DEPRECATION")
        val file = intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)
        share(words, subject, listOfNotNull(file).filter { it.scheme == ContentResolver.SCHEME_CONTENT })
      }
      Intent.ACTION_SEND_MULTIPLE -> {
        val words = intent.getCharSequenceArrayListExtra(Intent.EXTRA_TEXT)?.joinToString("\n\n") { it.toString() }
          ?: intent.getCharSequenceExtra(Intent.EXTRA_TEXT)?.toString() ?: ""
        val subject = intent.getStringExtra(Intent.EXTRA_SUBJECT) ?: intent.getStringExtra(Intent.EXTRA_TITLE) ?: ""
        @Suppress("DEPRECATION")
        val files = intent.getParcelableArrayListExtra<Uri>(Intent.EXTRA_STREAM) ?: arrayListOf()
        share(words, subject, files.filter { it.scheme == ContentResolver.SCHEME_CONTENT })
      }
      NEW_NOTE -> newNote = true
    }
  }

  /**
   * Puts what was handed over into the inbox on a thread of its own, with
   * nothing drawn; where it takes longer than half a second, a turning ring
   * in the middle of the screen. Then the page, as the launcher's start does.
   */
  private fun share(words: String, subject: String, files: List<Uri>) {
    sharing = true
    val ring = Handler(Looper.getMainLooper())
    ring.postDelayed({
      if (sharing && !isFinishing) {
        val turning = ProgressBar(this).apply { isIndeterminate = true }
        setContentView(FrameLayout(this).apply {
          addView(turning, FrameLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.CENTER))
        })
      }
    }, 500)
    Thread {
      val answer = Sharing.put(applicationContext, words, subject, files)
      runOnUiThread { shared(answer) }
    }.start()
  }

  /** What came of a share, on the thread of the interface. */
  private fun shared(answer: Sharing.Answer) {
    sharing = false
    if (answer.id == null) {
      val why = answer.problem?.takeIf { it.isNotBlank() }
      val words = getString(R.string.shared_not_taken) + (if (why != null) ": $why" else "")
      // Asked of the application: the message is read when this activity is gone.
      Toast.makeText(applicationContext, words, Toast.LENGTH_LONG).show()
      finish()
      return
    }
    if (answer.problems.isNotEmpty()) {
      Toast.makeText(applicationContext, answer.problems.take(3).joinToString("\n"), Toast.LENGTH_LONG).show()
    }
    arrived = answer.id
    // Where it left the front meanwhile, at its next `onResume`; where it was ended, never: the thing waits in the inbox.
    if (resumed && !isFinishing) proceed()
  }

  override fun onPause() {
    resumed = false
    super.onPause()
  }

  /** In `onResume`, so that it looks again when one comes back from the app store. */
  override fun onResume() {
    super.onResume()
    resumed = true
    if (!sharing) proceed()
  }

  /** The web view looked at, and the page started where it will do, with what it is to show. */
  private fun proceed() {
    when (val found = look()) {
      is Found.Fit -> {
        val page = Intent(this, MainActivity::class.java)
        arrived?.let { page.putExtra(ARRIVED, it) }
        if (newNote) page.putExtra(NOTE, true)
        startActivity(page)
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

    /** The action of *New note* on the icon held down (`res/xml/shortcuts.xml`). */
    const val NEW_NOTE = "org.glaukopis.app.NEW_NOTE"

    /** What the page is started with: the name of a thing in the inbox, and that a new note is asked for. */
    const val ARRIVED = "org.glaukopis.app.arrived"
    const val NOTE = "org.glaukopis.app.note"
  }
}
