class GlobalErrorHandler extends Error {
    constructor(suj, status, message) {
        this.suj = suj;
        this.status = status;
        this.message = message;
    }

} 