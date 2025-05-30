/**
 * @file screen-options.ts
 * @copyright 2020-2023, Firaxis Games
 * @description The view portion of the options/setting screen.
 */
import { FxsCheckbox } from '/core/ui/components/fxs-checkbox.js';
import DialogManager, { DialogBoxAction } from '/core/ui/dialog-box/manager-dialog-box.js';
import { DropdownSelectionChangeEventName } from '/core/ui/components/fxs-dropdown.js';
import { FxsSlider } from '/core/ui/components/fxs-slider.js';
import { FxsStepper } from '/core/ui/components/fxs-stepper.js';
import { FxsSwitch } from '/core/ui/components/fxs-switch.js';
import ContextManager from '/core/ui/context-manager/context-manager.js';
import FocusManager from '/core/ui/input/focus-manager.js';
import { InputEngineEventName } from '/core/ui/input/input-support.js';
import NavTray from '/core/ui/navigation-tray/model-navigation-tray.js';
import Options from '/core/ui/options/model-options.js';
import { CategoryData, OptionType, ShowReloadUIPrompt, ShowRestartGamePrompt, CategoryType, GetGroupLocKey } from '/core/ui/options/options-helpers.js';
import '/core/ui/options/options.js';
import './screen-options-category.js';
import Panel from '/core/ui/panel-support.js';
import { MustGetElement } from '/core/ui/utilities/utilities-dom.js';
import { displayRequestUniqueId } from '/core/ui/context-manager/display-handler.js';
import { MainMenuReturnEvent } from '/core/ui/events/shell-events.js';
import { displayTypeOption, modSelectorOption } from '../modOptions.js';
const DEFAULT_PUSH_PROPERTIES = {
    singleton: true,
    createMouseGuard: true
};
/**
 * Display and modify the game options.
 */
export class ScreenOptions extends Panel {

