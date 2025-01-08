const i18n = {
    sk: {
        title: "Carb Guide",
        pageHeading: "Carb Guide",
        searchFoodLabel: "Vyhľadajte jedlo:",
        searchFoodPlaceholder: "Začnite písať názov jedla (napr. Ryža)",
        selectCategoryBtn: "Vybrať podľa kategórie",
        hideCategoryBtn: "Skryť výber podľa kategórie",
        categoryLabel: "Vyberte kategóriu:",
        itemLabel: "Vyberte položku:",
        carbPer100gLabel: "Obsah sacharidov v gramoch na 100 g potraviny:",
        carbUnitsLabel: "Počet sacharidových jednotiek:",
        foodWeightLabel: "Hmotnosť jedla v gramoch:",
        advancedSettings: "Pokročilé nastavenia",
        currentCarbUnitText: "Aktuálna veľkosť sacharidovej jednotky: ",
        carbUnitSizeLabel: "Veľkosť sacharidovej jednotky (g):",
        carbUnitSizeHelp: "Zadajte počet gramov sacharidov, ktoré predstavujú jednu jednotku.",
        closeModal: "Zatvoriť",
        saveModal: "Uložiť",
    },
    en: {
        title: "Carb Guide",
        pageHeading: "Carb Guide",
        searchFoodLabel: "Search for food:",
        searchFoodPlaceholder: "Start typing the food name (e.g. Rice)",
        selectCategoryBtn: "Select by category",
        hideCategoryBtn: "Hide category selection",
        categoryLabel: "Choose a category:",
        itemLabel: "Choose an item:",
        carbPer100gLabel: "Carbohydrates in grams per 100 g of food:",
        carbUnitsLabel: "Number of carbohydrate units:",
        foodWeightLabel: "Weight of food in grams:",
        advancedSettings: "Advanced Settings",
        currentCarbUnitText: "Current carb unit size: ",
        carbUnitSizeLabel: "Carbohydrate unit size (g):",
        carbUnitSizeHelp: "Enter how many grams of carbohydrate represent one unit.",
        closeModal: "Close",
        saveModal: "Save",
    }
};

let currentLanguage = "en";
let foodDatabase = [];
let carbUnitSize = 10;

