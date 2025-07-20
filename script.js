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
      <div class="selected-product">
        <img src="${product.image}" alt="${product.name}">
        <p>${product.name}</p>
      </div>
    `
      )
      .join("");
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

/* Chat form submission handler - connects to OpenAI */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get user input and clear the input field
  const chatInput = document.getElementById("chatInput");
  const userMessage = chatInput.value;
  chatInput.value = "";

  // Show loading message
  chatWindow.innerHTML = "Thinking...";

  try {
    // Make API request to OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o", // Use the gpt-4o model
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant for skincare advice.",
          },
          { role: "user", content: userMessage },
        ],
      }),
    });

    // Parse the response
    const data = await response.json();

    // Display the assistant's response in the chat window
    if (data.choices && data.choices[0].message.content) {
      chatWindow.innerHTML = data.choices[0].message.content;
    } else {
      chatWindow.innerHTML = "Sorry, I couldn't understand that.";
    }
  } catch (error) {
    // Handle errors
    chatWindow.innerHTML = "An error occurred. Please try again.";
    console.error("Error:", error);
  }
});
