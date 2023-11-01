import Toastify from 'toastify-js'
import "toastify-js/src/toastify.css"

export function createToast(message: string, duration: number, onClick?: () => void) {
    Toastify({
        text: message,
        duration: duration,
        onClick: onClick,
        }).showToast();
}