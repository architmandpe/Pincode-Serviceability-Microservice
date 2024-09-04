#[macro_use] extern crate rocket;

use rocket_db_pools::{Database, Connection};
use rocket_db_pools::diesel::{ PgPool, prelude::*};

use rocket::serde::json::{Json, json};
use rocket::fairing::AdHoc;
use rocket::State;

use redis::Commands;
use serde_json::Value;
use std::collections::HashMap;

use rocket::fs::TempFile;
use rocket::form::Form;
use std::env;

pub mod schema;
pub mod models;
pub mod cors;
pub mod email;
pub mod utils;

#[derive(Database)]
#[database("pincode-serviceability")]
struct Db(PgPool);


#[derive(Debug)]
struct RedisClient {
    client: redis::Client,
}

#[derive(FromForm)]
struct Upload<'r> {
    #[form(field = "csv_file")]
    upload: TempFile<'r>,
}

impl From<utils::MerchantData> for models::Merchant {
    fn from(merchant_data: utils::MerchantData) -> Self {
        let contact_info = &merchant_data.contact;
        let formatted_pincodes = merchant_data.pincodes_serviced.join(", ");

        models::Merchant {
            id: merchant_data.id,
            name: merchant_data.name,
            business_category: merchant_data.business_category,
            phone_number: contact_info.phone_number.clone(),
            email: contact_info.email.clone(),
            pincodes_serviced: formatted_pincodes,
        }
    }
}

#[post("/upload_csv", data = "<form>")]
async fn upload_csv(redis: &State<RedisClient>, mut db: Connection<Db>, mut form: Form<Upload<'_>>) -> Json<utils::ApiResponse> {
    // let mut result = Vec::new();
    let mut added_merchant_ids = Vec::new(); // Track the IDs of added merchants

    // Persist the uploaded file to a temporary location
    // println!("The file path to write is {:?}", env::temp_dir().to_str().unwrap());
    let filepath = format!("{}/csv_file.csv", env::temp_dir().to_str().unwrap());
    println!("The file path to write is {:?}", filepath);
    form.upload.persist_to(&filepath).await.unwrap();

    // Read the content of the CSV file
    let mut reader = csv::ReaderBuilder::new()
        .has_headers(true)
        .from_path(filepath)
        .unwrap();

    // Process each record in the CSV file
    for record in reader.records() {
        if let Ok(record) = record {
            let merchant_name = record.get(0).unwrap().to_string();
            let business_category = record.get(1).unwrap().to_string();
            let phone_number = record.get(2).unwrap().to_string();
            let email = record.get(3).unwrap().to_string();
            let pincodes_str = record.get(4).unwrap().to_string();
            let pincodes: Vec<String> = pincodes_str.split(", ").map(|s| s.to_string()).collect();

            let new_merchant_id = generate_merchant_id(&mut db).await;

            let merchant_data = utils::MerchantData {
                id: new_merchant_id,
                name: merchant_name,
                business_category: business_category,
                contact: utils::ContactInformation { phone_number: phone_number, email: email },
                pincodes_serviced: pincodes,
            };

            if add_merchant_to_db(&mut db, merchant_data.clone()).await {
                // Store data in Redis
                match store_data(&redis.client, &merchant_data) {
                    Ok(_) => {
                        // let _ = email::send_email(merchant_data.contact.email, new_merchant_id).await;
                        added_merchant_ids.push(new_merchant_id); // Store the ID of added merchant
                    }
                    Err(err) => {
                        eprintln!("Failed to store data in Redis: {:?}", err);
                        // Return an error response
                        return Json(utils::ApiResponse {
                            status: utils::ApiResponseStatus::Error,
                            data: json!({"message": format!("{}", err)}).into(),
                        });
                    }
                }
            } else {
                // Log an error and return an error response
                eprintln!("Failed to add merchant to PostgreSQL");
                return Json(utils::ApiResponse {
                    status: utils::ApiResponseStatus::Error,
                    data: json!({"message": "Failed to add merchant to PostgreSQL"}).into(),
                });
            }
        }
    }

    println!("The added merchant ids are {:?}", added_merchant_ids);

    // If any merchants were added, return their IDs
    if !added_merchant_ids.is_empty() {
        Json(utils::ApiResponse {
            status: utils::ApiResponseStatus::Success,
            data: json!({"merchant_ids": added_merchant_ids, "message": "Merchants added successfully"}).into(),
        })
    } else {
        // If no merchants were added, return an error response
        Json(utils::ApiResponse {
            status: utils::ApiResponseStatus::Error,
            data: json!({"message": "No merchants added"}).into(),
        })
    }
}



