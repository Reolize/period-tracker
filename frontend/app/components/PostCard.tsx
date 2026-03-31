"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, Clock, Share2, MoreHorizontal, Heart, Trash2, Flag, X } from "lucide-react"
import type { Post, ReactionType } from "@/app/types/tracking"

interface PostCardProps {
  post: Post
  onReact: (postId: number, reactionType: ReactionType) => void
  onRemoveReaction: (postId: number) => void
  onClick?: () => void
  onComment?: (postId: number) => void
  onDelete?: (postId: number) => void
  onReport?: (postId: number, reason: string) => void
  compact?: boolean
  isAuthor?: boolean
}

const REACTION_CONFIG: Record<ReactionType, { emoji: string; label: string; color: string; hoverColor: string; bgColor: string }> = {
  hug: { 
    emoji: "🫂", 
    label: "Hug", 
    color: "text-rose-500", 
    hoverColor: "hover:bg-rose-50 hover:text-rose-600",
    bgColor: "bg-rose-50 text-rose-600 ring-rose-200"
  },
  me_too: { 
    emoji: "✋", 
    label: "Me too", 
    color: "text-violet-500", 
    hoverColor: "hover:bg-violet-50 hover:text-violet-600",
    bgColor: "bg-violet-50 text-violet-600 ring-violet-200"
  },
  support: { 
    emoji: "💪", 
    label: "Support", 
    color: "text-emerald-500", 
    hoverColor: "hover:bg-emerald-50 hover:text-emerald-600",
    bgColor: "bg-emerald-50 text-emerald-600 ring-emerald-200"
  },
  celebrate: { 
    emoji: "🎉", 
    label: "Celebrate", 
    color: "text-amber-500", 
    hoverColor: "hover:bg-amber-50 hover:text-amber-600",
    bgColor: "bg-amber-50 text-amber-600 ring-amber-200"
  },
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  PCOS: { 
    bg: "bg-pink-50", 
    text: "text-pink-700", 
    border: "border-pink-200",
    icon: "🌸"
  },
  Tips: { 
    bg: "bg-teal-50", 
    text: "text-teal-700", 
    border: "border-teal-200",
    icon: "💡"
  },
  Support: { 
    bg: "bg-rose-50", 
    text: "text-rose-700", 
    border: "border-rose-200",
    icon: "🤗"
  },
  General: { 
    bg: "bg-slate-50", 
    text: "text-slate-700", 
    border: "border-slate-200",
    icon: "💬"
  },
  Questions: { 
    bg: "bg-blue-50", 
    text: "text-blue-700", 
    border: "border-blue-200",
    icon: "❓"
  },
}

