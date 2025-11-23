package com.calldetector.app.utils

import android.app.Activity
import android.app.ActivityManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings

class PermissionHelper(private val activity: Activity) {

    fun hasPhoneStatePermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            // Both permissions are required for call detection with phone numbers
            val hasReadPhoneState = activity.checkSelfPermission(android.Manifest.permission.READ_PHONE_STATE) ==
                    PackageManager.PERMISSION_GRANTED
            val hasReadCallLog = activity.checkSelfPermission(android.Manifest.permission.READ_CALL_LOG) ==
                    PackageManager.PERMISSION_GRANTED
            hasReadPhoneState && hasReadCallLog
        } else {
            true
        }
    }

    fun hasOverlayPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(activity)
        } else {
            true
        }
    }

    fun isServiceRunning(serviceClass: Class<*>): Boolean {
        val activityManager = activity.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        val runningServices = activityManager.getRunningServices(Integer.MAX_VALUE)

        return runningServices.any { service ->
            serviceClass.name == service.service.className
        }
    }
}

