const fs = require('fs');
const Docxtemplater = require('docxtemplater');

// Load the Word template
const content = fs.readFileSync('template.docx', 'binary');
const doc = new Docxtemplater(content);

// Data to populate the template
const data = {
  name: 'Alice',
  age: 25,
  occupation: 'Engineer',
};

// Set the data in the template
doc.setData(data);

// Apply the template to generate the document
doc.render();

// Save the generated document
const outputPath = 'output.docx';
const buffer = doc.getZip().generate({ type: 'nodebuffer' });
fs.writeFileSync(outputPath, buffer);


console.log('Word document generated:', outputPath);