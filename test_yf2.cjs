const yahooFinance = require('./node_modules/yahoo-finance2').default;

async function run() {
  try {
    const q = await yahooFinance.quote('RELIANCE.NS');
    console.log('Success:', q.regularMarketPrice);
  } catch(e) {
    console.error('Failure:', e.message);
    if(e.response) {
       console.error('Response status:', e.response.status);
    }
  }
}
run();
