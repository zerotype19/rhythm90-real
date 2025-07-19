// Diagnostic script to troubleshoot admin API issues
// Run this in the browser console on the admin page: https://rhythm90.io/app/admin

async function diagnoseAdminAPI() {
  console.log('🔍 Starting admin API diagnosis...');
  
  // Test 1: Check current URL and authentication
  console.log('📍 Current URL:', window.location.href);
  console.log('🔐 Checking authentication...');
  
  try {
    // Test basic session endpoint
    var sessionResponse = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📡 Session response status:', sessionResponse.status);
    
    if (sessionResponse.ok) {
      var sessionData = await sessionResponse.json();
      console.log('✅ User session:', sessionData);
      
      if (sessionData.is_admin) {
        console.log('✅ User is admin - proceeding with system prompts test');
        
        // Test 2: Try system prompts endpoint
        console.log('📡 Testing system prompts endpoint...');
        var promptsResponse = await fetch('/api/admin/system-prompts', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log('📡 System prompts response status:', promptsResponse.status);
        console.log('📡 System prompts response headers:', Object.fromEntries(promptsResponse.headers.entries()));
        
        if (promptsResponse.ok) {
          var promptsData = await promptsResponse.json();
          console.log('✅ System prompts fetched successfully:', promptsData.length, 'prompts found');
          
          // Show first few prompts as preview
          if (promptsData.length > 0) {
            console.log('📋 First prompt preview:', {
              tool_name: promptsData[0].tool_name,
              model: promptsData[0].model,
              prompt_length: promptsData[0].prompt_text.length
            });
          }
          
        } else {
          console.error('❌ System prompts request failed');
          var errorText = await promptsResponse.text();
          console.error('❌ Error response:', errorText.substring(0, 500));
        }
        
      } else {
        console.error('❌ User is not an admin');
        console.log('👤 User data:', sessionData);
      }
      
    } else {
      console.error('❌ Session request failed');
      var errorText = await sessionResponse.text();
      console.error('❌ Error response:', errorText.substring(0, 500));
    }
    
  } catch (error) {
    console.error('❌ Network error:', error);
  }
  
  // Test 3: Check if we're on the right page
  console.log('🔍 Page analysis:');
  console.log('- URL contains /admin:', window.location.href.includes('/admin'));
  console.log('- Page title:', document.title);
  
  // Test 4: Try alternative endpoints
  console.log('🔍 Testing alternative endpoints...');
  
  var endpoints = [
    '/api/admin/system-prompts',
    '/api/admin/settings',
    '/api/settings/account'
  ];
  
  for (var i = 0; i < endpoints.length; i++) {
    try {
      var testResponse = await fetch(endpoints[i], {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 ' + endpoints[i] + ':', testResponse.status, testResponse.statusText);
      
    } catch (error) {
      console.log('❌ ' + endpoints[i] + ':', error.message);
    }
  }
  
  console.log('🔍 Diagnosis complete. Check the output above for issues.');
}

// Run the diagnosis
diagnoseAdminAPI().catch(function(error) {
  console.error('❌ Diagnosis failed:', error);
}); 