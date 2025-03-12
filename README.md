# ModSettingsManager
ModSettingsManager for Civ7

## How to use for modders

during option creation just add
````
mod: { value: "lf_yields", label: "LOC_OPTIONS_MOD_LF_YIELDS", tooltip: "LOC_OPTIONS_MOD_LF_YIELDS_TOOLTIP" },
````

- value is the key to group your modSettings
- label will be displayed in the combo box
- tooltip will be on hover



````
Options.addInitCallback(() => {
    Options.addOption({ 
        category: CategoryType.Game, 
        // @ts-ignore
        group: 'lf_yields', 
        mod: { value: "lf_yields", label: "LOC_OPTIONS_MOD_LF_YIELDS", tooltip: "LOC_OPTIONS_MOD_LF_YIELDS_TOOLTIP" },
        type: OptionType.Checkbox, 
        id: "lf-yields-colorful", 
        initListener: onOptionColorfulInit, 
        updateListener: onOptionColorfulUpdate, 
        label: "LOC_MOD_LF_YIELDS_OPTION_COLORFUL", 
        description: "LOC_MOD_LF_YIELDS_OPTION_COLORFUL_DESC" 
    });
});
````
