"use client"

import { useState } from "react"
import { MessageSquare, Trash2, ChevronDown, ChevronUp, Heart, ThumbsUp, HandHeart, Dumbbell } from "lucide-react"
import { apiFetch } from "@/lib/api"
import type { Comment, CommentReactionType } from "@/app/types/tracking"

const COMMENT_REACTION_CONFIG: Record<CommentReactionType, { icon: typeof Heart; emoji: string; label: string; color: string; hoverColor: string; bgColor: string }> = {
  like: { icon: ThumbsUp, emoji: "👍", label: "Like", color: "text-blue-500", hoverColor: "hover:bg-blue-50", bgColor: "bg-blue-50 text-blue-600" },
  heart: { icon: Heart, emoji: "❤️", label: "Love", color: "text-rose-500", hoverColor: "hover:bg-rose-50", bgColor: "bg-rose-50 text-rose-600" },
  hug: { icon: HandHeart, emoji: "🫂", label: "Hug", color: "text-violet-500", hoverColor: "hover:bg-violet-50", bgColor: "bg-violet-50 text-violet-600" },
  support: { icon: Dumbbell, emoji: "💪", label: "Support", color: "text-emerald-500", hoverColor: "hover:bg-emerald-50", bgColor: "bg-emerald-50 text-emerald-600" },
}

interface CommentItemProps {
  comment: Comment
  postId: number
  depth?: number
  onReplyAdded?: (parentId: number, reply: Comment) => void
  onCommentDeleted?: (commentId: number) => void
  onCommentReacted?: (commentId: number) => void
  currentUserId?: number
}

