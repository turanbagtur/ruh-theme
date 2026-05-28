export const CULTIVATION_RANKS = [
    { title: 'Cennet Büyükustası', minPoints: 1500, color: '#f87171', progressColor: 'linear-gradient(90deg, #f87171, #fca5a5)' },
    { title: 'Uyanış Ruhu', minPoints: 500, color: '#a855f7', progressColor: 'linear-gradient(90deg, #a855f7, #c084fc)' },
    { title: 'Öz Oluşumu', minPoints: 200, color: '#3b82f6', progressColor: 'linear-gradient(90deg, #3b82f6, #60a5fa)' },
    { title: 'Enerji Yoğunlaşması', minPoints: 50, color: '#22c55e', progressColor: 'linear-gradient(90deg, #22c55e, #4ade80)' },
    { title: 'Çırak', minPoints: 0, color: '#6b7280', progressColor: 'linear-gradient(90deg, #6b7280, #9ca3af)' },
];

export function getCultivationData(yomiPoints) {
    const points = yomiPoints || 0;
    
    // Find current rank
    const currentRankIndex = CULTIVATION_RANKS.findIndex(r => points >= r.minPoints);
    const currentRank = CULTIVATION_RANKS[currentRankIndex];
    
    // Find next rank
    const nextRank = currentRankIndex > 0 ? CULTIVATION_RANKS[currentRankIndex - 1] : null;
    
    // Calculate progress
    let progressPercent = 100;
    if (nextRank) {
        const range = nextRank.minPoints - currentRank.minPoints;
        const currentProgress = points - currentRank.minPoints;
        progressPercent = Math.min(100, Math.max(0, (currentProgress / range) * 100));
    }

    return {
        ...currentRank,
        nextRank,
        progressPercent
    };
}
