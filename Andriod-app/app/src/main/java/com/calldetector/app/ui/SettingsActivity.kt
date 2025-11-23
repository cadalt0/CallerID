package com.calldetector.app.ui

import android.Manifest
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.ImageButton
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import com.calldetector.app.R
import com.calldetector.app.service.CallDetectionService
import com.calldetector.app.utils.PermissionHelper

class SettingsActivity : AppCompatActivity() {

    private lateinit var btnBack: ImageButton
    private lateinit var btnRequestPermissions: Button
    private lateinit var tvPhonePermission: TextView
    private lateinit var tvPhoneStatus: TextView
    private lateinit var tvOverlayPermission: TextView
    private lateinit var tvOverlayStatus: TextView
    private lateinit var tvServiceStatus: TextView
    private lateinit var tvServiceStatusIcon: TextView

    private val permissionHelper = PermissionHelper(this)

    companion object {
        private const val REQUEST_PHONE_PERMISSION = 100
        private const val REQUEST_OVERLAY_PERMISSION = 200
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)

        initViews()
        setupClickListeners()
        updatePermissionStatus()
        updateServiceStatus()
    }

    private fun initViews() {
        btnBack = findViewById(R.id.btnBack)
        btnRequestPermissions = findViewById(R.id.btnRequestPermissions)
        tvPhonePermission = findViewById(R.id.tvPhonePermission)
        tvPhoneStatus = findViewById(R.id.tvPhoneStatus)
        tvOverlayPermission = findViewById(R.id.tvOverlayPermission)
        tvOverlayStatus = findViewById(R.id.tvOverlayStatus)
        tvServiceStatus = findViewById(R.id.tvServiceStatus)
        tvServiceStatusIcon = findViewById(R.id.tvServiceStatusIcon)
    }

    private fun setupClickListeners() {
        btnBack.setOnClickListener {
            finish()
        }

        btnRequestPermissions.setOnClickListener {
            requestAllPermissions()
        }
    }

    private fun updatePermissionStatus() {
        val hasPhonePermission = permissionHelper.hasPhoneStatePermission()
        val hasOverlayPermission = permissionHelper.hasOverlayPermission()

        if (hasPhonePermission) {
            tvPhonePermission.text = "Granted"
            tvPhoneStatus.text = "✅"
        } else {
            tvPhonePermission.text = "Not Granted"
            tvPhoneStatus.text = "❌"
        }

        if (hasOverlayPermission) {
            tvOverlayPermission.text = "Granted"
            tvOverlayStatus.text = "✅"
        } else {
            tvOverlayPermission.text = "Not Granted"
            tvOverlayStatus.text = "❌"
        }
    }

    private fun updateServiceStatus() {
        val isRunning = permissionHelper.isServiceRunning(CallDetectionService::class.java)
        if (isRunning) {
            tvServiceStatus.text = "Running"
            tvServiceStatusIcon.text = "✅"
        } else {
            tvServiceStatus.text = "Stopped"
            tvServiceStatusIcon.text = "❌"
        }
    }

    private fun requestAllPermissions() {
        if (!permissionHelper.hasPhoneStatePermission()) {
            requestPhonePermission()
        } else if (!permissionHelper.hasOverlayPermission()) {
            requestOverlayPermission()
        } else {
            Toast.makeText(this, "All permissions granted!", Toast.LENGTH_SHORT).show()
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

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        when (requestCode) {
            REQUEST_PHONE_PERMISSION -> {
                updatePermissionStatus()
                if (permissionHelper.hasPhoneStatePermission() && !permissionHelper.hasOverlayPermission()) {
                    requestOverlayPermission()
                } else if (hasAllPermissions()) {
                    startServiceIfNeeded()
                }
            }
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQUEST_OVERLAY_PERMISSION) {
            updatePermissionStatus()
            if (hasAllPermissions()) {
                startServiceIfNeeded()
            }
        }
    }

    private fun hasAllPermissions(): Boolean {
        return permissionHelper.hasPhoneStatePermission() && permissionHelper.hasOverlayPermission()
    }

    private fun startServiceIfNeeded() {
        val intent = Intent(this, CallDetectionService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
        updateServiceStatus()
    }

    override fun onResume() {
        super.onResume()
        updatePermissionStatus()
        updateServiceStatus()
    }
}

