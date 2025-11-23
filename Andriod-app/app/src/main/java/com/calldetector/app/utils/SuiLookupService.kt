package com.calldetector.app.utils

import com.calldetector.app.model.ContactRecord
import com.google.gson.Gson
import com.google.gson.JsonObject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.bouncycastle.crypto.digests.Blake2bDigest
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.concurrent.TimeUnit

class SuiLookupService {

    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()

    private val gson = Gson()

    // Sui Testnet RPC endpoint
    private val suiRpcUrl = "https://fullnode.testnet.sui.io"

    // Contract constants
    private val packageId = "0x122b45c984dac0464f8cce8a1bd1f2e40327f4407b22ed332231b41d6fb24872"
    private val masterObjectId = "0x642c8d1b1d85232f51cf12920d67c2ed0ab540fac04ae86c32fb486863070a14"

    /**
     * Hash phone number using BLAKE2b256
     * Matches TypeScript: blake2b(digitsOnly, undefined, 32)
     * - Input: digits only string
     * - Key: undefined (no key)
     * - Output: 32 bytes (256 bits)
     */
    fun hashPhoneNumber(phoneNumber: String): ByteArray {
        // Step 1: Remove non-digits (matches: phone.replace(/\D/g, ''))
        val digitsOnly = phoneNumber.filter { it.isDigit() }
        
        // Step 2: Convert string to bytes (UTF-8 encoding)
        // TypeScript blake2b likely does this internally
        val phoneBytes = digitsOnly.toByteArray(Charsets.UTF_8)
        
        // Step 3: Hash with BLAKE2b256 (32 bytes = 256 bits output)
        // Blake2bDigest(256) = 256-bit output = 32 bytes
        // No key parameter (undefined in TypeScript) = default key
        val digest = Blake2bDigest(256)
        digest.update(phoneBytes, 0, phoneBytes.size)
        val hash = ByteArray(32)
        digest.doFinal(hash, 0)
        
        return hash
    }

    /**
     * Convert byte array to hex string
     * Matches TypeScript: bytesToHex(phoneHashBytes)
     */
    fun bytesToHex(bytes: ByteArray): String {
        return bytes.joinToString("") { "%02x".format(it) }
    }
    
    /**
     * Verify hash matches expected output
     * Test case: "01" should hash to "45f3d3ed97ca49b86f1ae514e55e69e0fba32124aa23eb4b70260f89f259271b"
     */
    fun verifyHash(phoneNumber: String): String {
        val hash = hashPhoneNumber(phoneNumber)
        return bytesToHex(hash)
    }

