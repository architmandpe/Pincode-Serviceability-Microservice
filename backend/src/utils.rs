use rocket::serde::{Serialize, Deserialize};
use rocket_contrib::json::JsonValue;
use rocket::form::FromForm;


#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContactInformation {
    pub phone_number: String,
    pub email: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MerchantData {
    pub name: String,
    pub id: i32,
    pub business_category: String,
    pub contact: ContactInformation,
    pub pincodes_serviced: Vec<String>,
}

#[derive(Debug)]
pub struct RedisClient {
    pub client: redis::Client,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MerchantServiceability {
    pub merchant_ids: Vec<u32>
}

#[derive(Debug, FromForm, Serialize, Deserialize)]
pub struct Pincodes {
    pub pincodes: Vec<String>
}

#[derive(Debug, Serialize, Deserialize)]
pub enum ApiResponseStatus {
    Success,
    Error,
}

#[derive(Serialize, Deserialize)]
pub struct ApiResponse {
    pub status: ApiResponseStatus,
    pub data: JsonValue,
}