package com.gleaum.app

import android.content.Context
import android.util.Log
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean

/** Starts one cold-start snapshot while the branded splash is visible. */
object NativeStartupPrefetcher {
    private const val TAG = "GleaumStartup"
    private val started = AtomicBoolean(false)
    @Volatile private var accountReady = CountDownLatch(1)
    private val executor = Executors.newFixedThreadPool(6)

    fun start(context: Context) {
        if (!SessionManager.hasValid(context) || !started.compareAndSet(false, true)) return
        val appContext = context.applicationContext
        val ready = CountDownLatch(1).also { accountReady = it }
        NativeAppDataCache.clear()
        NativeAccountContextStore.clear(appContext)

        executor.execute {
            runCatching { NativeAccountContextStore.refresh(appContext) }
                .onFailure { Log.w(TAG, "account context prefetch failed", it) }
            ready.countDown()
        }
        executor.execute {
            runCatching { NativeHomeApi.summary(appContext, "android-startup") }
                .onSuccess {
                    NativeAppDataCache.home = it
                    NativeAccountContextStore.save(appContext, it.account)
                }
                .onFailure { Log.w(TAG, "home prefetch failed", it) }
        }
        executor.execute {
            runCatching { NativeSpaceApi.summary(appContext) }
                .onSuccess { NativeAppDataCache.spaces = it }
                .onFailure { Log.w(TAG, "space prefetch failed", it) }
        }
        executor.execute {
            runCatching { NativeScheduleApi.list(appContext) }
                .onSuccess {
                    NativeAppDataCache.schedules = it
                    it.forEach { schedule -> NativeAppDataCache.scheduleDetails[schedule.id] = schedule }
                }
                .onFailure { Log.w(TAG, "schedule prefetch failed", it) }
        }
        executor.execute {
            ready.await(2500L, TimeUnit.MILLISECONDS)
            if (!NativeAccountContextStore.capabilities(appContext).canViewHouseholdBudget) return@execute
            runCatching { NativeBudgetApi.summary(appContext) }
                .onSuccess { NativeAppDataCache.budget = it }
                .onFailure { Log.w(TAG, "budget prefetch failed", it) }
        }
        executor.execute {
            runCatching { NativeNotificationApi.fetch(appContext) }
                .onSuccess { NativeAppDataCache.notifications = it }
                .onFailure { Log.w(TAG, "notification prefetch failed", it) }
        }
    }

    fun awaitAccount(timeoutMs: Long = 2500L) {
        if (!started.get()) return
        accountReady.await(timeoutMs, TimeUnit.MILLISECONDS)
    }

    fun reset() {
        started.set(false)
        accountReady = CountDownLatch(1)
        NativeAppDataCache.clear()
    }
}