fn store_data(redis_client: &redis::Client, data: &utils::MerchantData) -> redis::RedisResult<()> {
    let mut con = redis_client.get_connection()?;
    let json_data = serde_json::to_string(data).unwrap_or_default();

    // Store merchant data in a Redis Set
    con.sadd("merchants", json_data)?;

    // Store mapping from each pincode to merchant ID in a Redis Hash
    for pincode in &data.pincodes_serviced {
        con.sadd(format!("pincodes:{}", pincode), data.id)?;
    }

    Ok(())
}

async fn add_merchant_to_db(db: &mut Connection<Db>, merchant_data: utils::MerchantData) -> bool {
    use self::schema::merchants::dsl::merchants;
    
    let merchant: models::Merchant = merchant_data.into();

    println!("The merchant to be added is {:?}\n", merchant);

    let result = diesel::insert_into(merchants)
        .values(&merchant)
        .execute( db)
        .await;

    match result {
        Ok(_) => true, // Insert successful
        Err(error) => {
            eprintln!("Error connecting db is {:?}", error);
            false
        }, // Insert failed
    }
}

async fn generate_merchant_id(db: &mut Connection<Db>) -> i32 {
    use self::schema::merchants::dsl::{id, merchants};

    let result: Option<i32> = merchants
        .select(id)
        .order(id.desc())
        .limit(1)
        .get_result( db)
        .await
        .ok(); // Convert Option<Result<i32, _>> to Option<i32>

    result.unwrap_or(0) + 1
}

fn retrieve_merchant_ids(redis_client: &redis::Client, pincode: &str) -> redis::RedisResult<Vec<u32>> {
    let mut con = redis_client.get_connection()?;
    let merchant_ids: Vec<u32> = con.smembers(format!("pincodes:{}", pincode))?;

    Ok(merchant_ids)
}

// Adds a new merchant to the Postgres and Redis database
#[post("/merchant", format = "json", data = "<merchant>")]
async fn add_merchant(redis: &State<RedisClient>,  mut db: Connection<Db>, merchant: Json<utils::MerchantData>) -> Json<utils::ApiResponse> {
    let mut merchant_data = merchant.into_inner();

    let new_merchant_id = generate_merchant_id(&mut db).await;
    merchant_data.id = new_merchant_id;

    // println!("The generated new merchant id is {}", new_merchant_id);

    if add_merchant_to_db(&mut db, merchant_data.clone()).await {
        match store_data(&redis.client, &merchant_data) {
            Ok(_) => {
                    // let _ = email::send_email(merchant_data.contact.email, new_merchant_id).await;
                    Json(utils::ApiResponse {
                    status: utils::ApiResponseStatus::Success,
                    data: json!({"ONDC_merchant_id": format!("{}", new_merchant_id), "message": "Merchant Information added"}).into(),
                })
            },
            Err(err) => {
                eprintln!("Failed to store data in Redis: {:?}", err);
                Json(utils::ApiResponse {
                    status: utils::ApiResponseStatus::Error,
                    data: json!({"message": format!("{}", err)}).into(),
                })
            }
        }

    } else {
        // Log an error and return an error response
        eprintln!("Failed to add merchant to PostgreSQL");
        Json(utils::ApiResponse {
            status: utils::ApiResponseStatus::Error,
            data: json!({"message": "Failed to add merchant to PostgreSQL"}).into(),
        })
    }
}

async fn get_merchant_from_db(mut db: Connection<Db>) -> Vec<(i32, String)> {
    use self::schema::merchants::dsl::{id, name, merchants};

    let results: Vec<(i32, String)> = merchants
        .select((id, name))
        .order(id.asc())
        .load( &mut db)
        .await
        .unwrap_or_else(|_| Vec::new());

    results
}

