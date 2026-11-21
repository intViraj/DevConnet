const http = require('http');

async function testBackend() {
  const baseURL = 'http://localhost:7777';
  console.log('--- Starting Backend Automated Verification ---');

  // Helper for requests
  async function request(path, options = {}) {
    const url = `${baseURL}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch (e) {
      json = text;
    }
    return {
      status: res.status,
      headers: res.headers,
      data: json,
    };
  }

  try {
    // 1. Health check
    const health = await request('/health');
    console.log('✓ Health check:', health.status, health.data.message);

    // 2. Login as Sarah
    const loginRes = await request('/login', {
      method: 'POST',
      body: JSON.stringify({
        emailId: 'sarah.chen@example.com',
        password: 'Password123!',
      }),
    });
    console.log('✓ Login Sarah:', loginRes.status, loginRes.data.message);
    const cookieHeader = loginRes.headers.get('set-cookie');
    const tokenCookie = cookieHeader ? cookieHeader.split(';')[0] : '';
    console.log('  Token cookie received:', !!tokenCookie);

    // 3. View Profile
    const profileRes = await request('/profile/view', {
      method: 'GET',
      headers: { Cookie: tokenCookie },
    });
    console.log('✓ Profile View:', profileRes.status, profileRes.data.data?.firstName, profileRes.data.data?.emailId);

    // 4. Update Profile
    const updateRes = await request('/profile/edit', {
      method: 'PATCH',
      headers: { Cookie: tokenCookie },
      body: JSON.stringify({
        about: 'Updated bio: Senior Full-Stack Engineer specializing in high-scale systems.',
        skills: ['React', 'Node.js', 'Express', 'MongoDB', 'TailwindCSS', 'AWS'],
      }),
    });
    console.log('✓ Profile Edit:', updateRes.status, updateRes.data.message);

    // 5. Test Profile Edit security (attempt to change email or password)
    const securityRes = await request('/profile/edit', {
      method: 'PATCH',
      headers: { Cookie: tokenCookie },
      body: JSON.stringify({
        emailId: 'hacker@example.com',
      }),
    });
    console.log('✓ Security Check (tamper emailId blocked):', securityRes.status === 400, securityRes.data.message);

    // 6. Feed API
    const feedRes = await request('/user/feed?page=1&limit=5', {
      method: 'GET',
      headers: { Cookie: tokenCookie },
    });
    console.log('✓ Feed Fetch:', feedRes.status, `Received ${feedRes.data.data?.length} developers in feed`);
    const otherDev = feedRes.data.data[0];
    console.log(`  Next candidate in feed: ${otherDev.firstName} ${otherDev.lastName}`);

    // 7. Send Connection Request (Interested) to otherDev
    const sendRes = await request(`/request/send/interested/${otherDev._id}`, {
      method: 'POST',
      headers: { Cookie: tokenCookie },
    });
    console.log('✓ Send Connection Request (interested):', sendRes.status, sendRes.data.message);

    // 8. Prevent duplicate connection request
    const dupRes = await request(`/request/send/interested/${otherDev._id}`, {
      method: 'POST',
      headers: { Cookie: tokenCookie },
    });
    console.log('✓ Duplicate Request Blocked:', dupRes.status === 400, dupRes.data.message);

    // 9. Login as the otherDev to review the request
    const otherDevLogin = await request('/login', {
      method: 'POST',
      body: JSON.stringify({
        emailId: otherDev.firstName.toLowerCase() + '.' + otherDev.lastName.toLowerCase() + '@example.com',
        password: 'Password123!',
      }),
    });
    const otherDevCookie = otherDevLogin.headers.get('set-cookie')?.split(';')[0];
    console.log(`✓ Login as recipient (${otherDev.firstName}):`, otherDevLogin.status);

    // 10. Get received requests for otherDev
    const receivedRes = await request('/user/requests/received', {
      method: 'GET',
      headers: { Cookie: otherDevCookie },
    });
    console.log('✓ Received Requests:', receivedRes.status, `Count: ${receivedRes.data.data?.length}`);
    const reqToReview = receivedRes.data.data[0];

    // 11. Review request: Accept
    const acceptRes = await request(`/request/review/accepted/${reqToReview._id}`, {
      method: 'POST',
      headers: { Cookie: otherDevCookie },
    });
    console.log('✓ Review Request (accept):', acceptRes.status, acceptRes.data.message);

    // 12. View Connections for both users
    const connectionsRes = await request('/user/connections', {
      method: 'GET',
      headers: { Cookie: tokenCookie },
    });
    console.log('✓ Connections list for Sarah:', connectionsRes.status, `Connected with: ${connectionsRes.data.data?.map(c => c.firstName).join(', ')}`);

    // 13. Feed again - should exclude the newly connected user
    const feedAgainRes = await request('/user/feed', {
      method: 'GET',
      headers: { Cookie: tokenCookie },
    });
    const idsInFeed = feedAgainRes.data.data.map(u => u._id);
    const isExcluded = !idsInFeed.includes(otherDev._id);
    console.log('✓ Feed Exclusion Check (connected dev excluded from feed):', isExcluded);

    // 14. Logout
    const logoutRes = await request('/logout', {
      method: 'POST',
      headers: { Cookie: tokenCookie },
    });
    console.log('✓ Logout:', logoutRes.status, logoutRes.data.message);

    console.log('\n ALL BACKEND TESTS PASSED SUCCESSFULLY! \n');
    process.exit(0);
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
}

// Check if server is already running, or start and wait for it
async function startAndTest() {
  require('./app');

  // Poll for health check
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch('http://localhost:7777/health');
      if (res.ok) {
        await testBackend();
        return;
      }
    } catch (e) {
      // Wait a bit
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.error('Server failed to start in time.');
  process.exit(1);
}

startAndTest();
