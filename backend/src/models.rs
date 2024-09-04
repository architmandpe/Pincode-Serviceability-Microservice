use rocket_db_pools::diesel::prelude::*;
use rocket::serde::{Serialize, Deserialize};

// Model: User struct with id, name, email
#[derive(Debug, Serialize, Deserialize, Queryable, Insertable, Selectable)]
#[diesel(table_name = crate::schema::merchants)]
pub struct Merchant {
    pub id: i32,
    pub name: String,
    pub business_category: String,
    pub phone_number: String,
    pub email: String,
    pub pincodes_serviced: String,
}

#[derive(Debug, Serialize, Deserialize, Queryable, Insertable, Selectable)]
#[diesel(table_name = crate::schema::merchants)]
pub struct UpdateMerchantData {
    pub name: String,
    pub business_category: String,
    pub phone_number: String,
    pub email: String,
}