// Return all the merchants in the database (Postgres)
#[get("/merchants")]
async fn get_all_merchants(db: Connection<Db>) -> Json<utils::ApiResponse> {
    let merchants = get_merchant_from_db(db).await
        .into_iter()
        .map(|(id, name)| json!({"id": id, "name": name}))
        .collect::<Vec<Value>>();

    Json(utils::ApiResponse {
        status: utils::ApiResponseStatus::Success,
        data: json!({"merchants": merchants}).into(),
    })
}
// Returns a List for merchants serviceable for the given list of pincodes (Redis call only)
#[get("/merchant/serviceability?<pincode_data..>")]
fn get_merchants_by_pincode(redis: &State<RedisClient>, pincode_data: String) -> Json<utils::ApiResponse> {
    let mut result: HashMap<String, utils::MerchantServiceability> = HashMap::new();

    let pincodes: Vec<String> = pincode_data.split(',').map(|s| s.trim().to_string()).collect(); //.into_inner().pincodes;
    println!("The pincodes received are {:?}", pincodes);

    for pincode in pincodes.iter() {
        match retrieve_merchant_ids(&redis.client, &pincode) {
            Ok(merchant_ids) => {
                result.insert(pincode.clone(), utils::MerchantServiceability { merchant_ids });
            }
            Err(err) => {
                eprintln!("Error retrieving data for pincode {}: {:?}", pincode, err);
                Json(utils::ApiResponse {
                    status: utils::ApiResponseStatus::Error,
                    data: json!({"message": format!("{}", err)}).into(),
                });
            }
        }
    }

    Json( utils::ApiResponse {
        status: utils::ApiResponseStatus::Success,
        data: json!(result).into(),
    })

}

// Return the merchant information based on the merchant id (Postgres call only)
#[get("/merchant/<merchant_id>", format = "json")]
async fn get_merchant_info(mut db: Connection<Db>, merchant_id: i32) -> Json<utils::ApiResponse> {
    use self::schema::merchants;

    match merchants::table.find(merchant_id).first::<models::Merchant>(&mut db).await {
        Ok(merchant) => Json( utils::ApiResponse {
            status: utils::ApiResponseStatus::Success,
            data: json!(merchant).into()
        }),
        Err(err) => Json( utils::ApiResponse { 
            status: utils::ApiResponseStatus::Error, 
            data: json!({"message": format!("Failed to update merchant information: {:?}", err)}).into() 
        })
    }
}


// Updates the Merchant data in the Postgres table
#[put("/merchant/<merchant_id>", format = "json", data = "<update_data>")]
async fn update_merchant_info(mut db: Connection<Db>, update_data: Json<models::UpdateMerchantData>, merchant_id: i32) -> Json<utils::ApiResponse> {
    use self::schema::merchants;
    use self::schema::merchants::dsl::{name, business_category, phone_number, email};

    // Returns the number of rows affected
    let result = diesel::update(merchants::table.filter(merchants::id.eq(merchant_id)))
        .set((
            name.eq(&update_data.name),
            business_category.eq(&update_data.business_category),
            phone_number.eq(&update_data.phone_number),
            email.eq(&update_data.email)
        ))
        .execute(&mut db)
        .await;
    
    println!("Result received is {:?}", result);
    match result {
        Ok(1) => Json( utils::ApiResponse {
            status: utils::ApiResponseStatus::Success,
            data: json!({"message": "Merchant Information updated successfully"}).into()
        }),
        _ => Json( utils::ApiResponse { 
            status: utils::ApiResponseStatus::Error, 
            data: json!({"message": format!("Failed to update merchant information")}).into() 
        })
    }

}

async fn get_serviced_pincodes(db: &mut Connection<Db>, merchant_id: i32) -> Result<String, String> {
    use self::schema::merchants;

    match merchants::table
        .find(merchant_id)
        .first::<models::Merchant>(db)
        .await
    {
        Ok(result) => Ok(result.pincodes_serviced),
        Err(err) => Err(format!("Error fetching serviced pincodes: {:?}", err)),
    }
}

