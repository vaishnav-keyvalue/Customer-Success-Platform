const fs = require('fs');
const path = require('path');

// Test loading users from users.json
try {
  const usersPath = path.join(__dirname, 'users.json');
  const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  
  console.log('Successfully loaded users.json');
  console.log(`Total users: ${usersData.users.length}`);
  
  // Check first few users
  console.log('\nFirst 3 users:');
  usersData.users.slice(0, 3).forEach((user, index) => {
    console.log(`${index + 1}. ID: ${user.id}, Email: ${user.email}, Segment: ${user.segment}, Region: ${user.region}`);
  });
  
  // Check last few users
  console.log('\nLast 3 users:');
  usersData.users.slice(-3).forEach((user, index) => {
    console.log(`${index + 1}. ID: ${user.id}, Email: ${user.email}, Segment: ${user.segment}, Region: ${user.region}`);
  });
  
  // Verify user structure
  const sampleUser = usersData.users[0];
  console.log('\nUser structure:');
  console.log('Required fields:', Object.keys(sampleUser));
  
  // Check if all users have required fields
  const validUsers = usersData.users.filter(user => 
    user.id && user.email && user.segment && user.region && user.plan
  );
  console.log(`\nValid users: ${validUsers.length}/${usersData.users.length}`);
  
} catch (error) {
  console.error('Error loading users.json:', error);
}
