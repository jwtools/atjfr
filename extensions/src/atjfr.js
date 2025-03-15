function extractData() {
    // Clear existing data
    jsonData.length = 0;
    // Get fresh reference to table and rows
    const currentTable = document.querySelector("#tableur").querySelector("table");
    const currentRows = currentTable.rows;
    // Extract data
    for (let i = 0; i < currentRows.length; i++) {
        const rowObject = {};
        const cells = currentRows[i].cells;
        for (let j = 0; j < cells.length; j++) {
            rowObject[headers[j]] = cells[j].innerText;
        }
        jsonData.push(rowObject);
    }
}

function sumThing(str) {
    if (isNaN(parseFloat(str.replace(',', '.'))))
        return 0;
    return parseFloat(str.replace(',', '.'));
}

function calculate_Nxx() {
    // Check if jsonData is empty or invalid
    if (!jsonData || !Array.isArray(jsonData) || jsonData.length === 0) {
        const sumDisplays = document.querySelectorAll('.sum-value');
        if (sumDisplays && sumDisplays.length >= 4) {
            sumDisplays[0].textContent = '0.00';
            sumDisplays[1].textContent = '0.00';
            sumDisplays[2].textContent = '0.00';
            // Don't override Réemploi des fonds if it's already calculated
            if (!sumDisplays[3].textContent || sumDisplays[3].textContent === '0.00') {
                sumDisplays[3].textContent = '0.00';
            }
        }
        
        chrome.runtime.sendMessage({ 
            action: "storeSums", 
            totalN11: 0, 
            totalN12: 0, 
            totalExx: 0,
            reemploiFonds: parseFloat(sumDisplays?.[3]?.textContent || '0.00')
        });
        return;
    }

    // Get all the entries with code in [N01, N02] from the json data
    const sumN11 = jsonData.filter(entry => entry?.code === "N01").reduce((acc, entry) => {
        if (!entry || !entry["e-entrees"]) return acc;
        sum = acc + sumThing(entry["e-entrees"]);
        return sum;
    }, 0);

    const sumN12 = jsonData.filter(entry => entry?.code === "N02").reduce((acc, entry) => {
        if (!entry || !entry["e-entrees"]) return acc;
        sum = acc + sumThing(entry["e-entrees"]);
        return sum;
    }, 0);

    const sumExx = jsonData.filter(entry => entry?.code?.startsWith("E")).reduce((acc, entry) => {
        if (!entry || !entry["e-entrees"]) return acc;
        sum = acc + sumThing(entry["e-entrees"]);
        return sum;
    }, 0);
    
    // Update the display of sums
    const sumDisplays = document.querySelectorAll('.sum-value');
    if (sumDisplays && sumDisplays.length >= 4) {
        sumDisplays[0].textContent = (sumN11 || 0).toFixed(2);
        sumDisplays[1].textContent = (sumN12 || 0).toFixed(2);
        sumDisplays[2].textContent = (sumExx || 0).toFixed(2);
        // Don't override Réemploi des fonds if it's already calculated
        if (!sumDisplays[3].textContent || sumDisplays[3].textContent === '0.00') {
            sumDisplays[3].textContent = '0.00';
        }
    }
    
    chrome.runtime.sendMessage({ 
        action: "storeSums", 
        totalN11: sumN11 || 0, 
        totalN12: sumN12 || 0, 
        totalExx: sumExx || 0,
        reemploiFonds: parseFloat(sumDisplays?.[3]?.textContent || '0.00')
    });
}

function calculateReemploi() {
    const resolution = parseFloat(document.getElementById('resolution').value) || 0;
    const quotePart = parseFloat(document.getElementById('quotePart').value) || 0;
    const reserve = parseFloat(document.getElementById('reserve').value) || 0;
    const soldeFinal = parseFloat(document.getElementById('soldeFinal').value) || 0;

    let reemploi = resolution + quotePart + reserve - soldeFinal;
    
    // Round up to nearest 5
    reemploi = Math.ceil(reemploi / 5) * 5;
    
    const sumDisplays = document.querySelectorAll('.sum-value');
    sumDisplays[3].textContent = reemploi.toFixed(2);  // Update Réemploi des fonds display

    chrome.runtime.sendMessage({ 
        action: "storeSums", 
        reemploiFonds: reemploi.toFixed(2)
    });
}

