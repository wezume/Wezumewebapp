/* eslint-disable no-unused-vars */

import { useState, useEffect, useRef } from "react";
import {
  Box,
  Card,
  Container,
  Typography,
  Snackbar,
  Alert,
  Grid,
  Paper,
  Button,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from "@mui/material";
import FavoriteIcon from '@mui/icons-material/Favorite';
import CommentIcon from '@mui/icons-material/Comment';
import WorkIcon from '@mui/icons-material/Work';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import PeopleIcon from '@mui/icons-material/People';
import FilterListIcon from '@mui/icons-material/FilterList';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Refresh } from "@mui/icons-material";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppStore } from "../store/appStore";
import VideoCard from "../components/videos/VideoCard";
import VideoSkeleton from "../components/videos/VideoSkeleton";
import apiClient from '../axios/axios';
import { Mic, UploadFile, Search as SearchIcon, Hub as HubIcon } from "@mui/icons-material";
import { TextField } from "@mui/material";

const AnimatedCounter = ({ end, duration = 2000, suffix = "" }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(easeOutQuart * end);
      setCount(currentCount);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration]);

  return <>{count.toLocaleString()}{suffix}</>;
};

const storeVideosForNavigation = (videos, listType) => {
  try {
    sessionStorage.setItem('currentVideosList', JSON.stringify(videos));
    sessionStorage.setItem('videoListType', listType);
  } catch (error) {
    console.error('Failed to store videos for navigation:', error);
  }
};

