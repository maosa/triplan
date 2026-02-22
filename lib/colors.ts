export function getIntensityColor(intensity: number): string {
    // Map 0-10 intensity to HSL Hue 120 (Green) to 0 (Red)
    const hue = 120 - (intensity / 10) * 120;
    // Saturation 85%, Lightness 50% for vibrant, readable badges
    return `hsl(${hue}, 85%, 50%)`;
}

export function getDiscreteGradient(): string {
    // 21 distinct steps from 0.0 to 10.0 (in increments of 0.5)
    const steps = 21;
    const stops = [];
    
    for (let i = 0; i < steps; i++) {
        // Intensity value from 0.0, 0.5, 1.0 ... to 10.0
        const value = i * 0.5;
        const color = getIntensityColor(value);
        
        // Calculate percentages for CSS hard-stops
        const segmentWidth = 100 / steps;
        const startPct = i * segmentWidth;
        const endPct = (i + 1) * segmentWidth;
        
        stops.push(`${color} ${startPct}%, ${color} ${endPct}%`);
    }
    
    return `linear-gradient(to right, ${stops.join(', ')})`;
}
