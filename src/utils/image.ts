export async function createDummyImage(letter: string) {
    if (letter.length > 1) console.warn("createDummyImage() should only accept a single letter! Here be dragons.")
    const canvas = document.createElement('canvas');
    canvas.width = 75;
    canvas.height = 75;
    const ctx = canvas.getContext('2d')!;

    // Fill the canvas with black background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = '36px Arial';
    ctx.fillStyle = randomColorJS();
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

export const dummyImages: { [letter: string]: string } = {};

export async function generateAndCacheDummyImage(letter: string) {
  if (dummyImages[letter]) return; // Image already generated and cached

  // Your existing code to generate a dummy image
  const imageSrc = await createDummyImage(letter);
  dummyImages[letter] = imageSrc;
}

// async function randomColor() {
//     let color = await invoke("generate_rgb");
//     return color as string;
// }

// Holy hell this is so much faster than invoking lol
function randomColorJS() {
    return `rgb(${Math.floor(Math.random()*128 + 128)},${Math.floor(Math.random()*128 + 128)},${Math.floor(Math.random()*128 + 128)})`;
}
