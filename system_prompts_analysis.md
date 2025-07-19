# System Prompts Analysis - Team Context Placeholders

## 🔍 **Current Tools Using System Prompts**

Based on the backend code analysis, the following tools are currently using system prompts from the `ai_system_prompts` table:

### **Core Rhythm90 Tools**
1. `play_builder` - Play Builder
2. `signal_lab` - Signal Lab  
3. `ritual_guide` - Ritual Guide
4. `quarterly_planner` - Quarterly Planner

### **Mini Tools**
5. `plain_english_translator` - Plain English Translator
6. `get_to_by_generator` - Get To By Generator
7. `creative_tension_finder` - Creative Tension Finder
8. `persona_generator` - Persona Generator
9. `journey_builder` - Journey Builder
10. `test_learn_scale` - Test Learn Scale
11. `agile_sprint_planner` - Agile Sprint Planner
12. `connected_media_matrix` - Connected Media Matrix
13. `synthetic_focus_group` - Synthetic Focus Group

## ✅ **Tools Already Updated with Team Context**

From our previous work, these tools have been updated to include team context placeholders:

1. **Signal Lab** ✅ - Updated with `{{industry}}`, `{{focus_areas}}`, `{{team_description}}`
2. **Play Builder** ✅ - Already using team context injection
3. **Quarterly Planner** ✅ - Updated with team context placeholders
4. **Ritual Guide** ✅ - Updated with team context placeholders
5. **Plain English Translator** ✅ - Updated with team context placeholders
6. **Get To By Generator** ✅ - Updated with team context placeholders
7. **Creative Tension Finder** ✅ - Updated with team context placeholders
8. **Persona Generator** ✅ - Updated with team context placeholders

## 🔄 **Tools Still Need Updates**

These tools need to be updated with team context placeholders:

1. **Journey Builder** - Needs `{{industry}}`, `{{focus_areas}}`, `{{team_description}}`
2. **Test Learn Scale** - Needs `{{industry}}`, `{{focus_areas}}`, `{{team_description}}`
3. **Agile Sprint Planner** - Needs `{{industry}}`, `{{focus_areas}}`, `{{team_description}}`
4. **Connected Media Matrix** - Needs `{{industry}}`, `{{focus_areas}}`, `{{team_description}}`
5. **Synthetic Focus Group** - Needs `{{industry}}`, `{{focus_areas}}`, `{{team_description}}`

## 📋 **Action Required**

### **Option 1: Update Remaining Tools (Recommended)**
Update the remaining 5 tools to include team context placeholders in their system prompts.

### **Option 2: Verify Current Prompts**
Check the current system prompts in the database to see if any of the "already updated" tools actually need the placeholders added to their prompt text.

## 🔧 **How to Check Current Prompts**

1. Go to https://rhythm90.io/app/admin/prompts
2. Look for each tool in the list
3. Check if the prompt text contains the team context placeholders:
   - `{{industry}}`
   - `{{focus_areas}}`
   - `{{team_description}}`

## 📝 **Next Steps**

1. **Verify current prompts** in the admin panel
2. **Update remaining tools** that don't have team context placeholders
3. **Test the tools** to ensure team context is being passed correctly

## 🎯 **Expected Result**

After updates, all 13 tools should:
- Have team context placeholders in their system prompts
- Receive team data (industry, focus_areas, team_description) from the backend
- Provide more contextual and relevant AI responses based on the team's specific context 