export function PostCard({ 
  post, 
  onReact, 
  onRemoveReaction, 
  onClick, 
  onComment,
  onDelete,
  onReport,
  compact = false,
  isAuthor = false
}: PostCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const menuRef = useRef<HTMLDivElement>(null)

  const totalReactions = Object.values(post.reactions).reduce((a, b) => a + b, 0)
  const categoryStyle = CATEGORY_STYLES[post.category] || CATEGORY_STYLES.General

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

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

  function handleReactionClick(reactionType: ReactionType, e: React.MouseEvent) {
    e.stopPropagation()
    if (post.user_reaction === reactionType) {
      onRemoveReaction(post.id)
    } else {
      onReact(post.id, reactionType)
    }
  }

  function handleCommentClick(e: React.MouseEvent) {
    e.stopPropagation()
    onComment?.(post.id)
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      onDelete?.(post.id)
    }
    setShowMenu(false)
  }

  function handleReportClick(e: React.MouseEvent) {
    e.stopPropagation()
    setShowReportDialog(true)
    setShowMenu(false)
  }

  function submitReport(e: React.FormEvent) {
    e.stopPropagation()
    if (reportReason.trim()) {
      onReport?.(post.id, reportReason)
      setShowReportDialog(false)
      setReportReason("")
    }
  }

  function handleShareClick(e: React.MouseEvent) {
    e.stopPropagation()
    // Copy link to clipboard
    const url = `${window.location.origin}/community/post/${post.id}`
    navigator.clipboard.writeText(url)
      .then(() => alert("Link copied to clipboard!"))
      .catch(() => alert("Failed to copy link"))
  }

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        bg-white rounded-2xl border border-[#f0e8ee] overflow-hidden
        transition-all duration-300 cursor-pointer
        ${isHovered ? "shadow-xl shadow-[#ff7eb6]/10 border-[#ff7eb6]/30 transform -translate-y-0.5" : "shadow-sm"}
      `}
    >
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className={`
                w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold
                shadow-md
                ${post.author.is_anonymous
                  ? "bg-gradient-to-br from-violet-100 via-pink-100 to-purple-100 text-violet-600"
                  : "bg-gradient-to-br from-[#ff7eb6] via-[#ff4d9f] to-[#ff1a6c] text-white"
                }
              `}
            >
              {post.author.is_anonymous ? "🎭" : post.author.display_name.charAt(0).toUpperCase()}
            </div>
            
            {/* Author Info */}
            <div>
              <p className="font-semibold text-[#3f2b4d]">
                {post.author.display_name}
                {post.author.is_anonymous && (
                  <span className="ml-2 text-xs px-2 py-0.5 bg-violet-100 text-violet-600 rounded-full font-medium">
                    Anonymous
                  </span>
                )}
              </p>
              <div className="flex items-center gap-2 text-xs text-[#9ca3af]">
                <Clock size={12} />
                <span>{formatTimeAgo(post.created_at)}</span>
                <span>•</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryStyle.bg} ${categoryStyle.text} border ${categoryStyle.border}`}>
                  {categoryStyle.icon} {post.category}
                </span>
              </div>
            </div>
          </div>

          {/* More Options */}
          <div className="relative" ref={menuRef}>
            <button 
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
            >
              <MoreHorizontal size={18} />
            </button>
            
            {/* Dropdown Menu */}
            {showMenu && (
              <div 
                className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20"
                onClick={(e) => e.stopPropagation()}
              >
                {isAuthor && (
                  <button
                    onClick={handleDeleteClick}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                  >
                    <Trash2 size={14} />
                    Delete Post
                  </button>
                )}
                <button
                  onClick={handleReportClick}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                >
                  <Flag size={14} />
                  Report Post
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-4">
        <h3 className="font-bold text-[#3f2b4d] text-lg mb-2 leading-snug hover:text-[#ff7eb6] transition-colors">
          {post.title}
        </h3>
        <p className="text-[#6b7280] text-sm leading-relaxed line-clamp-3">
          {post.content}
        </p>
      </div>

      {/* Reactions Bar */}
      <div className="px-5 py-4 border-t border-[#f0e8ee] bg-gradient-to-r from-gray-50/50 to-white">
        <div className="flex items-center justify-between">
          {/* Reaction Buttons */}
          <div className="flex items-center gap-1">
            {(Object.keys(REACTION_CONFIG) as ReactionType[]).map((reactionType) => {
              const config = REACTION_CONFIG[reactionType]
              const count = post.reactions[reactionType]
              const isActive = post.user_reaction === reactionType

              return (
                <button
                  key={reactionType}
                  onClick={(e) => handleReactionClick(reactionType, e)}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium
                    transition-all duration-200 border
                    ${isActive
                      ? `${config.bgColor} ring-1 ${config.bgColor.split(' ')[2]} shadow-sm`
                      : `bg-white text-gray-500 border-gray-200 ${config.hoverColor} hover:shadow-sm`
                    }
                    ${count > 0 || isActive ? "opacity-100" : "opacity-70 hover:opacity-100"}
                  `}
                  title={config.label}
                >
                  <span className="text-base">{config.emoji}</span>
                  {(count > 0 || isActive) && (
                    <span className={isActive ? config.color : ""}>
                      {count + (isActive && count === 0 ? 1 : 0)}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Right Side Stats */}
          <div className="flex items-center gap-4">
            {/* Total Reactions */}
            {totalReactions > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-[#6b7280]">
                <Heart size={14} className="text-rose-400 fill-rose-400" />
                <span className="font-medium">{totalReactions}</span>
              </div>
            )}
            
            {/* Comments */}
            <button
              onClick={handleCommentClick}
              className="flex items-center gap-1.5 text-sm text-[#6b7280] hover:text-[#ff7eb6] transition-colors"
            >
              <MessageCircle size={16} />
              <span className="font-medium">{post.comment_count}</span>
            </button>

            {/* Share */}
            <button 
              onClick={handleShareClick}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Report Dialog Modal */}
      {showReportDialog && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[10vh] pb-8 px-4 z-[100]"
          onClick={(e) => {
            e.stopPropagation()
            setShowReportDialog(false)
          }}
        >
          <div 
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl overflow-y-auto max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#3f2b4d] flex items-center gap-2">
                <Flag size={20} className="text-amber-500" />
                Report Post
              </h3>
              <button 
                onClick={() => setShowReportDialog(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            
            <p className="text-sm text-[#7d6b86] mb-4">
              Please tell us why you&apos;re reporting this post. Your report helps keep our community safe.
            </p>
            
            <form onSubmit={submitReport} className="space-y-4">
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="e.g., This post contains inappropriate content, spam, harassment..."
                rows={4}
                className="w-full border border-[#f0e8ee] p-3 rounded-xl focus:outline-none focus:border-[#ff7eb6] focus:ring-2 focus:ring-[#ff7eb6]/20 transition-all text-[#3f2b4d] text-sm resize-none"
                required
              />
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowReportDialog(false)}
                  className="flex-1 px-4 py-2.5 border border-[#f0e8ee] text-[#7d6b86] rounded-xl font-medium hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!reportReason.trim()}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-medium shadow-lg shadow-amber-500/20 transition-all"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
