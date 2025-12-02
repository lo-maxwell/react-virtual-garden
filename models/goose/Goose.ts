import { GoosePersonalities, GoosePersonality, isGoosePersonality } from "./GoosePersonalities";

export interface GooseEntity {
    id: string;
    owner: string;      // goose pen UUID
    name: string;
    color: string;      // 6-char hex code
    birthday: Date;

    // JSONB attributes
    attributes: {
        power?: number;
        charisma?: number;
        personality?: string;
        mood?: number;
        location?: number;
        
        // Allow future expansion with no migration
        [key: string]: any;
    };
}


class Goose {
    private id: string;
    private name: string;
    private color: string;
    private birthday: number;
    private power: number;
    private charisma: number;
    private personality: GoosePersonality;
    private mood: number;
    private location: number;

    //should probably generate uuid
    constructor(
        id: string,
        name: string,
        color: string,
        birthday: number,
        power: number,
        charisma: number,
        personality: GoosePersonality,
        mood: number,
        location: number
    ) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.birthday = birthday;
        this.power = power;
        this.charisma = charisma;
        this.personality = personality;
        this.mood = mood;
        this.location = location;
    }

    static fromPlainObject(plainObject: any): Goose {
        try {
            if (!plainObject || typeof plainObject !== "object") {
                throw new Error("Invalid plainObject structure for Goose");
            }
    
            const {
                id,
                name,
                color,
                birthday,
                attributes = {}
            } = plainObject;
    
            const {
                power = 0,
                charisma = 0,
                personality = GoosePersonalities.SHY.name,
                mood = 0,
                location = 0
            } = attributes;
    
            if (typeof id !== "string") throw new Error("Invalid id");
            if (typeof name !== "string") throw new Error("Invalid name");
            if (typeof color !== "string" || color.length != 6) throw new Error("Invalid color");
    
            let birthdayTimestamp: number;
            if (typeof birthday === "number") {
                birthdayTimestamp = birthday;
            } else if (birthday instanceof Date) {
                birthdayTimestamp = birthday.getTime();
            } else {
                throw new Error("Invalid birthday type");
            }
    
            if (!isGoosePersonality(personality)) {
                throw new Error("Invalid personality");
            }
    
            return new Goose(
                id,
                name,
                color,
                birthdayTimestamp,
                power,
                charisma,
                personality,
                mood,
                location
            );
        } catch (err) {
            console.error("Error creating Goose from plainObject:", err);
            console.error("Original object:", plainObject);
    
            return new Goose(
                "error",
                "Error Goose",
                "FFFFFF",
                Date.now(),
                0,
                0,
                GoosePersonalities.ERROR.name,
                0,
                0
            );
        }
    }

    toPlainObject(): any {
        return {
            id: this.id,
            name: this.name,
            color: this.color,
            birthday: this.birthday,
            attributes: {
                power: this.power,
                charisma: this.charisma,
                personality: this.personality,
                mood: this.mood,
                location: this.location
            }
        };
    }


    static fromEntity(entity: GooseEntity): Goose {
        const { id, name, color, birthday, attributes } = entity;
    
        return new Goose(
            id,
            name,
            color,
            birthday instanceof Date ? birthday.getTime() : Number(birthday),
            attributes?.power ?? 0,
            attributes?.charisma ?? 0,
            isGoosePersonality(attributes?.personality)
                ? attributes.personality
                : GoosePersonalities.ERROR.name,
            attributes?.mood ?? 0,
            attributes?.location ?? 0
        );
    }
    

    toEntity(owner: string): GooseEntity {
        return {
            id: this.id,
            owner,
            name: this.name,
            color: this.color,
            birthday: new Date(this.birthday),
            attributes: {
                power: this.power,
                charisma: this.charisma,
                personality: this.personality,
                mood: this.mood,
                location: this.location
            }
        };
    }

	// ----------- GETTERS -----------
    getId(): string { return this.id; }
    getName(): string { return this.name; }
    getColor(): string { return this.color; }
    getBirthday(): number { return this.birthday; }
    getPower(): number { return this.power; }
    getCharisma(): number { return this.charisma; }
    getPersonality(): GoosePersonality { return this.personality; }
    getMood(): number { return this.mood; }
    getLocation(): number { return this.location; }

    // ----------- SETTERS -----------
    // setId(id: string): void { this.id = id; } //cannot change id of a goose
    setName(name: string): boolean { this.name = name; return true; }
    setBirthday(birthday: number): boolean { this.birthday = birthday; return true; }
    setColor(color: string): boolean { 
        if (color.length !== 6) return false;
        this.color = color; 
        return true; 
    }
    setPower(power: number): boolean { this.power = power; return true; }
    setCharisma(charisma: number): boolean { this.charisma = charisma; return true; }
    setPersonality(personality: GoosePersonality): boolean { this.personality = personality; return true; }
    setMood(mood: number): boolean { this.mood = mood; return true; }
    setLocation(location: number): boolean { this.location = location; return true; }

    
}

export default Goose;
