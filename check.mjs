// check.mjs - substitua o conteúdo completo
import https from 'https';

async function get(path) {
  const url = `https://api.staging.filazero.net${path}`;
  return new Promise((resolve) => {
    https.get(url, {
      headers: {
        'Accept': 'application/json',
        'Origin': 'https://app.filazero.net',
        'Referer': 'https://app.filazero.net/',
        'User-Agent': 'MCP-Server-FilaZero/1.0'
      }
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(body) }); } catch { resolve({ status: res.statusCode, body }); } });
    });
  });
}

console.log('=== Testando variações do endpoint de datas ===\n');

const variants = [
  // slug vs id numérico
  '/v2/scheduling/self-service/providers/flutter332/services/1597/available-session-days?year=2026&month=5',
  '/v2/scheduling/self-service/providers/3367/services/1597/available-session-days?year=2026&month=5',
  // abstractServiceId vs id do serviço
  '/v2/scheduling/self-service/providers/flutter332/services/2647/available-session-days?year=2026&month=5',
  // com businessUnitId na query
  '/v2/scheduling/self-service/providers/flutter332/services/1597/available-session-days?year=2026&month=5&businessUnitId=3371',
  '/v2/scheduling/self-service/providers/flutter332/services/1597/available-session-days?year=2026&month=5&locationId=3371',
  // endpoint alternativo
  '/v2/scheduling/self-service/providers/flutter332/business-units/3371/services/1597/available-session-days?year=2026&month=5',
  // mês atual
  '/v2/scheduling/self-service/providers/flutter332/services/1597/available-session-days?year=2026&month=4',
  // sem ano/mês
  '/v2/scheduling/self-service/providers/flutter332/services/1597/available-session-days',
];

for (const path of variants) {
  const result = await get(path);
  console.log(`[${result.status}] ${path.split('providers/')[1]}`);
  if (result.status !== 500) {
    console.log(`  RESPOSTA: ${JSON.stringify(result.body).slice(0, 200)}`);
  }
  console.log('');
}