    /**
     * Lookup contact on Sui blockchain
     */
    suspend fun lookupContact(phoneNumber: String): ContactRecord? {
        return withContext(Dispatchers.IO) {
            try {
                android.util.Log.d("SuiLookup", "=".repeat(80))
                android.util.Log.d("SuiLookup", "CONTACT LOOKUP - STARTING")
                android.util.Log.d("SuiLookup", "=".repeat(80))
                android.util.Log.d("SuiLookup", "Phone Number: $phoneNumber")
                android.util.Log.d("SuiLookup", "Network: Testnet")
                android.util.Log.d("SuiLookup", "Package ID: $packageId")
                android.util.Log.d("SuiLookup", "Master Object ID: $masterObjectId")
                android.util.Log.d("SuiLookup", "")
                
                // Step 1: Remove non-digits
                val digitsOnly = phoneNumber.filter { it.isDigit() }
                android.util.Log.d("SuiLookup", "📝 Hashing Process:")
                android.util.Log.d("SuiLookup", "  Input: $phoneNumber")
                android.util.Log.d("SuiLookup", "  Digits Only: $digitsOnly")
                
                // Hash phone number
                val phoneHash = hashPhoneNumber(phoneNumber)
                val phoneHashHex = bytesToHex(phoneHash)
                
                // Convert ByteArray to List<Int> (bytes as unsigned integers 0-255)
                val phoneHashArray = phoneHash.map { it.toInt() and 0xFF }
                
                android.util.Log.d("SuiLookup", "  Hash Method: BLAKE2b256 (32 bytes)")
                android.util.Log.d("SuiLookup", "  Hash (bytes): [${phoneHashArray.joinToString(", ")}]")
                android.util.Log.d("SuiLookup", "  Hash (hex): $phoneHashHex")
                android.util.Log.d("SuiLookup", "  Hash (length): ${phoneHash.size} bytes")
                android.util.Log.d("SuiLookup", "  Using for query: vector<u8> with ${phoneHashArray.size} elements")
                android.util.Log.d("SuiLookup", "")
                android.util.Log.d("SuiLookup", "🔍 Querying contract with hash: $phoneHashHex")

                // Build Sui transaction
                val transaction = buildTransaction(phoneHashArray)
                android.util.Log.d("SuiLookup", "📝 Transaction built")

                // Call devInspectTransactionBlock
                android.util.Log.d("SuiLookup", "🔍 Querying contract...")
                val result = callSuiRpc(transaction)
                android.util.Log.d("SuiLookup", "✅ Query complete!")
                android.util.Log.d("SuiLookup", "")

                // Parse BCS response
                android.util.Log.d("SuiLookup", "📦 Parsing BCS response...")
                val contact = parseBcsResponse(result, phoneNumber)
                if (contact != null) {
                    android.util.Log.d("SuiLookup", "✅ Contact found!")
                    android.util.Log.d("SuiLookup", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
                    android.util.Log.d("SuiLookup", "Contact Details:")
                    android.util.Log.d("SuiLookup", "  Name: ${contact.name}")
                    android.util.Log.d("SuiLookup", "  Spam Count: ${contact.spamCount}")
                    android.util.Log.d("SuiLookup", "  Not Spam Count: ${contact.notSpamCount}")
                    android.util.Log.d("SuiLookup", "  Spam Type: ${contact.spamType.ifEmpty { "(empty)" }}")
                    android.util.Log.d("SuiLookup", "  Blob ID: ${contact.blobId}")
                    android.util.Log.d("SuiLookup", "  Sui Object ID: ${contact.suiObjectId}")
                    android.util.Log.d("SuiLookup", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
                } else {
                    android.util.Log.d("SuiLookup", "❌ Contact not found")
                    android.util.Log.d("SuiLookup", "No contact exists with phone hash: $phoneHashHex")
                }
                android.util.Log.d("SuiLookup", "")
                android.util.Log.d("SuiLookup", "=".repeat(80))
                android.util.Log.d("SuiLookup", "")
                
                contact
            } catch (e: Exception) {
                android.util.Log.e("SuiLookup", "❌ Error in lookupContact: ${e.message}", e)
                e.printStackTrace()
                null
            }
        }
    }

    /**
     * Build Sui transaction for get_contact call
     */
    private fun buildTransaction(phoneHashArray: List<Int>): JsonObject {
        // Build MoveCall transaction
        val moveCall = JsonObject()
        moveCall.addProperty("package", packageId)
        moveCall.addProperty("module", "contacts")
        moveCall.addProperty("function", "get_contact")
        
        val arguments = com.google.gson.JsonArray()
        
        // First argument: master object (Input)
        val masterInput = JsonObject()
        masterInput.addProperty("kind", "Input")
        masterInput.addProperty("index", 0)
        masterInput.addProperty("type", "Object")
        masterInput.addProperty("value", masterObjectId)
        arguments.add(masterInput)
        
        // Second argument: phone_hash vector<u8> (Pure)
        val hashInput = JsonObject()
        hashInput.addProperty("kind", "Input")
        hashInput.addProperty("index", 1)
        hashInput.addProperty("type", "Pure")
        val hashArray = com.google.gson.JsonArray()
        phoneHashArray.forEach { hashArray.add(it) }
        hashInput.add("value", hashArray)
        arguments.add(hashInput)
        
        moveCall.add("arguments", arguments)
        
        // Build transaction
        val tx = JsonObject()
        tx.addProperty("kind", "moveCall")
        tx.add("data", moveCall)
        
        // Build transaction block
        val txBlock = JsonObject()
        val transactions = com.google.gson.JsonArray()
        transactions.add(tx)
        txBlock.add("transactions", transactions)
        
        // Add inputs
        val inputs = com.google.gson.JsonArray()
        
        // Input 0: Master object
        val masterInputObj = JsonObject()
        masterInputObj.addProperty("type", "object")
        masterInputObj.addProperty("objectId", masterObjectId)
        inputs.add(masterInputObj)
        
        // Input 1: Pure vector<u8>
        val hashInputObj = JsonObject()
        hashInputObj.addProperty("type", "pure")
        val hashValueObj = JsonObject()
        hashValueObj.addProperty("valueType", "vector<u8>")
        hashValueObj.add("value", hashArray)
        hashInputObj.add("value", hashValueObj)
        inputs.add(hashInputObj)
        
        txBlock.add("inputs", inputs)
        
        return txBlock
    }

    /**
     * Call Sui RPC devInspectTransactionBlock
     */
    private fun callSuiRpc(transaction: JsonObject): JsonObject {
        val requestBody = JsonObject()
        requestBody.addProperty("jsonrpc", "2.0")
        requestBody.addProperty("id", 1)
        requestBody.addProperty("method", "sui_devInspectTransactionBlock")
        
        val params = com.google.gson.JsonArray()
        params.add("0x0000000000000000000000000000000000000000000000000000000000000000") // sender
        params.add(transaction) // transaction block
        params.add(com.google.gson.JsonNull.INSTANCE) // gas object (null)
        params.add(com.google.gson.JsonNull.INSTANCE) // gas budget (null)
        
        requestBody.add("params", params)

        val mediaType = "application/json".toMediaType()
        val body = gson.toJson(requestBody).toRequestBody(mediaType)

        val request = Request.Builder()
            .url(suiRpcUrl)
            .post(body)
            .addHeader("Content-Type", "application/json")
            .build()

        val response = client.newCall(request).execute()
        val responseBody = response.body?.string() ?: throw Exception("Empty response")
        
        val jsonResponse = gson.fromJson(responseBody, JsonObject::class.java)
        
        if (jsonResponse.has("error")) {
            val error = jsonResponse.getAsJsonObject("error")
            throw Exception("Sui RPC error: ${error.get("message")?.asString ?: "Unknown error"}")
        }
        
        if (!jsonResponse.has("result")) {
            throw Exception("No result in Sui RPC response")
        }
        
        return jsonResponse.getAsJsonObject("result")
    }

    /**
     * Parse BCS response from Sui
     * Matches TypeScript: result.results[0].returnValues[0] = [bcs_bytes, bcs_type]
     */
    private fun parseBcsResponse(result: JsonObject, phoneNumber: String): ContactRecord? {
        try {
            // Access result.results[0].returnValues[0]
            val results = result.getAsJsonArray("results")
            if (results == null || results.size() == 0) {
                android.util.Log.d("SuiLookup", "No results in response")
                return null
            }

            val firstResult = results[0].asJsonObject
            val returnValues = firstResult.getAsJsonArray("returnValues")
            if (returnValues == null || returnValues.size() == 0) {
                android.util.Log.d("SuiLookup", "No return values in result")
                return null
            }

            // returnValues[0] is a tuple: [bcs_bytes, bcs_type]
            val returnValueTuple = returnValues[0].asJsonArray
            if (returnValueTuple == null || returnValueTuple.size() < 2) {
                android.util.Log.d("SuiLookup", "Invalid return value tuple")
                return null
            }

            // Get bcs_bytes (first element of tuple)
            val bcsBytesElement = returnValueTuple[0]
            
            // Handle different formats: base64 string, Uint8Array, or number array
            val bcsBytes: ByteArray = when {
                bcsBytesElement.isJsonPrimitive && bcsBytesElement.asJsonPrimitive.isString -> {
                    // Base64 string - decode it
                    val bcsBase64 = bcsBytesElement.asString
                    android.util.Base64.decode(bcsBase64, android.util.Base64.DEFAULT)
                }
                bcsBytesElement.isJsonArray -> {
                    // Array of numbers - convert to ByteArray
                    val numberArray = bcsBytesElement.asJsonArray
                    ByteArray(numberArray.size()) { i ->
                        numberArray[i].asInt.toByte()
                    }
                }
                else -> {
                    android.util.Log.e("SuiLookup", "Unknown bcs_bytes format: ${bcsBytesElement.javaClass}")
                    return null
                }
            }
            
            // Parse Option tag (first byte: 0 = None, 1 = Some)
            if (bcsBytes.isEmpty()) {
                android.util.Log.d("SuiLookup", "Empty BCS bytes")
                return null
            }
            
            val optionTag = bcsBytes[0].toInt() and 0xFF
            
            if (optionTag == 0) {
                android.util.Log.d("SuiLookup", "Contact not found (Option::None)")
                return null // Not found
            } else if (optionTag == 1) {
                android.util.Log.d("SuiLookup", "Contact found (Option::Some)")
                // Skip option tag and parse ContactRecord
                val contactBytes = bcsBytes.sliceArray(1 until bcsBytes.size)
                return parseContactRecord(contactBytes, phoneNumber)
            } else {
                android.util.Log.e("SuiLookup", "Unexpected option tag: $optionTag")
                return null
            }
            
        } catch (e: Exception) {
            android.util.Log.e("SuiLookup", "Error parsing BCS response: ${e.message}", e)
            e.printStackTrace()
            return null
        }
    }

    /**
     * Parse ContactRecord from BCS bytes
     */
    private fun parseContactRecord(bytes: ByteArray, phoneNumber: String): ContactRecord {
        var offset = 0
        
        // Read phone_hash: vector<u8> (ULEB128 length + bytes)
        val phoneHashLength = readUleb128(bytes, offset)
        offset = phoneHashLength.second
        offset += phoneHashLength.first // Skip phone_hash bytes
        
        // Read wallet_pubkey: vector<u8>
        val walletLength = readUleb128(bytes, offset)
        offset = walletLength.second
        offset += walletLength.first // Skip wallet_pubkey bytes
        
        // Read name: String (ULEB128 length + UTF-8 bytes)
        val nameLength = readUleb128(bytes, offset)
        offset = nameLength.second
        val nameBytes = bytes.sliceArray(offset until offset + nameLength.first)
        val name = String(nameBytes, Charsets.UTF_8)
        offset += nameLength.first
        
        // Read blob_id: String
        val blobIdLength = readUleb128(bytes, offset)
        offset = blobIdLength.second
        val blobIdBytes = bytes.sliceArray(offset until offset + blobIdLength.first)
        val blobId = String(blobIdBytes, Charsets.UTF_8)
        offset += blobIdLength.first
        
        // Read sui_object_id: ID (32 bytes)
        val suiObjectIdBytes = bytes.sliceArray(offset until offset + 32)
        val suiObjectId = "0x" + bytesToHex(suiObjectIdBytes)
        offset += 32
        
        // Read spam_count: u64 (8 bytes, little-endian)
        val spamCountBytes = bytes.sliceArray(offset until offset + 8)
        val spamCount = ByteBuffer.wrap(spamCountBytes).order(ByteOrder.LITTLE_ENDIAN).long
        offset += 8
        
        // Read not_spam_count: u64
        val notSpamCountBytes = bytes.sliceArray(offset until offset + 8)
        val notSpamCount = ByteBuffer.wrap(notSpamCountBytes).order(ByteOrder.LITTLE_ENDIAN).long
        offset += 8
        
        // Read spam_type: String
        val spamTypeLength = readUleb128(bytes, offset)
        offset = spamTypeLength.second
        val spamTypeBytes = bytes.sliceArray(offset until offset + spamTypeLength.first)
        val spamType = String(spamTypeBytes, Charsets.UTF_8)
        
        return ContactRecord(
            phoneNumber = phoneNumber,
            name = name,
            spamCount = spamCount,
            notSpamCount = notSpamCount,
            spamType = spamType,
            blobId = blobId,
            suiObjectId = suiObjectId
        )
    }

    /**
     * Read ULEB128 encoded integer
     * Returns Pair(length, newOffset)
     */
    private fun readUleb128(bytes: ByteArray, offset: Int): Pair<Int, Int> {
        var value = 0
        var shift = 0
        var currentOffset = offset
        
        while (currentOffset < bytes.size) {
            val byte = bytes[currentOffset].toInt() and 0xFF
            value = value or ((byte and 0x7F) shl shift)
            currentOffset++
            
            if ((byte and 0x80) == 0) {
                break
            }
            shift += 7
        }
        
        return Pair(value, currentOffset)
    }
}

