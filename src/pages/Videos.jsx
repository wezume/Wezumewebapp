/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Grid,
  Button,
  Paper,
  Typography,
  Snackbar,
  Alert,
} from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import VideoCard from '../components/videos/VideoCard';
import VideoSkeleton from '../components/videos/VideoSkeleton';

export default function Videos() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobid = searchParams.get('jobid') || '';
  const scrollContainerRef = useRef(null);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const {
    videos,
    userDetails,
    isLoadingVideos,
    isLoadingMoreVideos,
    hasMoreVideos,
    videoError,
    getVideos,
    refreshVideos,
    loadMoreVideos,
  } = useAppStore();

  const displayVideos = videos;

  const isLoading = isLoadingVideos;
  const isLoadingMore = isLoadingMoreVideos;
  const hasMore = hasMoreVideos;
  const error = videoError;

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
      },
    });
  };

  // --- scroll/infinite ---
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;

    if ((scrollTop + clientHeight) / scrollHeight > 0.8) {
      if (hasMore && !isLoadingMore) {
        loadMoreVideos();
      }
    }
  }, [hasMore, isLoadingMore]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  useEffect(() => {
    if (userDetails) getVideos();
  }, [userDetails, jobid]);

  const handleRefresh = async () => {
    await refreshVideos();
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
          <Button startIcon={<Refresh />} variant="outlined" size="small" onClick={handleRefresh}>
            Refresh
          </Button>
        </Box>
      </Box>

      {/* ERRORS */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* VIDEO GRID */}
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
                isSearchResult={false}
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
