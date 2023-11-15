class Logger {
    private static instance: Logger;
    private constructor() {}
    
    static getInstance() {
        if (!Logger.instance) {
        Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    
    log(message: string) {
        console.log("%c [IPTaV]: " + message, "font-size: 14px");
    }

    info(message: string) {
        console.info("%c [IPTaV]: " + message, "color: #07edf5; font-size: 14px");
    }

    warn(message: string) {
        console.warn("%c [IPTaV]: " + message, "color: #f5ed07; font-size: 14px");
    }

    error(message: string) {
        console.error("%c [IPTaV]: " + message, "color: #f50707; font-size: 14px");
    }


}

export default Logger.getInstance();