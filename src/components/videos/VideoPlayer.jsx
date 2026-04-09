/* eslint-disable no-unused-vars */
/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  IconButton,
  useMediaQuery,
  useTheme,
  Button,
  Fab,
  CircularProgress,
  Modal,
  Paper,
  Snackbar,
  Alert,
  Typography,
  Chip,
  Popover,
  Avatar,
  LinearProgress,
  Card,
  CardContent,
  Grid,
  Divider,
  Badge,
  Stack,
  Skeleton,
  Backdrop,
} from "@mui/material";
import {
  ArrowBack,
  NavigateBefore,
  NavigateNext,
  Favorite,
  FavoriteBorder,
  Share,
  Phone,
  Email,
  Assessment,
  Comment,
  Mic,
  Link,
  TrendingUp,
  Star,
  Psychology,
  Visibility,
  EmojiEvents,
  Error,
} from "@mui/icons-material";
import { useParams, useNavigate, useLocation } from "react-router";
import { createPortal } from "react-dom";
import axiosInstance from "../../axios/axios";
import { useAppStore } from "../../store/appStore";
import CommentsSection from "./CommentsSection";
import LinkedInIcon from '@mui/icons-material/LinkedIn';

// --- Icon Styling for improved design and no stretching ---
const actionIconStyle = {
  fontSize: '28px', // Explicit icon size
  color: 'white',
};

const actionButtonStyle = {
  bgcolor: 'rgba(0, 0, 0, 0.4)', // Translucent dark background for visibility
  '&:hover': {
    bgcolor: 'rgba(0, 0, 0, 0.6)',
  },
  p: 1.5, // Padding for a circular shape
};
// ---------------------------------------------------------


