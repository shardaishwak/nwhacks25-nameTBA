interface DamageData {
    damage: number;
    isCritical: boolean;
    velocity: number;
}

export function calculateDamage(velocity: number): DamageData {
    const velocityScaler = 10; // Same scaling factor as client
    const isCritical = Math.random() < 0.1; // 10% chance of critical hit
    const baseDamage = velocity * velocityScaler * (isCritical ? 2 : 1);

    return {
        damage: baseDamage,
        isCritical,
        velocity
    };
}
