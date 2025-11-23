package com.calldetector.app.utils

import android.util.Log
import com.calldetector.app.model.PhoneQueryResult
import com.google.gson.Gson
import com.google.gson.JsonObject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit

class PhoneNumberQueryService {

    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()

    private val gson = Gson()
    private val apiBaseUrl = "https://callerid-psi.vercel.app/api/spam"

    /**
     * Query phone number information from API
     */
    suspend fun queryPhoneNumber(phoneNumber: String): PhoneQueryResult {
        return withContext(Dispatchers.IO) {
            try {
                // Remove non-digits for API call
                val digitsOnly = phoneNumber.filter { it.isDigit() }
                
                Log.d("PhoneQuery", "Querying API for phone: $digitsOnly")
                
                // Call API: /api/spam/{phoneNumber}
                val url = "$apiBaseUrl/$digitsOnly"
                val request = Request.Builder()
                    .url(url)
                    .get()
                    .build()

                val response = client.newCall(request).execute()
                val responseBody = response.body?.string() ?: throw Exception("Empty response")
                
                Log.d("PhoneQuery", "API Response: $responseBody")
                
                // Parse JSON response
                val jsonResponse = gson.fromJson(responseBody, JsonObject::class.java)
                val found = jsonResponse.get("found")?.asBoolean ?: false
                
                if (found) {
                    // Contact found
                    val contact = jsonResponse.getAsJsonObject("contact")
                    val spamInfo = jsonResponse.getAsJsonObject("spamInfo")
                    
                    val name = contact.get("name")?.asString ?: "Unknown"
                    val spamReports = spamInfo.get("spamReports")?.asInt ?: 0
                    
                    Log.d("PhoneQuery", "Contact found: $name, spam: $spamReports")
                    
                    PhoneQueryResult(
                        phoneNumber = phoneNumber,
                        status = "Found",
                        info = "Name:$name|SpamReport:$spamReports"
                    )
                } else {
                    // Not found - return callerID (formatted phone number)
                    val formattedNumber = formatPhoneNumber(phoneNumber)
                    Log.d("PhoneQuery", "Contact not found, showing callerID: $formattedNumber")
                    
                    PhoneQueryResult(
                        phoneNumber = phoneNumber,
                        status = "Not Found",
                        info = "Name:$formattedNumber|SpamReport:(no here)"
                    )
                }
            } catch (e: Exception) {
                Log.e("PhoneQuery", "Error querying API: ${e.message}", e)
                // On error, show callerID
                val formattedNumber = formatPhoneNumber(phoneNumber)
                PhoneQueryResult(
                    phoneNumber = phoneNumber,
                    status = "Error",
                    info = "Name:$formattedNumber|SpamReport:(no here)"
                )
            }
        }
    }
    
    /**
     * Parse caller info to extract name and spam report
     */
    fun parseCallerInfo(info: String?): Pair<String, String> {
        if (info == null || info.isEmpty()) {
            return Pair("Unknown", "(no here)")
        }
        
        // Parse format: "Name:Hilton Smith|SpamReport:5"
        val parts = info.split("|")
        var name = "Unknown"
        var spamReport = "(no here)"
        
        for (part in parts) {
            when {
                part.startsWith("Name:") -> {
                    name = part.substringAfter("Name:").trim()
                }
                part.startsWith("SpamReport:") -> {
                    val report = part.substringAfter("SpamReport:").trim()
                    spamReport = if (report.isNotEmpty() && report != "0") report else "(no here)"
                }
            }
        }
        
        return Pair(name, spamReport)
    }


    /**
     * Format phone number for display
     */
    fun formatPhoneNumber(phoneNumber: String): String {
        // Remove non-digit characters
        val digits = phoneNumber.filter { it.isDigit() }
        
        // Basic formatting (customize as needed)
        return when {
            digits.length == 10 -> {
                "(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}"
            }
            digits.length == 11 && digits.startsWith("1") -> {
                "+1 (${digits.substring(1, 4)}) ${digits.substring(4, 7)}-${digits.substring(7)}"
            }
            else -> phoneNumber
        }
    }
}

