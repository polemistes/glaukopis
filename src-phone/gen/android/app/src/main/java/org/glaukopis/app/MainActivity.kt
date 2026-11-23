package org.glaukopis.app

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.os.Environment
import android.view.View
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.activity.enableEdgeToEdge
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

class MainActivity : TauriActivity() {
  /** What the app was started or brought to the front for, kept until the page asks (`asked`). */
  private val kept = Any()
  private val arrived = mutableListOf<String>()
  private var note = false

  /** The page's web view, by which it is told that something was asked. */
  private var webView: WebView? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
    keepClear()
    // Not where Android makes the activity again from what it kept: what it
    // was started for then comes, if at all, by `onNewIntent` (found on the
    // emulator), and is taken once.
    if (savedInstanceState == null) startedFor(intent)
    // Made anew or again: a photograph taken while the process was ended lies there then.
    Thread { takeCameraLeavings() }.start()
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    startedFor(intent)
    tell()
  }

  /** The two things of our own an intent may hold (`StartActivity`), kept until the page asks. */
  private fun startedFor(intent: Intent) {
    synchronized(kept) {
      intent.getStringExtra(StartActivity.ARRIVED)?.let { arrived.add(it) }
      if (intent.getBooleanExtra(StartActivity.NOTE, false)) note = true
    }
  }

  /** Tells the page that something was asked of it; where there is no page yet, it asks when it starts. */
  private fun tell() {
    runOnUiThread { webView?.evaluateJavascript("window.dispatchEvent(new Event('glaukopis-asked'))", null) }
  }

  /** Where wry makes the file the camera app writes into, and leaves it. */
  private fun cameraFolder(): File? = getExternalFilesDir(Environment.DIRECTORY_PICTURES)

  /**
   * What the camera left: Android may end the app while the camera is in
   * front, and the page that asked is then gone when the photograph comes.
   * A file that holds nothing is removed; every other is put into the inbox
   * as a thing shared, a note of its own, not looked at. The page is told,
   * with nothing asked, so that it takes the inbox in.
   */
  private fun takeCameraLeavings() {
    val left = cameraFolder()?.listFiles()?.filter { it.isFile } ?: return
    left.filter { it.length() == 0L }.forEach { it.delete() }
    val photographs = left.filter { it.exists() }
    if (photographs.isEmpty()) return
    Sharing.putFiles(applicationContext, photographs)
    tell()
  }

  /** Whenever the page leaves the front, Android is asked for a round when there is a network. */
  override fun onStop() {
    super.onStop()
    Round.ask(applicationContext)
  }

  /** What the page is given of the Android part: `window.glaukopisAndroid` (`src/lib/phone/android.d.ts`). */
  override fun onWebViewCreate(webView: WebView) {
    this.webView = webView
    webView.addJavascriptInterface(ForThePage(), "glaukopisAndroid")
  }

  /**
   * What the page asks of the Android part. The page is the app's
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

    /** What was asked since the page last asked, as JSON, each thing told once: `{"arrived": […], "note": true}`. */
    @JavascriptInterface
    fun asked(): String {
      val said = JSONObject()
      synchronized(kept) {
        if (arrived.isNotEmpty()) said.put("arrived", JSONArray(arrived))
        if (note) said.put("note", true)
        arrived.clear()
        note = false
      }
      return said.toString()
    }

    /** The photograph the camera left for the page has been taken in: its file is removed. */
    @JavascriptInterface
    fun photographed() {
      cameraFolder()?.listFiles()?.filter { it.isFile && it.name.startsWith("JPEG_") }?.forEach { it.delete() }
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