async fn update_merchant_serviceability(db: &mut Connection<Db>, merchant_id: i32, formatted_pincodes: String) -> bool {
    use self::schema::merchants;
    use self::schema::merchants::dsl::pincodes_serviced;
    
    let updated_merchant = models::Merchant {
        id: merchant_id,
        pincodes_serviced: formatted_pincodes,
        name: String::new(),
        email: String::new(),
        business_category: String::new(),
        phone_number: String::new(),
    };

    println!("The merchant to be added is {:?}", updated_merchant);

    let result = diesel::update(merchants::table.filter(merchants::id.eq(merchant_id)))
        .set(pincodes_serviced.eq(&updated_merchant.pincodes_serviced))
        .execute(db)
        .await;

    match result {
        Ok(_) => true, // Insert successful
        Err(_) => false, // Insert failed
    }
}

fn create_merchant_data(merchant_id: i32, pincodes: Vec<String>) -> utils::MerchantData {

    utils::MerchantData {
        id: merchant_id,
        name: String::new(),
        business_category: String::new(),
        contact: utils::ContactInformation { phone_number: String::new(), email: String::new() },
        pincodes_serviced: pincodes,
    }

}

// Add additional servicealble pincodes to the database (Postgres and Redis)
// TODO: Storing redundant pincodes currently debug this!!
#[put("/merchant/serviceability/<merchant_id>", format = "json", data = "<pincode_data>")]
async fn add_pincodes(redis: &State<RedisClient>, mut db: Connection<Db>, pincode_data: Json<utils::Pincodes>, merchant_id: i32) -> Json<utils::ApiResponse> {
    match get_serviced_pincodes(&mut db, merchant_id).await {
        Ok(serviced_pincodes) => {
            println!("Response from get_serviced_pincodes is {:?}", serviced_pincodes);
            let new_serviceable_pincodes = pincode_data.into_inner().pincodes;

            // Filter out redundant pin codes
            let unique_new_pincodes: Vec<String> = new_serviceable_pincodes
                .iter()
                .filter(|&code| !serviced_pincodes.contains(code))
                .cloned()  // Cloning here to create Vec<String> from Vec<&String>
                .collect();

            // Concatenate unique pin codes with existing serviced pin codes
            let formatted_pincodes = if serviced_pincodes.is_empty() {
                unique_new_pincodes.join(", ")
            } else {
                format!("{}, {}", serviced_pincodes, unique_new_pincodes.join(", "))
            };

            let updated_merchant = create_merchant_data(merchant_id, new_serviceable_pincodes);

            if update_merchant_serviceability(&mut db, merchant_id, formatted_pincodes).await {
                match store_data(&redis.client, &updated_merchant) {
                    Ok(_) => Json(utils::ApiResponse {
                        status: utils::ApiResponseStatus::Success,
                        data: json!({"ONDC_merchant_id": format!("{}", merchant_id), "message": "Merchant Information added"}).into(),
                    }),
                    Err(err) => {
                        eprintln!("Failed to store data in Redis: {:?}", err);
                        Json(utils::ApiResponse {
                            status: utils::ApiResponseStatus::Error,
                            data: json!({"message": format!("{}", err)}).into(),
                        })
                    }
                }
            } else {
                // Log an error and return an error response
                eprintln!("Failed to add merchant to PostgreSQL");
                Json(utils::ApiResponse {
                    status: utils::ApiResponseStatus::Error,
                    data: json!({"message": "Failed to add merchant to PostgreSQL"}).into(),
                })
            }
        }
        Err(err) => {
            // Handle the error from get_serviced_pincodes
            eprintln!("Error fetching serviced pincodes: {}", err);
            Json(utils::ApiResponse {
                status: utils::ApiResponseStatus::Error,
                data: json!({"message": format!("{}", err)}).into(),
            })
        }
    }
}


