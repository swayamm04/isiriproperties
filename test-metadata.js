const fetch = require('node-fetch') || global.fetch;

async function testUrl(url) {
  console.log(`\nTesting ${url}`);
  try {
    const res = await fetch(url);
    const html = await res.text();
    
    const ogTags = html.match(/<meta[^>]*og:[^>]*>/gi);
    if (ogTags) {
      console.log("Open Graph Tags found:");
      ogTags.forEach(tag => console.log("  " + tag));
    } else {
      console.log("No Open Graph tags found.");
    }
    
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    if (titleMatch) {
      console.log("Title: " + titleMatch[1]);
    }
  } catch (err) {
    console.error("Error fetching " + url + ":", err.message);
  }
}

testUrl('https://plotandacre.com/');
testUrl('https://plotandacre.com/properties/0011');
