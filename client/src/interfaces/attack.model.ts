export interface ItemData {
    scaling_function: (input: number) => number;
    details: ItemDetails;
}

export interface ItemDetails {
    type: string;
    name: string;
    description: string;
    icon: string;
}
