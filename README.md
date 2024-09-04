# Optimal Storage and retrieval in m*n Sparse Matrix

## Description
Pincode based serviceability allows merchants to define the pincodes where they can deliver their products & services;
In ONDC, definition & verification of pincode based serviceability is separated, i.e. merchants define the pincodes they serve and buyer apps verify whether a particular pincode (of buyer) can be served by any of the available merchants;
Considering there are more than 30K pincodes and at least 100 million merchants (of which about 10% may enable pincode based serviceability), this requires an optimal data structure for storing the pincode serviceability by merchant (i.e. a sparse matrix of 10M*30K) so that verification is near real-time.

The basic flow of the application is as displayed


![Alt text](app_flow.png?raw=true "Title")

## Technologies Used
- **Rust**: for secure and scalable backend. 
- **Redis**: for quick retrieval of merchant serviceability.
- **PostgreSQL**: persistant storage of onboarded merchants.
- **Next.js**: Frontend 

## Setup
The application is **deployed** using **Google Cloud Run and Google Compute**. Link to the service is https://pincode-serviceability-frontend-4m44wkcyfa-uc.a.run.app/

`You may need to allow Mixed Content/ Insecure Content in site settings of your browser`

### Interactions
- **https://pincode-serviceability-frontend-4m44wkcyfa-uc.a.run.app/**: To onboard the Merchant.
- **https://pincode-serviceability-frontend-4m44wkcyfa-uc.a.run.app/merchants/<merchant_id>**: Merchant SignIn page. Edit Merchant details and Pincode Serviceability.
- **https://pincode-serviceability-frontend-4m44wkcyfa-uc.a.run.app/MerchantServiceability**: Verify Merchant serviceability to an array of pincodes.

### Local Setup
Make Sure you have rust and Next.js installed
#### Backend
```
git clone https://github.com/aniketp02/ONDC-Merchant-Pincode-Serviceability.git
cd backend
rustup override set nightly
cargo run
```
The backend runs at port 8000 by default, you can change the configurations in the `Rocket.toml` file and change the `.env` file to set the SMTP and DB urls.
#### Frontend
```
cd frontend
npm run dev
```
The frontend runs at port 3000 by default.

#### Postgres setup 
Install diesel cli and run the diesel migrations. This creates the database (if not already existing) and runs all the migrations.
```
cargo install diesel_cli --no-default-features --features postgres
diesel migration run
```

#### Redis Setup
Start the Redis server and configure the redis connection port.


## API Documentation

### Add Merchant
- **Endpoint**: POST /merchant
- **Description**: This endpoint is used to add a new merchant to the platform.
- **Request Body**:
```
json
{
    "name": "Merchant name",
    "id": 0,
    "business_category": "Business Category",
    "contact": {
      "phone_number": "9999999999",
      "email": "email@example.com"
    },
    "pincodes_serviced": ["110008", "110009", "110001"]
}
```
- **Response**:
```
json
{
  "ONDC_merchant_id": "12345",
  "message": "Merchant Information added"
}
```

### Onboard Multiple Merchants

- **Endpoint**: POST /upload_csv
- **Description**: This endpoint is used to upload a CSV file containing merchant data to the system to onboard merchants at scale.

### Get Merchants by Pincode

- **Endpoint**: GET merchant/serviceability?pincodes=<pincodes>
- **Description**: This endpoint retrieves the list of merchants that service the given pincode.
- **Query Parameter**: Comma-separated list of pincodes.
- **Response**:
```
json
{
  "merchants": [
    {
      "id": 12345,
      "name": "Merchant Name"
    },
    {
      "id": 67890,
      "name": "Another Merchant"
    }
  ]
}
```

### Get Merchant Info
- **Endpoint**: GET /merchant/<merchant_id>
- **Description**: This endpoint retrieves the information of a specific merchant.
- **Response**:
```
json
{
  "id": 12345,
  "name": "Merchant Name",
  "business_category": "Business Category",
  "pincodes_serviced": ["110001", "110002"]
}
```

### Get All Merchants
- **Endpoint**: GET /merchants
- **Description**: Retrieves a list of all merchants stored in the system.
- **Response**: JSON response containing an array of merchants with their IDs and names.

### Update Merchant Info

- **Endpoint**: PUT /merchant/<merchant_id>
- **Description**: This endpoint is used to update the information of a specific merchant.
- **Request Body**:
```
json
{
    "name": "Updated Merchant name",
    "business_category": "Updated Business Category",
    "phone_number": "0000000000",
    "email": "example@example.com"
}
```
- **Response**:
```
json
{
  "ONDC_merchant_id": "12345",
  "message": "Merchant Information updated"
}
```

### Add Pincode Serviceability for Merchants
- **Endpoint**: PUT /merchant/serviceability/<merchant_id>
- **Description**: This endpoint adds additional serviceable pincodes for a given merchant
- **Request Body**:
```
json
{
  "pincodes": ["110019", "110008"] #additional pincodes to be serviced
}
```

### Delete Pincode Serviceability for Merchants

- **Endpoint**: DELETE /merchant/serviceability/<merchant_id>
- **Description**: This endpoint deletes the serviceability of merchants for a subset of pincodes.
- **Request Body**:
```
json
{
  "pincodes": ["110001"] #Remove serviceability for the following pincodes
}
```
- **Response**:
```
json
{
  "ONDC_merchant_id": "12345",
  "message": "Merchant Information updated"
}
```

### Delete Merchant

- **Endpoint**: DELETE /merchant/<merchant_id>
- **Description**: This endpoint is used to delete a specific merchant from the system.
- **Response**:
```
json
{
  "ONDC_merchant_id": "12345",
  "message": "Merchant Information Deleted!"
}
```


## Flow of the Project

- **Merchant Onboarding**: Merchants can be added to the system individually using the /merchant endpoint or in bulk using the /upload_csv endpoint.

- **Merchant Information Management**: Once merchants are onboarded, their information can be retrieved, updated, or deleted using various endpoints.

- **Serviceability Query**: The API provides endpoints to query merchants based on their serviceability for specific pincodes.

- **Data Storage**: Merchant information is stored in a PostgreSQL database, while serviceability data is cached in Redis for faster retrieval.

- **Email Notification**: Optionally, email notifications can be sent to merchants upon successful onboarding or updates using the /send_email endpoint.

## Conclusion
The project provides a comprehensive solution for managing merchant data, including adding, updating, and deleting merchants, as well as managing their serviceability for specific pincodes. The use of Redis and PostgreSQL databases ensures efficient data management and retrieval. The project can be further enhanced with additional features, such as authentication and authorization, to provide a more secure and robust solution.
