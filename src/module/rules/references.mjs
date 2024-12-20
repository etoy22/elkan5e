export function references(){
    skillsRef()
    combatRef()
    conditionsRef()
    damageRef()
    spellCasting()
    //TODO: Put it back in after merging with the main version
    // spellSchools() 
}

export function skillsRef(){
    console.log("Elkan 5e  |  Initializing Skills References")
    
    //Reference on character sheet
    CONFIG.DND5E.skills.acr.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.nJvKshCeUsYho87K"
    CONFIG.DND5E.skills.ani.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.JR9h0nL97GegQ9Vz"
    CONFIG.DND5E.skills.arc.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.Cc49eyAgMrF1GIjH"
    CONFIG.DND5E.skills.ath.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.1lTpjCIaINKzvmKI"
    CONFIG.DND5E.skills.dec.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.UDcxonEumLH5vEQu"
    CONFIG.DND5E.skills.his.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.o9V0Z91HWH84JHda"
    CONFIG.DND5E.skills.ins.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.HAKuuUMWW3pRCMoL"
    CONFIG.DND5E.skills.inv.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.1VOLgBW7kkGwaPbH"
    CONFIG.DND5E.skills.itm.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.3WqeQryCXL1gtaEo"
    CONFIG.DND5E.skills.med.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.bEEOxmai3Q08nTfT"
    CONFIG.DND5E.skills.nat.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.0v0AbmZaL3N0zeO2"
    CONFIG.DND5E.skills.per.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.X3dKHNVduLjYxR1x"
    CONFIG.DND5E.skills.prc.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.pIFI2y2qLS9ovm0C"
    CONFIG.DND5E.skills.prf.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.9bVttJ5qNpwiOpzL"
    CONFIG.DND5E.skills.rel.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.KGv0Bkb9thO9K4xJ"
    CONFIG.DND5E.skills.slt.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.ynZa3sl1E681sRlP"
    CONFIG.DND5E.skills.ste.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.LnS51AK4Yi0P53QT"
    CONFIG.DND5E.skills.sur.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.6KIdxNMhOuvZUMxc"
    
    //Reference to these using &Reference
    CONFIG.DND5E.enrichmentLookup.skills.arc.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.nJvKshCeUsYho87K"
    CONFIG.DND5E.enrichmentLookup.skills.ani.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.JR9h0nL97GegQ9Vz"
    CONFIG.DND5E.enrichmentLookup.skills.arc.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.Cc49eyAgMrF1GIjH"
    CONFIG.DND5E.enrichmentLookup.skills.ath.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.1lTpjCIaINKzvmKI"
    CONFIG.DND5E.enrichmentLookup.skills.dec.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.UDcxonEumLH5vEQu"
    CONFIG.DND5E.enrichmentLookup.skills.his.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.o9V0Z91HWH84JHda"
    CONFIG.DND5E.enrichmentLookup.skills.ins.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.HAKuuUMWW3pRCMoL"
    CONFIG.DND5E.enrichmentLookup.skills.inv.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.1VOLgBW7kkGwaPbH"
    CONFIG.DND5E.enrichmentLookup.skills.itm.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.3WqeQryCXL1gtaEo"
    CONFIG.DND5E.enrichmentLookup.skills.med.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.bEEOxmai3Q08nTfT"
    CONFIG.DND5E.enrichmentLookup.skills.nat.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.0v0AbmZaL3N0zeO2"
    CONFIG.DND5E.enrichmentLookup.skills.per.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.X3dKHNVduLjYxR1x"
    CONFIG.DND5E.enrichmentLookup.skills.prc.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.pIFI2y2qLS9ovm0C"
    CONFIG.DND5E.enrichmentLookup.skills.prf.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.9bVttJ5qNpwiOpzL"
    CONFIG.DND5E.enrichmentLookup.skills.rel.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.KGv0Bkb9thO9K4xJ"
    CONFIG.DND5E.enrichmentLookup.skills.slt.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.ynZa3sl1E681sRlP"
    CONFIG.DND5E.enrichmentLookup.skills.ste.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.LnS51AK4Yi0P53QT"
    CONFIG.DND5E.enrichmentLookup.skills.sur.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.6KIdxNMhOuvZUMxc"
    
}

