# ModSettingsManager
ModSettingsManager for Civ7

ModSettingsManager is a mod to allow to organize Mod Settings. It's not required at all to have mods options displayed

## How to add Option id Mod Category

The simpliest way is by far to use: [OptionsAPI](https://github.com/tpadjen/civ-vii-mod-options-api)

## What this Mod do

- add a combobox for each (groupOf) Mod. Allowing to display only wanted one without scrolling.

- sort mods Setting by their group

- allows to have custom group if ComboBox display is used or not.

- makes headers collapsible


## How to have multiple group inside my mod selection

By default each different 'group' generate a insert into mods dropdown. But you can define a mod property in your option declartion like that:

````
mod: { value: "your_mod_code", label: "LOC_OPTIONS_MOD_YOUR_MOD", tooltip: "LOC_OPTIONS_MOD_YOUR_MOD_TOOLTIP" }
````

It will define your insert into the dropdown.


## How to have multiple group in combobox but only one otherwise

add `groupCB` property to your mod declaration. It will be used as `group` if comboDisplay enabled

````javascript
export const enableAutoSelectEmptySlotOption = modOptions.addModOption({
    id: 'mmf-feature-auto-select-empty-slot',
    category: CategoryType.Mods,
    group: MOD_OPTIONS_GROUP_FLAT,
    groupCB: MOD_OPTIONS_GROUP_FEATURES,
    type: OptionType.Checkbox,
    defaultValue: true,
    label: "LOC_OPTIONS_MMF_ENABLE_FEATURE_AUTO_SELECT_EMPTY_SLOT"
});


export const hideCheckboxOption = modOptions.addModOption({
    id: 'mmf-config-hide-checkbox',
    category: CategoryType.Mods,
    group: MOD_OPTIONS_GROUP_FLAT,
    groupCB: MOD_OPTIONS_GROUP_CONFIG,
    type: OptionType.Checkbox,
    defaultValue: true,
    label: "LOC_OPTIONS_MMF_CONFIG_HIDE_CHECKBOX",
    description: "LOC_OPTIONS_MMF_CONFIG_HIDE_CHECKBOX_TOOLTIP"
});
````