function hitungBarang(kualitas, qty) {
    let harga = 0;
    let potongan = 0;
    let totalHarga = 0;

    if (kualitas === "A") {
        harga = 4550;
        totalHarga = harga * qty;

        if (qty > 13) {
            potongan = 231 * qty;
        }
    } else if (kualitas === "B") {
        harga = 5330;
        totalHarga = harga * qty;

        if (qty > 7) {
            potongan = totalHarga * 0.23;
        }
    } else if (kualitas === "C") {
        harga = 8653;
        totalHarga = harga * qty;
        potongan = 0;
    } else {
        console.log("Kualitas barang tidak dikenal.");
        return;
    }

    let totalBayar = totalHarga - potongan;

    console.log("- Total harga barang : " + totalHarga);
    console.log("- Potongan : " + potongan);
    console.log("- Total yang harus dibayar : " + totalBayar);
}

hitungBarang("A", 14);
