async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/search?q=zomato');
    const data = await res.json();
    console.log('Search Results for Zomato:', JSON.stringify(data, null, 2));
    
    const res2 = await fetch('http://localhost:3000/api/search?q=tcs');
    const data2 = await res2.json();
    console.log('Search Results for TCS:', JSON.stringify(data2, null, 2));
  } catch (e) {
    console.error('Test failed:', e);
  }
}
test();
