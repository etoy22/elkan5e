/**
 * Adds the Elkan 5e conditions to Foundry.
 */
export function conditions(){
    console.log("Elkan 5e  |  Initializing Conditions")

    //Replace icons
    CONFIG.DND5E.conditionTypes.blinded.icon = "modules/elkan5e/icons/blinded.svg "
   
    CONFIG.DND5E.conditionTypes.charmed.icon = "modules/elkan5e/icons/charmed.svg"
    CONFIG.DND5E.conditionTypes.deafened.icon = "modules/elkan5e/icons/deafened.svg"
    CONFIG.DND5E.conditionTypes.frightened.icon = "modules/elkan5e/icons/frightened.svg"
    CONFIG.DND5E.conditionTypes.grappled.icon = "modules/elkan5e/icons/grappled.svg"
    CONFIG.DND5E.conditionTypes.incapacitated.icon = "modules/elkan5e/icons/incapacitated.svg"
    CONFIG.DND5E.conditionTypes.invisible.icon = "modules/elkan5e/icons/invisible.svg"
    CONFIG.DND5E.conditionTypes.restrained.icon = "modules/elkan5e/icons/restrained.svg"
    CONFIG.DND5E.conditionTypes.paralyzed.icon = "modules/elkan5e/icons/paralyzed.svg"
    CONFIG.DND5E.conditionTypes.petrified.icon = "modules/elkan5e/icons/petrified.svg"
    CONFIG.DND5E.conditionTypes.poisoned.icon = "modules/elkan5e/icons/poisoned.svg"
    CONFIG.DND5E.conditionTypes.prone.icon = "modules/elkan5e/icons/prone.svg"
    CONFIG.DND5E.conditionTypes.stunned.icon = "modules/elkan5e/icons/stunned.svg"
    CONFIG.DND5E.conditionTypes.unconscious.icon = "modules/elkan5e/icons/unconscious.svg"

    //Replace References
    CONFIG.DND5E.conditionTypes.blinded.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.SXTqmewRrCwPS8yW"
    CONFIG.DND5E.conditionTypes.charmed.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.ieDILSkRbu9r8pmZ"
    CONFIG.DND5E.conditionTypes.deafened.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.AHgIwuNdpp0wKF2y"
    CONFIG.DND5E.conditionTypes.frightened.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.ruwpm6lorwoPJsmt"
    CONFIG.DND5E.conditionTypes.grappled.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.zaI1nuc41wANKoFX"
    CONFIG.DND5E.conditionTypes.incapacitated.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.PXI4uoXj7x6IsDXt"
    CONFIG.DND5E.conditionTypes.invisible.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.GfTD899cLRZxGG1H"
    CONFIG.DND5E.conditionTypes.paralyzed.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.w5RoCYZIujGYuiYt"
    CONFIG.DND5E.conditionTypes.petrified.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.n0BX8pLecgm7E3uH"
    CONFIG.DND5E.conditionTypes.poisoned.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.fzEf89TZ1WN90bFv"
    CONFIG.DND5E.conditionTypes.prone.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.y8L5Uq1jMVDsQjaS"
    CONFIG.DND5E.conditionTypes.restrained.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.DiWd3u4HCD7JEw8V"
    CONFIG.DND5E.conditionTypes.stunned.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.JV8kbMo0p5S1YXUR"
    CONFIG.DND5E.conditionTypes.unconscious.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.ZwhWWUPJvpFCz8sK"
    CONFIG.DND5E.conditionTypes.exhaustion.reference ="Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.mPzXN6MW8L6ePFmq"
    
    
    //Concentration
    CONFIG.DND5E.spellTags.concentration.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.4ZOHN6tGvj54J6Kv"
    
    //TODO: Talk about these condition   
    CONFIG.DND5E.rules.concentrating = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.zY2CHn81NAqSs6gh"
    CONFIG.DND5E.spellTags.concentration.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.4ZOHN6tGvj54J6Kv"
    CONFIG.DND5E.rules.surprise = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.QOZeW0m8RCdVg6UE"
    
    
    //Cover
    CONFIG.DND5E.rules.cover = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.d2hBqe6EYHX2mxKD"
    CONFIG.DND5E.rules.halfcover = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.1BmTbnT3xDPqv9dq"
    CONFIG.DND5E.rules.threequarterscover = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.82ph4sMqvhxjLbiw"
    CONFIG.DND5E.rules.totalcover = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.hY5s70xMeG5ISFUA"
    
    
    //For now this is commented out while we work on effecting icons
    //Add conditions
    CONFIG.DND5E.conditionTypes.confused = {
        label:"Confused",
        reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.WJFtNc5UraHVrV5V",
        icon:"modules/elkan5e/icons/confused.svg"
    }
    CONFIG.DND5E.conditionTypes.halfcover = {
        label:"Half Cover",
        reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.1BmTbnT3xDPqv9dq",
        icon:"modules/elkan5e/icons/cover-half.svg"
    }
    CONFIG.DND5E.conditionTypes.threequarterscover = {
        label:"Three Quarters Cover",
        reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.1BmTbnT3xDPqv9dq",
        icon:"modules/elkan5e/icons/cover-three-quarters.svg"
    }
    CONFIG.DND5E.conditionTypes.dazed = {
        label:"Dazed",
        reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.0BYyVwipnS55gVFq",
        icon:"modules/elkan5e/icons/dazed.svg"
    }
    CONFIG.DND5E.conditionTypes.dominated = {
        label: "Dominated",
        statuses:["Charmed"],
        reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.0OYaVPznKqYgchW9",
        icon:"modules/elkan5e/icons/dominated.svg"
    };
    CONFIG.DND5E.conditionTypes.drained = {
        label: "Drained",
        reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.ZnhMIMgPZv1QDxzZ",
        icon:"modules/elkan5e/icons/drained.svg"
    };
    CONFIG.DND5E.conditionTypes.goaded = {
        label: "Goaded",
        reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.IVZ318d1P8WBcDxN",
        icon:"modules/elkan5e/icons/goaded.svg"
    };
    CONFIG.DND5E.conditionTypes.hasted = {
        label: "Hasted",
        reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.8dnyv0szJi7dCz74",
        icon:"modules/elkan5e/icons/hasted.svg"
    };
    CONFIG.DND5E.conditionTypes.silence = {
        label: "Silenced",
        reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.F51xrE7Mj8VeM3b8",
        icon:"modules/elkan5e/icons/silenced.svg"
    };
    CONFIG.DND5E.conditionTypes.siphoned = {
        label: "Siphoned",
        reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.SthB8javJuFySiBg",
        icon:"modules/elkan5e/icons/siphoned.svg"
    };
    CONFIG.DND5E.conditionTypes.slowed = {
        label: "Slowed",
        reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.kkbgHooTzrtu4q8T",
        icon:"modules/elkan5e/icons/slowed.svg"
    };

    CONFIG.DND5E.conditionTypes.weakened = {
        label: "Weakened",
        reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.iJT3cWvyTNBv1L5h",
        icon:"modules/elkan5e/icons/weakened.svg"
    };
    CONFIG.statusEffects = CONFIG.statusEffects.filter(effect => effect.id !== "bleeding");
    CONFIG.statusEffects = CONFIG.statusEffects.filter(effect => effect.id !== "burrowing");
    CONFIG.statusEffects = CONFIG.statusEffects.filter(effect => effect.id !== "cursed");
    CONFIG.statusEffects = CONFIG.statusEffects.filter(effect => effect.id !== "flying");
    CONFIG.statusEffects = CONFIG.statusEffects.filter(effect => effect.id !== "marked");
    CONFIG.statusEffects = CONFIG.statusEffects.filter(effect => effect.id !== "transformed");
    CONFIG.statusEffects = CONFIG.statusEffects.filter(effect => effect.id !== "dodging");
    CONFIG.statusEffects = CONFIG.statusEffects.filter(effect => effect.id !== "hidden");
    CONFIG.statusEffects = CONFIG.statusEffects.filter(effect => effect.id !== "sleeping");
    
}


