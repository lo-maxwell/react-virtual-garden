// utils/errors.ts
export class BadRequestError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'BadRequestError';
    }
}

export class InternalServerError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'InternalServerError';
    }
}
