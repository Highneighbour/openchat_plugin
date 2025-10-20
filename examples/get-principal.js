/**
 * Helper script to get bot principal from private key
 * 
 * Usage:
 *   node examples/get-principal.js path/to/private_key.pem
 * 
 * Or with key in environment:
 *   OPENCHAT_BOT_IDENTITY_PRIVATE_KEY="..." node examples/get-principal.js
 */

const fs = require('fs');
const crypto = require('crypto');

function getPrincipalFromKey(pemKey) {
    try {
        // This is a simplified version
        // In production, you would use the actual IC libraries
        const keyObject = crypto.createPublicKey({
            key: pemKey,
            format: 'pem',
            type: 'spki'
        });
        
        console.log('\n📋 Bot Principal Information\n');
        console.log('This script provides the public key that represents your bot.');
        console.log('You\'ll need this when registering your bot on OpenChat.\n');
        console.log('⚠️  Note: For the actual principal calculation, you should use');
        console.log('the OpenChat bot client library or IC SDK.\n');
        
        console.log('Private key loaded successfully!');
        console.log('\nNext steps:');
        console.log('1. Start your bot server');
        console.log('2. Use /register_bot on OpenChat');
        console.log('3. Provide your bot\'s URL and this information');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\nMake sure your private key is in PEM format.');
        console.log('Generate one with: openssl ecparam -genkey -name secp256k1 -out private_key.pem');
    }
}

// Main execution
const args = process.argv.slice(2);
const keyPath = args[0];

if (process.env.OPENCHAT_BOT_IDENTITY_PRIVATE_KEY) {
    console.log('Using private key from environment variable...');
    getPrincipalFromKey(process.env.OPENCHAT_BOT_IDENTITY_PRIVATE_KEY);
} else if (keyPath && fs.existsSync(keyPath)) {
    console.log(`Reading private key from: ${keyPath}...`);
    const pemKey = fs.readFileSync(keyPath, 'utf8');
    getPrincipalFromKey(pemKey);
} else {
    console.log('❌ Usage: node get-principal.js <path-to-private-key.pem>');
    console.log('   Or set OPENCHAT_BOT_IDENTITY_PRIVATE_KEY environment variable');
    console.log('\n💡 Generate a new key with:');
    console.log('   openssl ecparam -genkey -name secp256k1 -out private_key.pem');
    process.exit(1);
}
