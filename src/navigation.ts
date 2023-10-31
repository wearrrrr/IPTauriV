let backButton = document.getElementById('back-button')!;

let validateElement = (element: HTMLElement[] | HTMLElement | null) => {
    if (Array.isArray(element)) {
        element.forEach((el) => {
            if (el === null) throw new Error("Element not found.. this should never happen.")
        })
    } else {
        if (element === null) throw new Error("Element not found.. this should never happen.")
    }
}

validateElement(backButton);

backButton.addEventListener('click', () => {
    window.history.back();
});