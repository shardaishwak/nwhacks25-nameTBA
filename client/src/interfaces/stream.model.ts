import { ItemData } from "./attack.model";
import { HealthData } from "./stats.model";

export interface StreamData {
    video: MediaStream;
    handData: HandData;
    itemData: ItemData;
    healthData: HealthData;
}

export interface HandData {
    speed: number;
    position: {
        x: number;
        y: number;
    };
    direction: string;
    powerup: boolean;
}
