async function run() {
  const res = await fetch('https://www.google.com/finance/quote/RELIANCE:NSE?hl=en');
  const html = await res.text();
  
  // Try precise regex
  const mcMatch = html.match(/Market cap<\/div><div[^>]*>.*?<\/div><div[^>]*>([^<]+)<\/div>/);
  const peMatch = html.match(/P\/E ratio<\/div><div[^>]*>.*?<\/div><div[^>]*>([^<]+)<\/div>/);
  
  console.log('Regex MC:', mcMatch?.[1]);
  console.log('Regex PE:', peMatch?.[1]);

  // If the above fails, let's dump a slice around "Market cap"
  if (!mcMatch) {
    const idx = html.indexOf('Market cap');
    console.log('HTML Dump around Market cap:', html.slice(idx - 50, idx + 200));
  }
}
run();
