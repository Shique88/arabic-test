// Function to load the default Excel file
async function loadDefaultExcelFile() {
    try {
        // Path to your Excel file - update this to your actual filename
        const excelFilePath = 'vocabulary.xlsx';
        
        dataInfo.textContent = 'טוען נתונים...';
        statusIndicator.className = 'status-indicator loading';
        
        // Fetch the Excel file
        const response = await fetch(excelFilePath);
        if (!response.ok) {
            throw new Error(`נכשלה טעינת הקובץ: ${response.status} ${response.statusText}`);
        }
        
        // Convert the response to an ArrayBuffer
        const data = await response.arrayBuffer();
        
        // Process the Excel data
        const workbook = XLSX.read(new Uint8Array(data), {type: 'array'});
        
        // Get all sheet names
        const sheetNames = workbook.SheetNames;
        console.log("Excel sheet names:", sheetNames);
        
        // Filter sheets to only those containing 'P'
        const filteredSheetNames = sheetNames.filter(sheetName => sheetName.includes('P'));
        console.log("Filtered sheet names:", filteredSheetNames);
        
        if (filteredSheetNames.length === 0) {
            // No sheets with 'P' found, use all sheets
            console.log("No sheets with 'P' found, using all sheets");
            
            let allData = [];
            sheetData = {}; // Reset sheet data
            
            // Process each sheet
            sheetNames.forEach(sheetName => {
                const worksheet = workbook.Sheets[sheetName];
                
                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                console.log(`Sheet ${sheetName}: ${jsonData.length} entries`);
                
                // Store data by sheet name
                sheetData[sheetName] = jsonData;
                
                // Add sheet name as category if not specified
                jsonData.forEach(item => {
                    if (!item.category && !item.Category) {
                        item.sheetCategory = sheetName;
                    }
                });
                
                allData = [...allData, ...jsonData];
            });
            
            processVocabularyData(allData);
            
            // Update status to success
            statusIndicator.className = 'status-indicator success';
            dataInfo.textContent = `נטענו ${allData.length} מילים בהצלחה (כל הגיליונות)`;
            
            // Create a detailed sheet information display
            sheetsInfo.innerHTML = `
                <div>נטענו נתונים מ-${sheetNames.length} גיליונות:</div>
                <div class="sheet-list">
                    ${sheetNames.map(sheet => `<span class="sheet-badge">${sheet}</span>`).join('')}
                </div>
            `;
        } else {
            // Process filtered sheets
            let allData = [];
            sheetData = {}; // Reset sheet data
            
            // Process each filtered sheet
            filteredSheetNames.forEach(sheetName => {
                const worksheet = workbook.Sheets[sheetName];
                
                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                console.log(`Sheet ${sheetName}: ${jsonData.length} entries`);
                
                // Create display name by removing only the letter 'P'
                let displayName = sheetName.replace(/P/g, '');
                console.log(`Display name for ${sheetName}: ${displayName}`);
                
                // Store data by sheet name
                sheetData[sheetName] = jsonData;
                
                // Add modified sheet name as category if not specified
                jsonData.forEach(item => {
                    if (!item.category && !item.Category) {
                        item.sheetCategory = displayName; // Use the name without 'P'
                    }
                });
                
                allData = [...allData, ...jsonData];
            });
            
            console.log("Total data entries:", allData.length);
            processVocabularyData(allData);
            
            // Update status to success
            statusIndicator.className = 'status-indicator success';
            dataInfo.textContent = `נטענו ${allData.length} מילים בהצלחה`;
            
            // Get display names for the badges (without 'P')
            const displayNames = filteredSheetNames.map(sheetName => {
                return sheetName.replace(/P/g, '');
            });
            
            // Create a detailed sheet information display with modified names
            sheetsInfo.innerHTML = `
                <div>נטענו נתונים מ-${filteredSheetNames.length} גיליונות:</div>
                <div class="sheet-list">
                    ${displayNames.map(sheet => `<span class="sheet-badge">${sheet}</span>`).join('')}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading default Excel file:', error);
        statusIndicator.className = 'status-indicator error';
        dataInfo.textContent = `שגיאה בטעינת קובץ ברירת המחדל: ${error.message}`;
        sheetsInfo.innerHTML = '';
    }
}

// Process vocabulary data from Excel 
function processVocabularyData(data) {
    vocabulary = [];
    categories = new Set();
    
    // Assume Excel has columns: Arabic, Hebrew, Category
    data.forEach((row, index) => {
        const keys = Object.keys(row);
        let arabic = '', hebrew = '', category = 'כללי';
        
        // Try to intelligently identify the columns
        keys.forEach(key => {
            const value = row[key];
            if (!value) return;
            
            // Assuming Arabic words will be in Arabic script
            // and translations in Hebrew script
            if (typeof value === 'string') {
                if (!arabic && (key.toLowerCase().includes('arab') || key.toLowerCase() === 'word')) {
                    arabic = value;
                } else if (!hebrew && (key.toLowerCase().includes('heb') || key.toLowerCase() === 'translation')) {
                    hebrew = value;
                } else if (!category && key.toLowerCase().includes('cat')) {
                    category = value;
                } else if (!arabic) {
                    arabic = value;
                } else if (!hebrew) {
                    hebrew = value;
                }
            }
        });
        
        // Fallback for simple two-column format
        if (!arabic && keys.length >= 1) arabic = row[keys[0]];
        if (!hebrew && keys.length >= 2) hebrew = row[keys[1]];
        
        // Use sheet name as category if provided and no category column exists
        if (row.sheetCategory && (!category || category === 'כללי')) {
            category = row.sheetCategory;
        }
        
        if (arabic && hebrew) {
            const wordId = index;
            vocabulary.push({
                id: wordId,
                arabic,
                hebrew,
                category
            });
            categories.add(category);
        }
    });
    
    console.log("Processed vocabulary data:", vocabulary.length, "words");
    console.log("Categories:", Array.from(categories));
    
    // Initialize with all words
    currentWords = [...vocabulary];
    
    // Shuffle the words for random order
    currentWords = shuffleArray([...currentWords]);
    
    // Create category buttons
    createCategoryButtons(Array.from(categories).sort());
    
    // Initialize flashcard interface
    updateCard();
    updateControls();
    updateStats();
    
    // Initialize SRS display
    updateSRSDisplay();
}

// Create category filter buttons
function createCategoryButtons(categoryList) {
    console.log("Creating category buttons:", categoryList);
    categoriesContainer.innerHTML = '<button class="category-btn active" data-category="all">הכל</button>';
    
    categoryList.forEach(category => {
        const button = document.createElement('button');
        button.className = 'category-btn';
        button.textContent = category;
        button.dataset.category = category;
        button.addEventListener('click', () => filterByCategory(category));
        categoriesContainer.appendChild(button);
    });
    
    // Add event listener to "All" button
    const allButton = categoriesContainer.querySelector('[data-category="all"]');
    if (allButton) {
        allButton.addEventListener('click', () => filterByCategory('all'));
    }
}

// Filter vocabulary by category
function filterByCategory(category) {
    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const categoryBtn = document.querySelector(`[data-category="${category}"]`);
    if (categoryBtn) {
        categoryBtn.classList.add('active');
    }
    
    // Remember current category
    currentCategory = category;
    
    if (category === 'all') {
        currentWords = [...vocabulary];
    } else {
        currentWords = vocabulary.filter(word => word.category === category);
    }
    
    // Shuffle the words for random order
    currentWords = shuffleArray([...currentWords]);
    
    // Reset index and update UI
    currentIndex = 0;
    updateCard();
    updateControls();
    updateStats();
    
    // If in test mode, refresh the test
    if (testContainer.style.display !== 'none') {
        initializeTestMode();
    }
}
