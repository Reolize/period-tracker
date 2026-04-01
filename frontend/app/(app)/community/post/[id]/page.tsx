"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, MessageCircle, Filter, ChevronDown, EyeOff, Eye } from "lucide-react"
import { apiFetch } from "@/lib/api"
import type { PostDetail, ReactionType, Comment } from "@/app/types/tracking"
import { PostCard } from "@/app/components/PostCard"
import { CommentItem } from "@/app/components/CommentItem"

type CommentSortBy = "newest" | "oldest" | "most_replies" | "most_reactions"

export default function PostDetailPage() {
  const router = useRouter()
  const params = useParams()
  const postId = Number(params.id)

  const [post, setPost] = useState<PostDetail | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Filter and sort states
  const [showDeleted, setShowDeleted] = useState(false)
  const [sortBy, setSortBy] = useState<CommentSortBy>("newest")

  useEffect(() => {
    if (!postId) return
    fetchPost()
  }, [postId])

  async function fetchPost() {
    try {
      setLoading(true)
      const data = await apiFetch(`/community/posts/${postId}`)
      if (data) {
        setPost(data)
        setComments(data.comments || [])
      }
    } catch (err) {
      console.error("Failed to load post:", err)
    } finally {
      setLoading(false)
    }
  }

  // Count only active (non-deleted) comments recursively
  function countActiveComments(commentList: Comment[]): number {
    let count = 0
    for (const c of commentList) {
      if (!c.is_deleted) {
        count += 1
        if (c.replies && c.replies.length > 0) {
          count += countActiveComments(c.replies)
        }
      }
    }
    return count
  }

  const activeCommentCount = countActiveComments(comments)

  // Filter and sort comments
  function getFilteredAndSortedComments(commentList: Comment[]): Comment[] {
    // First filter deleted comments
    let filtered = showDeleted 
      ? commentList 
      : commentList.filter(c => !c.is_deleted)
    
    // Then sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "most_replies":
          const aReplies = a.reply_count || a.replies?.length || 0
          const bReplies = b.reply_count || b.replies?.length || 0
          return bReplies - aReplies
        case "most_reactions":
          const aReactions = a.reactions ? Object.values(a.reactions).reduce((x, y) => x + y, 0) : 0
          const bReactions = b.reactions ? Object.values(b.reactions).reduce((x, y) => x + y, 0) : 0
          return bReactions - aReactions
        default:
          return 0
      }
    })
    
    return sorted
  }

  const displayComments = getFilteredAndSortedComments(comments)

  // Add top-level comment
  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim() || isSubmitting || !post) return

    setIsSubmitting(true)
    try {
      const response = await apiFetch(`/community/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: newComment.trim() })
      })
      
      if (response) {
        // Re-fetch entire post to get fresh user data for all comments
        await fetchPost()
        setNewComment("")
      }
    } catch (err) {
      console.error("Failed to submit comment:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle reply added - re-fetch entire post to get fresh user data
  function handleReplyAdded(parentId: number, reply: Comment) {
    // Re-fetch to get fresh data including latest user avatars/usernames
    fetchPost()
  }

  // Handle comment deleted - re-fetch entire post for real-time update
  function handleCommentDeleted(commentId: number) {
    // Re-fetch to get fresh data including deleted status for all replies
    fetchPost()
  }

  // Handle comment reacted - callback for reaction updates
  function handleCommentReacted(commentId: number) {
    // Optional: re-fetch to ensure sync with backend
    // fetchPost()
  }

  async function handleReact(postId: number, reactionType: ReactionType) {
    if (!post) return
    try {
      const res = await apiFetch(`/community/posts/${postId}/react`, {
        method: "POST",
        body: JSON.stringify({ reaction_type: reactionType })
      })
      if (res) {
        setPost(prev => prev ? { ...prev, ...res } : null)
      }
    } catch (err) {
      console.error("Failed to react:", err)
    }
  }

  async function handleRemoveReaction(postId: number) {
    try {
      await apiFetch(`/community/posts/${postId}/react`, { method: "DELETE" })
      fetchPost()
    } catch (err) {
      console.error("Failed to remove reaction:", err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>Post not found</p>
          <button onClick={() => router.push("/community")} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
            Back to Community
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-pink-50/30 p-4 max-w-3xl mx-auto">
      <button
        onClick={() => router.push("/community")}
        className="flex items-center gap-2 mb-4 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={20} />
        <span>Back</span>
      </button>

      <PostCard
        post={post}
        onReact={handleReact}
        onRemoveReaction={handleRemoveReaction}
        isAuthor={post.is_author}
        isDetailView={true}
      />

      <div className="mt-8">
        {/* Comments Header with Filter & Sort */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <MessageCircle size={20} className="text-pink-500" />
            Comments <span className="text-pink-500">({activeCommentCount})</span>
          </h2>
          
          {/* Filter & Sort Controls */}
          {comments.length > 0 && (
            <div className="flex items-center gap-2">
              {/* Show/Hide Deleted Toggle */}
              <button
                onClick={() => setShowDeleted(!showDeleted)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
                  showDeleted
                    ? "bg-gray-100 text-gray-700 border-gray-200"
                    : "bg-white text-gray-600 border-pink-200 hover:border-pink-300"
                }`}
              >
                {showDeleted ? <Eye size={14} /> : <EyeOff size={14} />}
                {showDeleted ? "Show Deleted" : "Hide Deleted"}
              </button>
              
              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as CommentSortBy)}
                  className="appearance-none bg-white border border-pink-200 text-gray-700 rounded-xl px-3 py-2 pr-8 text-sm font-medium focus:outline-none focus:border-pink-400 cursor-pointer hover:border-pink-300 transition-all"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="most_replies">Most Replies</option>
                  <option value="most_reactions">Most Reactions</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-pink-400 pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmitComment} className="mb-6 flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            disabled={isSubmitting}
            className="flex-1 w-full rounded-2xl bg-white border border-pink-100 px-4 py-3 focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-shadow shadow-sm outline-none"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-full px-6 py-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "..." : "Post"}
          </button>
        </form>

        <div className="space-y-3">
          {displayComments.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pink-50 flex items-center justify-center">
                <MessageCircle className="text-pink-300" size={32} />
              </div>
              <p className="text-gray-500 font-medium">
                {showDeleted ? "No comments found" : "No active comments"}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {showDeleted ? "All comments may have been deleted" : "Be the first to share your thoughts!"}
              </p>
            </div>
          ) : (
            displayComments.map((comment) => (
              <CommentItem 
                key={comment.id} 
                comment={comment} 
                postId={postId}
                onReplyAdded={handleReplyAdded}
                onCommentDeleted={handleCommentDeleted}
                onCommentReacted={handleCommentReacted}
                currentUserId={post.is_author && post.author?.id ? post.author.id : undefined}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
