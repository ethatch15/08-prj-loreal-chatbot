/* ------------------------------------------------------------
   L'Oréal Smart Product Advisor — chat code
   ------------------------------------------------------------ */

/* DOM elements: grab the parts of the page we need to work with */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

/* The address of your Cloudflare Worker.
   The Worker holds the OpenAI API key and forwards our request to
   OpenAI's Chat Completions API, so no key ever goes in this file.
   This URL is safe to share — it is NOT the API key. */
const WORKER_URL = "https://loreal-chatbot.ethatch15.workers.dev/";

/* The system prompt tells the AI who it is and what it may talk about.
   It is sent first, before the user's message, on every request. */
const systemPrompt = `You are the L'Oréal Smart Product Advisor, a friendly and knowledgeable beauty assistant.

Your job:
- Help users discover and understand L'Oréal products across makeup, skincare, haircare, and fragrance.
- Build simple, personalized beauty routines and product recommendations based on what the user tells you (skin type, hair type, concerns, preferences).
- Answer general beauty questions (ingredients, how to apply a product, routine order) and connect them back to L'Oréal products when it makes sense.

Rules:
- Only answer questions about L'Oréal products, beauty routines, recommendations, and related beauty topics.
- If a question is unrelated (for example: math homework, sports, coding, politics), politely say you can only help with L'Oréal beauty products and routines, and invite the user to ask a beauty question instead.
- Do not make up products. If you are not sure a product exists, say so.
- Do not give medical advice. For serious skin conditions, suggest seeing a dermatologist.
- Keep answers short, clear, and friendly. Use short lists for routines.`;

/* addMessage() puts one message on the screen.
   role is "user" or "ai" — it matches the .msg.user / .msg.ai styles in style.css.
   It returns the new element so we can change its text later. */
function addMessage(role, text) {
  // Create a new <div> for the message
  const messageDiv = document.createElement("div");

  // Give it the classes "msg" and "user" (or "ai") for styling
  messageDiv.classList.add("msg", role);

  // Use textContent (not innerHTML) so the text is shown exactly as written
  messageDiv.textContent = text;

  // Add the message to the chat window
  chatWindow.appendChild(messageDiv);

  // Scroll to the bottom so the newest message is visible
  chatWindow.scrollTop = chatWindow.scrollHeight;

  return messageDiv;
}

// Show a greeting when the page first loads
addMessage("ai", "👋 Hello! I'm your L'Oréal Smart Product Advisor. Ask me about products or routines!");

/* Handle form submit: this runs when the user presses Enter or clicks Send */
chatForm.addEventListener("submit", async (e) => {
  // Stop the page from reloading (the default form behavior)
  e.preventDefault();

  // 1. Capture what the user typed (trim removes extra spaces)
  const question = userInput.value.trim();

  // If the box is empty, do nothing
  if (!question) {
    return;
  }

  // Show the user's message in the chat window
  addMessage("user", `You: ${question}`);

  // Clear the input box so it's ready for the next question
  userInput.value = "";

  // Show a "thinking" message while we wait for the AI
  const replyDiv = addMessage("ai", "Thinking…");

  try {
    // 2. Send the request to the Cloudflare Worker.
    // The body has a "messages" array: the system prompt first, then the user's question.
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
      }),
    });

    // Turn the response into a JavaScript object
    const data = await response.json();

    // If OpenAI sent back an error (bad key, no credits, etc.), show it
    if (data.error) {
      replyDiv.textContent = `⚠️ ${data.error.message}`;
      return;
    }

    // 3. Pull the AI's reply out of the response and show it
    const reply = data.choices[0].message.content;
    replyDiv.textContent = reply;
  } catch (error) {
    // If anything goes wrong (bad URL, no internet, etc.), tell the user
    console.error("Chat request failed:", error);
    replyDiv.textContent =
      "Sorry, I couldn't connect right now. Please try again in a moment.";
  }

  // Scroll down again in case the reply is long
  chatWindow.scrollTop = chatWindow.scrollHeight;
});