    constructor() {
        super(...arguments);
        this.modCategoryPanel = null;
        this.groupHeaders = null;
        this.groupClicked = {}
        this.modOptions = [];
        this.panels = [];
        this.tabData = [];
        this.slotGroup = document.createElement('fxs-slot-group');
        this.dialogId = displayRequestUniqueId();
        this.onDefaultOptions = () => {
            const defaultCallback = (eAction) => {
                if (eAction == DialogBoxAction.Confirm) {
                    Options.resetOptionsToDefault(); // reset all values to engine-defined defaults
                    VisualRemaps.resetToDefaults();
                    window.dispatchEvent(new MainMenuReturnEvent());
                    this.close();
                }
            };
            DialogManager.createDialog_ConfirmCancel({
                body: "LOC_OPTIONS_ARE_YOU_SURE_DEFAULT",
                title: "LOC_OPTIONS_DEFAULT",
                canClose: false,
                displayQueue: "SystemMessage",
                addToFront: true,
                callback: defaultCallback
            });
        };
        this.onCancelOptions = () => {
            const cancelCallback = (eAction) => {
                if (eAction == DialogBoxAction.Confirm) {
                    Options.restore(); // restore previous values
                    VisualRemaps.revertUnsavedChanges();
                    window.dispatchEvent(new MainMenuReturnEvent());
                    this.close();
                }
            };
            if (Options.hasChanges() || VisualRemaps.hasUnsavedChanges()) {
                // There are pending changes that weren't applied, warn the user that they will be reverted
                DialogManager.createDialog_ConfirmCancel({
                    dialogId: this.dialogId,
                    body: "LOC_OPTIONS_REVERT_DESCRIPTION",
                    title: "LOC_OPTIONS_CANCEL_CHANGES",
                    canClose: false,
                    displayQueue: "SystemMessage",
                    addToFront: true,
                    callback: cancelCallback
                });
            }
            else {
                // No options were changed, close the options panel immediately
                window.dispatchEvent(new MainMenuReturnEvent());
                this.close();
            }
        };
        this.onConfirmOptions = () => {
            const closeFn = this.close.bind(this);
            if (Options.isUIReloadRequired() && UI.isInGame()) {
                ShowReloadUIPrompt(closeFn);
            }
            else if (Options.isRestartRequired()) {
                ShowRestartGamePrompt(closeFn);
            }
            else {
                Options.commitOptions();
                VisualRemaps.saveConfiguration();
                // trigger update and force completion for current tutorial items
                engine.trigger('update-tutorial-level');
                engine.trigger('UIFontScaleChanged');
                engine.trigger('UIGlobalScaleChanged');
                window.dispatchEvent(new MainMenuReturnEvent());
                this.close();
            }
        };
        this.onEngineInput = (inputEvent) => {
            if (inputEvent.detail.status != InputActionStatuses.FINISH) {
                return;
            }
            if (inputEvent.isCancelInput()) {
                this.onCancelOptions();
                inputEvent.preventDefault();
                inputEvent.stopPropagation();
            }
            switch (inputEvent.detail.name) {
                case 'shell-action-1':
                    this.onConfirmOptions();
                    inputEvent.preventDefault();
                    inputEvent.stopPropagation();
                    break;
                case 'shell-action-2':
                    this.onDefaultOptions();
                    inputEvent.preventDefault();
                    inputEvent.stopPropagation();
                    break;
            }
        };
        this.onOptionsTabSelected = (e) => {
            e.stopPropagation();
            const { index } = e.detail;
            const slotId = this.panels[index].id;
            this.slotGroup.setAttribute('selected-slot', slotId);
        };
    }
    onModCategoryUpdate = (selectedIndex) => {
        const modSelected = modSelectorOption.dropdownItems[selectedIndex].value;
        for(const option of this.modOptions){
            const modName = option.mod?.value ?? option.groupFlat;
            option.isHidden = (modName != modSelected);
            if (option.forceRender) {
                option.forceRender();
            }
            const group = this.Root.querySelector(`[data-group="${option.group}"]`);
            group.classList.toggle("hidden", (modName != modSelected));
        }
    }
    
    
    onGroupToggle = (inputEvent, group) =>{
        //if group was clicked less than 400ms ago, ignore the event. (inputEvent Detail a empty ...)
        if (this.groupClicked[group] && Date.now() - this.groupClicked[group] < 400){
            return
        }
        //store date time a group was clicked
        this.groupClicked[group] = Date.now()


        var divider =  this.Root.querySelector(`[data-group="${group}"] div.filigree-divider-h3`);
        var hidden = false
        if(divider){
            divider.classList.remove("filigree-divider-h3")
            divider.classList.add("filigree-shell-small")
            hidden = true
        } else {
            divider =  this.Root.querySelector(`[data-group="${group}"] div.filigree-shell-small`);
            divider.classList.remove("filigree-shell-small")
            divider.classList.add("filigree-divider-h3")
        }
        if (group == 'mod_selection'){
            modSelectorOption.isHidden = hidden;
            modSelectorOption.forceRender()
        }
        //toggle all options in group
        for(const option of this.modOptions){
            if (option.group == group){
                option.isHidden = hidden;
                if (option.forceRender) {
                    option.forceRender();
                }
            }
        }
    }
    onInitialize() {
        super.onInitialize();
        Options.init();
        // Initialize options data on panel initialization
        for (const option of Options.data.values()) {
            option.initListener?.(option);
        }
        Options.saveCheckpoints();
        this.render();
    }
    onAttach() {
        this.enableCloseSound = true;
        //open sound is false on purpose
        this.Root.setAttribute("data-audio-group-ref", "options");
        super.onAttach();
        this.cancelButton?.addEventListener('action-activate', this.onCancelOptions);
        this.cancelButton?.setAttribute("data-audio-focus-ref", "data-audio-hero-focus");
        this.defaultsButton?.addEventListener('action-activate', this.onDefaultOptions);
        this.defaultsButton?.setAttribute("data-audio-focus-ref", "data-audio-hero-focus");
        this.confirmButton?.addEventListener('action-activate', this.onConfirmOptions);
        this.defaultsButton?.setAttribute("data-audio-focus-ref", "data-audio-hero-focus");

        this.Root.addEventListener(InputEngineEventName, this.onEngineInput);

        // MSM: loop through groupHeaders to add event listener
        for (const [group, header] of Object.entries(this.groupHeaders)) {
            header.addEventListener(InputEngineEventName, (inputEvent) => this.onGroupToggle(inputEvent, group));
        }

        // MSM: init rendering on first select to hide all other if displayTypeOption is combobox
        if (displayTypeOption.value == "combobox"){
            // calculate selectedItemIndex as List not here during OptionAPI init
            for (let index = 0; index < modSelectorOption.dropdownItems.length; ++index) {
                if (modSelectorOption.dropdownItems[index].value == modSelectorOption.value) {
                    modSelectorOption.selectedItemIndex = index;
                    break;
                }
            }
            modSelectorOption.forceRender();
            this.onModCategoryUpdate(modSelectorOption.selectedItemIndex);
        }
    }
    onDetach() {
        this.Root.removeEventListener(InputEngineEventName, this.onEngineInput);
        this.cancelButton?.removeEventListener('action-activate', this.onCancelOptions);
        this.defaultsButton?.removeEventListener('action-activate', this.onDefaultOptions);
        this.confirmButton?.removeEventListener('action-activate', this.onConfirmOptions);

        // MSM: loop through groupHeaders to remove event listener
        for (const [group, header] of Object.entries(this.groupHeaders)) {
            header?.removeEventListener('engine-input', (inputEvent) => this.onGroupToggle(inputEvent, group));
        }

        super.onDetach();
    }
    onReceiveFocus() {
        super.onReceiveFocus();
        NavTray.clear();
        NavTray.addOrUpdateGenericCancel();
        NavTray.addOrUpdateShellAction1("LOC_OPTIONS_CONFIRM_CHANGES");
        NavTray.addOrUpdateShellAction2("LOC_OPTIONS_RESET_TO_DEFAULTS");
        // Keep a record of the current volumes so they can be restored if "Reset to Defaults" or "Cancel Changes" are clicked.
        Sound.volumeSetCheckpoint();
        waitForLayout(() => {
            FocusManager.setFocus(this.slotGroup);
        });
    }
    onLoseFocus() {
        NavTray.clear();
        super.onLoseFocus();
    }
    handleForceRenderOptions(optionElement, _component, option) {
        optionElement.classList.toggle("hidden", option.isHidden ?? false);
    }
    onUpdateOptionValue(optionElement, component, option) {
        // Each change listener will increment changeRefCount to avoid a cancel popup if nothing was changed
        // TODO skip incrementing if that option is already changed, and decrement if it returns to its original value
        switch (option.type) {
            // TODO: Add cases for other component types used
            case OptionType.Editor:
                component.Root.addEventListener("action-activate", (_event) => {
                    const pushProperties = option.pushProperties ?? DEFAULT_PUSH_PROPERTIES;
                    // Push the editor if the callback returns undefined or false, the editor will be pushed.
                    const activateResult = option.activateListener?.();
                    if (option.editorTagName && (activateResult === undefined || activateResult === false)) {
                        ContextManager.push(option.editorTagName, pushProperties);
                    }
                    Options.incRefCount(); // TODO only increment if the editor actually changes a setting
                });
                break;
            case OptionType.Dropdown:
                component.Root.addEventListener(DropdownSelectionChangeEventName, (event) => {
                    Options.incRefCount();
                    option.updateListener?.(option, event.detail.selectedIndex);
                });
                option.forceRender = () => {
                    component.Root.setAttribute("selected-item-index", `${(option.selectedItemIndex ?? 0)}`);
                    component.Root.setAttribute("dropdown-items", JSON.stringify(option.dropdownItems));
                    this.handleForceRenderOptions(optionElement, component, option);
                };
                break;
            case OptionType.Stepper:
                if (component instanceof FxsStepper) {
                    component.Root.addEventListener("component-value-changed", () => {
                        Options.incRefCount();
                        option.updateListener?.(option, component.value);
                    });
                }
                option.forceRender = () => {
                    component.Root.setAttribute("value", `${option.currentValue ?? 0}`);
                    this.handleForceRenderOptions(optionElement, component, option);
                };
                break;
            case OptionType.Checkbox:
                if (component instanceof FxsCheckbox) {
                    component.Root.addEventListener(ComponentValueChangeEventName, (event) => {
                        Options.incRefCount();
                        option.updateListener?.(option, event.detail.value);
                    });
                    option.forceRender = () => {
                        component.Root.setAttribute("selected", `${option.currentValue}`);
                        component.Root.setAttribute("disabled", `${option.isDisabled}`);
                        this.handleForceRenderOptions(optionElement, component, option);
                    };
                }
                break;
            case OptionType.Switch:
                if (component instanceof FxsSwitch) {
                    component.Root.addEventListener(ComponentValueChangeEventName, (event) => {
                        Options.incRefCount();
                        option.updateListener?.(option, event.detail.value);
                    });
                    option.forceRender = () => {
                        component.Root.setAttribute("selected", option.currentValue ? 'true' : 'false');
                        this.handleForceRenderOptions(optionElement, component, option);
                    };
                }
                break;
            case OptionType.Slider:
                if (component instanceof FxsSlider) {
                    component.Root.addEventListener(ComponentValueChangeEventName, (event) => {
                        // Only track a change if the value actually is different, accounting for float rounding errors
                        if (option.currentValue && Math.abs(option.currentValue - event.detail.value) > 0.000001) {
                            Options.incRefCount();
                        }
                        option.updateListener?.(option, event.detail.value);
                        if (option.sliderValue) {
                            const output = option.formattedValue ?? `${option.currentValue ?? 0}%`;
                            option.sliderValue.textContent = output;
                        }
                    });
                    if (option.sliderValue) {
                        const output = option.formattedValue ?? `${option.currentValue ?? 0}%`;
                        option.sliderValue.textContent = output;
                    }
                    option.forceRender = () => {
                        component.Root.setAttribute("value", `${option.currentValue ?? 0}`);
                        this.handleForceRenderOptions(optionElement, component, option);
                    };
                }
                break;
            default:
                throw new Error(`Unhandled option type: ${option}`);
        }
    }
    /**
     * getOrCreateCategoryTab Finds or creates the panel associated with a given option category.
     *
     * @param catID A category to associate with a tab.
     * @returns The display panel associated with the tab.
     */
    getOrCreateCategoryTab(catID) {
        const elementID = `category-table-${catID}`;
        // Find or create the display panel 
        let categoryPanel = this.panels.find(panel => panel.id === elementID);
        // If needed, create the category panel.
        if (!categoryPanel) {
            categoryPanel = document.createElement("screen-options-category");
            categoryPanel.classList.add(elementID, 'flex', 'flex-col');
            categoryPanel.id = elementID;
            this.panels.push(categoryPanel);
            const { title, description } = CategoryData[catID];
            categoryPanel.setAttribute('description', description);
            this.tabData.push({
                id: elementID,
                category: catID,
                label: title,
            });
        }
        return categoryPanel;
    }
    render() {
        this.Root.classList.add("absolute", "flex", "justify-center", "size-full", "max-w-screen", "max-h-screen", "pointer-events-auto");
        this.Root.innerHTML = `
			<div class="absolute size-full img-lsgb-egypt-720"></div>
			<fxs-frame class="option-frame min-w-256 flex-initial" content-as="fxs-vslot" content-class="flex-auto">
				<fxs-vslot class="flex-auto" focus-rule="last">
					<fxs-header class="self-center mb-6 font-title text-xl text-secondary" title="LOC_UI_OPTIONS_TITLE" filigree-style="none"></fxs-header>
					<fxs-tab-bar class="mb-6"></fxs-tab-bar>
					<fxs-scrollable class="flex-auto" attached-scrollbar="true"></fxs-scrollable>
				</fxs-vslot>
				<div class="flex flex-row justify-between items-end mt-6" data-bind-class-toggle="hidden:{{g_NavTray.isTrayRequired}}">
					<fxs-button id="options-cancel"
								data-audio-group-ref="options" data-audio-activate="options-cancel-selected"
								caption="LOC_OPTIONS_CANCEL_CHANGES"></fxs-button>
					<fxs-button id="options-defaults" class="ml-2"
								data-audio-group-ref="options" data-audio-activate="options-default-selected"
								caption="LOC_OPTIONS_RESET_TO_DEFAULTS"></fxs-button>
					<fxs-hero-button id="options-confirm" class="ml-2"
								caption="LOC_OPTIONS_CONFIRM_CHANGES" data-audio-group-ref="options"
								data-audio-activate-ref="data-audio-options-confirm"></fxs-button>
				</div>
			</fxs-frame>
		`;
        this.scrollable = MustGetElement("fxs-scrollable", this.Root);
        this.cancelButton = MustGetElement('#options-cancel', this.Root);
        this.defaultsButton = MustGetElement('#options-defaults', this.Root);
        this.confirmButton = MustGetElement('#options-confirm', this.Root);
        this.tabControl = MustGetElement("fxs-tab-bar", this.Root);
        // Loop through options, building HTML into appropriate category pages.
        for (const [, option] of Options.data) {
            if (option.category == CategoryType.Mods || option.mod != undefined){
                //first rendering: groupFLat empty, fill it with group value
                if (!option.groupFlat){
                    option.groupFlat = option.group
                }
                //Edit group for mad having 'mod' pproperty if LOC exists (allow to have specific LOC for group when comboStyle used)
                if (option.groupCB){   
                    if ( displayTypeOption.value == "combobox" ){
                        option.group = option.groupCB
                    } else {
                        option.group = option.groupFlat
                    }
                }
                if (option.mod == ""){

                }else {
                    this.modOptions.push(option)
                    const modName = option.mod?.value ?? option.groupFlat;
                    if ( ! modSelectorOption.dropdownItems.some( mod => mod['value'] === modName)){
                        const modItem = option.mod ?? {value: modName, label: GetGroupLocKey(option.groupFlat)}
                        if (modSelectorOption.dropdownItems.findIndex(mod => mod.value === modItem.value) == -1){
                            modSelectorOption.dropdownItems.push(modItem)
                        }
                    }
                }
            } else {
                const category = this.getOrCreateCategoryTab(option.category);
                if (!category.maybeComponent) {
                    // @ts-expect-error - gameface custom element initialization is broken when appending custom elements to other custom elements
                    category.initialize();
                }
                const { optionRow, optionElement } = category.component.appendOption(option);
                // @ts-expect-error - gameface custom element initialization is broken when appending custom elements to other custom elements
                optionElement.initialize();
                this.onUpdateOptionValue(optionRow, optionElement.component, option);
                optionRow.classList.toggle("hidden", option.isHidden ?? false);
            }
        }

        if (this.modOptions.length > 0) {
            //override Mods Category to ensure "Mods" will be displayed
            CategoryData[CategoryType.Mods] = {
                title: "LOC_UI_OPTIONS_HEADER_MODS",
            };

            this.modCategoryPanel = this.getOrCreateCategoryTab("mods");
            this.modCategoryPanel.initialize();
            
            
            if (displayTypeOption.value == "combobox"){
                modSelectorOption.dropdownItems = modSelectorOption.dropdownItems.sort((a, b) => Locale.stylize(GetGroupLocKey(a.value)).localeCompare(Locale.stylize(GetGroupLocKey(b.value))));

                const { optionRow, optionElement } = this.modCategoryPanel.component.appendOption(modSelectorOption);
                optionElement.classList.add("w-96");
                optionElement.initialize();
                this.onUpdateOptionValue(optionRow, optionElement.component, modSelectorOption);
                optionElement.addEventListener('dropdown-selection-change', (event) => { this.onModCategoryUpdate(event.detail.selectedIndex)});
            } else { // precreate all groups to allow them to be sorted during option creation
                const groups = this.modOptions.map(option => option.group).filter((value, index, self) => self.indexOf(value) === index);
                groups.sort((a, b) => Locale.stylize(GetGroupLocKey(a)).localeCompare(Locale.stylize(GetGroupLocKey(b))))
                for (const group of groups){
                    this.modCategoryPanel.component.getOptionReferenceNode(group)
                }
            }
            
            for (const option of this.modOptions){
                const { optionRow, optionElement } = this.modCategoryPanel.component.appendOption(option);
                optionElement.initialize();
                this.onUpdateOptionValue(optionRow, optionElement.component, option);
            }
        }
        this.groupHeaders = this.modCategoryPanel.component.getGroupHeaders()

        this.tabControl.setAttribute("tab-items", JSON.stringify(this.tabData));
        const selectedTab = this.Root.getAttribute("selected-tab");
        this.tabControl.setAttribute("selected-tab-index", selectedTab ?? "0");
        for (let i = 0; i < this.panels.length; i++) {
            this.slotGroup.appendChild(this.panels[i]);
        }
        this.slotGroup.classList.add('px-6');
        this.scrollable.appendChild(this.slotGroup);
        this.tabControl.addEventListener("tab-selected", this.onOptionsTabSelected);
    }
}
Controls.define('screen-options', {
    createInstance: ScreenOptions,
    description: 'Screen for adjusting game options.',
    styles: ['fs://game/core/ui/options/screen-options.css'],
});

//# sourceMappingURL=file:///core/ui/options/screen-options.js.map
