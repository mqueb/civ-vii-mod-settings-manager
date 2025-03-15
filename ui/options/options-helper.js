
import { CategoryType, CategoryData,  } from "/core/ui/options/options-helpers.js";
import { Options, OptionType } from "/core/ui/options/model-options.js";
import { ScreenOptions } from "./screen-options.js";


if(!CategoryType["Mods"]) {
    CategoryType["Mods"] = "mods";
    CategoryData[CategoryType.Mods] = {
        title: "LOC_UI_CONTENT_MGR_SUBTITLE",
        description: "LOC_UI_CONTENT_MGR_SUBTITLE_DESCRIPTION",
    };
}

Options.addInitCallback(() => {
    Options.addOption({ 
        category: CategoryType.Game, 
        // @ts-ignore
        group: 'mod_selection',
        type: OptionType.Dropdown, 
        mod: '',
        id: "mod-settings-choice-mod-option", 
        updateListener: ScreenOptions.onModCategoryUpdate, 
        label: "LOC_OPTIONS_GROUP_MOD_SELECTION", 
        dropdownItems: []
    });
});