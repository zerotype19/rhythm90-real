// Script to update the Play Builder system prompt with enhanced version
// Run this with: node update_play_builder_prompt.js

const API_BASE = 'https://api.rhythm90.io';

// Enhanced Play Builder system prompt with the two suggestions
const enhancedPrompt = `You are the Rhythm90 Play Builder assistant — here to help teams turn rough ideas into sharp, testable plays.

Your job:
Help shape a play that is clear, focused, and ready to run within a 90-day cycle.

What makes a strong Rhythm90 play:
1 Written as: We believe [action] for [audience/context] will result in [outcome] because [signal/reasoning].
2 Small enough to test inside a quarter, big enough to generate real learning.
3 Anchored in a real signal or insight — not just an internal opinion.
4 Assigned to a clear owner.
5 Includes what signals to watch (not just KPIs), so the team knows what learning to capture.

Provided context:
Industry: {{industry}}
Focus Areas: {{focus_areas}}
Team Description: {{team_description}}

Play Idea: {{play_idea}}
Why This Play: {{observed_signal}}
Target Outcome: {{target_outcome}}
Signals to Watch: {{signals_to_watch}}
Owner Role: {{owner_role}}
Additional Notes: {{additional_context}}

Instructions:
1 Draft a clear, testable play hypothesis using the formula:
"We believe [action] for [audience/context] will result in [outcome] because [signal/reasoning]."

2 Output a Play Canvas Summary with:
- Play Name (short, action-oriented title)
- Owner Role
- Target Outcome
- Why This Play (observed signal)
- How We'll Run It (based on play idea and context)
- Signals to Watch (clues or indicators to observe)

3 Keep the language clear, practical, and no-fluff — this is for real-world team use, not a presentation deck.

4 Avoid vague buzzwords; focus on specific, actionable phrasing the team can immediately apply.

5 Return your response as JSON with these exact field names:
{
  "hypothesis": "We believe...",
  "how_to_run_summary": "...",
  "signals_to_watch": ["signal1", "signal2"],
  "owner_role": "...",
  "what_success_looks_like": "...",
  "next_recommendation": ["rec1", "rec2"]
}

6 Signals to Watch should include both quantitative (metrics) and qualitative (feedback, observations) indicators that will tell you if the play is working.`;

async function updatePlayBuilderPrompt() {
  try {
    console.log('🔍 Fetching current system prompts...');
    
    // First, get all system prompts to find the Play Builder one
    const response = await fetch(`${API_BASE}/api/admin/system-prompts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Note: This script requires admin authentication
        // You'll need to add proper authentication headers
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch system prompts: ${response.status}`);
    }

    const prompts = await response.json();
    const playBuilderPrompt = prompts.find((p: any) => p.tool_name === 'play_builder');
    
    if (!playBuilderPrompt) {
      throw new Error('Play Builder system prompt not found');
    }

    console.log('📝 Found Play Builder prompt, updating...');
    console.log('Current ID:', playBuilderPrompt.id);

    // Update the prompt
    const updateResponse = await fetch(`${API_BASE}/api/admin/system-prompts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: This script requires admin authentication
        // You'll need to add proper authentication headers
      },
      body: JSON.stringify({
        id: playBuilderPrompt.id,
        prompt_text: enhancedPrompt,
        model: playBuilderPrompt.model || 'gpt-4-turbo',
        max_tokens: playBuilderPrompt.max_tokens || 1000,
        temperature: playBuilderPrompt.temperature || 0.7,
        top_p: playBuilderPrompt.top_p || 1.0,
        frequency_penalty: playBuilderPrompt.frequency_penalty || 0.0,
        presence_penalty: playBuilderPrompt.presence_penalty || 0.0
      })
    });

    if (!updateResponse.ok) {
      throw new Error(`Failed to update system prompt: ${updateResponse.status}`);
    }

    const result = await updateResponse.json();
    console.log('✅ Play Builder system prompt updated successfully!');
    console.log('Result:', result);

  } catch (error) {
    console.error('❌ Error updating Play Builder prompt:', error);
    console.log('\n📋 Manual Update Instructions:');
    console.log('1. Go to the admin panel at /app/admin/system-prompts');
    console.log('2. Find the "Play Builder" prompt');
    console.log('3. Click "Edit" and replace the prompt text with:');
    console.log('\n' + enhancedPrompt);
    console.log('\n4. Save the changes');
  }
}

// Note: This script requires admin authentication
// For security reasons, it's better to update via the admin interface
console.log('🚨 This script requires admin authentication.');
console.log('📋 Please use the admin interface instead:');
console.log('1. Go to /app/admin/system-prompts');
console.log('2. Find "Play Builder" and click "Edit"');
console.log('3. Replace with the enhanced prompt below:');
console.log('\n' + '='.repeat(80));
console.log(enhancedPrompt);
console.log('='.repeat(80));

// Uncomment the line below if you have proper authentication set up
// updatePlayBuilderPrompt(); 