export function registerTemplateHooks() {
	// Template movement synchronization
	Hooks.on("updateMeasuredTemplate", async (template) => {
		const lights = canvas.lighting.placeables.filter(
			(l) => l.document.getFlag("elkan5e", "linkedTemplate") === template.id,
		);
		if (!lights.length) return;
		for (const light of lights) {
			await light.document.update({ x: template.x, y: template.y });
		}
	});

	Hooks.on("deleteMeasuredTemplate", async (template) => {
		const lights = canvas.lighting.placeables.filter(
			(l) => l.document.getFlag("elkan5e", "linkedTemplate") === template.id,
		);
		if (!lights.length) return;
		const ids = lights.map((l) => l.id);
		await canvas.scene.deleteEmbeddedDocuments("AmbientLight", ids);
	});
}
