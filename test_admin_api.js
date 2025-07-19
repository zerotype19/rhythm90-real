// Simple test script to diagnose admin API issues
// Run this in the browser console on the admin page

async function testAdminAPI() {
  console.log('Testing admin API access...');
  
  try {
    // Test 1: Check if we're on the admin page
    console.log('Current URL:', window.location.href);
    
    // Test 2: Try to fetch system prompts
    console.log('Fetching system prompts...');
    const response = await fetch('/api/admin/system-prompts', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      console.error('API request failed with status:', response.status);
      const text = await response.text();
      console.log('Response body (first 500 chars):', text.substring(0, 500));
      return;
    }
    
    const data = await response.json();
    console.log('Success! Found prompts:', data.map(p => p.tool_name));
    
    // Test 3: Try to update one prompt
    if (data.length > 0) {
      const firstPrompt = data[0];
      console.log('Testing update with prompt:', firstPrompt.tool_name);
      
      const updateResponse = await fetch('/api/admin/system-prompts/' + firstPrompt.id, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt_text: firstPrompt.prompt_text, // Keep same text for test
          model: firstPrompt.model,
          max_tokens: firstPrompt.max_tokens,
          temperature: firstPrompt.temperature,
          top_p: firstPrompt.top_p,
          frequency_penalty: firstPrompt.frequency_penalty,
          presence_penalty: firstPrompt.presence_penalty,
        }),
      });
      
      console.log('Update test status:', updateResponse.status);
      if (updateResponse.ok) {
        console.log('✅ Update test successful!');
      } else {
        const updateText = await updateResponse.text();
        console.log('Update test failed:', updateText.substring(0, 200));
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testAdminAPI(); 