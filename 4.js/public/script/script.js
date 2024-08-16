document.getElementById('data-selector').addEventListener('change', function() {
    const selectedValue = this.value;
    const provincesContainer = document.getElementById('provinces-container');
    const districtsContainer = document.getElementById('districts-container');

    if (selectedValue === 'provinces') {
        provincesContainer.style.display = 'grid';
        districtsContainer.style.display = 'none';
    } else if (selectedValue === 'districts') {
        provincesContainer.style.display = 'none';
        districtsContainer.style.display = 'grid';
    } else {
        provincesContainer.style.display = 'grid';
        districtsContainer.style.display = 'grid';
    }
});