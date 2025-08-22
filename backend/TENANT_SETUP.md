# Tenant Setup Guide

This guide explains how to create a tenant in the Siren backend database.

## Prerequisites

1. Make sure your database is running and accessible
2. Copy `env.example` to `.env` and configure your database connection
3. Ensure the application can connect to the database

## Method 1: Using the Script (Recommended for Development)

Run the tenant creation script:

```bash
npm run create:tenant
```

This will create a sample tenant with the following details:
- Name: Sample Company
- Domain: sample.com
- Status: Active
- Tier: Basic
- Contact: admin@sample.com

## Method 2: Using HTTP API

Start the application:

```bash
npm run start:dev
```

Then send a POST request to create a tenant:

```bash
curl -X POST http://localhost:3000/create-tenant \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Company",
    "domain": "mycompany.com",
    "description": "My company description",
    "contactEmail": "admin@mycompany.com",
    "contactPhone": "+1234567890",
    "address": "123 Business St",
    "city": "Business City",
    "state": "Business State",
    "country": "USA"
  }'
```

## Method 3: Using the Dedicated Tenant Endpoint

The application also provides a dedicated tenant endpoint:

```bash
curl -X POST http://localhost:3000/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Another Company",
    "domain": "anothercompany.com",
    "description": "Another company description"
  }'
```

## Required Fields

The following fields are required when creating a tenant:
- `name`: Company/organization name
- `domain`: Unique domain identifier

## Optional Fields

All other fields are optional and will use sensible defaults:
- `status`: Defaults to 'active'
- `tier`: Defaults to 'basic'
- `maxUsers`: Defaults to 10
- `maxStorageGB`: Defaults to 1
- `monthlyFee`: Defaults to 0
- `currency`: Defaults to 'USD'
- `timezone`: Defaults to 'UTC'
- `locale`: Defaults to 'en'

## Database Schema

The tenant table includes fields for:
- Basic information (name, domain, description)
- Contact details (email, phone, address)
- Business configuration (tier, limits, pricing)
- Metadata and configuration storage
- Timestamps for creation and updates

## Troubleshooting

If you encounter issues:

1. Check your database connection in `.env`
2. Ensure the database is running and accessible
3. Check the application logs for detailed error messages
4. Verify that all required database tables exist
