// script.js

let foodDatabase = [];
let categoriesSlovak = new Set();

// Initialize carbUnitSize (assuming a default value)
let carbUnitSize = 10;

// Load the food database from the CSV file
function loadFoodDatabase() {
    fetch('table.csv')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.text();
        })
        .then(data => {
            console.log('CSV Data Loaded Successfully');
            const lines = data.trim().split('\n');
            const headers = lines[0].split(',').map(header => header.trim());

            // Validate headers
            const expectedHeaders = ["nameSlovak", "categorySlovak", "nameEnglish", "categoryEnglish", "carbsPer100g"];
            const missingHeaders = expectedHeaders.filter(header => !headers.includes(header));
            if (missingHeaders.length > 0) {
                throw new Error('Missing headers in CSV: ' + missingHeaders.join(', '));
            }

            console.log('Headers:', headers);

            for (let i = 1; i < lines.length; i++) {
                const currentLine = splitCSVLine(lines[i]);
                if (currentLine.length === headers.length) {
                    let food = {};
                    headers.forEach((header, index) => {
                        food[header] = currentLine[index].trim();
                    });
                    // Convert carbsPer100g to number
                    food.carbsPer100g = parseFloat(food.carbsPer100g);
                    if (isNaN(food.carbsPer100g)) {
                        console.warn(`Invalid carbsPer100g for item "${food.nameSlovak}" at line ${i + 1}. Setting to 0.`);
                        food.carbsPer100g = 0;
                    }
                    // Populate categories set
                    categoriesSlovak.add(food.categorySlovak);
                    // Add to database
                    foodDatabase.push(food);
                    console.log(`Loaded Food Item:`, food);
                } else {
                    console.warn(`Skipping line ${i + 1}: Incorrect number of columns.`);
                }
            }
            console.log('All Food Items Loaded:', foodDatabase);
            populateCategories();
        })
        .catch(error => {
            console.error('Error loading food database:', error);
        });
}

