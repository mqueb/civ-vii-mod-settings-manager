import { Options, OptionType } from "/core/ui/options/model-options.js";
import { CategoryData, CategoryType } from '/core/ui/options/options-helpers.js';
import { setupModOptions } from '../api/mod-settings-manager-options-api.js';

// Add a dependency on the Options module to ensure standard game options are loaded before the mod's
import '/core/ui/options/options.js';

// namespace must be unique for your mod to prevent conflicts
const modOptions = setupModOptions({ namespace: 'mod_settings_manager' });
// the name of the settings group to put this in, matched to a localization key
const MOD_OPTIONS_GROUP = 'MOD_OPTIONS_MANAGER';
const MSM_MOD_PROPERTY = { value: "mattifus_msm", label: "LOC_OPTIONS_GROUP_MOD_OPTIONS_MANAGER", tooltip: "" }


export const displayTypeOption = modOptions.addModOption({
    id: 'msm_display_type',
    category: CategoryType.Mods,
    group: MOD_OPTIONS_GROUP,
    type: OptionType.Dropdown,
    dropdownItems: [
        { value: "combobox", label: "LOC_OPTIONS_DISPLAY_TYPE_COMBOBOX", tooltip: "LOC_OPTIONS_DISPLAY_TYPE_COMBOBOX_TOOLTIP" },
        { value: "flat", label: "LOC_OPTIONS_DISPLAY_TYPE_FLAT" }
    ],
    defaultValue: "combobox",
    label: "LOC_OPTIONS_DISPLAY_TYPE",
    description: "LOC_OPTIONS_DISPLAY_TYPE_TOOLTIP",
    mod: MSM_MOD_PROPERTY
});