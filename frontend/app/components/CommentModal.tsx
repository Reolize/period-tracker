"use client"

import { useState, useEffect } from "react"
import { X, MessageCircle, Send, Clock } from "lucide-react"
import type { Post, Comment } from "@/app/types/tracking"
import { API_URL } from "@/lib/api"

interface CommentModalProps {
  post: Post | null
  isOpen: boolean
  onClose: () => void
  onCommentAdded?: () => void
}

export function CommentModal({ post, isOpen, onClose, onCommentAdded }: CommentModalProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAnonymous, setIsAnonymous] = useState(false)

  // Fetch comments when modal opens
  useEffect(() => {
    if (isOpen && post) {
      fetchComments()
    }
  }, [isOpen, post])

  async function fetchComments() {
    if (!post) return
    
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_URL}/community/posts/${post.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "69420",
          "Bypass-Tunnel-Reminder": "true",
        },
      })

      if (res.ok) {
        const data = await res.json()
        setComments(data.comments || [])
      }
    } catch (err) {
      console.error("Failed to fetch comments:", err)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim() || !post) return

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_URL}/community/posts/${post.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "69420",
          "Bypass-Tunnel-Reminder": "true",
        },
        body: JSON.stringify({
          content: newComment.trim(),
          is_anonymous: isAnonymous,
        }),
      })

      if (res.ok) {
        const newCommentData = await res.json()
        setComments([...comments, newCommentData])
        setNewComment("")
        onCommentAdded?.()
      } else {
        const error = await res.json()
        alert(error.detail || "Failed to add comment")
      }
    } catch (err) {
      console.error("Failed to add comment:", err)
      alert("Network error. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString("en-US", { day: "numeric", month: "short" })
  }

  if (!isOpen || !post) return null

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#f0e8ee] bg-gradient-to-r from-[#fff5f8] to-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff7eb6] to-[#ff4d9f] flex items-center justify-center">
              <MessageCircle className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#3f2b4d]">Comments</h2>
              <p className="text-sm text-[#7d6b86]">{comments.length} comments on this post</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        {/* Comments List */}
        <div className="p-6 overflow-y-auto max-h-[50vh] space-y-4">
          {isLoading ? (
            // Loading skeleton
            [...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                </div>
              </div>
            ))
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#fff0f6] to-violet-100 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="text-[#ff7eb6]" size={28} />
              </div>
              <h3 className="text-lg font-semibold text-[#3f2b4d] mb-2">No comments yet</h3>
              <p className="text-sm text-[#7d6b86]">Be the first to share your thoughts!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 p-4 bg-gray-50 rounded-xl">
                {/* Avatar */}
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                    ${comment.author.is_anonymous
                      ? "bg-gradient-to-br from-violet-100 via-pink-100 to-purple-100 text-violet-600"
                      : "bg-gradient-to-br from-[#ff7eb6] via-[#ff4d9f] to-[#ff1a6c] text-white"
                    }
                  `}
                >
                  {comment.author.is_anonymous ? "🎭" : comment.author.display_name.charAt(0).toUpperCase()}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-[#3f2b4d] text-sm">
                      {comment.author.display_name}
                    </span>
                    {comment.author.is_anonymous && (
                      <span className="text-xs px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded-full">
                        Anonymous
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock size={12} />
                      {formatTimeAgo(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-[#6b7280] text-sm leading-relaxed">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Comment Form */}
        <div className="p-6 border-t border-[#f0e8ee] bg-gradient-to-r from-gray-50/50 to-white">
          <form onSubmit={handleSubmitComment} className="space-y-3">
            {/* Anonymous Checkbox */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="comment-anonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 accent-violet-500 cursor-pointer"
              />
              <label htmlFor="comment-anonymous" className="text-sm text-[#7d6b86] cursor-pointer">
                🎭 Comment anonymously
              </label>
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                maxLength={1000}
                className="flex-1 border border-[#f0e8ee] px-4 py-3 rounded-xl focus:outline-none focus:border-[#ff7eb6] focus:ring-2 focus:ring-[#ff7eb6]/20 transition-all text-[#3f2b4d] text-sm"
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
                className="px-4 py-3 bg-gradient-to-r from-[#ff7eb6] to-[#ff4d9f] hover:from-[#e05896] hover:to-[#e63a8a] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-medium shadow-lg shadow-[#ff7eb6]/30 transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <>
                    <Send size={18} />
                    <span className="hidden sm:inline">Send</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