// --- WAV ENCODER ---
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

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    likedVideos,
    userDetails,
    comments,
    videos,
    commentedVideos,
    isLoadingVideos,
    isLoadingLikedVideos,
    isLoadingComments,
    isLoadingCommentedVideos,
    isLoadingMoreVideos,
    hasMoreVideos,
    jobVideosCounts,
    isLoadingJobVideosCounts,
    likedVideoError,
    getLikedVideos,
    getComments,
    getCommentedVideos,
    getVideos,
    loadMoreVideos,
    getJobVideosCounts,
    refreshLikedVideos,
    refreshCommentedVideos,
  } = useAppStore();

  const [displayVideos, setDisplayVideos] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [showStudentTable, setShowStudentTable] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(userDetails?.jobid);
  const [sortOrder, setSortOrder] = useState("asc");
  const [sortBy, setSortBy] = useState("name");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  // Advance Search State
  const [transcriptionKeywords, setTranscriptionKeywords] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const [isUploadingJD, setIsUploadingJD] = useState(false);
  const [advanceSearchVideos, setAdvanceSearchVideos] = useState([]);
  const [isAdvanceSearchLoading, setIsAdvanceSearchLoading] = useState(false);

  // Refs for recording
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioStreamRef = useRef(null);
  const jdInputRef = useRef(null);

  const isPlacementOrAcademy = userDetails?.jobOption === "placementDrive" || userDetails?.jobOption === "Academy";

  const getActiveTabFromURL = () => {
    const urlTab = searchParams.get('tab');
    if (urlTab && ['liked', 'commented', 'videos', 'advanceSearch'].includes(urlTab)) {
      return urlTab === 'videos' ? 'job' : urlTab;
    }
    return isPlacementOrAcademy ? "job" : "liked";
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromURL());

  const studentData = [
    { id: 1, name: "Arjun Sharma", email: "arjun.sharma@email.com", jobId: "C191" },
    { id: 2, name: "Priya Patel", email: "priya.patel@email.com", jobId: "C191" },
    { id: 3, name: "Rahul Kumar", email: "rahul.kumar@email.com", jobId: "C191" },
    { id: 4, name: "Anita Singh", email: "anita.singh@email.com", jobId: "C191" },
    { id: 5, name: "Vikram Gupta", email: "vikram.gupta@email.com", jobId: "C191" },
    { id: 6, name: "Meera Reddy", email: "meera.reddy@email.com", jobId: "C191" },
    { id: 7, name: "Suresh Yadav", email: "suresh.yadav@email.com", jobId: "C191" },
    { id: 8, name: "Kavya Nair", email: "kavya.nair@email.com", jobId: "C191" },
    { id: 9, name: "Raj Malhotra", email: "raj.malhotra@email.com", jobId: "C191" },
    { id: 10, name: "Deepika Jain", email: "deepika.jain@email.com", jobId: "C191" },
    { id: 11, name: "Amit Gupta", email: "amit.gupta@email.com", jobId: "C191" },
    { id: 12, name: "Sneha Sharma", email: "sneha.sharma@email.com", jobId: "C191" },
    { id: 13, name: "Ravi Kumar", email: "ravi.kumar@email.com", jobId: "C191" },
    { id: 14, name: "Pooja Singh", email: "pooja.singh@email.com", jobId: "C191" },
    { id: 15, name: "Kiran Patel", email: "kiran.patel@email.com", jobId: "C191" },
  ];

  const sortedStudentData = [...studentData].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];

    if (sortOrder === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    }
  });

  const handleVideoClick = (video, index) => {
    let videoSource = '';
    let videoList = [];

    switch (activeTab) {
      case 'liked':
        videoSource = 'liked';
        videoList = likedVideos;
        break;
      case 'commented':
        videoSource = 'commented';
        videoList = commentedVideos;
        break;
      case 'job':
        videoSource = 'videos';
        videoList = videos;
        break;
      case 'advanceSearch':
        videoSource = 'advanceSearch';
        videoList = advanceSearchVideos;
        break;
      default:
        videoSource = 'videos';
        videoList = videos;
    }

    try {
      sessionStorage.setItem('videoSource', videoSource);
      sessionStorage.setItem('currentVideosList', JSON.stringify(videoList));
      sessionStorage.setItem('videoListType', videoSource);
    } catch (error) {
      console.error('Failed to store video navigation info:', error);
    }

    const hashedId = btoa(video.id.toString());
    navigate(`/app/video/${hashedId}`, {
      state: {
        from: '/app/dashboard',
        source: videoSource,
        videoList: videoList,
        index: index
      }
    });
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleScroll = () => {
    if (activeTab !== "job" || !hasMoreVideos || isLoadingMoreVideos) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.offsetHeight;

    if (scrollTop + windowHeight >= documentHeight - 1000) {
      loadMoreVideos();
    }
  };

  const handleRefresh = async () => {
    if (activeTab === "liked") {
      try {
        await refreshLikedVideos();
      } catch (error) {
        setSnackbar({ open: true, message: "Failed to refresh liked videos", severity: "error" });
        console.error("Failed to refresh liked videos:", error);
      }
    } else if (activeTab === "commented") {
      try {
        await refreshCommentedVideos();
      } catch (error) {
        setSnackbar({ open: true, message: "Failed to refresh commented videos", severity: "error" });
        console.error("Failed to refresh commented videos:", error);
      }
    }
  };

  useEffect(() => {
    if (activeTab === "job") {
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [activeTab, hasMoreVideos, isLoadingMoreVideos]);

  useEffect(() => {
    const tabFromURL = getActiveTabFromURL();
    setActiveTab(tabFromURL);
  }, [searchParams, isPlacementOrAcademy]);

  useEffect(() => {
    if (!initialized && userDetails) {
      if (isPlacementOrAcademy) {
        getJobVideosCounts();
      }
      setInitialized(true);
    }
  }, [initialized, isPlacementOrAcademy, userDetails]);

  useEffect(() => {
    if (initialized) {
      loadTabData(activeTab);
    }
  }, [initialized, activeTab]);

  useEffect(() => {
    if (initialized) {
      updateDisplayVideos();
    }
  }, [activeTab, likedVideos, commentedVideos, videos, initialized, advanceSearchVideos]);

  const updateDisplayVideos = () => {
    switch (activeTab) {
      case "liked":
        setDisplayVideos(likedVideos || []);
        if (likedVideos && likedVideos.length > 0) {
          storeVideosForNavigation(likedVideos, 'liked');
        }
        break;
      case "commented":
        setDisplayVideos(commentedVideos || []);
        if (commentedVideos && commentedVideos.length > 0) {
          storeVideosForNavigation(commentedVideos, 'commented');
        }
        break;
      case "job":
        if (isPlacementOrAcademy && userDetails?.jobid) {
          setDisplayVideos(videos || []);
          if (videos && videos.length > 0) {
            storeVideosForNavigation(videos, 'job');
          }
        } else {
          setDisplayVideos([]);
        }
        break;
      case "advanceSearch":
        setDisplayVideos(advanceSearchVideos);
        if (advanceSearchVideos && advanceSearchVideos.length > 0) {
          storeVideosForNavigation(advanceSearchVideos, 'advanceSearch');
        }
        break;
      default:
        setDisplayVideos([]);
    }
  };

  const loadTabData = async (tab) => {
    try {
      switch (tab) {
        case "liked":
          await getLikedVideos();
          break;
        case "commented":
          await getCommentedVideos();
          break;
        case "job":
          if (!userDetails?.jobid && !isPlacementOrAcademy) {
            setSnackbar({
              open: true,
              message: "You have no job ID assigned to your profile",
              severity: "warning",
            });
            return;
          }
          if (isPlacementOrAcademy && userDetails?.jobid) {
            await getVideos();
          }
          break;
      }
    } catch (error) {
      console.error('Error loading tab data:', error);
      setSnackbar({
        open: true,
        message: "Failed to load videos",
        severity: "error",
      });
    }
  };

  const handleTabClick = (tab) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      setShowStudentTable(false);
      const urlTab = tab === 'job' ? 'videos' : tab;
      setSearchParams({ tab: urlTab });
    }
  };

  const handleFilterCardClick = () => {
    setShowStudentTable(false);
  };

  const handleStudentCardClick = () => {
    setShowStudentTable(true);
  };

  const handleFilterChange = (event) => {
    setSelectedFilter(event.target.value);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case "liked":
        return "Liked Videos";
      case "commented":
        return "Commented Videos";
      case "job":
        return isPlacementOrAcademy
          ? "Videos"
          : `Videos${userDetails?.jobid ? ` (Job ID: ${userDetails.jobid})` : ""}`;
      case "advanceSearch":
        return "Advance Search";
      default:
        return "Videos";
    }
  };

  const isCurrentTabLoading = () => {
    switch (activeTab) {
      case "liked":
        return isLoadingLikedVideos;
      case "commented":
        return isLoadingCommentedVideos;
      case "job":
        return isLoadingVideos;
      case "advanceSearch":
        return isAdvanceSearchLoading;
      default:
        return false;
    }
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // --- Voice Recording Logic ---
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
      const mimeType = getSupportedMimeType();
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

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (e) => {
        showSnackbar('Recording error: ' + (e?.message || 'unknown'), 'error');
        try { stopRecording(); } catch { }
      };

      recorder.onstop = async () => {
        try { audioStreamRef.current.getTracks().forEach((t) => t.stop()); } catch { }

        if (!audioChunksRef.current.length) {
          showSnackbar('No voice captured. Try speaking louder.', 'error');
          setIsRecording(false);
          return;
        }

        let blob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        try {
          blob = await encodeWAV(blob);
        } catch (err) {
          console.warn('WAV conversion skipped:', err);
        }

        await sendAudioForTranscription(blob);
        setIsRecording(false);
      };

      recorder.start(500);
      setIsRecording(true);
      showSnackbar('Recording started...', 'info');
    } catch (err) {
      console.error('Microphone access failed:', err);
      showSnackbar('Microphone access failed.', 'error');
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
    }
  };

  const sendAudioForTranscription = async (blob) => {
    setIsUploadingVoice(true);
    try {
      const formData = new FormData();
      const filename = `voice_${Date.now()}.wav`;
      formData.append('file', new File([blob], filename, { type: 'audio/wav' }));
      if (userDetails?.userId) {
        formData.append('userId', userDetails.userId);
      }

      showSnackbar('Uploading audio...', 'info');

      const res = await apiClient.post('/search/upload-voice-search', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const transcription = (res.data && (res.data.transcription || res.data.text || res.data)) || '';
      const transcriptionText = typeof transcription === 'string' ? transcription : JSON.stringify(transcription);

      if (!transcriptionText || !String(transcriptionText).trim()) {
        showSnackbar('Transcription returned empty.', 'warning');
        setIsUploadingVoice(false);
        return;
      }

      setTranscriptionKeywords(transcriptionText);
      showSnackbar('Transcription ready.', 'success');
    } catch (e) {
      console.error('Transcription upload failed:', e);
      showSnackbar('Transcription failed.', 'error');
    }
    setIsUploadingVoice(false);
  };

  // --- JD / File Logic ---
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

      setTranscriptionKeywords(transcription);
      showSnackbar('JD extracted.', 'success');
    } catch (e) {
      console.error('JD Upload Failed:', e);
      showSnackbar('JD extraction failed.', 'error');
    }
    setIsUploadingJD(false);
    if (jdInputRef.current) jdInputRef.current.value = '';
  };

  // --- Advance Search Execution ---
  const handleAdvanceSearch = async () => {
    if (!transcriptionKeywords.trim()) {
      showSnackbar('Please enter some keywords or use voice/JD.', 'warning');
      return;
    }

    setIsAdvanceSearchLoading(true);
    setAdvanceSearchVideos([]);

    try {
      const params = new URLSearchParams();
      let jobIdParam = selectedFilter || userDetails?.jobid;
      let transcriptionParam = transcriptionKeywords;

      // Check if transcriptionKeywords looks like a Job ID (alphanumeric, e.g., 'C191')
      // If so, treat it as a Job ID search
      if (!jobIdParam && transcriptionKeywords) {
        // Regex for job ID: starts with letter, followed by numbers (e.g., C191)
        // Or strictly alphanumeric without spaces
        const jobIdPattern = /^[A-Za-z][0-9]+$/;
        const isJobId = jobIdPattern.test(transcriptionKeywords.trim());

        if (isJobId) {
          jobIdParam = transcriptionKeywords.trim();
          transcriptionParam = ''; // Clear transcription to search by Job ID only
        }
      }

      if (jobIdParam) {
        params.append('jobId', jobIdParam);
      }

      params.append('userId', userDetails?.userId ?? '');
      params.append('transcription', transcriptionParam);

      console.log("Advance Search Params:", {
        userId: userDetails?.userId,
        transcription: transcriptionParam,
        jobId: jobIdParam
      });
      console.log("Params string:", params.toString());

      const res = await apiClient.post('/search/voice', params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      console.log("Advance Search Response:", res.data);

      if (Array.isArray(res.data)) {
        setAdvanceSearchVideos(res.data);
        showSnackbar(`Found ${res.data.length} videos`, 'success');
      } else {
        const list = res.data?.results || res.data?.videos || [];
        console.log("Extracted list:", list);
        setAdvanceSearchVideos(Array.isArray(list) ? list : []);
        showSnackbar(`Search completed`, 'success');
      }
    } catch (e) {
      console.error('Advance search failed:', e);
      showSnackbar('Search failed: ' + (e?.message || 'Server error'), 'error');
    }
    setIsAdvanceSearchLoading(false);
  };


  const renderTabCards = () => {
    if (isPlacementOrAcademy) {
      return (
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, md: 3 }}>
            <Card
              onClick={() => navigate("/app/culture")}
              sx={{
                borderRadius: "12px",
                background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                boxShadow: "0 4px 12px rgba(22, 163, 74, 0.3)",
                transition: "all 0.3s ease",
                cursor: "pointer",
                height: { xs: 100, sm: 120, md: 140 },
                "&:hover": {
                  boxShadow: "0 6px 16px rgba(22, 163, 74, 0.4)",
                  transform: { xs: "none", md: "translateY(-2px)" },
                },
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  p: { xs: 1.5, sm: 2, md: 2.5 },
                  gap: { xs: 1, sm: 1.5, md: 2 },
                }}
              >
                <Box
                  sx={{
                    width: { xs: 48, sm: 56, md: 64 },
                    height: { xs: 48, sm: 56, md: 64 },
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
                  }}
                >
                  <HubIcon sx={{ color: "white", fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" } }} />
                </Box>
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: "600",
                      fontSize: { xs: "0.75rem", sm: "0.875rem", md: "1rem" },
                      color: "#1e293b",
                      lineHeight: 1.2,
                    }}
                  >
                    Culture Fit
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

          <Grid size={{ xs: 6, md: 3 }}>
            <Card
              onClick={handleFilterCardClick}
              sx={{
                borderRadius: "12px",
                background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                transition: "all 0.3s ease",
                cursor: "pointer",
                height: { xs: 100, sm: 120, md: 140 },
                "&:hover": {
                  boxShadow: "0 6px 16px rgba(16, 185, 129, 0.4)",
                  transform: { xs: "none", md: "translateY(-2px)" },
                },
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  p: { xs: 1.5, sm: 2, md: 2.5 },
                  gap: { xs: 1, sm: 1.5, md: 2 },
                }}
              >
                <Box
                  sx={{
                    width: { xs: 48, sm: 56, md: 64 },
                    height: { xs: 48, sm: 56, md: 64 },
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                  }}
                >
                  <FilterListIcon sx={{ color: "white", fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" } }} />
                </Box>

                <Box>
                  <FormControl size="small" sx={{ minWidth: 110 }}>
                    <Select
                      value={selectedFilter}
                      onChange={handleFilterChange}
                      displayEmpty
                      size="small"
                      IconComponent={KeyboardArrowDownIcon}
                      sx={{
                        backgroundColor: "white",
                        borderRadius: "10px",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                        boxShadow: "0 2px 8px rgba(16, 185, 129, 0.15)",
                        "& .MuiSelect-select": {
                          padding: "8px 12px",
                          fontSize: "0.8rem",
                          fontWeight: "600",
                          color: "#059669",
                          display: "flex",
                          alignItems: "center",
                        },
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#10b981",
                          borderWidth: "2px",
                          borderRadius: "10px",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#059669",
                          borderWidth: "2px",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#10b981",
                          borderWidth: "2px",
                          boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.1)",
                        },
                        "& .MuiSelect-icon": {
                          color: "#059669",
                          fontSize: "1.2rem",
                        },
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            borderRadius: "8px",
                            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
                            border: "1px solid #e5e7eb",
                            mt: 1,
                          },
                        },
                      }}
                    >
                      <MenuItem
                        value={userDetails?.jobid}
                        sx={{
                          fontSize: "0.8rem",
                          fontWeight: "500",
                          color: "#374151",
                          "&:hover": {
                            backgroundColor: "#ecfdf5",
                            color: "#059669",
                          },
                          "&.Mui-selected": {
                            backgroundColor: "#d1fae5",
                            color: "#059669",
                            fontWeight: "600",
                            "&:hover": {
                              backgroundColor: "#a7f3d0",
                            },
                          },
                        }}
                      >
                        {userDetails?.jobid}
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </Card>
          </Grid>

          <Grid size={{ xs: 6, md: 3 }}>
            <Card
              sx={{
                borderRadius: "12px",
                background: "linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%)",
                boxShadow: "0 4px 12px rgba(168, 85, 247, 0.3)",
                transition: "all 0.3s ease",
                cursor: "pointer",
                height: { xs: 100, sm: 120, md: 140 },
                "&:hover": {
                  boxShadow: "0 6px 16px rgba(168, 85, 247, 0.4)",
                  transform: { xs: "none", md: "translateY(-2px)" },
                },
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  p: { xs: 1.5, sm: 2, md: 2.5 },
                  gap: { xs: 1, sm: 1.5, md: 2 },
                }}
              >
                <Box
                  sx={{
                    width: { xs: 48, sm: 56, md: 64 },
                    height: { xs: 48, sm: 56, md: 64 },
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #a855f7 0%, #9333ea 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(168, 85, 247, 0.3)",
                  }}
                >
                  <PeopleIcon sx={{ color: "white", fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" } }} />
                </Box>

                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: "600",
                      fontSize: { xs: "0.75rem", sm: "0.875rem", md: "1rem" },
                      color: "#1e293b",
                      lineHeight: 1.2,
                      mb: 0.5,
                    }}
                  >
                    Total Students
                  </Typography>

                  {isLoadingJobVideosCounts ? (
                    <CircularProgress size={16} sx={{ color: "#a855f7" }} />
                  ) : (
                    <Typography
                      variant="h5"
                      sx={{
                        color: "#a855f7",
                        fontSize: { xs: "0.9rem", sm: "1.1rem", md: "1.3rem" },
                        fontWeight: "700",
                      }}
                    >
                      <AnimatedCounter end={jobVideosCounts?.totalUsers || 0} duration={2500} />
                    </Typography>
                  )}
                </Box>
              </Box>
            </Card>
          </Grid>

          <Grid size={{ xs: 6, md: 3 }}>
            <Card
              sx={{
                borderRadius: "12px",
                background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                height: { xs: 100, sm: 120, md: 140 },
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  p: { xs: 1.5, sm: 2, md: 2.5 },
                  gap: { xs: 1, sm: 1.5, md: 2 },
                }}
              >
                <Box
                  sx={{
                    width: { xs: 48, sm: 56, md: 64 },
                    height: { xs: 48, sm: 56, md: 64 },
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                  }}
                >
                  <PlayCircleOutlineIcon sx={{ color: "white", fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" } }} />
                </Box>

                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: "600",
                      fontSize: { xs: "0.75rem", sm: "0.875rem", md: "1rem" },
                      color: "#1e293b",
                      lineHeight: 1.2,
                      mb: 0.5,
                    }}
                  >
                    Total Videos
                  </Typography>

                  {isLoadingJobVideosCounts ? (
                    <CircularProgress size={16} sx={{ color: "#3b82f6" }} />
                  ) : (
                    <Typography
                      variant="h5"
                      sx={{
                        color: "#3b82f6",
                        fontSize: { xs: "0.9rem", sm: "1.1rem", md: "1.3rem" },
                        fontWeight: "700",
                      }}
                    >
                      <AnimatedCounter end={jobVideosCounts?.totalVideos || 0} duration={2000} />
                    </Typography>
                  )}
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
      );
    } else {
      return (
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, md: 2.4 }}>
            <Card
              onClick={() => handleTabClick("liked")}
              sx={{
                borderRadius: "12px",
                border: activeTab === "liked" ? "2px solid #ec4899" : "1px solid #e2e8f0",
                background:
                  activeTab === "liked"
                    ? "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)"
                    : "#ffffff",
                boxShadow:
                  activeTab === "liked"
                    ? "0 4px 12px rgba(236, 72, 153, 0.3)"
                    : "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                transition: "all 0.3s ease",
                cursor: "pointer",
                height: { xs: 100, sm: 120, md: 140 },
                "&:hover": {
                  boxShadow: {
                    xs: activeTab === "liked"
                      ? "0 4px 12px rgba(236, 72, 153, 0.3)"
                      : "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                    md: "0 4px 12px 0 rgba(0, 0, 0, 0.1)",
                  },
                  transform: { xs: "none", md: "translateY(-2px)" },
                  backgroundColor:
                    activeTab === "liked"
                      ? "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)"
                      : "#f8fafc",
                },
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  p: { xs: 1.5, sm: 2, md: 2.5 },
                  gap: { xs: 1, sm: 1.5, md: 2 },
                }}
              >
                <Box
                  sx={{
                    width: { xs: 48, sm: 56, md: 64 },
                    height: { xs: 48, sm: 56, md: 64 },
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(236, 72, 153, 0.3)",
                  }}
                >
                  <FavoriteIcon sx={{ color: "white", fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" } }} />
                </Box>

                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: "600",
                      fontSize: { xs: "0.75rem", sm: "0.875rem", md: "1rem" },
                      color: "#1e293b",
                      lineHeight: 1.2,
                    }}
                  >
                    Liked Videos
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

          <Grid size={{ xs: 6, md: 2.4 }}>
            <Card
              onClick={() => handleTabClick("commented")}
              sx={{
                borderRadius: "12px",
                border: activeTab === "commented" ? "2px solid #f59e0b" : "1px solid #e2e8f0",
                background:
                  activeTab === "commented"
                    ? "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)"
                    : "#ffffff",
                boxShadow:
                  activeTab === "commented"
                    ? "0 4px 12px rgba(245, 158, 11, 0.3)"
                    : "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                transition: "all 0.3s ease",
                cursor: "pointer",
                height: { xs: 100, sm: 120, md: 140 },
                "&:hover": {
                  boxShadow: {
                    xs: activeTab === "commented"
                      ? "0 4px 12px rgba(245, 158, 11, 0.3)"
                      : "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                    md: "0 4px 12px 0 rgba(0, 0, 0, 0.1)",
                  },
                  transform: { xs: "none", md: "translateY(-2px)" },
                  backgroundColor:
                    activeTab === "commented"
                      ? "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)"
                      : "#f8fafc",
                },
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  p: { xs: 1.5, sm: 2, md: 2.5 },
                  gap: { xs: 1, sm: 1.5, md: 2 },
                }}
              >
                <Box
                  sx={{
                    width: { xs: 48, sm: 56, md: 64 },
                    height: { xs: 48, sm: 56, md: 64 },
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
                  }}
                >
                  <CommentIcon sx={{ color: "white", fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" } }} />
                </Box>

                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: "600",
                      fontSize: { xs: "0.75rem", sm: "0.875rem", md: "1rem" },
                      color: "#1e293b",
                      lineHeight: 1.2,
                    }}
                  >
                    Commented Videos
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

          <Grid size={{ xs: 6, md: 2.4 }}>
            <Card
              onClick={() => handleTabClick("job")}
              sx={{
                borderRadius: "12px",
                border: activeTab === "job" ? "2px solid #10b981" : "1px solid #e2e8f0",
                background:
                  activeTab === "job"
                    ? "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)"
                    : "#ffffff",
                boxShadow:
                  activeTab === "job"
                    ? "0 4px 12px rgba(16, 185, 129, 0.3)"
                    : "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                transition: "all 0.3s ease",
                cursor: "pointer",
                height: { xs: 100, sm: 120, md: 140 },
                "&:hover": {
                  boxShadow: {
                    xs: activeTab === "job"
                      ? "0 4px 12px rgba(16, 185, 129, 0.3)"
                      : "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                    md: "0 4px 12px 0 rgba(0, 0, 0, 0.1)",
                  },
                  transform: { xs: "none", md: "translateY(-2px)" },
                  backgroundColor:
                    activeTab === "job"
                      ? "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)"
                      : "#f8fafc",
                },
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  p: { xs: 1.5, sm: 2, md: 2.5 },
                  gap: { xs: 1, sm: 1.5, md: 2 },
                }}
              >
                <Box
                  sx={{
                    width: { xs: 48, sm: 56, md: 64 },
                    height: { xs: 48, sm: 56, md: 64 },
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                  }}
                >
                  <WorkIcon sx={{ color: "white", fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" } }} />
                </Box>

                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: "600",
                      fontSize: { xs: "0.75rem", sm: "0.875rem", md: "1rem" },
                      color: "#1e293b",
                      lineHeight: 1.2,
                    }}
                  >
                    Videos
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

          <Grid size={{ xs: 6, md: 2.4 }}>
            <Card
              onClick={() => handleTabClick("advanceSearch")}
              sx={{
                borderRadius: "12px",
                border: activeTab === "advanceSearch" ? "2px solid #8b5cf6" : "1px solid #e2e8f0",
                background:
                  activeTab === "advanceSearch"
                    ? "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)"
                    : "#ffffff",
                boxShadow:
                  activeTab === "advanceSearch"
                    ? "0 4px 12px rgba(139, 92, 246, 0.3)"
                    : "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                transition: "all 0.3s ease",
                cursor: "pointer",
                height: { xs: 100, sm: 120, md: 140 },
                "&:hover": {
                  boxShadow: {
                    xs: activeTab === "advanceSearch"
                      ? "0 4px 12px rgba(139, 92, 246, 0.3)"
                      : "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                    md: "0 4px 12px 0 rgba(0, 0, 0, 0.1)",
                  },
                  transform: { xs: "none", md: "translateY(-2px)" },
                  backgroundColor:
                    activeTab === "advanceSearch"
                      ? "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)"
                      : "#f8fafc",
                },
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  p: { xs: 1.5, sm: 2, md: 2.5 },
                  gap: { xs: 1, sm: 1.5, md: 2 },
                }}
              >
                <Box
                  sx={{
                    width: { xs: 48, sm: 56, md: 64 },
                    height: { xs: 48, sm: 56, md: 64 },
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
                  }}
                >
                  <SearchIcon sx={{ color: "white", fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" } }} />
                </Box>

                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: "600",
                      fontSize: { xs: "0.75rem", sm: "0.875rem", md: "1rem" },
                      color: "#1e293b",
                      lineHeight: 1.2,
                    }}
                  >
                    Advance Search
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

          <Grid size={{ xs: 6, md: 2.4 }}>
            <Card
              onClick={() => navigate("/app/culture")}
              sx={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                background: "#ffffff",
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                transition: "all 0.3s ease",
                cursor: "pointer",
                height: { xs: 100, sm: 120, md: 140 },
                "&:hover": {
                  boxShadow: "0 4px 12px 0 rgba(0, 0, 0, 0.1)",
                  transform: { xs: "none", md: "translateY(-2px)" },
                  backgroundColor: "#f8fafc",
                },
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  p: { xs: 1.5, sm: 2, md: 2.5 },
                  gap: { xs: 1, sm: 1.5, md: 2 },
                }}
              >
                <Box
                  sx={{
                    width: { xs: 48, sm: 56, md: 64 },
                    height: { xs: 48, sm: 56, md: 64 },
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
                  }}
                >
                  <HubIcon sx={{ color: "white", fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" } }} />
                </Box>

                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: "600",
                      fontSize: { xs: "0.75rem", sm: "0.875rem", md: "1rem" },
                      color: "#1e293b",
                      lineHeight: 1.2,
                    }}
                  >
                    Culture Fit
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
      );
    }
  };

  if (!userDetails) {
    return (
      <Container maxWidth={false} sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container
      maxWidth={false}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100vh",
        px: { xs: 2, md: 3 },
        pb: 2,
      }}
    >
      <Box
        sx={{
          height: 64,
          width: "100%",
          borderBottom: "1px solid #e0e0e0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: "600" }}>
          Dashboard
        </Typography>
      </Box>

      <Box sx={{ width: "100%", maxWidth: 1200, mb: 3, px: 2 }}>
        {renderTabCards()}
      </Box>

      <Paper sx={{ width: "100%", maxWidth: 1200, p: 3, mb: 3, borderRadius: 3, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        {showStudentTable ? (
          <Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: "600", color: "#1e293b", mb: 1 }}>
                Student Details
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748b" }}>
                {studentData.length} student{studentData.length !== 1 ? "s" : ""} enrolled
              </Typography>
            </Box>

            <TableContainer
              component={Paper}
              sx={{
                maxHeight: 500,
                borderRadius: 2,
                overflow: "hidden",
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
              }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow
                    sx={{
                      background: "radial-gradient(circle at top left, #cce0ff, #0066FF, #002d73)",
                      "& th": { borderBottom: "none" },
                    }}
                  >
                    <TableCell sx={{ background: "transparent", color: "white", fontWeight: "700", fontSize: "0.95rem", padding: "16px" }}>
                      <TableSortLabel
                        active={sortBy === "name"}
                        direction={sortBy === "name" ? sortOrder : "asc"}
                        onClick={() => handleSort("name")}
                        sx={{
                          color: "white !important",
                          "& .MuiTableSortLabel-icon": {
                            color: "white !important",
                          },
                        }}
                      >
                        Name
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ background: "transparent", color: "white", fontWeight: "700", fontSize: "0.95rem", padding: "16px" }}>
                      <TableSortLabel
                        active={sortBy === "email"}
                        direction={sortBy === "email" ? sortOrder : "asc"}
                        onClick={() => handleSort("email")}
                        sx={{
                          color: "white !important",
                          "& .MuiTableSortLabel-icon": {
                            color: "white !important",
                          },
                        }}
                      >
                        Email ID
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ background: "transparent", color: "white", fontWeight: "700", fontSize: "0.95rem", padding: "16px" }}>
                      <TableSortLabel
                        active={sortBy === "jobId"}
                        direction={sortBy === "jobId" ? sortOrder : "asc"}
                        onClick={() => handleSort("jobId")}
                        sx={{
                          color: "white !important",
                          "& .MuiTableSortLabel-icon": {
                            color: "white !important",
                          },
                        }}
                      >
                        Job ID
                      </TableSortLabel>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedStudentData.map((student, index) => (
                    <TableRow
                      key={student.id}
                      sx={{
                        "&:hover": {
                          background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
                          transform: "scale(1.01)",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                          transition: "all 0.2s ease-in-out",
                        },
                        backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9fafb",
                        transition: "all 0.2s ease-in-out",
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      <TableCell sx={{ fontSize: "0.9rem", padding: "16px", fontWeight: "500", color: "#374151" }}>
                        {student.name}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.9rem", padding: "16px", color: "#6b7280" }}>
                        {student.email}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.9rem", padding: "16px", fontWeight: "600", color: "#10b981" }}>
                        {student.jobId}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ) : (
          <Box>
            <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", justifyContent: "space-between" }}>
              <Typography variant="h6" sx={{ fontWeight: "600", color: "#1e293b", mb: 1 }}>
                {getTabTitle()}
              </Typography>
            </Box>

            {activeTab === "advanceSearch" && (
              <Paper
                sx={{
                  p: { xs: 3, md: 4 },
                  mb: 4,
                  borderRadius: 4,
                  background: "linear-gradient(135deg, #ffffff 30%, #e0f2fe 100%)",
                  boxShadow: "0 8px 32px rgba(37,99,235,0.08)",
                  border: "1px solid rgba(255,255,255,0.8)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Decorative background blurs */}
                <Box
                  sx={{
                    position: "absolute",
                    top: -60,
                    right: -60,
                    width: 300,
                    height: 300,
                    background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, rgba(255,255,255,0) 70%)",
                    zIndex: 0,
                    filter: "blur(20px)",
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    bottom: -40,
                    left: -40,
                    width: 250,
                    height: 250,
                    background: "radial-gradient(circle, rgba(147,51,234,0.05) 0%, rgba(255,255,255,0) 70%)",
                    zIndex: 0,
                    filter: "blur(20px)",
                  }}
                />

                <Box sx={{ position: "relative", zIndex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: "#0f172a", display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        bgcolor: "primary.main",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 8px rgba(37,99,235,0.25)"
                      }}
                    >
                      <SearchIcon sx={{ color: "white", fontSize: 18 }} />
                    </Box>
                    Advanced Search Intelligence
                  </Typography>

                  <Grid container spacing={3}>
                    {/* Main Input Area */}
                    <Grid size={{ xs: 12, md: 8 }}>
                      <TextField
                        fullWidth
                        multiline
                        minRows={4}
                        placeholder="Type keywords, candidate skills, or transcript text here..."
                        value={transcriptionKeywords}
                        onChange={(e) => setTranscriptionKeywords(e.target.value)}
                        variant="outlined"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 3,
                            backgroundColor: "#ffffff",
                            transition: "all 0.2s ease-in-out",
                            "&:hover": {
                              borderColor: "primary.light",
                              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                            },
                            "&.Mui-focused": {
                              boxShadow: "0 4px 12px rgba(37,99,235,0.1)",
                            }
                          }
                        }}
                      />
                      <Typography variant="caption" sx={{ color: "#64748b", mt: 1, display: "block", ml: 1 }}>
                        • Use key phrases from job descriptions  • Paste interview transcripts  • Type specific skills
                      </Typography>
                    </Grid>

                    {/* Action Panel */}
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, height: "100%" }}>
                        {/* Voice Search Button */}
                        <Button
                          variant={isRecording ? "contained" : "outlined"}
                          onClick={() => isRecording ? stopRecording() : startRecording()}
                          disabled={isUploadingVoice}
                          fullWidth
                          startIcon={
                            isRecording ? (
                              <Box sx={{
                                width: 10, height: 10, borderRadius: "50%", bgcolor: "white",
                                animation: "pulse 1.5s infinite"
                              }} />
                            ) : <Mic />
                          }
                          sx={{
                            borderRadius: 2.5,
                            py: 1.5,
                            justifyContent: "flex-start",
                            px: 3,
                            textAlign: "left",
                            bgcolor: isRecording ? "error.main" : "transparent",
                            borderColor: isRecording ? "error.main" : "divider",
                            color: isRecording ? "white" : "text.primary",
                            "&:hover": {
                              bgcolor: isRecording ? "error.dark" : "action.hover",
                            },
                            "@keyframes pulse": {
                              "0%": { boxShadow: "0 0 0 0 rgba(255, 255, 255, 0.7)" },
                              "70%": { boxShadow: "0 0 0 10px rgba(255, 255, 255, 0)" },
                              "100%": { boxShadow: "0 0 0 0 rgba(255, 255, 255, 0)" }
                            }
                          }}
                        >
                          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", ml: 1 }}>
                            <Typography variant="body2" fontWeight={600}>
                              {isRecording ? "Stop Recording" : "Voice Search"}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                              {isRecording ? "Listening..." : "Speak to search"}
                            </Typography>
                          </Box>
                        </Button>

                        <input
                          ref={jdInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={handleJdFileSelected}
                          style={{ display: 'none' }}
                        />

                        {/* Upload Button */}
                        <Button
                          variant="outlined"
                          onClick={() => jdInputRef.current?.click()}
                          disabled={isUploadingJD}
                          fullWidth
                          startIcon={<UploadFile sx={{ color: "primary.main" }} />}
                          sx={{
                            borderRadius: 2.5,
                            py: 1.5,
                            justifyContent: "flex-start",
                            px: 3,
                            borderColor: "divider",
                            color: "text.primary",
                            backgroundColor: "white",
                            "&:hover": { borderColor: "primary.main", bgcolor: "rgba(37,99,235,0.02)" }
                          }}
                        >
                          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", ml: 1 }}>
                            <Typography variant="body2" fontWeight={600}>
                              {isUploadingJD ? 'Extracting...' : 'Upload JD'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Extract from PDF/Doc
                            </Typography>
                          </Box>
                        </Button>

                        {/* Search CTA */}
                        <Button
                          variant="contained"
                          onClick={handleAdvanceSearch}
                          fullWidth
                          size="large"
                          disabled={isAdvanceSearchLoading}
                          endIcon={isAdvanceSearchLoading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                          sx={{
                            mt: "auto",
                            borderRadius: 2.5,
                            py: 1.5,
                            fontWeight: 700,
                            boxShadow: "0 4px 12px rgba(37,99,235,0.2)",
                            background: "linear-gradient(to right, #2563eb, #1d4ed8)",
                            "&:hover": {
                              boxShadow: "0 6px 16px rgba(37,99,235,0.3)",
                              transform: "translateY(-1px)"
                            }
                          }}
                        >
                          {isAdvanceSearchLoading ? "Searching..." : "Find Matching Videos"}
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            )}

            {activeTab === "liked" && likedVideoError && (
              <Box sx={{ mb: 3, p: 2, bgcolor: "#fee2e2", borderRadius: 2, border: "1px solid #fca5a5" }}>
                <Typography color="error">{likedVideoError}</Typography>
              </Box>
            )}

            {isCurrentTabLoading() ? (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={0.7}>
                {displayVideos.length === 0 ? (
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ textAlign: "center", py: activeTab === "liked" ? 8 : 6, bgcolor: activeTab === "liked" ? "#f8fafc" : "transparent", borderRadius: activeTab === "liked" ? 3 : 0, border: activeTab === "liked" ? "1px solid #e5e7eb" : "none", color: "#6b7280" }}>
                      {activeTab === "liked" && <FavoriteIcon sx={{ fontSize: 64, color: "#d1d5db", mb: 2 }} />}

                      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                        {activeTab === "liked"
                          ? "No liked videos yet"
                          : activeTab === "commented"
                            ? "No commented videos yet"
                            : activeTab === "job" && !userDetails?.jobid && !isPlacementOrAcademy
                              ? "No job ID assigned to your profile"
                              : "No videos found"}
                      </Typography>

                      {activeTab === "liked" && (
                        <>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Start exploring and like videos to see them here
                          </Typography>
                          <Button variant="contained" onClick={() => navigate("/app/videos")} sx={{ px: 4 }}>
                            Browse Videos
                          </Button>
                        </>
                      )}
                    </Box>
                  </Grid>
                ) : (
                  <>
                    {isCurrentTabLoading()
                      ? Array(12)
                        .fill()
                        .map((_, index) => (
                          <Grid size={{ xs: 4, lg: 3 }} key={index}>
                            <VideoSkeleton />
                          </Grid>
                        ))
                      : displayVideos.map((video) => (
                        <Grid size={{ xs: 4, lg: 3 }} key={video.id}>
                          <VideoCard
                            video={video}
                            isSearchResult={activeTab === "advanceSearch"}
                            onClick={() => handleVideoClick(video)}
                          />
                        </Grid>
                      ))}

                    {isLoadingMoreVideos && (
                      <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                        <CircularProgress />
                      </Box>
                    )}
                  </>
                )}
              </Grid>
            )}
          </Box>
        )}
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container >
  );
}