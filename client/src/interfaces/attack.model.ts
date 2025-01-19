export interface ItemData {
    scaling_function: (input: number) => number;
    details: ItemDetails;
    powerups: Powerup[];
}

export interface ItemDetails {
    type: string;
    name: string;
    description: string;
    icon: string;
}

export interface Powerup {
    type: 'speed' | 'strength' | 'shield';
    scaling_function: (input: number) => number;
    duration: number;
}

// Test powerup instances
export const POWERUPS: Record<string, Powerup> = {
    RAGE: {
        type: 'strength',
        scaling_function: (damage: number): number => damage * 1.5,
        duration: 5000,
    },
    
    SPEED_BOOST: {
        type: 'speed',
        scaling_function: (damage: number): number => damage * (1 + Math.random()),
        duration: 3000,
    },
    
    SHIELD: {
        type: 'shield',
        scaling_function: (damage: number): number => damage * 0.5,
        duration: 4000,
    },
    
    CRITICAL: {
        type: 'strength',
        scaling_function: (damage: number): number => 
            Math.random() < 0.2 ? damage * 3 : damage,
        duration: 7000,
    }
};

// Optional: type guard for powerups
export function isPowerup(item: any): item is Powerup {
    return item 
        && ['speed', 'strength', 'shield'].includes(item.type)
        && typeof item.scaling_function === 'function'
        && typeof item.duration === 'number';
}

