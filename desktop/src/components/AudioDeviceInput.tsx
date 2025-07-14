import { useTranslation } from 'react-i18next'
import { AudioDevice } from '~/lib/audio'
import { ModifyState } from '~/lib/utils'
import CustomSelect, { SelectOption } from './CustomSelect'

interface AudioDeviceInputProps {
	type: 'output' | 'input'
	devices: AudioDevice[]
	device: AudioDevice | null
	setDevice: ModifyState<AudioDevice | null>
}

export default function AudioDeviceInput({ type, devices, device, setDevice }: AudioDeviceInputProps) {
	const { t } = useTranslation()

	const filtered = devices.filter((d) => (d.isInput && type === 'input') || (!d.isInput && type === 'output'))

	// Create options for CustomSelect
	const deviceOptions: SelectOption[] = [
		{ value: '', label: t('common.no-record') },
		...filtered.map(({ id, name }) => ({
			value: id,
			label: name
		}))
	]

	return (
		<label className="form-control w-full">
			<div className="label">
				<span className="label-text">{t(type === 'input' ? 'common.microphone' : 'common.speakers')}</span>
			</div>
			<CustomSelect
				options={deviceOptions}
				value={device?.id || ''}
				onChange={(value) => {
					const selectedDevice = filtered.find((d) => d.id === value)
					if (selectedDevice) {
						setDevice(selectedDevice)
					} else {
						setDevice(null)
					}
				}}
				placeholder={t('common.no-record')}
			/>
		</label>
	)
}
