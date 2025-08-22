const fs = require('fs');
const path = require('path');

// Read the users.json file
const usersPath = path.join(__dirname, 'users.json');
const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

const tenantId = 'e0028c9a-8c0b-48a9-889a-9420c0e62662';

// Generate SQL header
let sql = `-- SQL script to insert all ${usersData.users.length} users from users.json into the customers table
-- Tenant ID: ${tenantId}
-- Generated on: ${new Date().toISOString()}

-- Insert all users with proper enum mapping and tenant ID
INSERT INTO customers ("userId", "email", "phone", "region", "plan", "segment", "consents", "tenantId", "createdAt", "updatedAt") VALUES
`;

// Process each user and generate SQL
usersData.users.forEach((user, index) => {
  // Map the plan to match the enum values in the database
  let plan = user.plan;
  if (plan === 'Basic') plan = 'Basic';
  if (plan === 'Pro') plan = 'Pro';
  if (plan === 'Enterprise') plan = 'Enterprise';
  
  // Map the segment to match the enum values
  let segment = user.segment;
  if (segment === 'casual') segment = 'casual';
  if (segment === 'power') segment = 'power';
  if (segment === 'at_risk') segment = 'at_risk';
  
  // Map the region to match the enum values
  let region = user.region;
  if (region === 'US') region = 'US';
  if (region === 'EU') region = 'EU';
  if (region === 'SG') region = 'SG';
  if (region === 'IN') region = 'IN';
  
  // Format the consents as JSON string
  const consents = JSON.stringify(user.consents);
  
  // Format the createdAt date
  const createdAt = user.createdAt;
  
  // Generate the SQL line
  const sqlLine = `('${user.id}', '${user.email}', '${user.phone}', '${region}', '${plan}', '${segment}', '${consents}', '${tenantId}', '${createdAt}', NOW())`;
  
  // Add comma if not the last user
  if (index < usersData.users.length - 1) {
    sql += sqlLine + ',\n';
  } else {
    sql += sqlLine + ';\n';
  }
});

// Add footer
sql += `\n-- Total users inserted: ${usersData.users.length}
-- Tenant ID: ${tenantId}
-- Script completed successfully!`;

// Write the SQL to a file
const outputPath = path.join(__dirname, 'insert_all_customers.sql');
fs.writeFileSync(outputPath, sql);

console.log(`SQL script generated successfully!`);
console.log(`Output file: ${outputPath}`);
console.log(`Total users: ${usersData.users.length}`);
console.log(`File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
