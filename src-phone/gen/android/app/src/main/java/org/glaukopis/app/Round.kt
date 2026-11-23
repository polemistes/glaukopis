package org.glaukopis.app

import android.content.Context
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.Worker
import androidx.work.WorkerParameters
import java.util.concurrent.TimeUnit

/**
 * One round of the synchronization that Android runs when the phone has a
 * network, the app open or closed (stage 3 of
 * `docs/plans/an-app-for-android.md`): what was written or collected is
 * sent though the app was left before it reached the server. It is asked
 * for whenever the page leaves the front.
 */
class Round(context: Context, params: WorkerParameters) : Worker(context, params) {
  override fun doWork(): Result {
    val done = Door.round(Door.root(applicationContext).path, Door.language(applicationContext)) == 0
    return when {
      done -> Result.success()
      // The server was not reached though there was a network: tried again, eight times at the most.
      runAttemptCount < TRIES -> Result.retry()
      else -> Result.success()
    }
  }

  companion object {
    private const val NAME = "round"
    private const val TRIES = 8

    /**
     * Asks Android for the round, in place of what was asked before: one
     * work of one name. It runs when there is a network; where it is to be
     * tried again, after half a minute, and twice as long each time after.
     * Not as work that is hurried, which asks for a notice on the screen on
     * an older Android: Android chooses the moment.
     */
    fun ask(context: Context) {
      val work = OneTimeWorkRequestBuilder<Round>()
        .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
        .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
        .build()
      WorkManager.getInstance(context).enqueueUniqueWork(NAME, ExistingWorkPolicy.REPLACE, work)
    }
  }
}
