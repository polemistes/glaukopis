package org.glaukopis.app

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import android.util.Log
import android.webkit.MimeTypeMap
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.util.UUID

/**
 * What another app handed over, put into the notebook's inbox through the
 * door (stage 3 of `docs/plans/an-app-for-android.md`, part C): each file
 * copied out of the other app's keeping into a folder of the app's own,
 * `notebook/sharing/<n>`, on the same disk as the inbox, so that the core
 * moves the files and does not copy them once more; then the door; then the
 * folder removed, whatever came of it. Run on a thread of its own.
 */
object Sharing {
  private const val TAG = "Glaukopis"

  /** The most a file may be, as the core takes it (`MAX_FILE`): a file is copied no further than one byte beyond. */
  private const val MOST = 50L * 1024 * 1024

  /** A folder of `sharing` left longer than this ago was left by a run that was ended. */
  private const val LEFT = 24L * 60 * 60 * 1000

  /** What came of it: the name of the thing in the inbox and what could not be taken, or why nothing was put. */
  class Answer(val id: String?, val problems: List<String>, val problem: String?)

  /** A file to hand over: where it is read from, and what it is called. */
  class Handed(val open: () -> java.io.InputStream?, val name: String)

  /** Puts words, a subject and files of other apps into the inbox. */
  fun put(context: Context, text: String, subject: String, uris: List<Uri>): Answer =
    putHanded(context, text, subject, uris.map { uri -> Handed({ context.contentResolver.openInputStream(uri) }, nameOf(context, uri)) })

  /** Puts files of the app's own into the inbox, with no words: each is removed where it lay once it is copied. */
  fun putFiles(context: Context, files: List<File>): Answer {
    val answer = putHanded(context, "", "", files.map { file -> Handed({ file.inputStream() }, file.name) })
    files.forEach { it.delete() }
    return answer
  }

  private fun putHanded(context: Context, text: String, subject: String, handed: List<Handed>): Answer {
    val root = Door.root(context)
    val sharing = File(root, "notebook/sharing")
    clearLeft(sharing)
    val folder = File(sharing, "${System.currentTimeMillis()}-${UUID.randomUUID().toString().take(8)}")
    try {
      folder.mkdirs()
      val files = JSONArray()
      handed.forEachIndexed { at, file ->
        // A file that cannot be opened is named all the same: the core says that it could not be read.
        try {
          file.open()?.use { input -> File(folder, "$at").outputStream().use { output -> copyAtMost(input, output) } }
        } catch (e: Exception) {
          Log.w(TAG, "a file handed over could not be read", e)
        }
        files.put(JSONObject().put("at", "$at").put("name", file.name))
      }
      val said = JSONObject().put("text", text).put("subject", subject).put("files", files)
      val answer = JSONObject(Door.shared(root.path, Door.language(context), said.toString(), folder.path))
      if (answer.has("id")) {
        val problems = answer.optJSONArray("problems")
        return Answer(answer.getString("id"), List(problems?.length() ?: 0) { problems!!.getString(it) }, null)
      }
      return Answer(null, emptyList(), answer.optString("problem", ""))
    } catch (e: Exception) {
      Log.w(TAG, "what was handed over could not be put into the inbox", e)
      return Answer(null, emptyList(), "")
    } finally {
      folder.deleteRecursively()
    }
  }

  private fun copyAtMost(input: java.io.InputStream, output: java.io.OutputStream) {
    val piece = ByteArray(64 * 1024)
    var copied = 0L
    while (copied <= MOST) {
      val read = input.read(piece)
      if (read < 0) return
      output.write(piece, 0, read)
      copied += read
    }
  }

  /** What a share that was ended before it was done left in `sharing`, removed. */
  private fun clearLeft(sharing: File) {
    val before = System.currentTimeMillis() - LEFT
    sharing.listFiles()?.filter { it.lastModified() < before }?.forEach { it.deleteRecursively() }
  }

  /**
   * What the other app calls a file: its name as the app says it, else the
   * last part of its address, else nothing; with the ending of its type put
   * to a name that has none, since a picture is known by its name.
   */
  private fun nameOf(context: Context, uri: Uri): String {
    val said = try {
      context.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { c ->
        if (c.moveToFirst()) c.getString(0) else null
      }
    } catch (e: Exception) {
      null
    }
    val name = said?.takeIf { it.isNotBlank() } ?: uri.lastPathSegment?.substringAfterLast('/') ?: ""
    if (name.contains('.')) return name
    val ending = context.contentResolver.getType(uri)?.let { MimeTypeMap.getSingleton().getExtensionFromMimeType(it) }
    return if (ending != null && name.isNotEmpty()) "$name.$ending" else name
  }
}
