package com.calldetector.app.ui

import android.content.Context
import android.graphics.PixelFormat
import android.os.Build
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import com.calldetector.app.R
import com.calldetector.app.utils.PhoneNumberQueryService

object CallInfoPopup {

    private var popupView: View? = null
    private var windowManager: WindowManager? = null
    private var windowParams: WindowManager.LayoutParams? = null
    private val queryService = PhoneNumberQueryService()
    
    // Drag variables
    private var initialX = 0
    private var initialY = 0
    private var initialTouchX = 0f
    private var initialTouchY = 0f

    fun show(context: Context, phoneNumber: String, status: String, info: String?) {
        dismiss(context)

        windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager

        val inflater = LayoutInflater.from(context)
        popupView = inflater.inflate(R.layout.popup_call_info, null)

        val tvCallerName = popupView?.findViewById<TextView>(R.id.tvCallerName)
        val tvSpamReport = popupView?.findViewById<TextView>(R.id.tvSpamReport)
        val spamBadgeContainer = popupView?.findViewById<View>(R.id.spamBadgeContainer)
        val btnClose = popupView?.findViewById<Button>(R.id.btnClose)

        // Show "Checking..." initially
        tvCallerName?.text = "Checking..."
        spamBadgeContainer?.visibility = View.GONE

        // Setup close button
        btnClose?.setOnClickListener {
            dismiss(context)
        }

        // Setup drag functionality
        setupDragListener()

        // Create window parameters - center of screen
        val displayMetrics = context.resources.displayMetrics
        val screenWidth = displayMetrics.widthPixels
        val screenHeight = displayMetrics.heightPixels

        windowParams = WindowManager.LayoutParams().apply {
            type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            } else {
                @Suppress("DEPRECATION")
                WindowManager.LayoutParams.TYPE_PHONE
            }
            format = PixelFormat.TRANSLUCENT
            flags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
            width = WindowManager.LayoutParams.WRAP_CONTENT
            height = WindowManager.LayoutParams.WRAP_CONTENT
            gravity = Gravity.CENTER
            x = 0
            y = 0
        }

        try {
            windowManager?.addView(popupView, windowParams)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
    
    private fun setupDragListener() {
        popupView?.setOnTouchListener { view, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    // Get initial touch position
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    // Get initial window position
                    initialX = windowParams?.x ?: 0
                    initialY = windowParams?.y ?: 0
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    // Calculate new position
                    val deltaX = event.rawX - initialTouchX
                    val deltaY = event.rawY - initialTouchY
                    
                    windowParams?.x = (initialX + deltaX).toInt()
                    windowParams?.y = (initialY + deltaY).toInt()
                    
                    // Update window position
                    windowParams?.let { params ->
                        windowManager?.updateViewLayout(popupView, params)
                    }
                    true
                }
                MotionEvent.ACTION_UP -> {
                    // Optional: Add snap-to-edge or bounds checking here
                    true
                }
                else -> false
            }
        }
    }

    fun update(context: Context, phoneNumber: String, status: String, info: String?) {
        if (popupView == null) {
            show(context, phoneNumber, status, info)
            return
        }

        val tvCallerName = popupView?.findViewById<TextView>(R.id.tvCallerName)
        val tvSpamReport = popupView?.findViewById<TextView>(R.id.tvSpamReport)
        val spamBadgeContainer = popupView?.findViewById<View>(R.id.spamBadgeContainer)

        // Parse and update caller info
        val (name, spamReport) = queryService.parseCallerInfo(info)
        tvCallerName?.text = name
        tvSpamReport?.text = spamReport // Just the number or "(no here)"
        
        // Show spam badge if we have data
        if (name != "Unknown" && name != "Checking...") {
            spamBadgeContainer?.visibility = View.VISIBLE
        }
    }

    fun dismiss(context: Context) {
        try {
            if (popupView != null && windowManager != null) {
                windowManager?.removeView(popupView)
                popupView = null
                windowParams = null
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}

