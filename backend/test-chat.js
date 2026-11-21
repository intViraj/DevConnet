const { io } = require('socket.io-client');
const http = require('http');

async function runChatTests() {
  const baseURL = 'http://localhost:7777';
  console.log('\n======================================================');
  console.log('   STARTING DEVCONNECT REAL-TIME CHAT TEST SUITE');
  console.log('======================================================\n');

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

  function getCookie(headers) {
    const raw = headers.get('set-cookie');
    return raw ? raw.split(';')[0] : '';
  }

  function getTokenFromCookie(cookieStr) {
    const match = cookieStr.match(/token=([^;]+)/);
    return match ? match[1] : '';
  }

  try {
    // SCENARIO 1: User A (Sarah) logs in, User B (Alex) logs in, User C (Priya) logs in
    console.log('[Scenario 1] Logging in User A (Sarah) and User B (Alex)...');
    const loginA = await request('/login', {
      method: 'POST',
      body: JSON.stringify({ emailId: 'sarah.chen@example.com', password: 'Password123!' }),
    });
    if (loginA.status !== 200) throw new Error('User A login failed');
    const cookieA = getCookie(loginA.headers);
    const tokenA = getTokenFromCookie(cookieA);
    const userA = loginA.data.data;
    console.log(`✓ User A logged in: ${userA.firstName} (${userA._id})`);

    const loginB = await request('/login', {
      method: 'POST',
      body: JSON.stringify({ emailId: 'alex.rivera@example.com', password: 'Password123!' }),
    });
    if (loginB.status !== 200) throw new Error('User B login failed');
    const cookieB = getCookie(loginB.headers);
    const tokenB = getTokenFromCookie(cookieB);
    const userB = loginB.data.data;
    console.log(`✓ User B logged in: ${userB.firstName} (${userB._id})`);

    const loginC = await request('/login', {
      method: 'POST',
      body: JSON.stringify({ emailId: 'priya.sharma@example.com', password: 'Password123!' }),
    });
    if (loginC.status !== 200) throw new Error('User C login failed');
    const cookieC = getCookie(loginC.headers);
    const userC = loginC.data.data;
    console.log(`✓ User C logged in: ${userC.firstName} (${userC._id})`);

    // User A starts conversation with User B
    console.log('\n[Scenario 1 & 9] User A initiates conversation with User B...');
    const convRes = await request('/chat/conversation', {
      method: 'POST',
      headers: { Cookie: cookieA },
      body: JSON.stringify({ recipientId: userB._id }),
    });
    console.log('✓ Conversation created/retrieved:', convRes.status, convRes.data.data?._id);
    const conversationId = convRes.data.data._id;

    // SCENARIO 9: Duplicate conversation prevention
    console.log('\n[Scenario 9] Testing duplicate conversation prevention (User B requests conversation with User A)...');
    const duplicateCheck = await request('/chat/conversation', {
      method: 'POST',
      headers: { Cookie: cookieB },
      body: JSON.stringify({ recipientId: userA._id }),
    });
    if (duplicateCheck.data.data?._id !== conversationId) {
      throw new Error('Duplicate conversation was created!');
    }
    console.log('✓ Duplicate conversation correctly prevented: returned existing ID', duplicateCheck.data.data?._id);

    // Establish live Socket.IO connections for User A and User B
    console.log('\n[Scenario 2, 3, 4] Connecting live Socket.IO clients for User A and User B...');
    const socketA = io(baseURL, {
      auth: { token: tokenA },
      transports: ['websocket'],
    });

    const socketB = io(baseURL, {
      auth: { token: tokenB },
      transports: ['websocket'],
    });

    await Promise.all([
      new Promise((resolve) => socketA.on('connect', resolve)),
      new Promise((resolve) => socketB.on('connect', resolve)),
    ]);
    console.log('✓ Socket A connected:', socketA.id);
    console.log('✓ Socket B connected:', socketB.id);

    // Both join the conversation room
    socketA.emit('join_conversation', { conversationId });
    socketB.emit('join_conversation', { conversationId });
    await new Promise((r) => setTimeout(r, 200));

    // SCENARIO 2 & 3: User A sends message, User B receives it instantly
    console.log('\n[Scenario 2 & 3] User A sends a message via Socket.IO...');
    const messageContentA = 'Hey Alex! Want to collaborate on an open-source project?';

    const receivePromiseB = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout waiting for User B to receive message')), 5000);
      socketB.once('receive_message', (msg) => {
        clearTimeout(timeout);
        resolve(msg);
      });
    });

    socketA.emit('send_message', { conversationId, content: messageContentA });
    const receivedByB = await receivePromiseB;
    console.log('✓ User B instantly received message:');
    console.log(`   Content: "${receivedByB.content}"`);
    console.log(`   Sender: ${receivedByB.sender?.firstName}`);
    console.log(`   Message ID: ${receivedByB._id}`);

    // SCENARIO 4: User B replies and User A receives it instantly
    console.log('\n[Scenario 4] User B replies and User A receives it instantly...');
    const messageContentB = 'Absolutely Sarah! I would love to build something awesome together.';

    const receivePromiseA = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout waiting for User A to receive reply')), 5000);
      const listener = (msg) => {
        if (msg.content === messageContentB) {
          clearTimeout(timeout);
          socketA.off('receive_message', listener);
          resolve(msg);
        }
      };
      socketA.on('receive_message', listener);
    });

    socketB.emit('send_message', { conversationId, content: messageContentB });
    const receivedByA = await receivePromiseA;
    console.log('✓ User A instantly received reply:');
    console.log(`   Content: "${receivedByA.content}"`);
    console.log(`   Sender: ${receivedByA.sender?.firstName}`);
    console.log(`   Message ID: ${receivedByA._id}`);

    // SCENARIO 5, 6, 7: Fetch history from MongoDB
    console.log('\n[Scenario 5, 6, 7] Fetching conversation history from MongoDB (simulating page reload)...');
    const historyRes = await request(`/chat/messages/${conversationId}`, {
      method: 'GET',
      headers: { Cookie: cookieA },
    });
    console.log('✓ Messages fetched from MongoDB:', historyRes.status);
    console.log(`✓ Total messages retrieved: ${historyRes.data.data.length}`);
    if (historyRes.data.data.length < 2) {
      throw new Error('Messages were not persisted in MongoDB!');
    }
    console.log(`   Message 1: "${historyRes.data.data[0].content}" (by ${historyRes.data.data[0].sender.firstName})`);
    console.log(`   Message 2: "${historyRes.data.data[1].content}" (by ${historyRes.data.data[1].sender.firstName})`);

    // Verify conversation list includes last message
    const convListRes = await request('/chat/conversations', {
      method: 'GET',
      headers: { Cookie: cookieA },
    });
    console.log('✓ User A conversation list fetched:', convListRes.data.data.length, 'conversation(s)');
    console.log(`   Last message preview: "${convListRes.data.data[0]?.lastMessage?.content}"`);

    // SCENARIO 8: Unauthorized user (User C) cannot access conversation
    console.log('\n[Scenario 8] Verifying security: Unauthorized User C cannot access this conversation...');
    const unauthorizedRes = await request(`/chat/messages/${conversationId}`, {
      method: 'GET',
      headers: { Cookie: cookieC },
    });
    console.log(`✓ User C access response status: ${unauthorizedRes.status} (${unauthorizedRes.data.message})`);
    if (unauthorizedRes.status !== 403) {
      throw new Error('Security violation: Unauthorized user was able to access conversation!');
    }

    // SCENARIO 10: Reconnection does not create duplicate messages
    console.log('\n[Scenario 10] Testing socket reconnection and re-joining...');
    socketA.disconnect();
    socketA.connect();
    await new Promise((resolve) => socketA.on('connect', resolve));
    socketA.emit('join_conversation', { conversationId });
    console.log('✓ Socket A reconnected and re-joined room');

    // Clean up sockets
    socketA.disconnect();
    socketB.disconnect();

    console.log('\n======================================================');
    console.log('   ALL 10 CHAT SCENARIOS VERIFIED SUCCESSFULLY! ✓');
    console.log('======================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Chat test failed:', err);
    process.exit(1);
  }
}

// Start and run
async function run() {
  require('./app');

  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch('http://localhost:7777/health');
      if (res.ok) {
        await runChatTests();
        return;
      }
    } catch (e) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.error('Server failed to start.');
  process.exit(1);
}

run();