export function combatRef(){
    console.log("Elkan 5e  |  Initializing Combat References")
    CONFIG.DND5E.rules.attack = "Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.IauYsEM9MxyZCIdc"
    CONFIG.DND5E.rules.opportunityattacks = "Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.5zEWVU1yw2Sv3hSI"
    CONFIG.DND5E.rules.dodge = "Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.2Fxm6ATuDUyDIrt7"
    CONFIG.DND5E.rules.dash = "Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.6UWCRY83phLnc7cF"
    CONFIG.DND5E.rules.disengage = "Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.bYoY0gZQArDraXRs"
    CONFIG.DND5E.rules.help = "Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.ZdoIWQgcoqcHlZSf"
    CONFIG.DND5E.rules.hide = "Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.57VIppmrOewNVKF5"
    CONFIG.DND5E.rules.ready = "Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.Uo0qriXzk4YInJrl"
    CONFIG.DND5E.rules.search = "Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.bRo3ci56JJiuxYk8"
    CONFIG.DND5E.rules.surprise = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.QOZeW0m8RCdVg6UE"
    CONFIG.DND5E.rules.unarmedstrike = "Compendium.elkan5e.elkan5e-class-features.Item.pRDNsHpNLLk1Qq58"
    CONFIG.DND5E.rules.twoweaponfighting = "Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.XLZbNEhoayCw5bk8"
}

export function conditionsRef(){
    console.log("Elkan 5e  |  Initializing Condition References")
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
    // CONFIG.DND5E.spellTags.concentration.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.4ZOHN6tGvj54J6Kv"
    
    //TODO: Talk about these condition   
    CONFIG.DND5E.rules.concentrating = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.zY2CHn81NAqSs6gh"
    CONFIG.DND5E.rules.surprise = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.QOZeW0m8RCdVg6UE"
    
    
    //Cover
    CONFIG.DND5E.rules.cover = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.d2hBqe6EYHX2mxKD"
    CONFIG.DND5E.rules.halfcover = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.1BmTbnT3xDPqv9dq"
    CONFIG.DND5E.rules.threequarterscover = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.82ph4sMqvhxjLbiw"
    CONFIG.DND5E.rules.totalcover = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.hY5s70xMeG5ISFUA"


    CONFIG.statusEffects.find(effect => effect.id === "blinded").reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.SXTqmewRrCwPS8yW"
    CONFIG.statusEffects.find(effect => effect.id === "charmed").reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.ieDILSkRbu9r8pmZ"
    CONFIG.statusEffects.find(effect => effect.id === "deafened").reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.AHgIwuNdpp0wKF2y"
    CONFIG.statusEffects.find(effect => effect.id === "exhaustion").reference ="Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.mPzXN6MW8L6ePFmq"
    CONFIG.statusEffects.find(effect => effect.id === "frightened").reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.ruwpm6lorwoPJsmt"
    CONFIG.statusEffects.find(effect => effect.id === "grappled").reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.zaI1nuc41wANKoFX"
    CONFIG.statusEffects.find(effect => effect.id === "incapacitated").reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.PXI4uoXj7x6IsDXt"
    CONFIG.statusEffects.find(effect => effect.id === "invisible").reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.GfTD899cLRZxGG1H"
    CONFIG.statusEffects.find(effect => effect.id === "paralyzed").reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.w5RoCYZIujGYuiYt"
    CONFIG.statusEffects.find(effect => effect.id === "petrified").reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.n0BX8pLecgm7E3uH"
    CONFIG.statusEffects.find(effect => effect.id === "poisoned").reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.fzEf89TZ1WN90bFv"
    CONFIG.statusEffects.find(effect => effect.id === "prone").reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.y8L5Uq1jMVDsQjaS"
    CONFIG.statusEffects.find(effect => effect.id === "restrained").reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.DiWd3u4HCD7JEw8V"
    CONFIG.statusEffects.find(effect => effect.id === "surprised").reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.QOZeW0m8RCdVg6UE"
    CONFIG.statusEffects.find(effect => effect.id === "stunned").reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.JV8kbMo0p5S1YXUR"
    CONFIG.statusEffects.find(effect => effect.id === "unconscious").reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.ZwhWWUPJvpFCz8sK"

}

export function damageRef(){
    console.log("Elkan 5e  |  Initializing New Damage References")
    CONFIG.DND5E.damageTypes.acid.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.VKYjrEO909FEbScG"
    CONFIG.DND5E.damageTypes.bludgeoning.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.DLkhjyAJK6R1lPrA"
    CONFIG.DND5E.damageTypes.cold.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.qnctn4Gcve0px0wU"
    CONFIG.DND5E.damageTypes.lightning.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.inNJv5hIxFOb0atF" //Renamed to Electric
    CONFIG.DND5E.damageTypes.fire.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.8ZmYsUdejP3wal1K"
    CONFIG.DND5E.damageTypes.force.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.hnbcchv13gA0ev8j"
    CONFIG.DND5E.damageTypes.necrotic.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.3WAI4TbrSC8FS637"
    CONFIG.DND5E.damageTypes.piercing.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.cEnkMbQascSe6lKU"
    CONFIG.DND5E.damageTypes.poison.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.Mh0WKYgypPl7hKSo"
    CONFIG.DND5E.damageTypes.psychic.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.DiUkrQVun34pAK4Z"
    CONFIG.DND5E.damageTypes.radiant.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.1iv5sIBnKoFJrhMH"
    CONFIG.DND5E.damageTypes.slashing.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.yxrHRnhVdSzKtzyZ"
    CONFIG.DND5E.damageTypes.thunder.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.kPmCUWoSWv3lEW3t"
}

