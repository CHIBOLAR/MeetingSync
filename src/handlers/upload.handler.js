function parseFormData(parts) {
  const formData = {};

  for (const part of parts) {
    // Skip empty parts
    if (!part || !part.trim()) continue;
    
    if (part.includes('Content-Disposition: form-data')) {
      const lines = part.split('\r\n').filter(line => line !== '');
      const dispositionLine = lines.find(line => line.includes('Content-Disposition'));
      
      if (dispositionLine) {
        const nameMatch = dispositionLine.match(/name="([^"]+)"/);
        const filenameMatch = dispositionLine.match(/filename="([^"]+)"/);
        
        if (nameMatch) {
          const fieldName = nameMatch[1];
          
          // Find where the actual content starts (after headers)
          const headerEndIndex = lines.findIndex(line => line === '');
          const contentLines = headerEndIndex >= 0 ? lines.slice(headerEndIndex + 1) : lines.slice(2);
          const content = contentLines.join('\r\n').trim();
          
          if (filenameMatch) {
            // This is a file field
            const filename = filenameMatch[1];
            const contentType = getContentType(lines);
            
            formData[fieldName] = {
              name: filename,
              content: content,
              size: Buffer.byteLength(content, 'utf8'), // More accurate size calculation
              type: contentType,
              isFile: true
            };
          } else {
            // This is a regular form field
            formData[fieldName] = content;
          }
        }
      }
    }
  }

  return formData;
}

function getContentType(lines) {
  const contentTypeLine = lines.find(line => line.toLowerCase().includes('content-type:'));
  if (contentTypeLine) {
    const type = contentTypeLine.split(':')[1];
    return type ? type.trim() : 'text/plain';
  }
  return 'text/plain';
}

// Helper function to parse multipart form data from raw body
function parseMultipartFormData(body, boundary) {
  if (!boundary) {
    throw new Error('Boundary not found in Content-Type header');
  }
  
  // Clean boundary (remove quotes if present)
  const cleanBoundary = boundary.replace(/"/g, '');
  
  // Split by boundary
  const parts = body.split(`--${cleanBoundary}`)
    .filter(part => part.trim() && !part.includes('--')); // Remove empty parts and final boundary
  
  return parseFormData(parts);
}

// Example usage function
function handleFileUpload(request) {
  try {
    const contentType = request.headers['content-type'] || '';
    
    if (!contentType.includes('multipart/form-data')) {
      throw new Error('Content-Type must be multipart/form-data');
    }
    
    // Extract boundary from Content-Type header
    const boundaryMatch = contentType.match(/boundary=([^;]+)/);
    if (!boundaryMatch) {
      throw new Error('Boundary not found in Content-Type header');
    }
    
    const boundary = boundaryMatch[1];
    const formData = parseMultipartFormData(request.body, boundary);
    
    return {
      success: true,
      data: formData
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  parseFormData,
  parseMultipartFormData,
  handleFileUpload,
  getContentType
};