// Helper function to split CSV lines, handling commas inside quotes
function splitCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let char of line) {
        if (char === '"' ) {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

// Populate the category selector with Slovak categories
function populateCategories() {
    const categorySelect = document.getElementById("categorySelect");
    categoriesSlovak.forEach(category => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
}

// Populate items based on selected category
function populateItems() {
    const category = document.getElementById("categorySelect").value;
    const itemSelect = document.getElementById("itemSelect");
    itemSelect.innerHTML = '<option value="">-- Vyberte položku --</option>';

    if (category === "") return;

    const filteredFoods = foodDatabase.filter(food => food.categorySlovak === category);
    filteredFoods.forEach(food => {
        const option = document.createElement("option");
        option.value = food.nameSlovak;
        option.textContent = food.nameSlovak;
        itemSelect.appendChild(option);
    });
}

// Handle item selection from dropdown
function selectItemFromDropdown() {
    const selectedName = document.getElementById("itemSelect").value;
    const selectedFood = foodDatabase.find(food => food.nameSlovak === selectedName);
    if (selectedFood) {
        document.getElementById("foodSearch").value = selectedFood.nameSlovak;
        document.getElementById("carbPer100g").value = selectedFood.carbsPer100g;
        document.getElementById("suggestionBox").style.display = "none";
        toggleCategorySelectors(false);
        updateWeightFromCarbUnits();
        updateCarbUnitsFromWeight();
    }
}

// Search functionality with relevance and alphabetical sorting
function searchFood() {
    const query = document.getElementById("foodSearch").value.toLowerCase().trim();
    const box = document.getElementById("suggestionBox");
    box.innerHTML = '';

    console.log(`User Query: "${query}"`); // Debugging log

    if (query.length === 0) {
        box.style.display = "none";
        return;
    }

    // Filter suggestions based on the query
    let suggestions = foodDatabase.filter(food => food.nameSlovak.toLowerCase().includes(query));

    console.log(`Suggestions Found:`, suggestions); // Debugging log

    if (suggestions.length === 0) {
        box.style.display = "none";
        return;
    }

    // Define relevance
    suggestions = suggestions.map(food => {
        let relevance = 0;
        if (food.nameSlovak.toLowerCase().startsWith(query)) {
            relevance = 2; // Highest relevance
        } else if (food.nameSlovak.toLowerCase().includes(query)) {
            relevance = 1; // Lower relevance
        }
        return { ...food, relevance };
    });

    console.log(`Suggestions with Relevance:`, suggestions); // Debugging log

    // Sort suggestions first by relevance (descending), then alphabetically
    suggestions.sort((a, b) => {
        if (b.relevance !== a.relevance) {
            return b.relevance - a.relevance; // Higher relevance first
        }
        // If relevance is the same, sort alphabetically
        return a.nameSlovak.localeCompare(b.nameSlovak);
    });

    console.log(`Sorted Suggestions:`, suggestions); // Debugging log

    // Limit to first 10 suggestions
    suggestions.slice(0, 10).forEach(food => {
        // Highlight the matching part
        const regex = new RegExp(`(${escapeRegex(query)})`, 'i');
        const highlightedName = food.nameSlovak.replace(regex, `<strong>$1</strong>`);

        box.innerHTML += `
            <button type="button" class="list-group-item list-group-item-action" onclick="selectFoodFromSuggestion('${escapeQuotes(food.nameSlovak)}', ${food.carbsPer100g})">
                ${highlightedName}
            </button>
        `;
    });

    box.style.display = "block"; // Show the suggestion box
}

// Escape single quotes in food names to prevent issues in onclick
function escapeQuotes(str) {
    return str.replace(/'/g, "\\'");
}

// Escape special characters for regex
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape regex characters
}

// Called when user clicks one of the suggestions
function selectFoodFromSuggestion(name, carbs) {
    document.getElementById("foodSearch").value = name;  // fill search box
    document.getElementById("carbPer100g").value = carbs; // set carbs
    document.getElementById("suggestionBox").style.display = "none"; // Hide suggestion box

    // Hide category selectors if visible
    toggleCategorySelectors(false);

    updateWeightFromCarbUnits();
    updateCarbUnitsFromWeight();
}

// Toggle Category Selectors
function toggleCategorySelectors(show = null) {
    const categorySelectors = document.getElementById("categorySelectors");
    const showBtn = document.getElementById("showCategoryBtn");

    if (show === null) { // Toggle
        if (categorySelectors.classList.contains('d-none')) {
            categorySelectors.classList.remove('d-none');
            // Trigger CSS transition
            setTimeout(() => {
                categorySelectors.classList.add('show');
            }, 10);
            showBtn.textContent = "Skryť výber podľa kategórie";
        } else {
            categorySelectors.classList.remove('show');
            // Wait for transition to complete before hiding
            setTimeout(() => {
                categorySelectors.classList.add('d-none');
            }, 500); // Duration matches CSS transition
            showBtn.textContent = "Vybrať podľa kategórie";
        }
    } else if (show) { // Show
        categorySelectors.classList.remove('d-none');
        setTimeout(() => {
            categorySelectors.classList.add('show');
        }, 10);
        showBtn.textContent = "Skryť výber podľa kategórie";
    } else { // Hide
        categorySelectors.classList.remove('show');
        setTimeout(() => {
            categorySelectors.classList.add('d-none');
        }, 500);
        showBtn.textContent = "Vybrať podľa kategórie";
    }
}

// Advanced Settings Logic
document.getElementById("advancedSettingsForm").addEventListener("submit", function(event) {
    event.preventDefault(); // Prevent form submission

    const carbUnitInput = document.getElementById("carbUnitSize");
    const newSize = parseFloat(carbUnitInput.value);

    if (isNaN(newSize) || newSize < 1) {
        alert("Prosím, zadajte platnú veľkosť sacharidovej jednotky (minimálne 1 g).");
        return;
    }

    carbUnitSize = newSize;
    alert(`Veľkosť sacharidovej jednotky bola nastavená na ${carbUnitSize} g.`);

    // Close the modal using Bootstrap's Modal API
    const advancedSettingsModal = bootstrap.Modal.getInstance(document.getElementById('advancedSettingsModal'));
    advancedSettingsModal.hide();

    // Display the current carb unit size if changed from default
    displayCarbUnit();
    resetAll();
});

// Display Carb Unit Size
function displayCarbUnit() {
    const display = document.getElementById("carbUnitDisplay");
    const currentDisplay = document.getElementById("currentCarbUnit");
    if (carbUnitSize !== 10) { // If changed from default
        currentDisplay.textContent = carbUnitSize;
        display.classList.remove('d-none');
    } else {
        display.classList.add('d-none');
    }
}

// “Currency Exchange” Logic
function handleCarbPer100gChange() {
    // Reset search and selectors if carbPer100g is manually changed
    document.getElementById("foodSearch").value = "";
    toggleCategorySelectors(false);
    document.getElementById("categorySelect").value = "";
    document.getElementById("itemSelect").innerHTML = '<option value="">-- Vyberte položku --</option>';

    updateWeightFromCarbUnits();
    updateCarbUnitsFromWeight();
}

// From carbUnits => update foodWeight
function updateWeightFromCarbUnits() {
    const carbPer100g = parseFloat(document.getElementById("carbPer100g").value);
    const carbUnits = parseFloat(document.getElementById("carbUnits").value);

    if (!isNaN(carbPer100g) && carbPer100g > 0 && !isNaN(carbUnits)) {
        const computedWeight = (carbUnits * carbUnitSize * 100) / carbPer100g;
        document.getElementById("foodWeight").value = computedWeight.toFixed(2);
    }
    if (isNaN(carbPer100g) || carbPer100g <= 0 || isNaN(carbUnits)) {
        document.getElementById("foodWeight").value = "";
    }
}

// From foodWeight => update carbUnits
function updateCarbUnitsFromWeight() {
    const carbPer100g = parseFloat(document.getElementById("carbPer100g").value);
    const foodWeight = parseFloat(document.getElementById("foodWeight").value);

    if (!isNaN(carbPer100g) && carbPer100g > 0 && !isNaN(foodWeight)) {
        const computedUnits = (foodWeight * carbPer100g) / (carbUnitSize * 100);
        document.getElementById("carbUnits").value = computedUnits.toFixed(2);
    }
    if (isNaN(carbPer100g) || carbPer100g <= 0 || isNaN(foodWeight)) {
        document.getElementById("carbUnits").value = "";
    }
}

// Prevent Non-Numeric Input
function preventNonNumericInput() {
    const numberFields = document.querySelectorAll('input[type="number"]');
    numberFields.forEach(field => {
        field.addEventListener('keypress', function(e) {
            const char = String.fromCharCode(e.which);
            if (!/[0-9.\-]/.test(char)) {
                e.preventDefault();
            }
        });
    });
}

// Call preventNonNumericInput on page load
document.addEventListener('DOMContentLoaded', preventNonNumericInput);

// Reset all input fields and results
function resetAll(){
    document.getElementById("carbPer100g").value = '';
    document.getElementById("carbUnits").value = '';
    document.getElementById("foodWeight").value = '';
    document.getElementById("exchangeResult").innerText = '';
    document.getElementById("foodSearch").value = '';
    document.getElementById("categorySelect").value = '';
    document.getElementById("itemSelect").value = '';
}

// Load the food database when the page loads
document.addEventListener('DOMContentLoaded', loadFoodDatabase);
