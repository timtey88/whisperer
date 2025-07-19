import * as shell from '@tauri-apps/plugin-shell'
import { ReactComponent as CopyIcon } from '~/icons/copy.svg'
import { ModifyState, cx, getIssueUrl, resetApp } from '~/lib/utils'
import { ErrorModalState } from '~/providers/ErrorModal'
import * as clipboard from '@tauri-apps/plugin-clipboard-manager'
import { collectLogs } from '~/lib/logs'

interface ErrorModalProps {
	state: ErrorModalState
	setState: ModifyState<ErrorModalState>
}

export default function ErrorModal({ state, setState }: ErrorModalProps) {

	async function clearLogAndReset() {
		setState({ open: false, log: '' })
		resetApp()
	}
	async function reportIssue() {
		let info = ''
		try {
			info = await collectLogs()
		} catch (e) {
			console.error(e)
			info = `Couldn't get info: ${e}`
		}

		const url = await getIssueUrl(state?.log + '\n' + info)
		shell.open(url)
	}

	return (
		<dialog id="modal-error" className={cx('modal', state?.open && 'modal-open')}>
			<div className="modal-box">
				<h3 className="font-bold text-lg">Error</h3>
				<p className="py-4">An error occurred while processing your request. Please try again or report the issue if it persists.</p>
				<div className="relative">
					<textarea readOnly className="w-full rounded-lg p-3 max-h-20 textarea textarea-bordered" dir="ltr" value={state?.log} />
					<CopyIcon
						className="w-6 h-6 z-10 right-4 bottom-4 absolute strokeBase-content
    opacity-50 cursor-pointer"
						onMouseDown={() => clipboard.writeText(state?.log ?? '')}
					/>
				</div>
				<div className="flex justify-center gap-3 mt-3">
					<button onClick={clearLogAndReset} className="btn btn-primary cursor-pointer">
						Reset App
					</button>
					<button onMouseDown={reportIssue} className="btn btn-outline">
						Report Issue
					</button>
				</div>
				<div className="modal-action">
					<form method="dialog">
						<button onClick={() => setState?.({ log: '', open: false })} className="btn cursor-pointer">
							Close
						</button>
					</form>
				</div>
			</div>
		</dialog>
	)
}