const getStoredVideosForNavigation = () => {
  try {
    const stored = sessionStorage.getItem('currentVideosList');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};
const getStoredVideoListType = () => {
  try {
    return sessionStorage.getItem('videoListType') || null;
  } catch {
    return null;
  }
};
const getStoredVideoSource = () => {
  try {
    return sessionStorage.getItem('videoSource') || 'videos';
  } catch {
    return 'videos';
  }
};
export default function VideoPlayer() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const videoRef = useRef();
  const containerRef = useRef();
  const mobileContainerRef = useRef();
  const videoContainerRef = useRef();
  const [video, setVideo] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [videoLoading, setVideoLoading] = useState(false);
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [subtitles, setSubtitles] = useState({});
  const [subtitlesFetched, setSubtitlesFetched] = useState(new Set());
  const [isScrolling, setIsScrolling] = useState(false);
  const [phonePopoverOpen, setPhonePopoverOpen] = useState(false);
  const [phoneAnchorEl, setPhoneAnchorEl] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  // State to control the blur effect
  const [isScoreBlurred, setIsScoreBlurred] = useState(true);
  const [scoreState, setScoreState] = useState({
    loading: false, // <-- Changed to false initially
    error: null,
    data: null,
    hashtags: null,
    performance: null,
    feedback: null,
    scores: null,
    helpers: null
  });
  const {
    userDetails,
    videos,
    likedVideos,
    commentedVideos,
    isLoadingVideos,
    getVideos,
    getLikedVideos,
    getCommentedVideos
  } = useAppStore();
  const [currentVideosList, setCurrentVideosList] = useState([]);
  let decodedVideoId;
  try {
    decodedVideoId = videoId ? atob(videoId) : null;
  } catch (error) {
    console.error("Error decoding video ID:", error);
    decodedVideoId = null;
  }
  const decodeProfilePic = (pic) => {
    if (!pic) return null;
    if (pic.startsWith('https://wezume')) return pic;
    try {
      return atob(pic);
    } catch {
      return pic;
    }
  };
  console.log('video', video?.firstName, video?.firstname)
  const renderScoreEvaluation = () => {
    if (scoreState.loading) {
      return (
        <Box sx={{
          height: '100%',
          overflow: 'auto',
          p: 2
        }}>
          <Paper sx={{
            mb: 2,
            p: 2,
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.05)'
          }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Skeleton variant="circular" width={60} height={60} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="60%" height={28} />
                <Skeleton variant="text" width="40%" height={20} />
                <Skeleton variant="rounded" width={80} height={24} sx={{ mt: 1 }} />
              </Box>
            </Stack>
          </Paper>
          <Paper sx={{
            mb: 3,
            p: 3,
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.05)',
            textAlign: 'center'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <CircularProgress size={60} sx={{ color: '#1976d2' }} />
            </Box>
            <Typography variant="h6" sx={{
              color: '#1976d2',
              fontWeight: 600,
              mb: 1
            }}>
              Analyzing Performance
            </Typography>
            <Typography variant="body2" sx={{
              color: '#6b7280',
              fontWeight: 500
            }}>
              Please wait while we evaluate the video...
            </Typography>
            <Box sx={{ maxWidth: 300, mx: 'auto', mt: 2 }}>
              <Skeleton variant="rounded" height={12} />
            </Box>
          </Paper>
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Skeleton variant="circular" width={20} height={20} />
              <Skeleton variant="text" width={100} height={28} />
            </Stack>
            <Grid container spacing={1.5}>
              {Array.from({ length: 4 }).map((_, index) => (
                <Grid size={{ xs: 12 }} key={index}>
                  <Paper sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid rgba(0,0,0,0.05)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                  }}>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1.5 }}>
                      <Skeleton variant="rounded" width={32} height={32} />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton variant="text" width="40%" height={20} />
                        <Skeleton variant="text" width="60%" height={16} />
                      </Box>
                      <Skeleton variant="text" width={30} height={28} />
                    </Stack>
                    <Skeleton variant="rounded" height={6} />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
          <Paper sx={{
            p: 2.5,
            borderRadius: 2,
            border: '1px solid rgba(0,0,0,0.05)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Skeleton variant="circular" width={20} height={20} />
              <Skeleton variant="text" width={80} height={28} />
            </Stack>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} variant="rounded" width={80} height={24} />
              ))}
            </Box>
            <Skeleton variant="text" width="90%" height={20} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="85%" height={20} />
          </Paper>
        </Box>
      );
    }
    if (scoreState.error) {
      const errorMessage = scoreState.error?.message || "Score is not available for the video";
      const is404Error = scoreState.error?.errorType === 404;
      return (
        <Box sx={{
          height: '100%',
          overflow: 'auto',
          p: 2
        }}>
          <Paper sx={{
            mb: 2,
            p: 2,
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.05)'
          }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                src={decodeProfilePic(video?.profilepic || video?.profilePic)}
                sx={{
                  width: 60,
                  height: 60,
                  border: '2px solid rgba(0,0,0,0.05)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
                }}
              >
                {video?.firstname?.charAt(0)}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{
                  fontWeight: 600,
                  mb: 0.5,
                  color: '#111827',
                  fontSize: '1.1rem'
                }}>
                  {video?.firstname || video?.firstName}
                </Typography>
              </Box>
            </Stack>
          </Paper>
          <Paper sx={{
            p: 3,
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: is404Error ? '1px solid rgba(251, 146, 60, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
            bgcolor: is404Error ? 'rgba(251, 146, 60, 0.05)' : 'rgba(239, 68, 68, 0.05)',
            textAlign: 'center'
          }}>
            <Box sx={{ mb: 2 }}>
              {is404Error ? (
                <Assessment sx={{ fontSize: 48, color: '#f59e0b', mb: 2 }} />
              ) : (
                <Error sx={{ fontSize: 48, color: '#ef4444', mb: 2 }} />
              )}
              <Typography variant="h6" sx={{
                color: is404Error ? '#f59e0b' : '#ef4444',
                fontWeight: 600,
                mb: 1
              }}>
                {errorMessage}
              </Typography>
              <Typography variant="body2" sx={{
                color: '#6b7280',
                fontWeight: 500
              }}>
                {is404Error
                  ? "This video has not been evaluated yet or the score data is unavailable."
                  : "There was an issue loading the score data. Please try again later."
                }
              </Typography>
            </Box>
          </Paper>
        </Box>
      );
    }
    if (!scoreState.data) {
      return null;
    }
    const { hashtags, performance, feedback, scores, helpers, data } = scoreState;
    return (
      <Box sx={{
        height: '100%',
        overflow: 'auto',
        p: 2
      }}>
        <Paper sx={{
          mb: 2,
          p: 2,
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.05)'
        }}>
          <Stack direction="row" spacing={2} alignItems="center">
            {/* Conditionally render the Badge only when not blurred */}
            {!isScoreBlurred && (
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <Box sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    bgcolor: helpers.getScoreColor(data.totalScore),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}>
                    <Typography variant="caption" sx={{
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: 700
                    }}>
                      {data.totalScore}
                    </Typography>
                  </Box>
                }
              >
                <Avatar
                  src={decodeProfilePic(video.profilepic || video.profilePic)}
                  sx={{
                    width: 60,
                    height: 60,
                    border: '2px solid rgba(0,0,0,0.05)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
                  }}
                >
                  {video.firstname?.charAt(0)}
                </Avatar>
              </Badge>
            )}
            {isScoreBlurred && (
              <Avatar
                src={decodeProfilePic(video.profilepic || video.profilePic)}
                sx={{
                  width: 60,
                  height: 60,
                  border: '2px solid rgba(0,0,0,0.05)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
                }}
              >
                {video.firstname?.charAt(0)}
              </Avatar>
            )}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{
                fontWeight: 600,
                mb: 0.5,
                color: '#111827',
                fontSize: '1.1rem'
              }}>
                {video?.firstname || video?.firstName}
              </Typography>
              <Chip
                label={performance.label}
                size="small"
                sx={{
                  bgcolor: performance.color,
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  height: 24
                }}
              />
            </Box>
          </Stack>
        </Paper>
        <Paper sx={{
          mb: 3,
          p: 3,
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.05)',
          textAlign: 'center'
        }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h3" sx={{
              fontWeight: 700,
              color: helpers.getScoreColor(data.totalScore),
              mb: 1
            }}>
              {data.totalScore}
              <Typography component="span" variant="h5" sx={{ color: 'text.secondary', opacity: 0.6 }}>
                /10
              </Typography>
            </Typography>
            <Typography variant="body1" sx={{
              color: '#6b7280',
              fontWeight: 500
            }}>
              Overall Performance Score
            </Typography>
          </Box>
          <Box sx={{ maxWidth: 300, mx: 'auto' }}>
            <LinearProgress
              variant="determinate"
              value={(data.totalScore / 10) * 100}
              sx={{
                height: 12,
                borderRadius: 6,
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: helpers.getScoreColor(data.totalScore),
                  borderRadius: 3
                }
              }}
            />
          </Box>
        </Paper>
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Assessment sx={{ color: '#6b7280', fontSize: 20 }} />
            <Typography variant="h6" sx={{
              color: '#111827',
              fontWeight: 600,
              fontSize: '1.1rem'
            }}>
              Breakdown
            </Typography>
          </Stack>
          <Grid container spacing={1.5}>
            {scores.map((score, index) => (
              <Grid size={{ xs: 12 }} key={index}>
                <Paper sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid rgba(0,0,0,0.05)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    transform: 'translateY(-1px)'
                  }
                }}>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1.5 }}>
                    <Box sx={{
                      p: 1,
                      borderRadius: 2,
                      bgcolor: `${helpers.getScoreColor(score.value)}15`,
                      color: helpers.getScoreColor(score.value),
                      display: 'flex'
                    }}>
                      {helpers.getScoreIcon(score.label)}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{
                        fontWeight: 600,
                        color: '#111827',
                        mb: 0.5
                      }}>
                        {score.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', opacity: 0.8 }}>
                        {score.description}
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{
                      color: helpers.getScoreColor(score.value),
                      fontWeight: 700
                    }}>
                      {score.value}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={(score.value / 10) * 100}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: helpers.getScoreColor(score.value),
                        borderRadius: 3
                      }
                    }}
                  />
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
        <Paper sx={{
          p: 2.5,
          borderRadius: 2,
          border: '1px solid rgba(0,0,0,0.05)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Psychology sx={{ color: '#6b7280', fontSize: 20 }} />
            <Typography variant="h6" sx={{
              color: '#111827',
              fontWeight: 600,
              fontSize: '1.1rem'
            }}>
              Analysis
            </Typography>
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Chip
              label={hashtags.clarity}
              size="small"
              sx={{
                bgcolor: helpers.getScoreColor(data.clarityScore),
                color: 'white',
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 24
              }}
            />
            <Chip
              label={hashtags.confidence}
              size="small"
              sx={{
                bgcolor: helpers.getScoreColor(data.confidenceScore),
                color: 'white',
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 24
              }}
            />
            <Chip
              label={hashtags.authenticity}
              size="small"
              sx={{
                bgcolor: helpers.getScoreColor(data.authenticityScore),
                color: 'white',
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 24
              }}
            />
            <Chip
              label={hashtags.emotional}
              size="small"
              sx={{
                bgcolor: helpers.getScoreColor(data.emotionalScore),
                color: 'white',
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 24
              }}
            />
          </Box>
          <Typography variant="body2" sx={{
            color: 'text.secondary',
            mb: 1,
            fontWeight: 500,
            fontSize: '0.85rem'
          }}>
            💪 <strong>Strength:</strong> {feedback.strength}
          </Typography>
          <Typography variant="body2" sx={{
            color: 'text.secondary',
            fontWeight: 500,
            fontSize: '0.85rem'
          }}>
            🎯 <strong>Improvement:</strong> {feedback.improvement}
          </Typography>
        </Paper>
      </Box>
    );
  };
  const fetchVideoById = async (decodedVideoId) => {
    if (!decodedVideoId) return null;
    try {
      // API Update: Added 
      const response = await axiosInstance.get(`/videos/video/${decodedVideoId}`);
      // Assuming the response.data contains the single video object
      return response.data;
    } catch (error) {
      console.error("Error fetching specific video by ID:", error);
      return null;
    }
  };
  // NEW EFFECT STARTING HERE
  useEffect(() => {
    if (!decodedVideoId || !userDetails) {
      return;
    }
    const loadSingleVideo = async () => {
      // -------------------------------------------------------
      // 🟢 0. CHECK IF VIDEO EXISTS IN STORED LIST (e.g. Advance Search results)
      // -------------------------------------------------------
      const storedList = getStoredVideosForNavigation();
      const videoSource = location.state?.source || getStoredVideoSource();

      let targetList = [];
      let videoFromList = null;

      // 1. Try finding in stored list first (Priority 1 - preserves search context/enriched data)
      if (storedList && storedList.length > 0) {
        const found = storedList.find(v => v?.id?.toString() === decodedVideoId?.toString());
        if (found) {
          targetList = storedList;
          videoFromList = found;
        }
      }

      // 2. If not in stored list, try global stores (Priority 2)
      if (!videoFromList) {
        if (videos.some(v => v?.id?.toString() === decodedVideoId?.toString())) {
          targetList = videos;
          videoFromList = videos.find(v => v.id.toString() === decodedVideoId.toString());
        } else if (likedVideos.some(v => v?.id?.toString() === decodedVideoId?.toString())) {
          targetList = likedVideos;
          videoFromList = likedVideos.find(v => v.id.toString() === decodedVideoId.toString());
        } else if (commentedVideos.some(v => v?.id?.toString() === decodedVideoId?.toString())) {
          targetList = commentedVideos;
          videoFromList = commentedVideos.find(v => v.id.toString() === decodedVideoId.toString());
        }
      }

      // -------------------------------------------------------
      // 3. Fallback logic
      // -------------------------------------------------------

      // If we found the video in a list, use that list and video
      if (videoFromList) {
        setCurrentVideosList(targetList);
        const foundIndex = targetList.findIndex(v => v.id.toString() === decodedVideoId.toString());
        setCurrentIndex(foundIndex >= 0 ? foundIndex : 0);
        loadVideo(videoFromList);
        setVideoLoading(false);
        return;
      }

      // 🟢 If the video is NOT in any list → fetch by ID (Priority 3)
      setVideoLoading(true);
      const singleVideoData = await fetchVideoById(decodedVideoId);

      if (singleVideoData && singleVideoData.id) {
        setCurrentVideosList([singleVideoData]);
        setCurrentIndex(0);
        loadVideo(singleVideoData);
      } else {
        // Final attempt to load lists if empty (e.g. page refresh on a specific tab)
        try {
          let fetchedList = [];
          switch (videoSource) {
            case 'liked':
              await getLikedVideos();
              fetchedList = useAppStore.getState().likedVideos;
              break;
            case 'commented':
              await getCommentedVideos();
              fetchedList = useAppStore.getState().commentedVideos;
              break;
            case 'videos':
            default:
              await getVideos();
              fetchedList = useAppStore.getState().videos;
              break;
          }

          if (fetchedList && fetchedList.length > 0) {
            const found = fetchedList.find(v => v.id.toString() === decodedVideoId.toString());
            if (found) {
              setCurrentVideosList(fetchedList);
              setCurrentIndex(fetchedList.indexOf(found));
              loadVideo(found);
            } else {
              // Video truly not found
              setVideo(null);
            }
          }
        } catch (e) {
          console.error("Error in final fallback", e);
        }
      }
      setVideoLoading(false);
    };
    loadSingleVideo();
  }, [decodedVideoId, userDetails, location.state?.source, videos, likedVideos, commentedVideos]);
  // NEW EFFECT ENDS HERE
  const convertSrtToVtt = (srtContent) => {
    if (!srtContent) return "";
    let vttContent = "WEBVTT\n\n";
    vttContent += srtContent.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
    return vttContent;
  };
  const fetchSubtitles = async (videoId) => {
    if (!videoId || subtitlesFetched.has(videoId)) return;
    setSubtitlesFetched((prev) => new Set(prev).add(videoId));
    try {
      // API Update: Added 
      const response = await axiosInstance.get(
        `/videos/user/${videoId}/subtitles.srt`,
        {
          responseType: "text",
          timeout: 10000,
        }
      );
      if (response.data && response.data.trim()) {
        const vttContent = convertSrtToVtt(response.data);
        const blob = new Blob([vttContent], { type: "text/vtt" });
        const subtitleUrl = URL.createObjectURL(blob);
        setSubtitles((prev) => ({ ...prev, [videoId]: subtitleUrl }));
      }
    } catch (error) {
      setSubtitlesFetched((prev) => {
        const newSet = new Set(prev);
        newSet.delete(videoId);
        return newSet;
      });
    }
  };
  const cleanupBlobs = () => {
    Object.entries(subtitles).forEach(([videoId, url]) => {
      if (url && url.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(url);
        } catch (error) { /* empty */ }
      }
    });
    setSubtitles({});
    setSubtitlesFetched(new Set());
  };
  const showSnackbar = (message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  };
  const handleBackNavigation = () => {
    if (location.state?.from) {
      navigate(location.state.from);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/app/videos');
    }
  };
  const fetchLikeData = async (videoId) => {
    if (!videoId || !userDetails?.userId) return;
    try {
      // API Update: Added 
      const [likesRes, statusRes] = await Promise.all([
        axiosInstance.get(`/videos/${videoId}/like-count`),
        axiosInstance.get(`/videos/likes/status?userId=${userDetails.userId}`),
      ]);
      setLikeCount(likesRes.data || 0);
      if (statusRes.data && typeof statusRes.data === "object") {
        setIsLiked(statusRes.data[videoId] || false);
      }
    } catch (error) {
      console.error("Error fetching like data:", error);
    }
  };
  const loadVideo = async (videoData) => {
    if (!videoData || !videoData.id) return;
    setVideo(videoData);
    setVideoLoading(false);
    // Set loading to true and ensure the blur is active
    setScoreState({
      loading: true,
      error: null,
      data: null,
      hashtags: null,
      performance: null,
      feedback: null,
      scores: null,
      helpers: null,
    });
    setIsScoreBlurred(true); // Re-apply the blur for the new video
    await fetchLikeData(videoData.id);
    if (!subtitlesFetched.has(videoData.id)) {
      fetchSubtitles(videoData.id);
    }
    try {
      // API Update: Added 
      const scoreRes = await axiosInstance.get(`/totalscore/${videoData.id}`);
      const scoreData = scoreRes.data;
      const getScoreColor = (score) => {
        if (score >= 8) return '#10b981';
        if (score >= 6) return '#f59e0b';
        if (score >= 4) return '#ef4444';
        return '#6b7280';
      };
      const getScoreIcon = (label) => {
        switch (label.toLowerCase()) {
          case 'clarity': return <Visibility fontSize="small" />;
          case 'confidence': return <TrendingUp fontSize="small" />;
          case 'authenticity': return <Star fontSize="small" />;
          case 'emotional': return <Favorite fontSize="small" />;
          default: return <EmojiEvents fontSize="small" />;
        }
      };
      const getHashtagForScore = (score, type) => {
        switch (type) {
          case 'clarity':
            if (score < 4) return '#Unclear';
            if (score >= 4 && score <= 6) return '#Improving';
            if (score > 6 && score <= 8) return '#Clear';
            return '#Articulate';
          case 'confidence':
            if (score < 4) return '#Hesitant';
            if (score >= 4 && score <= 6) return '#Composed';
            if (score > 6 && score <= 8) return '#Poised';
            return '#Assured';
          case 'authenticity':
            if (score < 4) return '#Guarded';
            if (score >= 4 && score <= 6) return '#Honest';
            if (score > 6 && score <= 8) return '#Natural';
            return '#Genuine';
          case 'emotional':
            if (score < 4) return '#Flat';
            if (score >= 4 && score <= 6) return '#Thoughtful';
            if (score > 6 && score <= 8) return '#Empathic';
            return '#Expressive';
          default:
            return '#Unknown';
        }
      };
      const getPerformanceLabel = (totalScore) => {
        if (totalScore >= 9) return { label: 'Outstanding', color: '#059669' };
        if (totalScore >= 7) return { label: 'Excellent', color: '#0891b2' };
        if (totalScore >= 5) return { label: 'Good', color: '#d97706' };
        if (totalScore >= 3) return { label: 'Average', color: '#dc2626' };
        return { label: 'Needs Work', color: '#7c2d12' };
      };
      const getFeedback = (Clarity, Confidence, Authenticity, emotional) => {
        const scores = [
          { key: 'Clarity', value: Number(Clarity) },
          { key: 'Confidence', value: Number(Confidence) },
          { key: 'Authenticity', value: Number(Authenticity) },
          { key: 'Emotional', value: Number(emotional) },
        ];
        scores.sort((a, b) => a.value - b.value);
        const weakest = scores[0]?.key;
        if (!weakest) return { strength: 'Well-rounded performance!', improvement: 'Continue practicing all areas.' };
        const feedbackMessages = {
          Clarity: { strength: 'Shows potential to express ideas.', improvement: 'Needs structured thought and clearer articulation.' },
          Confidence: { strength: 'Shows honesty and openness.', improvement: 'Work on tone, eye contact, and vocal steadiness.' },
          Authenticity: { strength: 'Cautious and controlled.', improvement: 'Loosen up for better emotional engagement.' },
          Emotional: { strength: 'Mindful and considered.', improvement: 'Vary pace and tone to match emotional context.' },
        };
        return feedbackMessages[weakest];
      };
      const computed = {
        hashtags: {
          clarity: getHashtagForScore(scoreData.clarityScore, 'clarity'),
          confidence: getHashtagForScore(scoreData.confidenceScore, 'confidence'),
          authenticity: getHashtagForScore(scoreData.authenticityScore, 'authenticity'),
          emotional: getHashtagForScore(scoreData.emotionalScore, 'emotional')
        },
        performance: getPerformanceLabel(scoreData.totalScore),
        feedback: getFeedback(
          scoreData.clarityScore,
          scoreData.confidenceScore,
          scoreData.authenticityScore,
          scoreData.emotionalScore
        ),
        scores: [
          { label: 'Clarity', value: scoreData.clarityScore, description: 'Communication clarity' },
          { label: 'Confidence', value: scoreData.confidenceScore, description: 'Presentation confidence' },
          { label: 'Authenticity', value: scoreData.authenticityScore, description: 'Genuine expression' },
          { label: 'Emotional', value: scoreData.emotionalScore, description: 'Emotional connection' }
        ],
        helpers: {
          getScoreColor,
          getScoreIcon
        }
      };
      setScoreState({
        loading: false, // <-- Set loading to false once data is received
        error: null,
        data: scoreData,
        ...computed,
      });
    } catch (error) {
      setScoreState({
        loading: false, // <-- Set loading to false on error too
        error: {
          isError: true,
          errorType: error.response?.status === 404 ? 404 : 500,
          message: error.response?.status === 404 ? "Score not available" : "Failed to load score data"
        },
        data: null,
        hashtags: null,
        performance: null,
        feedback: null,
        scores: null,
        helpers: null
      });
    }
  };
  const navigateVideo = useCallback(
    (direction) => {
      if (!currentVideosList || currentVideosList.length === 0) return;
      const newIndex =
        direction === "next"
          ? (currentIndex + 1) % currentVideosList.length
          : (currentIndex - 1 + currentVideosList.length) % currentVideosList.length;
      if (!currentVideosList[newIndex]) return;
      setIsScrolling(true);
      setCurrentIndex(newIndex);
      const nextVideo = currentVideosList[newIndex];
      loadVideo(nextVideo);
      const hashedId = btoa(nextVideo.id.toString());
      navigate(`/app/video/${hashedId}`, { replace: true });
      if (!isMobile && containerRef.current) {
        const scrollDirection = direction === "next" ? 1 : -1;
        containerRef.current.scrollBy({
          left: scrollDirection * containerRef.current.offsetWidth,
          behavior: "smooth",
        });
      }
      setTimeout(() => setIsScrolling(false), 1000);
    },
    [currentVideosList, currentIndex, navigate, isMobile]
  );
  const handleLike = async () => {
    if (!video || !video.id || !userDetails) return;
    try {
      const endpoint = isLiked ? "dislike" : "like";
      // API Update: Added 
      await axiosInstance.post(
        `/videos/${video.id}/${endpoint}?userId=${userDetails.userId}&firstName=${userDetails.firstName}`
      );
      const newLikedStatus = !isLiked;
      setIsLiked(newLikedStatus);
      setLikeCount((prev) =>
        newLikedStatus ? prev + 1 : Math.max(0, prev - 1)
      );
      if (currentVideosList && currentVideosList[currentIndex]) {
        currentVideosList[currentIndex].isLiked = newLikedStatus;
        currentVideosList[currentIndex].liked = newLikedStatus;
        currentVideosList[currentIndex].likeCount = newLikedStatus
          ? (currentVideosList[currentIndex].likeCount || 0) + 1
          : Math.max(0, (currentVideosList[currentIndex].likeCount || 0) - 1);
      }
      showSnackbar(
        newLikedStatus ? "Video liked!" : "Video unliked!",
        "success"
      );
    } catch (error) {
      console.error("Error liking video:", error);
      showSnackbar("Failed to update like status", "error");
    }
  };
  const handleShare = async () => {
    if (!video || !video.thumbnail) {
      showSnackbar('Thumbnail is not available for sharing', 'warning');
      console.warn('Thumbnail is missing for the current video:', video);
      return;
    }
    const thumbnailUrl = video.thumbnail;
    const loggedInUserName = userDetails?.firstName && userDetails?.lastName
      ? `${userDetails.firstName} ${userDetails.lastName}`
      : (userDetails?.firstName || 'User');
    const videoUrl = `${window.location.origin}/app/video/${btoa(video.id.toString())}`;
    try {
      let imageFile;
      try {
        const response = await fetch(thumbnailUrl);
        if (!response.ok) {
          throw new Error('Thumbnail URL is not accessible.');
        }
        const imageBlob = await response.blob();
        const resizedBlob = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              const maxWidth = 500;
              const maxHeight = 500;
              let width = img.width;
              let height = img.height;
              if (width > height) {
                if (width > maxWidth) {
                  height = Math.round(height * (maxWidth / width));
                  width = maxWidth;
                }
              } else {
                if (height > maxHeight) {
                  width = Math.round(width * (maxHeight / height));
                  height = maxHeight;
                }
              }
              canvas.width = width;
              canvas.height = height;
              ctx.drawImage(img, 0, 0, width, height);
              canvas.toBlob(blob => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error("Canvas toBlob failed"));
                }
              }, 'image/jpeg', 0.8);
            };
            img.onerror = reject;
            img.src = event.target.result;
          };
          reader.onerror = reject;
          reader.readAsDataURL(imageBlob);
        });
        if (resizedBlob) {
          imageFile = new File([resizedBlob], 'wezume_thumbnail_resized.jpg', { type: 'image/jpeg' });
        }
      } catch (imageError) {
        console.warn("Could not fetch or resize thumbnail, falling back to URL only.", imageError);
      }
      const shareData = {
        title: 'Wezume - Video Share',
        text: `Check out this video shared by ${loggedInUserName}`,
        url: videoUrl,
      };
      if (imageFile) {
        shareData.files = [imageFile];
      }
      if (navigator.share) {
        try {
          await navigator.share(shareData);
          showSnackbar("Shared successfully!", "success");
          return;
        } catch (shareError) {
          if (shareError.name === 'AbortError') {
            return;
          }
          console.log("Web Share API failed, trying clipboard fallback:", shareError);
        }
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(videoUrl);
        showSnackbar("Video link copied to clipboard!", "success");
        return;
      }
      if (document.execCommand) {
        const textArea = document.createElement('textarea');
        textArea.value = videoUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          document.body.removeChild(textArea);
          showSnackbar("Video link copied to clipboard!", "success");
          return;
        } catch (err) {
          document.body.removeChild(textArea);
        }
      }
      showSnackbar("Please copy the URL manually from your address bar", "info");
    } catch (error) {
      console.error('Error sharing video:', error);
      if (error.name === 'NotAllowedError') {
        showSnackbar("Sharing requires user interaction", "warning");
        return;
      }
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(videoUrl);
          showSnackbar("Video link copied to clipboard!", "success");
        } else {
          showSnackbar("Unable to share or copy link", "error");
        }
      } catch (fallbackError) {
        showSnackbar("Unable to share or copy link", "error");
      }
    }
  };
  const handleCall = async (event) => {
    const phoneNumber = video?.phonenumber || video?.phoneNumber || video?.userPhoneNumber;
    if (!phoneNumber) {
      console.warn("Phone number not found for video:", video);
      showSnackbar("Phone number not available", "warning");
      return;
    }
    setPhoneAnchorEl(event.currentTarget);
    setPhonePopoverOpen(true);
    // Use a delay to ensure the popover appears before the snackbar
    setTimeout(async () => {
      try {
        // Attempt to use the modern Clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(phoneNumber);
          showSnackbar("Phone number copied to clipboard!", "success");
          return; // Exit if successful
        }
        // Fallback for older browsers or insecure contexts
        const textArea = document.createElement('textarea');
        textArea.value = phoneNumber;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px'; // Hide off-screen
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          document.body.removeChild(textArea);
          showSnackbar("Phone number copied to clipboard!", "success");
        } catch (err) {
          document.body.removeChild(textArea);
          throw new Error("Copy command failed");
        }
      } catch (error) {
        console.error("Could not copy to clipboard:", error);
        showSnackbar("Failed to copy phone number to clipboard", "error");
      }
    }, 100);
  };
  const handlePhonePopoverClose = () => {
    setPhonePopoverOpen(false);
    setPhoneAnchorEl(null);
  };
  const handleEmail = () => {
    const userEmail = video?.email || video?.userEmail;
    if (!userEmail) {
      console.warn("Email not found for video:", video);
      showSnackbar("Email not available for this user", "warning");
      return;
    }
    window.open(`mailto:${userEmail}`);
  };
  const handleLinkedIn = () => {
    if (!video || !video.linkedinprofile) return;
    window.open(video?.linkedinprofile, '_blank');
  };
  const handleVideoContainerClick = (e) => {
    const target = e.target;
    const isButton =
      target.tagName === "BUTTON" ||
      target.closest("button") ||
      target.closest('[role="button"]');
    const isVideoControl =
      target.closest("video") || target.tagName === "VIDEO";
    if (isButton || isVideoControl) {
      e.stopPropagation();
      return;
    }
    e.stopPropagation();
  };
  const enableSubtitles = (videoElement) => {
    if (
      videoElement &&
      videoElement.textTracks &&
      videoElement.textTracks.length > 0
    ) {
      setTimeout(() => {
        Array.from(videoElement.textTracks).forEach((track) => {
          if (track.kind === "subtitles" || track.kind === "captions") {
            track.mode = "showing";
          }
        });
      }, 500);
    }
  };
  const handleVideoLoad = (videoElement, videoId) => {
    setVideoLoading(false);
    const checkAndEnableSubtitles = () => {
      if (subtitles[videoId]) {
        enableSubtitles(videoElement);
      } else {
        setTimeout(checkAndEnableSubtitles, 200);
      }
    };
    setTimeout(checkAndEnableSubtitles, 100);
  };
  useEffect(() => {
    if (!isMobile || !mobileContainerRef.current) return;
    let touchStartY = null;
    let touchStartX = null;
    let touchStartTime = null;
    const minSwipeDistance = 80;
    const maxSwipeTime = 800;
    const handleTouchStart = (e) => {
      if (e.touches[0].clientY < 100) {
        e.preventDefault();
      }
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
      touchStartTime = Date.now();
    };
    const handleTouchMove = (e) => {
      if (touchStartY && e.touches[0].clientY < touchStartY) {
        e.preventDefault();
      }
    };
    const handleTouchEnd = (e) => {
      if (!touchStartY || !touchStartX || !touchStartTime) return;
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndTime = Date.now();
      const deltaY = touchStartY - touchEndY;
      const deltaX = Math.abs(touchStartX - touchEndX);
      const duration = touchEndTime - touchStartTime;
      touchStartY = null;
      touchStartX = null;
      touchStartTime = null;
      if (duration > maxSwipeTime) return;
      if (Math.abs(deltaY) < minSwipeDistance) return;
      if (deltaX > Math.abs(deltaY)) return;
      e.preventDefault();
      e.stopPropagation();
      if (deltaY > 0) {
        navigateVideo("next");
      } else {
        navigateVideo("prev");
      }
    };

    const container = mobileContainerRef.current;
    container.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      if (container) {
        container.removeEventListener("touchstart", handleTouchStart);
        container.removeEventListener("touchmove", handleTouchMove);
        container.removeEventListener("touchend", handleTouchEnd);
      }
    };
  }, [isMobile, navigateVideo]);

  useEffect(() => {
    if (userDetails) {
      const fetchVideos = async () => {
        try {
          await getVideos();
        } catch (error) { /* empty */ }
      };
      fetchVideos();
    }
  }, [userDetails]);

  useEffect(() => {
    if (currentVideosList && currentVideosList.length > 0) {
      currentVideosList.forEach((video) => {
        if (video && video.id) {
          fetchSubtitles(video.id);
        }
      });
    }
  }, [currentVideosList]);

  useEffect(() => {
    const handleWheel = (e) => {
      if (isMobile) return;

      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 50) {
        e.preventDefault();
        if (e.deltaX > 0) {
          navigateVideo("next");
        } else {
          navigateVideo("prev");
        }
      }
    };

    if (containerRef.current && !isMobile) {
      containerRef.current.addEventListener("wheel", handleWheel, {
        passive: false,
      });

      return () => {
        if (containerRef.current) {
          containerRef.current.removeEventListener("wheel", handleWheel);
        }
      };
    }
  }, [currentVideosList, currentIndex, isMobile, navigateVideo]);

  useEffect(() => {
    return () => {
      cleanupBlobs();
    };
  }, []);

  if (isLoadingVideos && !video) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!video || !currentVideosList || currentVideosList.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          gap: 2,
        }}
      >
        <Typography variant="h6" color="text.secondary">
          No videos available
        </Typography>
        <Button variant="outlined" onClick={handleBackNavigation}>
          Go back
        </Button>
      </Box>
    );
  }

  if (isMobile) {
    return (
      <>
        {createPortal(
          <>
            <IconButton
              sx={{
                position: "absolute",
                top: 20,
                left: 20,
                color: "white",
                zIndex: 1400,
                bgcolor: "rgba(0,0,0,0.5)",
                "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
              }}
              onClick={handleBackNavigation}
            >
              <ArrowBack />
            </IconButton>
            <Box
              ref={mobileContainerRef}
              sx={{
                height: "100%",
                width: "100%",
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: "black",
                zIndex: 1300,
                overflow: "hidden",
                touchAction: "pan-y",
                WebkitOverflowScrolling: "touch",
              }}
            >
              <style>
                {`
                  html, body {
                    overscroll-behavior: none !important;
                    overscroll-behavior-y: none !important;
                    overscroll-behavior-x: none !important;
                  }
                  body {
                    position: fixed;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                  }
                  video::cue {
                    font-size: 14px !important;
                    line-height: 1.2 !important;
                    background-color: rgba(0, 0, 0, 0.6) !important;
                    color: white !important;
                  }
                `}
              </style>
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {videoLoading && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      zIndex: 2,
                    }}
                  >
                    <CircularProgress sx={{ color: "white" }} />
                  </Box>
                )}
                <video
                  ref={videoRef}
                  src={video.videoUrl}
                  controls
                  autoPlay={false}
                  muted={false}
                  playsInline
                  onLoadedMetadata={(e) => handleVideoLoad(e.target, video.id)}
                  onCanPlay={(e) => handleVideoLoad(e.target, video.id)}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  crossOrigin="anonymous"
                >
                  {subtitles[video.id] && (
                    <track
                      key={`subtitle-${video.id}`}
                      kind="subtitles"
                      src={subtitles[video.id]}
                      srcLang="en"
                      label="English"
                      default
                    />
                  )}
                </video>
                {video.description && (
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 80,
                      left: 20,
                      right: 100,
                      zIndex: 10,
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                      p: 2,
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: "white",
                        fontSize: "0.875rem",
                        lineHeight: 1.4,
                        textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                      }}
                    >
                      {video.description}
                    </Typography>
                  </Box>
                )}
              </Box>
              <Box
                sx={{
                  position: "absolute",
                  right: 20,
                  top: "50%",
                  transform: "translateY(-50%)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  zIndex: 10,
                }}
              >
                <Box sx={{ textAlign: "center" }}>
                  <Fab
                    size="small"
                    onClick={handleLike}
                    sx={{
                      bgcolor: isLiked ? "#e91e63" : "rgba(255,255,255,0.9)",
                      color: isLiked ? "white" : "#e91e63",
                      "&:hover": {
                        bgcolor: isLiked ? "#c2185b" : "rgba(255,255,255,1)",
                      },
                    }}
                  >
                    {isLiked ? <Favorite /> : <FavoriteBorder />}
                  </Fab>
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      color: "white",
                      mt: 0.5,
                      fontSize: "10px",
                      fontWeight: "bold",
                    }}
                  >
                    {likeCount}
                  </Typography>
                </Box>
                <Fab
                  size="small"
                  onClick={handleShare}
                  sx={{ bgcolor: "rgba(255,255,255,0.9)", color: "#1976d2" }}
                >
                  <Share />
                </Fab>
                <Fab
                  size="small"
                  onClick={handleCall}
                  sx={{ bgcolor: "rgba(255,255,255,0.9)", color: "#4caf50" }}
                >
                  <Phone />
                </Fab>
                <Fab
                  size="small"
                  // onClick={handleLinkedIn}
                  sx={{ bgcolor: "rgba(255,255,255,0.9)", color: "#0A66C2" }}
                >
                  <LinkedInIcon />
                </Fab>
                <Fab
                  size="small"
                  onClick={handleEmail}
                  sx={{ bgcolor: "rgba(255,255,255,0.9)", color: "#ff9800" }}
                >
                  <Email />
                </Fab>
                <Fab
                  size="small"
                  onClick={() => setScoreModalOpen(true)}
                  sx={{ bgcolor: "rgba(255,255,255,0.9)", color: "#1976d2" }}
                >
                  <Assessment />
                </Fab>
                <Fab
                  size="small"
                  onClick={() => setCommentsModalOpen(true)}
                  sx={{ bgcolor: "rgba(255,255,255,0.9)", color: "#607d8b" }}
                >
                  <Comment />
                </Fab>
              </Box>
            </Box>
            <Popover
              open={phonePopoverOpen}
              anchorEl={phoneAnchorEl}
              onClose={handlePhonePopoverClose}
              anchorOrigin={{
                vertical: 'center',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'center',
                horizontal: 'right',
              }}
              PaperProps={{
                sx: {
                  bgcolor: 'rgba(0,0,0,0.9)',
                  color: 'white',
                  p: 2,
                  borderRadius: 2,
                  maxWidth: 200,
                },
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  📞 {video?.phonenumber || video?.phoneNumber || "Phone number not available"}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Copied to clipboard!
                </Typography>
              </Box>
            </Popover>
          </>,
          document.body
        )}
        <Modal
          open={scoreModalOpen}
          onClose={() => setScoreModalOpen(false)}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Paper
            sx={{
              width: "90vw",
              height: "80vh",
              overflow: "auto",
              position: "relative",
              borderRadius: 2,
            }}
          >
            <Backdrop
              sx={{
                color: '#fff',
                zIndex: 10,
                backdropFilter: isScoreBlurred ? 'blur(8px)' : 'none',
                WebkitBackdropFilter: isScoreBlurred ? 'blur(8px)' : 'none',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                position: 'absolute',
                borderRadius: 2,
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                transition: 'backdrop-filter 0.5s ease-in-out, -webkit-backdrop-filter 0.5s ease-in-out',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              open={isScoreBlurred}
            >
              {scoreState.loading && (
                <CircularProgress color="inherit" />
              )}

              {!scoreState.loading && scoreState.data && isScoreBlurred && (
                <Button
                  variant="contained"
                  sx={{
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    py: 1.5,
                    px: 4,
                    borderRadius: 3,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    bgcolor: '#1976d2',
                    '&:hover': {
                      bgcolor: '#1565c0',
                    },
                  }}
                  onClick={() => setIsScoreBlurred(false)} // Hides the blur on click
                >
                  View Score
                </Button>
              )}

              {!scoreState.loading && scoreState.error && (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Error sx={{ color: 'white', fontSize: 48, mb: 1 }} />
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                    {scoreState.error.message}
                  </Typography>
                </Box>
              )}
            </Backdrop>
            <IconButton
              onClick={() => setScoreModalOpen(false)}
              sx={{ position: "absolute", top: 8, right: 8, zIndex: 1200 }}
            >
              <ArrowBack />
            </IconButton>
            {renderScoreEvaluation()}
          </Paper>
        </Modal>
        <Modal
          open={commentsModalOpen}
          onClose={() => setCommentsModalOpen(false)}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Paper
            sx={{
              width: "90vw",
              height: "80vh",
              p: 2,
              overflow: "auto",
              position: "relative",
              borderRadius: 2,
            }}
          >
            <IconButton
              onClick={() => setCommentsModalOpen(false)}
              sx={{ position: "absolute", top: 8, right: 8 }}
            >
              <ArrowBack />
            </IconButton>
            <CommentsSection videoId={video.id} />
          </Paper>
        </Modal>
      </>
    );
  }

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          bgcolor: "#f5f5f5",
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBackNavigation}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1,
            bgcolor: "white",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            "&:hover": {
              bgcolor: "#f5f5f5",
              boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
            },
          }}
        >
          Back to Videos
        </Button>
      </Box>

      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          display: "flex",
          gap: 2,
          p: 2,
          overflowX: "hidden",
          position: "relative",
          bgcolor: "#fafafa",
        }}
      >
        <Box
          ref={videoContainerRef}
          sx={{
            flex: 1,
            position: "relative",
            bgcolor: "black",
            borderRadius: 2,
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
          onClick={handleVideoContainerClick}
        >
          {videoLoading && (
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 2,
              }}
            >
              <CircularProgress sx={{ color: "white" }} />
            </Box>
          )}
          <video
            ref={videoRef}
            src={video.videoUrl}
            controls
            autoPlay
            playsInline
            onLoadedMetadata={(e) => handleVideoLoad(e.target, video.id)}
            onCanPlay={(e) => handleVideoLoad(e.target, video.id)}
            style={{ width: "100%", height: "100%", pointerEvents: "auto" }}
            crossOrigin="anonymous"
          >
            {subtitles[video.id] && (
              <track
                key={`subtitle-${video.id}`}
                kind="subtitles"
                src={subtitles[video.id]}
                srcLang="en"
                label="English"
                default
              />
            )}
          </video>
          <style>
            {`
              video::cue {
                font-size: 16px !important;
                line-height: 1.3 !important;
                background-color: rgba(0, 0, 0, 0.7) !important;
                color: white !important;
              }
            `}
          </style>
          <Box
            sx={{
              position: "absolute",
              right: 20,
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <IconButton
                onClick={handleLike}
                sx={{
                  bgcolor: "rgba(255,255,255,0.9)",
                  color: isLiked ? "#e91e63" : "#666",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  "&:hover": {
                    bgcolor: "white",
                    transform: "scale(1.1)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                {isLiked ? <Favorite /> : <FavoriteBorder />}
              </IconButton>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  color: "white",
                  mt: 1,
                  fontWeight: 800,
                  textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                  fontSize: 16,
                  mb: -2
                }}
              >
                {likeCount}
              </Typography>
            </Box>
            <IconButton
              onClick={handleShare}
              sx={{
                bgcolor: "rgba(255,255,255,0.9)",
                color: "#1976d2",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                "&:hover": {
                  bgcolor: "white",
                  transform: "scale(1.1)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                },
                transition: "all 0.2s ease",
              }}
            >
              <Share />
            </IconButton>
            <IconButton
              // onClick={handleLinkedIn}
              sx={{
                bgcolor: "rgba(255,255,255,0.9)",
                color: "#0A66C2",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                "&:hover": {
                  bgcolor: "white",
                  transform: "scale(1.1)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                },
                transition: "all 0.2s ease",
              }}
            >
              <LinkedInIcon />
            </IconButton>
            <IconButton
              onClick={handleCall}
              sx={{
                bgcolor: "rgba(255,255,255,0.9)",
                color: "#4caf50",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                "&:hover": {
                  bgcolor: "white",
                  transform: "scale(1.1)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                },
                transition: "all 0.2s ease",
              }}
            >
              <Phone />
            </IconButton>
            <IconButton
              onClick={handleEmail}
              sx={{
                bgcolor: "rgba(255,255,255,0.9)",
                color: "#ff9800",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                "&:hover": {
                  bgcolor: "white",
                  transform: "scale(1.1)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                },
                transition: "all 0.2s ease",
              }}
            >
              <Email />
            </IconButton>
          </Box>
        </Box>

        {/* This is the Box for the Score Evaluation component */}
        <Box
          sx={{
            flex: 1,
            bgcolor: "white",
            borderRadius: 2,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* This is the Backdrop that creates the blur effect */}
          <Backdrop
            sx={{
              color: '#fff',
              zIndex: 1,
              backdropFilter: isScoreBlurred ? 'blur(8px)' : 'none',
              WebkitBackdropFilter: isScoreBlurred ? 'blur(8px)' : 'none',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              position: 'absolute',
              borderRadius: 2,
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              transition: 'backdrop-filter 0.5s ease-in-out, -webkit-backdrop-filter 0.5s ease-in-out',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            open={scoreState.loading || isScoreBlurred}
          >
            {scoreState.loading && (
              <CircularProgress color="inherit" />
            )}

            {!scoreState.loading && scoreState.data && isScoreBlurred && (
              <Button
                variant="contained"
                sx={{
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  py: 1.5,
                  px: 4,
                  borderRadius: 3,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  bgcolor: '#1976d2',
                  '&:hover': {
                    bgcolor: '#1565c0',
                  },
                }}
                onClick={() => setIsScoreBlurred(false)} // Hides the blur on click
              >
                View Score
              </Button>
            )}

            {!scoreState.loading && scoreState.error && (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Error sx={{ color: 'white', fontSize: 48, mb: 1 }} />
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                  {scoreState.error.message}
                </Typography>
              </Box>
            )}

          </Backdrop>

          {renderScoreEvaluation()}
        </Box>

        <Box sx={{ flex: 1, bgcolor: "white", borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <CommentsSection videoId={video.id} />
        </Box>
      </Box>

      <IconButton
        sx={{
          position: "absolute",
          left: 70,
          top: "50%",
          bgcolor: "rgba(0,0,0,0.7)",
          color: "white",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          "&:hover": {
            bgcolor: "rgba(0,0,0,0.9)",
            transform: "scale(1.1)",
            boxShadow: "0 6px 16px rgba(0,0,0,0.4)",
          },
          transition: "all 0.2s ease",
          zIndex: 10,
        }}
        onClick={(e) => {
          e.stopPropagation();
          navigateVideo("prev");
        }}
      >
        <NavigateBefore sx={{ fontSize: 32 }} />
      </IconButton>
      <IconButton
        sx={{
          position: "absolute",
          right: 20,
          top: "50%",
          bgcolor: "rgba(0,0,0,0.7)",
          color: "white",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          "&:hover": {
            bgcolor: "rgba(0,0,0,0.9)",
            transform: "scale(1.1)",
            boxShadow: "0 6px 16px rgba(0,0,0,0.4)",
          },
          transition: "all 0.2s ease",
          zIndex: 10,
        }}
        onClick={(e) => {
          e.stopPropagation();
          navigateVideo("next");
        }}
      >
        <NavigateNext sx={{ fontSize: 32 }} />
      </IconButton>
      <Popover
        open={phonePopoverOpen}
        anchorEl={phoneAnchorEl}
        onClose={handlePhonePopoverClose}
        anchorOrigin={{
          vertical: 'center',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            bgcolor: 'rgba(0,0,0,0.9)',
            color: 'white',
            p: 2,
            borderRadius: 2,
            maxWidth: 200,
          },
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            📞 {video?.phonenumber || video?.phoneNumber || "Phone number not available"}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Copied to clipboard!
          </Typography>
        </Box>
      </Popover>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}