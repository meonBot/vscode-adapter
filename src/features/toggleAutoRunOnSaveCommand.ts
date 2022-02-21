import {
	commands,
	StatusBarAlignment,
	TextEditor,
	ThemeColor,
	window,
	workspace
} from 'vscode'

function getPesterConfig() {
	return workspace.getConfiguration('pester')
}

function getPesterAutoRunSaveStatus() {
	return getPesterConfig().get<boolean>('autoRunOnSave') ?? true
}

function getPesterAutoRunStatusMessage(saveStatus: boolean) {
	return saveStatus
		? 'Pester Auto Run on Save is now enabled for this workspace'
		: 'Pester Auto Run on Save is now disabled for this workspace'
}

function updatePesterStatusBar(saveStatus: boolean) {
	autoRunStatusBarItem.backgroundColor = saveStatus
		? undefined
		: new ThemeColor('statusBarItem.warningBackground')
	autoRunStatusBarItem.text = saveStatus
		? '$(beaker)Pester'
		: '$(debug-pause)Pester'
}

const toggleAutoRunOnSaveHandler = () => {
	// Race condition between update and get even with the thenable, save off the status instead
	const newAutoRunStatus = !getPesterAutoRunSaveStatus()
	getPesterConfig()
		// Update with undefined means return to default value which is true
		.update('autoRunOnSave', newAutoRunStatus ? undefined : false)
		.then(() => {
			updatePesterStatusBar(newAutoRunStatus)
			window.showInformationMessage(
				getPesterAutoRunStatusMessage(newAutoRunStatus)
			)
		})
}

export const toggleAutoRunOnSaveCommand = commands.registerCommand(
	'pester.toggleAutoRunOnSave',
	toggleAutoRunOnSaveHandler
)

export const autoRunStatusBarItem = window.createStatusBarItem(
	StatusBarAlignment.Right,
	0.99 // Powershell is priority 1, we want it to be just to the right of Powershell
)
autoRunStatusBarItem.command = 'pester.toggleAutoRunOnSave'
autoRunStatusBarItem.name = 'Pester'
autoRunStatusBarItem.text = '$(debug-restart)Pester'
autoRunStatusBarItem.backgroundColor = new ThemeColor(
	'statusBarItem.warningBackground'
)
autoRunStatusBarItem.tooltip = 'Click me to toggle Pester Test Auto-Run on Save'

function showStatusBarIfPowershellDocument(textEditor: TextEditor | undefined) {
	if (textEditor === undefined) {
		autoRunStatusBarItem.hide()
		return
	}
	textEditor.document.languageId === 'powershell'
		? autoRunStatusBarItem.show()
		: autoRunStatusBarItem.hide()
}

// Initialize
showStatusBarIfPowershellDocument(window.activeTextEditor)

export function initialize() {
	updatePesterStatusBar(getPesterAutoRunSaveStatus())
}

export const autoRunStatusBarVisibleEvent = window.onDidChangeActiveTextEditor(
	showStatusBarIfPowershellDocument
)

export const updateAutoRunStatusBarOnConfigChange =
	workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration('pester')) {
			updatePesterStatusBar(getPesterAutoRunSaveStatus())
		}
	})
