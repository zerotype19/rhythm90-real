// Browser-compatible script to get all current system prompts
// Run this in the browser console on the admin page: https://rhythm90.io/app/admin

async function getAllSystemPrompts() {
  console.log('Fetching all system prompts...');
  
  try {
    var response = await fetch('/api/admin/system-prompts', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('HTTP error! status: ' + response.status);
    }
    
    var prompts = await response.json();
    console.log('Found prompts:', prompts.length);
    
    // Generate markdown content
    var markdown = '# Current System Prompts from ai_system_prompts Table\n\n';
    markdown += 'This document contains all current system prompts and their available placeholders.\n\n';
    
    // Group by tool type
    var coreTools = ['play_builder', 'signal_lab', 'ritual_guide', 'quarterly_planner'];
    var miniTools = ['plain_english_translator', 'get_to_by_generator', 'creative_tension_finder', 'persona_generator', 'journey_builder', 'test_learn_scale', 'agile_sprint_planner', 'connected_media_matrix', 'synthetic_focus_group'];
    
    // Helper function to extract placeholders
    function extractPlaceholders(promptText) {
      var placeholderRegex = /\{\{([^}]+)\}\}/g;
      var placeholders = new Set();
      var match;
      
      while ((match = placeholderRegex.exec(promptText)) !== null) {
        placeholders.add(match[1]);
      }
      
      return Array.from(placeholders).sort();
    }
    
    // Helper function to format tool name
    function formatToolName(toolName) {
      var words = toolName.split('_');
      var formatted = '';
      for (var i = 0; i < words.length; i++) {
        formatted += words[i].charAt(0).toUpperCase() + words[i].slice(1) + ' ';
      }
      return formatted.trim();
    }
    
    // Core Rhythm90 Tools
    markdown += '## Core Rhythm90 Tools\n\n';
    for (var i = 0; i < prompts.length; i++) {
      var prompt = prompts[i];
      if (coreTools.indexOf(prompt.tool_name) !== -1) {
        var placeholders = extractPlaceholders(prompt.prompt_text);
        markdown += '### ' + formatToolName(prompt.tool_name) + '\n\n';
        markdown += '**Tool Name:** `' + prompt.tool_name + '`\n\n';
        markdown += '**Model:** ' + (prompt.model || 'gpt-4-turbo') + '\n\n';
        markdown += '**Parameters:** max_tokens=' + (prompt.max_tokens || 1000) + ', temperature=' + (prompt.temperature || 0.7) + '\n\n';
        
        if (placeholders.length > 0) {
          var placeholderList = '';
          for (var j = 0; j < placeholders.length; j++) {
            placeholderList += '{{' + placeholders[j] + '}}';
            if (j < placeholders.length - 1) placeholderList += ', ';
          }
          markdown += '**Available Placeholders:** ' + placeholderList + '\n\n';
        } else {
          markdown += '**Available Placeholders:** None\n\n';
        }
        
        markdown += '**Prompt Text:**\n```\n' + prompt.prompt_text + '\n```\n\n';
        markdown += '---\n\n';
      }
    }
    
    // Mini Tools
    markdown += '## Mini Tools\n\n';
    for (var i = 0; i < prompts.length; i++) {
      var prompt = prompts[i];
      if (miniTools.indexOf(prompt.tool_name) !== -1) {
        var placeholders = extractPlaceholders(prompt.prompt_text);
        markdown += '### ' + formatToolName(prompt.tool_name) + '\n\n';
        markdown += '**Tool Name:** `' + prompt.tool_name + '`\n\n';
        markdown += '**Model:** ' + (prompt.model || 'gpt-4-turbo') + '\n\n';
        markdown += '**Parameters:** max_tokens=' + (prompt.max_tokens || 1000) + ', temperature=' + (prompt.temperature || 0.7) + '\n\n';
        
        if (placeholders.length > 0) {
          var placeholderList = '';
          for (var j = 0; j < placeholders.length; j++) {
            placeholderList += '{{' + placeholders[j] + '}}';
            if (j < placeholders.length - 1) placeholderList += ', ';
          }
          markdown += '**Available Placeholders:** ' + placeholderList + '\n\n';
        } else {
          markdown += '**Available Placeholders:** None\n\n';
        }
        
        markdown += '**Prompt Text:**\n```\n' + prompt.prompt_text + '\n```\n\n';
        markdown += '---\n\n';
      }
    }
    
    // Other tools (if any)
    var otherTools = [];
    for (var i = 0; i < prompts.length; i++) {
      var prompt = prompts[i];
      if (coreTools.indexOf(prompt.tool_name) === -1 && miniTools.indexOf(prompt.tool_name) === -1) {
        otherTools.push(prompt);
      }
    }
    
    if (otherTools.length > 0) {
      markdown += '## Other Tools\n\n';
      for (var i = 0; i < otherTools.length; i++) {
        var prompt = otherTools[i];
        var placeholders = extractPlaceholders(prompt.prompt_text);
        markdown += '### ' + formatToolName(prompt.tool_name) + '\n\n';
        markdown += '**Tool Name:** `' + prompt.tool_name + '`\n\n';
        markdown += '**Model:** ' + (prompt.model || 'gpt-4-turbo') + '\n\n';
        markdown += '**Parameters:** max_tokens=' + (prompt.max_tokens || 1000) + ', temperature=' + (prompt.temperature || 0.7) + '\n\n';
        
        if (placeholders.length > 0) {
          var placeholderList = '';
          for (var j = 0; j < placeholders.length; j++) {
            placeholderList += '{{' + placeholders[j] + '}}';
            if (j < placeholders.length - 1) placeholderList += ', ';
          }
          markdown += '**Available Placeholders:** ' + placeholderList + '\n\n';
        } else {
          markdown += '**Available Placeholders:** None\n\n';
        }
        
        markdown += '**Prompt Text:**\n```\n' + prompt.prompt_text + '\n```\n\n';
        markdown += '---\n\n';
      }
    }
    
    // Summary
    markdown += '## Summary\n\n';
    markdown += '**Total Prompts:** ' + prompts.length + '\n\n';
    
    var coreCount = 0;
    var miniCount = 0;
    for (var i = 0; i < prompts.length; i++) {
      if (coreTools.indexOf(prompts[i].tool_name) !== -1) coreCount++;
      if (miniTools.indexOf(prompts[i].tool_name) !== -1) miniCount++;
    }
    
    markdown += '**Core Tools:** ' + coreCount + '\n\n';
    markdown += '**Mini Tools:** ' + miniCount + '\n\n';
    markdown += '**Other Tools:** ' + otherTools.length + '\n\n';
    
    // All placeholders used across all prompts
    var allPlaceholders = new Set();
    for (var i = 0; i < prompts.length; i++) {
      var placeholders = extractPlaceholders(prompts[i].prompt_text);
      for (var j = 0; j < placeholders.length; j++) {
        allPlaceholders.add(placeholders[j]);
      }
    }
    
    var allPlaceholdersArray = Array.from(allPlaceholders).sort();
    var allPlaceholdersList = '';
    for (var i = 0; i < allPlaceholdersArray.length; i++) {
      allPlaceholdersList += '{{' + allPlaceholdersArray[i] + '}}';
      if (i < allPlaceholdersArray.length - 1) allPlaceholdersList += ', ';
    }
    
    markdown += '**All Placeholders Used:** ' + allPlaceholdersList + '\n\n';
    
    // Create and download the markdown file
    var blob = new Blob([markdown], { type: 'text/markdown' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'current_system_prompts.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('✅ Markdown file downloaded: current_system_prompts.md');
    console.log('📊 Summary:', {
      totalPrompts: prompts.length,
      coreTools: coreCount,
      miniTools: miniCount,
      otherTools: otherTools.length,
      allPlaceholders: allPlaceholdersArray
    });
    
    return prompts;
    
  } catch (error) {
    console.error('❌ Error fetching system prompts:', error);
    throw error;
  }
}

// Run the function
getAllSystemPrompts().catch(function(error) {
  console.error(error);
}); 