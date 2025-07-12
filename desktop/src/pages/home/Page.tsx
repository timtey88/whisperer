import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { webviewWindow } from '@tauri-apps/api';
import * as keepAwake from 'tauri-plugin-keepawake-api';

// Components
import Layout from '~/components/Layout';
import LanguageInput from '~/components/LanguageInput';
import ModelOptions from '~/components/Params';
import TextArea from '~/components/TextArea';
import AudioInput from '~/pages/home/AudioInput';
import AudioPlayer from './AudioPlayer';
import ProgressPanel from './ProgressPanel';
import EnhancedProgressPanel from '~/components/EnhancedProgressPanel';
import AudioDeviceInput from '~/components/AudioDeviceInput';
import AdvancedTranscribe from '~/components/AdvancedTranscribe';
import SettingsPage from '~/pages/settings/Page';

// Icons
import { ReactComponent as FileIcon } from '~/icons/file.svg';
import { ReactComponent as MicrphoneIcon } from '~/icons/microphone.svg';
import { ReactComponent as LinkIcon } from '~/icons/link.svg';
import { ReactComponent as SettingsIcon } from '~/icons/settings.svg';

// Utils
import { cx } from '~/lib/utils';
import { viewModel } from './viewModel';

export default function Home() {
  const { t } = useTranslation();
  const vm = viewModel();
  
  // 0: Mic, 1: File, 2: Link, 3: Settings
  const [activeTab, setActiveTab] = useState(vm.preference.homeTabIndex);

  // Update the tab in the view model when it changes
  useEffect(() => {
    if (activeTab !== 3) { // Don't update for settings tab
      vm.preference.setHomeTabIndex(activeTab);
    }
  }, [activeTab]);

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
      <div role="tablist" className="tabs tabs-lifted flex m-auto mt-5">
        <a
          role="tab"
          onClick={() => setActiveTab(0)}
          className={cx('tab [--tab-border-color:gray]', activeTab === 0 && 'tab-active')}
        >
          <MicrphoneIcon className="w-[18px] h-[18px]" />
        </a>
        <a
          role="tab"
          onClick={() => setActiveTab(1)}
          className={cx('tab [--tab-border-color:gray]', activeTab === 1 && 'tab-active')}
        >
          <FileIcon className="w-[18px] h-[18px]" />
        </a>
        <a
          role="tab"
          onClick={() => setActiveTab(2)}
          className={cx('tab [--tab-border-color:gray]', activeTab === 2 && 'tab-active')}
        >
          <LinkIcon className="w-[18px] h-[18px]" />
        </a>
        <a
          role="tab"
          onClick={() => setActiveTab(3)}
          className={cx('tab [--tab-border-color:gray]', activeTab === 3 && 'tab-active')}
        >
          <SettingsIcon className="w-[18px] h-[18px]" />
        </a>
      </div>

      {activeTab === 3 ? (
        <div className="w-full max-w-3xl mx-auto">
          <SettingsPage />
        </div>
      ) : (
        <>
          {/* Record Tab */}
          {activeTab === 0 && (
            <div className="flex w-[300px] flex-col m-auto">
              <div>
                <AudioDeviceInput device={vm.inputDevice} setDevice={vm.setInputDevice} devices={vm.devices} type="input" />
                <AudioDeviceInput device={vm.outputDevice} setDevice={vm.setOutputDevice} devices={vm.devices} type="output" />
                <label className="label cursor-pointer mt-2 mb-5">
                  <span className="label-text">{t('common.save-record-in-documents-folder')}</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    onChange={(e) => vm.preference.setStoreRecordInDocuments(e.target.checked)}
                    checked={vm.preference.storeRecordInDocuments}
                  />
                </label>
              </div>
              
              {!vm.isRecording ? (
                <button onClick={() => vm.startRecord()} className="btn btn-primary mt-3">
                  {t('common.start-record')}
                </button>
              ) : (
                <button
                  onClick={() => {
                    keepAwake.stop();
                    vm.stopRecord();
                  }}
                  className="btn btn-success mt-3"
                >
                  <span className="loading loading-spinner"></span>
                  {t('common.stop-and-transcribe')}
                </button>
              )}

              <ModelOptions 
                options={vm.preference.modelOptions} 
                setOptions={vm.preference.setModelOptions} 
              />
            </div>
          )}

          {/* File Tab */}
          {activeTab === 1 && (
            <div className="flex flex-col items-center w-full">
              <div className="w-[300px] flex flex-col m-auto">
                <div className="join join-vertical">
                  <LanguageInput />
                  {!vm.files.length && <AudioInput onClick={vm.selectFiles} />}
                  <AdvancedTranscribe />
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
                    <ModelOptions 
                      options={vm.preference.modelOptions} 
                      setOptions={vm.preference.setModelOptions} 
                    />
                  </div>
                )}
              </div>

              <div className="w-full max-w-6xl mt-6 px-4">
                {vm.loading && (
                  <EnhancedProgressPanel 
                    isAborting={vm.isAborting} 
                    onAbort={vm.onAbort} 
                    progress={vm.progress}
                    fileName={vm.files[0]?.name}
                    fileSize={vm.fileSize || undefined}
                    audioDuration={vm.audioDuration || undefined}
                    modelPath={vm.preference.modelPath}
                    modelOptions={vm.preference.modelOptions}
                    useGpu={vm.preference.useGpu || false}
                    currentPhase={vm.currentPhase}
                  />
                )}

                {vm.summarizeSegments && (
                  <div role="tablist" className="tabs tabs-lifted tabs-lg">
                    <a
                      onClick={() => vm.setTranscriptTab('transcript')}
                      role="tab"
                      className={cx('tab', vm.transcriptTab === 'transcript' && 'tab-active')}
                    >
                      {t('common.segments-tab')}
                    </a>
                    <a
                      onClick={() => vm.setTranscriptTab('summary')}
                      role="tab"
                      className={cx('tab', vm.transcriptTab === 'summary' && 'tab-active')}
                    >
                      {t('common.summary-tab')}
                    </a>
                  </div>
                )}

                {(vm.segments || vm.loading) && (
                  <div className="mt-4">
                    <TextArea
                      setSegments={vm.transcriptTab === 'transcript' ? vm.setSegments : vm.setSummarizeSegments}
                      file={vm.files[0]}
                      placeholder={t('common.transcript-will-displayed-shortly')}
                      segments={vm.transcriptTab === 'transcript' ? vm.segments : vm.summarizeSegments}
                      readonly={vm.loading}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* URL Tab */}
          {activeTab === 2 && (
            <div className="flex w-[300px] flex-col m-auto">
              <div className="flex flex-col gap-0 mt-5">
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={vm.audioUrl}
                  onChange={(e) => vm.setAudioUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=aj8-ABRl1Jo"
                  onKeyDown={(e) => e.key === 'Enter' && vm.downloadAudio()}
                />

                {vm.downloadingAudio ? (
                  <div className="w-full flex flex-col items-center mt-5">
                    <div className="flex items-center gap-3 bg-base-200 p-4 rounded-2xl">
                      <span className="loading loading-spinner text-primary"></span>
                      <p>{t('common.downloading', { progress: vm.ytdlpProgress })}</p>
                      <button 
                        onClick={() => vm.cancelYtDlpDownload()} 
                        className="btn btn-ghost btn-sm text-red-500"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <label className="label cursor-pointer mt-4">
                      <span className="label-text">{t('common.save-record-in-documents-folder')}</span>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary"
                        onChange={(e) => vm.preference.setStoreRecordInDocuments(e.target.checked)}
                        checked={vm.preference.storeRecordInDocuments}
                      />
                    </label>

                    <button 
                      onClick={vm.downloadAudio} 
                      className="btn btn-primary mt-4 w-full"
                      disabled={!vm.audioUrl}
                    >
                      {t('common.download-file')}
                    </button>
                    
                    <ModelOptions 
                      options={vm.preference.modelOptions} 
                      setOptions={vm.preference.setModelOptions} 
                    />
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
