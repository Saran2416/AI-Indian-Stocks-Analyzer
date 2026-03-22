import { fetchStockPrice } from './lib/yahoo-api';

async function test() {
  const data = await fetchStockPrice('RELIANCE.NS');
  console.log(data);
}
test();
