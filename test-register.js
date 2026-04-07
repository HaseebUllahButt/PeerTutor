const http = require('http');

async function test() {
  try {
    const res = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', email: 'test1@test.com', password: 'password123', role: 'student' })
    });
    console.log(res.status);
    console.log(await res.text());
  } catch (e) { console.error(e); }
}
test();
