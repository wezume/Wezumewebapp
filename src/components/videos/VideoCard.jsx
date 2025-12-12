/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import {
  Card,
  CardMedia,
  Box,
  IconButton,
  Slide,
  Typography,
  Avatar,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Favorite,
  FavoriteBorder,
  Assessment,
  PlayArrow,
  Person,
} from "@mui/icons-material";
import { useNavigate } from "react-router";
import axiosInstance from "../../axios/axios";
import { useAppStore } from "../../store/appStore";
import CountUp from "react-countup";

export default function VideoCard({ video, onClick, isSearchResult }) {
  const [hovered, setHovered] = useState(false);
  const [likes, setLikes] = useState(0);
  const [totalScore, setTotalScore] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesLoaded, setLikesLoaded] = useState(false);
  const [scoreLoaded, setScoreLoaded] = useState(false);

  const { userDetails } = useAppStore();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const hashVideoId = (id) => btoa(id.toString());

  useEffect(() => {
    const fetchUserLikedVideos = async () => {
      try {
        const response = await axiosInstance.get(
          `/videos/likes/status?userId=${userDetails.userId}`
        );
        const likedVideosMap = {};
        Object.entries(response.data).forEach(([videoId, liked]) => {
          likedVideosMap[videoId] = liked;
        });
        setIsLiked(likedVideosMap[video.id] || false);
      } catch (error) {}
    };

    if (userDetails?.userId) {
      fetchUserLikedVideos();
    }
  }, [userDetails.userId, video.id]);

  const fetchLikes = async () => {
    if (!likesLoaded) {
      try {
        const likesRes = await axiosInstance.get(`/videos/${video.id}/like-count`);
        setLikes(likesRes.data);
        setLikesLoaded(true);
      } catch (error) {}
    }
  };

  const fetchScore = async () => {
    if (!scoreLoaded) {
      try {
        const scoreRes = await axiosInstance.get(`/totalscore/${video.id}`);
        setTotalScore(scoreRes.data);
        setScoreLoaded(true);
      } catch (error) {
        setScoreLoaded(true);
      }
    }
  };

  const handleInteraction = async () => {
    if (!isMobile) setHovered(true);
    fetchLikes();
    fetchScore();
  };

  const handleMouseEnter = () => !isMobile && handleInteraction();
  const handleMouseLeave = () => !isMobile && setHovered(false);

  const handleLike = async (e) => {
    e.stopPropagation();
    try {
      const endpoint = isLiked ? "dislike" : "like";
      await axiosInstance.post(
        `/videos/${video.id}/${endpoint}?userId=${userDetails.userId}&firstName=${userDetails.firstName}`
      );

      const newLikedState = !isLiked;
      setIsLiked(newLikedState);
      setLikes((prev) => (isLiked ? prev - 1 : prev + 1));
    } catch (error) {
      console.error("Error liking video:", error);
    }
  };

  const handleClick = () => {
    if (onClick) onClick();
    else navigate(`/app/video/${hashVideoId(video.id)}`);
  };

  const showSlide = isMobile ? false : hovered;

  return (
    <Card
      sx={{
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        aspectRatio: "1 / 1",
        borderRadius: { xs: 2, sm: 3, md: 4 },
        transition: "all 0.3s ease-in-out",
        "&:hover": {
          boxShadow: (theme) => (isMobile ? "none" : theme.shadows[10]),
          transform: isMobile ? "none" : "translateY(-2px)",
        },
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <CardMedia
        component="img"
        image={video?.thumbnail}
        alt="Video thumbnail"
        sx={{ objectFit: "cover", width: "100%", height: "100%" }}
      />

      {/* ⭐ CONFIDENCE BADGE — SHOWS ONLY IF SEARCH RESULTS + confidence returned */}
      {isSearchResult && video?.confidence !== undefined && (
        <Box
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            backgroundColor: "rgba(0,0,0,0.75)",
            padding: "4px 10px",
            borderRadius: "14px",
            zIndex: 20,
            color: "white",
            fontSize: { xs: "0.7rem", md: "0.85rem" },
            fontWeight: 700,
            backdropFilter: "blur(6px)",
          }}
        >
          {Number(video.confidence).toFixed(1)}%
        </Box>
      )}

      {/* Play Icon */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          opacity: showSlide ? 0.6 : 1,
          transition: "opacity 0.3s ease-in-out",
          zIndex: 1,
        }}
      >
        <PlayArrow
          sx={{
            fontSize: { xs: 32, sm: 40, md: 50 },
            color: "white",
          }}
        />
      </Box>

      {/* SLIDE-UP SECTION */}
      <Slide direction="up" in={showSlide} mountOnEnter unmountOnExit>
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            color: "white",
            background:
              "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 70%, transparent 100%)",
            p: { xs: 1, sm: 1.5, md: 2 },
            zIndex: 2,
          }}
        >
          {/* PROFILE AREA */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Avatar
                src={video?.profilepic || video?.profilePic}
                alt={video?.firstname}
                sx={{ width: 28, height: 28 }}
              >
                {!video?.profilepic && <Person />}
              </Avatar>
              <Typography variant="subtitle2" fontWeight="bold" noWrap>
                {video?.firstname}
              </Typography>
            </Box>

            <Box
              component="img"
              src="/logo-favicon.png"
              sx={{ width: 20, height: 20 }}
            />
          </Box>

          {/* LIKES + SCORE */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {/* Likes */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <IconButton
                onClick={handleLike}
                size="small"
                sx={{
                  color: isLiked ? "error.main" : "white",
                }}
              >
                {isLiked ? <Favorite /> : <FavoriteBorder />}
              </IconButton>

              <Typography variant="body2">
                {likesLoaded ? <CountUp end={likes} duration={1} /> : "..."}
              </Typography>
            </Box>

            {/* ⭐ SCORE ICON (NOT CONFIDENCE — your existing total score) */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Assessment sx={{ fontSize: 20 }} />
              <Typography variant="body2">
                {scoreLoaded
                  ? (totalScore?.totalScore?.toFixed(1) || "N/A")
                  : "..."}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Slide>
    </Card>
  );
}
