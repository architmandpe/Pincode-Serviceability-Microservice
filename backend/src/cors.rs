use rocket::http::Method;
use rocket_cors::{AllowedOrigins, Cors, CorsOptions};



pub fn cors() -> Cors {
    // let allowed_origins = AllowedOrigins::all();
    CorsOptions::default()
    .allowed_origins(AllowedOrigins::all())
    .allowed_methods(
        vec![Method::Get, Method::Post, Method::Delete, Method::Put, Method::Patch]
            .into_iter()
            .map(From::from)
            .collect(),
    )
    .allow_credentials(true)
    .to_cors()
    .expect("Error creating CORS configuration")
}