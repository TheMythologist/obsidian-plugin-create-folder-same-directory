import { Plugin, TFolder } from 'obsidian';

export default class CreateFolderSameDirectoryPlugin extends Plugin {
	async onload() {
		this.registerEvent(
			this.app.vault.on('create', folderOrFile => {
				if (folderOrFile instanceof TFolder) {
					console.log('a new folder has entered the arena, yay!');
				}
			}),
		);
	}
}
