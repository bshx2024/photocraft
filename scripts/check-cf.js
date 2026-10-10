const https = require('https');
const token = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

function check(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.cloudflare.com',
      path: path,
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  if (!token || !accountId) {
    console.log('CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID not set');
    return;
  }
  const pages = await check('/client/v4/accounts/' + accountId + '/pages/projects');
  console.log('Pages projects count:', pages.result ? pages.result.length : 0);
  const workers = await check('/client/v4/accounts/' + accountId + '/workers/scripts');
  console.log('Workers count:', workers.result ? workers.result.length : 0);
}

run();
