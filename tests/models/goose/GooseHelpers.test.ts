import { GooseHelpers } from "@/models/goose/GooseHelpers";

describe("GooseHelpers.parseColor", () => {

    test("correctly parses a valid hex color", () => {
        const result = GooseHelpers.parseColor("FF00AA");
        expect(result).toEqual({ red: 255, green: 0, blue: 170 });
    });

    test("handles lowercase hex correctly", () => {
        const result = GooseHelpers.parseColor("ff8800");
        expect(result).toEqual({ red: 255, green: 136, blue: 0 });
    });

    test("parses a hex with leading #", () => {
        const result = GooseHelpers.parseColor("#112233");
        expect(result).toEqual({ red: 17, green: 34, blue: 51 });
    });

    test("throws on invalid hex format", () => {
        expect(() => GooseHelpers.parseColor("GGHHII"))
            .toThrow("Invalid hex color format");
    });

    test("throws if input is not a string", () => {
        // @ts-expect-error testing invalid type
        expect(() => GooseHelpers.parseColor(123))
            .toThrow("Color must be a string");
    });
});

describe("GooseHelpers.toHexColor", () => {

    test("converts valid RGB to hex string", () => {
        const result = GooseHelpers.toHexColor(255, 0, 170);
        expect(result).toBe("FF00AA");
    });

    test("pads single-digit hex properly", () => {
        const result = GooseHelpers.toHexColor(4, 15, 160);
        expect(result).toBe("040FA0");
    });

    test("clamps values below 0", () => {
        const result = GooseHelpers.toHexColor(-20, 50, 50);
        expect(result).toBe("003232");  
    });

    test("clamps values above 255", () => {
        const result = GooseHelpers.toHexColor(300, 100, 100);
        expect(result).toBe("FF6464");
    });

    test("rounds fractional RGB values", () => {
		const result = GooseHelpers.toHexColor(10.7, 2.2, 254.9);
		expect(result).toBe("0B02FF");
	});
	
});
