# ModSettingsManager
ModSettingsManager for Civ7

ModSettingsManager is a mod to allow to organize Mod Settings. It's not required at all to have mods options displayed

## How to add Option id Mod Category

just add that in your mod to appear in Mods category

````javascript
CategoryType["Mods"] = "mods";
CategoryData[CategoryType.Mods] = {
    title: "LOC_UI_CONTENT_MGR_SUBTITLE",
    description: "LOC_UI_CONTENT_MGR_SUBTITLE_DESCRIPTION",
};
````

and then use that category when creating your options

## What Mod do

It add a combobox for each (groupOf) Mod. Allowing to display only wanted one without scrolling.

It sort mods Setting by their group

It allow to have custom group if ComboBox display is used or not.


## How to have multiple group inside my mod selection

By default each different 'group' generate a insert into mods dropdown. But you can define a mod property in your option declartion like that:

````
mod: { value: "your_mod_code", label: "LOC_OPTIONS_MOD_YOUR_MOD", tooltip: "LOC_OPTIONS_MOD_YOUR_MOD_TOOLTIP" }
````

It will define your insert into the dropdown.


## How to have multiple group in combobox but only one otherwise

add `groupCB` property to your mod declartion. It will be used as `group` if comboDisplay enabled