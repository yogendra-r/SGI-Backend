const fs = require("fs");

const req = {
    email : 'y@r.com',
    body : {primer_nombre : 'yogendra' , primer_apellido : 'raj'},
    heading: 'Hi hello...'
}

const filePath = "images/records.xls";
  if (!fs.existsSync(filePath)) {
    const header = "Sl No\tEmail\tFirst Name\tLast Name\tPassword\tDetails\n";
    fs.writeFileSync(filePath, header);
  } else {
    const row = `0\t${req.email}\t${req.body.primer_nombre} ${req.body.primer_apellido}\t${req.heading}\n`;
    fs.appendFileSync(filePath, row);
  }


// writeStream.write(row2);

// writeStream.close();