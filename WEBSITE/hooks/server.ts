import Fastify from 'fastify';
import { createHash, randomBytes } from 'node:crypto';
import { blake2b } from 'blakejs';
import Validator from 'fastest-validator';

const INTENT_CONTACTS = 0;
const MOCK_SIGNING_SECRET = process.env.MOCK_SIGNING_SECRET ?? 'mock-secret';

const v = new Validator();
const requestSchema = {
  payload: {
    type: 'object',
    props: {
      csv: { type: 'string', empty: false },
    },
  },
};
const validate = v.compile(requestSchema);

const fastify = Fastify({
  logger: true,
});

fastify.get('/', async () => ({ ok: true }));

fastify.get('/health_check', async () => ({ status: 'ok' }));

fastify.get('/get_attestation', async () => ({
  attestation: 'pseudo-attestation',
  public_key: randomBytes(32).toString('hex'),
}));

fastify.post('/process_data', async (request, reply) => {
  const body = request.body as unknown;
  const errors = validate(body);
  if (errors !== true) {
    reply.code(400);
    return { error: errors };
  }

  const payload = (body as { payload: { csv: string } }).payload;
  const contacts = parseContacts(payload.csv);
  if (!contacts.length) {
    reply.code(400);
    return { error: 'CSV payload must include at least one row' };
  }

  const timestamp_ms = Date.now();
  const response = {
    intent: INTENT_CONTACTS,
    timestamp_ms,
    data: { contacts },
  };
  const signature = signResponse(response, timestamp_ms);
  return { response, signature };
});

const PORT = Number(process.env.PORT ?? 3000);

fastify
  .listen({ host: '0.0.0.0', port: PORT })
  .then((address) => {
    fastify.log.info(`mock server listening at ${address}`);
  })
  .catch((err) => {
    fastify.log.error(err);
    process.exit(1);
  });

type ContactRecord = {
  name: string;
  phone_hash: number[]; // Byte array to match Rust server format
  email: string;
  other: string;
};

function parseContacts(csv: string): ContactRecord[] {
  const lines = csv.split(/\r?\n/);
  const records: ContactRecord[] = [];
  for (const [index, rawLine] of lines.entries()) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;
    const fields = trimmed.split(',');
    if (index === 0 && looksLikeHeader(fields)) continue;
    if (fields.length < 2) {
      throw new Error('Each CSV row must include at least name and phone');
    }
    const name = fields[0]?.trim();
    const phone = fields[1]?.trim();
    const email = fields[2]?.trim() ?? '';
    const other =
      fields.length > 3
        ? fields
            .slice(3)
            .map((value) => value.trim())
            .filter(Boolean)
            .join(',')
        : '';
    if (!name || !phone) {
      throw new Error('CSV row missing name or phone number');
    }
    const digitsOnly = phone.replace(/\D/g, '');
    if (!digitsOnly) {
      throw new Error('Phone number must contain digits');
    }
    // Use blake2b256 (32 bytes = 256 bits) to match main server
    // Return as byte array to match Rust server format
    const phoneHashBytes = blake2b(digitsOnly, undefined, 32);
    const phoneHash = Array.from(phoneHashBytes);
    records.push({
      name,
      phone_hash: phoneHash,
      email,
      other,
    });
  }
  return records;
}

function looksLikeHeader(fields: string[]): boolean {
  if (!fields.length) return false;
  const first = fields[0].toLowerCase();
  return first.includes('name') || first.includes('contact');
}

function signResponse(response: object, timestamp: number): string {
  return createHash('sha256')
    .update(MOCK_SIGNING_SECRET)
    .update(String(timestamp))
    .update(JSON.stringify(response))
    .digest('hex');
}

