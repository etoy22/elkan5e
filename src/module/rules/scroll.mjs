export function scroll() {
    console.log("Elkan 5e  |  Initializing Scrolls");
    if (!CONFIG.DND5E?.spellScrollIds) {
        console.warn("Elkan 5e | CONFIG.DND5E.spellScrollIds not initialized");
        return;
    }
    const scrolls = [
        "rQ6sO7HDWzqMhSI3", "9GSfMg0VOA2b4uFN", "XdDp6CKh9qEvPTuS",
        "hqVKZie7x9w3Kqds", "DM7hzgL836ZyUFB1", "wa1VF8TXHmkrrR35",
        "tI3rWx4bxefNCexS", "mtyw4NS1s7j2EJaD", "aOrinPg7yuDZEuWr",
        "O4YbkJkLlnsgUszZ"
    ];

    scrolls.forEach((id, index) => {
        CONFIG.DND5E.spellScrollIds[index] = `Compendium.elkan5e.elkan5e-magic-items.Item.${id}`;
    });
}
