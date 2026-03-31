"use client"

import { useEffect, useState } from "react"
import { Plus, Users, Shield, Sparkles, MessageSquareText, Heart, Search, TrendingUp, Filter } from "lucide-react"
import { PostCard } from "@/app/components/PostCard"
import { CommentModal } from "@/app/components/CommentModal"
import { ToastContainer, useToast } from "@/app/components/Toast"
import type { Post, PostCategory, ReactionType } from "@/app/types/tracking"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const CATEGORIES: { value: PostCategory; label: string; color: string; description: string }[] = [
  { value: "General", label: "General", color: "bg-slate-100 text-slate-700", description: "Open discussions" },
  { value: "PCOS", label: "PCOS", color: "bg-pink-100 text-pink-700", description: "PCOS experiences & tips" },
  { value: "Tips", label: "Tips", color: "bg-teal-100 text-teal-700", description: "Helpful advice" },
  { value: "Support", label: "Support", color: "bg-rose-100 text-rose-700", description: "Emotional support" },
  { value: "Questions", label: "Questions", color: "bg-blue-100 text-blue-700", description: "Ask the community" },
]

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<PostCategory | "All">("All")
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Create post form state
  const [newPostTitle, setNewPostTitle] = useState("")
  const [newPostContent, setNewPostContent] = useState("")
  const [newPostCategory, setNewPostCategory] = useState<PostCategory>("General")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Comment modal state
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [showCommentModal, setShowCommentModal] = useState(false)
  
  // Toast notification
  const { toasts, addToast, removeToast, success, error } = useToast()

  // Fetch posts
  useEffect(() => {
    fetchPosts()
  }, [selectedCategory])

  async function fetchPosts() {
    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")
      
      const url = new URL(`${API_URL}/community/posts`)
      if (selectedCategory !== "All") {
        url.searchParams.set("category", selectedCategory)
      }
      url.searchParams.set("page", "1")
      url.searchParams.set("per_page", "20")
      
      const res = await fetch(url.toString(), {
        headers: { 
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "69420",
          "Bypass-Tunnel-Reminder": "true", // For LocalTunnel
        },
      })
      
      if (res.ok) {
        const data = await res.json()
        setPosts(data.posts)
      }
    } catch (err) {
      console.error("Failed to fetch posts:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Create post with proper error handling
  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault()
    if (!newPostTitle.trim() || !newPostContent.trim()) return

    try {
      setIsSubmitting(true)
      const token = localStorage.getItem("token")
      
      // Prepare payload - must match Pydantic schema exactly
      const payload = {
        title: newPostTitle.trim(),
        content: newPostContent.trim(),
        category: newPostCategory,
        is_anonymous: isAnonymous,
      }
      
      const res = await fetch(`${API_URL}/community/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "ngrok-skip-browser-warning": "69420",
          "Bypass-Tunnel-Reminder": "true", // For LocalTunnel
        },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        // Success: parse response and update UI
        const newPost = await res.json()
        setPosts([newPost, ...posts])
        setShowCreateModal(false)
        resetForm()
        fetchPosts()
        success("Post Created!", "Your post has been published successfully")
      } else {
        // Error: parse error message from backend
        let errorData: any = {}
        try {
          errorData = await res.json()
        } catch {
          // If response body is not JSON
        }
        
        const errorMsg = errorData.detail || errorData.message || `Error ${res.status}: Failed to create post`
        error("Failed to Create Post", errorMsg)
      }
    } catch (err: any) {
      console.error("Network/Error creating post:", err)
      const errorMsg = err?.message || "Network error. Please check your connection and try again."
      error("Error", errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  function resetForm() {
    setNewPostTitle("")
    setNewPostContent("")
    setNewPostCategory("General")
    setIsAnonymous(false)
  }

  // Handle comment button click
  function handleComment(postId: number) {
    const post = posts.find(p => p.id === postId)
    if (post) {
      setSelectedPost(post)
      setShowCommentModal(true)
    }
  }

  // Handle delete post
  async function handleDeletePost(postId: number) {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_URL}/community/posts/${postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "69420",
          "Bypass-Tunnel-Reminder": "true",
        },
      })

      if (res.ok) {
        setPosts(posts.filter(p => p.id !== postId))
        success("Post Deleted", "Your post has been deleted successfully")
      } else {
        error("Failed to Delete", "Could not delete the post. Please try again.")
      }
    } catch (err) {
      console.error("Failed to delete post:", err)
      error("Error", "Network error. Please check your connection.")
    }
  }

  // Handle report post
  async function handleReportPost(postId: number, reason: string) {
    // For now, just show a success message
    // In production, this would send a report to the backend
    success("Report Submitted", "Thank you for helping keep our community safe. We'll review this post.")
    console.log(`Reported post ${postId} with reason: ${reason}`)
  }

  // React to post
  async function handleReact(postId: number, reactionType: ReactionType) {
    try {
      const token = localStorage.getItem("token")
      
      const res = await fetch(`${API_URL}/community/posts/${postId}/react`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "69420",
          "Bypass-Tunnel-Reminder": "true", // For LocalTunnel
        },
        body: JSON.stringify({ reaction_type: reactionType }),
      })

      if (res.ok) {
        const updatedPost = await res.json()
        setPosts(posts.map(p => p.id === postId ? updatedPost : p))
      }
    } catch (err) {
      console.error("Failed to react:", err)
    }
  }

  // Remove reaction
  async function handleRemoveReaction(postId: number) {
    try {
      const token = localStorage.getItem("token")
      
      const res = await fetch(`${API_URL}/community/posts/${postId}/react`, {
        method: "DELETE",
        headers: { 
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "69420",
          "Bypass-Tunnel-Reminder": "true", // For LocalTunnel
        },
      })

      if (res.ok) {
        // Refresh the post to get updated reactions
        fetchPosts()
      }
    } catch (err) {
      console.error("Failed to remove reaction:", err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff5f8] via-white to-[#fef0f5] pb-8">
      {/* Header */}
      <div className="bg-white border-b border-[#f0e8ee] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#3f2b4d] flex items-center gap-2">
                <Users className="text-[#ff7eb6]" size={28} />
                Community Board
              </h1>
              <p className="text-sm text-[#7d6b86] mt-1">
                Share, support, and connect in a safe space
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#ff7eb6] to-[#ff4d9f] hover:from-[#e05896] hover:to-[#e63a8a] text-white rounded-full font-semibold shadow-lg shadow-[#ff7eb6]/30 transition-all transform hover:scale-105 active:scale-95"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Create Post</span>
              <span className="sm:hidden">Post</span>
            </button>
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Privacy Notice */}
        <div className="bg-gradient-to-r from-violet-50 to-pink-50 rounded-2xl p-4 mb-6 border border-violet-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
              <Shield className="text-violet-500" size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[#3f2b4d] flex items-center gap-2">
                <Sparkles size={16} className="text-violet-500" />
                Privacy-First Community
              </h3>
              <p className="text-sm text-[#7d6b86] mt-1 leading-relaxed">
                Post anonymously with cute animal names to share safely. 
                Show empathy with 🫂 Hug, ✋ Me too, 💪 Support, or 🎉 Celebrate reactions.
              </p>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory("All")}
            className={`
              px-3 py-1.5 rounded-full text-sm font-medium transition-all
              ${selectedCategory === "All"
                ? "bg-[#ff7eb6] text-white shadow-sm"
                : "bg-white text-[#7d6b86] border border-[#f0e8ee] hover:border-[#ff7eb6]"
              }
            `}
          >
            All Posts
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`
                px-3 py-1.5 rounded-full text-sm font-medium transition-all
                ${selectedCategory === cat.value
                  ? `${cat.color} shadow-sm ring-1 ring-current`
                  : "bg-white text-[#7d6b86] border border-[#f0e8ee] hover:border-[#ff7eb6]"
                }
              `}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Posts Feed */}
        <div className="space-y-4">
          {isLoading ? (
            // Skeleton loading
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#f0e8ee] p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-20" />
                  </div>
                </div>
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-full mb-1" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            ))
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#fff0f6] to-violet-100 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <MessageSquareText className="text-[#ff7eb6]" size={40} />
              </div>
              <h3 className="text-xl font-bold text-[#3f2b4d] mb-3">
                {selectedCategory === "All" 
                  ? "No posts yet" 
                  : `No posts in ${selectedCategory}`
                }
              </h3>
              <p className="text-[#7d6b86] max-w-md mx-auto mb-6 leading-relaxed">
                {selectedCategory === "All"
                  ? "Be the first to share your story and start the conversation! Share experiences, ask questions, or support other community members."
                  : `No one has posted in ${selectedCategory} yet. Be the first to share in this category!`
                }
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-[#ff7eb6] to-[#ff4d9f] hover:from-[#e05896] hover:to-[#e63a8a] text-white rounded-full font-semibold shadow-lg shadow-[#ff7eb6]/30 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Create Your First Post
              </button>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onReact={handleReact}
                onRemoveReaction={handleRemoveReaction}
                onComment={handleComment}
                onDelete={handleDeletePost}
                onReport={handleReportPost}
                isAuthor={post.is_author}
              />
            ))
          )}
        </div>
      </div>

      {/* Comment Modal */}
      <CommentModal
        post={selectedPost}
        isOpen={showCommentModal}
        onClose={() => {
          setShowCommentModal(false)
          setSelectedPost(null)
        }}
        onCommentAdded={() => {
          fetchPosts() // Refresh posts to get updated comment count
        }}
      />
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#f0e8ee] bg-gradient-to-r from-[#fff5f8] to-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#3f2b4d]">✨ Create New Post</h2>
                  <p className="text-sm text-[#7d6b86] mt-1">
                    Share your story, ask questions, or support others
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    resetForm()
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <span className="text-2xl text-gray-400 hover:text-gray-600">×</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreatePost} className="p-6 space-y-6">
              {/* Category Selection */}
              <div>
                <label className="block text-sm font-semibold text-[#3f2b4d] mb-3">
                  Select Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setNewPostCategory(cat.value)}
                      className={`
                        px-4 py-3 rounded-xl text-sm font-medium transition-all text-left
                        ${newPostCategory === cat.value
                          ? `${cat.color} ring-2 ring-offset-1 ring-[#ff7eb6]`
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                        }
                      `}
                    >
                      <span className="block">{cat.label}</span>
                      <span className="text-xs opacity-70 font-normal">{cat.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-[#3f2b4d] mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  placeholder="Write an interesting title..."
                  maxLength={200}
                  className="w-full border border-[#f0e8ee] p-4 rounded-xl focus:outline-none focus:border-[#ff7eb6] focus:ring-2 focus:ring-[#ff7eb6]/20 transition-all text-[#3f2b4d] text-lg"
                  required
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-semibold text-[#3f2b4d] mb-2">
                  Content
                </label>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Write your content here... Share experiences, ask questions, or give advice"
                  rows={6}
                  maxLength={5000}
                  className="w-full border border-[#f0e8ee] p-4 rounded-xl focus:outline-none focus:border-[#ff7eb6] focus:ring-2 focus:ring-[#ff7eb6]/20 transition-all text-[#3f2b4d] resize-none leading-relaxed"
                  required
                />
                <p className="text-xs text-[#7d6b86] mt-2 text-right">
                  {newPostContent.length}/5000 characters
                </p>
              </div>

              {/* Anonymous Checkbox */}
              <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-violet-50 to-pink-50 rounded-xl border border-violet-100">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="mt-1 w-5 h-5 accent-violet-500 cursor-pointer"
                />
                <div className="flex-1">
                  <label htmlFor="anonymous" className="block text-sm font-semibold text-[#3f2b4d] cursor-pointer">
                    🎭 Post Anonymously
                  </label>
                  <p className="text-xs text-violet-600 mt-1 leading-relaxed">
                    Your name will be hidden and replaced with a cute animal name (e.g., "Shy Panda" 🐼)
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-[#f0e8ee]">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    resetForm()
                  }}
                  className="flex-1 px-4 py-3 border border-[#f0e8ee] text-[#7d6b86] rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newPostTitle.trim() || !newPostContent.trim()}
                  className="flex-[2] px-4 py-3 bg-gradient-to-r from-[#ff7eb6] to-[#ff4d9f] hover:from-[#e05896] hover:to-[#e63a8a] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-lg shadow-[#ff7eb6]/30 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Posting...
                    </span>
                  ) : (
                    "🚀 Post Now!"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