/*
* Makes the world use Elkan 5e icons
*/
export function icons(){
    

    console.log("Elkan 5e  |  Initializing Icons")
    CONFIG.statusEffects.find(effect => effect.id === "dead").icon = "modules/elkan5e/icons/dead.svg"
    CONFIG.statusEffects.find(effect => effect.id === "blinded").icon = "modules/elkan5e/icons/blinded.svg"
    CONFIG.statusEffects.find(effect => effect.id === "blinded").reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.SXTqmewRrCwPS8yW"
    CONFIG.statusEffects.find(effect => effect.id === "charmed").icon = "modules/elkan5e/icons/charmed.svg"
    CONFIG.statusEffects.find(effect => effect.id === "charmed").reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.ieDILSkRbu9r8pmZ"
    CONFIG.statusEffects.find(effect => effect.id === "concentrating").icon = "modules/elkan5e/icons/concentrating.svg"
    CONFIG.statusEffects.find(effect => effect.id === "deafened").icon = "modules/elkan5e/icons/deafened.svg"
    CONFIG.statusEffects.find(effect => effect.id === "deafened").reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.AHgIwuNdpp0wKF2y"
    CONFIG.statusEffects.find(effect => effect.id === "diseased").icon = "modules/elkan5e/icons/diseased.svg"
    CONFIG.statusEffects.find(effect => effect.id === "frightened").icon = "modules/elkan5e/icons/frightened.svg"
    CONFIG.statusEffects.find(effect => effect.id === "frightened").reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.ruwpm6lorwoPJsmt"
    CONFIG.statusEffects.find(effect => effect.id === "grappled").icon = "modules/elkan5e/icons/grappled.svg"
    CONFIG.statusEffects.find(effect => effect.id === "grappled").reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.zaI1nuc41wANKoFX"
    CONFIG.statusEffects.find(effect => effect.id === "incapacitated").icon = "modules/elkan5e/icons/incapacitated.svg"
    CONFIG.statusEffects.find(effect => effect.id === "incapacitated").reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.PXI4uoXj7x6IsDXt"
    CONFIG.statusEffects.find(effect => effect.id === "invisible").icon = "modules/elkan5e/icons/invisible.svg"
    CONFIG.statusEffects.find(effect => effect.id === "invisible").reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.GfTD899cLRZxGG1H"
    CONFIG.statusEffects.find(effect => effect.id === "paralyzed").icon = "modules/elkan5e/icons/paralyzed.svg"
    CONFIG.statusEffects.find(effect => effect.id === "paralyzed").reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.w5RoCYZIujGYuiYt"
    CONFIG.statusEffects.find(effect => effect.id === "petrified").icon = "modules/elkan5e/icons/petrified.svg"
    CONFIG.statusEffects.find(effect => effect.id === "petrified").reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.n0BX8pLecgm7E3uH"
    CONFIG.statusEffects.find(effect => effect.id === "poisoned").icon = "modules/elkan5e/icons/poisoned.svg"
    CONFIG.statusEffects.find(effect => effect.id === "poisoned").reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.fzEf89TZ1WN90bFv"
    CONFIG.statusEffects.find(effect => effect.id === "prone").icon = "modules/elkan5e/icons/prone.svg"
    CONFIG.statusEffects.find(effect => effect.id === "prone").reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.y8L5Uq1jMVDsQjaS"
    CONFIG.statusEffects.find(effect => effect.id === "restrained").icon = "modules/elkan5e/icons/restrained.svg"
    CONFIG.statusEffects.find(effect => effect.id === "restrained").reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.DiWd3u4HCD7JEw8V"
    CONFIG.statusEffects.find(effect => effect.id === "surprised").icon = "modules/elkan5e/icons/surprised.svg"
    CONFIG.statusEffects.find(effect => effect.id === "surprised").reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.QOZeW0m8RCdVg6UE"
    CONFIG.statusEffects.find(effect => effect.id === "stunned").icon = "modules/elkan5e/icons/stunned.svg"
    CONFIG.statusEffects.find(effect => effect.id === "stunned").reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.JV8kbMo0p5S1YXUR"
    CONFIG.statusEffects.find(effect => effect.id === "unconscious").icon = "modules/elkan5e/icons/unconscious.svg"
    CONFIG.statusEffects.find(effect => effect.id === "unconscious").reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.ZwhWWUPJvpFCz8sK"
    CONFIG.statusEffects.find(effect => effect.id === "exhaustion").reference ="Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.mPzXN6MW8L6ePFmq"
    CONFIG.statusEffects.find(effect => effect.id === "silence").icon ="modules/elkan5e/icons/silenced.svg"
    CONFIG.statusEffects.find(effect => effect.id === "exhaustion").reference ="Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.mPzXN6MW8L6ePFmq"
    
    
    CONFIG.statusEffects.push({
        "id": "cover_half",
        "name": "Half Cover",
        "icon": "modules/elkan5e/icons/cover-half.svg",
        "reference": "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.1BmTbnT3xDPqv9dq"
    });
    CONFIG.statusEffects.push({
        "id": "cover_three_quarters",
        "name": "Three Quarrter Cover",
        "icon": "modules/elkan5e/icons/cover-three-quarters.svg",
        "reference": "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.82ph4sMqvhxjLbiw"
    });
    
    CONFIG.statusEffects.push({
        "id": "confused",
        "name": "Confused",
        "icon": "modules/elkan5e/icons/confused.svg",
        "reference": "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.WJFtNc5UraHVrV5V"
    });
    
    CONFIG.statusEffects.push({
        "id": "dazed",
        "name": "Dazed",
        "icon": "modules/elkan5e/icons/dazed.svg",
        "reference": "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.0BYyVwipnS55gVFq"
    });
    
    CONFIG.statusEffects.push({
        "id": "dominated",
        "name": "Dominated",
        "icon": "modules/elkan5e/icons/dominated.svg",
        "reference": "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.0OYaVPznKqYgchW9",
        "statuses": [
            "charmed"
        ]
    });
    CONFIG.statusEffects.push({
        id:"drained",
        label: "Drained",
        reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.ZnhMIMgPZv1QDxzZ",
        icon:"modules/elkan5e/icons/drained.svg"
    });

    CONFIG.statusEffects.push({
        id:"goaded",
        label: "Goaded",
        reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.IVZ318d1P8WBcDxN",
        icon:"modules/elkan5e/icons/goaded.svg"
    });
    CONFIG.statusEffects.push({
        id:"hasted",
        label: "Hasted",
        reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.8dnyv0szJi7dCz74",
        icon:"modules/elkan5e/icons/hasted.svg"
    });
    CONFIG.statusEffects.push({
        id:"obscured-heavily",
        label: "Heavily Obscured",
        reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.UC5VK6i6vqWEUfMn",
        icon:"modules/elkan5e/icons/obscured-heavily.svg"
    });
    CONFIG.statusEffects.push({
        id:"obscured-lightly",
        label: "Lightly Obscured",
        reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.Jq7kMUlHodqSbYDD",
        icon:"modules/elkan5e/icons/obscured-lightly.svg"
    });
    CONFIG.statusEffects.push({
        id:"siphoned",
        label: "Siphoned",
        reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.SthB8javJuFySiBg",
        icon:"modules/elkan5e/icons/siphoned.svg"
    });
    CONFIG.statusEffects.push({
        id:"slowed",
        label: "Slowed",
        reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.kkbgHooTzrtu4q8T",
        icon:"modules/elkan5e/icons/slowed.svg"
    });
    
    CONFIG.statusEffects.sort((a, b) => {
        if (a.id === "dead" && b.id !== "dead") {
            return -1;
        }
        if (a.id !== "dead" && b.id === "dead") {
            return 1;
        }
        return a.id.localeCompare(b.id);
    });
    

    
}

/**
 * TODO: Adds functionality to Fey Ancestry to gain advantage on saves against charmed.
 *   
 */
export function feyAncest(){
}

/*
 * TODO: Automate grapple and give conditions according to the size of the attacker grappler and the
 * size of the grappled. Also roll to see if the creature is actually grappled
 */
export function grapple(){
    console.log("Grapple")
}

/**
 * TODO: Adds functionality to Dwarven Resilience to give advantage on saves via poison. Probably need to use midi to automate
 * maybe with looking at there overtime effects and how to mix that 
 */
export function dwarfResil(){

}

/**
 * Adds functionality to Sturdy to give advantage on saves via prone.   
 */
export function sturdy(){
}