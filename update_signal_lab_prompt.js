// Script to update the Signal Lab system prompt
// Run this in the browser console on the admin page or via API

const newSignalLabPrompt = `You are the Rhythm90 Signal Lab assistant — here to help teams turn messy observations or scattered data into clear, meaningful signals they can act on.

Your job:
✅ Spot surprises, friction points, and meaningful patterns — not just summarize metrics.
✅ Explain why each signal matters and what it suggests for current or future plays.
✅ Make each signal specific, actionable, and tied to real-world work.
✅ Connect insights to the team's context, goals, and challenges, so they know why it's worth paying attention.

Provided context:
Observation: {{observation}}
Context: {{context}}
Team Industry: {{team_industry}}
Focus Areas: {{focus_areas}}
Team Description: {{team_description}}

Instructions:
1. Identify what stands out in the observation (surprise, friction, pattern).
2. Explain why it matters — what does it tell us, what assumption does it challenge?
3. Suggest what the team might do next (test, explore, adjust, investigate).
4. Output format:
- **Signal Summary**: one or two sentences
- **Why It Matters**: one paragraph
- **Possible Next Step**: one actionable suggestion

Tone:
Friendly, sharp, plainspoken — like a teammate helping the team get smarter.`;

// Function to update the system prompt
async function updateSignalLabPrompt() {
  try {
    // First, get the current system prompts to find the Signal Lab prompt ID
    const response = await fetch('/api/admin/system-prompts', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch system prompts: ${response.status}`);
    }

    const prompts = await response.json();
    const signalLabPrompt = prompts.find((p: any) => p.tool_name === 'signal_lab');

    if (!signalLabPrompt) {
      console.error('Signal Lab system prompt not found in database');
      return;
    }

    console.log('Found Signal Lab prompt:', signalLabPrompt);

    // Update the system prompt
    const updateResponse = await fetch(`/api/admin/system-prompts/${signalLabPrompt.id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt_text: newSignalLabPrompt,
        model: signalLabPrompt.model || 'gpt-4',
        max_tokens: signalLabPrompt.max_tokens || 1000,
        temperature: signalLabPrompt.temperature || 0.7,
        top_p: signalLabPrompt.top_p || 1,
        frequency_penalty: signalLabPrompt.frequency_penalty || 0,
        presence_penalty: signalLabPrompt.presence_penalty || 0,
      }),
    });

    if (!updateResponse.ok) {
      throw new Error(`Failed to update system prompt: ${updateResponse.status}`);
    }

    const result = await updateResponse.json();
    console.log('Successfully updated Signal Lab system prompt:', result);
    
  } catch (error) {
    console.error('Error updating Signal Lab system prompt:', error);
  }
}

// Instructions for running this script
console.log(`
=== Signal Lab System Prompt Update Script ===

To update the Signal Lab system prompt:

1. Open the browser console on the admin page (https://rhythm90.io/app/admin)
2. Copy and paste this entire script
3. Run: updateSignalLabPrompt()

The new prompt will:
- Use the enhanced structure with Signal Summary, Why It Matters, and Possible Next Step
- Include team context (industry, focus_areas, team_description) automatically
- Provide clearer guidance for actionable signal interpretation

New prompt structure:
${newSignalLabPrompt}
`);

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { updateSignalLabPrompt, newSignalLabPrompt };
} 