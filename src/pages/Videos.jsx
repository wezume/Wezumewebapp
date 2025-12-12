/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Grid,
  Button,
  TextField,
  Paper,
  Typography,
  Collapse,
  Snackbar,
  Alert,
} from '@mui/material';
import { FilterList, ExpandMore, ExpandLess, Refresh, UploadFile, Mic } from '@mui/icons-material';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import VideoCard from '../components/videos/VideoCard';
import VideoSkeleton from '../components/videos/VideoSkeleton';
import apiClient from '../axios/axios';

// --- WAV ENCODER (improved) ---
const encodeWAV = (audioBlob) => {
  return new Promise((resolve, reject) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return reject(new Error('AudioContext not supported'));
      const audioContext = new AudioCtx();
      const fileReader = new FileReader();

      fileReader.onload = function () {
        audioContext.decodeAudioData(this.result)
          .then(buffer => {
            const numChannels = buffer.numberOfChannels;
            const sampleRate = buffer.sampleRate;
            const totalLength = buffer.length * numChannels * 2 + 44;
            const view = new DataView(new ArrayBuffer(totalLength));
            let offset = 0;
            const writeString = (str) => {
              for (let i = 0; i < str.length; i++) {
                view.setUint8(offset + i, str.charCodeAt(i));
              }
              offset += str.length;
            };

            writeString('RIFF');
            view.setUint32(offset, totalLength - 8, true); offset += 4;
            writeString('WAVE');

            writeString('fmt ');
            view.setUint32(offset, 16, true); offset += 4;
            view.setUint16(offset, 1, true); offset += 2;
            view.setUint16(offset, numChannels, true); offset += 2;
            view.setUint32(offset, sampleRate, true); offset += 4;
            view.setUint32(offset, sampleRate * numChannels * 2, true); offset += 4;
            view.setUint16(offset, numChannels * 2, true); offset += 2;
            view.setUint16(offset, 16, true); offset += 2;

            writeString('data');
            view.setUint32(offset, buffer.length * numChannels * 2, true); offset += 4;

            for (let i = 0; i < buffer.length; i++) {
              for (let channel = 0; channel < numChannels; channel++) {
                const s = buffer.getChannelData(channel)[i];
                const val = s < 0 ? s * 0x8000 : s * 0x7fff;
                view.setInt16(offset, val, true);
                offset += 2;
              }
            }

            resolve(new Blob([view.buffer], { type: 'audio/wav' }));
          })
          .catch(err => reject(new Error('Audio decode failed: ' + err)));
      };

      fileReader.onerror = () => reject(new Error('FileReader failed'));
      fileReader.readAsArrayBuffer(audioBlob);
    } catch (e) {
      reject(new Error('WAV encoding failed: ' + e.message));
    }
  });
};

