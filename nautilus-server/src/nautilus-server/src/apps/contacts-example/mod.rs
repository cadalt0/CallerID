use crate::common::IntentMessage;
use crate::common::{to_signed_response, IntentScope, ProcessDataRequest, ProcessedDataResponse};
use crate::AppState;
use crate::EnclaveError;
use axum::extract::State;
use axum::Json;
use fastcrypto::hash::{Blake2b256, HashFunction};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

/// Hard cap to guard enclave memory usage.
const MAX_CONTACTS: usize = 1_000;

/// Request payload: a CSV blob sent by the client.
#[derive(Debug, Serialize, Deserialize)]
pub struct CsvRequest {
    pub csv: String,
}

/// Individual contact entry with hashed phone numbers.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ContactRecord {
    pub name: String,
    pub phone_hash: Vec<u8>,
    pub email: String,
    pub other: String,
}

/// Batch of contacts that the enclave signs.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ContactBatch {
    pub contacts: Vec<ContactRecord>,
}

pub async fn process_data(
    State(state): State<Arc<AppState>>,
    Json(request): Json<ProcessDataRequest<CsvRequest>>,
) -> Result<Json<ProcessedDataResponse<IntentMessage<ContactBatch>>>, EnclaveError> {
    let contacts = parse_contacts(&request.payload.csv)?;
    let timestamp_ms = current_timestamp()?;

    Ok(Json(to_signed_response(
        &state.eph_kp,
        ContactBatch { contacts },
        timestamp_ms,
        IntentScope::ProcessData,
    )))
}

fn parse_contacts(csv_blob: &str) -> Result<Vec<ContactRecord>, EnclaveError> {
    let mut contacts = Vec::new();
    for (idx, raw_line) in csv_blob.lines().enumerate() {
        if raw_line.trim().is_empty() {
            continue;
        }
        let fields: Vec<&str> = raw_line.split(',').collect();

        if idx == 0 && looks_like_header(&fields) {
            continue;
        }

        if fields.len() < 2 {
            return Err(EnclaveError::GenericError(
                "Each CSV row must include at least name and phone".to_string(),
            ));
        }
        let name = fields[0].trim();
        let phone = fields[1].trim();
        let email = fields.get(2).map(|s| s.trim()).unwrap_or_default();
        let other = if fields.len() > 3 {
            fields[3..]
                .iter()
                .map(|s| s.trim())
                .filter(|s| !s.is_empty())
                .collect::<Vec<_>>()
                .join(",")
        } else {
            String::new()
        };

        if name.is_empty() || phone.is_empty() {
            return Err(EnclaveError::GenericError(
                "CSV row missing name or phone number".to_string(),
            ));
        }

        let normalized = normalize_phone(phone);
        if normalized.is_empty() {
            return Err(EnclaveError::GenericError(
                "Phone number must contain digits".to_string(),
            ));
        }
        let hash = hash_phone(&normalized);

        contacts.push(ContactRecord {
            name: name.to_string(),
            phone_hash: hash,
            email: email.to_string(),
            other,
        });

        if contacts.len() > MAX_CONTACTS {
            return Err(EnclaveError::GenericError(format!(
                "CSV payload exceeds {} contacts",
                MAX_CONTACTS
            )));
        }
    }

    if contacts.is_empty() {
        return Err(EnclaveError::GenericError(
            "CSV payload did not contain any rows".to_string(),
        ));
    }

    Ok(contacts)
}

fn looks_like_header(fields: &[&str]) -> bool {
    if fields.is_empty() {
        return false;
    }
    let normalized = fields[0].to_ascii_lowercase();
    normalized.contains("name") || normalized.contains("contact")
}

fn normalize_phone(raw: &str) -> String {
    raw.chars().filter(|c| c.is_ascii_digit()).collect()
}

fn hash_phone(digits_only: &str) -> Vec<u8> {
    Blake2b256::digest(digits_only.as_bytes()).to_vec()
}

fn current_timestamp() -> Result<u64, EnclaveError> {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|err| {
            EnclaveError::GenericError(format!("Failed to get current timestamp: {}", err))
        })
        .map(|duration| duration.as_millis() as u64)
}
