export class Base64 {
    static encode(str: string): string {
        return btoa(str);
    }
    
    static decode(str: string): string {
        return atob(str);
    }
}