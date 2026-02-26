const axios = require('axios');

const login = async () => {
    try {
        console.log('Attempting login for rahul...');
        const res = await axios.post('http://localhost:5001/api/auth/login', {
            username: 'rahul',
            password: 'rahul123'
        });
        console.log('Login Success!');
        console.log('Role:', res.data.role);
        console.log('Token:', res.data.token ? 'Present' : 'Missing');

        // Decode token to verify payload
        const check = JSON.parse(atob(res.data.token.split('.')[1]));
        console.log('Token Payload Role:', check.role);

    } catch (err) {
        console.error('Login Failed:', err.response ? err.response.data : err.message);
    }
};

login();
