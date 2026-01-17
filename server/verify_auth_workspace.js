const API_URL = 'http://localhost:3000/api';

async function verifyAuthAndWorkspace() {
    console.log('--- Auth & Workspace Verification Start ---');
    const timestamp = Date.now();
    const newUser = {
        username: `user_${timestamp}`,
        email: `user_${timestamp}@example.com`,
        password: 'password123'
    };

    try {
        // 1. Register
        console.log(`1. Registering user: ${newUser.username}`);
        let res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(`Register failed: ${JSON.stringify(err)}`);
        }
        console.log('✅ Registration successful');

        // 2. Login
        console.log('2. Logging in...');
        res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: newUser.email, password: newUser.password })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(`Login failed: ${JSON.stringify(err)}`);
        }
        const loginData = await res.json();
        const token = loginData.token;
        if (!token) throw new Error('No token received');
        console.log('✅ Login successful, Token received');

        // 3. Create Workspace
        console.log('3. Creating Authenticated Workspace...');
        const workspaceData = {
            workspaceId: `ws_${timestamp}`,
            nodes: [],
            edges: []
        };
        res = await fetch(`${API_URL}/workspaces`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(workspaceData)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(`Create Workspace failed: ${JSON.stringify(err)}`);
        }
        const createData = await res.json();
        console.log('✅ Workspace creation successful');
        console.log('   Workspace ID:', createData.workspaceId);

        // 4. Verify Persistence
        console.log('4. Fetching Workspaces for User...');
        res = await fetch(`${API_URL}/workspaces`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(`Fetch Workspaces failed: ${JSON.stringify(err)}`);
        }
        const workspaces = await res.json();
        const found = workspaces.find(w => w.workspaceId === workspaceData.workspaceId);
        if (found) {
            console.log('✅ Workspace found in user list!');
        } else {
            console.warn('⚠️ Workspace created but not found in list.');
        }

    } catch (error) {
        console.error('❌ Verification Failed:', error.message);
    }
    console.log('--- Auth & Workspace Verification End ---');
}

verifyAuthAndWorkspace();
