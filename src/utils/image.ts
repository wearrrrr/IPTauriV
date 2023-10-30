import Jimp from "jimp"


export async function createDummyImage(letter: string) {
    if (letter.length > 1) console.warn("createDummyImage() should only accept a single letter! Here be dragons.")
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d')!;

    // Fill the canvas with black background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = '36px Arial';
    ctx.fillStyle = randomColor();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const x = canvas.width / 2;
    const y = canvas.height / 2;
    ctx.fillText(letter, x, y);

    // Convert the canvas to an image
    const image = new Image();
    image.src = canvas.toDataURL('image/png');

    // Remove after we are done with it
    canvas.remove();
    return image.src;
}

// Bitshifting is fun :)
function randomColor() {
    // Generate pastel RGB values
    var r = Math.round(100 + Math.random() * 155);  // R component between 100 and 255
    var g = Math.round(100 + Math.random() * 155);  // G component between 100 and 255
    var b = Math.round(100 + Math.random() * 155);  // B component between 100 and 255

    return 'rgb(' + r + ', ' + g + ', ' + b + ')';
}