// Delete pincode serviceability of merchants for a subset of pincodes
#[delete("/merchant/serviceability/<merchant_id>", format = "json", data = "<pincode_data>")]
async fn delete_merchant_serviceability_for_pincode(mut db: Connection<Db>, pincode_data: Json<utils::Pincodes> , merchant_id: i32) -> Json<utils::ApiResponse> {
    
    match get_serviced_pincodes(&mut db, merchant_id).await {
        Ok(serviced_pincodes) => {
            let pincodes_to_delete = pincode_data.into_inner().pincodes;

            let modified_serviced_pincodes: String = {
                let modified_serviced_pincodes = serviced_pincodes
                    .split(", ")
                    .filter(|&code| !pincodes_to_delete.contains(&code.trim().to_string()))
                    .collect::<Vec<&str>>()
                    .join(", ");

                modified_serviced_pincodes.trim().to_string()
            };

            println!("The modified pincodes after delete are {:?}", modified_serviced_pincodes);

            if modified_serviced_pincodes != serviced_pincodes {
                // Check if any pin codes were deleted before updating the database
                if update_merchant_serviceability(&mut db, merchant_id, modified_serviced_pincodes).await {
                    Json(utils::ApiResponse {
                        status: utils::ApiResponseStatus::Success,
                        data: json!({
                            "ONDC_merchant_id": format!("{}", merchant_id),
                            "message": "Merchant Information added"
                        })
                        .into(),
                    })
                } else {
                    // Log an error and return an error response
                    eprintln!("Failed to add merchant to PostgreSQL");
                    Json(utils::ApiResponse {
                        status: utils::ApiResponseStatus::Error,
                        data: json!({
                            "message": "Failed to add merchant to PostgreSQL"
                        })
                        .into(),
                    })
                }
            } else {
                // No pin codes were deleted, return an error response
                Json(utils::ApiResponse {
                    status: utils::ApiResponseStatus::Error,
                    data: json!({
                        "message": "No pin codes were deleted"
                    })
                    .into(),
                })
            }
        }
        Err(err) => {
            // Handle the error from get_serviced_pincodes
            eprintln!("Error fetching serviced pincodes: {}", err);
            Json(utils::ApiResponse {
                status: utils::ApiResponseStatus::Error,
                data: json!({"message": format!("{}", err)}).into(),
            })
        }
    }
}

#[delete("/merchant/<merchant_id>")]
async fn delete_merchant(redis: &State<RedisClient>, mut db: Connection<Db>, merchant_id: i32) -> Json<utils::ApiResponse> {
    use self::schema::merchants;

    match get_serviced_pincodes(&mut db, merchant_id).await {
        Ok(serviced_pincodes) => {
            let vec_of_pincodes: Vec<String> = serviced_pincodes.split(" ,").map(|s| s.trim().to_string()).collect();


            for deleted_pincode in &vec_of_pincodes {
                delete_merchant_serviceability(&redis.client, deleted_pincode, merchant_id).unwrap();
            }

            match diesel::delete(merchants::table.filter(merchants::id.eq(merchant_id))).execute(&mut db).await {
                Ok(rows) if rows > 0 => Json(utils::ApiResponse {
                        status: utils::ApiResponseStatus::Success,
                        data: json!({"ONDC_merchant_id": format!("{}", merchant_id), "message": "Merchant Information Deleted!"}).into(),
                    }),
                _ => Json(utils::ApiResponse {
                    status: utils::ApiResponseStatus::Error,
                    data: json!({"message": "Failed to delete the merchant"}).into(),
                })
            }
        }
        Err(err) => {
            // Handle the error from get_serviced_pincodes
            eprintln!("Error fetching serviced pincodes: {}", err);
            Json(utils::ApiResponse {
                status: utils::ApiResponseStatus::Error,
                data: json!({"message": format!("{}", err)}).into(),
            })
        }
    }
}

fn delete_merchant_serviceability(redis_client: &redis::Client, pincode: &str, merchant_id: i32) -> redis::RedisResult<()> {
    let mut con = redis_client.get_connection()?;

    // Remove the specific merchant from the pincode-to-merchant mapping
    con.srem(format!("pincodes:{}", pincode), merchant_id)?;

    Ok(())
}


pub fn stage() -> AdHoc {
    AdHoc::on_ignite("Diesel Postgres Stage", |rocket| async {
        rocket.attach(Db::init())
    })
}

#[launch]
fn rocket() -> _ {
    let redis_client = RedisClient {
        client: redis::Client::open("redis://localhost:6379").expect("Failed to connect to Redis"),
    };

    rocket::build()
        .attach(cors::cors())
        .manage(redis_client)
        .attach(stage())
        .mount("/", routes![add_merchant, get_merchants_by_pincode, get_merchant_info, get_all_merchants, update_merchant_info, add_pincodes, delete_merchant_serviceability_for_pincode, delete_merchant, upload_csv])
}