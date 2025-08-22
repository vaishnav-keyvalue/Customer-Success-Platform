import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Tenant, TenantStatus, TenantTier } from '../src/tenant/tenant.entity';

// Load environment variables
config();

async function createTenant() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'siren_db',
    entities: [Tenant],
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established');

    const tenantRepository = dataSource.getRepository(Tenant);

    // Create a sample tenant
    const tenant = new Tenant();
    tenant.name = 'Sample Company';
    tenant.domain = 'sample.com';
    tenant.description = 'A sample tenant for testing purposes';
    tenant.status = TenantStatus.ACTIVE;
    tenant.tier = TenantTier.BASIC;
    tenant.contactEmail = 'admin@sample.com';
    tenant.contactPhone = '+1234567890';
    tenant.address = '123 Main St';
    tenant.city = 'Sample City';
    tenant.state = 'Sample State';
    tenant.country = 'USA';
    tenant.timezone = 'UTC';
    tenant.locale = 'en';
    tenant.isActive = true;
    tenant.maxUsers = 10;
    tenant.maxStorageGB = 1;
    tenant.monthlyFee = 0;
    tenant.currency = 'USD';

    const savedTenant = await tenantRepository.save(tenant);
    console.log('Tenant created successfully:', savedTenant);

  } catch (error) {
    console.error('Error creating tenant:', error);
  } finally {
    await dataSource.destroy();
    console.log('Database connection closed');
  }
}

createTenant();
