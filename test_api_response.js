// Test script to see what the API is actually returning
// Run this in the browser console on the admin page

function testAPI() {
  console.log('Testing API response...');
  
  fetch('/api/admin/system-prompts', {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  .then(function(response) {
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    // Get the raw text first
    return response.text();
  })
  .then(function(text) {
    console.log('Raw response (first 500 chars):', text.substring(0, 500));
    
    // Try to parse as JSON
    try {
      var json = JSON.parse(text);
      console.log('JSON parsed successfully:', json);
    } catch (e) {
      console.log('JSON parse failed:', e.message);
      console.log('Response appears to be HTML or other format');
    }
  })
  .catch(function(error) {
    console.error('Fetch error:', error);
  });
}

// Run the test
testAPI(); 