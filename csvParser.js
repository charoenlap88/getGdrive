// Function to clean and normalize field data
function cleanField(field) {
  if (!field) return '';
  
  return field
    .replace(/\r?\n/g, ' ') // Replace newlines with spaces
    .replace(/\s+/g, ' ')   // Replace multiple spaces with single space
    .trim();                // Remove leading/trailing spaces
}

// Function to parse price data that contains newlines
function parsePrice(priceField) {
  if (!priceField) return { amount: '', shipping: '' };
  
  const parts = priceField.split('\n').map(part => part.trim());
  if (parts.length >= 2) {
    return {
      amount: parts[0],
      shipping: parts[1]
    };
  }
  return { amount: parts[0] || '', shipping: '' };
}

// Enhanced CSV parser that handles multiline quoted fields with data cleaning
function parseCSV(csvText) {
  const results = [];
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotedField = false;
  let i = 0;
  
  console.log('🔧 Parsing CSV with enhanced data cleaning');
  console.log(`📊 Processing ${csvText.length} characters`);
  
  while (i < csvText.length) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    
    if (char === '"') {
      if (inQuotedField) {
        // Check for escaped quote (double quote)
        if (nextChar === '"') {
          currentField += '"';
          i += 2; // Skip both quotes
          continue;
        } else {
          // End of quoted field
          inQuotedField = false;
        }
      } else {
        // Start of quoted field
        inQuotedField = true;
      }
    } else if (char === ',' && !inQuotedField) {
      // Field separator (not inside quotes)
      currentRow.push(currentField.trim());
      currentField = '';
    } else if (char === '\n' && !inQuotedField) {
      // Row separator (not inside quotes)
      currentRow.push(currentField.trim());
      if (currentRow.some(field => field !== '')) { // Skip empty rows
        rows.push([...currentRow]);
      }
      currentRow = [];
      currentField = '';
    } else if (char === '\r' && !inQuotedField) {
      // Skip carriage return when not in quoted field
      // Will be handled with the newline
    } else {
      // Regular character (including newlines inside quotes)
      currentField += char;
    }
    
    i++;
  }
  
  // Add last field and row if exists
  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(field => field !== '')) {
      rows.push(currentRow);
    }
  }
  
  console.log(`📋 Found ${rows.length} total rows`);
  
  if (rows.length === 0) return [];
  
  // Create clean headers
  const rawHeaders = rows[0];
  const headers = rawHeaders.map((header, index) => {
    // Clean the header and assign meaningful names
    const cleanHeader = cleanField(header);
    if (index === 0 && cleanHeader.includes('อัพเดจราคา')) {
      return 'title';
    }
    if (index === 1) return 'image';
    if (index === 2) return 'productCode';
    if (index === 3) return 'description';
    if (index === 4) return 'priceRange';
    if (index === 5) return 'price100_300';
    if (index === 6) return 'price301_500';
    if (index === 7) return 'price501_1000';
    return cleanHeader || `column_${index}`;
  });
  
  console.log('📑 Clean headers:', headers);
  
  // Convert rows to objects with enhanced data processing
  rows.forEach((row, index) => {
    const rowObject = {};
    
    headers.forEach((header, colIndex) => {
      const rawValue = row[colIndex] || '';
      
      // Special handling for price columns
      if (header.startsWith('price') && rawValue) {
        const priceData = parsePrice(rawValue);
        rowObject[header] = {
          amount: priceData.amount,
          shipping: priceData.shipping,
          // Also provide clean string version
          display: priceData.shipping ? `${priceData.amount} (${priceData.shipping})` : priceData.amount
        };
      } else if (header === 'description') {
        // Keep some newlines in description but clean it
        rowObject[header] = rawValue.replace(/\r?\n/g, '\n').trim();
        rowObject[header + '_clean'] = cleanField(rawValue);
      } else {
        // Clean all other fields
        rowObject[header] = cleanField(rawValue);
      }
    });
    
    // Add helpful metadata
    rowObject.rowNumber = index + 1;
    
    // Log first few and last few rows for verification
    if (index < 3 || index >= rows.length - 2) {
      const productCode = rowObject.productCode || '';
      const productName = productCode.includes('(') ? 
        productCode.split('(')[0].trim() : 
        (rowObject.title || 'Unknown');
      console.log(`📄 Row ${index + 1}: ${productName}`);
    }
    
    results.push(rowObject);
  });
  
  console.log(`✅ Successfully parsed ${results.length} rows with clean data`);
  return results;
}

module.exports = {
  parseCSV
};
