import { ItemData } from "./attack.model";
import { HandData } from "./hand.model";
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

