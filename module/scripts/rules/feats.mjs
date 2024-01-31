/*
 * Adds Manuevers as a subtype of classes
 */
export function subFeatures(){
    CONFIG.DND5E.featureTypes.feat = {
        label: "Feat",
        subtypes: {
            manuevers: "Manuevers"
        }
    }
}