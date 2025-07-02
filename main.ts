import { App, Plugin, PluginSettingTab, Setting, TFolder } from 'obsidian';

const NewFolderDefaultLocations = [
	'Vault folder',
	'Same folder as current file',
	'In the folder specified below',
] as const;

type NewFolderDefaultLocation = (typeof NewFolderDefaultLocations)[number];

interface CreateFolderSameDirectorySettings {
	defaultLocation: NewFolderDefaultLocation;
	customDefaultLocation: string;
}

const DEFAULT_SETTINGS: CreateFolderSameDirectorySettings = {
	defaultLocation: 'Vault folder',
	customDefaultLocation: '',
};

export class CreateFolderSameDirectorySettingTab extends PluginSettingTab {
	plugin: CreateFolderSameDirectoryPlugin;

	constructor(app: App, plugin: CreateFolderSameDirectoryPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Default location for new folders')
			.setDesc('Where newly created folders are placed.')
			.addDropdown(dropDown => {
				NewFolderDefaultLocations.forEach(value => dropDown.addOption(value, value));
				dropDown.setValue(this.plugin.settings.defaultLocation);
				dropDown.onChange(async value => {
					this.plugin.settings.defaultLocation = value as NewFolderDefaultLocation;
					await this.plugin.saveSettings();
					this.display();
				});
			});

		if (this.plugin.settings.defaultLocation === 'In the folder specified below')
			new Setting(containerEl)
				.setName('Folder to create new folders in')
				.setDesc('Newly created folders will appear under this folder.')
				// TODO: Add dropdown selection that autocompletes by existing folders
				.addText(text =>
					text
						.setValue(this.plugin.settings.customDefaultLocation)
						.setPlaceholder('Example: folder 1/folder 2')
						.onChange(async value => {
							this.plugin.settings.customDefaultLocation = value;
							await this.plugin.saveSettings();
						}),
				);
	}
}

export default class CreateFolderSameDirectoryPlugin extends Plugin {
	settings: CreateFolderSameDirectorySettings;

	async onload() {
		await this.loadSettings();

		this.app.workspace.onLayoutReady(() =>
			this.registerEvent(
				this.app.vault.on('create', async folderOrFile => {
					this.app.workspace.setActiveLeaf;
					if (folderOrFile instanceof TFolder) {
						// Ugly workaround to only detect newly created folders
						if (!folderOrFile.name.startsWith('Untitled')) return;

						const currentNoteFile = this.app.workspace.getActiveFile();
						if (this.settings.defaultLocation === 'Same folder as current file') {
							if (currentNoteFile && currentNoteFile.parent)
								this.app.vault.rename(
									folderOrFile,
									`${currentNoteFile.parent.path}/${folderOrFile.name}`,
								);
						} else if (this.settings.defaultLocation === 'In the folder specified below') {
							if (!this.app.vault.getFolderByPath(this.settings.customDefaultLocation))
								await this.app.vault.createFolder(this.settings.customDefaultLocation);
							await this.app.vault.rename(
								folderOrFile,
								`${this.settings.customDefaultLocation}/${folderOrFile.name}`,
							);
						}
					}
				}),
			),
		);

		this.addSettingTab(new CreateFolderSameDirectorySettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
