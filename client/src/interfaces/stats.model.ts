import { Powerup } from "./attack.model";

export interface HealthData {
    max_health: number;
    current_health: number;
    change: number;
}

export interface DamageData {
    damage: number;
    isCritical: boolean;
    velocity: number;
    powerups: Powerup[];
}
