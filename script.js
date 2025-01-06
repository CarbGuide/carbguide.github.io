// -----------------------------
//        FOOD DATABASE
// -----------------------------
// The food database is now loaded from table.csv via fetch

// -----------------------------
//      CARB UNIT SIZE
// -----------------------------
let carbUnitSize = 10; // Default value

// -----------------------------
//   INITIALIZE CATEGORY SELECT
// -----------------------------
document.addEventListener("DOMContentLoaded", function () {
    loadFoodDatabase();
    displayCarbUnit();
    // Prevent non-numeric input in number fields
    preventNonNumericInput();
});

// Variable to store food database
let foodDatabase = [];

// Function to load food database from CSV
function loadFoodDatabase() {
    fetch('table.csv')
        .then(response => response.text())
        .then(data => {
            const lines = data.trim().split('\n');
            const headers = lines[0].split(',');
            for (let i = 1; i < lines.length; i++) {
                const currentLine = lines[i].split(',');
                if (currentLine.length === headers.length) {
                    let food = {};
                    headers.forEach((header, index) => {
                        food[header.trim()] = currentLine[index].trim();
                    });
                    // Convert carbsPer100g to number
                    food.carbsPer100g = parseFloat(food.carbsPer100g);
                    foodDatabase.push(food);
                }
            }
            populateCategories();
        })
        .catch(error => {
            console.error('Error loading food database:', error);
        });
}

function populateCategories() {
    const categorySelect = document.getElementById("categorySelect");
    const categories = [...new Set(foodDatabase.map(food => food.category))].sort();

    categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
}

// -----------------------------
//   POPULATE ITEM SELECTOR
// -----------------------------
function populateItems() {
    const category = document.getElementById("categorySelect").value;
    const itemSelect = document.getElementById("itemSelect");
    itemSelect.innerHTML = '<option value="">-- Vyberte položku --</option>'; // Reset items

    if (!category) return;

    const filteredItems = foodDatabase.filter(food => food.category === category).sort((a, b) => a.name.localeCompare(b.name));

    filteredItems.forEach(food => {
        const option = document.createElement("option");
        option.value = food.name;
        option.textContent = food.name;
        itemSelect.appendChild(option);
    });
}

// -----------------------------
//   SELECT ITEM FROM DROPDOWN
// -----------------------------
function selectItemFromDropdown() {
    const selectedItem = document.getElementById("itemSelect").value;
    if (!selectedItem) return;

    const food = foodDatabase.find(food => food.name === selectedItem);
    if (food) {
        document.getElementById("foodSearch").value = food.name;
        document.getElementById("carbPer100g").value = food.carbsPer100g;
        document.getElementById("suggestionBox").style.display = "none";

        // Hide category selectors after selection
        toggleCategorySelectors(false);

        updateWeightFromCarbUnits();
        updateCarbUnitsFromWeight();
    }
}

// -----------------------------
//   DYNAMIC SUGGESTION BOX
// -----------------------------
function searchFood() {
    const input = document.getElementById("foodSearch").value.trim().toLowerCase();
    const box = document.getElementById("suggestionBox");

    // If empty, hide suggestions
    if (!input) {
        box.style.display = "none";
        return;
    }

    // Filter the database based on typed text
    const filtered = foodDatabase.filter(food =>
        food.name.toLowerCase().includes(input)
    );

    // If no results, hide suggestions
    if (filtered.length === 0) {
        box.innerHTML = "";
        box.style.display = "none";
        return;
    }

    // Build the suggestion list (only showing 'name')
    let html = "";
    filtered.forEach(food => {
        html += `
            <button type="button" class="list-group-item list-group-item-action" onclick="selectFoodFromSuggestion('${food.name}', ${food.carbsPer100g})">
                ${food.name}
            </button>
        `;
    });
    box.innerHTML = html;
    box.style.display = "block";
}

// Called when user clicks one of the suggestions
function selectFoodFromSuggestion(name, carbs) {
    document.getElementById("foodSearch").value = name;  // fill search box
    document.getElementById("carbPer100g").value = carbs; // set carbs
    document.getElementById("suggestionBox").style.display = "none";

    // Hide category selectors if visible
    toggleCategorySelectors(false);

    updateWeightFromCarbUnits();
    updateCarbUnitsFromWeight();
}

// -----------------------------
//        TOGGLE CATEGORY SELECTORS
// -----------------------------
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

// -----------------------------
//   ADVANCED SETTINGS LOGIC
// -----------------------------
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

// -----------------------------
//  DISPLAY CARB UNIT SIZE
// -----------------------------
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

// -----------------------------
//  “CURRENCY EXCHANGE” LOGIC
// -----------------------------
function handleCarbPer100gChange() {
    // Reset search and selectors if carbPer100g is manually changed
    document.getElementById("foodSearch").value = "";
    toggleCategorySelectors(false);
    document.getElementById("categorySelect").value = "";
    document.getElementById("itemSelect").innerHTML = '<option value="">-- Vyberte položku --</option>';

    updateWeightFromCarbUnits();
    updateCarbUnitsFromWeight();
}

// (1) From carbUnits => update foodWeight
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

// (2) From foodWeight => update carbUnits
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

// -----------------------------
//  PREVENT NON-NUMERIC INPUT
// -----------------------------
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

function resetAll(){
    document.getElementById("carbPer100g").value = '';
    document.getElementById("carbUnits").value = '';
    document.getElementById("foodWeight").value = '';
    document.getElementById("exchangeResult").innerText = '';
    document.getElementById("foodSearch").value = '';
    document.getElementById("categorySelect").value = '';
    document.getElementById("itemSelect").value = '';
}
