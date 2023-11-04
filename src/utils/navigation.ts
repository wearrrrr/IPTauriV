let backButton = document.getElementById('back-button')!;

backButton.addEventListener('click', () => {
    window.history.back();
});