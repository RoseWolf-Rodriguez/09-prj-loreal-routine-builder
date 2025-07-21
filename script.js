/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Track selected products */
const selectedProducts = [];

/* Toggle product selection */
function toggleProductSelection(product, cardElement) {
  const productIndex = selectedProducts.findIndex(
    (p) => p.name === product.name
  );

  if (productIndex === -1) {
    // Add product if not already selected
    selectedProducts.push(product);
    cardElement.classList.add("selected"); // Add selected class
  } else {
    // Remove product if already selected
    selectedProducts.splice(productIndex, 1);
    cardElement.classList.remove("selected"); // Remove selected class
  }

  updateSelectedProducts();
}

/* Update the Selected Products section */
function updateSelectedProducts() {
  const selectedProductsList = document.getElementById("selectedProductsList");

  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = `<p>No products selected.</p>`;
  } else {
    selectedProductsList.innerHTML = selectedProducts
      .map(
        (product) => `
      <div class="selected-product" data-name="${product.name}">
        <img src="${product.image}" alt="${product.name}">
        <p>${product.name}</p>
      </div>
    `
      )
      .join("");

    // Add click event listeners to remove products from the list
    const selectedProductElements =
      document.querySelectorAll(".selected-product");
    selectedProductElements.forEach((element) => {
      element.addEventListener("click", () => {
        const productName = element.getAttribute("data-name");
        const productIndex = selectedProducts.findIndex(
          (p) => p.name === productName
        );

        if (productIndex !== -1) {
          // Remove product from the selected list
          selectedProducts.splice(productIndex, 1);

          // Remove the "selected" class from the corresponding product card
          const productCard = document.querySelector(
            `.product-card[data-name="${productName}"]`
          );
          if (productCard) {
            productCard.classList.remove("selected");
          }

          // Update the selected products list
          updateSelectedProducts();
        }
      });
    });
  }
}

/* Create HTML for displaying product cards with click event */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card" data-name="${product.name}">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
        <p class="product-description">${product.description}</p> <!-- Add description -->
      </div>
    </div>
  `
    )
    .join("");

  // Add click event listeners to product cards
  const productCards = document.querySelectorAll(".product-card");
  productCards.forEach((card) => {
    card.addEventListener("click", () => {
      const productName = card.getAttribute("data-name");
      const product = products.find((p) => p.name === productName);
      toggleProductSelection(product, card);
    });
  });
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

/* Import the OpenAI API key from secrets.js */
// Ensure secrets.js is included in your HTML file before this script
// <script src="secrets.js"></script>
if (typeof OPENAI_API_KEY === "undefined") {
  console.error("OPENAI_API_KEY is not defined. Ensure secrets.js is loaded.");
}

/* Track conversation history */
const conversationHistory = [
  {
    role: "system",
    content: "You are a helpful assistant for skincare advice. You only respond with products by L'Oreal.",
  },
];

/* Handle "Generate Routine" button click */
const generateRoutineButton = document.getElementById("generateRoutine");
generateRoutineButton.addEventListener("click", async () => {
  if (selectedProducts.length === 0) {
    alert(
      "No products selected. Please select products to generate a routine."
    );
    return;
  }

  // Collect selected products
  const routineProducts = selectedProducts.map((product) => ({
    name: product.name,
    brand: product.brand,
    category: product.category,
    description: product.description,
  }));

  // Add user message to conversation history
  conversationHistory.push({
    role: "user",
    content: `Here are the selected products: ${JSON.stringify(
      routineProducts
    )}`,
  });

  // Show loading message
  chatWindow.innerHTML = "Generating your routine...";

  try {
    // Make API request to OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: conversationHistory,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    // Parse the response
    const data = await response.json();

    // Add assistant response to conversation history
    if (data.choices && data.choices[0].message.content) {
      conversationHistory.push({
        role: "assistant",
        content: data.choices[0].message.content,
      });

      // Display the generated routine in the chat window
      chatWindow.innerHTML = `
        <h3>Your Routine:</h3>
        <p>${data.choices[0].message.content}</p>
        <p><em>You can ask follow-up questions below.</em></p>
      `;
    } else {
      chatWindow.innerHTML = "Sorry, I couldn't generate a routine.";
    }
  } catch (error) {
    chatWindow.innerHTML =
      "An error occurred while generating the routine. Please try again.";
    console.error("Error:", error);
  }
});

/* Chat form submission handler - connects to OpenAI */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get user input and clear the input field
  const chatInput = document.getElementById("userInput");
  const userMessage = chatInput.value;
  chatInput.value = "";

  // Add user message to conversation history
  conversationHistory.push({ role: "user", content: userMessage });

  // Show user message in chat window
  chatWindow.innerHTML += `<p><strong>You:</strong> ${userMessage}</p>`;
  chatWindow.innerHTML += `<p>Thinking...</p>`;

  try {
    // Make API request to OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: conversationHistory,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    // Parse the response
    const data = await response.json();

    // Add assistant response to conversation history
    if (data.choices && data.choices[0].message.content) {
      conversationHistory.push({
        role: "assistant",
        content: data.choices[0].message.content,
      });

      // Display the assistant's response in the chat window
      chatWindow.innerHTML += `<p><strong>Assistant:</strong> ${data.choices[0].message.content}</p>`;
    } else {
      chatWindow.innerHTML += `<p><strong>Assistant:</strong> Sorry, I couldn't understand that.</p>`;
    }
  } catch (error) {
    chatWindow.innerHTML += `<p><strong>Assistant:</strong> An error occurred. Please try again.</p>`;
    console.error("Error:", error);
  }
});
