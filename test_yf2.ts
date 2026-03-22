import yahooFinance from 'yahoo-finance2';

async function run() {
  try {
    const q = await yahooFinance.quote('RELIANCE.NS');
    console.log('Success:', q.regularMarketPrice);
  } catch(e: any) {
    console.error('Failure:', e.message);
    if(e.response) {
       console.error('Response status:', e.response.status);
    }
  }
}
run();
