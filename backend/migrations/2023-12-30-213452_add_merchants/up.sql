CREATE TABLE merchants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    business_category VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    pincodes_serviced VARCHAR NOT NULL
);