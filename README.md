# UI Debug Kit

Various tools for debugging the layout and rendering of React component trees.

### Installation

* 1\) `npm install ui-debug-kit --save-exact`
> The `--save-exact` flag is recommended (to disable version-extending), since this package uses [Explicit Versioning](https://medium.com/sapioit/why-having-3-numbers-in-the-version-name-is-bad-92fc1f6bc73c) (`Release.Breaking.FeatureOrFix`) rather than SemVer (`Breaking.Feature.Fix`).
>
> For `FeatureOrFix` version-extending (recommended for libraries), prepend "`~`" in `package.json`. (for `Breaking`, prepend "`^`")

### Usage

Example:
```
// render function of a React component-class
render() {
	[...]

	// if condition is true at time of render, a red outline box is displayed for 3s (by default), with the given text overlaid
	if (someCondition) {
		FlashComp(this, {wait: 0, text: `Look at me!`});
	}

	return [...];
}
```