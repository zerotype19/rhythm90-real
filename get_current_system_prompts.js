// Script to get all current system prompts from the ai_system_prompts table
// Run this in the browser console on the admin page: https://rhythm90.io/app/admin

async function getAllSystemPrompts() {
  console.log('Fetching all system prompts...');
  
  try {
    const response = await fetch('/api/admin/system-prompts', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const prompts = await response.json();
    console.log('Found prompts:', prompts.length);
    
    // Generate markdown content
    let markdown = '# Current System Prompts from ai_system_prompts Table\n\n';
    markdown += 'This document contains all current system prompts and their available placeholders.\n\n';
    
    // Group by tool type
    const coreTools = ['play_builder', 'signal_lab', 'ritual_guide', 'quarterly_planner'];
    const miniTools = ['plain_english_translator', 'get_to_by_generator', 'creative_tension_finder', 'persona_generator', 'journey_builder', 'test_learn_scale', 'agile_sprint_planner', 'connected_media_matrix', 'synthetic_focus_group'];
    
    // Helper function to extract placeholders
    function extractPlaceholders(promptText) {
      const placeholderRegex = /\{\{([^}]+)\}\}/g;
      const placeholders = new Set();
      let match;
      
      while ((match = placeholderRegex.exec(promptText)) !== null) {
        placeholders.add(match[1]);
      }
      
      return Array.from(placeholders).sort();
    }
    
    // Helper function to format tool name
    function formatToolName(toolName) {
      return toolName.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
    
    // Core Rhythm90 Tools
    markdown += '## Core Rhythm90 Tools\n\n';
    prompts.forEach(prompt => {
      if (coreTools.includes(prompt.tool_name)) {
        const placeholders = extractPlaceholders(prompt.prompt_text);
        markdown += `### ${formatToolName(prompt.tool_name)}\n\n`;
        markdown += `**Tool Name:** \`${prompt.tool_name}\`\n\n`;
        markdown += `**Model:** ${prompt.model || 'gpt-4-turbo'}\n\n`;
        markdown += `**Parameters:** max_tokens=${prompt.max_tokens || 1000}, temperature=${prompt.temperature || 0.7}\n\n`;
        markdown += `**Available Placeholders:** ${placeholders.length > 0 ? placeholders.map(p => \`{{${p}}}\`).join(', ') : 'None'}\n\n`;
        markdown += `**Prompt Text:**\n\`\`\`\n${prompt.prompt_text}\n\`\`\`\n\n`;
        markdown += '---\n\n';
      }
    });
    
    // Mini Tools
    markdown += '## Mini Tools\n\n';
    prompts.forEach(prompt => {
      if (miniTools.includes(prompt.tool_name)) {
        const placeholders = extractPlaceholders(prompt.prompt_text);
        markdown += `### ${formatToolName(prompt.tool_name)}\n\n`;
        markdown += `**Tool Name:** \`${prompt.tool_name}\`\n\n`;
        markdown += `**Model:** ${prompt.model || 'gpt-4-turbo'}\n\n`;
        markdown += `**Parameters:** max_tokens=${prompt.max_tokens || 1000}, temperature=${prompt.temperature || 0.7}\n\n`;
        markdown += `**Available Placeholders:** ${placeholders.length > 0 ? placeholders.map(p => \`{{${p}}}\`).join(', ') : 'None'}\n\n`;
        markdown += `**Prompt Text:**\n\`\`\`\n${prompt.prompt_text}\n\`\`\`\n\n`;
        markdown += '---\n\n';
      }
    });
    
    // Other tools (if any)
    const otherTools = prompts.filter(p => !coreTools.includes(p.tool_name) && !miniTools.includes(p.tool_name));
    if (otherTools.length > 0) {
      markdown += '## Other Tools\n\n';
      otherTools.forEach(prompt => {
        const placeholders = extractPlaceholders(prompt.prompt_text);
        markdown += `### ${formatToolName(prompt.tool_name)}\n\n`;
        markdown += `**Tool Name:** \`${prompt.tool_name}\`\n\n`;
        markdown += `**Model:** ${prompt.model || 'gpt-4-turbo'}\n\n`;
        markdown += `**Parameters:** max_tokens=${prompt.max_tokens || 1000}, temperature=${prompt.temperature || 0.7}\n\n`;
        markdown += `**Available Placeholders:** ${placeholders.length > 0 ? placeholders.map(p => \`{{${p}}}\`).join(', ') : 'None'}\n\n`;
        markdown += `**Prompt Text:**\n\`\`\`\n${prompt.prompt_text}\n\`\`\`\n\n`;
        markdown += '---\n\n';
      });
    }
    
    // Summary
    markdown += '## Summary\n\n';
    markdown += `**Total Prompts:** ${prompts.length}\n\n`;
    markdown += `**Core Tools:** ${prompts.filter(p => coreTools.includes(p.tool_name)).length}\n\n`;
    markdown += `**Mini Tools:** ${prompts.filter(p => miniTools.includes(p.tool_name)).length}\n\n`;
    markdown += `**Other Tools:** ${otherTools.length}\n\n`;
    
    // All placeholders used across all prompts
    const allPlaceholders = new Set();
    prompts.forEach(prompt => {
      const placeholders = extractPlaceholders(prompt.prompt_text);
      placeholders.forEach(p => allPlaceholders.add(p));
    });
    
    markdown += `**All Placeholders Used:** ${Array.from(allPlaceholders).sort().map(p => \`{{${p}}}\`).join(', ')}\n\n`;
    
    // Create and download the markdown file
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'current_system_prompts.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('✅ Markdown file downloaded: current_system_prompts.md');
    console.log('📊 Summary:', {
      totalPrompts: prompts.length,
      coreTools: prompts.filter(p => coreTools.includes(p.tool_name)).length,
      miniTools: prompts.filter(p => miniTools.includes(p.tool_name)).length,
      otherTools: otherTools.length,
      allPlaceholders: Array.from(allPlaceholders).sort()
    });
    
    return prompts;
    
  } catch (error) {
    console.error('❌ Error fetching system prompts:', error);
    throw error;
  }
}

// Run the function
getAllSystemPrompts().catch(console.error); 