package com.calldetector.app.service

import android.app.*
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.telephony.PhoneStateListener
import android.telephony.TelephonyManager
import android.util.Log
import androidx.core.app.NotificationCompat
import com.calldetector.app.R
import com.calldetector.app.ui.MainActivity
import com.calldetector.app.ui.CallInfoPopup
import com.calldetector.app.utils.PhoneNumberQueryService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class CallDetectionService : Service() {

    private var telephonyManager: TelephonyManager? = null
    private var phoneStateListener: PhoneStateListener? = null
    private val queryService = PhoneNumberQueryService()
    private val serviceScope = CoroutineScope(Dispatchers.Main)

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "CallDetectionService created")
        createNotificationChannel()
        
        // Start foreground service
        // For Android 14+, we use SPECIAL_USE type since phoneCall requires system permissions
        // The call detection still works via PhoneStateListener regardless of service type
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                // Android 14+ requires a service type
                // Use SPECIAL_USE which is designed for cases like call detection
                @Suppress("NewApi")
                startForeground(
                    NOTIFICATION_ID,
                    createNotification(),
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
                )
            } else {
                // For older versions, no type needed
                startForeground(NOTIFICATION_ID, createNotification())
            }
        } catch (e: SecurityException) {
            Log.e(TAG, "Failed to start foreground service: ${e.message}", e)
            // Service will still work, just won't be in foreground
            throw e
        }
        
        initializeTelephonyManager()
        Log.d(TAG, "Service started and monitoring calls")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.i(TAG, "onStartCommand received")
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Call Detection Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Service for detecting incoming calls"
            }
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Call Detection Active")
            .setContentText("Monitoring incoming calls")
            .setSmallIcon(android.R.drawable.ic_menu_call)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }

    private fun initializeTelephonyManager() {
        telephonyManager = getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
        Log.d(TAG, "TelephonyManager instance obtained.")

        phoneStateListener = object : PhoneStateListener() {
            override fun onCallStateChanged(state: Int, phoneNumber: String?) {
                super.onCallStateChanged(state, phoneNumber)
                Log.d(TAG, "onCallStateChanged: state=$state, number=$phoneNumber")
                handleCallStateChange(state, phoneNumber)
            }
        }

        try {
            telephonyManager?.listen(phoneStateListener, PhoneStateListener.LISTEN_CALL_STATE)
            Log.d(TAG, "PhoneStateListener registered successfully.")
        } catch (e: SecurityException) {
            Log.e(TAG, "SecurityException on registering PhoneStateListener: ${e.message}")
        }
    }

    private fun handleCallStateChange(state: Int, phoneNumber: String?) {
        Log.d(TAG, "Handling call state change: state=$state, phoneNumber=$phoneNumber")
        when (state) {
            TelephonyManager.CALL_STATE_RINGING -> {
                Log.i(TAG, "📞 INCOMING CALL DETECTED: $phoneNumber")
                if (phoneNumber != null && phoneNumber.isNotEmpty()) {
                    onIncomingCall(phoneNumber)
                } else {
                    Log.w(TAG, "Call detected but phone number is empty or null.")
                }
            }
            TelephonyManager.CALL_STATE_IDLE -> {
                Log.d(TAG, "Call ended - state is IDLE")
                onCallEnded()
            }
            TelephonyManager.CALL_STATE_OFFHOOK -> {
                Log.d(TAG, "Call answered or outgoing call")
            }
        }
    }

    private fun onIncomingCall(phoneNumber: String) {
        Log.i(TAG, "Processing incoming call from: $phoneNumber")
        serviceScope.launch {
            try {
                // Show popup with "Checking..." first
                Log.d(TAG, "Showing popup for: $phoneNumber")
                CallInfoPopup.show(this@CallDetectionService, phoneNumber, "Checking...", null)
                Log.d(TAG, "Popup should be visible now.")

                // Wait 1 second before showing details
                kotlinx.coroutines.delay(1000)

                // Query the phone number
                Log.d(TAG, "Querying phone number: $phoneNumber")
                val queryResult = queryService.queryPhoneNumber(phoneNumber)
                Log.d(TAG, "Query result - Status: ${queryResult.status}, Info: ${queryResult.info}")

                // Update popup with details
                CallInfoPopup.update(
                    this@CallDetectionService,
                    phoneNumber,
                    queryResult.status,
                    queryResult.info
                )
                Log.i(TAG, "✅ Call info displayed (mock data) for: $phoneNumber")
            } catch (e: Exception) {
                Log.e(TAG, "Error processing incoming call and showing popup: ${e.message}", e)
                CallInfoPopup.update(
                    this@CallDetectionService,
                    phoneNumber,
                    "Error",
                    "Failed to query: ${e.message}"
                )
            }
        }
    }

    private fun onCallEnded() {
        Log.d(TAG, "Call ended - dismissing popup")
        CallInfoPopup.dismiss(this)
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "CallDetectionService is being destroyed.")
        phoneStateListener?.let {
            telephonyManager?.listen(it, PhoneStateListener.LISTEN_NONE)
            Log.d(TAG, "PhoneStateListener unregistered.")
        }
        CallInfoPopup.dismiss(this)
    }

    companion object {
        private const val TAG = "CallDetectionService"
        private const val CHANNEL_ID = "CallDetectionChannel"
        private const val NOTIFICATION_ID = 1
    }
}
