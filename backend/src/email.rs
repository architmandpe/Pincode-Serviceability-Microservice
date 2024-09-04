use std::env;

use lettre::transport::smtp::authentication::Credentials;
use lettre::{Message, SmtpTransport, Transport};
use dotenvy::dotenv;


// Function to send an email
pub async fn send_email(to_address : String, merchant_id: i32) -> Result<(), ()> {
    dotenv().ok();

    // Configure SMTP credentials and server
    let smtp_key = env::var("SMTP_KEY").expect("SMTP_KEY not set");
    let smtp_username = env::var("SMTP_USERNAME").expect("SMTP_USERNAME not set");
    let smtp_server = env::var("SMTP_HOST").expect("SMTP_HOST not set");

    // Create SMTP transport
    let mailer = SmtpTransport::relay(&smtp_server)
        .unwrap()
        .credentials(Credentials::new(
            smtp_username.to_string(),
            smtp_key.to_string(),
        ))
        .build();

    let msg = format!("Your registration was successful with mercant id {}", merchant_id);

    let email = Message::builder()
        .from(smtp_username.parse().unwrap())
        // .reply_to(to_address.parse().unwrap())
        .to(to_address.parse().unwrap())
        .subject("Merchant Onboarded on ONDC!")
        .body(msg.to_string())
        .unwrap();

    // Send the email
    match mailer.send(&email) {
        Ok(_) => println!("Email sent successfully!"),
        Err(e) => eprintln!("Could not send email: {:?}", e),
    }
    Ok(())
}
