import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { webviewWindow } from '@tauri-apps/api';

// Components
import Layout from '~/components/Layout';
import NavigationBar from '~/components/NavigationBar';
import MainContent from '~/components/MainContent';
import LanguageInput from '~/components/LanguageInput';
import TextArea from '~/components/TextArea';
import AudioInput from '~/pages/home/AudioInput';
import AudioPlayer from './AudioPlayer';
import EnhancedProgressPanel from '~/components/EnhancedProgressPanel';
import TranscriptionSummaryPanel from '~/components/TranscriptionSummaryPanel';

// Utils
import { viewModel } from './viewModel';
import { validateFileAndGetError } from '~/lib/utils';

export default function Home() {
  const { t } = useTranslation();
  const vm = viewModel();

  // Check if the current file is valid for transcription
  const isValidFile = vm.files.length > 0 ? validateFileAndGetError(vm.files[0].name).isValid : false;

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
          
          {/* No file selected state */}
          {vm.files.length === 0 && (
            <div className="mt-2">
              <div className="label">
                <span className="label-text text-lg font-medium">{t('common.select-file')}</span>
              </div>
              <AudioInput onClick={vm.selectFiles} />
            </div>
          )}

          {/* File selected state */}
          {vm.files.length > 0 && (
            <div className="mt-2">
              <div className="space-y-4">
                {/* File information and audio player */}
                {vm.audio ? (
                  <AudioPlayer 
                    label={vm.files[0].name} 
                    onLabelClick={() => vm.openPath(vm.files[0])} 
                    audio={vm.audio} 
                  />
                ) : (
                  <div className="bg-base-200 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{vm.files[0].name}</p>
                        <p className="text-sm text-base-content/60">Loading audio...</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* File actions */}
                {!vm.loading && (
                  <div className="flex gap-2">
                    <button 
                      onClick={vm.selectFiles}
                      className="btn btn-outline btn-sm flex-1"
                    >
                      {t('common.change-file')}
                    </button>
                    <button 
                      onClick={vm.clearFiles}
                      className="btn btn-outline btn-sm"
                    >
                      {t('common.clear-file')}
                    </button>
                  </div>
                )}

                {/* Transcribe section */}
                {vm.files.length > 0 && !vm.loading && (
                  <div className="mt-4">
                    {isValidFile ? (
                      <button 
                        onClick={() => vm.transcribe(vm.files[0].path)} 
                        className="btn btn-primary w-full"
                      >
                        {t('common.transcribe')}
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <button 
                          disabled
                          className="btn btn-primary w-full opacity-50 cursor-not-allowed"
                        >
                          {t('common.transcribe')}
                        </button>
                        <div className="alert alert-error">
                          <span className="text-sm">
                            {validateFileAndGetError(vm.files[0].name).error}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
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
