package com.calldetector.app.ui

import android.Manifest
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import com.calldetector.app.R
import com.calldetector.app.service.CallDetectionService
import com.calldetector.app.utils.PermissionHelper

class MainActivity : AppCompatActivity() {

    private lateinit var btnHome: Button
    private lateinit var btnSettings: Button
    private lateinit var tvStatus: TextView
    private lateinit var tvStatusDescription: TextView
    private lateinit var ivLogo: ImageView
    private lateinit var tvAppName: TextView

    private val permissionHelper = PermissionHelper(this)
    private var hasRequestedPermissions = false

    companion object {
        private const val REQUEST_PHONE_PERMISSION = 100
        private const val REQUEST_OVERLAY_PERMISSION = 200
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        initViews()
        setupClickListeners()
        
        // Auto-request permissions on app start
        if (!hasRequestedPermissions) {
            checkAndRequestPermissions()
            hasRequestedPermissions = true
        }
        
        updateServiceStatus()
    }

    private fun initViews() {
        btnHome = findViewById(R.id.btnHome)
        btnSettings = findViewById(R.id.btnSettings)
        tvStatus = findViewById(R.id.tvStatus)
        tvStatusDescription = findViewById(R.id.tvStatusDescription)
        ivLogo = findViewById(R.id.ivLogo)
        tvAppName = findViewById(R.id.tvAppName)
    }

    private fun setupClickListeners() {
        btnHome.setOnClickListener {
            // Open WebView with CallerID website
            val intent = Intent(this, WebViewActivity::class.java)
            startActivity(intent)
        }

        btnSettings.setOnClickListener {
            // Open Settings activity
            val intent = Intent(this, SettingsActivity::class.java)
            startActivity(intent)
        }
    }

    private fun checkAndRequestPermissions() {
        if (!hasAllPermissions()) {
            // Request permissions automatically
            requestAllPermissions()
        } else {
            // All permissions granted, auto-start service
            startServiceIfNeeded()
        }
    }

    private fun hasAllPermissions(): Boolean {
        return permissionHelper.hasPhoneStatePermission() && permissionHelper.hasOverlayPermission()
    }

    private fun requestAllPermissions() {
        if (!permissionHelper.hasPhoneStatePermission()) {
            requestPhonePermission()
        } else if (!permissionHelper.hasOverlayPermission()) {
            requestOverlayPermission()
        }
    }

    private fun requestPhonePermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val permissions = mutableListOf<String>()
            permissions.add(Manifest.permission.READ_PHONE_STATE)
            permissions.add(Manifest.permission.READ_CALL_LOG)

            if (shouldShowRequestPermissionRationale(Manifest.permission.READ_PHONE_STATE) ||
                shouldShowRequestPermissionRationale(Manifest.permission.READ_CALL_LOG)) {
                showPermissionDialog(
                    getString(R.string.permission_phone_state_title),
                    getString(R.string.permission_phone_state_message)
                ) {
                    ActivityCompat.requestPermissions(
                        this,
                        permissions.toTypedArray(),
                        REQUEST_PHONE_PERMISSION
                    )
                }
            } else {
                ActivityCompat.requestPermissions(
                    this,
                    permissions.toTypedArray(),
                    REQUEST_PHONE_PERMISSION
                )
            }
        }
    }

    private fun requestOverlayPermission() {
        if (!permissionHelper.hasOverlayPermission()) {
            showPermissionDialog(
                getString(R.string.permission_overlay_title),
                getString(R.string.permission_overlay_message)
            ) {
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:$packageName")
                )
                startActivityForResult(intent, REQUEST_OVERLAY_PERMISSION)
            }
        }
    }

    private fun showPermissionDialog(title: String, message: String, onConfirm: () -> Unit) {
        AlertDialog.Builder(this)
            .setTitle(title)
            .setMessage(message)
            .setPositiveButton(getString(R.string.grant_permission)) { _, _ -> onConfirm() }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun startServiceIfNeeded() {
        if (hasAllPermissions()) {
            val intent = Intent(this, CallDetectionService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(intent)
            } else {
                startService(intent)
            }
            updateServiceStatus()
        }
    }

    private fun updateServiceStatus() {
        val isRunning = permissionHelper.isServiceRunning(CallDetectionService::class.java)
        if (isRunning) {
            tvStatus.text = "Call Detection Active"
            tvStatus.setTextColor(getColor(android.R.color.holo_green_dark))
            tvStatusDescription.text = "Monitoring incoming calls"
        } else {
            tvStatus.text = "Call Detection Inactive"
            tvStatus.setTextColor(getColor(android.R.color.holo_red_dark))
            tvStatusDescription.text = "Permissions required"
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        when (requestCode) {
            REQUEST_PHONE_PERMISSION -> {
                if (grantResults.isNotEmpty() && grantResults[0] == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                    updateServiceStatus()
                    if (!permissionHelper.hasOverlayPermission()) {
                        requestOverlayPermission()
                    } else {
                        startServiceIfNeeded()
                    }
                } else {
                    Toast.makeText(this, "Phone permission is required for call detection", Toast.LENGTH_LONG).show()
                    updateServiceStatus()
                }
            }
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQUEST_OVERLAY_PERMISSION) {
            updateServiceStatus()
            if (hasAllPermissions()) {
                startServiceIfNeeded()
            } else {
                Toast.makeText(this, "Overlay permission is required for popup display", Toast.LENGTH_LONG).show()
            }
        }
    }

    override fun onResume() {
        super.onResume()
        updateServiceStatus()
    }
}
