root@a5fa859f51c0:/app# whisper --help
usage: whisper [-h] [--model MODEL] [--model_dir MODEL_DIR] [--device DEVICE] [--output_dir OUTPUT_DIR] [--output_format {txt,vtt,srt,tsv,json,all}] [--verbose VERBOSE] [--task {transcribe,translate}]
               [--language {af,am,ar,as,az,ba,be,bg,bn,bo,br,bs,ca,cs,cy,da,de,el,en,es,et,eu,fa,fi,fo,fr,gl,gu,ha,haw,he,hi,hr,ht,hu,hy,id,is,it,ja,jw,ka,kk,km,kn,ko,la,lb,ln,lo,lt,lv,mg,mi,mk,ml,mn,mr,ms,mt,my,ne,nl,nn,no,oc,pa,pl,ps,pt,ro,ru,sa,sd,si,sk,sl,sn,so,sq,sr,su,sv,sw,ta,te,tg,th,tk,tl,tr,tt,uk,ur,uz,vi,yi,yo,yue,zh,Afrikaans,Albanian,Amharic,Arabic,Armenian,Assamese,Azerbaijani,Bashkir,Basque,Belarusian,Bengali,Bosnian,Breton,Bulgarian,Burmese,Cantonese,Castilian,Catalan,Chinese,Croatian,Czech,Danish,Dutch,English,Estonian,Faroese,Finnish,Flemish,French,Galician,Georgian,German,Greek,Gujarati,Haitian,Haitian Creole,Hausa,Hawaiian,Hebrew,Hindi,Hungarian,Icelandic,Indonesian,Italian,Japanese,Javanese,Kannada,Kazakh,Khmer,Korean,Lao,Latin,Latvian,Letzeburgesch,Lingala,Lithuanian,Luxembourgish,Macedonian,Malagasy,Malay,Malayalam,Maltese,Mandarin,Maori,Marathi,Moldavian,Moldovan,Mongolian,Myanmar,Nepali,Norwegian,Nynorsk,Occitan,Panjabi,Pashto,Persian,Polish,Portuguese,Punjabi,Pushto,Romanian,Russian,Sanskrit,Serbian,Shona,Sindhi,Sinhala,Sinhalese,Slovak,Slovenian,Somali,Spanish,Sundanese,Swahili,Swedish,Tagalog,Tajik,Tamil,Tatar,Telugu,Thai,Tibetan,Turkish,Turkmen,Ukrainian,Urdu,Uzbek,Valencian,Vietnamese,Welsh,Yiddish,Yoruba}]
               [--temperature TEMPERATURE] [--best_of BEST_OF] [--beam_size BEAM_SIZE] [--patience PATIENCE] [--length_penalty LENGTH_PENALTY] [--suppress_tokens SUPPRESS_TOKENS] [--initial_prompt INITIAL_PROMPT]
               [--condition_on_previous_text CONDITION_ON_PREVIOUS_TEXT] [--fp16 FP16] [--temperature_increment_on_fallback TEMPERATURE_INCREMENT_ON_FALLBACK] [--compression_ratio_threshold COMPRESSION_RATIO_THRESHOLD]
               [--logprob_threshold LOGPROB_THRESHOLD] [--no_speech_threshold NO_SPEECH_THRESHOLD] [--word_timestamps WORD_TIMESTAMPS] [--prepend_punctuations PREPEND_PUNCTUATIONS] [--append_punctuations APPEND_PUNCTUATIONS]
               [--highlight_words HIGHLIGHT_WORDS] [--max_line_width MAX_LINE_WIDTH] [--max_line_count MAX_LINE_COUNT] [--max_words_per_line MAX_WORDS_PER_LINE] [--threads THREADS] [--clip_timestamps CLIP_TIMESTAMPS]
               [--hallucination_silence_threshold HALLUCINATION_SILENCE_THRESHOLD]
               audio [audio ...]

positional arguments:
  audio                 audio file(s) to transcribe

