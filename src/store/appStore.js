import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Cookies from 'js-cookie';
import axiosInstance from '../axios/axios';

export const useAppStore = create(
  persist(
    (set, get) => ({
      token: null,
      isLoading: false,
      error: null,
      isInitialized: false, 
      userDetails: null,
      isLoadingUserDetails: false,
      isUpdatingUserDetails: false,
      
      videos: [],
      isLoadingVideos: false,
      videoError: null,
      lastVideoEndpoint: null,
      currentPage: 0,
      hasMoreVideos: true,
      isLoadingMoreVideos: false,
      
      filteredVideos: [],
      isLoadingFilteredVideos: false,
      filteredVideoError: null,
      lastFilteredEndpoint: null,
      filteredCurrentPage: 0,
      hasMoreFilteredVideos: true,
      isLoadingMoreFilteredVideos: false,
      
      allVideos: [],
      isLoadingAllVideos: false,
      allVideosError: null,
      
      likedVideos: [],
      isLoadingLikedVideos: false,
      likedVideoError: null,
      
      comments: [],
      isLoadingComments: false,
      commentError: null,
      
      commentedVideos: [],
      isLoadingCommentedVideos: false,
      commentedVideoError: null,
      
      jobVideosCounts: { totalUsers: 0, totalVideos: 0 },
      isLoadingJobVideosCounts: false,

      filterVideos: (videoArray) => {
        return videoArray
          .filter(video => {
            return video && 
                   video.thumbnail && 
                   video.thumbnail.trim() !== '' &&
                   video.thumbnail !== null &&
                   video.thumbnail !== undefined;
          })
          .filter((video, index, self) => {
            const uniqueId = video.id || video.videoId || video.videoID;
            if (!uniqueId) return true;
            
            return index === self.findIndex(v => {
              const compareId = v.id || v.videoId || v.videoID;
              return compareId === uniqueId;
            });
          });
      },
      
      login: async (credentials) => {
        set({ isLoading: true, error: null })
        try {
          const response = await axiosInstance.post('/login', credentials)
          
          const { token, jobOption } = response.data
          
          const allowedJobOptions = ['Employer', 'Investor', 'placementDrive', 'Academy']
          console.log("JOB OPTION FROM BACKEND:", jobOption);

          if (!allowedJobOptions.includes(jobOption)) {
            set({ 
              isLoading: false,
              error: 'Access denied. This application is only available for Employers, Investors, Placement Drives, and Academy users.'
            })
            
            setTimeout(() => {
              window.location.href = '/'
            }, 3000)
            
            return { 
              success: false, 
              error: 'Access denied. This application is only available for Employers, Investors, Placement Drives, and Academy users.',
              redirect: true
            }
          }
          
          Cookies.set('wezume_auth_token', token, {
            expires: 0.5, 
            sameSite: 'strict'
          })
          
          set({ 
            token, 
            isLoading: false, 
            error: null 
          })
          
          return { success: true }
        } catch (error) {
          const errorMessage = error.response?.data.message || 'Login failed'
          console.log(error)
          set({ 
            isLoading: false, 
            error: errorMessage 
          })
          throw new Error(errorMessage)
        }
      },
      
      logout: () => {
        Cookies.remove('wezume_auth_token')
        set({ 
          token: null, 
          error: null, 
          userDetails: null,
          videos: [], 
          videoError: null,
          lastVideoEndpoint: null,
          currentPage: 0,
          hasMoreVideos: true,
          isLoadingMoreVideos: false,
          filteredVideos: [],
          filteredVideoError: null,
          lastFilteredEndpoint: null,
          filteredCurrentPage: 0,
          hasMoreFilteredVideos: true,
          isLoadingMoreFilteredVideos: false,
          allVideos: [],
          allVideosError: null,
          likedVideos: [],
          likedVideoError: null,
          comments: [],
          commentError: null,
          commentedVideos: [],
          commentedVideoError: null,
          jobVideosCounts: { totalUsers: 0, totalVideos: 0 },
          isLoadingJobVideosCounts: false
        })
        window.location.href = '/login'
      },
      
      initialize: () => {
        const token = Cookies.get('wezume_auth_token')
        set({ 
          token: token || null, 
          isInitialized: true 
        })
      },
      
      clearError: () => set({ error: null }),
      
      isAuthenticated: () => {
        const { token } = get()
        return !!token || !!Cookies.get('wezume_auth_token')
      },
      
      getToken: () => {
        const { token } = get()
        return token || Cookies.get('wezume_auth_token')
      },
      
      getUserDetails: async () => {
        const { isAuthenticated, userDetails, isLoadingUserDetails } = get()
        
        if (!isAuthenticated()) {
          console.error('User not authenticated')
          return null
        }
        if (isLoadingUserDetails) {
          return userDetails
        }
        if (userDetails) {
          return userDetails
        }
        set({ isLoadingUserDetails: true, error: null })
        
        try {
          const response = await axiosInstance.get('/user-detail')
          const userData = response.data
          
          const allowedJobOptions = ['Employer', 'Investor', 'placementDrive', 'Academy']
          
          if (!allowedJobOptions.includes(userData.jobOption)) {
            set({ 
              isLoadingUserDetails: false,
              error: 'Access denied. This application is only available for Employers, Investors, Placement Drives, and Academy users.'
            })
            
            setTimeout(() => {
              get().logout()
            }, 2000)
            
            throw new Error('Access denied')
          }
          
          set({ 
            userDetails: userData, 
            isLoadingUserDetails: false 
          })
          
          return userData
        } catch (error) {
          
          set({ 
            isLoadingUserDetails: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch user details'
          })
          throw error
        }
      },
      
      updateUserDetails: async (updatedData, isFormData = false) => {
          const { isAuthenticated, userDetails, getToken } = get();
          
          if (!isAuthenticated()) {
              throw new Error('User not authenticated');
          }
          
          if (!userDetails?.userId) {
              throw new Error('User ID not available');
          }
          
          set({ isUpdatingUserDetails: true, error: null });
          
          try {
              const token = getToken();
              const config = {
                  headers: {
                      'Authorization': `Bearer ${token}`
                  }
              };
              
              if (!isFormData) {
                  config.headers['Content-Type'] = 'application/json';
              }
              
              const response = await axiosInstance.put(
                  `/users/update/${userDetails.userId}`,
                  updatedData,
                  config
              );
              
              const responseData = response.data;
              const updatedUserDetails = { 
                  ...userDetails, 
                  ...(typeof responseData === 'object' ? responseData : {})
              };
              
              set({
                  userDetails: updatedUserDetails,
                  isUpdatingUserDetails: false
              });
              
              return updatedUserDetails;
          } catch (error) {
              const errorMessage = error.response?.data?.message || error.response?.data || 'Failed to update user details';
              set({
                  isUpdatingUserDetails: false,
                  error: errorMessage
              });
              throw new Error(errorMessage);
          }
      },
      
      clearUserDetails: () => set({ userDetails: null }),

      getAllVideos: async (forceRefresh = false) => {
        const { userDetails, allVideos, isLoadingAllVideos, filterVideos } = get()
        
        if (!userDetails) {
          return []
        }

        if (!forceRefresh && allVideos.length > 0) {
          return allVideos
        }
        
        if (isLoadingAllVideos) {
          return allVideos
        }
        
        set({ isLoadingAllVideos: true, allVideosError: null })
        
        try {
          const isPlacementOrAcademy = userDetails.jobOption === 'placementDrive' || userDetails.jobOption === 'Academy'
          let allVideosData = []
          
          if (isPlacementOrAcademy && userDetails.jobid) {
            let page = 0
            let hasMore = true
            
            while (hasMore) {
              const response = await axiosInstance.get(`/videos/job/${userDetails.jobid}`, {
                params: { page, size: 100 }
              })
              
              const responseData = response.data || {}
              const pageVideos = responseData.videos || []
              const totalPages = responseData.totalPages || 1
              
              allVideosData = [...allVideosData, ...pageVideos]
              
              hasMore = page < (totalPages - 1)
              page++
            }
          } else {
            let page = 0
            let hasMore = true
            
            while (hasMore) {
              const response = await axiosInstance.get('/videos/videos', {
                params: { page, size: 100 }
              })
              
              const responseData = response.data || {}
              const pageVideos = responseData.videos || []
              const totalPages = responseData.totalPages || 1
              
              allVideosData = [...allVideosData, ...pageVideos]
              
              hasMore = page < (totalPages - 1)
              page++
            }
          }
          
          const filteredAllVideos = filterVideos(allVideosData)
          
          set({ 
            allVideos: filteredAllVideos,
            isLoadingAllVideos: false,
            allVideosError: null
          })
          
          return filteredAllVideos
        } catch (error) {
          console.error('Error fetching all videos:', error)
          const errorMessage = error.response?.data?.message || 'Failed to fetch all videos'
          
          set({ 
            isLoadingAllVideos: false,
            allVideosError: errorMessage
          })
          
          return allVideos
        }
      },
      
      getVideos: async (forceRefresh = false, loadMore = false) => {
        const { 
          userDetails, 
          videos, 
          isLoadingVideos, 
          isLoadingMoreVideos,
          lastVideoEndpoint,
          currentPage,
          hasMoreVideos,
          filterVideos
        } = get()
        
        if (!userDetails) {
          return []
        }

        const currentEndpoint = userDetails.jobOption === 'placementDrive' || userDetails.jobOption === 'Academy' 
          ? `/videos/job/${userDetails.jobid}`
          : '/videos/videos'
        
        if (loadMore && (!hasMoreVideos || isLoadingMoreVideos)) {
          return videos
        }
        
        if (!loadMore && !forceRefresh && videos.length > 0 && lastVideoEndpoint === currentEndpoint) {
          return videos
        }
        
        if (!loadMore && isLoadingVideos) {
          return videos 
        }
        
        const page = loadMore ? currentPage + 1 : 0
        const size = 20
        
        set({ 
          [loadMore ? 'isLoadingMoreVideos' : 'isLoadingVideos']: true, 
          videoError: null 
        })
        
        try {
          const response = await axiosInstance.get(currentEndpoint, {
            params: { page, size }
          })
          
          const responseData = response.data || {}
          const rawVideoData = responseData.videos || []
          const totalPages = responseData.totalPages || 1
          
          const filteredVideoData = filterVideos(rawVideoData)
          
          const combinedVideos = loadMore ? [...videos, ...filteredVideoData] : filteredVideoData
          const finalVideos = filterVideos(combinedVideos)
          
          const hasMore = page < (totalPages - 1)
          
          set({ 
            videos: finalVideos,
            [loadMore ? 'isLoadingMoreVideos' : 'isLoadingVideos']: false,
            lastVideoEndpoint: currentEndpoint,
            currentPage: page,
            hasMoreVideos: hasMore,
            videoError: null
          })
          
          return finalVideos
        } catch (error) {
          console.error('Error fetching videos:', error)
          const errorMessage = error.response?.data?.message || 'Failed to fetch videos'
          
          set({ 
            [loadMore ? 'isLoadingMoreVideos' : 'isLoadingVideos']: false,
            videoError: errorMessage
          })
          
          return videos 
        }
      },

      getFilteredVideos: async (filters, forceRefresh = false, loadMore = false) => {
        const { 
          filteredVideos, 
          isLoadingFilteredVideos, 
          isLoadingMoreFilteredVideos,
          lastFilteredEndpoint,
          filteredCurrentPage,
          hasMoreFilteredVideos,
          filterVideos
        } = get()

        const currentEndpoint = JSON.stringify(filters)
        
        if (loadMore && (!hasMoreFilteredVideos || isLoadingMoreFilteredVideos)) {
          return filteredVideos
        }
        
        if (!loadMore && !forceRefresh && filteredVideos.length > 0 && lastFilteredEndpoint === currentEndpoint) {
          return filteredVideos
        }
        
        if (!loadMore && isLoadingFilteredVideos) {
          return filteredVideos 
        }
        
        const page = loadMore ? filteredCurrentPage + 1 : 0
        const size = 20
        
        set({ 
          [loadMore ? 'isLoadingMoreFilteredVideos' : 'isLoadingFilteredVideos']: true, 
          filteredVideoError: null 
        })
        
        try {
          const finalFilterValues = {
            transcriptionKeywords: filters.transcriptionKeywords || '',
            keyskills: filters.keyskills || '',
            experience: filters.experience || '',
            industry: filters.industry || '',
            city: filters.city || '',
            college: filters.college || '',
            jobId: filters.jobid || ''
          }
          
          const payload = {}
          for (const [key, value] of Object.entries(finalFilterValues)) {
            if (value && value.toString().trim() !== '') {
              payload[key] = value
            }
          }
          
          const response = await axiosInstance.post(`/videos/filter?page=${page}&size=${size}`, payload)
          
          const responseData = response.data || {}
          const rawVideoData = responseData.videos || []
          const totalPages = responseData.totalPages || 1
          
          const filteredVideoData = filterVideos(rawVideoData)
          
          const combinedVideos = loadMore ? [...filteredVideos, ...filteredVideoData] : filteredVideoData
          const finalVideos = filterVideos(combinedVideos)
          
          const hasMore = page < (totalPages - 1)
          
          set({ 
            filteredVideos: finalVideos,
            [loadMore ? 'isLoadingMoreFilteredVideos' : 'isLoadingFilteredVideos']: false,
            lastFilteredEndpoint: currentEndpoint,
            filteredCurrentPage: page,
            hasMoreFilteredVideos: hasMore,
            filteredVideoError: null
          })
          
          return finalVideos
        } catch (error) {
          console.error('Error fetching filtered videos:', error)
          const errorMessage = error.response?.data?.message || 'Failed to fetch filtered videos'
          
          set({ 
            [loadMore ? 'isLoadingMoreFilteredVideos' : 'isLoadingFilteredVideos']: false,
            filteredVideoError: errorMessage
          })
          
          return filteredVideos 
        }
      },
      
      getJobVideosCounts: async () => {
        const { userDetails, isLoadingJobVideosCounts } = get()
        
        if (!userDetails || !userDetails.jobid) {
          return { totalUsers: 0, totalVideos: 0 }
        }

        const isPlacementOrAcademy = userDetails.jobOption === 'placementDrive' || userDetails.jobOption === 'Academy'
        
        if (!isPlacementOrAcademy) {
          return { totalUsers: 0, totalVideos: 0 }
        }
        
        if (isLoadingJobVideosCounts) {
          return get().jobVideosCounts
        }
        
        set({ isLoadingJobVideosCounts: true })
        
        try {
          const response = await axiosInstance.get(`/videos/counts/${userDetails.jobid}`)
          const counts = {
            totalUsers: response.data.totalUsers || 0,
            totalVideos: response.data.totalVideos || 0
          }
          
          set({ 
            jobVideosCounts: counts,
            isLoadingJobVideosCounts: false
          })
          
          return counts
        } catch (error) {
          console.error('Error fetching job videos counts:', error)
          
          set({ 
            isLoadingJobVideosCounts: false,
            jobVideosCounts: { totalUsers: 0, totalVideos: 0 }
          })
          
          return { totalUsers: 0, totalVideos: 0 }
        }
      },
      
      loadMoreVideos: async () => {
        const { getVideos } = get()
        return getVideos(false, true)
      },

      loadMoreFilteredVideos: async (filters) => {
        const { getFilteredVideos } = get()
        return getFilteredVideos(filters, false, true)
      },
      
      clearVideos: () => set({ 
        videos: [], 
        videoError: null, 
        lastVideoEndpoint: null,
        currentPage: 0,
        hasMoreVideos: true,
        isLoadingMoreVideos: false
      }),

      clearFilteredVideos: () => set({ 
        filteredVideos: [], 
        filteredVideoError: null, 
        lastFilteredEndpoint: null,
        filteredCurrentPage: 0,
        hasMoreFilteredVideos: true,
        isLoadingMoreFilteredVideos: false
      }),
      
      refreshVideos: () => {
        const { getVideos } = get()
        set({ 
          currentPage: 0,
          hasMoreVideos: true,
          isLoadingMoreVideos: false
        })
        return getVideos(true)
      },

      refreshFilteredVideos: (filters) => {
        const { getFilteredVideos } = get()
        set({ 
          filteredCurrentPage: 0,
          hasMoreFilteredVideos: true,
          isLoadingMoreFilteredVideos: false
        })
        return getFilteredVideos(filters, true)
      },

      getLikedVideos: async (forceRefresh = false) => {
        const { userDetails, likedVideos, isLoadingLikedVideos, filterVideos } = get()
        
        if (!userDetails) {
          console.error('User details not available')
          return []
        }

        if (!forceRefresh && likedVideos.length > 0) {
          return likedVideos
        }
        
        if (isLoadingLikedVideos) {
          return likedVideos
        }
        
        set({ isLoadingLikedVideos: true, likedVideoError: null })
        
        try {
          const response = await axiosInstance.get('/videos/liked', {
            params: { userId: userDetails.userId }
          })
          const rawLikedVideoData = response.data || []
          
          const filteredLikedVideoData = filterVideos(rawLikedVideoData)
          
          set({ 
            likedVideos: filteredLikedVideoData,
            isLoadingLikedVideos: false,
            likedVideoError: null
          })
          
          return filteredLikedVideoData
        } catch (error) {
          console.error('Error fetching liked videos:', error)
          const errorMessage = error.response?.data?.message || 'Failed to fetch liked videos'
          
          set({ 
            isLoadingLikedVideos: false,
            likedVideoError: errorMessage
          })
          
          return likedVideos
        }
      },
      
      clearLikedVideos: () => set({ 
        likedVideos: [], 
        likedVideoError: null 
      }),
      
      refreshLikedVideos: () => {
        const { getLikedVideos } = get()
        return getLikedVideos(true)
      },

      getComments: async (forceRefresh = false) => {
        const { userDetails, comments, isLoadingComments } = get()
        
        if (!userDetails?.userId) {
          return []
        }

        if (!forceRefresh && comments.length > 0) {
          return comments
        }
        
        if (isLoadingComments) {
          return comments
        }
        
        set({ isLoadingComments: true, commentError: null })
        
        try {
          const response = await axiosInstance.get(`/comments/userId?userId=${userDetails.userId}`)
          const commentData = response.data || []
          
          set({ 
            comments: commentData,
            isLoadingComments: false,
            commentError: null
          })
          
          return commentData
        } catch (error) {
          console.error('Error fetching comments:', error)
          const errorMessage = error.response?.data?.message || 'Failed to fetch comments'
          
          set({ 
            isLoadingComments: false,
            commentError: errorMessage
          })
          
          return comments
        }
      },

      getCommentedVideos: async (forceRefresh = false) => {
        const { userDetails, commentedVideos, isLoadingCommentedVideos, getAllVideos, getComments, filterVideos } = get()
        
        if (!userDetails?.userId) {
          return []
        }

        if (!forceRefresh && commentedVideos.length > 0) {
          return commentedVideos
        }
        
        if (isLoadingCommentedVideos) {
          return commentedVideos
        }
        
        set({ isLoadingCommentedVideos: true, commentedVideoError: null })
        
        try {
          await getAllVideos()
          const { allVideos } = get()
          
          await getComments()
          const { comments } = get()
          
          const videoIds = [...new Set(comments.map(comment => comment.videoId))]
          
          if (videoIds.length === 0) {
            set({ 
              commentedVideos: [],
              isLoadingCommentedVideos: false,
              commentedVideoError: null
            })
            return []
          }
          
          const matchingVideos = allVideos.filter(video => {
            const videoId = video.id || video.videoId || video.videoID;
            return videoIds.includes(videoId);
          });
          
          const filteredCommentedVideos = filterVideos(matchingVideos)
          
          set({ 
            commentedVideos: filteredCommentedVideos,
            isLoadingCommentedVideos: false,
            commentedVideoError: null
          })
          
          return filteredCommentedVideos
        } catch (error) {
          console.error('Error fetching commented videos:', error)
          const errorMessage = error.response?.data?.message || 'Failed to fetch commented videos'
          
          set({ 
            isLoadingCommentedVideos: false,
            commentedVideoError: errorMessage
          })
          
          return commentedVideos
        }
      },

      clearCommentedVideos: () => set({ 
        commentedVideos: [], 
        commentedVideoError: null 
      }),

      refreshCommentedVideos: () => {
        const { getCommentedVideos } = get()
        return getCommentedVideos(true)
      },

      addComment: async (videoId, comment) => {
        const { userDetails } = get()
        
        if (!userDetails) throw new Error('User not authenticated')
        
        try {
          await axiosInstance.post(`/comments/add`, null, {
            params: {
              userId: userDetails.userId,
              videoId: videoId,
              firstName: userDetails.firstName,
              comment: comment.trim()
            }
          })
          
          const { getComments } = get()
          await getComments(true)
        } catch (error) {
          console.error('Error adding comment:', error)
          throw error
        }
      },

      updateComment: async (commentId, newComment) => {
        const { userDetails } = get()
        
        if (!userDetails) throw new Error('User not authenticated')
        
        try {
          await axiosInstance.put(`/comments/edit/${commentId}`, null, {
            params: {
              userId: userDetails.userId,
              newComment: newComment.trim()
            }
          })
          
          const { getComments } = get()
          await getComments(true)
        } catch (error) {
          console.error('Error updating comment:', error)
          throw error
        }
      },

      deleteComment: async (commentId) => {
        const { userDetails } = get()
        
        if (!userDetails) throw new Error('User not authenticated')
        
        try {
          await axiosInstance.delete(`/comments/delete/${commentId}`, {
            params: {
              userId: userDetails.userId
            }
          })
          
          const { getComments } = get()
          await getComments(true)
        } catch (error) {
          console.error('Error deleting comment:', error)
          throw error
        }
      },
      
      clearComments: () => set({ 
        comments: [], 
        commentError: null 
      })
    }),
    {
      name: 'wezume-app-storage', 
      partialize: (state) => ({ 
        userDetails: state.userDetails,
        isInitialized: state.isInitialized
      }),
      storage: createJSONStorage(() => localStorage),
      version: 1, 
    }
  )
)