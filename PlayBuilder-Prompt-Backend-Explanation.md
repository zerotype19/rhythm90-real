# Rhythm90 Play Builder: Backend Prompt Assembly & Field Handling

## 1️⃣ Current System Message

**System message sent to OpenAI:**

```
You are a Rhythm90 Play Builder assistant.

Your job is to help teams turn rough ideas into sharp, testable plays using the Rhythm90 framework.

A Play should:
- Follow the format: We believe [action] for [audience/context] will result in [outcome] because [reasoning].
- Be small enough to test inside a quarter, big enough to generate meaningful learning.
- Be tied to a real signal, not just a business opinion.
- Assign clear ownership.
- Include guidance on what signals to watch, not just KPIs.
```

---

## 2️⃣ Backend-Assembled Prompt (System + User Messages)

**If new fields are present, the backend assembles the prompt as follows:**

- **System message** (above)
- **User message 1:**  
  ```
  Context:
  Team Type: B2B
  Quarter Focus: Retention
  Top Signal: High churn at onboarding
  Owner Role: Strategic Lead
  ```
- **User message 2:**  
  ```
  Help us shape a Play for this idea: Improve CRM onboarding flow to reduce churn.
  ```
- **User message 3:**  
  ```
  Please return your answer with the following sections:
  1. Hypothesis (in Rhythm90 framing)
  2. How-to-Run Summary (small plan, big impact)
  3. Signals to Watch (what surprises or confirms progress)
  4. Owner Role (who leads, who contributes)
  5. What Success Looks Like (what learning or behavior shift, not just KPI)

  Tailor your output to the Owner Role if specified.
  ```

**All new input fields are included every time if present.**

---

## 3️⃣ Confirmation of Input Field Handling

- **team_type, quarter_focus, top_signal, owner_role**:  
  Included in the first user message as labeled context lines.
- **idea_prompt**:  
  Included in the second user message as the core idea.
- **All fields are passed as part of the user messages.**
- **Legacy fields** are only used if new fields are missing.

---

## 4️⃣ Real Example: AI Input → Output

**Example Input (as sent to OpenAI):**
```json
[
  {
    "role": "system",
    "content": "You are a Rhythm90 Play Builder assistant.\n\nYour job is to help teams turn rough ideas into sharp, testable plays using the Rhythm90 framework.\n\nA Play should:\n- Follow the format: We believe [action] for [audience/context] will result in [outcome] because [reasoning].\n- Be small enough to test inside a quarter, big enough to generate meaningful learning.\n- Be tied to a real signal, not just a business opinion.\n- Assign clear ownership.\n- Include guidance on what signals to watch, not just KPIs."
  },
  {
    "role": "user",
    "content": "Context:\nTeam Type: B2B\nQuarter Focus: Retention\nTop Signal: High churn at onboarding\nOwner Role: Strategic Lead"
  },
  {
    "role": "user",
    "content": "Help us shape a Play for this idea: Improve CRM onboarding flow to reduce churn."
  },
  {
    "role": "user",
    "content": "Please return your answer with the following sections:\n1. Hypothesis (in Rhythm90 framing)\n2. How-to-Run Summary (small plan, big impact)\n3. Signals to Watch (what surprises or confirms progress)\n4. Owner Role (who leads, who contributes)\n5. What Success Looks Like (what learning or behavior shift, not just KPI)\n\nTailor your output to the Owner Role if specified."
  }
]
```

**Example Raw AI Response:**
```
1. Hypothesis (in Rhythm90 framing)
We believe that streamlining the CRM onboarding process for new B2B clients will reduce churn at the onboarding stage by 20% within the quarter because a simpler, more guided experience will help clients realize value faster and avoid early frustration.

2. How-to-Run Summary
- Map the current onboarding steps and identify friction points.
- Develop a simplified onboarding checklist and in-app guidance.
- Assign a Strategic Lead to oversee onboarding improvements and client feedback.
- Pilot the new onboarding flow with a subset of new clients.

3. Signals to Watch
- Drop-off rates at each onboarding step.
- Time to first value for new clients.
- Qualitative feedback from onboarding surveys.
- Support tickets related to onboarding.

4. Owner Role
Strategic Lead: Oversees the project, coordinates with product and customer success teams, and ensures feedback is incorporated.

5. What Success Looks Like
- 20% reduction in onboarding churn.
- Faster time to first value.
- Positive feedback from new clients.
- Fewer onboarding-related support tickets.
```

---

## 5️⃣ How Each Input Field Shapes Output

- **team_type**:  
  Guides the AI to tailor the play for the business model (e.g., B2B vs. B2C).
- **quarter_focus**:  
  Sets the strategic lens (e.g., retention, growth) for the play.
- **top_signal**:  
  Anchors the play to a real, observed metric or pain point (e.g., churn).
- **owner_role**:  
  Instructs the AI to specify who should lead and how the play is owned.
- **idea_prompt**:  
  The core idea or challenge to be addressed—central to the hypothesis and plan.

**All fields are included in the prompt to maximize relevance.**

---

## 6️⃣ Suggestions for Improving Input Relevance

- **Explicit Anchoring:**  
  Add a line to the system or user message:  
  “Always ensure your recommendations are directly tied to the user’s idea and top signal. Do not default to generic plays.”
- **Field Emphasis:**  
  Bold or repeat the most important fields (e.g., “The play MUST address: [idea_prompt] and [top_signal]”).
- **Negative Examples:**  
  Instruct the AI: “Do not suggest pricing changes unless the idea or signal is about pricing.”
- **Structured Output:**  
  Ask for output in JSON with explicit fields to make parsing and validation easier.

---

If you’d like to see the actual logs or a different real example, let me know! If you want to adjust the prompt for even tighter relevance, I can suggest concrete prompt edits. 