export function CommentItem({ 
  comment, 
  postId, 
  depth = 0, 
  onReplyAdded, 
  onCommentDeleted,
  onCommentReacted,
  currentUserId 
}: CommentItemProps) {
  // UI state only - NOT comment data
  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showReplies, setShowReplies] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Reaction state (local copy for immediate UI update)
  const [userReaction, setUserReaction] = useState<CommentReactionType | null>(comment.user_reaction || null)
  const [reactions, setReactions] = useState(comment.reactions || { like: 0, heart: 0, hug: 0, support: 0 })

  // Derived from props - Single Source of Truth
  const isDeleted = comment.is_deleted
  const isAuthor = currentUserId && comment.author?.id === currentUserId
  const replies = comment.replies || []
  const replyCount = comment.reply_count || 0

  // Display name fallback: username > display_name > Anonymous
  const displayName = comment.author?.username 
    || (comment.author?.display_name && comment.author.display_name !== "Anonymous" ? comment.author.display_name : null)
    || "Anonymous"
  
  // Avatar URL priority: avatar_url > profile_pic_url
  const avatarUrl = comment.author?.avatar_url || comment.author?.profile_pic_url
  
  // Avatar initial based on display name
  const avatarInitial = displayName.charAt(0).toUpperCase()

  async function handleSubmitReply(e: React.FormEvent) {
    e.preventDefault()
    if (!replyContent.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await apiFetch(`/community/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({
          content: replyContent.trim(),
          parent_id: comment.id,
        }),
      })

      if (response) {
        // Clear UI state
        setReplyContent("")
        setIsReplying(false)
        setShowReplies(true)
        // Notify parent to update state - backend returns CommentResponse directly
        onReplyAdded?.(comment.id, response as Comment)
      }
    } catch (err) {
      console.error("Failed to submit reply:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      const response = await apiFetch(`/community/comments/${comment.id}`, {
        method: "DELETE",
      })

      if (response) {
        // Notify parent to update state
        onCommentDeleted?.(comment.id)
      }
    } catch (err) {
      console.error("Failed to delete comment:", err)
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  async function handleReact(reactionType: CommentReactionType) {
    if (isDeleted) return
    
    // Optimistic UI update
    const previousReaction = userReaction
    const newReactions = { ...reactions }
    
    if (previousReaction === reactionType) {
      // Remove reaction
      setUserReaction(null)
      newReactions[reactionType] = Math.max(0, (newReactions[reactionType] || 0) - 1)
    } else {
      // Add/change reaction
      if (previousReaction) {
        newReactions[previousReaction] = Math.max(0, (newReactions[previousReaction] || 0) - 1)
      }
      setUserReaction(reactionType)
      newReactions[reactionType] = (newReactions[reactionType] || 0) + 1
    }
    setReactions(newReactions)
    
    try {
      if (previousReaction === reactionType) {
        // Remove reaction
        await apiFetch(`/community/comments/${comment.id}/react`, { method: "DELETE" })
      } else {
        // Add reaction
        await apiFetch(`/community/comments/${comment.id}/react`, {
          method: "POST",
          body: JSON.stringify({ reaction_type: reactionType })
        })
      }
      onCommentReacted?.(comment.id)
    } catch (err) {
      console.error("Failed to react to comment:", err)
      // Revert on error
      setUserReaction(previousReaction)
      setReactions(reactions)
    }
  }

  // Recursive depth guard
  if (depth > 10) return null

  return (
    <div className={`${depth > 0 ? "mt-3 ml-4 md:ml-8 pl-4 border-l-2 border-pink-100" : ""} mb-4`}>
      {/* Comment Content - Always render the container */}
      <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 transition-all hover:shadow-md">
        {isDeleted ? (
          /* Deleted State - MUST show this, never return null */
          <div className="p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400 italic text-sm flex items-center gap-2">
            <Trash2 size={14} />
            [This comment was deleted]
          </div>
        ) : (
          /* Normal Comment */
          <>
            {/* Header with Avatar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Avatar - Prioritize actual avatar URL, fallback to initials */}
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt={displayName}
                    className="w-8 h-8 rounded-full object-cover shrink-0 border border-pink-100"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-sm shrink-0 border border-pink-200">
                    {avatarInitial}
                  </div>
                )}
                
                {/* Name and Time */}
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-gray-800">
                    {displayName}
                  </span>
                  {comment.author?.username && (
                    <span className="text-xs text-gray-400">@{comment.author.username}</span>
                  )}
                </div>
                <span className="text-xs text-gray-400 ml-2">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              {isAuthor && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="text-gray-300 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {/* Content */}
            <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>

            {/* Actions */}
            <div className="flex items-center flex-wrap gap-2 pt-1">
              {/* Reaction Buttons */}
              <div className="flex items-center gap-1">
                {(Object.keys(COMMENT_REACTION_CONFIG) as CommentReactionType[]).map((reactionType) => {
                  const config = COMMENT_REACTION_CONFIG[reactionType]
                  const count = reactions[reactionType] || 0
                  const isActive = userReaction === reactionType
                  const Icon = config.icon

                  return (
                    <button
                      key={reactionType}
                      onClick={() => handleReact(reactionType)}
                      className={`
                        flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                        transition-all duration-200 border
                        ${isActive
                          ? `${config.bgColor} ring-1 ${config.bgColor.split(' ')[2]} shadow-sm`
                          : `bg-white text-gray-500 border-gray-200 ${config.hoverColor} hover:shadow-sm`
                        }
                        ${count > 0 || isActive ? "opacity-100" : "opacity-60 hover:opacity-100"}
                      `}
                      title={config.label}
                    >
                      <Icon size={14} className={isActive ? config.color : ""} />
                      {(count > 0 || isActive) && (
                        <span className={isActive ? config.color : ""}>
                          {count + (isActive && count === 0 ? 1 : 0)}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="w-px h-4 bg-gray-200 mx-1" />

              <button
                onClick={() => setIsReplying(!isReplying)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-pink-500 transition-colors font-medium"
              >
                <MessageSquare size={14} />
                {isReplying ? "Cancel" : "Reply"}
              </button>
              {replyCount > 0 && (
                <button
                  onClick={() => setShowReplies(!showReplies)}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-pink-500 transition-colors"
                >
                  {showReplies ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {replyCount} {replyCount === 1 ? "reply" : "replies"}
                </button>
              )}
            </div>

            {/* Reply Input */}
            {isReplying && (
              <form onSubmit={handleSubmitReply} className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 text-sm bg-white border border-pink-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-shadow"
                />
                <button
                  type="submit"
                  disabled={!replyContent.trim() || isSubmitting}
                  className="px-4 py-2 text-sm bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-xl disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? "..." : "Post"}
                </button>
              </form>
            )}
          </>
        )}
      </div>

      {/* Nested Replies - ALWAYS rendered regardless of deleted state */}
      {showReplies && replies.length > 0 && (
        <div className="mt-3 ml-4 md:ml-8 pl-4 border-l-2 border-pink-100 flex flex-col gap-3">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              depth={depth + 1}
              onReplyAdded={onReplyAdded}
              onCommentDeleted={onCommentDeleted}
              onCommentReacted={onCommentReacted}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200"
          onClick={() => !isDeleting && setShowDeleteModal(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 scale-in duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-100 to-rose-100 flex items-center justify-center mb-4 shadow-lg">
                <Trash2 size={28} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Delete Comment?
              </h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to delete this comment? All replies will also be removed. This action cannot be undone.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 border border-pink-200 text-gray-600 rounded-xl font-medium hover:bg-pink-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