optional arguments:
  -h, --help            show this help message and exit
  --model MODEL         name of the Whisper model to use (default: turbo)
  --model_dir MODEL_DIR
                        the path to save model files; uses ~/.cache/whisper by default (default: None)
  --device DEVICE       device to use for PyTorch inference (default: cpu)
  --output_dir OUTPUT_DIR, -o OUTPUT_DIR
                        directory to save the outputs (default: .)
  --output_format {txt,vtt,srt,tsv,json,all}, -f {txt,vtt,srt,tsv,json,all}
                        format of the output file; if not specified, all available formats will be produced (default: all)
  --verbose VERBOSE     whether to print out the progress and debug messages (default: True)
  --task {transcribe,translate}
                        whether to perform X->X speech recognition ('transcribe') or X->English translation ('translate') (default: transcribe)
  --language {af,am,ar,as,az,ba,be,bg,bn,bo,br,bs,ca,cs,cy,da,de,el,en,es,et,eu,fa,fi,fo,fr,gl,gu,ha,haw,he,hi,hr,ht,hu,hy,id,is,it,ja,jw,ka,kk,km,kn,ko,la,lb,ln,lo,lt,lv,mg,mi,mk,ml,mn,mr,ms,mt,my,ne,nl,nn,no,oc,pa,pl,ps,pt,ro,ru,sa,sd,si,sk,sl,sn,so,sq,sr,su,sv,sw,ta,te,tg,th,tk,tl,tr,tt,uk,ur,uz,vi,yi,yo,yue,zh,Afrikaans,Albanian,Amharic,Arabic,Armenian,Assamese,Azerbaijani,Bashkir,Basque,Belarusian,Bengali,Bosnian,Breton,Bulgarian,Burmese,Cantonese,Castilian,Catalan,Chinese,Croatian,Czech,Danish,Dutch,English,Estonian,Faroese,Finnish,Flemish,French,Galician,Georgian,German,Greek,Gujarati,Haitian,Haitian Creole,Hausa,Hawaiian,Hebrew,Hindi,Hungarian,Icelandic,Indonesian,Italian,Japanese,Javanese,Kannada,Kazakh,Khmer,Korean,Lao,Latin,Latvian,Letzeburgesch,Lingala,Lithuanian,Luxembourgish,Macedonian,Malagasy,Malay,Malayalam,Maltese,Mandarin,Maori,Marathi,Moldavian,Moldovan,Mongolian,Myanmar,Nepali,Norwegian,Nynorsk,Occitan,Panjabi,Pashto,Persian,Polish,Portuguese,Punjabi,Pushto,Romanian,Russian,Sanskrit,Serbian,Shona,Sindhi,Sinhala,Sinhalese,Slovak,Slovenian,Somali,Spanish,Sundanese,Swahili,Swedish,Tagalog,Tajik,Tamil,Tatar,Telugu,Thai,Tibetan,Turkish,Turkmen,Ukrainian,Urdu,Uzbek,Valencian,Vietnamese,Welsh,Yiddish,Yoruba}
                        language spoken in the audio, specify None to perform language detection (default: None)
  --temperature TEMPERATURE
                        temperature to use for sampling (default: 0)
  --best_of BEST_OF     number of candidates when sampling with non-zero temperature (default: 5)
  --beam_size BEAM_SIZE
                        number of beams in beam search, only applicable when temperature is zero (default: 5)
  --patience PATIENCE   optional patience value to use in beam decoding, as in https://arxiv.org/abs/2204.05424, the default (1.0) is equivalent to conventional beam search (default: None)
  --length_penalty LENGTH_PENALTY
                        optional token length penalty coefficient (alpha) as in https://arxiv.org/abs/1609.08144, uses simple length normalization by default (default: None)
  --suppress_tokens SUPPRESS_TOKENS
                        comma-separated list of token ids to suppress during sampling; '-1' will suppress most special characters except common punctuations (default: -1)
  --initial_prompt INITIAL_PROMPT
                        optional text to provide as a prompt for the first window. (default: None)
  --condition_on_previous_text CONDITION_ON_PREVIOUS_TEXT
                        if True, provide the previous output of the model as a prompt for the next window; disabling may make the text inconsistent across windows, but the model becomes less prone to getting stuck in a
                        failure loop (default: True)
  --fp16 FP16           whether to perform inference in fp16; True by default (default: True)
  --temperature_increment_on_fallback TEMPERATURE_INCREMENT_ON_FALLBACK
                        temperature to increase when falling back when the decoding fails to meet either of the thresholds below (default: 0.2)
  --compression_ratio_threshold COMPRESSION_RATIO_THRESHOLD
                        if the gzip compression ratio is higher than this value, treat the decoding as failed (default: 2.4)
  --logprob_threshold LOGPROB_THRESHOLD
                        if the average log probability is lower than this value, treat the decoding as failed (default: -1.0)
  --no_speech_threshold NO_SPEECH_THRESHOLD
                        if the probability of the <|nospeech|> token is higher than this value AND the decoding has failed due to `logprob_threshold`, consider the segment as silence (default: 0.6)
  --word_timestamps WORD_TIMESTAMPS
                        (experimental) extract word-level timestamps and refine the results based on them (default: False)
  --prepend_punctuations PREPEND_PUNCTUATIONS
                        if word_timestamps is True, merge these punctuation symbols with the next word (default: "'“¿([{-)
  --append_punctuations APPEND_PUNCTUATIONS
                        if word_timestamps is True, merge these punctuation symbols with the previous word (default: "'.。,，!！?？:：”)]}、)
  --highlight_words HIGHLIGHT_WORDS
                        (requires --word_timestamps True) underline each word as it is spoken in srt and vtt (default: False)
  --max_line_width MAX_LINE_WIDTH
                        (requires --word_timestamps True) the maximum number of characters in a line before breaking the line (default: None)
  --max_line_count MAX_LINE_COUNT
                        (requires --word_timestamps True) the maximum number of lines in a segment (default: None)
  --max_words_per_line MAX_WORDS_PER_LINE
                        (requires --word_timestamps True, no effect with --max_line_width) the maximum number of words in a segment (default: None)
  --threads THREADS     number of threads used by torch for CPU inference; supercedes MKL_NUM_THREADS/OMP_NUM_THREADS (default: 0)
  --clip_timestamps CLIP_TIMESTAMPS
                        comma-separated list start,end,start,end,... timestamps (in seconds) of clips to process, where the last end timestamp defaults to the end of the file (default: 0)
  --hallucination_silence_threshold HALLUCINATION_SILENCE_THRESHOLD
                        (requires --word_timestamps True) skip silent periods longer than this threshold (in seconds) when a possible hallucination is detected (default: None)

awesomeness@awesomeness-SER8:~/docker/GitHub/wordswhisperer$ docker exec whisper-cpp-service /build/whisper.cpp/build/bin/whisper-cli --help

usage: /build/whisper.cpp/build/bin/whisper-cli [options] file0 file1 ...
supported audio formats: flac, mp3, ogg, wav

options:
  -h,        --help              [default] show this help message and exit
  -t N,      --threads N         [4      ] number of threads to use during computation
  -p N,      --processors N      [1      ] number of processors to use during computation
  -ot N,     --offset-t N        [0      ] time offset in milliseconds
  -on N,     --offset-n N        [0      ] segment index offset
  -d  N,     --duration N        [0      ] duration of audio to process in milliseconds
  -mc N,     --max-context N     [-1     ] maximum number of text context tokens to store
  -ml N,     --max-len N         [0      ] maximum segment length in characters
  -sow,      --split-on-word     [false  ] split on word rather than on token
  -bo N,     --best-of N         [5      ] number of best candidates to keep
  -bs N,     --beam-size N       [5      ] beam size for beam search
  -ac N,     --audio-ctx N       [0      ] audio context size (0 - all)
  -wt N,     --word-thold N      [0.01   ] word timestamp probability threshold
  -et N,     --entropy-thold N   [2.40   ] entropy threshold for decoder fail
  -lpt N,    --logprob-thold N   [-1.00  ] log probability threshold for decoder fail
  -nth N,    --no-speech-thold N [0.60   ] no speech threshold
  -tp,       --temperature N     [0.00   ] The sampling temperature, between 0 and 1
  -tpi,      --temperature-inc N [0.20   ] The increment of temperature, between 0 and 1
  -debug,    --debug-mode        [false  ] enable debug mode (eg. dump log_mel)
  -tr,       --translate         [false  ] translate from source language to english
  -di,       --diarize           [false  ] stereo audio diarization
  -tdrz,     --tinydiarize       [false  ] enable tinydiarize (requires a tdrz model)
  -nf,       --no-fallback       [false  ] do not use temperature fallback while decoding
  -otxt,     --output-txt        [false  ] output result in a text file
  -ovtt,     --output-vtt        [false  ] output result in a vtt file
  -osrt,     --output-srt        [false  ] output result in a srt file
  -olrc,     --output-lrc        [false  ] output result in a lrc file
  -owts,     --output-words      [false  ] output script for generating karaoke video
  -fp,       --font-path         [/System/Library/Fonts/Supplemental/Courier New Bold.ttf] path to a monospace font for karaoke video
  -ocsv,     --output-csv        [false  ] output result in a CSV file
  -oj,       --output-json       [false  ] output result in a JSON file
  -ojf,      --output-json-full  [false  ] include more information in the JSON file
  -of FNAME, --output-file FNAME [       ] output file path (without file extension)
  -np,       --no-prints         [false  ] do not print anything other than the results
  -ps,       --print-special     [false  ] print special tokens
  -pc,       --print-colors      [false  ] print colors
             --print-confidence  [false  ] print confidence
  -pp,       --print-progress    [false  ] print progress
  -nt,       --no-timestamps     [false  ] do not print timestamps
  -l LANG,   --language LANG     [en     ] spoken language ('auto' for auto-detect)
  -dl,       --detect-language   [false  ] exit after automatically detecting language
             --prompt PROMPT     [       ] initial prompt (max n_text_ctx/2 tokens)
  -m FNAME,  --model FNAME       [models/ggml-base.en.bin] model path
  -f FNAME,  --file FNAME        [       ] input audio file path
  -oved D,   --ov-e-device DNAME [CPU    ] the OpenVINO device used for encode inference
  -dtw MODEL --dtw MODEL         [       ] compute token-level timestamps
  -ls,       --log-score         [false  ] log best decoder scores of tokens
  -ng,       --no-gpu            [false  ] disable GPU
  -fa,       --flash-attn        [false  ] flash attention
  -sns,      --suppress-nst      [false  ] suppress non-speech tokens
  --suppress-regex REGEX         [       ] regular expression matching tokens to suppress
  --grammar GRAMMAR              [       ] GBNF grammar to guide decoding
  --grammar-rule RULE            [       ] top-level GBNF grammar rule name
  --grammar-penalty N            [100.0  ] scales down logits of nongrammar tokens

Voice Activity Detection (VAD) options:
             --vad                           [false  ] enable Voice Activity Detection (VAD)
  -vm FNAME, --vad-model FNAME               [       ] VAD model path
  -vt N,     --vad-threshold N               [0.50   ] VAD threshold for speech recognition
  -vspd N,   --vad-min-speech-duration-ms  N [250    ] VAD min speech duration (0.0-1.0)
  -vsd N,    --vad-min-silence-duration-ms N [100    ] VAD min silence duration (to split segments)
  -vmsd N,   --vad-max-speech-duration-s   N [FLT_MAX] VAD max speech duration (auto-split longer)
  -vp N,     --vad-speech-pad-ms           N [30     ] VAD speech padding (extend segments)
  -vo N,     --vad-samples-overlap         N [0.10   ] VAD samples overlap (seconds between segments)