import { PayOS } from '@payos/node';

const payOS = new PayOS({
    clientId: process.env.PAYOS_CLIENT_ID || '',
    apiKey: process.env.PAYOS_API_KEY || '',
    checksumKey: process.env.PAYOS_CHECKSUM_KEY || ''
});

export default payOS;
