#!/usr/bin/env node

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('\n🎨 ATQ Hunter - Create Admin User\n');
  
  const email = await question('Enter admin email: ');
  const password = await question('Enter admin password: ');
  
  if (!email || !password) {
    console.error('❌ Email and password are required');
    rl.close();
    process.exit(1);
  }

  try {
    const response = await fetch('http://localhost:3000/api/admin/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('\n✅ Admin user created successfully!');
      console.log(`Email: ${data.user.email}`);
      console.log(`ID: ${data.user.id}\n`);
    } else {
      console.error(`\n❌ Error: ${data.error}\n`);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Failed to create admin user');
    console.error('Make sure the development server is running (npm run dev)\n');
    console.error(error.message);
    process.exit(1);
  }

  rl.close();
}

main();

