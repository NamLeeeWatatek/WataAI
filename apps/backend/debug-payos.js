const PayOS = require('@payos/node');
console.log('PayOS:', PayOS);
try {
    new PayOS('a', 'b', 'c');
    console.log('Constructor worked');
} catch (e) { console.log('Constructor failed', e.message); }
