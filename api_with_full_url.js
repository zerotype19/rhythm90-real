// Script using full API URL to avoid frontend router
// Run this in the browser console on the admin page

function getPromptsWithFullURL() {
  console.log('Fetching system prompts with full API URL...');
  
  fetch('https://api.rhythm90.io/api/admin/system-prompts', {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  .then(function(response) {
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      throw new Error('HTTP error! status: ' + response.status);
    }
    
    return response.json();
  })
  .then(function(prompts) {
    console.log('Found', prompts.length, 'system prompts');
    
    var markdown = '# Current System Prompts\n\n';
    markdown += 'This document contains all current system prompts and their available placeholders.\n\n';
    
    // Process each prompt
    for (var i = 0; i < prompts.length; i++) {
      var prompt = prompts[i];
      
      // Extract placeholders
      var placeholderRegex = /\{\{([^}]+)\}\}/g;
      var placeholders = [];
      var match;
      while ((match = placeholderRegex.exec(prompt.prompt_text)) !== null) {
        placeholders.push(match[1]);
      }
      placeholders.sort();
      
      // Format tool name
      var words = prompt.tool_name.split('_');
      var formattedName = '';
      for (var j = 0; j < words.length; j++) {
        formattedName += words[j].charAt(0).toUpperCase() + words[j].slice(1) + ' ';
      }
      formattedName = formattedName.trim();
      
      // Add to markdown
      markdown += '## ' + formattedName + '\n\n';
      markdown += '**Tool Name:** `' + prompt.tool_name + '`\n\n';
      markdown += '**Model:** ' + (prompt.model || 'gpt-4-turbo') + '\n\n';
      markdown += '**Parameters:** max_tokens=' + (prompt.max_tokens || 1000) + ', temperature=' + (prompt.temperature || 0.7) + '\n\n';
      
      if (placeholders.length > 0) {
        var placeholderList = '';
        for (var k = 0; k < placeholders.length; k++) {
          placeholderList += '{{' + placeholders[k] + '}}';
          if (k < placeholders.length - 1) placeholderList += ', ';
        }
        markdown += '**Available Placeholders:** ' + placeholderList + '\n\n';
      } else {
        markdown += '**Available Placeholders:** None\n\n';
      }
      
      markdown += '**Prompt Text:**\n```\n' + prompt.prompt_text + '\n```\n\n';
      markdown += '---\n\n';
    }
    
    // Summary
    markdown += '## Summary\n\n';
    markdown += '**Total Prompts:** ' + prompts.length + '\n\n';
    
    // All placeholders
    var allPlaceholders = {};
    for (var i = 0; i < prompts.length; i++) {
      var placeholderRegex = /\{\{([^}]+)\}\}/g;
      var match;
      while ((match = placeholderRegex.exec(prompts[i].prompt_text)) !== null) {
        allPlaceholders[match[1]] = true;
      }
    }
    
    var allPlaceholderNames = Object.keys(allPlaceholders).sort();
    var allPlaceholderList = '';
    for (var i = 0; i < allPlaceholderNames.length; i++) {
      allPlaceholderList += '{{' + allPlaceholderNames[i] + '}}';
      if (i < allPlaceholderNames.length - 1) allPlaceholderList += ', ';
    }
    
    markdown += '**All Placeholders Used:** ' + allPlaceholderList + '\n\n';
    
    // Download file
    var blob = new Blob([markdown], { type: 'text/markdown' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'current_system_prompts.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('Markdown file downloaded: current_system_prompts.md');
    console.log('Summary:', {
      totalPrompts: prompts.length,
      allPlaceholders: allPlaceholderNames
    });
    
  })
  .catch(function(error) {
    console.error('Error:', error);
  });
}

// Run the function
getPromptsWithFullURL(); 