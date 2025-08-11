module.exports = {
	root: true,
	env: {
		browser: true,
		node: true,
		es2021: true,
	},
	parserOptions: {
		ecmaVersion: 12,
		sourceType: 'module',
	},
	extends: ['eslint:recommended', 'plugin:prettier/recommended'],
	rules: {
		// Enforce semicolons and dangling commas
		semi: ['error', 'always'],
		'comma-dangle': ['error', 'always-multiline'],

		// Ignore all unused function arguments (_event, _dialog, etc.)
		'no-unused-vars': ['error', {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            ignoreRestSiblings: true
        }]
	},
	globals: {
		// Foundry/VTT globals
		foundry: 'readonly',
		game: 'readonly',
		canvas: 'readonly',
		ui: 'readonly',
		CONFIG: 'readonly',
		CONST: 'readonly',
		Roll: 'readonly',
		MidiQOL: 'readonly',
		Token: 'readonly',
		fromUuid: 'readonly',
		console: 'readonly',
	},
};