function setCookie(name, value, days = 365) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = "expires=" + date.toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; ${expires}; path=/`;
}

function getCookie(name) {
    const decoded = decodeURIComponent(document.cookie).split(";");
    for (let part of decoded) {
        let [k, v] = part.trim().split("=");
        if (k === name) return v;
    }
    return "";
}

function translatePage() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (i18n[currentLanguage][key]) {
            el.textContent = i18n[currentLanguage][key];
        }
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        if (i18n[currentLanguage][key]) {
            el.setAttribute("placeholder", i18n[currentLanguage][key]);
        }
    });
    const showCategoryBtn = document.getElementById("showCategoryBtn");
    if (showCategoryBtn) {
        const catSelectors = document.getElementById("categorySelectors");
        if (catSelectors && catSelectors.classList.contains("d-none")) {
            showCategoryBtn.textContent = i18n[currentLanguage].selectCategoryBtn;
        } else {
            showCategoryBtn.textContent = i18n[currentLanguage].hideCategoryBtn;
        }
    }
    document.title = i18n[currentLanguage].title || "Carb Guide";
}

function loadFoodDatabase() {
    foodDatabase = [];
    fetch("table.csv")
        .then(r => {
            if (!r.ok) {
                throw new Error("Network response was not ok " + r.statusText);
            }
            return r.text();
        })
        .then(data => {
            const lines = data.trim().split("\n");
            const headers = lines[0].split(",").map(x => x.trim());
            const expected = ["nameSlovak","categorySlovak","nameEnglish","categoryEnglish","carbsPer100g"];
            const missing = expected.filter(e => !headers.includes(e));
            if (missing.length) throw new Error("Missing columns: " + missing.join(", "));
            for (let i = 1; i < lines.length; i++) {
                const row = splitCSVLine(lines[i]);
                if (row.length === headers.length) {
                    let food = {};
                    headers.forEach((h, idx) => {
                        food[h] = row[idx].trim();
                    });
                    food.carbsPer100g = parseFloat(food.carbsPer100g) || 0;
                    foodDatabase.push(food);
                }
            }
            populateCategories();
        })
        .catch(err => console.error("Error loading CSV:", err));
}

function splitCSVLine(line) {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (const ch of line) {
        if (ch === '"') {
            inQuotes = !inQuotes;
        } else if (ch === "," && !inQuotes) {
            result.push(current);
            current = "";
        } else {
            current += ch;
        }
    }
    result.push(current);
    return result;
}

function populateCategories() {
    const catSelect = document.getElementById("categorySelect");
    if (!catSelect) return;
    catSelect.innerHTML = '<option value="">--</option>';
    const langField = currentLanguage === "sk" ? "categorySlovak" : "categoryEnglish";
    const categoriesSet = new Set();
    foodDatabase.forEach(item => {
        categoriesSet.add(item[langField]);
    });
    const sortedCats = Array.from(categoriesSet).sort((a, b) => (a || "").localeCompare(b || ""));
    sortedCats.forEach(cat => {
        if (!cat) return;
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat;
        catSelect.appendChild(opt);
    });
}

function populateItems() {
    const catSelect = document.getElementById("categorySelect");
    const itemSelect = document.getElementById("itemSelect");
    if (!catSelect || !itemSelect) return;
    const selectedCategory = catSelect.value;
    itemSelect.innerHTML = '<option value="">--</option>';
    if (!selectedCategory) return;
    const langCatField = currentLanguage === "sk" ? "categorySlovak" : "categoryEnglish";
    const langNameField = currentLanguage === "sk" ? "nameSlovak" : "nameEnglish";
    const filtered = foodDatabase.filter(x => x[langCatField] === selectedCategory);
    filtered.forEach(food => {
        const opt = document.createElement("option");
        opt.value = food[langNameField];
        opt.textContent = food[langNameField];
        itemSelect.appendChild(opt);
    });
}

function selectItemFromDropdown() {
    const langNameField = currentLanguage === "sk" ? "nameSlovak" : "nameEnglish";
    const itemSelect = document.getElementById("itemSelect");
    const searchInput = document.getElementById("foodSearch");
    const box = document.getElementById("suggestionBox");
    const val = itemSelect.value;
    const found = foodDatabase.find(x => x[langNameField] === val);
    if (found) {
        searchInput.value = found[langNameField];
        document.getElementById("carbPer100g").value = found.carbsPer100g;
        if (box) {
            box.style.display = "none";
            box.innerHTML = "";
        }
        toggleCategorySelectors(false);
        updateWeightFromCarbUnits();
        updateCarbUnitsFromWeight();
    }
}

function searchFood() {
    const input = document.getElementById("foodSearch");
    const box = document.getElementById("suggestionBox");
    const query = input.value.toLowerCase().trim();
    if (!query) {
        box.style.display = "none";
        box.innerHTML = "";
        return;
    }
    const langNameField = currentLanguage === "sk" ? "nameSlovak" : "nameEnglish";
    let suggestions = foodDatabase.filter(f => f[langNameField].toLowerCase().includes(query));
    if (!suggestions.length) {
        box.style.display = "none";
        box.innerHTML = "";
        return;
    }
    suggestions = suggestions.map(food => {
        let relevance = 0;
        const nameLC = food[langNameField].toLowerCase();
        if (nameLC.startsWith(query)) relevance = 2;
        else if (nameLC.includes(query)) relevance = 1;
        return { ...food, relevance };
    });
    suggestions.sort((a, b) => {
        if (b.relevance !== a.relevance) return b.relevance - a.relevance;
        return a[langNameField].localeCompare(b[langNameField]);
    });
    suggestions = suggestions.slice(0, 10);
    box.innerHTML = "";
    suggestions.forEach(food => {
        const regex = new RegExp(`(${escapeRegex(query)})`,"i");
        const highlighted = food[langNameField].replace(regex, "<strong>$1</strong>");
        box.innerHTML += `
      <button
        type="button"
        class="list-group-item list-group-item-action"
        onclick="selectFoodFromSuggestion('${escapeQuotes(food[langNameField])}',${food.carbsPer100g})"
      >
        ${highlighted}
      </button>`;
    });
    box.style.display = "block";
}

function selectFoodFromSuggestion(name, carbs) {
    document.getElementById("foodSearch").value = name;
    document.getElementById("carbPer100g").value = carbs;
    const box = document.getElementById("suggestionBox");
    box.style.display = "none";
    box.innerHTML = "";
    toggleCategorySelectors(false);
    updateWeightFromCarbUnits();
    updateCarbUnitsFromWeight();
}

function toggleCategorySelectors(show = null) {
    const catSelectors = document.getElementById("categorySelectors");
    const showCategoryBtn = document.getElementById("showCategoryBtn");
    if (!catSelectors || !showCategoryBtn) return;
    if (show === null) {
        if (catSelectors.classList.contains("d-none")) {
            catSelectors.classList.remove("d-none");
            setTimeout(() => catSelectors.classList.add("show"), 10);
            showCategoryBtn.textContent = i18n[currentLanguage].hideCategoryBtn;
        } else {
            catSelectors.classList.remove("show");
            setTimeout(() => catSelectors.classList.add("d-none"), 500);
            showCategoryBtn.textContent = i18n[currentLanguage].selectCategoryBtn;
        }
    } else if (show) {
        catSelectors.classList.remove("d-none");
        setTimeout(() => catSelectors.classList.add("show"), 10);
        showCategoryBtn.textContent = i18n[currentLanguage].hideCategoryBtn;
    } else {
        catSelectors.classList.remove("show");
        setTimeout(() => catSelectors.classList.add("d-none"), 500);
        showCategoryBtn.textContent = i18n[currentLanguage].selectCategoryBtn;
    }
}

document.getElementById("advancedSettingsForm").addEventListener("submit", e => {
    e.preventDefault();
    const inputEl = document.getElementById("carbUnitSize");
    const newSize = parseFloat(inputEl.value);
    if (isNaN(newSize) || newSize < 1) {
        alert("Please enter a valid carbohydrate unit size (minimum 1 g).");
        return;
    }
    carbUnitSize = newSize;
    alert(`Carbohydrate unit size set to ${carbUnitSize} g.`);
    const modal = bootstrap.Modal.getInstance(document.getElementById("advancedSettingsModal"));
    modal.hide();
    displayCarbUnit();
    resetAll();
    setCookie("carbguide_carbUnitSize", newSize);
});

function displayCarbUnit() {
    const display = document.getElementById("carbUnitDisplay");
    const currentSpan = document.getElementById("currentCarbUnit");
    if (carbUnitSize !== 10) {
        currentSpan.textContent = carbUnitSize;
        display.classList.remove("d-none");
    } else {
        display.classList.add("d-none");
    }
}

function handleCarbPer100gChange() {
    document.getElementById("foodSearch").value = "";
    toggleCategorySelectors(false);
    document.getElementById("categorySelect").value = "";
    document.getElementById("itemSelect").innerHTML = '<option value="">--</option>';
    updateWeightFromCarbUnits();
    updateCarbUnitsFromWeight();
}

function updateWeightFromCarbUnits() {
    const cVal = parseFloat(document.getElementById("carbPer100g").value);
    const uVal = parseFloat(document.getElementById("carbUnits").value);
    if (!isNaN(cVal) && cVal > 0 && !isNaN(uVal)) {
        const weight = (uVal * carbUnitSize * 100) / cVal;
        document.getElementById("foodWeight").value = weight.toFixed(2);
    } else {
        document.getElementById("foodWeight").value = "";
    }
}

function updateCarbUnitsFromWeight() {
    const cVal = parseFloat(document.getElementById("carbPer100g").value);
    const wVal = parseFloat(document.getElementById("foodWeight").value);
    if (!isNaN(cVal) && cVal > 0 && !isNaN(wVal)) {
        const units = (wVal * cVal) / (carbUnitSize * 100);
        document.getElementById("carbUnits").value = units.toFixed(2);
    } else {
        document.getElementById("carbUnits").value = "";
    }
}

function escapeQuotes(str) {
    return str.replace(/'/g, "\\'");
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function preventNonNumericInput() {
    const numberFields = document.querySelectorAll('input[type="number"]');
    numberFields.forEach(field => {
        field.addEventListener("keypress", e => {
            const char = String.fromCharCode(e.which);
            if (!/[0-9.\-]/.test(char)) {
                e.preventDefault();
            }
        });
    });
}

function resetAll() {
    document.getElementById("carbPer100g").value = "";
    document.getElementById("carbUnits").value = "";
    document.getElementById("foodWeight").value = "";
    document.getElementById("exchangeResult").innerText = "";
    document.getElementById("foodSearch").value = "";
    if (document.getElementById("categorySelect")) {
        document.getElementById("categorySelect").value = "";
    }
    if (document.getElementById("itemSelect")) {
        document.getElementById("itemSelect").value = "";
    }
}

function setLanguage(lang) {
    currentLanguage = lang;
    translatePage();
    populateCategories();
    resetAll();
    highlightCurrentLanguage(lang);
    const suggestionBox = document.getElementById("suggestionBox");
    if (suggestionBox) {
        suggestionBox.style.display = "none";
        suggestionBox.innerHTML = "";
    }
    setCookie("carbguide_language", lang);
}

function highlightCurrentLanguage(lang) {
    const skBtn = document.getElementById("langSkBtn");
    const enBtn = document.getElementById("langEnBtn");
    if (skBtn && enBtn) {
        skBtn.classList.remove("btn-currentLang");
        enBtn.classList.remove("btn-currentLang");
        if (lang === "sk") {
            skBtn.classList.add("btn-currentLang");
        } else {
            enBtn.classList.add("btn-currentLang");
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const savedLang = getCookie("carbguide_language");
    if (savedLang) {
        currentLanguage = savedLang;
    }
    const savedCarbSize = getCookie("carbguide_carbUnitSize");
    if (savedCarbSize) {
        const numSize = parseFloat(savedCarbSize);
        if (!isNaN(numSize) && numSize > 0) {
            carbUnitSize = numSize;
        }
    }
    translatePage();
    loadFoodDatabase();
    preventNonNumericInput();
    highlightCurrentLanguage(currentLanguage);
    displayCarbUnit();
});
