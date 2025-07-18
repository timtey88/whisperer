import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { webviewWindow } from '@tauri-apps/api';

// Components
import Layout from '~/components/Layout';
import NavigationBar from '~/components/NavigationBar';
import MainContent from '~/components/MainContent';
import LanguageInput from '~/components/LanguageInput';
import TranscribeOptions from '~/components/Params';
import TextArea from '~/components/TextArea';
import AudioInput from '~/pages/home/AudioInput';
import AudioPlayer from './AudioPlayer';
import EnhancedProgressPanel from '~/components/EnhancedProgressPanel';
import TranscriptionSummaryPanel from '~/components/TranscriptionSummaryPanel';

// Utils
import { viewModel } from './viewModel';

export default function Home() {
  const { t } = useTranslation();
  const vm = viewModel();

  async function showWindow() {
    const currentWindow = webviewWindow.getCurrentWebviewWindow();
    await currentWindow.show();
    if (import.meta.env.PROD) {
      await currentWindow.setFocus();
    }
  }

  useEffect(() => {
    showWindow();
  }, []);

  return (
    <Layout>
      <NavigationBar />

      <MainContent maxWidth="md">
        <div className="flex flex-col gap-4">
          <LanguageInput />
          
          {!vm.files.length && (
            <div className="mt-6">
              <div className="label">
                <span className="label-text text-lg font-medium">{t('common.select-file')}</span>
              </div>
              <AudioInput onClick={vm.selectFiles} />
            </div>
          )}
        </div>
      
        {vm.audio && (
          <div>
            {vm.files.length > 0 && (
              <AudioPlayer 
                label={vm.files[0].name} 
                onLabelClick={() => vm.openPath(vm.files[0])} 
                audio={vm.audio} 
              />
            )}

            {!vm.loading && (
              <div 
                onClick={vm.selectFiles} 
                className="text-xs text-base-content font-medium cursor-pointer mb-3 mt-1"
              >
                {t('common.change-file')}
              </div>
            )}
          </div>
        )}

        {vm.audio && !vm.loading && (
          <div className="mt-4">
            <button 
              onClick={() => vm.transcribe(vm.files[0].path)} 
              className="btn btn-primary w-full"
            >
              {t('common.transcribe')}
            </button>
            <TranscribeOptions />
          </div>
        )}
      </MainContent>

      <div className="flex flex-col items-center w-full px-6">
        <div className="w-full max-w-4xl mt-8">
          {vm.loading && (
            <EnhancedProgressPanel 
              isAborting={vm.isAborting} 
              onAbort={vm.onAbort} 
              progress={vm.progress}
              fileName={vm.files[0]?.name}
              fileSize={vm.fileSize || undefined}
              modelPath={vm.preference.modelPath}
              modelOptions={vm.preference.modelOptions}
              useGpu={vm.preference.useGpu || false}
              currentPhase={vm.currentPhase}
            />
          )}

          {vm.showTranscriptionResult && vm.transcriptionResult && (
            <TranscriptionSummaryPanel 
              result={vm.transcriptionResult}
              onDismiss={() => vm.setShowTranscriptionResult(false)}
            />
          )}

          {(vm.segments || vm.loading) && (
            <div className="mt-4">
              <TextArea
                setSegments={vm.setSegments}
                file={vm.files[0]}
                placeholder={t('common.transcript-will-displayed-shortly')}
                segments={vm.segments}
                readonly={vm.loading}
              />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