// select the table from the div id EnteteTableur
const table = document.querySelector("#tableur").querySelector("table");
const headers = ["date", "libelle", "code", "e-entrees", "e-sorties", "cp-entrees", "cp-sorties", "fc-entrees", "fc-sorties"];
const jsonData = [];

// Add UI elements for the new fields
function createInputFields() {
    const container = document.createElement('div');
    container.style.margin = '10px 0';
    container.style.padding = '10px';
    container.style.border = '1px solid #ccc';
    container.style.borderRadius = '4px';
    container.style.display = 'flex';
    container.style.gap = '40px';
    container.style.position = 'relative';  // For button positioning

    // Left column for input fields
    const inputColumn = document.createElement('div');
    inputColumn.style.display = 'flex';
    inputColumn.style.flexDirection = 'column';
    inputColumn.style.gap = '10px';

    const fields = [
        { id: 'resolution', label: 'Résolution' },
        { id: 'quotePart', label: 'Quote part' },
        { id: 'reserve', label: 'Réserve' },
        { id: 'soldeFinal', label: 'Solde final' }
    ];

    // Create a promise array to track all storage loads
    const loadPromises = [];

    fields.forEach(field => {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.gap = '8px';
        
        const label = document.createElement('label');
        label.textContent = field.label + ' :';
        label.htmlFor = field.id;
        label.style.minWidth = '80px';
        label.style.textAlign = 'right';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.inputMode = 'decimal';
        input.id = field.id;
        input.pattern = '[0-9]*[.,]?[0-9]*';
        input.style.width = '100px';
        input.style.padding = '4px 8px';
        input.style.border = '1px solid #ccc';
        input.style.borderRadius = '4px';

        // Add keydown event listener to prevent comma input and replace with dot
        input.addEventListener('keydown', (e) => {
            if (e.key === ',') {
                e.preventDefault();
                const start = e.target.selectionStart;
                const value = e.target.value;
                // Only add the dot if there isn't one already
                if (!value.includes('.')) {
                    const newValue = value.slice(0, start) + '.' + value.slice(start);
                    e.target.value = newValue;
                    e.target.setSelectionRange(start + 1, start + 1);
                }
            }
        });
        
        // Validate input to ensure it's a valid number
        input.addEventListener('input', (e) => {
            const value = e.target.value;
            // Remove any characters that aren't numbers or decimal point
            let cleanValue = value.replace(/[^\d.]/g, '');
            // Ensure only one decimal point
            const decimalPoints = cleanValue.match(/\./g);
            if (decimalPoints && decimalPoints.length > 1) {
                cleanValue = cleanValue.replace(/\./g, (match, index) => index === cleanValue.indexOf('.') ? '.' : '');
            }
            if (cleanValue !== value) {
                e.target.value = cleanValue;
            }
        });
        
        // Add paste event listener to handle pasted content
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            const value = e.target.value;
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            const processedText = pastedText.replace(/,/g, '.');
            e.target.value = value.slice(0, start) + processedText + value.slice(end);
            const newPos = start + processedText.length;
            e.target.setSelectionRange(newPos, newPos);
        });
        
        // Add the load promise to our array
        const loadPromise = chrome.storage.local.get(field.id)
            .then(result => {
                if (result && result[field.id] !== undefined && result[field.id] !== null) {
                    input.value = result[field.id];
                }
            })
            .catch(error => {
                console.error(`Error loading ${field.id} from storage:`, error);
            });
        
        loadPromises.push(loadPromise);

        input.addEventListener('change', () => {
            if (input.value === '') {
                chrome.storage.local.remove(field.id);
            } else {
                chrome.storage.local.set({ [field.id]: input.value });
            }
            calculateReemploi();
        });

        div.appendChild(label);
        div.appendChild(input);
        inputColumn.appendChild(div);
    });

    // Right column for sum displays
    const sumColumn = document.createElement('div');
    sumColumn.style.display = 'flex';
    sumColumn.style.flexDirection = 'column';
    sumColumn.style.gap = '10px';

    const sums = [
        { label: 'N11', id: 'sumN11' },
        { label: 'N12', id: 'sumN12' },
        { label: 'Exx', id: 'sumExx' },
        { label: 'Réemploi des fonds', id: 'reemploiFonds' }
    ];

    sums.forEach(sum => {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.gap = '8px';
        div.style.justifyContent = 'flex-end';
        
        const label = document.createElement('label');
        label.textContent = sum.label + ' :';
        label.style.minWidth = sum.label.length > 5 ? '140px' : '40px';
        label.style.textAlign = 'right';
        
        const value = document.createElement('span');
        value.classList.add('sum-value');
        value.style.minWidth = '80px';
        value.style.width = '80px';
        value.style.textAlign = 'right';
        value.style.padding = '4px 8px';
        value.style.border = '1px solid #ccc';
        value.style.borderRadius = '4px';
        value.style.backgroundColor = '#f5f5f5';
        
        if (sum.id === 'reemploiFonds') {
            value.textContent = '0.00';
        }
        
        div.appendChild(label);
        div.appendChild(value);
        sumColumn.appendChild(div);
    });

    // Create update button
    const updateButton = document.createElement('button');
    updateButton.innerHTML = '&#x21BB;'; // Clockwise open circle arrow
    updateButton.title = 'Mettre à jour'; // Tooltip on hover
    updateButton.style.padding = '8px 12px';
    updateButton.style.backgroundColor = '#4CAF50';
    updateButton.style.color = 'white';
    updateButton.style.border = 'none';
    updateButton.style.borderRadius = '50%'; // Make it circular
    updateButton.style.cursor = 'pointer';
    updateButton.style.marginLeft = '20px';
    updateButton.style.alignSelf = 'center';
    updateButton.style.fontSize = '20px'; // Bigger font for the icon
    updateButton.style.fontWeight = 'bold';
    updateButton.style.width = '40px';
    updateButton.style.height = '40px';
    updateButton.style.display = 'flex';
    updateButton.style.alignItems = 'center';
    updateButton.style.justifyContent = 'center';
    updateButton.style.lineHeight = '1';

    // Hover effect
    updateButton.addEventListener('mouseover', () => {
        updateButton.style.backgroundColor = '#45a049';
        updateButton.style.transform = 'scale(1.1)';
        updateButton.style.transition = 'all 0.2s ease';
    });
    updateButton.addEventListener('mouseout', () => {
        updateButton.style.backgroundColor = '#4CAF50';
        updateButton.style.transform = 'scale(1)';
    });

    // Click effect
    updateButton.addEventListener('mousedown', () => {
        updateButton.style.transform = 'scale(0.95)';
    });
    updateButton.addEventListener('mouseup', () => {
        updateButton.style.transform = 'scale(1)';
    });

    // Update function
    updateButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Add rotation animation on click
        updateButton.style.transition = 'transform 0.5s ease';
        updateButton.style.transform = 'rotate(360deg)';
        
        extractData();
        calculate_Nxx();
        calculateReemploi();
        
        // Reset rotation after animation
        setTimeout(() => {
            updateButton.style.transition = 'none';
            updateButton.style.transform = 'rotate(0deg)';
        }, 500);
    });

    container.appendChild(inputColumn);
    container.appendChild(sumColumn);
    container.appendChild(updateButton);
    table.parentNode.insertBefore(container, table.nextSibling);

    // After all values are loaded from storage, calculate Réemploi
    Promise.all(loadPromises).then(() => {
        calculateReemploi();
    });
}

function run() {
    createInputFields();
    extractData();
    calculate_Nxx();
    calculateReemploi();
}

run();