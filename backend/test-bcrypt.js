const bcrypt = require('bcrypt');

async function testHash() {
    const password = "123";
    const storedHash = "$2b$10$m63vxrGt0QUHx7dDDbUwGOD0XM9uKrqGikTMz8A7fihGDvsTGi/WK";
    
    // Generate new hash
    const newHash = await bcrypt.hash(password, 10);
    console.log('New hash:', newHash);
    
    // Test stored hash
    const isValidStored = await bcrypt.compare(password, storedHash);
    console.log('Is stored hash valid:', isValidStored);
    
    // Test new hash
    const isValidNew = await bcrypt.compare(password, newHash);
    console.log('Is new hash valid:', isValidNew);
}

testHash(); 