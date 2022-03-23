//Importing all packages needed
const fs = require('fs');

//Function for deleting a file
const deleteFile = (filePath) => {
    fs.unlink(filePath, (err) => {
        if (err) {
            console.log(err);
        }
    });
};

//exporting the function
exports.deleteFile = deleteFile;