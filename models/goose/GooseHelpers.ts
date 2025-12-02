export const GooseHelpers = {

    /**
     * @param color A 6-length string (ie, "FFFFFF") in the order RGB
     * @returns the 3 values between 0 and 255
     */
	 parseColor(color: string): { red: number; green: number; blue: number } {
        if (typeof color !== "string") {
            throw new Error("Color must be a string");
        }
    
        // Remove leading '#' if present
        if (color.startsWith("#")) {
            color = color.slice(1);
        }
    
        // Must be 6 hex characters
        if (!/^[A-Fa-f0-9]{6}$/.test(color)) {
            throw new Error("Invalid hex color format");
        }
    
        const red = parseInt(color.slice(0, 2), 16);
        const green = parseInt(color.slice(2, 4), 16);
        const blue = parseInt(color.slice(4, 6), 16);
    
        return { red, green, blue };
    },

    /**
     * @param red the red value, from 0 to 255
     * @param green the green value
     * @param blue the blue value
     * @returns a string, ie. "FFFFFF"
     */
    toHexColor(red: number, green: number, blue: number): string {
        const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
    
        const r = clamp(red).toString(16).padStart(2, "0");
        const g = clamp(green).toString(16).padStart(2, "0");
        const b = clamp(blue).toString(16).padStart(2, "0");
    
        return `${r}${g}${b}`.toUpperCase();
    }
}