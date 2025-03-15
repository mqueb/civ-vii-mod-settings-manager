import { Options, OptionType } from "/core/ui/options/model-options.js";
import { CategoryData, CategoryType } from '/core/ui/options/options-helpers.js';

export class JSONStore {

    static #LOCAL_STORAGE_KEY = "modSettings"; //do not change
    
    constructor(namespace = 'default') {
        this.namespace = namespace;
    }

    setItem(key, value) {
        if (localStorage.length > 1) {
            console.warn(`Invalid localStorage: Found (${localStorage.length} keys, only 1 allowed)`);
            const invalidKeys = (Object.keys(localStorage) ?? [])
                                    .filter(key => key !== JSONStore.#LOCAL_STORAGE_KEY);
            if (invalidKeys.length > 0) console.warn('Invalid keys: ', JSON.stringify(invalidKeys));
            console.warn(`Mods should only write data to "${JSONStore.#LOCAL_STORAGE_KEY}"`);
            console.warn('Clearing all localStorage data to allow continued usage');

            localStorage.clear();
        }

        const store = this.#readStore();
        const namespaceStore = store[this.namespace] ?? {}; 
        const updated = {
            ...store,
            [this.namespace]: {
                ...namespaceStore,
                [key]: value
            }
        }
        this.#writeStore(updated);
    }

    getItem(key) {
        const store = this.#readStore();
        const namespaceStore = store[this.namespace] ?? {};
        return namespaceStore[key];
    }

    clear() {
        const store = this.#readStore();
        delete store[this.namespace];
        this.#writeStore(store);
    }

    #readStore() {
        return JSON.parse(localStorage.getItem(JSONStore.#LOCAL_STORAGE_KEY))
    }

    #writeStore(store) {
        localStorage.setItem(JSONStore.#LOCAL_STORAGE_KEY, JSON.stringify(store));
    }
}

export class OptionsStore {
    options = [];

    constructor(dataStore, settingsKey = 'settings') {
        this.dataStore = dataStore;
        this.settingsKey = settingsKey;
    }

    addOption(option) {
        this.option = this.options.push(option);
        this.#setDefaultIfMissing(option);

        option.value = this.load(option);
    }

    load(option) {
        const settings = this.#readSettings();
        return settings 
            ? settings[option.id] 
            : option.defaultValue;
    }

    commitOptions() {
        const oldSettings = this.#readSettings();
        let newSettings = {
            ...oldSettings,
        };

        const updatedOptions = this.options.filter(option => option.updatedValue !== option.value);

        this.options.forEach(option => newSettings = { 
            ...newSettings, 
            [option.id]: option.updatedValue
        });
            
        this.#writeSettings(newSettings);

        updatedOptions.forEach(option => option.value = option.updatedValue);
        updatedOptions.forEach(option => option.onChange(option.value));
    }

    resetToDefaults() {
        const defaultSettings = this.#readSettings();
        let newSettings = {};
        this.options.forEach(option => newSettings = { 
            ...newSettings, 
            [option.id]: option.defaultValue
        });

        const updatedOptions = this.options.filter(option => option.value !== option.defaultValue);
        
        // leave other settings intact, but overwrite any loaded options with their defaults
        this.#writeSettings({
            ...defaultSettings,
            ...newSettings
        });

        updatedOptions.forEach(option => option.value = option.defaultValue);
        updatedOptions.forEach(option => option.onChange(option.value));
    }

    restore() {
        this.options.forEach(option => option.updatedValue = option.value);
    }

    clear() {
        this.dataStore.setItem(this.settingsKey, undefined);
    }

    #readSettings() {
        return this.dataStore.getItem(this.settingsKey) ?? {};
    }

    #writeSettings(settings) {
        this.dataStore.setItem(this.settingsKey, settings);
    }

    #setDefaultIfMissing(option) {
        const existingSettings = this.#readSettings();
        const newSettings = {
            [option.id]: option.defaultValue
        };
        
        // only write a default if the existing settings did not include the given option 
        this.#writeSettings({
            ...newSettings,
            ...existingSettings
        });
    }
}

export function setupModOptions({ namespace, settingsKey }) {
    const dataStore = new JSONStore(namespace ?? 'default');
    const optionsStore = new OptionsStore(dataStore, settingsKey ?? 'settings');

    CategoryType["Mods"] = "mods";
    CategoryData[CategoryType.Mods] = {
        title: "LOC_UI_CONTENT_MGR_SUBTITLE",
        description: "LOC_UI_CONTENT_MGR_SUBTITLE_DESCRIPTION",
    };

    const proto = Object.getPrototypeOf(Options);

    // commit options when user clicks save
    const commitOptions = proto.commitOptions;
    proto.commitOptions = function(...args) {
        commitOptions.apply(this, args);
        optionsStore?.commitOptions();
    }

    const resetOptionsToDefault = proto.resetOptionsToDefault;
    proto.resetOptionsToDefault = function(...args) {
        resetOptionsToDefault.apply(this, args);
        optionsStore?.resetToDefaults();
    }

    // user cancelled options changes, restore to previous values
    const restore = proto.restore;
    proto.restore = function(...args) {
        restore.apply(this, args);
        optionsStore?.restore();
    }

    function addModOption(modOption) {
        const newOption = {
            ...modOption,
            initListener(optionInfo) {
                
                optionInfo.currentValue = this.value;
                this.updatedValue = this.value;
                if (optionInfo.type == OptionType.Dropdown){
                    for (let index = 0; index < optionInfo.dropdownItems.length; ++index) {
                        if (optionInfo.dropdownItems[index].value == this.value) {
                            optionInfo.selectedItemIndex = index;
                            break;
                        }
                    }
                    optionInfo.currentValue = optionInfo.originalValue = this.value;
                }
            },
            updateListener(optionInfo, value) {
                if (optionInfo.type == OptionType.Dropdown){
                    const newValue = optionInfo.dropdownItems[value].value;
                    optionInfo.currentValue = newValue;
                    this.updatedValue = newValue;
                    console.error("Options.needReloadRefCount: "+ Options.needReloadRefCount);
                    if (optionInfo.currentValue != optionInfo.originalValue) {
                        console.error("iincrease needReloadRefCount...");
                        Options.needReloadRefCount += 1;
                    }
                    else {
                        if (Options.needReloadRefCount > 0) {
                            console.error("decrease needReloadRefCount...");
                            Options.needReloadRefCount -= 1;
                        }
                    }
                } else {
                    optionInfo.currentValue = value;
                    this.updatedValue = optionInfo.currentValue;
                }
                
            },
            _changeListeners: [],
            addChangeListener(callback) {
                this._changeListeners.push(callback);
            },
            removeChangeListener(callback) { 
                this._changeListeners = this.changeListeners.filter(cb => cb !== callback)
            },
            onChange(value) {
                this._changeListeners.forEach(callback => callback(value))
            }
        };

        optionsStore?.addOption(newOption);
        Options.addInitCallback(() => Options.addOption(newOption));

        return newOption;
    }


    return {
        addModOption
    }
}