// --- Filters persistence helpers ---
const getPersistedFilters = () => {
  try {
    const stored = sessionStorage.getItem('videoFilters');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const persistFilters = (filters) => {
  try {
    sessionStorage.setItem('videoFilters', JSON.stringify(filters));
  } catch { }
};

const storeFilteredVideosForNavigation = (videos) => {
  try {
    sessionStorage.setItem('currentVideosList', JSON.stringify(videos));
    sessionStorage.setItem('videoListType', 'job');
  } catch { }
};

// --- Component ---
export default function Videos() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobid = searchParams.get('jobid') || '';
  const scrollContainerRef = useRef(null);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [isFilteredResults, setIsFilteredResults] = useState(false);

  const getInitialFilters = () => {
    const persisted = getPersistedFilters();
    if (persisted) {
      return {
        transcriptionKeywords: persisted.transcriptionKeywords || '',
        jobid: jobid || persisted.jobid || '',
      };
    }
    return {
      transcriptionKeywords: '',
      jobid: jobid || '',
    };
  };

  const [filters, setFilters] = useState(getInitialFilters);

  const {
    videos,
    filteredVideos,
    userDetails,
    isLoadingVideos,
    isLoadingFilteredVideos,
    isLoadingMoreVideos,
    isLoadingMoreFilteredVideos,
    hasMoreVideos,
    hasMoreFilteredVideos,
    videoError,
    filteredVideoError,
    getVideos,
    getFilteredVideos,
    refreshVideos,
    refreshFilteredVideos,
    loadMoreVideos,
    loadMoreFilteredVideos,
  } = useAppStore();

  // local manual results when /voice is called
  const [manualFilteredVideos, setManualFilteredVideos] = useState([]);

  const displayVideos = isFilteredResults
    ? (manualFilteredVideos && manualFilteredVideos.length ? manualFilteredVideos : filteredVideos)
    : videos;

  const isLoading = isFilteredResults ? isLoadingFilteredVideos : isLoadingVideos;
  const isLoadingMore = isFilteredResults ? isLoadingMoreFilteredVideos : isLoadingMoreVideos;
  const hasMore = isFilteredResults ? hasMoreFilteredVideos : hasMoreVideos;
  const error = isFilteredResults ? filteredVideoError : videoError;

  // --- Navigation helper ---
  const handleVideoClick = (video, index) => {
    sessionStorage.setItem('videoSource', 'videos');
    sessionStorage.setItem('currentVideosList', JSON.stringify(displayVideos));
    sessionStorage.setItem('videoListType', 'videos');

    const hashedId = btoa(String(video.id));
    navigate(`/app/video/${hashedId}`, {
      state: {
        from: '/app/videos',
        source: 'videos',
        videoList: displayVideos,
        index,
        isFiltered: isFilteredResults,
        filters: isFilteredResults ? filters : null,
      },
    });
  };

  // --- scroll/infinite ---
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;

    if ((scrollTop + clientHeight) / scrollHeight > 0.8) {
      if (isFilteredResults && hasMore && !isLoadingMore) {
        loadMoreFilteredVideos(filters);
      } else if (!isFilteredResults && hasMore && !isLoadingMore) {
        loadMoreVideos();
      }
    }
  }, [hasMore, isLoadingMore, filters, isFilteredResults]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  useEffect(() => {
    if (userDetails) fetchVideos();
  }, [userDetails, jobid]);

  useEffect(() => {
    if (displayVideos?.length > 0) {
      storeFilteredVideosForNavigation(displayVideos);
    }
  }, [displayVideos]);

  const fetchVideos = async () => {
    setIsFilteredResults(false);
    await getVideos();
  };

  const handleRefresh = async () => {
    if (isFilteredResults) {
      await refreshFilteredVideos(filters);
    } else {
      await refreshVideos();
    }
  };

  const handleFilterChange = (field, value) => {
    const updated = { ...filters, [field]: value };
    setFilters(updated);
    persistFilters(updated);
  };

  // ---------------- VOICE RECORDING ----------------
  const [isRecording, setIsRecording] = useState(false);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioStreamRef = useRef(null);

  const getSupportedMimeType = () => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
    ];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) return t;
    }
    return '';
  };

  const startRecording = async () => {
    if (isRecording) return;

    try {
      console.log('🎤 Starting microphone…');
      const mimeType = getSupportedMimeType();
      console.log('Using MIME type:', mimeType || '(default)');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          noiseSuppression: true,
          echoCancellation: true,
        },
      });

      audioStreamRef.current = stream;
      audioChunksRef.current = [];

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.onstart = () => {
        console.log('🎙 Recorder started');
      };

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('📥 Chunk received:', event.data.size, 'bytes');
        } else {
          console.log('⚠ Empty chunk received');
        }
      };

      recorder.onerror = (e) => {
        console.error('Recorder Error:', e);
        showSnackbar('Recording error: ' + (e?.message || 'unknown'), 'error');
        try { stopRecording(); } catch { }
      };

      recorder.onstop = async () => {
        console.log('🛑 Recorder stopped');
        try { audioStreamRef.current.getTracks().forEach((t) => t.stop()); } catch { }

        if (!audioChunksRef.current.length) {
          console.log('❌ No audio chunks captured');
          showSnackbar('No voice captured. Try speaking louder or check microphone permissions.', 'error');
          setIsRecording(false);
          return;
        }

        console.log('🎉 Total Chunks Captured:', audioChunksRef.current.length);

        let blob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });

        // Convert to WAV for better compatibility if needed
        try {
          // Only attempt conversion if supported (encodeWAV may fail on some browsers for certain blob types)
          blob = await encodeWAV(blob);
        } catch (err) {
          console.warn('WAV conversion skipped/fails, proceeding with original blob:', err);
        }

        await sendAudioForTranscription(blob);
        setIsRecording(false);
      };

      // collect chunks every 500ms so ondataavailable fires frequently
      recorder.start(500);
      setIsRecording(true);
      showSnackbar('Recording started...', 'info');
    } catch (err) {
      console.error('Microphone access failed:', err);
      let message = 'Microphone access failed. Ensure site is served over HTTPS and permissions are allowed.';
      if (err && err.name === 'NotAllowedError') message = 'Microphone permission denied by the user.';
      showSnackbar(message, 'error');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state === 'recording') {
      rec.stop();
      setIsRecording(false);
    } else {
      if (audioStreamRef.current) {
        try { audioStreamRef.current.getTracks().forEach((t) => t.stop()); } catch { }
      }
      setIsRecording(false);
      showSnackbar('Recording stopped.', 'info');
    }
  };

  // Upload recorded audio to your transcription endpoint (/search/upload-voice-search)
  const sendAudioForTranscription = async (blob) => {
    setIsUploadingVoice(true);
    try {
      const formData = new FormData();
      // backend expects file + userId
      const filename = `voice_${Date.now()}.wav`;
      formData.append('file', new File([blob], filename, { type: 'audio/wav' }));
      if (userDetails?.userId) {
        formData.append('userId', userDetails.userId);
      } else {
        console.warn('userId not available in userDetails. Backend may reject transcription.');
      }

      showSnackbar('Uploading audio for transcription...', 'info');

      const res = await apiClient.post('/search/upload-voice-search', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Expect the backend to return transcription text
      const transcription =
        (res.data && (res.data.transcription || res.data.text || res.data)) || '';

      const transcriptionText = typeof transcription === 'string' ? transcription : JSON.stringify(transcription);

      if (!transcriptionText || !String(transcriptionText).trim()) {
        showSnackbar('Transcription returned empty. Try again.', 'warning');
        setIsUploadingVoice(false);
        return;
      }

      // Put transcription into input but do NOT auto-apply search
      const updated = { ...filters, transcriptionKeywords: transcriptionText };
      setFilters(updated);
      persistFilters(updated);

      showSnackbar('Transcription ready. Click "Apply Filters" to search.', 'success');
      setIsFilteredResults(false); // do not automatically switch to filtered results
    } catch (e) {
      console.error('Transcription upload failed:', e);
      showSnackbar('Transcription failed: ' + (e?.message || 'Server error'), 'error');
    }
    setIsUploadingVoice(false);
  };

  // ---------------- JD UPLOAD ----------------
  const jdInputRef = useRef(null);
  const [isUploadingJD, setIsUploadingJD] = useState(false);

  const handleJdFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingJD(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (userDetails?.userId) {
        formData.append('userId', userDetails.userId);
      }

      const res = await apiClient.post('/search/jd', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // backend might return transcription or title/skills/description
      let transcription = '';
      if (res.data) {
        if (res.data.transcription) transcription = res.data.transcription;
        else {
          const { title, skills, description } = res.data || {};
          transcription =
            (title || '') +
            (Array.isArray(skills) ? '\n' + skills.join(', ') : skills ? '\n' + skills : '') +
            (description ? '\n' + description : '');
        }
      }

      if (!transcription || !String(transcription).trim()) {
        showSnackbar('No readable content extracted from JD.', 'warning');
        setIsUploadingJD(false);
        if (jdInputRef.current) jdInputRef.current.value = '';
        return;
      }

      const updated = { ...filters, transcriptionKeywords: transcription };
      setFilters(updated);
      persistFilters(updated);

      showSnackbar('JD extracted. Click "Apply Filters" to search.', 'success');
      setIsFilteredResults(false); // do not automatically apply
    } catch (e) {
      console.error('JD Upload Failed:', e);
      showSnackbar('JD extraction failed: ' + (e?.message || 'Server error'), 'error');
    }

    setIsUploadingJD(false);
    if (jdInputRef.current) jdInputRef.current.value = '';
  };

  // ---------------- APPLY FILTERS: call your /voice endpoint manually ----------------
  const applyFilters = async () => {
    const transcriptionText = filters.transcriptionKeywords || '';
    if (!transcriptionText.trim()) {
      showSnackbar('Search field is empty. Showing all videos.', 'info');
      fetchVideos();
      return;
    }

    // Call your /voice endpoint which expects userId and transcription (as @RequestParam)
    try {
      setIsFilteredResults(true);
      showSnackbar('Searching...', 'info');

      const params = new URLSearchParams();
      params.append('userId', userDetails?.userId ?? '');
      params.append('transcription', transcriptionText);

      const res = await apiClient.post('/search/voice', params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      // Expect array of video objects from backend
      if (Array.isArray(res.data)) {
        setManualFilteredVideos(res.data);
        showSnackbar(`Found ${res.data.length} videos`, 'success');
      } else {
        // fallback: if backend returned an object with list
        const list = res.data?.results || res.data?.videos || [];
        setManualFilteredVideos(Array.isArray(list) ? list : []);
        showSnackbar(`Search completed`, 'success');
      }
    } catch (e) {
      console.error('Voice search (/voice) failed:', e);
      showSnackbar('Search failed: ' + (e?.message || 'Server error'), 'error');
      // keep previous filteredVideos if any
      setManualFilteredVideos([]);
      setIsFilteredResults(true); // still show filtered state
    }
  };

  const clearFilters = () => {
    const cleared = {
      transcriptionKeywords: '',
      jobid: jobid || '',
    };
    setFilters(cleared);
    persistFilters(cleared);
    setIsFilteredResults(false);
    setManualFilteredVideos([]);
    getVideos();
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <Box ref={scrollContainerRef} sx={{ p: 3, height: '100vh', overflow: 'auto' }}>
      {/* JOB INFO */}
      {jobid && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6">Job-Specific Videos (Job ID: {jobid})</Typography>
          <Typography variant="body2">Showing videos related to this job</Typography>
        </Paper>
      )}

      {/* HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Videos</Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            startIcon={<FilterList />}
            endIcon={filtersOpen ? <ExpandLess /> : <ExpandMore />}
            variant="outlined"
            size="small"
            onClick={() => setFiltersOpen((prev) => !prev)}
          >
            Filters
          </Button>

          <Button startIcon={<Refresh />} variant="outlined" size="small" onClick={handleRefresh}>
            Refresh
          </Button>
        </Box>
      </Box>

      {/* FILTER PANEL */}
      <Collapse in={filtersOpen}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filter Videos
          </Typography>

          {/* TOP ROW */}
          <Grid container spacing={1} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, sm: 4 }} item>
              <Button
                variant={isRecording ? 'contained' : 'outlined'}
                startIcon={<Mic />}
                onClick={() => (isRecording ? stopRecording() : startRecording())}
                disabled={isUploadingVoice}
                fullWidth
              >
                {isRecording ? 'Stop & Transcribe' : isUploadingVoice ? 'Processing...' : 'Voice Search'}
              </Button>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }} item>
              <input
                ref={jdInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleJdFileSelected}
                style={{ display: 'none' }}
              />
              <Button
                variant="outlined"
                startIcon={<UploadFile />}
                onClick={() => jdInputRef.current?.click()}
                disabled={isUploadingJD}
                fullWidth
              >
                {isUploadingJD ? 'Extracting...' : 'Upload JD'}
              </Button>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }} item>
              <TextField
                fullWidth
                label="Extracted / Transcription text"
                value={filters.transcriptionKeywords}
                onChange={(e) =>
                  handleFilterChange('transcriptionKeywords', e.target.value)
                }
                multiline
                minRows={1}
                maxRows={6}
              />
            </Grid>
          </Grid>

          {/* BUTTONS */}
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button variant="contained" onClick={applyFilters}>
              Apply Filters
            </Button>
            <Button variant="outlined" onClick={clearFilters}>
              Clear All
            </Button>
          </Box>
        </Paper>
      </Collapse>

      {/* ERRORS */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* VIDEO GRID — YOUR ORIGINAL LAYOUT KEPT */}
      <Grid container spacing={0.5}>
        {isLoading ? (
          Array(12)
            .fill()
            .map((_, index) => (
              <Grid size={{ xs: 4, lg: 3 }} item key={index}>
                <VideoSkeleton />
              </Grid>
            ))
        ) : (
          displayVideos.map((video, index) => (
            <Grid size={{ xs: 4, lg: 3 }} item key={video.id}>
              <VideoCard
                video={video}
                isSearchResult={isFilteredResults}
                onClick={() => handleVideoClick(video, index)}
              />

            </Grid>
          ))
        )}

        {isLoadingMore &&
          Array(8)
            .fill()
            .map((_, index) => (
              <Grid size={{ xs: 4, lg: 3 }} item key={index}>
                <VideoSkeleton />
              </Grid>
            ))}
      </Grid>

      {/* NO VIDEOS */}
      {!isLoading && displayVideos.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography>No videos found</Typography>
        </Box>
      )}

      {/* SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
