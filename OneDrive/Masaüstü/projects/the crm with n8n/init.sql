-- Initialize the CRM database
CREATE DATABASE crm;

-- Create extensions if needed
\c crm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
