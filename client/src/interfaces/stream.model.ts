import { ItemData } from "./attack.model";
import { HealthData } from "./stats.model";

export interface StreamData {
    video: MediaStream;
    handData: HandData;
    itemData: ItemData;
    healthData: HealthData;
}

export interface VideoTrackData {
    id: string;
    kind: string;
    label: string;
    enabled: boolean;
    muted: boolean;
    readyState: string;
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
