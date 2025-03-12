
import { CategoryType, CategoryData } from "/core/ui/options/options-helpers.js";

function addModCategory() {
    CategoryType["Mods"]="mods"
    CategoryData[CategoryType.Mods]= {
        title: "LOC_OPTIONS_CATEGORY_MODS",
        description: "LOC_OPTIONS_CATEGORY_MODS_DESCRIPTION"
    }
}
addModCategory();