export function spellSchools(){
    console.log("Elkan 5e  |  Initializing Spell Schools References")
    CONFIG.DND5E.spellSchools.abj.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.VSLRbhCQjaWPWypa"
    CONFIG.DND5E.spellSchools.con.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.vaLYevRxKe8mAvdE.JournalEntryPage.D2ovyzg8yEFPPFRx"
    CONFIG.DND5E.spellSchools.div.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.vaLYevRxKe8mAvdE.JournalEntryPage.ppulpuqZdX9NWhDW"
    CONFIG.DND5E.spellSchools.enc.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.vaLYevRxKe8mAvdE.JournalEntryPage.HNaA5EPd5oQbjpCS"
    CONFIG.DND5E.spellSchools.evo.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.vaLYevRxKe8mAvdE.JournalEntryPage.59py3wilfbmPlYOp"
    CONFIG.DND5E.spellSchools.ill.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.vaLYevRxKe8mAvdE.JournalEntryPage.FXtdLPYZwF7jbrgX"
    CONFIG.DND5E.spellSchools.nec.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.vaLYevRxKe8mAvdE.JournalEntryPage.NIhSGdIUiNhPd11A"
    CONFIG.DND5E.spellSchools.trs.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.vaLYevRxKe8mAvdE.JournalEntryPage.unhaExaZiVj3FqEl"
}


export function spellCasting(){
    console.log("Elkan 5e  |  Initializing Spell Casting References")
    CONFIG.DND5E.rules.spellslots = "Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.RAatADW6Izlm9yu6"
    CONFIG.DND5E.rules.spelllevel = "Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.RAatADW6Izlm9yu6"
    CONFIG.DND5E.rules.cantrips = "Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.UnQ8KUMYK3a6BWwu"
    CONFIG.DND5E.rules.upcasting = "Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.wvECxDLurbCDec4h"
    CONFIG.DND5E.rules.castingatahigherlevel = "Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.wvECxDLurbCDec4h"
    CONFIG.DND5E.rules.multiplespellsinaturn = "Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.Rxjj26a4VyVnZYk9"
    CONFIG.DND5E.rules.duplicatemagicaleffects = "Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.uWa3L8lGJKgICYHt"
    CONFIG.DND5E.rules.lineofsight = "Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.5V7gVZ9fe5AWawwb"
    CONFIG.DND5E.rules.coverandwalls = "Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.2QBRvP0XH1PBboSs"
    CONFIG.DND5E.rules.castinginarmor = "Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.kwjLwbgZuqdcj17X"
    CONFIG.DND5E.rules.castingtime = "Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.1H5OBLq2k7EmNowe"
    CONFIG.DND5E.rules.spelltargets = "Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.HHfnotH75EXQ9zsP"
    CONFIG.DND5E.rules.spellrange = "Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.rM1U1uAq2GD0ls8a"
    CONFIG.DND5E.rules.verbal = "Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.wvyS2GRHioSYrMW0"
    CONFIG.DND5E.rules.spellduration = "Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.KywepPZfytUpWKql"
    CONFIG.DND5E.rules.illusoryimages = "Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.GtUH7c2Spk6XpU3B"
    CONFIG.DND5E.rules.knownspells = "Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.qUZNQFDTomNDA9bv"
    CONFIG.DND5E.rules.preparedspells = "Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.tvQAz6EC8cGVKRYi"
    CONFIG.DND5E.rules.abilityspells = "Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.arD4KLvgCPbi1Pl7"
    CONFIG.DND5E.rules.focusspells = "Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.R25K8TvAPK3c4ywr"
    CONFIG.DND5E.rules.spellscroll = "Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.R25K8TvAPK3c4ywr"
    CONFIG.DND5E.rules.cursed = "Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.Vpwu9GQC6HVNZFze"

    // Changing the properies in itemProperties
    CONFIG.DND5E.itemProperties.concentration.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.4ZOHN6tGvj54J6Kv"
    CONFIG.DND5E.itemProperties.material.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.gdVkgCiREuukVhLb"
    CONFIG.DND5E.itemProperties.ritual.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.CMI1OFzBkvjEmlj7"
    CONFIG.DND5E.itemProperties.vocal.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.wvyS2GRHioSYrMW0"
    CONFIG.DND5E.itemProperties.somatic.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.ooFAPmKTS7Cd6YXp"


}