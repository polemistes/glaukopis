package org.glaukopis.app

import android.os.Bundle
import android.view.View
import androidx.activity.enableEdgeToEdge
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
    keepClear()
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
