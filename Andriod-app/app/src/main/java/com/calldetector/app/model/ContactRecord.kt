package com.calldetector.app.model

data class ContactRecord(
    val phoneNumber: String,
    val name: String,
    val spamCount: Long,
    val notSpamCount: Long,
    val spamType: String,
    val blobId: String,
    val suiObjectId: String
)

