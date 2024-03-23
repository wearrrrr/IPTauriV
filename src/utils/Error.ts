interface NullElementErrorOpts {
    fatal?: boolean,
}

export class NullElementError extends Error {
    constructor(selector: string, opts: NullElementErrorOpts) {
        let error = `Element with selector ${selector} is null or undefined!`;
        super(error);
        console.error(error);
        if (opts.fatal) {
            throw new Error(error);
        }
    }
    
}