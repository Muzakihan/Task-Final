function drawImage(size) {
    if (size % 2 === 0) {
        console.log("Size must be an odd number.");
        return;
    } 
    for (let i = 0; i < size; i++) {
        let row = '';
        for (let j = 0; j < size; j++) {
            if (i === j || i + j === size - 1) {
                row += '* ';
            } else {
                row += '# ';
            }
        }
        console.log(row.trim());
    }
}

// Contoh penggunaan:
console.log("Output for drawImage(5):");
drawImage(5);
console.log("\nOutput for drawImage(7):");
drawImage(7);
