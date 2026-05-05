/**
 * Chạy 1 lần để lấy ORG_ID và CHANNELS, sau đó tự thêm vào .env
 * Lệnh: node --env-file=.env setup.js
 */

const { getOrganizations, getChannels } = require('./buffer_api');

(async () => {
  const orgs = await getOrganizations();
  const org = orgs[0];

  const channels = await getChannels(org.id);

  console.log('\nThêm các dòng sau vào file .env:\n');
  console.log(`BUFFER_ORG_ID=${org.id}`);
  console.log(`BUFFER_CHANNELS='${JSON.stringify(channels)}'`);
  console.log('\nChannels đang có:');
  channels.forEach(ch => console.log(`  [${ch.service.toUpperCase()}] ${ch.name} → ${ch.id}`));
})().catch(e => { console.error('Lỗi:', e.message); process.exit(1); });
