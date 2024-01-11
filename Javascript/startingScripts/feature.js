/*
Things that affect features more may exist later
*/
export function feature(){
    CONFIG.DND5E.featureTypes.ancestry = {
        label: "Ancestry Features"
    };
    delete CONFIG.DND5E.featureTypes.race
}