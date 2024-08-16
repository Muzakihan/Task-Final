
let arr = [20, 12, 35, 11, 17, 9, 58, 23, 69, 21];

function bubbleSort(array) {
    let n = array.length;
    
    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - 1 - i; j++) {
            if (array[j] > array[j + 1]) {
                let temp = array[j];
                array[j] = array[j + 1];
                array[j + 1] = temp;
            }
        }
    }

    return array;
}

console.log("Array sebelum diurutkan: ", arr);
let sortedArray = bubbleSort(arr);
console.log("Array setelah diurutkan: ", sortedArray);
