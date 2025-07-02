import { App, Plugin, PluginSettingTab, Setting, TFolder } from 'obsidian';

const NewFolderDefaultLocations = ['Vault folder', 'Same folder as current file'] as const;

type NewFolderDefaultLocation = (typeof NewFolderDefaultLocations)[number];

interface CreateFolderSameDirectorySettings {
	defaultLocation: NewFolderDefaultLocation;
}

const DEFAULT_SETTINGS: CreateFolderSameDirectorySettings = { defaultLocation: 'Vault folder' };

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
