// @generated automatically by Diesel CLI.

diesel::table! {
    merchants (id) {
        id -> Int4,
        #[max_length = 255]
        name -> Varchar,
        #[max_length = 255]
        business_category -> Varchar,
        #[max_length = 20]
        phone_number -> Varchar,
        #[max_length = 255]
        email -> Varchar,
        pincodes_serviced -> Varchar,
    }
}
